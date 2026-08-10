# --------------------------------------------------
# 파일명   : data.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : Adult Census Income 데이터셋 다운로드 및 Pandas/Polars 이중 로딩·전처리
# 설명     : UCI Adult Census Income 데이터를 내려받아 캐시하고, 동일 데이터를
#            Pandas와 Polars 양쪽으로 로딩해 행/열 수와 로딩 시간을 비교한다.
#            이후 중복 행 제거와 결측치 처리를 수행하고 그 결과를 요약 객체로 반환한다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성 (day2 종합실습 구현을 팀 협업용으로 포팅,
#            스키마 상수는 config.py로 이동)
# --------------------------------------------------

from __future__ import annotations

import logging
import time
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import TypeVar

import pandas as pd
import polars as pl

from config import (
    ADULT_DATA_URL,
    CATEGORICAL_COLUMNS,
    COLUMN_NAMES,
    MISSING_CATEGORY,
    NA_VALUES,
    NUMERIC_COLUMNS,
    RAW_DATA_PATH,
)

# 로딩 함수가 반환하는 데이터프레임 타입(pd.DataFrame 또는 pl.DataFrame)
T = TypeVar("T")

logger = logging.getLogger(__name__)


# --------------------------------------------------
# 클래스명 : LoaderBenchmark
# 목적     : 한 라이브러리(Pandas/Polars)의 로딩 결과와 소요 시간을 담는 값 객체
# --------------------------------------------------
@dataclass
class LoaderBenchmark:
    library: str
    rows: int
    columns: int
    elapsed_sec: float


# --------------------------------------------------
# 클래스명 : LoadComparison
# 목적     : Pandas와 Polars 로딩 결과 비교 요약을 담는 값 객체
# --------------------------------------------------
@dataclass
class LoadComparison:
    pandas: LoaderBenchmark
    polars: LoaderBenchmark
    shape_match: bool
    repeat: int = 1

    # ----------------------------------------------
    # 함수명 : speed_ratio
    # 목적   : 느린 쪽 대비 빠른 쪽이 몇 배 빠른지 계산 (항상 1 이상)
    # 매개변수: 없음
    # 반환값 : float - (느린 쪽 시간 / 빠른 쪽 시간), 0으로 나눌 경우 0.0
    # ----------------------------------------------
    @property
    def speed_ratio(self) -> float:
        slower = max(self.pandas.elapsed_sec, self.polars.elapsed_sec)
        faster = min(self.pandas.elapsed_sec, self.polars.elapsed_sec)
        return slower / faster if faster else 0.0

    # ----------------------------------------------
    # 함수명 : faster_library
    # 목적   : 두 라이브러리 중 더 빠르게 로딩한 쪽의 이름 반환
    # 매개변수: 없음
    # 반환값 : str - 'Pandas' 또는 'Polars'
    # ----------------------------------------------
    @property
    def faster_library(self) -> str:
        return (
            self.polars.library
            if self.polars.elapsed_sec <= self.pandas.elapsed_sec
            else self.pandas.library
        )


# --------------------------------------------------
# 클래스명 : CleaningSummary
# 목적     : 결측치·중복 처리 전후 변화를 담아 EDA 출력과 리포트 생성에 재사용하는 값 객체
# --------------------------------------------------
@dataclass
class CleaningSummary:
    rows_before: int
    rows_after: int
    duplicates_removed: int
    # 결측이 하나라도 있는 '행'의 수 (결측 '셀' 합계와 구분됨 — 한 행에 여러 결측이 있을 수 있다)
    rows_with_missing: int = 0
    missing_before: dict[str, int] = field(default_factory=dict)
    missing_after: dict[str, int] = field(default_factory=dict)

    # ----------------------------------------------
    # 함수명 : missing_row_ratio
    # 목적   : 결측이 포함된 행이 전체에서 차지하는 비율(%) 계산
    # 매개변수: 없음
    # 반환값 : float - 결측 행 비율(%)
    # ----------------------------------------------
    @property
    def missing_row_ratio(self) -> float:
        return self.rows_with_missing / self.rows_before * 100 if self.rows_before else 0.0

    # ----------------------------------------------
    # 함수명 : total_missing_before
    # 목적   : 처리 전 전체 결측 셀 개수 합계 계산
    # 매개변수: 없음
    # 반환값 : int - 결측 셀 총합
    # ----------------------------------------------
    @property
    def total_missing_before(self) -> int:
        return sum(self.missing_before.values())


# --------------------------------------------------
# 함수명 : download_dataset
# 목적   : Adult Census 원본 데이터를 URL에서 내려받아 로컬에 캐시
# 매개변수: url(str) - 다운로드 URL, dest(Path) - 저장 경로, force(bool) - 캐시 무시 여부
# 반환값 : Path - 로컬에 저장된 데이터 파일 경로
# 예외   : URLError/HTTPError(네트워크 실패), OSError(파일 쓰기 실패) 시 로깅 후 재발생
# --------------------------------------------------
def download_dataset(
    url: str = ADULT_DATA_URL,
    dest: Path = RAW_DATA_PATH,
    force: bool = False,
) -> Path:
    if dest.exists() and not force:
        logger.info("캐시된 데이터 사용: %s (%.1f MB)", dest, dest.stat().st_size / 1024**2)
        return dest

    logger.info("데이터 다운로드 시작: %s", url)
    try:
        dest.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=60) as response:
            payload = response.read()
        dest.write_bytes(payload)
    except urllib.error.HTTPError as exc:
        logger.error("다운로드 실패(HTTP %s): %s", exc.code, url)
        raise
    except urllib.error.URLError as exc:
        logger.error("다운로드 실패(네트워크 오류): %s - %s", url, exc.reason)
        raise
    except OSError as exc:
        logger.error("데이터 파일 저장 실패: %s - %s", dest, exc)
        raise

    logger.info("다운로드 완료: %s (%.1f MB)", dest, dest.stat().st_size / 1024**2)
    return dest


# --------------------------------------------------
# 함수명 : load_with_pandas
# 목적   : Pandas로 Adult 데이터를 로딩 (헤더 없음 + 결측 표기 " ?" 처리)
# 매개변수: path(Path) - 원본 CSV 경로
# 반환값 : pd.DataFrame - 컬럼명이 부여된 데이터프레임
# 예외   : FileNotFoundError(파일 없음), pd.errors.ParserError(파싱 실패) 시 로깅 후 재발생
# --------------------------------------------------
def load_with_pandas(path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    try:
        return pd.read_csv(
            path,
            header=None,
            names=COLUMN_NAMES,
            na_values=NA_VALUES,
            skipinitialspace=True,
        )
    except FileNotFoundError:
        logger.error("원본 데이터 파일이 없습니다: %s", path)
        raise
    except pd.errors.ParserError as exc:
        logger.error("Pandas 파싱 실패: %s - %s", path, exc)
        raise


# --------------------------------------------------
# 함수명 : load_with_polars
# 목적   : Polars로 동일 데이터를 로딩해 Pandas 결과와 비교 가능하도록 정규화
# 매개변수: path(Path) - 원본 CSV 경로
# 반환값 : pl.DataFrame - 컬럼명이 부여되고 문자열 앞뒤 공백이 제거된 데이터프레임
# 예외   : FileNotFoundError(파일 없음), pl.exceptions.ComputeError(파싱 실패) 시 로깅 후 재발생
# --------------------------------------------------
def load_with_polars(path: Path = RAW_DATA_PATH) -> pl.DataFrame:
    try:
        frame = pl.read_csv(
            path,
            has_header=False,
            new_columns=COLUMN_NAMES,
            null_values=NA_VALUES,
        )
    except FileNotFoundError:
        logger.error("원본 데이터 파일이 없습니다: %s", path)
        raise
    except pl.exceptions.ComputeError as exc:
        logger.error("Polars 파싱 실패: %s - %s", path, exc)
        raise

    # Pandas와 결과를 맞추기 위한 정규화 3단계
    #  1) 원본 파일 끝의 빈 줄을 Polars는 전부 null인 행으로 읽으므로 제거 (Pandas는 자동 무시)
    #  2) Polars에는 skipinitialspace 옵션이 없으므로 문자열 컬럼의 앞뒤 공백을 일괄 제거
    #  3) 앞 공백 때문에 문자열로 추론된 수치형 컬럼을 정수로 캐스팅
    return (
        frame.filter(~pl.all_horizontal(pl.all().is_null()))
        .with_columns(pl.col(pl.String).str.strip_chars())
        .with_columns(pl.col(NUMERIC_COLUMNS).cast(pl.Int64))
    )


# --------------------------------------------------
# 함수명 : measure_load_time
# 목적   : 로딩 함수를 여러 번 실행해 가장 빠른 소요 시간을 측정
# 매개변수: loader(Callable) - 로딩 함수, path(Path) - 원본 CSV 경로, repeat(int) - 반복 횟수
# 반환값 : tuple[object, float] - 마지막 로딩 결과와 최소 소요 시간(초)
# 비고   : 첫 호출에는 라이브러리 런타임 초기화 비용이 섞여 측정값이 크게 흔들린다.
#          두 라이브러리에 동일한 반복 횟수를 적용하고 최솟값을 취해 공정하게 비교한다.
# --------------------------------------------------
def measure_load_time(
    loader: Callable[[Path], T],
    path: Path,
    repeat: int = 3,
) -> tuple[T, float]:
    elapsed_times: list[float] = []
    frame: T | None = None
    for _ in range(repeat):
        started = time.perf_counter()
        frame = loader(path)
        elapsed_times.append(time.perf_counter() - started)

    # repeat >= 1이므로 frame은 반드시 할당된다.
    assert frame is not None
    return frame, min(elapsed_times)


# --------------------------------------------------
# 함수명 : compare_loaders
# 목적   : 동일 파일을 Pandas와 Polars로 각각 로딩해 행/열 수와 소요 시간을 비교
# 매개변수: path(Path) - 원본 CSV 경로, repeat(int) - 각 라이브러리의 측정 반복 횟수
# 반환값 : tuple[pd.DataFrame, LoadComparison] - Pandas 데이터프레임과 비교 요약
# --------------------------------------------------
def compare_loaders(
    path: Path = RAW_DATA_PATH,
    repeat: int = 3,
) -> tuple[pd.DataFrame, LoadComparison]:
    pandas_df, pandas_elapsed = measure_load_time(load_with_pandas, path, repeat)
    polars_df, polars_elapsed = measure_load_time(load_with_polars, path, repeat)

    comparison = LoadComparison(
        pandas=LoaderBenchmark("Pandas", pandas_df.shape[0], pandas_df.shape[1], pandas_elapsed),
        polars=LoaderBenchmark("Polars", polars_df.height, polars_df.width, polars_elapsed),
        shape_match=(pandas_df.shape == (polars_df.height, polars_df.width)),
        repeat=repeat,
    )
    logger.info(
        "로딩 비교(%d회 중 최소) - Pandas %.4fs / Polars %.4fs (shape 일치: %s)",
        repeat, pandas_elapsed, polars_elapsed, comparison.shape_match,
    )
    return pandas_df, comparison


# --------------------------------------------------
# 함수명 : clean_dataframe
# 목적   : 중복 행 제거 및 범주형 결측치 대체를 수행하고 처리 전후 요약을 생성
# 매개변수: df(pd.DataFrame) - 원본 데이터프레임, missing_label(str) - 결측 대체 라벨
# 반환값 : tuple[pd.DataFrame, CleaningSummary] - 정제된 데이터프레임과 처리 요약
# 비고   : 결측이 있는 세 컬럼(workclass/occupation/native-country)은 전체의 약 7%라
#          행 삭제 시 정보 손실이 크므로 'Unknown' 범주로 대체한다.
# --------------------------------------------------
def clean_dataframe(
    df: pd.DataFrame,
    missing_label: str = MISSING_CATEGORY,
) -> tuple[pd.DataFrame, CleaningSummary]:
    rows_before = len(df)
    missing_before = {str(col): int(cnt) for col, cnt in df.isnull().sum().items() if cnt > 0}

    cleaned = df.drop_duplicates().reset_index(drop=True)
    duplicates_removed = rows_before - len(cleaned)

    # 결측이 존재하는 범주형 컬럼만 골라 한 번에 대체한다.
    fill_targets = [col for col in CATEGORICAL_COLUMNS if col in missing_before]
    if fill_targets:
        cleaned[fill_targets] = cleaned[fill_targets].fillna(missing_label)

    summary = CleaningSummary(
        rows_before=rows_before,
        rows_after=len(cleaned),
        duplicates_removed=duplicates_removed,
        rows_with_missing=int(df.isnull().any(axis=1).sum()),
        missing_before=missing_before,
        missing_after={
            str(col): int(cnt) for col, cnt in cleaned.isnull().sum().items() if cnt > 0
        },
    )
    logger.info(
        "정제 완료 - %d행 → %d행 (중복 %d건 제거, 결측 %d셀 '%s'로 대체)",
        rows_before, len(cleaned), duplicates_removed, summary.total_missing_before, missing_label,
    )
    return cleaned, summary

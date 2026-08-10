# --------------------------------------------------
# 파일명   : eda.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : Adult Census 데이터의 기술통계 및 변수 간 상관관계 분석
# 설명     : 수치형 변수의 중심경향(평균·중앙값)·산포도(표준편차·IQR)·분위수와
#            분포 모양(왜도·첨도)을 산출하고, 상관행렬에서 상관이 강한 변수쌍을
#            추출한다. 타깃(income) 그룹별 평균 비교표도 함께 생성한다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성 (day2 종합실습 구현을 팀 협업용으로 포팅,
#            스키마 상수는 config.py로 이동)
# --------------------------------------------------

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import cast

import pandas as pd

from config import CATEGORICAL_COLUMNS, NUMERIC_COLUMNS, POSITIVE_LABEL, TARGET_COLUMN

logger = logging.getLogger(__name__)


# --------------------------------------------------
# 함수명 : to_float
# 목적   : pandas 집계 결과를 단일 float으로 확정 (축 인자 유무에 따라 Series | float으로
#          추론되는 반환 타입을 좁혀 타입 검사기 경고를 제거)
# 매개변수: value(object) - Series.mean()/std()/skew() 등 집계 결과
# 반환값 : float - 스칼라로 변환된 값
# --------------------------------------------------
def to_float(value: object) -> float:
    return float(cast(float, value))


# --------------------------------------------------
# 클래스명 : ColumnStats
# 목적     : 수치형 컬럼 하나의 기술통계량을 담는 값 객체
# --------------------------------------------------
@dataclass
class ColumnStats:
    column: str
    count: int
    mean: float
    std: float
    minimum: float
    q1: float
    median: float
    q3: float
    maximum: float
    skewness: float
    kurtosis: float

    # ----------------------------------------------
    # 함수명 : iqr
    # 목적   : 사분위 범위(Q3 - Q1) 계산 — 산포도 지표
    # 매개변수: 없음
    # 반환값 : float - 사분위 범위
    # ----------------------------------------------
    @property
    def iqr(self) -> float:
        return self.q3 - self.q1


# --------------------------------------------------
# 클래스명 : CorrelationPair
# 목적     : 두 변수 간 상관계수를 담는 값 객체
# --------------------------------------------------
@dataclass
class CorrelationPair:
    left: str
    right: str
    coefficient: float

    # ----------------------------------------------
    # 함수명 : strength
    # 목적   : 상관계수 절댓값을 기준으로 관계 강도를 한국어로 해석
    # 매개변수: 없음
    # 반환값 : str - '강한 양의 상관' 등 해석 문자열
    # ----------------------------------------------
    @property
    def strength(self) -> str:
        magnitude = abs(self.coefficient)
        level = "강한" if magnitude >= 0.7 else "뚜렷한" if magnitude >= 0.4 else "약한"
        return f"{level} {'양' if self.coefficient >= 0 else '음'}의 상관"


# --------------------------------------------------
# 클래스명 : OutlierImpact
# 목적     : 한 수치형 컬럼에 IQR 이상치 제거를 적용했을 때의 영향을 담는 값 객체
# 비고     : 이상치를 실제로 제거하기 위한 것이 아니라, **제거하면 안 되는 근거**를
#            수치로 남기기 위한 진단용이다.
# --------------------------------------------------
@dataclass
class OutlierImpact:
    column: str
    q1: float
    q3: float
    lower_bound: float
    upper_bound: float
    outlier_rows: int
    total_rows: int
    outlier_positive_rate: float
    overall_positive_rate: float

    # ----------------------------------------------
    # 함수명 : iqr
    # 목적   : 사분위 범위 계산
    # 매개변수: 없음
    # 반환값 : float - Q3 - Q1
    # ----------------------------------------------
    @property
    def iqr(self) -> float:
        return self.q3 - self.q1

    # ----------------------------------------------
    # 함수명 : outlier_ratio
    # 목적   : 제거 대상이 전체에서 차지하는 비율(%) 계산
    # 매개변수: 없음
    # 반환값 : float - 제거 비율(%)
    # ----------------------------------------------
    @property
    def outlier_ratio(self) -> float:
        return self.outlier_rows / self.total_rows * 100 if self.total_rows else 0.0

    # ----------------------------------------------
    # 함수명 : signal_multiple
    # 목적   : 제거 대상의 고소득 비율이 전체 평균의 몇 배인지 계산
    # 매개변수: 없음
    # 반환값 : float - 배수 (1보다 크면 제거 시 신호가 손실됨)
    # ----------------------------------------------
    @property
    def signal_multiple(self) -> float:
        return (
            self.outlier_positive_rate / self.overall_positive_rate
            if self.overall_positive_rate
            else 0.0
        )

    # ----------------------------------------------
    # 함수명 : verdict
    # 목적   : 이 컬럼에 IQR 제거를 적용하면 안 되는 이유를 한국어로 판정
    # 매개변수: 없음
    # 반환값 : str - 판정 사유
    # ----------------------------------------------
    @property
    def verdict(self) -> str:
        if self.iqr == 0:
            return "IQR=0 (분포가 한 값에 몰림) — 0이 아닌 모든 값이 이상치로 분류됨"
        if self.outlier_ratio >= 10:
            return f"전체의 {self.outlier_ratio:.1f}%가 제거 대상 — 손실 과다"
        return f"제거 비율 {self.outlier_ratio:.1f}%로 영향 제한적"


# --------------------------------------------------
# 클래스명 : EdaResult
# 목적     : EDA 산출물(기술통계·상관행렬·타깃 분포·그룹별 평균)을 한 번에 전달하는 값 객체
# --------------------------------------------------
@dataclass
class EdaResult:
    stats: list[ColumnStats]
    correlation: pd.DataFrame
    top_pairs: list[CorrelationPair]
    target_distribution: dict[str, int]
    group_means: pd.DataFrame
    outlier_impacts: list[OutlierImpact]

    # ----------------------------------------------
    # 함수명 : stats_frame
    # 목적   : 기술통계 리스트를 출력·리포트용 데이터프레임으로 변환
    # 매개변수: 없음
    # 반환값 : pd.DataFrame - 컬럼별 기술통계량 표
    # ----------------------------------------------
    def stats_frame(self) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "변수": s.column, "건수": s.count, "평균": s.mean, "표준편차": s.std,
                    "최솟값": s.minimum, "Q1": s.q1, "중앙값": s.median, "Q3": s.q3,
                    "최댓값": s.maximum, "IQR": s.iqr, "왜도": s.skewness, "첨도": s.kurtosis,
                }
                for s in self.stats
            ]
        ).round(3)


# --------------------------------------------------
# 함수명 : describe_numeric
# 목적   : 수치형 컬럼별 기술통계량(평균·표준편차·분위수·왜도·첨도) 산출
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, columns(list[str]) - 대상 수치형 컬럼
# 반환값 : list[ColumnStats] - 컬럼별 기술통계 값 객체 리스트
# --------------------------------------------------
def describe_numeric(
    df: pd.DataFrame,
    columns: list[str] | None = None,
) -> list[ColumnStats]:
    # ----------------------------------------------
    # 함수명 : build_stats
    # 목적   : 수치형 컬럼 하나에 대한 기술통계량 계산 (컴프리헨션 내 중복 제거용 헬퍼)
    # 매개변수: col(str) - 대상 컬럼명
    # 반환값 : ColumnStats - 해당 컬럼의 기술통계 값 객체
    # ----------------------------------------------
    def build_stats(col: str) -> ColumnStats:
        # pd.Series로 명시적으로 감싸 타입 검사기가 DataFrame 반환 가능성을 배제하도록 한다.
        series = pd.Series(df[col])
        q1, median, q3 = (float(v) for v in series.quantile([0.25, 0.50, 0.75]))
        return ColumnStats(
            column=col,
            count=int(series.count()),
            mean=to_float(series.mean()),
            std=to_float(series.std()),
            minimum=to_float(series.min()),
            q1=q1,
            median=median,
            q3=q3,
            maximum=to_float(series.max()),
            skewness=to_float(series.skew()),
            kurtosis=to_float(series.kurt()),
        )

    return [build_stats(col) for col in (columns or NUMERIC_COLUMNS)]


# --------------------------------------------------
# 함수명 : correlation_matrix
# 목적   : 수치형 변수 간 피어슨 상관행렬 계산
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, columns(list[str]) - 대상 수치형 컬럼
# 반환값 : pd.DataFrame - 상관행렬 (-1 ~ +1)
# --------------------------------------------------
def correlation_matrix(
    df: pd.DataFrame,
    columns: list[str] | None = None,
) -> pd.DataFrame:
    return pd.DataFrame(df[columns or NUMERIC_COLUMNS]).corr()


# --------------------------------------------------
# 함수명 : top_correlations
# 목적   : 상관행렬에서 자기상관·중복쌍을 제외하고 상관이 강한 변수쌍 상위 N개 추출
# 매개변수: corr(pd.DataFrame) - 상관행렬, top_n(int) - 추출할 변수쌍 개수
# 반환값 : list[CorrelationPair] - 상관계수 절댓값 내림차순 변수쌍 리스트
# --------------------------------------------------
def top_correlations(corr: pd.DataFrame, top_n: int = 5) -> list[CorrelationPair]:
    # 상삼각 영역만 순회해 (A,B)와 (B,A) 중복 및 대각선(자기상관)을 제거한다.
    pairs = [
        CorrelationPair(str(corr.columns[i]), str(corr.columns[j]), to_float(corr.iat[i, j]))
        for i in range(len(corr.columns))
        for j in range(i + 1, len(corr.columns))
    ]
    return sorted(pairs, key=lambda p: abs(p.coefficient), reverse=True)[:top_n]


# --------------------------------------------------
# 함수명 : assess_iqr_impact
# 목적   : 수치형 컬럼에 IQR 이상치 제거를 적용했을 때 무엇을 잃는지 진단
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, target(str) - 타깃 컬럼,
#          positive_label(str) - 양성 라벨, columns(list[str]) - 진단 대상 수치형 컬럼
# 반환값 : list[OutlierImpact] - 컬럼별 제거 영향 진단 결과
# 비고   : Practice 3에서 쓴 IQR 제거를 이 데이터에 그대로 적용하면 안 되는 이유를
#          수치로 남기기 위한 함수다. 실제로 행을 제거하지는 않는다.
# --------------------------------------------------
def assess_iqr_impact(
    df: pd.DataFrame,
    target: str = TARGET_COLUMN,
    positive_label: str = POSITIVE_LABEL,
    columns: list[str] | None = None,
) -> list[OutlierImpact]:
    is_positive = df[target] == positive_label
    overall_rate = float(is_positive.mean()) * 100

    # ----------------------------------------------
    # 함수명 : assess
    # 목적   : 컬럼 하나에 대한 IQR 제거 영향 계산 (컴프리헨션 내 중복 제거용 헬퍼)
    # 매개변수: col(str) - 대상 컬럼명
    # 반환값 : OutlierImpact - 해당 컬럼의 진단 결과
    # ----------------------------------------------
    def assess(col: str) -> OutlierImpact:
        series = pd.Series(df[col])
        q1, q3 = (float(v) for v in series.quantile([0.25, 0.75]))
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        is_outlier = (series < lower) | (series > upper)
        outlier_count = int(is_outlier.sum())
        return OutlierImpact(
            column=col,
            q1=q1,
            q3=q3,
            lower_bound=lower,
            upper_bound=upper,
            outlier_rows=outlier_count,
            total_rows=len(df),
            # 제거 대상 집단의 고소득 비율 — 전체 평균보다 높으면 신호를 버리는 것이다.
            outlier_positive_rate=(
                float(is_positive[is_outlier].mean()) * 100 if outlier_count else 0.0
            ),
            overall_positive_rate=overall_rate,
        )

    return [assess(col) for col in (columns or NUMERIC_COLUMNS)]


# --------------------------------------------------
# 함수명 : summarize_by_target
# 목적   : 타깃(income) 그룹별 수치형 변수 평균을 비교표로 생성
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, target(str) - 타깃 컬럼명
# 반환값 : pd.DataFrame - 그룹별 평균과 그룹 간 차이(diff)를 포함한 표
# --------------------------------------------------
def summarize_by_target(df: pd.DataFrame, target: str = TARGET_COLUMN) -> pd.DataFrame:
    grouped = pd.DataFrame(df.groupby(target)[NUMERIC_COLUMNS].mean()).T.round(2)
    grouped["차이"] = (grouped.iloc[:, 1] - grouped.iloc[:, 0]).round(2)
    return grouped


# --------------------------------------------------
# 함수명 : run_eda
# 목적   : 기술통계·상관분석·타깃 분포·그룹 비교를 한 번에 수행해 EDA 결과 묶음 생성
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, target(str) - 타깃 컬럼명
# 반환값 : EdaResult - EDA 산출물 묶음
# 예외   : 필수 컬럼이 없으면 KeyError를 로깅 후 재발생
# --------------------------------------------------
def run_eda(df: pd.DataFrame, target: str = TARGET_COLUMN) -> EdaResult:
    missing_columns = [c for c in [*NUMERIC_COLUMNS, *CATEGORICAL_COLUMNS, target] if c not in df]
    if missing_columns:
        logger.error("EDA에 필요한 컬럼이 없습니다: %s", missing_columns)
        raise KeyError(f"필수 컬럼 누락: {missing_columns}")

    correlation = correlation_matrix(df)
    result = EdaResult(
        stats=describe_numeric(df),
        correlation=correlation,
        top_pairs=top_correlations(correlation),
        target_distribution={str(k): int(v) for k, v in df[target].value_counts().items()},
        group_means=summarize_by_target(df, target),
        outlier_impacts=assess_iqr_impact(df, target),
    )
    logger.info(
        "EDA 완료 - 수치형 %d개 기술통계, 최고 상관쌍 %s↔%s (r=%.3f)",
        len(result.stats), result.top_pairs[0].left, result.top_pairs[0].right,
        result.top_pairs[0].coefficient,
    )
    return result

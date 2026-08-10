# --------------------------------------------------
# 파일명   : stats_test.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : 소득 그룹 간 차이에 대한 통계 검정(t-test · 카이제곱) 수행
# 설명     : 소득 그룹별 수치형 변수 평균 차이를 Welch t-test로 검정하고,
#            범주형 변수와 소득의 독립성을 카이제곱 검정으로 확인한 뒤
#            p-value 해석 문장까지 포함한 값 객체로 반환한다.
# 변경내역 : 2026-08-07 윤동현 - 인터페이스(값 객체·시그니처) 골격 작성
#            2026-08-07 윤동현 - Welch t-test·카이제곱 검정 구현
# --------------------------------------------------

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import cast

import pandas as pd
from scipy import stats

from config import (
    ALPHA,
    NEGATIVE_LABEL,
    NUMERIC_COLUMNS,
    POSITIVE_LABEL,
    TARGET_COLUMN,
)

logger = logging.getLogger(__name__)

# 소득과의 독립성을 검정할 범주형 변수. 2x2 분할표라 자유도 해석이 단순하고,
# ml_pipeline의 성별 공정성 점검과 같은 축을 보게 되어 리포트에서 이야기가 이어진다.
CHI_SQUARE_COLUMN = "sex"


# --------------------------------------------------
# 클래스명 : TTestResult
# 목적     : 수치형 변수 하나에 대한 두 집단 평균 비교 결과를 담는 값 객체
# --------------------------------------------------
@dataclass
class TTestResult:
    variable: str
    group_a: str
    group_b: str
    mean_a: float
    mean_b: float
    size_a: int
    size_b: int
    statistic: float
    p_value: float
    significant: bool
    interpretation: str


# --------------------------------------------------
# 클래스명 : ChiSquareResult
# 목적     : 두 범주형 변수의 독립성 검정 결과를 담는 값 객체
# --------------------------------------------------
@dataclass
class ChiSquareResult:
    left: str
    right: str
    chi2: float
    dof: int
    p_value: float
    significant: bool
    interpretation: str


# --------------------------------------------------
# 클래스명 : StatsResults
# 목적     : 통계 검정 단계의 전체 결과를 담는 값 객체
# --------------------------------------------------
@dataclass
class StatsResults:
    ttests: list[TTestResult] = field(default_factory=list)
    chi_square: ChiSquareResult | None = None


# --------------------------------------------------
# 함수명 : welch_ttest
# 목적   : 수치형 변수 하나에 대해 소득 두 집단의 평균 차이를 Welch t-test로 검정
# 매개변수: column(str) - 검정 대상 수치형 컬럼, low(pd.Series) - 저소득 집단 값,
#           high(pd.Series) - 고소득 집단 값
# 반환값 : TTestResult - 검정 통계량·p-value·해석을 담은 값 객체
# --------------------------------------------------
def welch_ttest(column: str, low: pd.Series, high: pd.Series) -> TTestResult:
    # 두 집단은 크기도 분산도 다르므로 등분산을 가정하지 않는다 (Welch).
    # scipy의 결과 객체는 원소 타입이 느슨하게 추론되어 cast로 좁힌다.
    statistic, p_value = cast(
        tuple[float, float], stats.ttest_ind(high, low, equal_var=False)
    )
    significant = bool(p_value < ALPHA)
    mean_high, mean_low = float(high.mean()), float(low.mean())
    direction = "높다" if mean_high > mean_low else "낮다"
    gap = abs(mean_high - mean_low)
    interpretation = (
        f"p={p_value:.3e} < α={ALPHA} 이므로 두 소득 집단의 평균 {column}에는 차이가 있다. "
        f"{POSITIVE_LABEL} 집단이 {gap:.2f}만큼 {direction} — 통계적으로 유의하다."
        if significant
        else (
            f"p={p_value:.3e} ≥ α={ALPHA} 이므로 두 소득 집단의 평균 {column} 차이는 "
            f"우연으로 설명 가능하다 — 통계적으로 유의하지 않다."
        )
    )
    return TTestResult(
        variable=column,
        group_a=NEGATIVE_LABEL,
        group_b=POSITIVE_LABEL,
        mean_a=round(mean_low, 4),
        mean_b=round(mean_high, 4),
        size_a=int(low.size),
        size_b=int(high.size),
        statistic=float(statistic),
        p_value=float(p_value),
        significant=significant,
        interpretation=interpretation,
    )


# --------------------------------------------------
# 함수명 : chi_square_test
# 목적   : 범주형 변수와 소득의 독립성을 카이제곱 검정으로 확인
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, column(str) - 검정 대상 범주형 컬럼,
#           target(str) - 타깃 컬럼명
# 반환값 : ChiSquareResult - 검정 결과 값 객체
# 예외   : 분할표가 2x2 미만이면 ValueError를 로깅 후 발생
# --------------------------------------------------
def chi_square_test(
    df: pd.DataFrame,
    column: str = CHI_SQUARE_COLUMN,
    target: str = TARGET_COLUMN,
) -> ChiSquareResult:
    table = pd.crosstab(df[column], df[target])
    if min(table.shape) < 2:
        logger.error("분할표가 %s 이라 카이제곱 검정을 수행할 수 없습니다: %s", table.shape, column)
        raise ValueError(f"카이제곱 검정 불가 — {column}×{target} 분할표 크기 {table.shape}")

    chi2, p_value, dof, _ = cast(
        tuple[float, float, int, object], stats.chi2_contingency(table)
    )
    significant = bool(p_value < ALPHA)
    interpretation = (
        f"p={p_value:.3e} < α={ALPHA} 이므로 독립성 귀무가설을 기각한다. "
        f"{column}와 {target}는 서로 무관하지 않다 — 통계적으로 유의하다."
        if significant
        else (
            f"p={p_value:.3e} ≥ α={ALPHA} 이므로 독립성 귀무가설을 기각하지 못한다. "
            f"{column}와 {target}의 연관성은 통계적으로 유의하지 않다."
        )
    )
    return ChiSquareResult(
        left=column,
        right=target,
        chi2=float(chi2),
        dof=int(dof),
        p_value=float(p_value),
        significant=significant,
        interpretation=interpretation,
    )


# --------------------------------------------------
# 함수명 : run_statistical_tests
# 목적   : t-test와 카이제곱 검정을 수행하고 해석까지 담아 반환
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임
# 반환값 : StatsResults - 검정 결과 값 객체
# 예외   : 필수 컬럼 누락 시 KeyError, 한쪽 소득 집단이 비었으면 ValueError
# --------------------------------------------------
def run_statistical_tests(df: pd.DataFrame) -> StatsResults:
    required = [*NUMERIC_COLUMNS, CHI_SQUARE_COLUMN, TARGET_COLUMN]
    missing_columns = [c for c in required if c not in df]
    if missing_columns:
        logger.error("통계 검정에 필요한 컬럼이 없습니다: %s", missing_columns)
        raise KeyError(f"필수 컬럼 누락: {missing_columns}")

    high_mask = df[TARGET_COLUMN] == POSITIVE_LABEL
    low_mask = df[TARGET_COLUMN] == NEGATIVE_LABEL
    if not high_mask.any() or not low_mask.any():
        logger.error(
            "소득 집단 한쪽이 비어 있습니다 (%s=%d, %s=%d)",
            POSITIVE_LABEL, int(high_mask.sum()), NEGATIVE_LABEL, int(low_mask.sum()),
        )
        raise ValueError("t-test 불가 — 두 소득 집단 중 한쪽에 표본이 없습니다")

    chi_square = chi_square_test(df)
    results = StatsResults(
        ttests=[
            welch_ttest(col, df.loc[low_mask, col], df.loc[high_mask, col])
            for col in NUMERIC_COLUMNS
        ],
        chi_square=chi_square,
    )
    logger.info(
        "통계 검정 완료 - t-test %d건 중 %d건 유의, 카이제곱(%s×%s) p=%.3e",
        len(results.ttests),
        sum(t.significant for t in results.ttests),
        CHI_SQUARE_COLUMN, TARGET_COLUMN,
        chi_square.p_value,
    )
    return results

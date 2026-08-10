# --------------------------------------------------
# 파일명   : main.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : End2End 데이터 분석 파이프라인 진입점
# 설명     : 데이터 다운로드 → 로딩 비교 → 결측치·중복 처리 → EDA → 시각화 →
#            통계 검정 → ML Pipeline 학습·저장 → report.md 생성까지 전체 흐름을
#            순서대로 실행하고 각 단계 결과를 콘솔에 출력한다.
# 변경내역 : 2026-08-07 윤동현 - 파이프라인 골격 작성
#            2026-08-07 윤동현 - 단계별 실행 결과 콘솔 출력 추가
# --------------------------------------------------

from __future__ import annotations

import logging
import sys

import pandas as pd

from data import clean_dataframe, compare_loaders, download_dataset
from eda import run_eda
from ml_pipeline import train_and_evaluate
from report import generate_report
from stats_test import run_statistical_tests
from viz import create_visualizations

logger = logging.getLogger(__name__)


# --------------------------------------------------
# 함수명 : configure_logging
# 목적   : 파이프라인 전체에서 사용할 로깅 포맷·레벨 설정
# 매개변수: level(int) - 로깅 레벨 (기본 INFO)
# 반환값 : None
# --------------------------------------------------
def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%H:%M:%S",
    )


# --------------------------------------------------
# 함수명 : print_section
# 목적   : 단계별 구분선을 출력해 실행 결과 캡처 시 가독성 확보
# 매개변수: title(str) - 단계 제목
# 반환값 : None
# --------------------------------------------------
def print_section(title: str) -> None:
    print(f"\n{'=' * 70}\n  {title}\n{'=' * 70}")


# --------------------------------------------------
# 함수명 : run_pipeline
# 목적   : 데이터 수집부터 리포트 생성까지 분석 파이프라인 전 단계를 순서대로 실행
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def run_pipeline() -> None:
    print_section("1. 데이터 준비 - Pandas vs Polars 로딩 비교")
    raw_path = download_dataset()
    raw_df, comparison = compare_loaders(raw_path)
    for benchmark in (comparison.pandas, comparison.polars):
        print(
            f"  {benchmark.library:<7} {benchmark.rows:,}행 x {benchmark.columns}열 "
            f"— {benchmark.elapsed_sec:.4f}초 (평균 {comparison.repeat}회)"
        )
    print(f"  결과 형태 일치: {'예' if comparison.shape_match else '아니오'}")
    print(f"  더 빠른 쪽: {comparison.faster_library} ({comparison.speed_ratio:.2f}배)")

    print_section("2. 결측치 · 중복 처리")
    df, cleaning = clean_dataframe(raw_df)
    print(f"  {cleaning.rows_before:,}행 → {cleaning.rows_after:,}행")
    print(f"  중복 제거: {cleaning.duplicates_removed:,}행")
    print(
        f"  결측 포함 행: {cleaning.rows_with_missing:,}행 "
        f"({cleaning.missing_row_ratio:.2f}%) — 'Unknown' 범주로 대체"
    )
    print(f"  처리 전 컬럼별 결측: {cleaning.missing_before}")

    print_section("3. 기술통계 · 상관분석")
    eda_result = run_eda(df)
    print(eda_result.stats_frame().to_string(index=False))
    print("\n  [상관계수 행렬]")
    print(eda_result.correlation.round(3).to_string())
    print("\n  [상관이 큰 변수쌍]")
    for pair in eda_result.top_pairs:
        print(f"  - {pair.left} ↔ {pair.right}: r={pair.coefficient:+.3f} ({pair.strength})")
    print(f"\n  [타깃 분포] {eda_result.target_distribution}")
    print("\n  [소득 그룹별 평균]")
    print(eda_result.group_means.to_string())

    print_section("4. 시각화 (Seaborn 정적 + Plotly 인터랙티브)")
    charts = create_visualizations(df)
    print(f"  Seaborn 정적 차트   : {charts.seaborn_png}")
    print(f"  Plotly 인터랙티브   : {charts.plotly_html}")

    print_section("5. 통계 검정 (t-test · 카이제곱)")
    stats_results = run_statistical_tests(df)
    for test in stats_results.ttests:
        print(
            f"  [{test.variable}] {test.group_a} 평균={test.mean_a:.2f} / "
            f"{test.group_b} 평균={test.mean_b:.2f} | t={test.statistic:.3f}, "
            f"p={test.p_value:.3e}"
        )
        print(f"      → {test.interpretation}")
    if stats_results.chi_square is not None:
        chi = stats_results.chi_square
        print(
            f"\n  [카이제곱 {chi.left}×{chi.right}] χ²={chi.chi2:.3f}, "
            f"dof={chi.dof}, p={chi.p_value:.3e}"
        )
        print(f"      → {chi.interpretation}")

    print_section("6. ML Pipeline (전처리 + 모델 학습 · 평가 · 저장)")
    ml = train_and_evaluate(df)
    print(f"  학습 {ml.train_size:,}행 / 테스트 {ml.test_size:,}행, 피처 {ml.feature_count}개")
    print("\n  [후보 모델 비교] (F1 내림차순)")
    print(
        pd.DataFrame([{"모델": c.name, **c.metrics.as_dict()} for c in ml.candidates])
        .round(4)
        .to_string(index=False)
    )
    print(f"\n  [선정 모델] {ml.model_name}")
    print(f"  다수 클래스 베이스라인 정확도: {ml.majority_baseline_accuracy:.4f}")
    print(ml.report_text)
    print("  [민감 속성별 성능]")
    print(
        pd.DataFrame(vars(group) for group in ml.fairness)
        .round(4)
        .to_string(index=False)
    )
    verified = "통과" if ml.reload_verified else "실패"
    print(f"\n  모델 저장: {ml.model_path} (재로딩 검증 {verified})")

    print_section("7. 리포트 자동 생성")
    report_path = generate_report(comparison, cleaning, eda_result, charts, stats_results, ml)
    print(f"  리포트: {report_path}")


# --------------------------------------------------
# 함수명 : main
# 목적   : 파이프라인을 실행하고 예상 가능한 실패를 최상위에서 처리
# 매개변수: 없음
# 반환값 : int - 종료 코드 (정상 0, 실패 1)
# --------------------------------------------------
def main() -> int:
    configure_logging()
    # 콘솔 출력에서 표가 줄바꿈으로 깨지지 않도록 너비를 넉넉히 설정한다.
    pd.set_option("display.width", 200)
    pd.set_option("display.max_columns", 30)

    try:
        run_pipeline()
    except NotImplementedError as exc:
        # 아직 구현되지 않은 단계 — 담당자가 채우기 전까지는 여기서 멈춘다.
        logger.error("미구현 단계에서 중단: %s", exc)
        return 1
    except (OSError, KeyError, ValueError) as exc:
        # 파일/네트워크 실패, 컬럼 누락, 검정 조건 위반 등 예상 가능한 실패를 한 곳에서 처리한다.
        logger.error("파이프라인 실행 실패: %s: %s", type(exc).__name__, exc)
        return 1

    print("\n분석 파이프라인이 정상적으로 완료되었습니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

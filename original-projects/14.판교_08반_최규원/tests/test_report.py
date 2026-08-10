# --------------------------------------------------
# 파일명   : test_report.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : 리포트 생성 모듈(report.py)의 렌더링·저장 동작 검증
# 설명     : 각 단계 값 객체를 손으로 만들어 report.md 생성을 실행하고, 주요 수치가
#            실제로 렌더링되는지와 쓰기 실패 시 예외가 나는지를 확인한다.
#            네트워크 없이 실행된다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성
# --------------------------------------------------

from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

import report
from data import CleaningSummary, LoadComparison, LoaderBenchmark
from eda import ColumnStats, CorrelationPair, EdaResult, OutlierImpact
from ml_pipeline import FairnessGroup, Metrics, MlResult, ModelCandidate
from stats_test import ChiSquareResult, StatsResults, TTestResult
from viz import ChartArtifacts


# --------------------------------------------------
# 함수명 : make_inputs
# 목적   : generate_report에 넘길 6개 값 객체를 한 번에 생성
# 매개변수: tmp_path(Path) - 산출물 경로로 쓸 임시 디렉토리
# 반환값 : tuple - (comparison, cleaning, eda, charts, stats, ml)
# --------------------------------------------------
def make_inputs(
    tmp_path: Path,
) -> tuple[LoadComparison, CleaningSummary, EdaResult, ChartArtifacts, StatsResults, MlResult]:
    comparison = LoadComparison(
        pandas=LoaderBenchmark("Pandas", 32561, 15, 0.12),
        polars=LoaderBenchmark("Polars", 32561, 15, 0.04),
        shape_match=True,
        repeat=3,
    )
    cleaning = CleaningSummary(
        rows_before=32561,
        rows_after=32537,
        duplicates_removed=24,
        rows_with_missing=2399,
        missing_before={"workclass": 1836, "occupation": 1843},
        missing_after={},
    )
    eda = EdaResult(
        stats=[ColumnStats("age", 32537, 38.6, 13.6, 17.0, 28.0, 37.0, 48.0, 90.0, 0.56, -0.17)],
        correlation=pd.DataFrame({"age": [1.0, 0.03], "education-num": [0.03, 1.0]},
                                 index=["age", "education-num"]),
        top_pairs=[CorrelationPair("age", "education-num", 0.03)],
        target_distribution={"<=50K": 24698, ">50K": 7839},
        group_means=pd.DataFrame({"<=50K": [36.8], ">50K": [44.3], "차이": [7.5]}, index=["age"]),
        outlier_impacts=[
            OutlierImpact("capital-gain", 0.0, 0.0, 0.0, 0.0, 2712, 32537, 0.62, 0.24)
        ],
    )
    charts = ChartArtifacts(
        seaborn_png=tmp_path / "seaborn_eda.png",
        plotly_html=tmp_path / "plotly_education_income.html",
    )
    stats = StatsResults(
        ttests=[
            TTestResult("age", "<=50K", ">50K", 36.8, 44.3, 24698, 7839, 94.4, 1.2e-300,
                        True, "p가 작아 통계적으로 유의하다."),
        ],
        chi_square=ChiSquareResult("sex", "income", 1517.8, 1, 0.0, True,
                                   "독립성 귀무가설을 기각한다 — 통계적으로 유의하다."),
    )
    metrics = Metrics(0.8695, 0.7750, 0.6608, 0.7133, 0.9270)
    ml = MlResult(
        model_name="XGBoost",
        train_size=26029,
        test_size=6508,
        feature_count=103,
        metrics=metrics,
        majority_baseline_accuracy=0.7591,
        report_text="              precision    recall  f1-score",
        model_path=tmp_path / "income_pipeline.pkl",
        reload_verified=True,
        candidates=[ModelCandidate("XGBoost", metrics)],
        fairness=[FairnessGroup("sex", "Male", 4400, 0.31, 0.28, 0.66, 0.78)],
    )
    return comparison, cleaning, eda, charts, stats, ml


# --------------------------------------------------
# 함수명 : test_report_is_written_with_key_values
# 목적   : 리포트 파일이 생성되고 주요 수치·섹션이 렌더링되는지 검증
# 매개변수: tmp_path(Path) - 임시 디렉토리, monkeypatch - pytest 패치 픽스처
# 반환값 : None
# --------------------------------------------------
def test_report_is_written_with_key_values(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(report, "REPORT_PATH", tmp_path / "report.md")
    path = report.generate_report(*make_inputs(tmp_path))

    text = path.read_text(encoding="utf-8")
    assert path.exists()
    assert "# Adult Census Income 분석 리포트" in text
    assert "XGBoost" in text
    assert "0.7133" in text  # 최종 모델 F1
    assert "Polars" in text
    assert "통계적으로 유의하다." in text


# --------------------------------------------------
# 함수명 : test_all_sections_are_present
# 목적   : 파이프라인 7단계 섹션이 모두 리포트에 들어가는지 검증
# 매개변수: tmp_path(Path) - 임시 디렉토리, monkeypatch - pytest 패치 픽스처
# 반환값 : None
# --------------------------------------------------
def test_all_sections_are_present(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(report, "REPORT_PATH", tmp_path / "report.md")
    text = report.generate_report(*make_inputs(tmp_path)).read_text(encoding="utf-8")

    headings = [line for line in text.splitlines() if line.startswith("## ")]
    assert len(headings) == 7


# --------------------------------------------------
# 함수명 : test_chart_paths_are_relative_to_report
# 목적   : 같은 디렉토리의 산출물이 상대 경로 링크로 들어가는지 검증
# 매개변수: tmp_path(Path) - 임시 디렉토리, monkeypatch - pytest 패치 픽스처
# 반환값 : None
# --------------------------------------------------
def test_chart_paths_are_relative_to_report(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(report, "REPORT_PATH", tmp_path / "report.md")
    text = report.generate_report(*make_inputs(tmp_path)).read_text(encoding="utf-8")

    assert "(seaborn_eda.png)" in text
    assert str(tmp_path) not in text


# --------------------------------------------------
# 함수명 : test_unwritable_path_raises_os_error
# 목적   : 리포트를 쓸 수 없는 경로에서 OSError가 전파되는지 검증
# 매개변수: tmp_path(Path) - 임시 디렉토리, monkeypatch - pytest 패치 픽스처
# 반환값 : None
# --------------------------------------------------
def test_unwritable_path_raises_os_error(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    blocker = tmp_path / "blocked"
    blocker.write_text("파일이므로 이 아래에는 디렉토리를 만들 수 없다", encoding="utf-8")
    monkeypatch.setattr(report, "REPORT_PATH", blocker / "report.md")

    with pytest.raises(OSError):
        report.generate_report(*make_inputs(tmp_path))

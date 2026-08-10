# --------------------------------------------------
# 파일명   : report.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : 파이프라인 각 단계 결과를 모아 report.md 자동 생성
# 설명     : 로딩 비교·전처리·EDA·시각화·통계 검정·모델 평가 결과 값 객체를 받아
#            Jinja2 템플릿(src/templates/report.md.j2)에 채워 outputs/report.md로 저장한다.
# 변경내역 : 2026-08-07 윤동현 - 인터페이스(시그니처) 골격 작성
#            2026-08-07 윤동현 - Jinja2 렌더링 및 리포트 저장 구현
#            2026-08-07 윤동현 - viz의 실제 값 객체명(ChartArtifacts)으로 import 수정
# --------------------------------------------------

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from jinja2 import Environment, FileSystemLoader, StrictUndefined, TemplateError

from config import REPORT_PATH, TEMPLATE_DIR
from data import CleaningSummary, LoadComparison
from eda import EdaResult
from ml_pipeline import MlResult
from stats_test import StatsResults
from viz import ChartArtifacts

logger = logging.getLogger(__name__)

TEMPLATE_NAME = "report.md.j2"


# --------------------------------------------------
# 함수명 : to_markdown_table
# 목적   : 데이터프레임을 리포트에 넣을 마크다운 표 문자열로 변환
# 매개변수: frame(pd.DataFrame) - 변환 대상 표, index(bool) - 인덱스 컬럼 포함 여부
# 반환값 : str - 마크다운 표 문자열
# --------------------------------------------------
def to_markdown_table(frame: pd.DataFrame, index: bool = False) -> str:
    return frame.to_markdown(index=index, floatfmt=".4f")


# --------------------------------------------------
# 함수명 : relative_to_report
# 목적   : 산출물 경로를 리포트 파일 기준 상대 경로로 변환 (링크가 깨지지 않게)
# 매개변수: path(Path) - 산출물 경로, report_path(Path | None) - 리포트 파일 경로
#           (None이면 호출 시점의 config.REPORT_PATH를 쓴다)
# 반환값 : str - 리포트에서 사용할 상대 경로 문자열
# --------------------------------------------------
def relative_to_report(path: Path, report_path: Path | None = None) -> str:
    base = report_path or REPORT_PATH
    try:
        return path.relative_to(base.parent).as_posix()
    except ValueError:
        # 산출물이 리포트와 다른 트리에 있으면 상대화할 수 없으므로 절대 경로를 쓴다.
        return path.as_posix()


# --------------------------------------------------
# 함수명 : build_context
# 목적   : 값 객체들을 템플릿이 바로 쓸 수 있는 렌더링 컨텍스트로 변환
# 매개변수: comparison(LoadComparison) - 로딩 비교, cleaning(CleaningSummary) - 전처리 요약,
#           eda(EdaResult) - EDA 결과, charts(ChartArtifacts) - 차트 경로,
#           stats(StatsResults) - 통계 검정 결과, ml(MlResult) - 모델 학습 결과
# 반환값 : dict[str, Any] - 템플릿 컨텍스트
# --------------------------------------------------
def build_context(
    comparison: LoadComparison,
    cleaning: CleaningSummary,
    eda: EdaResult,
    charts: ChartArtifacts,
    stats: StatsResults,
    ml: MlResult,
) -> dict[str, Any]:
    candidate_frame = pd.DataFrame(
        [{"모델": c.name, **c.metrics.as_dict()} for c in ml.candidates]
    )
    fairness_frame = pd.DataFrame(
        [
            {
                "속성": g.attribute, "집단": g.group, "표본수": g.size,
                "실제 고소득률": g.actual_positive_rate,
                "예측 고소득률": g.predicted_positive_rate,
                "재현율": g.recall, "정밀도": g.precision,
            }
            for g in ml.fairness
        ]
    )
    total_rows = sum(eda.target_distribution.values())

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "comparison": comparison,
        "cleaning": cleaning,
        "eda": eda,
        "stats": stats,
        "ml": ml,
        "seaborn_path": relative_to_report(charts.seaborn_png),
        "plotly_path": relative_to_report(charts.plotly_html),
        "model_path": relative_to_report(ml.model_path),
        "stats_table": to_markdown_table(eda.stats_frame()),
        "correlation_table": to_markdown_table(eda.correlation.round(3), index=True),
        "group_means_table": to_markdown_table(eda.group_means, index=True),
        "candidate_table": to_markdown_table(candidate_frame),
        "fairness_table": to_markdown_table(fairness_frame),
        "target_distribution": [
            (label, count, count / total_rows * 100 if total_rows else 0.0)
            for label, count in eda.target_distribution.items()
        ],
    }


# --------------------------------------------------
# 함수명 : generate_report
# 목적   : 분석 결과 값 객체들을 템플릿에 채워 report.md로 저장
# 매개변수: comparison(LoadComparison) - 로딩 비교, cleaning(CleaningSummary) - 전처리 요약,
#           eda(EdaResult) - EDA 결과, charts(ChartArtifacts) - 차트 경로,
#           stats(StatsResults) - 통계 검정 결과, ml(MlResult) - 모델 학습 결과
# 반환값 : Path - 생성된 리포트 파일 경로
# 예외   : TemplateError(템플릿 누락·렌더링 실패), OSError(파일 쓰기 실패) 시 로깅 후 재발생
# --------------------------------------------------
def generate_report(
    comparison: LoadComparison,
    cleaning: CleaningSummary,
    eda: EdaResult,
    charts: ChartArtifacts,
    stats: StatsResults,
    ml: MlResult,
) -> Path:
    environment = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        # 컨텍스트에 없는 변수를 조용히 빈칸으로 두면 리포트에 구멍이 생기므로 즉시 실패시킨다.
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False,  # 마크다운 출력이라 HTML 이스케이프를 하면 안 된다.
    )
    try:
        template = environment.get_template(TEMPLATE_NAME)
        rendered = template.render(
            **build_context(comparison, cleaning, eda, charts, stats, ml)
        )
    except TemplateError as exc:
        logger.error("리포트 템플릿 렌더링 실패: %s - %s", TEMPLATE_NAME, exc)
        raise

    try:
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with REPORT_PATH.open("w", encoding="utf-8") as handle:
            handle.write(rendered)
    except OSError as exc:
        logger.error("리포트 저장 실패: %s - %s", REPORT_PATH, exc)
        raise

    logger.info("리포트 생성 완료: %s (%d자)", REPORT_PATH, len(rendered))
    return REPORT_PATH

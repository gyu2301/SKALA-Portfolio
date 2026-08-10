# --------------------------------------------------
# 파일명   : viz.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : Seaborn 정적 차트와 Plotly 인터랙티브 차트 생성
# 설명     : Seaborn으로 분포·그룹비교·상관관계를 담은 2x2 정적 차트를 PNG로 저장하고,
#            Plotly Express로 학력별 소득 구성을 보여주는 인터랙티브 막대 차트를
#            HTML로 저장한다. 모든 차트에 제목과 축 레이블을 명시한다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성 (day2 종합실습 구현을 팀 협업용으로 포팅,
#            스키마 상수는 config.py로 이동)
# --------------------------------------------------

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import matplotlib
import pandas as pd

# GUI 없이 파일로만 저장하므로 비대화형 백엔드를 사용한다 (pyplot import 전에 지정).
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import plotly.express as px
import seaborn as sns

from config import NUMERIC_COLUMNS, OUTPUT_DIR, TARGET_COLUMN

logger = logging.getLogger(__name__)

# macOS 기본 한글 폰트. 차트 제목·축 레이블의 한글이 깨지지 않도록 지정한다.
KOREAN_FONT_CANDIDATES = ["AppleGothic", "Apple SD Gothic Neo", "NanumGothic"]


# --------------------------------------------------
# 클래스명 : ChartArtifacts
# 목적     : 생성된 차트 파일 경로를 담아 리포트 생성 단계로 전달하는 값 객체
# --------------------------------------------------
@dataclass
class ChartArtifacts:
    seaborn_png: Path
    plotly_html: Path


# --------------------------------------------------
# 함수명 : configure_style
# 목적   : Seaborn 테마와 한글 폰트를 설정해 차트의 한글 깨짐(tofu)을 방지
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def configure_style() -> None:
    import matplotlib.font_manager as fm

    installed = {f.name for f in fm.fontManager.ttflist}
    available = [name for name in KOREAN_FONT_CANDIDATES if name in installed]
    if not available:
        logger.warning("한글 폰트를 찾지 못했습니다. 차트의 한글이 깨질 수 있습니다.")

    sns.set_theme(style="whitegrid")
    # DejaVu Sans를 앞에 두면 ASCII는 DejaVu가, 한글은 폴백으로 한글 폰트가 렌더링한다.
    # (한글 폰트를 앞에 두면 '<=50K'의 부등호가 CJK 꺾쇠 '〈'로 그려진다)
    plt.rcParams["font.family"] = ["DejaVu Sans", *available]
    # 한글 폰트 사용 시 음수 기호가 깨지므로 유니코드 마이너스를 끈다.
    plt.rcParams["axes.unicode_minus"] = False


# --------------------------------------------------
# 함수명 : build_seaborn_chart
# 목적   : 분포·그룹비교·상관관계를 2x2 서브플롯 하나로 구성해 PNG로 저장
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, output_path(Path) - 저장 경로
# 반환값 : Path - 저장된 PNG 파일 경로
# 예외   : OSError(파일 저장 실패) 시 로깅 후 재발생
# --------------------------------------------------
def build_seaborn_chart(df: pd.DataFrame, output_path: Path) -> Path:
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle("Adult Census Income — 소득 그룹별 탐색적 데이터 분석", fontsize=16)

    # (0,0) 분포: 연령 히스토그램 + KDE를 소득 그룹별로 겹쳐 표시
    sns.histplot(data=df, x="age", hue=TARGET_COLUMN, kde=True, bins=30, ax=axes[0, 0])
    axes[0, 0].set_title("연령 분포 (소득 그룹별)")
    axes[0, 0].set_xlabel("연령 (세)")
    axes[0, 0].set_ylabel("인원 수 (명)")

    # (0,1) 그룹 비교: 소득 그룹별 주당 근로시간 분포를 성별로 나누어 박스플롯
    sns.boxplot(data=df, x=TARGET_COLUMN, y="hours-per-week", hue="sex", ax=axes[0, 1])
    axes[0, 1].set_title("소득 그룹별 주당 근로시간 분포")
    axes[0, 1].set_xlabel("연소득 구간")
    axes[0, 1].set_ylabel("주당 근로시간 (시간)")

    # (1,0) 상관관계: 수치형 변수 간 피어슨 상관 히트맵
    sns.heatmap(
        pd.DataFrame(df[NUMERIC_COLUMNS]).corr(), annot=True, fmt=".2f", cmap="coolwarm",
        center=0, vmin=-1, vmax=1, ax=axes[1, 0],
    )
    axes[1, 0].set_title("수치형 변수 간 상관계수")
    axes[1, 0].set_xlabel("변수")
    axes[1, 0].set_ylabel("변수")

    # (1,1) 그룹 비교: 교육연수별 평균 근로시간을 소득 그룹으로 나누어 선그래프
    sns.lineplot(
        data=df, x="education-num", y="hours-per-week", hue=TARGET_COLUMN,
        errorbar=("ci", 95), marker="o", ax=axes[1, 1],
    )
    axes[1, 1].set_title("교육연수에 따른 평균 주당 근로시간")
    axes[1, 1].set_xlabel("교육연수 (년)")
    axes[1, 1].set_ylabel("평균 주당 근로시간 (시간)")

    fig.tight_layout()
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(output_path, dpi=120)
    except OSError as exc:
        logger.error("Seaborn 차트 저장 실패: %s - %s", output_path, exc)
        raise
    finally:
        # 열린 Figure를 반드시 닫아 메모리 누수를 방지한다.
        plt.close(fig)

    logger.info("Seaborn 정적 차트 저장 완료: %s", output_path)
    return output_path


# --------------------------------------------------
# 함수명 : build_plotly_chart
# 목적   : 학력별 소득 구성을 보여주는 인터랙티브 막대 차트를 HTML로 저장
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, output_path(Path) - 저장 경로
# 반환값 : Path - 저장된 HTML 파일 경로
# 예외   : OSError(파일 저장 실패) 시 로깅 후 재발생
# --------------------------------------------------
def build_plotly_chart(df: pd.DataFrame, output_path: Path) -> Path:
    # 교육연수 순서대로 정렬해 학력이 높아질수록 고소득 비중이 커지는 추세를 드러낸다.
    counted = pd.DataFrame(
        df.groupby(["education-num", "education", TARGET_COLUMN], as_index=False).size()
    )
    grouped = counted.rename(columns={"size": "인원수"}).sort_values("education-num")

    figure = px.bar(
        grouped,
        x="education",
        y="인원수",
        color=TARGET_COLUMN,
        barmode="group",
        hover_data=["education-num"],
        title="학력별 소득 구간 인원 분포 (Adult Census Income)",
        labels={
            "education": "학력",
            "인원수": "인원 수 (명)",
            TARGET_COLUMN: "연소득 구간",
            "education-num": "교육연수(년)",
        },
    )
    figure.update_layout(xaxis_title="학력 (교육연수 오름차순)", yaxis_title="인원 수 (명)")

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        figure.write_html(output_path)
    except OSError as exc:
        logger.error("Plotly 차트 저장 실패: %s - %s", output_path, exc)
        raise

    logger.info("Plotly 인터랙티브 차트 저장 완료: %s", output_path)
    return output_path


# --------------------------------------------------
# 함수명 : create_visualizations
# 목적   : Seaborn 정적 차트와 Plotly 인터랙티브 차트를 모두 생성
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, output_dir(Path) - 산출물 디렉토리
# 반환값 : ChartArtifacts - 생성된 차트 파일 경로 묶음
# --------------------------------------------------
def create_visualizations(df: pd.DataFrame, output_dir: Path = OUTPUT_DIR) -> ChartArtifacts:
    configure_style()
    return ChartArtifacts(
        seaborn_png=build_seaborn_chart(df, output_dir / "seaborn_eda.png"),
        plotly_html=build_plotly_chart(df, output_dir / "plotly_education_income.html"),
    )

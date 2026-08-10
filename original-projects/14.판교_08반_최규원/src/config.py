# --------------------------------------------------
# 파일명   : config.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : 프로젝트 전역에서 공유하는 경로·데이터 스키마 상수 정의
# 설명     : 원본 데이터 URL, 캐시/산출물 경로, Adult Census Income 데이터셋의
#            컬럼명·결측 표기·타깃 라벨·수치형/범주형 구분을 한 곳에 모아둔다.
#            다른 모듈은 이 값들을 하드코딩하지 않고 여기서 import해 쓴다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성
# --------------------------------------------------

from __future__ import annotations

from pathlib import Path

# 원본 데이터 출처 (UCI Machine Learning Repository)
ADULT_DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data"

# src/의 한 단계 위가 프로젝트 루트다.
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "outputs"
TEMPLATE_DIR = Path(__file__).parent / "templates"

RAW_DATA_PATH = DATA_DIR / "adult.data"

# 산출물 경로 — 이름을 바꾸면 report.md 링크도 함께 바뀌므로 여기서만 관리한다.
SEABORN_CHART_PATH = OUTPUT_DIR / "seaborn_eda.png"
PLOTLY_CHART_PATH = OUTPUT_DIR / "plotly_education_income.html"
MODEL_PATH = OUTPUT_DIR / "income_pipeline.pkl"
REPORT_PATH = OUTPUT_DIR / "report.md"

# 원본 파일에 헤더가 없으므로 컬럼명을 직접 지정한다.
COLUMN_NAMES: list[str] = [
    "age", "workclass", "fnlwgt", "education", "education-num",
    "marital-status", "occupation", "relationship", "race", "sex",
    "capital-gain", "capital-loss", "hours-per-week", "native-country", "income",
]

# 결측치는 원본에 " ?"(앞 공백 포함)로 기록되어 있다.
# 주의: pandas 3.x는 skipinitialspace로 공백을 먼저 제거한 뒤 결측을 매칭하므로
#       " ?"만 지정하면 결측이 하나도 잡히지 않는다. 두 형태를 모두 등록한다.
NA_VALUES: list[str] = ["?", " ?"]

# 결측 범주를 버리지 않고 하나의 값으로 남길 때 쓰는 라벨
MISSING_CATEGORY = "Unknown"

# 타깃 컬럼과 이진 분류 라벨
TARGET_COLUMN = "income"
POSITIVE_LABEL = ">50K"
NEGATIVE_LABEL = "<=50K"

NUMERIC_COLUMNS: list[str] = [
    "age", "fnlwgt", "education-num", "capital-gain", "capital-loss", "hours-per-week",
]
CATEGORICAL_COLUMNS: list[str] = [
    "workclass", "education", "marital-status", "occupation",
    "relationship", "race", "sex", "native-country",
]

# 공정성 점검에 사용할 민감 속성
SENSITIVE_COLUMNS: list[str] = ["sex", "race"]

# 통계 검정 유의수준
ALPHA = 0.05

# 학습/테스트 분할 설정 — 재현성을 위해 시드를 고정한다.
TEST_SIZE = 0.2
RANDOM_STATE = 42

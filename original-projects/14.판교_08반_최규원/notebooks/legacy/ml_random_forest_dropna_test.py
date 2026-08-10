# --------------------------------------------------
# 파일명   : ml_random_forest_dropna_test.py
# 작성자   : User
# 작성일자 : 2026-08-07
# 목적     : 드롭나 데이터셋(adult_train_dropna.csv, adult_test_dropna.csv)으로 랜덤포레스트 ML 테스트 수행
# 설명     : 두 CSV를 탐지해 로드 후 동일 컬럼 스키마를 맞추고,
#            학습/평가를 실행해 성능 지표를 출력한다.
# 변경내역 : 2026-08-07 User - 임시 ML 실험 스크립트 최초 작성
# --------------------------------------------------

from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# --------------------------------------------------
# 파일 외부 의존성 없이 실행하기 위해 config 상수를 스크립트 내부에 복원
# --------------------------------------------------
RANDOM_STATE: int = 42
TARGET_COLUMN: str = "income"
POSITIVE_LABEL: str = ">50K"

CATEGORICAL_COLUMNS: list[str] = [
    "workclass",
    "education",
    "marital-status",
    "occupation",
    "relationship",
    "race",
    "sex",
    "native-country",
]

NUMERIC_COLUMNS: list[str] = [
    "age",
    "fnlwgt",
    "education-num",
    "capital-gain",
    "capital-loss",
    "hours-per-week",
]

PROJECT_ROOT = Path(__file__).resolve().parents[2]  # notebooks/legacy/ 아래이므로 두 단계 위
DATA_DIR = PROJECT_ROOT / "data"


# --------------------------------------------------
# 함수명 : load_dropna_dataset
# 목적   : dropna CSV 경로를 유연하게 로드해 컬럼 수가 맞지 않더라도 기본 스키마로 복원
# 매개변수: path(Path) - 대상 CSV 경로
# 반환값 : pd.DataFrame - 로드된 데이터프레임
# --------------------------------------------------
def load_dropna_dataset(path: Path) -> pd.DataFrame:
    try:
        frame = pd.read_csv(path)
    except FileNotFoundError:
        raise
    except pd.errors.EmptyDataError:
        raise

    # 이미 헤더가 있는 스키마를 우선 인정한다.
    if frame.shape[1] >= 2:
        return frame

    # 헤더가 빠진 경우(혹시 모를 경우)에만 fallback.
    fallback_columns = [
        "age",
        "workclass",
        "fnlwgt",
        "education",
        "education-num",
        "marital-status",
        "occupation",
        "relationship",
        "race",
        "sex",
        "capital-gain",
        "capital-loss",
        "hours-per-week",
        "native-country",
        "income",
        "split",
    ]
    return pd.read_csv(path, header=None, names=fallback_columns)


# --------------------------------------------------
# 함수명 : print_metric_table
# 목적   : 모델 성능 지표를 보기 좋은 정렬형 텍스트 테이블로 출력
# 매개변수: title(str) - 표 제목, metrics_list(list[dict[str, float]]) - 결과 목록
# 반환값 : None
# --------------------------------------------------
def print_metric_table(title: str, metrics_list: list[dict[str, float]]) -> None:
    if not metrics_list:
        print(f"{title}\n(결과 없음)")
        return

    ordered_keys: list[str] = ["dataset", "accuracy", "precision", "recall", "f1", "roc_auc"]
    ordered_labels: dict[str, str] = {
        "dataset": "Dataset",
        "accuracy": "Accuracy",
        "precision": "Precision",
        "recall": "Recall",
        "f1": "F1",
        "roc_auc": "ROC-AUC",
    }
    rows = []
    for metric in metrics_list:
        rows.append({
            ordered_labels[key]: metric.get(key, float("nan"))
            for key in ordered_keys
        })

    table = pd.DataFrame(rows)
    if table.empty:
        print(f"{title}\n(표 생성 실패)")
        return

    print(f"\n{title}")
    print(table.round(4).to_string(index=False))


# --------------------------------------------------
# 함수명 : get_feature_columns
# 목적   : 데이터프레임에서 목표변수를 제외한 특성 컬럼을 수치형/범주형으로 분류
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임, target_col(str) - 목표변수명
# 반환값 : tuple[list[str], list[str]] - (수치형 컬럼, 범주형 컬럼)
# --------------------------------------------------
def get_feature_columns(df: pd.DataFrame, target_col: str) -> tuple[list[str], list[str]]:
    feature_names = [col for col in df.columns if col != target_col]

    numeric_cols = [
        col
        for col in feature_names
        if col in NUMERIC_COLUMNS or pd.api.types.is_numeric_dtype(df[col])
    ]
    categorical_cols = [
        col for col in feature_names
        if col not in numeric_cols and col in CATEGORICAL_COLUMNS or not pd.api.types.is_numeric_dtype(df[col])
    ]
    # 중복 제거 후 안전 정렬
    return sorted(set(numeric_cols)), sorted(set(categorical_cols), key=str)


# --------------------------------------------------
# 함수명 : prepare_target
# 목적   : 라벨 문자열/숫자 형태의 목표변수를 0/1 정수로 변환
# 매개변수: series(pd.Series) - income-like 목표변수
# 반환값 : pd.Series - 이진 타깃 벡터
# --------------------------------------------------
def prepare_target(series: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(series):
        return series.astype(int)
    normalized = series.astype(str).str.strip()
    return (normalized == POSITIVE_LABEL).astype(int)


def evaluate_train_on_test(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> dict[str, float]:
    if train_df.empty:
        raise ValueError("학습 데이터가 비어 있습니다.")
    if test_df.empty:
        raise ValueError("평가 데이터가 비어 있습니다.")

    train_target_col = "income" if "income" in train_df.columns else train_df.columns[-1]
    test_target_col = "income" if "income" in test_df.columns else test_df.columns[-1]
    if train_target_col not in train_df.columns:
        raise ValueError("학습 데이터에서 타깃 컬럼을 찾지 못했습니다.")
    if test_target_col not in test_df.columns:
        raise ValueError("평가 데이터에서 타깃 컬럼을 찾지 못했습니다.")

    X_train = train_df.drop(columns=[train_target_col])
    y_train = prepare_target(train_df[train_target_col])
    X_test = test_df.drop(columns=[test_target_col])
    y_test = prepare_target(test_df[test_target_col])

    if X_train.empty or y_train.nunique(dropna=False) < 2:
        raise ValueError("학습 데이터는 두 개 이상의 클래스를 가진 분류 문제여야 합니다.")
    if X_test.empty or y_test.nunique(dropna=False) < 2:
        raise ValueError("평가 데이터는 두 개 이상의 클래스를 가진 분류 문제여야 합니다.")

    feature_columns = [col for col in X_train.columns if col in X_test.columns]
    X_train = X_train[feature_columns]
    X_test = X_test[feature_columns]

    # 수치형/범주형 구분은 학습셋 기준으로 맞추면 학습/평가 파이프라인 일관성이 유지된다.
    numeric_cols, categorical_cols = get_feature_columns(X_train, train_target_col)
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), numeric_cols),
            ("cat", Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("encoder", OneHotEncoder(handle_unknown="ignore")),
            ]), categorical_cols),
        ],
        remainder="drop",
    )

    model = RandomForestClassifier(
        n_estimators=250,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    pipeline = Pipeline([
        ("preprocess", preprocessor),
        ("model", model),
    ])

    pipeline.fit(X_train, y_train)
    pred = pipeline.predict(X_test)
    proba = pipeline.predict_proba(X_test)[:, 1]

    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test,
        pred,
        average="binary",
        zero_division=0,
    )
    return {
        "dataset": "adult_test_dropna",
        "accuracy": float(accuracy_score(y_test, pred)),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(roc_auc_score(y_test, proba)),
    }


# --------------------------------------------------
# 함수명 : main
# 목적   : 두 개 드롭나 CSV를 모두 로드해 랜덤포레스트 성능을 출력
# 매개변수: train_path(Path), test_path(Path)
# 반환값 : None
# --------------------------------------------------
def main(
    train_path: Path = DATA_DIR / "adult_train_dropna.csv",
    test_path: Path = DATA_DIR / "adult_test_dropna.csv",
) -> None:
    train_df = load_dropna_dataset(train_path)
    test_df = load_dropna_dataset(test_path)

    test_metrics = evaluate_train_on_test(train_df, test_df)

    print_metric_table("🔎 RandomForest 성능 요약 (train → test)", [test_metrics])


if __name__ == "__main__":
    main()

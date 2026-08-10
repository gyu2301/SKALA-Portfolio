# --------------------------------------------------
# 파일명   : ml_logistic_regression_dropna_test.py
# 작성자   : User
# 작성일자 : 2026-08-07
# 목적     : 드롭나 데이터셋(adult_train_dropna.csv, adult_test_dropna.csv)으로
#            로지스틱회귀 기반 분류 성능을 빠르게 점검
# 설명     : 두 CSV를 로드해 결측/타입 보정을 포함한 전처리 파이프라인을 구성하고,
#            ROC-AUC 포함 지표를 계산한다.
# 변경내역 : 2026-08-07 User - 로지스틱회귀 전용 실험 스크립트 최초 작성
# --------------------------------------------------

from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

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
    rows = [
        {ordered_labels[key]: metric.get(key, float("nan")) for key in ordered_keys}
        for metric in metrics_list
    ]

    table = pd.DataFrame(rows)
    if table.empty:
        print(f"{title}\n(표 생성 실패)")
        return

    print(f"\n{title}")
    print(table.round(4).to_string(index=False))


# --------------------------------------------------
# 함수명 : load_dropna_dataset
# 목적   : 드롭나 CSV를 유연하게 읽고, 컬럼이 비어있을 때는 기본 스키마로 복원한다.
#          실제 실험에서는 컬럼 헤더 유무가 혼합되어 있을 수 있어 예외 상황을 흡수한다.
# 매개변수: path(Path) - 대상 CSV 경로
# 반환값 : pd.DataFrame - 로드된 데이터프레임
# --------------------------------------------------
def load_dropna_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"데이터 파일이 없습니다: {path}")

    df = pd.read_csv(path)
    if df.shape[1] >= 2:
        return df

    default_columns = [
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
    ]
    return pd.read_csv(path, header=None, names=default_columns)


# --------------------------------------------------
# 함수명 : prepare_target
# 목적   : 목표변수를 0/1 라벨로 통일해 로지스틱회귀가 처리하기 쉬운 형태로 바꾼다.
# 매개변수: series(pd.Series) - 원본 타깃 컬럼
# 반환값 : pd.Series - 0/1 정수 타깃
# --------------------------------------------------
def prepare_target(series: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(series):
        return series.astype(int)
    normalized = series.astype(str).str.strip()
    return (normalized == POSITIVE_LABEL).astype(int)


# --------------------------------------------------
# 함수명 : make_feature_split
# 목적   : 타깃 컬럼을 제외한 특성에서 수치형/범주형 컬럼을 분리한다.
# 매개변수: df(pd.DataFrame), target_column(str) - 타깃 컬럼명
# 반환값 : tuple[list[str], list[str]] - (수치형 컬럼, 범주형 컬럼)
# --------------------------------------------------
def make_feature_split(df: pd.DataFrame, target_column: str) -> tuple[list[str], list[str]]:
    feature_columns = [col for col in df.columns if col != target_column]

    numeric_columns = [
        col
        for col in feature_columns
        if col in NUMERIC_COLUMNS or pd.api.types.is_numeric_dtype(df[col])
    ]
    categorical_columns = [
        col
        for col in feature_columns
        if col not in numeric_columns and (col in CATEGORICAL_COLUMNS or not pd.api.types.is_numeric_dtype(df[col]))
    ]

    return list(dict.fromkeys(numeric_columns)), list(dict.fromkeys(categorical_columns))


# --------------------------------------------------
# 함수명 : evaluate_dataset
# 목적   : 주어진 데이터프레임으로 로지스틱회귀 파이프라인을 학습·평가한다.
# 매개변수: df(pd.DataFrame), dataset_name(str) - 데이터셋 식별자
# 반환값 : dict[str, float] - 정확도, 정밀도, 재현율, F1, ROC-AUC
# --------------------------------------------------
def evaluate_train_on_test(train_df: pd.DataFrame, test_df: pd.DataFrame) -> dict[str, float]:
    if train_df.empty:
        raise ValueError("학습 데이터가 비어 있습니다.")
    if test_df.empty:
        raise ValueError("평가 데이터가 비어 있습니다.")

    train_target = "income" if "income" in train_df.columns else train_df.columns[-1]
    test_target = "income" if "income" in test_df.columns else test_df.columns[-1]
    if train_target not in train_df.columns:
        raise ValueError("학습 데이터에서 타깃 컬럼을 찾지 못했습니다.")
    if test_target not in test_df.columns:
        raise ValueError("평가 데이터에서 타깃 컬럼을 찾지 못했습니다.")

    X_train = train_df.drop(columns=[train_target])
    y_train = prepare_target(train_df[train_target])
    X_test = test_df.drop(columns=[test_target])
    y_test = prepare_target(test_df[test_target])

    if y_train.nunique(dropna=False) < 2 or y_test.nunique(dropna=False) < 2:
        raise ValueError("학습/평가 데이터는 두 개 이상의 클래스를 가진 분류 문제여야 합니다.")

    # 교차 데이터셋 테스트를 위해 학습셋 공통 컬럼만 유지한다.
    feature_columns = [col for col in X_train.columns if col in X_test.columns]
    X_train = X_train[feature_columns]
    X_test = X_test[feature_columns]

    numeric_columns, categorical_columns = make_feature_split(X_train, train_target)
    numeric_transformer = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_transformer, numeric_columns),
            (
                "categorical",
                Pipeline([
                    ("imputer", SimpleImputer(strategy="most_frequent")),
                    ("encoder", OneHotEncoder(handle_unknown="ignore")),
                ]),
                categorical_columns,
            ),
        ],
        remainder="drop",
    )

    model = LogisticRegression(
        max_iter=5000,
        solver="saga",
        random_state=RANDOM_STATE,
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
# 목적   : train/test 드롭나 CSV를 모두 로드해 로지스틱회귀 실험 결과를 출력한다.
# 매개변수: train_path(Path), test_path(Path)
# 반환값 : None
# --------------------------------------------------
def main(
    train_path: Path = DATA_DIR / "adult_train_dropna.csv",
    test_path: Path = DATA_DIR / "adult_test_dropna.csv",
) -> None:
    train_df = load_dropna_dataset(train_path)
    test_df = load_dropna_dataset(test_path)

    test_result = evaluate_train_on_test(train_df, test_df)

    print_metric_table("🔎 LogisticRegression 성능 요약 (train → test)", [test_result])


if __name__ == "__main__":
    main()

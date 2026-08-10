"""
XGBoost 분류 실험 스크립트
- 학습 데이터: adult_train_dropna.csv
- 테스트 데이터: adult_test_dropna.csv
- 스키마: dropna 파일이 헤더를 갖추고 있거나 헤더가 없을 경우를 모두 지원
- 출력: accuracy / precision / recall / f1 / roc_auc
"""

from __future__ import annotations

import os
from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score


def _ensure_libomp_on_mac() -> None:
    libomp_path = Path("/opt/homebrew/opt/libomp/lib")
    if not libomp_path.exists():
        return

    current = os.environ.get("DYLD_LIBRARY_PATH", "").split(":")
    if str(libomp_path) not in current:
        os.environ["DYLD_LIBRARY_PATH"] = (
            str(libomp_path) + ("" if not current or current == [""] else ":" + ":".join(current))
        )


_ensure_libomp_on_mac()

try:
    from xgboost import XGBClassifier
except ModuleNotFoundError as exc:
    raise ModuleNotFoundError(
        "xgboost가 설치되어 있지 않습니다. uv run pip install xgboost 또는 "
        "pyproject/requirements에 xgboost를 추가하고 uv sync 후 실행해 주세요."
    ) from exc
except Exception as exc:
    raise RuntimeError(
        "xgboost 로딩 실패. libomp가 필요할 수 있습니다. "
        "brew install libomp 후 실행해 주세요."
    ) from exc


PROJECT_ROOT = Path(__file__).resolve().parents[2]  # notebooks/legacy/ 아래이므로 두 단계 위
DATA_DIR = PROJECT_ROOT / "data"
RANDOM_STATE = 42

DROPNA_COLUMNS = [
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

TARGET = "income"


def normalize_columns(frame: pd.DataFrame) -> pd.DataFrame:
    """컬럼명이 언더스코어형으로 들어온 경우 하이픈형으로 통일한다."""
    renames = {
        "education_num": "education-num",
        "marital_status": "marital-status",
        "capital_gain": "capital-gain",
        "capital_loss": "capital-loss",
        "hours_per_week": "hours-per-week",
        "native_country": "native-country",
    }
    return frame.rename(columns={k: v for k, v in renames.items() if k in frame.columns})


def load_dropna(filename: str) -> pd.DataFrame:
    """dropna 데이터셋을 안전하게 로드한다."""
    path = DATA_DIR / filename
    frame = pd.read_csv(path)
    frame = normalize_columns(frame)

    if TARGET not in frame.columns and len(frame.columns) == len(DROPNA_COLUMNS):
        frame.columns = DROPNA_COLUMNS

    frame[TARGET] = frame[TARGET].astype(str).str.replace(".", "", regex=False).str.strip()
    return frame


def to_xy(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    X = frame.drop(columns=[TARGET]).copy()
    for col in [
        "workclass",
        "education",
        "marital-status",
        "occupation",
        "relationship",
        "race",
        "sex",
        "native-country",
    ]:
        if col in X.columns:
            X[col] = X[col].astype("category")
    y = (frame[TARGET] == ">50K").astype(int)
    return X, y


def align_categories(X_train: pd.DataFrame, X_test: pd.DataFrame) -> pd.DataFrame:
    aligned = X_test.copy()
    for col in X_train.select_dtypes(include="category").columns:
        if col in aligned.columns:
            aligned[col] = aligned[col].astype("category")
            aligned[col] = aligned[col].cat.set_categories(X_train[col].cat.categories)
    return aligned


def evaluate(model: XGBClassifier, X: pd.DataFrame, y: pd.Series, dataset_name: str) -> dict[str, float]:
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]
    return {
        "dataset": dataset_name,
        "accuracy": float(accuracy_score(y, y_pred)),
        "precision": float(precision_score(y, y_pred)),
        "recall": float(recall_score(y, y_pred)),
        "f1": float(f1_score(y, y_pred)),
        "roc_auc": float(roc_auc_score(y, y_proba)),
    }


def main() -> None:
    train_df = load_dropna("adult_train_dropna.csv")
    test_df = load_dropna("adult_test_dropna.csv")

    X_train, y_train = to_xy(train_df)
    X_test, y_test = to_xy(test_df)
    X_test = align_categories(X_train, X_test)

    model = XGBClassifier(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=5,
        min_child_weight=3,
        subsample=0.9,
        colsample_bytree=0.8,
        reg_lambda=1.5,
        scale_pos_weight=1.0,
        objective="binary:logistic",
        eval_metric="logloss",
        tree_method="hist",
        enable_categorical=True,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    print("[train]", evaluate(model, X_train, y_train, "adult_train_dropna"))
    print("[test] ", evaluate(model, X_test, y_test, "adult_test_dropna"))


if __name__ == "__main__":
    main()

"""
==============================================================================
 프로그램명 : nn_classification.py
 설명       : Adult Income 데이터(결측치 완전제거 버전)로 Neural Network
              (MLPClassifier) 분류 모델을 학습·평가하고, root 보고서의
              7.2절 모델 비교표에 이어붙일 수 있는 형태로 결과를 출력한다.
              root 보고서와 동일한 규약을 따른다:
              - 난수 시드 20260807 공통 적용
              - fnlwgt 제외 (표본가중치 → 예측 변수 부적합)
              - joblib 저장 후 재로드 예측 일치 검증
 작성자     : (팀원 - NN 담당)
 변경내역   : 2026-08-07  최초 작성
==============================================================================
"""

import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, confusion_matrix,
    f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

SEED = 20260807  # root 보고서와 공통 시드

NUM_COLS = ["age", "education-num", "hours-per-week", "capital-gain", "capital-loss"]
CAT_COLS = ["workclass", "education", "marital-status", "occupation",
            "relationship", "race", "sex", "native-country"]
# fnlwgt는 root 보고서 규약에 따라 제외 (표본가중치 → 예측 변수 부적합)
TARGET = "income"
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # notebooks/legacy/ 아래이므로 두 단계 위
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "outputs"
MODEL_PATH = OUTPUT_DIR / "models" / "adult_income_mlp_pipeline.joblib"


def load_data():
    train = pd.read_csv(DATA_DIR / "adult_train_dropna.csv")
    test = pd.read_csv(DATA_DIR / "adult_test_dropna.csv")
    return train, test


def build_pipeline() -> Pipeline:
    """ColumnTransformer(수치 표준화 + 범주 원핫) + MLPClassifier.

    dropna 데이터라 결측 대체 단계는 생략하고(root 보고서의 SimpleImputer 단계에
    대응하는 부분이 없음), 나머지 전처리(StandardScaler, OneHotEncoder)는
    root 보고서의 다른 모델들과 동일하게 유지해 비교 가능성을 최대한 확보한다.
    """
    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), NUM_COLS),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
    ])
    clf = MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation="relu",
        solver="adam",
        alpha=1e-4,
        early_stopping=True,
        n_iter_no_change=10,
        max_iter=300,
        random_state=SEED,
    )
    return Pipeline([("prep", preprocessor), ("clf", clf)])


def evaluate(pipeline, X_test, y_test) -> dict:
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    cm = confusion_matrix(y_test, y_pred)
    return {
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "confusion_matrix": cm.tolist(),
        "n_iter": pipeline.named_steps["clf"].n_iter_,
    }


def main():
    train, test = load_data()

    X_train, y_train = train[NUM_COLS + CAT_COLS], (train[TARGET] == ">50K").astype(int)
    X_test, y_test = test[NUM_COLS + CAT_COLS], (test[TARGET] == ">50K").astype(int)

    print(f"train: {X_train.shape}, test: {X_test.shape}")
    print(f"train 양성비율: {y_train.mean():.4f}, test 양성비율: {y_test.mean():.4f}")

    pipeline = build_pipeline()

    t0 = time.perf_counter()
    pipeline.fit(X_train, y_train)
    train_time = time.perf_counter() - t0

    result = evaluate(pipeline, X_test, y_test)
    result["train_time_sec"] = train_time

    print("\n=== MLPClassifier (Neural Network) 평가 결과 ===")
    print(f"수렴까지 반복 횟수: {result['n_iter']} (max_iter=300, early_stopping=True)")
    print(f"학습 시간: {train_time:.2f}초")
    print(f"Accuracy       : {result['accuracy']:.4f}")
    print(f"Balanced Acc.  : {result['balanced_accuracy']:.4f}")
    print(f"Precision      : {result['precision']:.4f}")
    print(f"Recall         : {result['recall']:.4f}")
    print(f"F1             : {result['f1']:.4f}")
    print(f"ROC-AUC        : {result['roc_auc']:.4f}")
    print(f"혼동행렬 [[TN,FP],[FN,TP]]: {result['confusion_matrix']}")

    # 저장 + 재로드 검증 (root 보고서 7.4절과 동일한 절차)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "models").mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    reloaded = joblib.load(MODEL_PATH)
    pred_match = np.array_equal(reloaded.predict(X_test), pipeline.predict(X_test))
    proba_match = np.allclose(
        reloaded.predict_proba(X_test), pipeline.predict_proba(X_test), atol=1e-12
    )
    print(f"\n저장: {MODEL_PATH}")
    print(f"재로드 후 예측 일치: {pred_match}, 확률 allclose(atol=1e-12): {proba_match}")

    return result


if __name__ == "__main__":
    main()

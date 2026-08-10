"""
Adult Census Income - Support Vector Classification

전처리 완료된 Adult Census Income 데이터셋을 이용하여
소득이 >50K인지 여부를 예측하는 SVC 분류 모델을 학습한다.

전처리 데이터:
- adult_train_dropna.csv
- adult_test_dropna.csv

모델:
- sklearn.svm.SVC
- Numeric features: StandardScaler
- Categorical features: OneHotEncoder

평가:
- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix
"""

from pathlib import Path
import time

import joblib
import matplotlib.pyplot as plt
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC


# ============================================================
# 0. 경로 및 설정
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parents[1]  # notebooks/legacy/ 아래이므로 두 단계 위
DATA_DIR = PROJECT_ROOT / "data"

TRAIN_PATH = DATA_DIR / "adult_train_dropna.csv"
TEST_PATH = DATA_DIR / "adult_test_dropna.csv"

MODEL_DIR = PROJECT_ROOT / "outputs" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

MODEL_PATH = MODEL_DIR / "svc_adult_model.joblib"
CONFUSION_MATRIX_PATH = OUTPUT_DIR / "svc_confusion_matrix.png"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# 1. 데이터 로딩
# ============================================================

def load_data():
    print("=" * 70)
    print("1. 데이터 로딩")
    print("=" * 70)

    train_df = pd.read_csv(TRAIN_PATH)
    test_df = pd.read_csv(TEST_PATH)

    print(f"Train shape: {train_df.shape}")
    print(f"Test shape : {test_df.shape}")

    print("\n[Train 데이터]")
    print(train_df.head())

    print("\n[Test 데이터]")
    print(test_df.head())

    return train_df, test_df


# ============================================================
# 2. 데이터 상태 확인
# ============================================================

def check_data(train_df, test_df):
    print("\n" + "=" * 70)
    print("2. 데이터 상태 확인")
    print("=" * 70)

    print("\n[Train 결측치]")
    print(train_df.isna().sum())

    print("\n[Test 결측치]")
    print(test_df.isna().sum())

    print("\n[중복 행]")
    print(f"Train duplicate rows: {train_df.duplicated().sum()}")
    print(f"Test duplicate rows : {test_df.duplicated().sum()}")

    print("\n[Train Target 분포]")
    print(train_df["income"].value_counts())

    print("\n[Train Target 비율]")
    print(
        train_df["income"]
        .value_counts(normalize=True)
        .mul(100)
        .round(2)
    )


# ============================================================
# 3. X / y 분리
# ============================================================

def split_features_target(train_df, test_df):
    print("\n" + "=" * 70)
    print("3. Feature / Target 분리")
    print("=" * 70)

    X_train = train_df.drop(columns=["income"])
    X_test = test_df.drop(columns=["income"])

    # >50K = 1, <=50K = 0
    y_train = (train_df["income"] == ">50K").astype(int)
    y_test = (test_df["income"] == ">50K").astype(int)

    print(f"X_train: {X_train.shape}")
    print(f"X_test : {X_test.shape}")
    print(f"y_train: {y_train.shape}")
    print(f"y_test : {y_test.shape}")

    print("\nTarget encoding")
    print("0 = <=50K")
    print("1 = >50K")

    return X_train, X_test, y_train, y_test


# ============================================================
# 4. 전처리 Pipeline 구성
# ============================================================

def build_svc_pipeline(X_train):
    print("\n" + "=" * 70)
    print("4. SVC Pipeline 구성")
    print("=" * 70)

    numeric_features = (
        X_train
        .select_dtypes(include="number")
        .columns
        .tolist()
    )

    categorical_features = (
        X_train
        .select_dtypes(exclude="number")
        .columns
        .tolist()
    )

    print("\n[Numeric Features]")
    for column in numeric_features:
        print(f"- {column}")

    print("\n[Categorical Features]")
    for column in categorical_features:
        print(f"- {column}")

    # --------------------------------------------------------
    # Numeric
    # --------------------------------------------------------

    # SVC는 feature scale에 민감하기 때문에
    # 수치형 변수에 StandardScaler 적용
    numeric_transformer = Pipeline(
        steps=[
            (
                "scaler",
                StandardScaler(),
            ),
        ]
    )

    # --------------------------------------------------------
    # Categorical
    # --------------------------------------------------------

    # 범주형 변수는 One-Hot Encoding
    #
    # handle_unknown="ignore"
    # → Test에 Train에서 보지 못한 category가 등장해도
    #   오류를 발생시키지 않음
    categorical_transformer = Pipeline(
        steps=[
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore",
                ),
            ),
        ]
    )

    # --------------------------------------------------------
    # ColumnTransformer
    # --------------------------------------------------------

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "num",
                numeric_transformer,
                numeric_features,
            ),
            (
                "cat",
                categorical_transformer,
                categorical_features,
            ),
        ]
    )

    # --------------------------------------------------------
    # SVC
    # --------------------------------------------------------

    svc = SVC(
        kernel="rbf",
        C=1.0,
        gamma="scale",
    )

    model = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "classifier",
                svc,
            ),
        ]
    )

    print("\nSVC 설정")
    print("- kernel = rbf")
    print("- C = 1.0")
    print("- gamma = scale")

    return model


# ============================================================
# 5. 모델 학습
# ============================================================

def train_model(
    model,
    X_train,
    y_train,
):
    print("\n" + "=" * 70)
    print("5. SVC 모델 학습")
    print("=" * 70)

    start_time = time.perf_counter()

    model.fit(
        X_train,
        y_train,
    )

    training_time = (
        time.perf_counter()
        - start_time
    )

    print(
        f"학습 시간: "
        f"{training_time:.2f}초"
    )

    return model, training_time


# ============================================================
# 6. 예측 및 평가
# ============================================================

def evaluate_model(
    model,
    X_test,
    y_test,
):
    print("\n" + "=" * 70)
    print("6. SVC 모델 평가")
    print("=" * 70)

    start_time = time.perf_counter()

    y_pred = model.predict(X_test)

    prediction_time = (
        time.perf_counter()
        - start_time
    )

    accuracy = accuracy_score(
        y_test,
        y_pred,
    )

    precision = precision_score(
        y_test,
        y_pred,
    )

    recall = recall_score(
        y_test,
        y_pred,
    )

    f1 = f1_score(
        y_test,
        y_pred,
    )

    print(
        f"\nAccuracy : "
        f"{accuracy:.4f}"
    )

    print(
        f"Precision: "
        f"{precision:.4f}"
    )

    print(
        f"Recall   : "
        f"{recall:.4f}"
    )

    print(
        f"F1 Score : "
        f"{f1:.4f}"
    )

    print(
        f"\nPrediction Time: "
        f"{prediction_time:.2f}초"
    )

    print("\n[Classification Report]")

    print(
        classification_report(
            y_test,
            y_pred,
            target_names=[
                "<=50K",
                ">50K",
            ],
        )
    )

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "prediction_time": prediction_time,
        "y_pred": y_pred,
    }


# ============================================================
# 7. Confusion Matrix 저장
# ============================================================

def save_confusion_matrix(
    y_test,
    y_pred,
):
    print("\n" + "=" * 70)
    print("7. Confusion Matrix")
    print("=" * 70)

    cm = confusion_matrix(
        y_test,
        y_pred,
    )

    print(cm)

    display = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=[
            "<=50K",
            ">50K",
        ],
    )

    display.plot()

    plt.title(
        "SVC Confusion Matrix"
    )

    plt.tight_layout()

    plt.savefig(
        CONFUSION_MATRIX_PATH,
        dpi=300,
        bbox_inches="tight",
    )

    plt.close()

    print(
        "Confusion Matrix 저장 완료: "
        f"{CONFUSION_MATRIX_PATH}"
    )


# ============================================================
# 8. 모델 저장
# ============================================================

def save_model(model):
    print("\n" + "=" * 70)
    print("8. 모델 저장")
    print("=" * 70)

    joblib.dump(
        model,
        MODEL_PATH,
    )

    print(
        f"모델 저장 완료: "
        f"{MODEL_PATH}"
    )


# ============================================================
# 9. Main
# ============================================================

def main():

    # 1. 데이터 로딩
    train_df, test_df = load_data()

    # 2. 데이터 상태 확인
    check_data(
        train_df,
        test_df,
    )

    # 3. X / y
    (
        X_train,
        X_test,
        y_train,
        y_test,
    ) = split_features_target(
        train_df,
        test_df,
    )

    # 4. Pipeline
    model = build_svc_pipeline(
        X_train
    )

    # 5. 학습
    model, training_time = train_model(
        model,
        X_train,
        y_train,
    )

    # 6. 평가
    metrics = evaluate_model(
        model,
        X_test,
        y_test,
    )

    # 7. Confusion Matrix
    save_confusion_matrix(
        y_test,
        metrics["y_pred"],
    )

    # 8. 모델 저장
    save_model(model)

    # 최종 요약
    print("\n" + "=" * 70)
    print("SVC 최종 결과")
    print("=" * 70)

    print(
        f"Training Time : "
        f"{training_time:.2f} sec"
    )

    print(
        f"Accuracy      : "
        f"{metrics['accuracy']:.4f}"
    )

    print(
        f"Precision     : "
        f"{metrics['precision']:.4f}"
    )

    print(
        f"Recall        : "
        f"{metrics['recall']:.4f}"
    )

    print(
        f"F1 Score      : "
        f"{metrics['f1']:.4f}"
    )

    print("\nSVC 분석 완료")


if __name__ == "__main__":
    main()

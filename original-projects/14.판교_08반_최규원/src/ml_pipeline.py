# --------------------------------------------------
# 파일명   : ml_pipeline.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : 전처리 + 모델 학습을 하나로 묶은 sklearn Pipeline 구성 · 평가 · 저장
# 설명     : ColumnTransformer로 수치형/범주형 전처리를 정의하고 분류 모델과 묶어
#            학습·평가하며, 민감 속성별 성능(공정성)을 점검하고 joblib으로 저장한 뒤
#            재로딩 예측이 일치하는지까지 검증한다.
# 변경내역 : 2026-08-07 윤동현 - 인터페이스(값 객체·시그니처) 골격 작성
#            2026-08-07 윤동현 - 후보 모델 비교·공정성 점검·모델 저장 구현
# --------------------------------------------------

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import cast

import joblib
import numpy as np
import pandas as pd
from sklearn.base import ClassifierMixin
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC
from xgboost import XGBClassifier

from config import (
    CATEGORICAL_COLUMNS,
    MODEL_PATH,
    NUMERIC_COLUMNS,
    POSITIVE_LABEL,
    RANDOM_STATE,
    SENSITIVE_COLUMNS,
    TARGET_COLUMN,
    TEST_SIZE,
)

logger = logging.getLogger(__name__)

# fnlwgt는 인구조사 표본 가중치(그 행이 대표하는 인구 수)이지 개인의 속성이 아니다.
# 개인 소득을 예측하는 피처로 쓰면 안 되므로 학습 대상에서 제외한다.
FEATURE_NUMERIC: list[str] = [c for c in NUMERIC_COLUMNS if c != "fnlwgt"]
FEATURE_CATEGORICAL: list[str] = list(CATEGORICAL_COLUMNS)

# 주 선정 지표. 양성 클래스가 약 25%인 불균형 데이터라 accuracy는 변별력이 떨어진다.
PRIMARY_METRIC = "f1"

# 분모가 0인 집단(예측 양성이 하나도 없는 소수 집단)에서 경고 대신 0을 쓴다.
# sklearn 문서는 0/1/np.nan을 허용하지만 타입 힌트가 str로만 선언되어 있어 cast로 맞춘다.
ZERO_DIVISION = cast(str, 0)


# --------------------------------------------------
# 클래스명 : Metrics
# 목적     : 이진 분류 평가지표를 담는 값 객체
# --------------------------------------------------
@dataclass
class Metrics:
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float

    # --------------------------------------------------
    # 함수명 : as_dict
    # 목적   : 지표를 출력·리포트용 딕셔너리로 변환
    # 매개변수: 없음
    # 반환값 : dict[str, float] - 지표명 → 값
    # --------------------------------------------------
    def as_dict(self) -> dict[str, float]:
        return vars(self).copy()


# --------------------------------------------------
# 클래스명 : ModelCandidate
# 목적     : 비교 대상 모델 하나의 이름과 평가지표를 담는 값 객체
# --------------------------------------------------
@dataclass
class ModelCandidate:
    name: str
    metrics: Metrics


# --------------------------------------------------
# 클래스명 : FairnessGroup
# 목적     : 민감 속성 집단 하나에 대한 성능 점검 결과를 담는 값 객체
# --------------------------------------------------
@dataclass
class FairnessGroup:
    attribute: str
    group: str
    size: int
    actual_positive_rate: float
    predicted_positive_rate: float
    recall: float
    precision: float


# --------------------------------------------------
# 클래스명 : MlResult
# 목적     : 학습·평가·저장 단계의 전체 결과를 담는 값 객체
# --------------------------------------------------
@dataclass
class MlResult:
    model_name: str
    train_size: int
    test_size: int
    feature_count: int
    metrics: Metrics
    majority_baseline_accuracy: float
    report_text: str
    model_path: Path
    reload_verified: bool
    candidates: list[ModelCandidate] = field(default_factory=list)
    fairness: list[FairnessGroup] = field(default_factory=list)


# --------------------------------------------------
# 함수명 : build_preprocessor
# 목적   : 수치형 표준화 + 범주형 원핫 인코딩을 묶은 전처리기 생성
# 매개변수: 없음
# 반환값 : ColumnTransformer - 후보 모델이 공통으로 사용하는 전처리기
# --------------------------------------------------
def build_preprocessor() -> ColumnTransformer:
    # 매 호출마다 새로 만든다 — 하나를 돌려쓰면 모델 간에 fit 상태가 공유된다.
    return ColumnTransformer(
        [
            ("num", StandardScaler(), FEATURE_NUMERIC),
            # 테스트 분할에만 나타나는 범주(희귀 native-country 등)에서 죽지 않도록 ignore.
            ("cat", OneHotEncoder(handle_unknown="ignore"), FEATURE_CATEGORICAL),
        ]
    )


# --------------------------------------------------
# 함수명 : build_models
# 목적   : 비교할 후보 분류기를 이름 → 미학습 모델로 정의
# 매개변수: 없음
# 반환값 : dict[str, ClassifierMixin] - 후보 모델 목록
# 비고   : 하이퍼파라미터는 notebooks/model_selection.ipynb의 비교 조건을 그대로 옮겼다.
# --------------------------------------------------
def build_models() -> dict[str, ClassifierMixin]:
    return {
        "LogisticRegression": LogisticRegression(
            max_iter=5000, solver="saga", random_state=RANDOM_STATE
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=300, min_samples_leaf=2, n_jobs=-1, random_state=RANDOM_STATE
        ),
        # probability=True는 내부 5-fold Platt 스케일링 때문에 몇 배 느려진다.
        # ROC-AUC는 순위 기반 지표라 decision_function 점수로 계산해도 값이 같다.
        "SVC(RBF)": SVC(C=1.0, kernel="rbf", gamma="scale", random_state=RANDOM_STATE),
        "MLP": MLPClassifier(
            hidden_layer_sizes=(128, 64), max_iter=300, early_stopping=True,
            random_state=RANDOM_STATE,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=400, max_depth=6, learning_rate=0.1, subsample=0.9,
            colsample_bytree=0.9, eval_metric="logloss", random_state=RANDOM_STATE,
        ),
    }


# --------------------------------------------------
# 함수명 : rank_scores
# 목적   : ROC-AUC 계산용 양성 클래스 점수를 추출
# 매개변수: pipeline(Pipeline) - 학습된 파이프라인, features(pd.DataFrame) - 입력 피처
# 반환값 : np.ndarray - 양성 클래스 확률 또는 결정 함수 점수
# --------------------------------------------------
def rank_scores(pipeline: Pipeline, features: pd.DataFrame) -> np.ndarray:
    if hasattr(pipeline, "predict_proba"):
        return np.asarray(pipeline.predict_proba(features))[:, 1]
    return np.asarray(pipeline.decision_function(features))


# --------------------------------------------------
# 함수명 : evaluate
# 목적   : 예측 결과로부터 이진 분류 평가지표를 계산
# 매개변수: y_true(pd.Series) - 실제 라벨, y_pred(np.ndarray) - 예측 라벨,
#           y_score(np.ndarray) - 양성 클래스 점수
# 반환값 : Metrics - 평가지표 값 객체
# --------------------------------------------------
def evaluate(y_true: pd.Series, y_pred: np.ndarray, y_score: np.ndarray) -> Metrics:
    return Metrics(
        accuracy=float(accuracy_score(y_true, y_pred)),
        precision=float(precision_score(y_true, y_pred, zero_division=ZERO_DIVISION)),
        recall=float(recall_score(y_true, y_pred, zero_division=ZERO_DIVISION)),
        f1=float(f1_score(y_true, y_pred, zero_division=ZERO_DIVISION)),
        roc_auc=float(roc_auc_score(y_true, y_score)),
    )


# --------------------------------------------------
# 함수명 : assess_fairness
# 목적   : 민감 속성 집단별로 실제/예측 고소득 비율과 재현율·정밀도를 비교
# 매개변수: frame(pd.DataFrame) - 민감 속성 + actual/predicted 컬럼을 가진 테스트 데이터
# 반환값 : list[FairnessGroup] - 속성·집단별 점검 결과
# --------------------------------------------------
def assess_fairness(frame: pd.DataFrame) -> list[FairnessGroup]:
    # ----------------------------------------------
    # 함수명 : summarize_group
    # 목적   : 한 집단의 지표를 계산 (속성 x 집단 이중 루프의 중복 제거용 헬퍼)
    # 매개변수: attribute(str) - 민감 속성명, group(str) - 집단명, part(pd.DataFrame) - 부분집합
    # 반환값 : FairnessGroup - 집단 하나의 점검 결과
    # ----------------------------------------------
    def summarize_group(attribute: str, group: str, part: pd.DataFrame) -> FairnessGroup:
        actual, predicted = part["actual"], part["predicted"]
        return FairnessGroup(
            attribute=attribute,
            group=group,
            size=len(part),
            actual_positive_rate=float(actual.mean()),
            predicted_positive_rate=float(predicted.mean()),
            recall=float(recall_score(actual, predicted, zero_division=ZERO_DIVISION)),
            precision=float(precision_score(actual, predicted, zero_division=ZERO_DIVISION)),
        )

    return [
        summarize_group(attribute, str(group), part)
        for attribute in SENSITIVE_COLUMNS
        for group, part in frame.groupby(attribute)
    ]


# --------------------------------------------------
# 함수명 : save_and_verify
# 목적   : 학습된 파이프라인을 저장하고 재로딩 예측이 원본과 일치하는지 확인
# 매개변수: pipeline(Pipeline) - 저장할 파이프라인, features(pd.DataFrame) - 검증용 입력,
#           expected(np.ndarray) - 저장 전 예측 결과, path(Path) - 저장할 모델 파일 경로
# 반환값 : bool - 재로딩 예측이 완전히 일치하면 True
# 예외   : OSError(저장·로딩 실패) 시 로깅 후 재발생
# --------------------------------------------------
def save_and_verify(
    pipeline: Pipeline,
    features: pd.DataFrame,
    expected: np.ndarray,
    path: Path,
) -> bool:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(pipeline, path)
        reloaded = joblib.load(path)
    except OSError as exc:
        logger.error("모델 저장/로딩 실패: %s - %s", path, exc)
        raise

    # 직렬화가 깨진 모델을 리포트 단계로 넘기지 않기 위한 안전장치다.
    verified = bool(np.array_equal(reloaded.predict(features), expected))
    if not verified:
        logger.error("재로딩한 모델의 예측이 저장 전과 다릅니다: %s", path)
    return verified


# --------------------------------------------------
# 함수명 : train_and_evaluate
# 목적   : Pipeline을 학습·평가하고 최종 모델을 저장한 뒤 결과를 반환
# 매개변수: df(pd.DataFrame) - 정제된 데이터프레임
# 반환값 : MlResult - 학습·평가 결과 값 객체
# 예외   : 필수 컬럼 누락 시 KeyError, 타깃 라벨이 한 종류뿐이면 ValueError
# --------------------------------------------------
def train_and_evaluate(df: pd.DataFrame) -> MlResult:
    required = [*FEATURE_NUMERIC, *FEATURE_CATEGORICAL, TARGET_COLUMN]
    missing_columns = [c for c in required if c not in df]
    if missing_columns:
        logger.error("모델 학습에 필요한 컬럼이 없습니다: %s", missing_columns)
        raise KeyError(f"필수 컬럼 누락: {missing_columns}")

    features = df[[*FEATURE_NUMERIC, *FEATURE_CATEGORICAL]]
    # XGBoost는 문자열 라벨을 받지 않으므로 양성(>50K)을 1로 두는 이진 정수로 바꾼다.
    target = (df[TARGET_COLUMN] == POSITIVE_LABEL).astype(int)
    if target.nunique() < 2:
        logger.error("타깃 라벨이 한 종류뿐이라 분류 학습을 할 수 없습니다")
        raise ValueError(f"학습 불가 — {TARGET_COLUMN}에 두 클래스가 모두 필요합니다")

    # 양성 클래스가 약 25%인 불균형 데이터라 분할에서 비율이 흔들리지 않게 stratify한다.
    # train_test_split의 반환 타입은 list[Unknown]으로 추론되므로 cast로 좁힌다.
    x_train, x_test, y_train, y_test = cast(
        tuple[pd.DataFrame, pd.DataFrame, "pd.Series[int]", "pd.Series[int]"],
        train_test_split(
            features, target, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=target
        ),
    )

    fitted: dict[str, Pipeline] = {}
    candidates: list[ModelCandidate] = []
    for name, model in build_models().items():
        # 전처리를 Pipeline 안에 두어야 fit이 학습 데이터로만 이뤄진다 (스케일러 누수 방지).
        pipeline = Pipeline([("prep", build_preprocessor()), ("model", model)])
        started = time.perf_counter()
        pipeline.fit(x_train, y_train)
        elapsed = time.perf_counter() - started

        metrics = evaluate(y_test, pipeline.predict(x_test), rank_scores(pipeline, x_test))
        fitted[name] = pipeline
        candidates.append(ModelCandidate(name=name, metrics=metrics))
        logger.info(
            "%s 학습 완료 - f1=%.4f auc=%.4f (%.1fs)",
            name, metrics.f1, metrics.roc_auc, elapsed,
        )

    best = max(candidates, key=lambda c: getattr(c.metrics, PRIMARY_METRIC))
    best_pipeline = fitted[best.name]
    predictions = np.asarray(best_pipeline.predict(x_test))

    fairness_frame = x_test[SENSITIVE_COLUMNS].assign(
        actual=y_test.to_numpy(), predicted=predictions
    )
    preprocessor = best_pipeline.named_steps["prep"]
    model_path = MODEL_PATH

    result = MlResult(
        model_name=best.name,
        train_size=len(x_train),
        test_size=len(x_test),
        feature_count=len(preprocessor.get_feature_names_out()),
        metrics=best.metrics,
        # 전부 다수 클래스로 찍었을 때의 정확도 — 모델이 이보다 못하면 학습이 의미 없다.
        majority_baseline_accuracy=float(max(y_test.mean(), 1 - y_test.mean())),
        # output_dict 기본값이 False라 항상 str이지만, 반환 타입이 str|dict로 선언되어 있다.
        report_text=cast(
            str,
            classification_report(
                y_test, predictions, target_names=["<=50K", ">50K"], zero_division=ZERO_DIVISION
            ),
        ),
        model_path=model_path,
        reload_verified=save_and_verify(best_pipeline, x_test, predictions, model_path),
        candidates=sorted(candidates, key=lambda c: c.metrics.f1, reverse=True),
        fairness=assess_fairness(fairness_frame),
    )
    logger.info(
        "선정 모델: %s (f1=%.4f, auc=%.4f) — 저장: %s",
        result.model_name, result.metrics.f1, result.metrics.roc_auc, result.model_path,
    )
    return result

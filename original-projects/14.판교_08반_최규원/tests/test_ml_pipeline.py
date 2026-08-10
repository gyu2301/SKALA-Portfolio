# --------------------------------------------------
# 파일명   : test_ml_pipeline.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : ML Pipeline 모듈(ml_pipeline.py)의 학습·평가·저장 동작 검증
# 설명     : 인메모리 픽스처와 가벼운 후보 모델 하나로 train_and_evaluate 전 과정을 돌려
#            지표·공정성 점검·모델 저장·재로딩 검증을 확인하고, 컬럼 누락과 단일 클래스
#            같은 실패 경로도 함께 본다. 네트워크 없이 실행된다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성
# --------------------------------------------------

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

import config
import ml_pipeline


# --------------------------------------------------
# 함수명 : make_frame
# 목적   : 학습 가능한 최소 크기의 정제된 데이터프레임 픽스처 생성
# 매개변수: rows(int) - 소득 그룹당 행 수
# 반환값 : pd.DataFrame - config 스키마를 만족하는 데이터프레임
# --------------------------------------------------
def make_frame(rows: int = 120) -> pd.DataFrame:
    rng = np.random.default_rng(config.RANDOM_STATE)
    total = rows * 2
    # 고소득 집단의 수치형 값을 높게 잡아 모델이 학습할 신호를 만든다.
    frame = pd.DataFrame(
        {
            "age": np.concatenate([rng.normal(32, 4, rows), rng.normal(48, 4, rows)]),
            "fnlwgt": rng.normal(180000, 1000, total),
            "education-num": np.concatenate([rng.normal(9, 1, rows), rng.normal(14, 1, rows)]),
            "capital-gain": np.concatenate([np.zeros(rows), rng.normal(2000, 300, rows)]),
            "capital-loss": np.zeros(total),
            "hours-per-week": np.concatenate([rng.normal(36, 3, rows), rng.normal(48, 3, rows)]),
            config.TARGET_COLUMN: [config.NEGATIVE_LABEL] * rows + [config.POSITIVE_LABEL] * rows,
        }
    )
    for column in config.CATEGORICAL_COLUMNS:
        # 범주형은 두 수준을 번갈아 넣어 원핫 인코딩 경로가 실제로 동작하게 한다.
        frame[column] = [f"{column}-A", f"{column}-B"] * (total // 2)
    return frame


# --------------------------------------------------
# 함수명 : light_models
# 목적   : 테스트를 빠르게 유지하기 위한 단일 경량 후보 모델 목록
# 매개변수: 없음
# 반환값 : dict[str, LogisticRegression] - 후보 모델 하나
# --------------------------------------------------
def light_models() -> dict[str, LogisticRegression]:
    return {"LogisticRegression": LogisticRegression(max_iter=1000, random_state=42)}


# --------------------------------------------------
# 함수명 : trained
# 목적   : 경량 모델과 임시 저장 경로로 train_and_evaluate를 실행하는 공용 픽스처
# 매개변수: tmp_path(Path) - pytest 임시 디렉토리, monkeypatch - pytest 패치 픽스처
# 반환값 : MlResult - 학습 결과
# --------------------------------------------------
@pytest.fixture
def trained(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> ml_pipeline.MlResult:
    monkeypatch.setattr(ml_pipeline, "build_models", light_models)
    monkeypatch.setattr(ml_pipeline, "MODEL_PATH", tmp_path / "model.pkl")
    return ml_pipeline.train_and_evaluate(make_frame())


# --------------------------------------------------
# 함수명 : test_fnlwgt_is_excluded_from_features
# 목적   : 표본 가중치 컬럼이 학습 피처에서 빠져 있는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_fnlwgt_is_excluded_from_features():
    assert "fnlwgt" not in ml_pipeline.FEATURE_NUMERIC
    assert set(ml_pipeline.FEATURE_NUMERIC) < set(config.NUMERIC_COLUMNS)


# --------------------------------------------------
# 함수명 : test_split_sizes_follow_config
# 목적   : 학습/테스트 분할 크기가 config.TEST_SIZE 비율을 따르는지 검증
# 매개변수: trained(MlResult) - 학습 결과 픽스처
# 반환값 : None
# --------------------------------------------------
def test_split_sizes_follow_config(trained: ml_pipeline.MlResult):
    total = trained.train_size + trained.test_size
    assert total == 240
    assert trained.test_size == round(total * config.TEST_SIZE)


# --------------------------------------------------
# 함수명 : test_metrics_are_within_valid_range
# 목적   : 모든 평가지표가 0~1 범위에 있고 베이스라인을 넘는지 검증
# 매개변수: trained(MlResult) - 학습 결과 픽스처
# 반환값 : None
# --------------------------------------------------
def test_metrics_are_within_valid_range(trained: ml_pipeline.MlResult):
    assert all(0.0 <= value <= 1.0 for value in trained.metrics.as_dict().values())
    # 신호를 넣어 만든 픽스처이므로 다수 클래스만 찍는 베이스라인보다는 나아야 한다.
    assert trained.metrics.accuracy > trained.majority_baseline_accuracy


# --------------------------------------------------
# 함수명 : test_model_is_saved_and_reload_verified
# 목적   : 모델 파일이 저장되고 재로딩 예측 일치 검증까지 통과하는지 확인
# 매개변수: trained(MlResult) - 학습 결과 픽스처
# 반환값 : None
# --------------------------------------------------
def test_model_is_saved_and_reload_verified(trained: ml_pipeline.MlResult):
    assert trained.model_path.exists()
    assert trained.reload_verified


# --------------------------------------------------
# 함수명 : test_fairness_covers_every_sensitive_group
# 목적   : 민감 속성별 집단이 모두 공정성 점검 결과에 포함되는지 검증
# 매개변수: trained(MlResult) - 학습 결과 픽스처
# 반환값 : None
# --------------------------------------------------
def test_fairness_covers_every_sensitive_group(trained: ml_pipeline.MlResult):
    attributes = {group.attribute for group in trained.fairness}
    assert attributes == set(config.SENSITIVE_COLUMNS)
    assert sum(group.size for group in trained.fairness) == trained.test_size * len(attributes)


# --------------------------------------------------
# 함수명 : test_missing_column_raises_key_error
# 목적   : 피처 컬럼이 빠지면 KeyError로 즉시 실패하는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_missing_column_raises_key_error():
    with pytest.raises(KeyError):
        ml_pipeline.train_and_evaluate(make_frame().drop(columns=["occupation"]))


# --------------------------------------------------
# 함수명 : test_single_class_raises_value_error
# 목적   : 타깃이 한 클래스뿐이면 ValueError를 내는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_single_class_raises_value_error():
    frame = make_frame()
    frame[config.TARGET_COLUMN] = config.NEGATIVE_LABEL
    with pytest.raises(ValueError):
        ml_pipeline.train_and_evaluate(frame)


# --------------------------------------------------
# 함수명 : test_empty_frame_raises_key_error
# 목적   : 빈 데이터프레임에서 조용히 통과하지 않고 실패하는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_empty_frame_raises_key_error():
    with pytest.raises(KeyError):
        ml_pipeline.train_and_evaluate(pd.DataFrame())

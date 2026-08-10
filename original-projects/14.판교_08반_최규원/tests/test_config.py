# --------------------------------------------------
# 파일명   : test_config.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : 공용 스키마 상수(config.py)의 일관성 검증
# 설명     : 컬럼 목록과 수치형/범주형 구분, 타깃 라벨이 서로 어긋나지 않는지 확인한다.
#            각 모듈이 config를 신뢰하고 쓰므로 여기서 먼저 깨지는 것을 잡는다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성
# --------------------------------------------------

from __future__ import annotations

import config


# --------------------------------------------------
# 함수명 : test_column_partition_covers_all_columns
# 목적   : 수치형 + 범주형 + 타깃이 전체 컬럼 목록과 정확히 일치하는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_column_partition_covers_all_columns():
    partition = set(config.NUMERIC_COLUMNS) | set(config.CATEGORICAL_COLUMNS) | {
        config.TARGET_COLUMN
    }
    assert partition == set(config.COLUMN_NAMES)


# --------------------------------------------------
# 함수명 : test_numeric_and_categorical_do_not_overlap
# 목적   : 한 컬럼이 수치형과 범주형에 동시에 들어가 있지 않은지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_numeric_and_categorical_do_not_overlap():
    assert not set(config.NUMERIC_COLUMNS) & set(config.CATEGORICAL_COLUMNS)


# --------------------------------------------------
# 함수명 : test_sensitive_columns_are_categorical
# 목적   : 공정성 점검에 쓰는 민감 속성이 실제 범주형 컬럼인지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_sensitive_columns_are_categorical():
    assert set(config.SENSITIVE_COLUMNS) <= set(config.CATEGORICAL_COLUMNS)


# --------------------------------------------------
# 함수명 : test_labels_are_distinct
# 목적   : 양성/음성 라벨이 서로 다르고 비어 있지 않은지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_labels_are_distinct():
    assert config.POSITIVE_LABEL != config.NEGATIVE_LABEL
    assert config.POSITIVE_LABEL and config.NEGATIVE_LABEL

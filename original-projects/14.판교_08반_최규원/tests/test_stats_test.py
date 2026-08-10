# --------------------------------------------------
# 파일명   : test_stats_test.py
# 작성자   : 윤동현
# 작성일자 : 2026-08-07
# 목적     : 통계 검정 모듈(stats_test.py)의 정상·실패 동작 검증
# 설명     : 인메모리 픽스처로 Welch t-test와 카이제곱 검정의 결과·해석을 확인하고,
#            컬럼 누락·한쪽 집단 부재 같은 실패 경로가 제대로 예외를 내는지 본다.
#            네트워크 없이 실행된다.
# 변경내역 : 2026-08-07 윤동현 - 최초 작성
# --------------------------------------------------

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

import config
import stats_test


# --------------------------------------------------
# 함수명 : make_frame
# 목적   : 소득 그룹 간 차이가 뚜렷한 검정용 데이터프레임 생성
# 매개변수: rows(int) - 그룹당 행 수
# 반환값 : pd.DataFrame - 필수 컬럼을 모두 갖춘 픽스처
# --------------------------------------------------
def make_frame(rows: int = 200) -> pd.DataFrame:
    rng = np.random.default_rng(config.RANDOM_STATE)
    # 고소득 집단의 age/hours를 의도적으로 높게 만들어 유의한 차이가 나오게 한다.
    frame = pd.DataFrame(
        {
            "age": np.concatenate([rng.normal(35, 5, rows), rng.normal(50, 5, rows)]),
            "fnlwgt": rng.normal(180000, 1000, rows * 2),
            "education-num": np.concatenate([rng.normal(9, 1, rows), rng.normal(13, 1, rows)]),
            "capital-gain": np.concatenate([np.zeros(rows), rng.normal(3000, 500, rows)]),
            "capital-loss": np.zeros(rows * 2),
            "hours-per-week": np.concatenate([rng.normal(38, 3, rows), rng.normal(46, 3, rows)]),
            "sex": ["Female"] * rows + ["Male"] * rows,
            config.TARGET_COLUMN: [config.NEGATIVE_LABEL] * rows + [config.POSITIVE_LABEL] * rows,
        }
    )
    return frame


# --------------------------------------------------
# 함수명 : test_ttest_runs_for_every_numeric_column
# 목적   : 모든 수치형 컬럼에 대해 t-test 결과가 생성되는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_ttest_runs_for_every_numeric_column():
    results = stats_test.run_statistical_tests(make_frame())
    assert [t.variable for t in results.ttests] == config.NUMERIC_COLUMNS


# --------------------------------------------------
# 함수명 : test_clear_difference_is_significant
# 목적   : 집단 간 차이를 크게 준 변수에서 유의 판정과 해석 문장이 나오는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_clear_difference_is_significant():
    results = stats_test.run_statistical_tests(make_frame())
    age = next(t for t in results.ttests if t.variable == "age")
    assert age.p_value < config.ALPHA
    assert age.significant
    assert age.mean_b > age.mean_a
    assert age.interpretation.endswith("유의하다.")


# --------------------------------------------------
# 함수명 : test_no_difference_is_not_significant
# 목적   : 두 집단 분포가 같은 변수에서는 유의하지 않다고 판정하는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_no_difference_is_not_significant():
    frame = make_frame()
    # 두 집단에 완전히 동일한 값을 넣으면 평균 차이가 0이라 유의할 수 없다.
    frame["capital-loss"] = 100.0
    frame.loc[frame.index[::2], "capital-loss"] = 120.0
    result = next(
        t
        for t in stats_test.run_statistical_tests(frame).ttests
        if t.variable == "capital-loss"
    )
    assert not result.significant
    assert result.interpretation.endswith("유의하지 않다.")


# --------------------------------------------------
# 함수명 : test_chi_square_reports_expected_dof
# 목적   : 2x2 분할표의 자유도가 1로 계산되는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_chi_square_reports_expected_dof():
    chi = stats_test.run_statistical_tests(make_frame()).chi_square
    assert chi is not None
    assert chi.dof == 1
    assert chi.left == stats_test.CHI_SQUARE_COLUMN
    assert chi.right == config.TARGET_COLUMN


# --------------------------------------------------
# 함수명 : test_missing_column_raises_key_error
# 목적   : 필수 컬럼이 빠지면 KeyError로 즉시 실패하는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_missing_column_raises_key_error():
    frame = make_frame().drop(columns=["hours-per-week"])
    with pytest.raises(KeyError):
        stats_test.run_statistical_tests(frame)


# --------------------------------------------------
# 함수명 : test_single_income_group_raises_value_error
# 목적   : 한쪽 소득 집단에 표본이 없으면 ValueError를 내는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_single_income_group_raises_value_error():
    frame = make_frame()
    frame[config.TARGET_COLUMN] = config.NEGATIVE_LABEL
    with pytest.raises(ValueError):
        stats_test.run_statistical_tests(frame)


# --------------------------------------------------
# 함수명 : test_empty_frame_raises_key_error
# 목적   : 빈 데이터프레임에서도 조용히 통과하지 않고 실패하는지 검증
# 매개변수: 없음
# 반환값 : None
# --------------------------------------------------
def test_empty_frame_raises_key_error():
    with pytest.raises(KeyError):
        stats_test.run_statistical_tests(pd.DataFrame())

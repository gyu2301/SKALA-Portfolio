"""
==============================================================================
 프로그램명 : test_schema.py
 설명       : src/schema.py 의 WeatherRecord / validate_weather 검증
              로직이 실제로 정상값은 통과시키고 잘못된 값은 걸러내는지
              확인하는 pytest 단위 테스트
 작성자     : 최규원
 변경내역   : 2026-08-06  최초 작성
              2026-08-06  [버그 수정] 8번째 줄에 셸 명령 `pytest -v`가
                          코드처럼 섞여 들어가 있어 `pytest` 실행 시
                          "ModuleNotFoundError: No module named 'src'"가
                          아니라 이 줄에서 NameError로 수집(collection)
                          자체가 실패하고 있었음. 해당 줄을 삭제함.
                          (참고: 'src' 모듈을 못 찾는 문제 자체는 이 파일이
                          아니라 프로젝트 루트 pyproject.toml 에 pytest의
                          pythonpath 설정을 추가해서 별도로 해결함)
==============================================================================
"""

import pytest
from pydantic import ValidationError

from src.schema import WeatherRecord, validate_weather


def test_valid_record_passes():
    """정상 범위의 값(기온 24.1도, 강수확률 10%)은 검증을 통과해야 한다."""
    record = WeatherRecord(time="2026-08-06T00:00", temp_c=24.1, rain_prob=10)
    assert record.temp_c == 24.1


def test_out_of_range_rain_prob_raises():
    """강수확률은 0~100 범위인데, 150처럼 범위를 벗어나면

    Field(ge=0, le=100) 제약에 걸려 ValidationError 가 발생해야 한다.
    """
    with pytest.raises(ValidationError):
        WeatherRecord(time="2026-08-06T00:00", temp_c=24.1, rain_prob=150)


def test_missing_hourly_returns_error():
    """weather.hourly 필드가 없는(=API 응답 구조가 깨진) 경우,

    예외를 던져 전체를 중단시키는 대신 errors 리스트에 1건 기록하고
    valid는 빈 리스트로 반환해야 한다 (schema.py의 부분 실패 허용 정책).
    """
    valid, errors = validate_weather({"weather": {}})
    assert valid == []
    assert len(errors) == 1

"""
==============================================================================
 프로그램명 : schema.py
 설명       : 수집한 JSON에서 필요한 필드를 추출하고
              Pydantic v2 모델로 타입·범위를 검증하는 모듈
 작성자     : 최규원
 변경내역   : 2026-08-06  최초 작성
              2026-08-06  __main__ 데모 추가. 원래 이 파일은 클래스/함수
                          정의만 있어서 단독 실행해도 아무 출력이 없었음
                          (버그가 아니라 라이브러리 모듈이라 정상이긴함).
                          run_pipeline.py 나 pytest 없이도 검증 결과를
                          바로 확인할 수 있도록 데모 코드를 추가함.
==============================================================================
"""

from pydantic import BaseModel, Field, ValidationError


class WeatherRecord(BaseModel):
    """서울 시간대별 기상 레코드 1건에 대한 스키마.

    - time      : ISO 형식 시각 문자열 (빈 값 불가)
    - temp_c    : 섭씨 기온, 물리적으로 가능한 범위(-60 ~ 60)로 제한
    - rain_prob : 강수확률(%), 0~100 범위
    """

    time: str = Field(min_length=1, description="관측 시각")
    temp_c: float = Field(ge=-60, le=60, description="섭씨 기온")
    rain_prob: int = Field(ge=0, le=100, description="강수확률(%)")
    city: str | None = Field(default=None, description="도시명(부가 정보)")
    country: str | None = Field(default=None, description="국가명(부가 정보)")


def extract_context(raw: dict) -> dict[str, str | None]:
    """country / ipinfo 응답에서 부가 정보(국가명·도시명)를 안전하게 뽑는다.

    응답 구조가 달라지거나 오류가 섞여 있어도 None 으로 넘어가도록 처리.
    """
    country_json = raw.get("country", {}) or {}
    ip_json = raw.get("ipinfo", {}) or {}

    country_name = country_json.get("name") or country_json.get("countryName")
    city_name = ip_json.get("city")

    return {"country": country_name, "city": city_name}


def validate_weather(raw: dict) -> tuple[list[WeatherRecord], list[dict]]:
    """기상 API 응답을 행 단위로 펼친 뒤 검증하여 (성공목록, 오류목록)을 반환한다.

    Open-Meteo 는 컬럼별 리스트 형태이므로 zip 으로 행 구조로 변환한다.
    잘못된 행 하나 때문에 전체가 중단되지 않도록 건별로 예외를 처리한다.
    """
    valid: list[WeatherRecord] = []
    errors: list[dict] = []

    hourly = raw.get("weather", {}).get("hourly")
    if not hourly:
        errors.append({"row": -1, "error": "weather.hourly 필드 없음"})
        return valid, errors

    context = extract_context(raw)

    rows = zip(
        hourly.get("time", []),
        hourly.get("temperature_2m", []),
        hourly.get("precipitation_probability", []),
    )

    for index, (time_str, temp, rain) in enumerate(rows):
        try:
            # WeatherRecord 생성 시점에 Pydantic이 자동으로 타입/범위를 검사한다.
            # 여기서 실패하면 ValidationError 가 발생한다.
            record = WeatherRecord(
                time=time_str,
                temp_c=temp,
                rain_prob=rain,
                **context,
            )
            valid.append(record)
        except ValidationError as exc:
            # 한 행이 잘못됐다고 전체 반복을 멈추지 않고, 실패 내용만 기록한 뒤
            # 다음 행 검증을 계속 진행한다 (부분 실패를 허용하는 실무 패턴).
            errors.append({"row": index, "error": str(exc)})

    return valid, errors


if __name__ == "__main__":
    # 모듈 단독 실행 시 동작 확인용.
    # 이 파일은 클래스/함수 정의만 있어서 원래는 실행해도 출력이 없다.
    # 여기서는 실제 API 데이터로 검증을 돌려보고, 일부러 범위를 벗어난
    # 값도 넣어서 ValidationError 가 실제로 잡히는지 함께 보여준다.
    from src.collect import collect

    raw = collect()
    valid, errors = validate_weather(raw)
    print(f"검증 결과 -> 유효 {len(valid)}건 / 오류 {len(errors)}건")

    if valid:
        print("\n[유효 데이터 예시 1건]")
        print(valid[0])

    if errors:
        print("\n[오류 예시 1건]")
        print(errors[0])

    # 의도적으로 범위를 벗어난 값(rain_prob=150, 허용 범위 0~100)을 넣어
    # 검증 로직이 실제로 오류를 걸러내는지 확인한다.
    print("\n[의도적 오류 테스트] rain_prob=150 (0~100 범위 초과)")
    try:
        WeatherRecord(time="2026-08-06T00:00", temp_c=24.1, rain_prob=150)
    except ValidationError as exc:
        print(f"  -> 예상대로 ValidationError 발생:\n{exc}")

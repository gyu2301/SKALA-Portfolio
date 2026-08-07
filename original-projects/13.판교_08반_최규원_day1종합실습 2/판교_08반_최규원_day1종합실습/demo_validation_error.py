"""
==============================================================================
 프로그램명 : demo_validation_error.py
 설명       : 스키마 검증이 실제로 오류를 잡아내는지 확인하는 데모 스크립트.
              강수확률에 150%라는 불가능한 값을 일부러 넣어 ValidationError를 유도한다.
 작성자     : 최규원
 변경내역   : 2026-08-06  최초 작성
==============================================================================
"""

from src.schema import validate_weather

bad_raw = {
    "weather": {
        "hourly": {
            "time": ["2026-08-06T00:00", "2026-08-06T01:00", "2026-08-06T02:00"],
            "temperature_2m": [24.1, 23.8, 200.0],          # 200도 — 물리적으로 불가능
            "precipitation_probability": [10, 150, 50],      # 150% — 범위(0~100) 초과
        }
    },
    "country": {"name": "대한민국"},
    "ipinfo": {"city": "Seoul"},
}

valid, errors = validate_weather(bad_raw)
print(f"유효: {len(valid)}건, 오류: {len(errors)}건")
print("\n--- 오류 상세 ---")
for e in errors:
    print(e)

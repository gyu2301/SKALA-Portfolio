"""
==============================================================================
 프로그램명 : storage.py
 설명       : 검증 통과 데이터를 CSV / Parquet 두 형식으로 저장하고
              읽기·쓰기 소요 시간을 측정·비교하는 모듈
 작성자     : 최규원
 변경내역   : 2026-08-06  최초 작성
              2026-08-06  save_and_compare()에 name 파라미터를 추가함.
                          [이유] 원래는 파일명이 weather.csv/parquet로
                          고정돼 있어서, 대량 복제 데이터로 재측정하면
                          run_pipeline.py가 만든 실제 결과 파일을 덮어써
                          버리는 문제가 있었음. name 기본값은 "weather"로
                          두어 기존 동작은 그대로 유지함.
              2026-08-06  __main__ 데모 추가: 기본(72행) 비교 +
                          72,000행(1000배 복제) 비교를 함께 출력해서
                          "작은 데이터에서는 Parquet가 오히려 느리다"는
                          결과가 데이터 크기 때문임을 시각화하여 표현 해봄.
==============================================================================
"""

import time
from pathlib import Path

import pandas as pd

OUTPUT_DIR = Path("output")


def to_dataframe(records: list) -> pd.DataFrame:
    """Pydantic 모델 리스트를 DataFrame 으로 변환한다.

    model_dump() 로 dict 화하면 타입이 보장된 상태로 넘어간다.
    """
    return pd.DataFrame([r.model_dump() for r in records])


def measure(func, *args) -> tuple[object, float]:
    """함수 실행 결과와 소요 시간(초)을 함께 반환하는 헬퍼.

    CSV/Parquet 읽기·쓰기처럼 "실행하고 시간도 재야 하는" 호출이
    4번 반복되므로, 매번 perf_counter를 직접 쓰지 않도록 뽑아낸 함수다.
    """
    start = time.perf_counter()
    result = func(*args)
    return result, time.perf_counter() - start


def save_and_compare(df: pd.DataFrame, name: str = "weather") -> pd.DataFrame:
    """CSV·Parquet 저장 및 재읽기 시간을 측정하여 비교표를 반환한다.

    name 은 저장 파일명(prefix)이다. 대량 복제 데이터로 재측정할 때
    실제 파이프라인 결과 파일(weather.csv/parquet)을 덮어쓰지 않도록
    별도 이름(예: weather_big)을 줄 수 있게 파라미터로 뺐다.
    """
    OUTPUT_DIR.mkdir(exist_ok=True)
    csv_path = OUTPUT_DIR / f"{name}.csv"
    pq_path = OUTPUT_DIR / f"{name}.parquet"

    # --- 쓰기 시간 측정 ---
    _, csv_write = measure(lambda: df.to_csv(csv_path, index=False))
    _, pq_write = measure(lambda: df.to_parquet(pq_path, index=False))

    # --- 읽기 시간 측정 ---
    _, csv_read = measure(lambda: pd.read_csv(csv_path))
    _, pq_read = measure(lambda: pd.read_parquet(pq_path))

    # --- 파일 크기 ---
    csv_size = csv_path.stat().st_size / 1024
    pq_size = pq_path.stat().st_size / 1024

    return pd.DataFrame(
        {
            "format": ["CSV", "Parquet"],
            "write_sec": [round(csv_write, 5), round(pq_write, 5)],
            "read_sec": [round(csv_read, 5), round(pq_read, 5)],
            "size_kb": [round(csv_size, 2), round(pq_size, 2)],
        }
    )


if __name__ == "__main__":
    # 모듈 단독 실행 시 동작 확인용.
    from src.collect import collect
    from src.schema import validate_weather

    raw = collect()
    valid, _ = validate_weather(raw)
    df = to_dataframe(valid)

    print(f"[기본 비교] 데이터 {len(df)}행")
    print(save_and_compare(df))

    # 72행 정도의 작은 데이터에서는 Parquet가 스키마·메타데이터를 같이
    # 기록하는 고정 비용 때문에 CSV보다 오히려 느리게 나올 수 있다.
    # 동일 코드로 데이터를 1000배 복제(72,000행)해 다시 측정하면
    # Parquet의 컬럼형 저장 이점이 고정 비용을 넘어서는 걸 확인할 수 있다.
    big_df = pd.concat([df] * 1000, ignore_index=True)
    print(f"\n[대량 데이터 비교] 데이터 {len(big_df)}행 (72행 x 1000배 복제)")
    print(save_and_compare(big_df, name="weather_big"))

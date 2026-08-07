"""
==============================================================================
 프로그램명 : compare_speed.py
 설명       : 순차 호출과 asyncio.gather() 동시 호출의 속도 차이를 비교하는 모듈
 작성자     : 최규원
 변경내역   : 2026-08-06  최초 작성
==============================================================================
"""

import time
import httpx
from src.collect import API_URLS

def fetch_sequential():
    """API 3개를 하나씩 순서대로 호출한다 (비교용, 실제 파이프라인에는 사용 안 함)."""
    results = {}
    with httpx.Client() as client:
        for name, url in API_URLS.items():
            r = client.get(url, timeout=10)
            results[name] = r.json()
    return results

if __name__ == "__main__":
    t0 = time.perf_counter()
    fetch_sequential()
    seq_time = time.perf_counter() - t0
    print(f"순차 호출 소요 시간: {seq_time:.3f}초")

    from src.collect import collect
    t0 = time.perf_counter()
    collect()
    async_time = time.perf_counter() - t0
    print(f"비동기(gather) 소요 시간: {async_time:.3f}초")
    print(f"속도 향상: {seq_time / async_time:.1f}배")

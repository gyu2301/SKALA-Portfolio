"""
==============================================================================
 프로그램명 : collect.py
 설명       : 공개 API 3종(Open-Meteo / Countries.dev / ip-api)을
              asyncio + httpx 로 동시 수집하는 모듈
 작성자     : 최규원 (판교 8반)
 변경내역   : 2026-08-06  최초 작성
              2026-08-06  실행 결과(__main__) 출력을 JSON pretty-print +
                          줄 수 제한 방식으로 변경 (가독성 개선)
              2026-08-06  [버그 수정] if __name__ 블록 밖(파일 맨 아래)에
                          있던 "순차 버전과 비교" 코드를 제거함.
                          그 위치에 있으면 이 모듈을 다른 파일에서
                          import만 해도 collect()가 다시 실행되어 API를
                          이유 없이 두 번 호출하는 부작용이 있었음.
                          같은 목적(소요 시간 측정)은 아래 __main__
                          블록 안에서 처리하도록 합침.
==============================================================================
"""

import asyncio

import httpx

# 수집 대상 API 목록 (이름 → URL)
API_URLS: dict[str, str] = {
    "weather": (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=37.5665&longitude=126.9780"
        "&hourly=temperature_2m,precipitation_probability"
        "&forecast_days=3&timezone=Asia/Seoul"
    ),
    "country": "https://countries.dev/alpha/KOR",
    "ipinfo": "http://ip-api.com/json/8.8.8.8",
}


async def fetch(client: httpx.AsyncClient, name: str, url: str) -> tuple[str, dict]:
    """단일 API를 비동기로 호출하고 (이름, JSON) 튜플을 반환한다.

    네트워크 오류·타임아웃이 나도 전체 파이프라인이 멈추지 않도록
    예외를 잡아 {'error': ...} 형태로 돌려준다.
    """
    try:
        response = await client.get(url, timeout=10)
        response.raise_for_status()  # 4xx / 5xx 이면 예외 발생
        return name, response.json()
    except Exception as exc:  # noqa: BLE001 (수집 단계는 광범위 캐치 허용)
        return name, {"error": str(exc)}


async def fetch_all() -> dict[str, dict]:
    """3개 API를 asyncio.gather() 로 동시에 수집한다.

    순차 호출 대비 대기 시간이 겹쳐지므로 전체 소요 시간이 크게 줄어든다.
    return_exceptions=True 는 gather 자체가 예외로 죽는 것을 막는 안전장치이고,
    실제 에러 메시지는 fetch() 내부의 try/except 에서 {'error': ...} 형태로
    이미 잡아서 반환하므로 이중으로 방어하는 구조다.
    """
    async with httpx.AsyncClient() as client:
        # API_URLS 순서대로 코루틴을 만들어 두고, gather로 한 번에 실행한다.
        tasks = [fetch(client, name, url) for name, url in API_URLS.items()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    # results 는 [(name, json), ...] 형태의 튜플 리스트 → dict로 합쳐서
    # schema.py 쪽에서 raw["weather"], raw["country"] 처럼 이름으로 꺼내 쓴다.
    return dict(results)


def collect() -> dict[str, dict]:
    """동기 코드(run_pipeline.py 등)에서 호출하기 위한 진입점.

    asyncio.run() 이 내부적으로 이벤트 루프를 새로 만들고 fetch_all() 을
    끝까지 실행한 뒤 루프를 정리하므로, 호출하는 쪽은 async를 몰라도 된다.
    """
    return asyncio.run(fetch_all())


def _print_result(name: str, value: dict, max_lines: int = 10) -> None:
    """API 1건의 결과를 읽기 좋게 출력한다.

    JSON을 한 줄로 붙여 자르면 괄호가 안 맞아 보기 불편하므로,
    들여쓰기(pretty-print) 후 앞부분 max_lines줄만 보여주고
    나머지는 "...N줄 생략"으로 요약한다.
    """
    print(f"\n[{name}]")
    if "error" in value:
        print(f"  ⚠ 에러: {value['error']}")
        return

    lines = json.dumps(value, ensure_ascii=False, indent=2).splitlines()
    for line in lines[:max_lines]:
        print(f"  {line}")
    if len(lines) > max_lines:
        print(f"  ... ({len(lines) - max_lines}줄 생략)")


if __name__ == "__main__":
    # 모듈 단독 실행 시 동작 확인용: 비동기 수집 결과 + 소요 시간을 출력한다.
    import json
    import time

    start = time.perf_counter()
    data = collect()
    elapsed = time.perf_counter() - start

    for key, value in data.items():
        _print_result(key, value)

    print(f"\n총 소요 시간(비동기): {elapsed:.3f}s")

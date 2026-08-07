"""
==============================================================================
 프로그램명 : run_pipeline.py
 설명       : [프로젝트 개요]
              공개 API 3종(Open-Meteo 날씨 / Countries.dev 국가정보 /
              ip-api IP위치)을 asyncio로 동시에 수집한 뒤, Pydantic으로
              값의 타입·범위를 검증하고, 검증 통과 데이터를 CSV와 Parquet
              두 형식으로 저장하면서 어느 쪽이 더 빠른지 비교하는
              미니 데이터 파이프라인이다.

              이 파일은 수집(src/collect.py) → 검증(src/schema.py) →
              저장/비교(src/storage.py) 세 모듈을 순서대로 호출하는
              진입점(entry point) 역할만 한다. 각 단계의 세부 로직은
              해당 모듈 파일의 주석을 참고할 것.
 작성자     : 최규원
 변경내역   : 2026-08-06  최초 작성
==============================================================================
"""

import json
import logging
from pathlib import Path

from src.collect import collect
from src.schema import validate_weather
from src.storage import save_and_compare, to_dataframe

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s |%(levelname)s |%(message)s",
)
logger = logging.getLogger("pipeline")


def main() -> None:
    """파이프라인 전체 실행: E(수집) → V(검증) → L(저장) → 비교."""
    # 1) 수집
    logger.info("1/4 API 비동기 수집 시작")
    raw = collect()
    logger.info("수집 완료:%s", list(raw.keys()))

    # 2) 검증
    logger.info("2/4 스키마 검증 시작")
    valid, errors = validate_weather(raw)
    logger.info("검증 결과 — 유효%d건 / 오류%d건", len(valid), len(errors))

    if errors:
        # 검증에 실패한 행이 있어도 파이프라인을 죽이지 않고, 원인을 파일로
        # 남겨서 나중에 확인할 수 있게 한다 (콘솔 로그만으로는 흘러가 버림).
        Path("output").mkdir(exist_ok=True)
        Path("output/errors.json").write_text(
            json.dumps(errors, ensure_ascii=False, indent=2),  # 한글 깨짐 방지
            encoding="utf-8",
        )
        logger.warning("오류 리포트 저장: output/errors.json")

    if not valid:
        # 유효 데이터가 하나도 없으면 DataFrame을 만들 근거가 없으므로
        # 저장/비교 단계로 넘어가지 않고 여기서 안전하게 종료한다.
        logger.error("유효 데이터가 0건이라 파이프라인을 중단합니다.")
        return

    # 3) 저장 + 4) 성능 비교
    logger.info("3/4 CSV·Parquet 저장 및 성능 측정")
    df = to_dataframe(valid)
    result = save_and_compare(df)

    logger.info("4/4 완료\n%s", result.to_string(index=False))


if __name__ == "__main__":
    main()




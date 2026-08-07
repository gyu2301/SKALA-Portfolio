"""
==============================================================================
 프로그램명 : 판교_8반_최규원.py (Practice 2)
 설명       : 파일 I/O 예외 처리 + Pydantic v2 검증 파이프라인 실습
              CSV를 안전하게 읽고(safe_load_csv), SalesRecord 스키마로
              검증해 valid/errors를 나눈 뒤 결과를 CSV/JSON으로 저장하고
              다시 읽어 건수를 확인한다.
 작성자     : 최규원 (판교 8반)
 변경내역   : 2026-08-06  최초 작성
              2026-08-06  main() 출력에 [1]~[4] 단계 라벨 + 빈 줄 구분을 추가해,
                          로드/검증/저장/재로딩 각 단계가 한눈에 구분되도록
                          가독성 개선 (로직 변경 없음).
              2026-08-06  평가 기준(오류/예외 처리) 반영: 원본 CSV 로드 실패 시
                          raw_data가 None인 채로 validate_records에 넘어가 TypeError로
                          죽던 경로를 방어하고, save_results의 파일 쓰기도 try/except로
                          감싸 실패 원인이 로그에 남도록 보강. main()에 시작/종료 배너를
                          추가해 이해관계자가 실행 결과를 한눈에 볼 수 있도록 개선.
==============================================================================
"""

import csv
import json
import logging
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# 실습 데이터 파일들은 모두 이 스크립트와 같은 폴더에 생성/저장한다.
BASE_DIR = Path(__file__).resolve().parent
RAW_CSV_PATH = BASE_DIR / "Python_Practice2_RawData.csv"
VALID_CSV_PATH = BASE_DIR / "Python_Practice2_Valid.csv"
ERRORS_JSON_PATH = BASE_DIR / "Python_Practice2_Errors.json"
FIELDNAMES = ["month", "region", "category", "amount"]

# Python_Practice1_Data.json과 같은 스키마(month/region/category/amount)를 쓰되,
# 검증 파이프라인이 valid 4건 / errors 3건을 만들어내도록 일부러 3건을 깨뜨린 원본 데이터.
RAW_ROWS = [
    {"month": "2024-01", "region": "서울", "category": "전자", "amount": "1500"},
    {"month": "2024-02", "region": "부산", "category": "의류", "amount": "800"},
    {"month": "2024-03", "region": "대구", "category": "", "amount": "1100"},  # category는 없어도 됨 -> valid
    {"month": "2024-04", "region": "인천", "category": "식품", "amount": "620"},
    {"month": "", "region": "광주", "category": "전자", "amount": "900"},  # month 비어있음 -> invalid
    {"month": "2024-02", "region": "", "category": "의류", "amount": "700"},  # region 비어있음 -> invalid
    {"month": "2024-03", "region": "대전", "category": "전자", "amount": "-500"},  # amount 0 이하 -> invalid
]


class SalesRecord(BaseModel):
    """검증용 매출 레코드 스키마.

    month·region은 빈 문자열을 허용하지 않고, amount는 0을 초과해야 한다.
    category는 필수가 아니라서 빈 문자열도 그대로 통과시킨다.
    """

    month: str = Field(min_length=1)
    region: str = Field(min_length=1)
    category: str = ""
    amount: float = Field(gt=0)


def ensure_raw_csv(path: Path) -> None:
    """원본 CSV(RAW_CSV_PATH)가 없을 때만 RAW_ROWS로 새로 만든다."""
    if path.exists():
        return  # 이유: 이미 있으면 덮어쓰지 않는다 -> 재실행해도 RAW_ROWS로 매번 리셋되지 않고 멱등(idempotent)하게 동작
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(RAW_ROWS)


def safe_load_csv(path: Path) -> list[dict] | None:
    """CSV 파일을 안전하게 읽어 dict 리스트로 반환한다.

    파일이 없거나 읽기에 실패하면 None을 반환하고 logger.error로 남기며,
    성공하면 dict 리스트를 반환하고 몇 건을 읽었는지 logger.info로 남긴다.
    finally 블록은 성공/실패 여부와 상관없이 '로딩 종료'를 출력해
    이 함수가 항상 어디서 끝났는지 알 수 있게 한다.
    """
    try:
        with open(path, newline="", encoding="utf-8") as f:
            # 이유: DictReader는 제너레이터라 파일이 open 블록을 벗어나면 못 읽으므로,
            # 블록 안에서 list()로 즉시 전부 소비해 안전하게 반환할 수 있게 만든다.
            rows = list(csv.DictReader(f))
    except FileNotFoundError:
        # 이유: 없는 파일을 읽는 건 흔히 일어날 수 있는 상황(예: 아직 결과 파일이
        # 안 만들어진 경우)이라 OSError보다 먼저, 더 구체적으로 잡아 메시지를 명확히 한다.
        logger.error("파일을 찾을 수 없습니다: %s", path)
        return None
    except OSError as e:
        # 이유: 권한 문제 등 FileNotFoundError 외의 나머지 파일 I/O 에러를 포괄해서 처리
        logger.error("CSV 읽기 실패: %s (%s)", path, e)
        return None
    else:
        # 이유: try 블록이 예외 없이 끝났을 때만 실행 -> 성공 로그를 except 쪽과 확실히 분리
        logger.info("%s에서 %d건을 읽었습니다.", path, len(rows))
        return rows
    finally:
        # 이유: return이 있어도 finally는 항상 실행되므로, 성공/실패 어느 경로든
        # 함수가 여기서 끝났다는 걸 표시할 수 있다.
        print("로딩 종료")


def validate_records(raw_data: list[dict]) -> tuple[list[SalesRecord], list[dict]]:
    """raw_data를 순회하며 SalesRecord로 검증해 valid/errors로 나눈다.

    성공한 행은 SalesRecord 인스턴스로 valid 리스트에 담고, ValidationError가
    나면 {"row": 원본행, "error": 오류내용}을 errors 리스트에 담는다.
    """
    valid: list[SalesRecord] = []
    errors: list[dict] = []
    # 이유: raw_data를 한 번만 순회하며 성공/실패를 그 자리에서 바로 분류한다.
    # valid용 컴프리헨션과 errors용 컴프리헨션을 따로 두 번 돌리면 같은 데이터를
    # 두 번 검증하게 되어 비효율적이고, ValidationError 처리도 컴프리헨션 안에서는
    # 다루기 어렵다.
    for row in raw_data:
        try:
            valid.append(SalesRecord(**row))
        except ValidationError as e:
            # 이유: 검증 실패는 "잘못된 입력 데이터" 문제이지 프로그램 결함이 아니라서
            # logger.error가 아니라 print로 눈에 띄게만 보여주고 흐름은 계속 진행한다.
            print(f"[검증 오류] {row} -> {e.errors()[0]['msg']}")
            errors.append({"row": row, "error": str(e)})
    return valid, errors


def save_results(valid: list[SalesRecord], errors: list[dict]) -> None:
    """valid 레코드는 CSV로, errors는 JSON으로 저장한다.

    model_dump()로 SalesRecord를 dict로 바꿔 그대로 CSV에 쓰고,
    한글이 깨지지 않도록 json.dump에는 ensure_ascii=False를 준다.
    """
    with open(VALID_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for record in valid:
            # 이유: SalesRecord는 pydantic 모델 객체라 csv writer가 바로 못 쓴다.
            # model_dump()로 {"month": ..., "amount": 1500.0} 같은 순수 dict로
            # 변환해야 DictWriter.writerow()에 넘길 수 있다.
            writer.writerow(record.model_dump())

    with open(ERRORS_JSON_PATH, "w", encoding="utf-8") as f:
        # 이유: ensure_ascii=False를 안 주면 한글이 "서울" 같은 유니코드
        # 이스케이프로 저장돼 사람이 읽을 수 없다.
        json.dump(errors, f, ensure_ascii=False, indent=2)


def save_results_safely(valid: list[SalesRecord], errors: list[dict]) -> bool:
    """save_results를 감싸 쓰기 실패(OSError)를 안전하게 처리한다.

    safe_load_csv와 동일한 패턴(예외를 삼키고 로그만 남긴 뒤 False 반환)을
    저장 경로에도 적용해, 디스크 공간 부족·권한 문제 등으로 쓰기가 실패해도
    프로그램이 트레이스백과 함께 죽지 않도록 한다.
    """
    try:
        save_results(valid, errors)
    except OSError as e:
        logger.error("결과 저장 실패: %s", e)
        return False
    else:
        logger.info("결과 저장 성공: %s, %s", VALID_CSV_PATH.name, ERRORS_JSON_PATH.name)
        return True


def main() -> None:
    """전체 파이프라인(로드 -> 검증 -> 저장 -> 재로딩 확인)을 순서대로 실행한다.

    각 단계를 [1]~[4] 라벨로 나눠 출력하는 이유: safe_load_csv의 logger 출력,
    finally의 "로딩 종료", print 결과가 한 화면에 섞여 나오기 때문에, 라벨과
    빈 줄로 구간을 나누지 않으면 어느 출력이 어느 단계 것인지 구분하기 어렵다.
    """
    print("=" * 60)
    print("[실습 2] 파일 I/O, 예외 처리, Pydantic 검증")
    print("=" * 60 + "\n")

    # 1) 없는 파일을 읽으면 safe_load_csv가 None을 반환하는지 확인
    print("[1] 없는 파일 예외 처리 테스트")
    missing = safe_load_csv(BASE_DIR / "존재하지_않는_파일.csv")
    # 이유: safe_load_csv가 예외를 삼키고 None을 돌려주는 "안전한 실패" 계약을
    # 지키는지 여기서 바로 확인한다 (예외가 그대로 새어나오면 안 됨).
    assert missing is None
    print("-> None 반환 확인\n")

    # 2) 원본 CSV 준비 후 로드
    print("[2] 원본 CSV 로드")
    ensure_raw_csv(RAW_CSV_PATH)  # 파일이 없을 때만 RAW_ROWS로 새로 생성 (멱등)
    raw_data = safe_load_csv(RAW_CSV_PATH)
    print()

    # 이유: safe_load_csv가 실패하면 None을 반환하는데, 그대로 validate_records에
    # 넘기면 None을 순회하려다 TypeError로 죽어 "안전한 실패" 계약이 깨진다.
    # 원본 로드 실패는 이후 단계를 진행할 수 없는 치명적 상황이므로 여기서 명확히 종료한다.
    if raw_data is None:
        logger.error("원본 CSV를 읽지 못해 파이프라인을 중단합니다.")
        return

    # 3) Pydantic 검증 파이프라인으로 valid/errors 분리
    print("[3] Pydantic 검증")
    valid, errors = validate_records(raw_data)
    print(f"-> valid: {len(valid)}건 / errors: {len(errors)}건\n")
    # 이유: RAW_ROWS(32~40번 줄)에 valid 4건/invalid 3건이 되도록 일부러 데이터를
    # 짜놨으므로, 검증 로직이 의도대로 동작했는지 건수로 못박아 확인한다.
    assert len(valid) == 4, f"valid는 4건이어야 합니다 (실제 {len(valid)}건)"
    assert len(errors) == 3, f"errors는 3건이어야 합니다 (실제 {len(errors)}건)"

    # 4) 결과 저장 후 valid CSV를 다시 읽어 건수 검증
    print("[4] 결과 저장 및 재로딩 검증")
    if not save_results_safely(valid, errors):
        return
    reloaded = safe_load_csv(VALID_CSV_PATH)
    print(f"-> 재로딩한 valid 레코드: {len(reloaded)}건\n")
    # 이유: 메모리 상의 valid 리스트 건수뿐 아니라, 실제로 디스크에 쓴 CSV를
    # 다시 읽어도 같은 건수(4건)가 나오는지까지 확인해 저장/로드 왕복을 검증한다.
    assert len(reloaded) == 4, f"재로딩 후 4건이어야 합니다 (실제 {len(reloaded)}건)"

    print("모든 checkpoint 통과")
    print("=" * 60)


if __name__ == "__main__":
    main()

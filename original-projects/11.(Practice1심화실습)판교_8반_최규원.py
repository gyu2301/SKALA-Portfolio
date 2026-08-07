"""
==============================================================================
 프로그램명 : 판교_8반_최규원.py
 설명       : Sales 데이터를 컴프리헨션·Counter·defaultdict·제너레이터로 집계하는 심화 실습 (Practice 1)
 작성자     : 최규원 (판교 8반)
 변경내역   : 2026-08-06  최초 작성
              2026-08-06  교수님이 주신 헤더 없는 버전(Python_Practice2_Data.json,
                          순수 JSON)을 기본 데이터로 사용하도록 변경.
                          Python_Practice1_Data.json("sales = " 접두사 붙은
                          버전)도 여전히 로드 가능하도록 방어 로직은 유지.
              2026-08-06  main() 출력을 dict/Counter 통째로 출력 대신 항목별
                          줄바꿈 + 구간 제목(print_section)으로 정리해
                          가독성 개선.
==============================================================================
"""

import json
import sys
from collections import Counter, defaultdict

# 이유: 교수님이 주신 두 데이터 파일 중 "sales = " 접두사가 없는 순수 JSON 버전(Practice2)을 기본으로 사용한다. 
# 데이터 자체는 Python_Practice1_Data.json과 동일하기에, 
# 두 파일 모두 원본 그대로 두고 이 스크립트 쪽에서만 어떤 파일을 읽을지 선택한다.
DATA_PATH = "Python_Practice2_Data.json"


def load_sales(path: str) -> list[dict]:
    """Sales 데이터 파일을 읽어 리스트로 반환한다.

    Python_Practice2_Data.json은 순수 JSON 배열이라 바로 파싱되지만,
    같이 배포된 Python_Practice1_Data.json은 "sales = [...]" 형태의
    헤더가 있는 파이썬 대입문이라 json.loads()가 실패하는걸 확인했다.
    그래서 먼저 Practice 2 JSON으로 시도하고, 실패하면 "이름 = " 접두사를 잘라낸
    뒤 다시 파싱해 두 버전 모두 지원한다. 파일이 없거나 그래도 형식이
    깨져 있으면 예외를 잡아 빈 리스트를 반환해 이후 로직이 죽지 않도록 방어한다.
    """
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[오류] 파일을 찾을 수 없습니다: {path}")
        return []

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass  # 순수 JSON이 아님 -> "sales = " 같은 대입문 접두사 제거 후 재시도

    try:
        _, _, body = content.partition("=")
        return json.loads(body)
    except json.JSONDecodeError as e:
        print(f"[오류] JSON 형식이 올바르지 않습니다: {e}")
        return []


sales = load_sales(DATA_PATH)
if not sales:
    print("데이터가 비어 있어 샘플 데이터로 대체합니다.")
    sales = [
        {"month": "2024-01", "region": "서울", "category": "전자제품", "amount": 1500},
        {"month": "2024-01", "region": "부산", "category": "의류", "amount": 800},
        {"month": "2024-01", "region": "서울", "category": "식품", "amount": 1200},
        {"month": "2024-01", "region": "대구", "category": "전자제품", "amount": 2000},
        {"month": "2024-02", "region": "서울", "category": "식품", "amount": 900},
        {"month": "2024-02", "region": "부산", "category": "전자제품", "amount": 1800},
        {"month": "2024-02", "region": "서울", "category": "전자제품", "amount": 2500},
        {"month": "2024-02", "region": "대구", "category": "의류", "amount": 700},
        {"month": "2024-03", "region": "부산", "category": "식품", "amount": 1100},
        {"month": "2024-03", "region": "서울", "category": "의류", "amount": 950},
        {"month": "2024-03", "region": "대구", "category": "전자제품", "amount": 3000},
        {"month": "2024-03", "region": "서울", "category": "식품", "amount": 600},
    ]


def print_section(title: str) -> None:
    """구분선 + 제목을 출력한다. 출력이 줄글처럼 이어지지 않도록 항목마다 나눠준다."""
    print()
    print("=" * 50)
    print(title)
    print("=" * 50)


# ------------------------------------------------------------------
# 과제 1 - 리스트/딕셔너리 컴프리헨션
# ------------------------------------------------------------------
def filter_high_value(data: list[dict], threshold: int = 1000) -> list[dict]:
    """amount가 threshold 이상인 거래만 리스트 컴프리헨션으로 걸러낸다."""
    return [t for t in data if t["amount"] >= threshold]


def region_total_sales(data: list[dict]) -> dict[str, float]:
    """지역별 총매출을 딕셔너리 컴프리헨션으로 계산한다.

    1) {t["region"] for t in data}로 고유 지역 집합을 만들고,
    2) 각 지역에 대해 sum(제너레이터 표현식)으로 합계를 구해
       하나의 딕셔너리 컴프리헨션으로 완성한다.
    """
    regions = {t["region"] for t in data}  # set comprehension -> 고유 지역
    return {
        r: sum(t["amount"] for t in data if t["region"] == r)
        for r in regions
    }


def run_task1() -> None:
    """[과제 1] 고액 거래 필터링 + 지역별 총매출을 실행하고 출력한다."""
    print_section("[과제 1] 고액 거래 필터링 + 지역별 총매출")
    high_value = filter_high_value(sales)
    print(f"amount >= 1000인 거래: {len(high_value)}건\n")

    region_total = region_total_sales(sales)
    print("지역별 총매출")
    for region in sorted(region_total):
        print(f"  {region}: {region_total[region]:,.0f}원")
    # 검증: 지역별 총매출의 합은 전체 매출 합과 같아야 한다.
    assert sum(region_total.values()) == sum(t["amount"] for t in sales)


# ------------------------------------------------------------------
# 과제 2 - Counter + defaultdict
# ------------------------------------------------------------------
def region_counts(data: list[dict]) -> Counter:
    """지역별 거래 건수를 Counter로 집계한다 (직접 루프 카운팅 금지)."""
    return Counter(t["region"] for t in data)


def category_amount_lists(data: list[dict]) -> defaultdict:
    """카테고리별 거래 금액을 defaultdict(list)로 모은다.

    defaultdict(list)를 쓰면 키가 없을 때 자동으로 빈 리스트가 생성되므로
    'if key not in dict' 같은 방어 코드가 필요 없다.
    """
    result = defaultdict(list)
    for t in data:
        result[t["category"]].append(t["amount"])
    return result


def run_task2() -> None:
    """[과제 2] Counter + defaultdict 집계를 실행하고 출력한다."""
    print_section("[과제 2] Counter + defaultdict")
    counter = region_counts(sales)
    print("지역별 거래 건수 (많은 순)")
    for region, count in counter.most_common():
        print(f"  {region}: {count}건")

    by_category = category_amount_lists(sales)
    print("\n카테고리별 금액 리스트")
    for category in sorted(by_category):
        print(f"  {category}: {by_category[category]}")


# ------------------------------------------------------------------
# 과제 3 - 제너레이터, 메모리 비교
# ------------------------------------------------------------------
def high_value_generator(data: list[dict], threshold: int = 1000):
    """amount가 threshold 초과인 거래만 하나씩 생성(yield)하는 제너레이터.

    리스트로 한꺼번에 만들지 않고, 필요할 때 하나씩만 메모리에 올린다.
    """
    for t in data:
        if t["amount"] > threshold:
            yield t


def run_task3() -> None:
    """[과제 3] 리스트와 제너레이터의 메모리 사용량을 비교하고 출력한다."""
    print_section("[과제 3] 제너레이터 메모리 비교")
    # 비교 대상 두 가지를 각각 독립적으로 만든다 — 절대 하나를 다른 것으로 변환하지 않는다!
    # list(hv_gen)처럼 변환해서 만들면 결국 둘 다 리스트가 되어 버려서
    # "즉시 전체를 메모리에 올리는 리스트" vs "필요할 때 하나씩만 만드는 제너레이터"라는
    # 애초에 비교하려던 차이 자체가 사라진다.
    hv_list = [t for t in sales if t["amount"] > 1000]        # 리스트: 컴프리헨션 실행 시점에 전체 즉시 생성
    hv_gen = high_value_generator(sales, threshold=1000)      # 제너레이터: 아직 아무 값도 만들지 않은 상태
    list_size = sys.getsizeof(hv_list)
    gen_size = sys.getsizeof(hv_gen)
    print(f"리스트 객체 크기:     {list_size} bytes")
    print(f"제너레이터 객체 크기: {gen_size} bytes")
    assert gen_size < list_size, "제너레이터가 리스트보다 작아야 합니다"
    print("-> 제너레이터가 리스트보다 작음을 확인")
    # 제너레이터가 실제로 리스트와 같은 내용을 만들어내는지도 확인한다.
    # 이때도 hv_gen을 재사용하지 않고 새 제너레이터를 만든다 — 제너레이터는
    # 한 번 소비(iterate)하면 다시 되감을 수 없는 일회용(single-use)이라,
    # 재사용하면 이미 값이 남아있다고 착각한 채 빈 결과를 얻게 된다.
    assert list(high_value_generator(sales, threshold=1000)) == hv_list


# ------------------------------------------------------------------
# 과제 4 - month·category 그룹핑 (컴프리헨션 + defaultdict 종합)
# ------------------------------------------------------------------
def monthly_category_total(data: list[dict]) -> dict:
    """월(month)·카테고리(category) 기준으로 그룹핑한 총매출을 계산한다.

    (month, category) 튜플을 키로 하는 defaultdict에 금액을 누적하고,
    출력 편의를 위해 컴프리헨션으로 "월_카테고리" 형태의 읽기 쉬운
    키로 재구성한다.
    """
    accumulator = defaultdict(float)
    for t in data:
        key = (t["month"], t["category"])
        accumulator[key] += t["amount"]

    return {
        f"{month}_{category}": total
        for (month, category), total in accumulator.items()
    }


def run_task4() -> None:
    """[과제 4] 월별·카테고리별 총매출 그룹핑을 실행하고 출력한다."""
    print_section("[과제 4] 월별·카테고리별 총매출")
    monthly_totals = monthly_category_total(sales)
    months = sorted({key.split("_", 1)[0] for key in monthly_totals})
    for month in months:
        print(f"{month}")
        for key in sorted(monthly_totals):
            key_month, category = key.split("_", 1)
            if key_month == month:
                print(f"  {category}: {monthly_totals[key]:,.0f}원")
        print()


# ------------------------------------------------------------------
# 보너스 체크포인트 - 금액 내림차순 top3
# ------------------------------------------------------------------
def top_n_transactions(data: list[dict], n: int = 3) -> list[tuple]:
    """금액 기준 내림차순 정렬 후 상위 n건의 (지역, 카테고리, 금액)을 반환한다."""
    sorted_by_amount = sorted(data, key=lambda t: t["amount"], reverse=True)
    return [(t["region"], t["category"], t["amount"]) for t in sorted_by_amount[:n]]


def run_bonus() -> None:
    """[보너스] 금액 top3 랭킹을 실행하고 출력한다."""
    print_section("[보너스] 금액 top3")
    for rank, (region, category, amount) in enumerate(top_n_transactions(sales, 3), start=1):
        print(f"  {rank}위: {region} / {category} / {amount:,}원")


def main() -> None:
    """전체 실습 과제를 순서대로 실행하고 결과를 출력한다."""
    run_task1()
    run_task2()
    run_task3()
    run_task4()
    run_bonus()


if __name__ == "__main__":
    main()

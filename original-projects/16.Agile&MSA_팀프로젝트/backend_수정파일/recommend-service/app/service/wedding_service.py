import logging
from decimal import Decimal
from itertools import product as cartesian_product
from typing import Dict, List, Optional, Tuple

from app.client.course_client import course_client
from app.model.schemas import (
    CourseCategory,
    CourseResponse,
    TierGroup,
    TiersResponse,
    WeddingCombination,
    WeddingRecommendRequest,
    WeddingRecommendResponse,
)

logger = logging.getLogger(__name__)

CATEGORY_KO = {
    CourseCategory.STUDIO: "스튜디오",
    CourseCategory.DRESS: "드레스",
    CourseCategory.MAKEUP: "메이크업",
}
TIER_LABELS = {1: "실속형", 2: "스탠다드", 3: "프리미엄"}

# 점수 배점 (합계 100)
STYLE_MATCH_SCORE = 35
PRIORITY_SCORES = [25, 17, 8]        # 1·2·3순위
BUDGET_FIT_SCORE = 20                # 예산 규모에 맞는 분위 구간
BUDGET_FIT_ADJACENT_SCORE = 10       # 인접 구간
REGION_MATCH_SCORE = 10
POPULARITY_MAX_SCORE = 10            # enrollmentCount 정규화

# 우선순위별 예산 배분 비율 (1순위에 가장 많이 배분)
ALLOCATION_WEIGHTS = [Decimal("0.40"), Decimal("0.35"), Decimal("0.25")]

TOP_CANDIDATES_PER_CATEGORY = 5
MAX_COMBINATIONS = 3


class WeddingRecommendService:
    """
    규칙 기반 스·드·메 예산 조합 추천 (LLM 미사용 — 기본 경로)

    1) /tiers  : 카테고리별 가격 3분위 "가성비 맵"
    2) /wedding: 예산·우선순위·스타일·지역 가중 점수로 조합 상위 3개 추천
    """

    async def get_tiers(self) -> TiersResponse:
        active = await self._get_active_courses()
        tiers: Dict[CourseCategory, List[TierGroup]] = {}
        for category in CourseCategory:
            items = sorted(
                [c for c in active if c.category == category],
                key=lambda c: c.price,
            )
            tiers[category] = self._split_into_tiers(items)
        return TiersResponse(tiers=tiers)

    async def recommend(self, req: WeddingRecommendRequest) -> WeddingRecommendResponse:
        logger.info(
            f"[WeddingService] 조합 추천 시작 - budget: {req.totalBudget}, "
            f"priority: {[p.value for p in req.priority]}"
        )
        active = await self._get_active_courses()

        by_category: Dict[CourseCategory, List[CourseResponse]] = {
            category: sorted(
                [c for c in active if c.category == category],
                key=lambda c: c.price,
            )
            for category in CourseCategory
        }

        missing = [CATEGORY_KO[c] for c, items in by_category.items() if not items]
        if missing:
            return WeddingRecommendResponse(
                totalBudget=req.totalBudget,
                withinBudget=False,
                combinations=[],
                message=f"{'·'.join(missing)} 카테고리에 추천 가능한 상품이 없습니다",
            )

        # 카테고리별 후보 점수화 → 상위 5개
        candidates: Dict[CourseCategory, List[Tuple[CourseResponse, float]]] = {}
        for category, items in by_category.items():
            tier_groups = self._split_into_tiers(items)
            target_tier = self._target_tier(category, req, tier_groups)
            max_enrollment = max((c.enrollmentCount for c in items), default=0)
            scored = [
                (c, self._score(c, category, req, tier_groups, target_tier, max_enrollment))
                for c in items
            ]
            scored.sort(key=lambda t: (t[1], t[0].enrollmentCount), reverse=True)
            candidates[category] = scored[:TOP_CANDIDATES_PER_CATEGORY]

        # STUDIO × DRESS × MAKEUP 조합 생성
        budget = Decimal(req.totalBudget)
        valid: List[WeddingCombination] = []
        cheapest: Optional[WeddingCombination] = None

        for studio, dress, makeup in cartesian_product(
            candidates[CourseCategory.STUDIO],
            candidates[CourseCategory.DRESS],
            candidates[CourseCategory.MAKEUP],
        ):
            picked = [studio, dress, makeup]
            total_price = sum((c.price for c, _ in picked), Decimal(0))
            combo = WeddingCombination(
                items=[c for c, _ in picked],
                totalPrice=total_price,
                remainingBudget=budget - total_price,
                score=round(sum(s for _, s in picked), 1),
                reason="",  # 아래에서 템플릿으로 생성
            )
            if total_price <= budget:
                valid.append(combo)
            if cheapest is None or total_price < cheapest.totalPrice:
                cheapest = combo

        if valid:
            valid.sort(key=lambda c: (c.score, c.remainingBudget), reverse=True)
            top = valid[:MAX_COMBINATIONS]
            for combo in top:
                combo.reason = self._build_reason(combo, req)
            return WeddingRecommendResponse(
                totalBudget=req.totalBudget,
                withinBudget=True,
                combinations=top,
                message=f"예산 {req.totalBudget:,}원 이내 조합 {len(top)}개를 추천합니다",
            )

        # 예산 내 조합이 없으면 초과 최소 조합 1개 안내
        over = int(cheapest.totalPrice - budget)
        cheapest.reason = (
            f"예산을 {over:,}원 초과합니다. "
            f"가장 저렴한 조합이며 총 {int(cheapest.totalPrice):,}원입니다"
        )
        return WeddingRecommendResponse(
            totalBudget=req.totalBudget,
            withinBudget=False,
            combinations=[cheapest],
            message=f"예산 이내 조합이 없어 최소 금액 조합을 안내합니다 (예산을 {over:,}원 초과합니다)",
        )

    # ── 내부 로직 ──────────────────────────────────────────────

    async def _get_active_courses(self) -> List[CourseResponse]:
        courses = await course_client.get_all_courses()
        return [c for c in courses if c.status == "ACTIVE"]

    def _split_into_tiers(self, sorted_items: List[CourseResponse]) -> List[TierGroup]:
        """가격 오름차순 목록을 3등분 (1=실속형, 2=스탠다드, 3=프리미엄)"""
        n = len(sorted_items)
        if n == 0:
            return []
        sizes = [n // 3 + (1 if i < n % 3 else 0) for i in range(3)]
        groups: List[TierGroup] = []
        start = 0
        for i, size in enumerate(sizes):
            chunk = sorted_items[start:start + size]
            start += size
            if not chunk:
                continue
            groups.append(TierGroup(
                tier=i + 1,
                label=TIER_LABELS[i + 1],
                minPrice=chunk[0].price,
                maxPrice=chunk[-1].price,
                products=chunk,
            ))
        return groups

    def _allocated_budget(
        self, category: CourseCategory, req: WeddingRecommendRequest
    ) -> Decimal:
        """우선순위에 따라 카테고리별 예산 배분 (1순위 40% / 2순위 35% / 3순위 25%)"""
        budget = Decimal(req.totalBudget)
        if category in req.priority:
            idx = req.priority.index(category)
            weight = ALLOCATION_WEIGHTS[min(idx, len(ALLOCATION_WEIGHTS) - 1)]
        else:
            weight = Decimal(1) / Decimal(3)
        return budget * weight

    def _target_tier(
        self,
        category: CourseCategory,
        req: WeddingRecommendRequest,
        tier_groups: List[TierGroup],
    ) -> int:
        """카테고리 배분 예산이 닿는 가장 높은 분위 구간"""
        allocated = self._allocated_budget(category, req)
        target = 1
        for group in tier_groups:
            if group.minPrice <= allocated:
                target = group.tier
        return target

    def _score(
        self,
        course: CourseResponse,
        category: CourseCategory,
        req: WeddingRecommendRequest,
        tier_groups: List[TierGroup],
        target_tier: int,
        max_enrollment: int,
    ) -> float:
        score = 0.0

        # 1) 스타일 일치 35
        preferred_style = (req.styleTags or {}).get(category)
        if preferred_style and course.style == preferred_style:
            score += STYLE_MATCH_SCORE

        # 2) 우선순위 25/17/8
        if category in req.priority:
            idx = req.priority.index(category)
            score += PRIORITY_SCORES[min(idx, len(PRIORITY_SCORES) - 1)]

        # 3) 예산 적합 20 (배분 예산에 맞는 분위 구간, 인접 구간 10)
        course_tier = next(
            (g.tier for g in tier_groups if any(p.id == course.id for p in g.products)),
            1,
        )
        distance = abs(course_tier - target_tier)
        if distance == 0:
            score += BUDGET_FIT_SCORE
        elif distance == 1:
            score += BUDGET_FIT_ADJACENT_SCORE

        # 4) 지역 일치 10
        if req.region and course.region == req.region:
            score += REGION_MATCH_SCORE

        # 5) 인기도 10 (enrollmentCount 정규화)
        if max_enrollment > 0:
            score += POPULARITY_MAX_SCORE * (course.enrollmentCount / max_enrollment)

        return round(score, 2)

    def _build_reason(
        self, combo: WeddingCombination, req: WeddingRecommendRequest
    ) -> str:
        """템플릿 기반 한국어 추천 사유 생성"""
        highlights: List[str] = []

        style_tags = req.styleTags or {}
        matched_styles = [
            f"{CATEGORY_KO[item.category]} {item.style}"
            for item in combo.items
            if style_tags.get(item.category) and item.style == style_tags[item.category]
        ]
        if matched_styles:
            highlights.append(f"{'·'.join(matched_styles)} 스타일이 일치하고")

        if req.priority:
            top_category = req.priority[0]
            top_item = next(
                (i for i in combo.items if i.category == top_category), None
            )
            if top_item:
                highlights.append(
                    f"1순위 {CATEGORY_KO[top_category]}에 '{top_item.title}'을(를) 배정했으며"
                )

        if req.region:
            region_count = sum(1 for i in combo.items if i.region == req.region)
            if region_count:
                highlights.append(f"{req.region} 상품 {region_count}개가 포함되고")

        prefix = " ".join(highlights) if highlights else "예산 구간에 맞는 균형 조합으로"
        remaining = int(combo.remainingBudget)
        return f"{prefix} 예산 잔액이 {remaining:,}원 남습니다."


wedding_service = WeddingRecommendService()

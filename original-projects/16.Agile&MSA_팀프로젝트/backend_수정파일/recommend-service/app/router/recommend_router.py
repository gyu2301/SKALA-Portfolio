import logging
from fastapi import APIRouter, Depends
from app.config.security import verify_token
from app.model.schemas import (
    RecommendResponse,
    TiersResponse,
    WeddingRecommendRequest,
    WeddingRecommendResponse,
)
from app.service.recommend_service import recommend_service
from app.service.wedding_service import wedding_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recommend", tags=["recommend"])


# ⚠️ 고정 경로(/tiers, /wedding)는 /{user_id} 보다 먼저 선언해야 매칭된다

@router.get("/tiers", response_model=TiersResponse)
async def get_budget_tiers():
    """
    GET /api/recommend/tiers - 예산 3분위 "가성비 맵" (공개, 인증 불필요)

    활성 상품을 카테고리(STUDIO/DRESS/MAKEUP)별로 가격 정렬 후
    3분위(1=실속형, 2=스탠다드, 3=프리미엄)로 나눠 반환한다.
    """
    logger.info("[Router] 예산 3분위 조회")
    return await wedding_service.get_tiers()


@router.post("/wedding", response_model=WeddingRecommendResponse)
async def recommend_wedding_combination(request: WeddingRecommendRequest):
    """
    POST /api/recommend/wedding - 예산 기반 스·드·메 조합 추천 (규칙 기반, 공개)

    점수: 스타일 일치 35 + 우선순위 25/17/8 + 예산적합 20 + 지역 10 + 인기도 10
    카테고리별 상위 5개 후보의 조합 중 예산 이내 총점 상위 3개 반환.
    예산 이내 조합이 없으면 초과 최소 조합 1개를 안내한다.
    """
    logger.info(f"[Router] 스드메 조합 추천 - budget: {request.totalBudget}")
    return await wedding_service.recommend(request)


@router.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "UP", "service": "recommend-service"}


@router.get("/{user_id}", response_model=RecommendResponse)
async def get_recommendations(
    user_id: int,
    token_payload: dict = Depends(verify_token)
):
    """
    GET /recommend/{userId} - 사용자 기반 상품 추천

    추천 규칙:
    - 예약 이력 있음: 최빈 카테고리 기반 미예약 상품 추천 (예약생 수 기준 정렬)
    - 예약 이력 없음: 전체 인기 상품 추천
    """
    logger.info(f"[Router] 추천 요청 - userId: {user_id}")
    return await recommend_service.get_recommendations(user_id)



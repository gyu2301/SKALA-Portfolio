from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from enum import Enum
from decimal import Decimal
from datetime import datetime


class CourseCategory(str, Enum):
    STUDIO = "STUDIO"   # 스튜디오 촬영
    DRESS = "DRESS"     # 드레스
    MAKEUP = "MAKEUP"   # 메이크업


class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: CourseCategory
    region: Optional[str] = None  # 청담동·신사동·삼성동·선릉로 등
    style: Optional[str] = None   # 화려·미니멀·클래식·모던 등
    price: Decimal
    vendorId: int
    enrollmentCount: int  # 예약 수 (서비스 간 계약상 필드명 유지)
    status: str
    createdAt: Optional[datetime] = None


class EnrollmentHistoryResponse(BaseModel):
    userId: int
    activeCourseIds: List[int]


class RecommendResponse(BaseModel):
    userId: int
    recommendedCourses: List[CourseResponse]
    basedOnCategory: Optional[CourseCategory] = None
    message: str


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


# ── 예산 3분위(가성비 맵) ──────────────────────────────────────────

class TierGroup(BaseModel):
    """카테고리 내 가격 3분위 구간 (1=실속형, 2=스탠다드, 3=프리미엄)"""
    tier: int = Field(ge=1, le=3)
    label: str            # 실속형 / 스탠다드 / 프리미엄
    minPrice: Decimal
    maxPrice: Decimal
    products: List[CourseResponse]


class TiersResponse(BaseModel):
    tiers: Dict[CourseCategory, List[TierGroup]]


# ── 예산 기반 스·드·메 조합 추천 ─────────────────────────────────

class WeddingRecommendRequest(BaseModel):
    totalBudget: int = Field(gt=0, description="스드메 총예산(원)")
    priority: List[CourseCategory] = Field(
        min_length=1, max_length=3,
        description="카테고리 우선순위 (앞일수록 높음)"
    )
    styleTags: Optional[Dict[CourseCategory, str]] = None  # 카테고리별 선호 스타일
    region: Optional[str] = None                           # 선호 지역 (청담동 등)


class WeddingCombination(BaseModel):
    items: List[CourseResponse]   # STUDIO·DRESS·MAKEUP 각 1개
    totalPrice: Decimal
    remainingBudget: Decimal      # 예산 초과 조합은 음수
    score: float
    reason: str


class WeddingRecommendResponse(BaseModel):
    totalBudget: int
    withinBudget: bool            # False면 combinations는 초과 최소 조합 1개
    combinations: List[WeddingCombination]
    message: str

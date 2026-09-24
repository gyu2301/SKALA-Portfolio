import logging
from collections import Counter
from typing import List, Optional

from app.client.course_client import course_client
from app.client.enrollment_client import enrollment_client
from app.model.schemas import CourseCategory, CourseResponse, RecommendResponse

logger = logging.getLogger(__name__)


class RecommendService:
    """
    규칙 기반 상품 추천 서비스

    추천 규칙:
    1. 사용자의 예약 중인 상품 카테고리 분석
    2. 가장 많이 예약한 카테고리 선택 (최빈 카테고리)
    3. 해당 카테고리에서 미예약 상품 조회
    4. 예약생 수 기준 내림차순 정렬하여 반환
    5. 예약 이력 없으면 전체 상품 중 인기순 반환
    """

    MAX_RECOMMEND_COUNT = 5  # 최대 추천 상품 수

    async def get_recommendations(self, user_id: int) -> RecommendResponse:
        logger.info(f"[RecommendService] 추천 시작 - userId: {user_id}")

        # 1. 예약 이력 조회
        history = await enrollment_client.get_enrollment_history(user_id)
        active_course_ids = history.activeCourseIds

        # 2. 예약 이력 없는 신규 사용자 처리
        if not active_course_ids:
            return await self._recommend_for_new_user(user_id)

        # 3. 예약한 상품의 카테고리 분석 → 최빈 카테고리 선택
        dominant_category = await self._find_dominant_category(active_course_ids)
        if not dominant_category:
            return await self._recommend_for_new_user(user_id)

        # 4. 최빈 카테고리 기반 미예약 상품 조회
        recommended = await course_client.get_recommend_courses(
            category=dominant_category,
            exclude_ids=active_course_ids
        )

        # 5. 최대 추천 수 제한
        recommended = recommended[:self.MAX_RECOMMEND_COUNT]

        logger.info(f"[RecommendService] 추천 완료 - userId: {user_id}, "
                    f"category: {dominant_category}, count: {len(recommended)}")

        return RecommendResponse(
            userId=user_id,
            recommendedCourses=recommended,
            basedOnCategory=dominant_category,
            message=f"{dominant_category.value} 카테고리 기반 추천 상품입니다"
        )

    async def _find_dominant_category(
        self, course_ids: List[int]
    ) -> Optional[CourseCategory]:
        """
        예약한 상품들의 카테고리 분석 → 최빈 카테고리 반환
        Course Service에서 각 상품 정보를 조회하여 카테고리 집계
        """
        all_courses = await course_client.get_all_courses()
        course_map = {c.id: c for c in all_courses}

        categories = [
            course_map[cid].category
            for cid in course_ids
            if cid in course_map
        ]

        if not categories:
            return None

        # Counter로 최빈 카테고리 선택
        most_common = Counter(categories).most_common(1)
        return most_common[0][0] if most_common else None

    async def _recommend_for_new_user(self, user_id: int) -> RecommendResponse:
        """
        신규 사용자: 예약생 수 기준 전체 인기 상품 추천
        """
        logger.info(f"[RecommendService] 신규 사용자 추천 - userId: {user_id}")

        all_courses = await course_client.get_all_courses()
        popular = sorted(
            all_courses,
            key=lambda c: c.enrollmentCount,
            reverse=True
        )[:self.MAX_RECOMMEND_COUNT]

        return RecommendResponse(
            userId=user_id,
            recommendedCourses=popular,
            basedOnCategory=None,
            message="인기 상품 추천입니다"
        )


recommend_service = RecommendService()

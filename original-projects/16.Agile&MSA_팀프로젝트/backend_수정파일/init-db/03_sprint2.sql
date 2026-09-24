-- Sprint 2 확장 DDL (additive — 기존 01·02를 건드리지 않는다)
-- 설계 근거: docs/DB_설계.md · 개발 계획서 결정 D-005/D-006/D-008

-- 업체 프로필 — 카카오 장소 정보 결합 (x=경도→longitude, y=위도→latitude 로 명명 강제)
CREATE TABLE IF NOT EXISTS vendor_profiles (
    user_id             BIGINT       NOT NULL,
    kakao_place_id      VARCHAR(30)  COMMENT '카카오 장소 ID',
    road_address        VARCHAR(255) COMMENT '도로명 주소',
    latitude            DECIMAL(10,7) COMMENT '위도(y)',
    longitude           DECIMAL(10,7) COMMENT '경도(x)',
    place_url           VARCHAR(255) COMMENT '카카오맵 상세 URL',
    primary_category    VARCHAR(20)  COMMENT 'STUDIO | DRESS | MAKEUP',
    verification_status VARCHAR(20)  NOT NULL DEFAULT 'UNVERIFIED' COMMENT 'UNVERIFIED | VERIFIED | FAILED (국세청 진위확인)',
    created_at          DATETIME(6),
    updated_at          DATETIME(6),
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 고객 온보딩 — 총예산(식장 제외)이 추천 1순위 가중치
CREATE TABLE IF NOT EXISTS customer_preferences (
    user_id          BIGINT        NOT NULL,
    wedding_date     DATE          COMMENT '오늘부터 1년 이내 제한',
    total_budget     DECIMAL(12,2) COMMENT '웨딩 총예산 (식장 제외)',
    priority_order   VARCHAR(50)   COMMENT '예: DRESS>STUDIO>MAKEUP',
    style_tags       LONGTEXT      COMMENT 'JSON: 카테고리별 선호 스타일',
    preferred_region VARCHAR(50),
    updated_at       DATETIME(6),
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 상품 상세 확장 (카테고리별 옵션·포함/추가금 항목·가용 기간)
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS included_items  LONGTEXT COMMENT 'JSON 기본 포함 항목',
    ADD COLUMN IF NOT EXISTS option_items    LONGTEXT COMMENT 'JSON 추가금 항목 [{name, price}]',
    ADD COLUMN IF NOT EXISTS category_detail LONGTEXT COMMENT 'JSON 카테고리 상세 (촬영시간·피팅벌수·얼리스타트 등)',
    ADD COLUMN IF NOT EXISTS available_from  DATE,
    ADD COLUMN IF NOT EXISTS available_to    DATE;

CREATE INDEX IF NOT EXISTS ix_courses_cat_status_price ON courses (category, status, price);
CREATE INDEX IF NOT EXISTS ix_courses_region ON courses (region);

-- 통합 예약 — 스·드·메 조합을 하나의 예약·결제로 (결정 D-005)
CREATE TABLE IF NOT EXISTS reservations (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    customer_id  BIGINT        NOT NULL,
    wedding_date DATE,
    total_amount DECIMAL(12,2) NOT NULL,
    status       VARCHAR(20)   NOT NULL DEFAULT 'REQUESTED' COMMENT 'REQUESTED | ACCEPTED | PAID | CONFIRMED | CANCELLED',
    created_at   DATETIME(6),
    updated_at   DATETIME(6),
    PRIMARY KEY (id),
    KEY ix_reservations_customer_status (customer_id, status),
    FOREIGN KEY (customer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reservation_items (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT        NOT NULL,
    course_id      BIGINT        NOT NULL,
    vendor_id      BIGINT        NOT NULL,
    category       VARCHAR(20)   NOT NULL COMMENT 'STUDIO | DRESS | MAKEUP',
    price_snapshot DECIMAL(12,2) NOT NULL COMMENT '계약 시점 가격 고정 — 이후 상품가 변동과 무관',
    created_at     DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_reservation_category (reservation_id, category) COMMENT '조합=카테고리당 정확히 1개를 DB가 강제',
    KEY ix_items_course (course_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (course_id)      REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 통합 결제 참조 (기존 course_id 단건 결제와 공존)
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS reservation_id BIGINT NULL COMMENT '통합 예약 결제 시 사용',
    ADD INDEX IF NOT EXISTS ix_payments_reservation (reservation_id);

-- 환불 요청 — Human-in-the-loop 감사 추적 (결정 D-008: 결제는 즉시, 환불만 ADMIN 승인)
CREATE TABLE IF NOT EXISTS refund_requests (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    payment_id   BIGINT       NOT NULL,
    customer_id  BIGINT       NOT NULL,
    reason       VARCHAR(500),
    status       VARCHAR(20)  NOT NULL DEFAULT 'REQUESTED' COMMENT 'REQUESTED | APPROVED | REJECTED',
    processed_by BIGINT       COMMENT '처리한 ADMIN user id',
    processed_at DATETIME(6),
    created_at   DATETIME(6),
    PRIMARY KEY (id),
    KEY ix_refund_payment (payment_id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Kafka 컨슈머 멱등 게이트 — 같은 이벤트 중복 전달을 PK 충돌로 흡수
CREATE TABLE IF NOT EXISTS processed_events (
    event_id       VARCHAR(64) NOT NULL,
    consumer_group VARCHAR(50) NOT NULL,
    processed_at   DATETIME(6) NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (event_id, consumer_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

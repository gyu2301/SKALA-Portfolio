-- EventFIT — 웨딩 상품(스튜디오·드레스·메이크업) 추천·예약 플랫폼 초기 DDL
-- Spring JPA ddl-auto: update 로도 생성되지만
-- 명시적 DDL로 테이블 선후 관계를 문서화

-- 회원: 예비부부(CUSTOMER) / 웨딩업체(VENDOR) / 운영자(ADMIN)
-- STUDENT | INSTRUCTOR 는 auth-server(수정 불가 인프라) 시드 계정 호환용 legacy 값
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    role            VARCHAR(20)     NOT NULL COMMENT 'STUDENT | INSTRUCTOR — auth-server(수정불가) 호환 전용, 다른 값 저장 금지',
    user_type       VARCHAR(20)     COMMENT 'CUSTOMER | VENDOR | ADMIN — 도메인 역할 (화면·권한 분기 기준)',
    business_reg_no VARCHAR(20)     COMMENT 'VENDOR 사업자등록번호 (국세청 진위확인 대상)',
    business_name   VARCHAR(100)    COMMENT 'VENDOR 상호명',
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 웨딩업체가 웨딩 상품 등록 (vendor_id → users.id)
CREATE TABLE IF NOT EXISTS courses (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    title            VARCHAR(255)    NOT NULL,
    description      TEXT,
    category         VARCHAR(50)     NOT NULL COMMENT 'STUDIO | DRESS | MAKEUP',
    region           VARCHAR(50)     NOT NULL COMMENT '청담동 | 신사동 | 삼성동 | 선릉로 등 강남구 세부 지역',
    style            VARCHAR(50)     COMMENT '화려 | 미니멀 | 클래식 | 모던 등 (AI 추천 매칭 기준)',
    price            DECIMAL(10,2)   NOT NULL,
    vendor_id        BIGINT          NOT NULL,
    enrollment_count INT             NOT NULL DEFAULT 0 COMMENT '예약 수 (추천 정렬 기준)',
    status           VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE',
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    PRIMARY KEY (id),
    FOREIGN KEY (vendor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 고객이 예약 신청 (user_id → users.id, course_id → courses.id)
-- PENDING 상태가 교환·환불 Human-in-the-loop 의 진입점
CREATE TABLE IF NOT EXISTS enrollments (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    course_id   BIGINT      NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | ACTIVE | CANCELLED',
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_course (user_id, course_id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 예약 확정을 위한 계약금 결제 — 완료 시 Kafka payment.completed 발행 → 예약 ACTIVE 전환
CREATE TABLE IF NOT EXISTS payments (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    course_id       BIGINT          NOT NULL,
    amount          DECIMAL(10,2)   NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | COMPLETED | FAILED | CANCELLED',
    transaction_id  VARCHAR(255)    UNIQUE,
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

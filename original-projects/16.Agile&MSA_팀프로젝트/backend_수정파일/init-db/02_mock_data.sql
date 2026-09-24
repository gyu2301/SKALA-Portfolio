-- 시연용 목데이터 — MariaDB 컨테이너 "최초 생성 시" 1회 자동 실행
-- 리셋: docker compose down -v 후 재기동
-- 모든 시드 계정 비밀번호: Demo1234!  (BCrypt, user-service 인코딩 방식과 동일)

SET @pw = '$2y$10$HOW5x7J7lAkEzmTPd6iNhuqw1iemciCrnPjlm8VwptXKXe/DSa0aW';

-- 회원: 운영자 1 + 예비부부 2 + 웨딩업체 6
-- role 컬럼은 auth-server(수정 불가) enum 호환용 legacy 값만, 도메인 역할은 user_type (트러블슈팅 로그 #8)
INSERT INTO users (id, email, password, name, role, user_type, business_reg_no, business_name, created_at, updated_at) VALUES
(1, 'admin@sdm.kr',      @pw, '운영자',   'INSTRUCTOR', 'ADMIN',    NULL, NULL, NOW(6), NOW(6)),
(2, 'couple1@sdm.kr',    @pw, '유경모',   'STUDENT',    'CUSTOMER', NULL, NULL, NOW(6), NOW(6)),
(3, 'couple2@sdm.kr',    @pw, '김하늘',   'STUDENT',    'CUSTOMER', NULL, NULL, NOW(6), NOW(6)),
(4, 'luce@sdm.kr',       @pw, '로이스튜디오', 'INSTRUCTOR', 'VENDOR', '211-88-10001', '로이스튜디오',     NOW(6), NOW(6)),
(5, 'flor@sdm.kr',       @pw, '메이스튜디오','INSTRUCTOR', 'VENDOR', '211-88-10002', '메이스튜디오',   NOW(6), NOW(6)),
(6, 'blanc@sdm.kr',      @pw, '플로렌스', 'INSTRUCTOR', 'VENDOR', '211-88-10003', '플로렌스 웨딩샵',       NOW(6), NOW(6)),
(7, 'maison@sdm.kr',     @pw, '아비가일', 'INSTRUCTOR', 'VENDOR', '211-88-10004', '아비가일웨딩드레스',       NOW(6), NOW(6)),
(8, 'muse@sdm.kr',       @pw, '청담이유', 'INSTRUCTOR', 'VENDOR', '211-88-10005', '청담 이유',     NOW(6), NOW(6)),
(9, 'atelier@sdm.kr',    @pw, '겐그레아','INSTRUCTOR','VENDOR','211-88-10006','겐그레아', NOW(6), NOW(6));

-- 웨딩 상품 15종 (스튜디오·드레스·메이크업) — 예산 3구간(가성비/스탠다드/럭셔리) × 지역 분포, enrollment_count 는 인기 정렬 데모용
INSERT INTO courses (id, title, description, category, region, style, price, vendor_id, enrollment_count, status, created_at, updated_at) VALUES
-- 스튜디오 (STUDIO)
(1,  '로이 클래식 본식 촬영',      '청담 본점 자연광 스튜디오, 원본 전체 제공',        'STUDIO', '청담동', '클래식', 1800000, 4, 21, 'ACTIVE', NOW(6), NOW(6)),
(2,  '로이 프리미엄 화보 패키지',  '화보 컨셉 3세트 + 야간 촬영 포함',                'STUDIO', '청담동', '화려',   2500000, 4, 12, 'ACTIVE', NOW(6), NOW(6)),
(3,  '메이 미니멀 스냅',         '가로수길 감성 미니멀 스냅, 2시간 촬영',           'STUDIO', '신사동', '미니멀',  900000, 5, 34, 'ACTIVE', NOW(6), NOW(6)),
(4,  '메이 야외 세미 화보',      '도산공원 야외 + 실내 혼합 촬영',                  'STUDIO', '신사동', '모던',   1400000, 5, 18, 'ACTIVE', NOW(6), NOW(6)),
(5,  '메이 데이트 스냅 라이트',  '예산형 60분 스냅, 보정본 30컷',                   'STUDIO', '신사동', '미니멀',  600000, 5, 41, 'ACTIVE', NOW(6), NOW(6)),
-- 드레스 (DRESS)
(6,  '플로렌스 시그니처 벨라인',       '수입 원단 벨라인 3벌 피팅',                       'DRESS',  '청담동', '화려',   2800000, 6,  9, 'ACTIVE', NOW(6), NOW(6)),
(7,  '플로렌스 클래식 A라인',          'A라인 2벌 + 피팅 1회',                            'DRESS',  '청담동', '클래식', 1600000, 6, 17, 'ACTIVE', NOW(6), NOW(6)),
(8,  '아비가일 모던 슬림 라인',        '국내 제작 슬림 드레스 2벌',                       'DRESS',  '선릉로', '모던',   1100000, 7, 26, 'ACTIVE', NOW(6), NOW(6)),
(9,  '아비가일 미니멀 셀렉션',         '미니멀 라인 1벌 + 촬영용 1벌',                    'DRESS',  '선릉로', '미니멀',  800000, 7, 30, 'ACTIVE', NOW(6), NOW(6)),
(10, '아비가일 럭스 커스텀',           '맞춤 제작 프리미엄 드레스',                       'DRESS',  '선릉로', '화려',   3200000, 7,  5, 'ACTIVE', NOW(6), NOW(6)),
-- 메이크업 (MAKEUP)
(11, '청담이유 본식 토탈 메이크업',    '신부+신랑+혼주 2인 패키지',                       'MAKEUP', '청담동', '화려',   1200000, 8, 15, 'ACTIVE', NOW(6), NOW(6)),
(12, '청담이유 내추럴 브라이덜',       '신부 단독, 내추럴 톤',                            'MAKEUP', '청담동', '미니멀',  550000, 8, 38, 'ACTIVE', NOW(6), NOW(6)),
(13, '겐그레아 클래식 브라이덜',   '신부+신랑, 리허설 포함',                          'MAKEUP', '삼성동', '클래식',  750000, 9, 22, 'ACTIVE', NOW(6), NOW(6)),
(14, '겐그레아 모던 룩',           '트렌디 모던 메이크업, 출장 가능',                 'MAKEUP', '삼성동', '모던',    650000, 9, 28, 'ACTIVE', NOW(6), NOW(6)),
(15, '겐그레아 라이트 플랜',       '예산형 신부 단독 플랜',                           'MAKEUP', '삼성동', '미니멀',  380000, 9, 45, 'ACTIVE', NOW(6), NOW(6));

-- 예약·결제 이력 (AI 추천의 "예약 이력 기반" 데모용)
-- couple2(3번)가 플로르 미니멀 스냅(3)을 결제 완료 → ACTIVE
INSERT INTO enrollments (id, user_id, course_id, status, created_at, updated_at) VALUES
(1, 3, 3, 'ACTIVE',  NOW(6), NOW(6)),
(2, 3, 9, 'PENDING', NOW(6), NOW(6));

INSERT INTO payments (id, user_id, course_id, amount, status, transaction_id, created_at, updated_at) VALUES
(1, 3, 3, 900000, 'COMPLETED', 'seed-tx-0001', NOW(6), NOW(6));

-- 계획서 §5 시드 업체 9개 완성 (신규 3)
INSERT INTO users (id, email, password, name, role, user_type, business_reg_no, business_name, created_at, updated_at) VALUES
(20,'julie@sdm.kr',   @pw,'줄리의정원','INSTRUCTOR','VENDOR','211-88-10007','줄리의정원스튜디오',NOW(6),NOW(6)),
(21,'kenneth@sdm.kr', @pw,'더케네스블랑','INSTRUCTOR','VENDOR','211-88-10008','더케네스블랑',NOW(6),NOW(6)),
(22,'chloe@sdm.kr',   @pw,'김선진끌로에','INSTRUCTOR','VENDOR','211-88-10009','김선진끌로에',NOW(6),NOW(6));
INSERT INTO courses (id,title,description,category,region,style,price,vendor_id,enrollment_count,status,created_at,updated_at) VALUES
(20,'줄리의정원 가든 세미화보','자연광 정원 컨셉 세미 화보 촬영','STUDIO','삼성동','내추럴',1300000,20,16,'ACTIVE',NOW(6),NOW(6)),
(21,'더케네스블랑 프리미엄 라인','수입 프리미엄 드레스 3벌 피팅','DRESS','청담동','로맨틱',2400000,21,11,'ACTIVE',NOW(6),NOW(6)),
(22,'김선진끌로에 브라이덜 클린','투명 윤광 브라이덜 메이크업','MAKEUP','신사동','클린',680000,22,25,'ACTIVE',NOW(6),NOW(6));

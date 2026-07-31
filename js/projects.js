// 프로젝트 정보 저장소
// 앞으로 새 프로젝트가 생기면 아래 형식을 복사해서 추가하면 됩니다.

window.projects = [
  {
    id: "prompt-design",

    title: "Prompt 설계와 Context",

    category: "AI & Prompt Engineering",

    period: "2026.07",

    description:
      "Prompt Engineering과 Context 이해를 바탕으로 AI 모델의 성능과 토큰효율을 향상시키기 위한 프로젝트입니다.",

    skills: [
        "Prompt Engineering",
        "Context 이해",
        "AI 모델 성능 향상",
        "토큰 효율 최적화"
    ],

    // 아직 이미지가 없다면 빈칸으로 두어도 됩니다.
    thumbnail: "",

    // 여러 파일을 보여주기 위한 링크 목록입니다.
    links: [
      {
        label: "8반2조 최종응답원문",
        url: "https://github.com/gyu2301/SKALA-Portfolio/blob/main/original-projects/1.%208반2조_최종응답원문.pdf"
      },
      {
        label: "Prompt 설계와 Context",
        url: "https://github.com/gyu2301/SKALA-Portfolio/blob/main/original-projects/1.%20최규원_P275_Prompt_설계와_Context.pdf"
      }
    ],
    github: "",
    colab: "",

    // 상세 페이지에 표시할 내용입니다.
    overview: `
      미국 및 동남아시아 등 주요 국가를 대상으로 한 K-뷰티 상품의 재유입형 해외직구(역직구) 현황과 리스크 분석을 주제로 진행한 프로젝트입니다. 대형 언어 모델(LLM)이 생성한 초기 답변의 한계점을 분석하고, 프롬프트 엔지니어링을 적용하여 실제 경영진이 활용 가능한 수준의 정교한 전략 보고서를 도출하는 것을 목적으로 합니다.
    `,

    process: [
      "K-뷰티 상품 역직구 트렌드를 묻는 초기 프롬프트를 작성하여 베이스라인 답변을 생성하고, 개념 정의 오류와 할루시네이션, 구조화 부족 등의 한계점을 분석했습니다.",
      "모델의 응답 분량이 방대해지는 문제를 해결하기 위해 국가를 미국과 동남아로 제한하고, 화장품 종류를 스킨케어와 색조화장품으로 좁혀 토큰 효율과 정확도를 높였습니다.",
      "Role(컨설턴트), Objective, Context, Constraints(추상적 표현 금지, 근거 제시), Required Analysis, Output Format을 세밀하게 설정하여 개선된 프롬프트를 설계했습니다."
    ],

    result: `
      명확한 프롬프트 설계를 통해 모델은 추상적인 나열에서 벗어나, '국내외 실구매가격 역전', '공식 유통채널 갈등', '할인재고 및 해외 제품의 재유입'을 3대 핵심 기업 리스크로 짚어내는 고품질의 결과물을 생성했습니다. 또한, 글로벌 가격 거버넌스 구축 및 모니터링 체제 마련을 포함하는 시기별(30일·90일·180일) 실행 로드맵까지 성공적으로 도출해 냈습니다.
    `,

    learned: `
      단순한 프롬프트로는 LLM이 분석의 타겟을 오해하거나 근거 없는 사실(할루시네이션)을 생성할 위험이 있다는 것을 확인했습니다. 하지만 분석 대상을 구체적으로 제한하고, 역할 부여 및 세부적인 제약 조건, 목차 포맷 등을 촘촘하게 설계하는 프롬프트 엔지니어링을 거치면 높은 신뢰도를 갖춘 구조화된 컨설팅 보고서를 얻을 수 있음을 배웠습니다.
    `
  },
  {
    id: "boston-housing",

    title: "보스턴 주택가격 회귀분석",

    category: "Machine Learning",

    period: "2026.07",

    description:
      "Boston Housing 데이터셋을 통해 주택가격 중앙값의 분포와 관련 요인을 분석하고, 가설검정과 회귀모형을 통해 예측 성능을 평가한 프로젝트입니다.",

    skills: [
      "Python",
      "Pandas",
      "Seaborn",
      "SciPy",
      "Statsmodels",
      "Scikit-learn",
      "Regression"
    ],

    thumbnail: "assets/images/boston-housing-thumbnail.png",

    github: "",
    colab: "https://colab.research.google.com/github/gyu2301/SKALA-Portfolio/blob/main/original-projects/2.%20최규원_P275_%ED%9A%8C%EA%B7%80%EB%B6%84%EC%84%9D.ipynb",

    overview: `
      Boston Housing 데이터셋을 바탕으로 주택가격 중앙값(medv)에 영향을 주는 요인을 탐색했습니다. 데이터 구조와 결측치, 이상치, 상관관계를 먼저 확인한 뒤, 찰스강 인접 여부가 주택가격에 유의미한 차이를 만드는지 검정하고 다중회귀분석으로 영향 요인을 파악했습니다.
    `,

    process: [
      "데이터의 행·열 수, 타입, 결측치 여부를 확인하고 수치형 변수의 이상치를 IQR 기준으로 점검했습니다.",
      "찰스강 인접 여부에 따라 주택가격 중앙값의 평균 차이가 있는지를 Welch 독립표본 t검정으로 확인했습니다.",
      "상관관계 분석과 OLS 회귀분석을 수행해 주택가격에 영향을 주는 변수를 탐색하고, p-value가 큰 변수는 제외한 뒤 회귀모형을 재설계했습니다.",
      "학습/테스트 데이터로 나누어 LinearRegression 모델을 학습하고, R², MAE, MSE, RMSE를 비교해 예측 성능을 평가했습니다."
    ],

    result: `
      찰스강 인접 여부에 따른 주택가격 차이는 통계적으로 유의미한 것으로 나타났습니다. 회귀분석 결과, zn, chas, rm, rad, b는 주택가격 중앙값과 양의 관계를 보였고, crim, nox, dis, tax, ptratio, lstat는 음의 관계를 보였습니다. 또한 테스트 데이터 기반 예측에서 모델의 설명력과 오차 지표를 확인하며 회귀모형의 성능을 평가했습니다.
    `,

    learned: `
      가설검정과 회귀분석은 서로 다른 질문에 적합한 도구라는 점을 배웠습니다. 변수 선택과 해석의 중요성, 상관관계와 인과관계의 차이, 그리고 모델 평가 지표를 함께 보는 것이 분석 결과를 해석하는 데 필수적이라는 점도 익혔습니다.
    `
  },

  {
    id: "Transformer-Architecture",

    title: "Transformer Architecture 미니 언어모델 구현",

    category: "Machine Learning",

    period: "2026.07",

    description:
      "김유정 단편 8편을 문자 단위로 학습한 Transformer 기반 미니 GPT 언어모델을 구현하고, 학습 손실과 생성 결과를 통해 Transformer의 문맥 이해 및 한계점을 분석한 프로젝트입니다.",

    skills: [
      "Python",
      "PyTorch",
      "Transformer Architecture",
      "NLP",
      "Language Modeling"
    ],

    thumbnail: "assets/images/Transformer-Architecture-thumbnail.png",

    github: "",
    colab: "",
    links: [
      {
        label: "보고서 PDF 보기",
        url: "https://github.com/gyu2301/SKALA-Portfolio/blob/main/original-projects/3.%20최규원_P275_LLM과TransformerArchitecture.pdf"
      }
    ],

    overview: `
      김유정 단편 8편(97,708자, 1,271개 문자 어휘)을 문자 단위로 토큰화하여 Transformer 기반 미니 언어모델을 구현했습니다. Token Embedding과 Position Embedding, Multi-Head Self-Attention, Causal Mask, Residual Connection, MLP를 포함한 6개 Transformer Block 구조를 통해 다음 문자 예측 과정을 실습했습니다.
    `,

    process: [
      "문자 단위 토큰화를 수행하고 Token Embedding과 Position Embedding을 합산하여 입력 벡터를 구성했습니다.",
      "Self-Attention의 Q/K/V, Causal Mask, Multi-Head Attention, Residual Connection, Feed-Forward MLP, Language Model Head를 구현하여 다음 문자 예측 모델을 설계했습니다.",
      "Google Colab GPU에서 2,000회 학습을 진행하며 Training Loss 변화를 분석하고, 학습 전·후 생성 텍스트의 품질 차이를 비교했습니다.",
      "temperature=1.0, top_k=10 샘플링으로 생성된 텍스트를 평가하여 모델이 학습한 문자 패턴과 한국어 문장 구조의 학습 수준을 확인했습니다."
    ],

    result: `
      학습 초기에는 무작위 문자 조합이 대부분이었지만, 500회 이후에는 문장부호와 실제 단어가 나타나기 시작했고, 1,000회 이후에는 대화문과 서술문 형태가 더 분명해졌습니다. 최종 생성 문장은 한국어 문장 형태를 일부 재현했으나, 단어 결합과 의미 연결 측면에서는 여전히 한계가 있어, 모델이 문맥 패턴을 학습했지만 전체 의미 이해는 제한적임을 확인했습니다.
    `,

    learned: `
      Transformer 기반 언어모델은 완성된 문장을 저장해두고 꺼내는 대신 현재 문맥을 바탕으로 다음 문자를 확률적으로 예측하며 텍스트를 생성한다는 점을 이해했습니다. 또한 Loss 감소가 곧 의미적 자연스러움이나 일반화 능력을 보장하지는 않으며, 미니 모델은 Transformer의 기본 원리를 실습하기에 적합하지만 실제 LLM의 대규모 파라미터와 데이터, 지시학습·정렬 과정을 대체할 수 없다는 한계도 확인했습니다.
    `
  },

  {
    id: "car-list-crud",

    title: "중고차 목록 관리 CRUD",

    category: "Web Development",

    period: "2026.07",

    description:
      "등록·수정·삭제·검색·필터링 버튼과 입력 폼을 HTML로 구조화하고, CSS Grid 반응형 레이아웃과 상태 배지 스타일을 적용했으며, JavaScript의 이벤트 위임과 DOM 조작만으로 모든 버튼 동작을 구현한 CRUD 웹 애플리케이션입니다.",

    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "DOM",
      "CRUD",
      "반응형 웹",
      "CSS Grid",
      "이벤트 위임",
      "폼 검증",
      "상태 관리"
    ],

    thumbnail: "assets/images/car-crud-thumbnail.png",

    // 실제 동작하는 데모 페이지 경로입니다.
    demo: "demos/car-list-crud/index.html",

    github: "",
    colab: "",

    overview: `
      HTML로 입력 폼·검색 영역·카드형 목록 영역의 구조를 짜고, CSS Grid와 미디어 쿼리로 2열/1열 반응형 레이아웃과 판매 상태별 배지 색상을 구현했습니다. '등록'·'수정'·'삭제' 버튼과 검색·필터 입력에는 JavaScript로 이벤트 위임과 DOM 조작을 연결해, 별도 프레임워크나 서버 없이 모든 CRUD 기능이 브라우저 안에서 동작하도록 구현했습니다.
    `,

    process: [
      "폼 입력 영역, 검색 영역, 카드형 목록 영역으로 HTML을 구성하고, CSS Grid로 2열 레이아웃을 만든 뒤 미디어 쿼리로 화면이 좁아지면 1열로 전환되는 반응형 스타일과 판매 상태별 배지 색상(status-badge)을 CSS로 구현했습니다.",
      "'등록' 버튼 클릭 시 submit 이벤트로 제조사·모델명·연식·주행거리·가격·연료 입력값을 검증해 차량 객체를 배열에 추가하는 등록 기능을 구현하고, 검증에 실패한 항목마다 alert 경고와 focus 이동을 처리했습니다.",
      "차량 카드마다 새로 렌더링되는 '수정'·'삭제' 버튼에 매번 리스너를 붙이는 대신, 목록 컨테이너 하나에 이벤트 위임(event delegation)을 적용하고 data-action·data-id 속성으로 어떤 차량의 어떤 버튼이 눌렸는지 구분했습니다.",
      "'수정' 버튼은 기존 값을 입력 폼에 채우고 '등록' 버튼을 '수정 완료'로 전환하는 수정 모드로 바꾸며, '삭제' 버튼은 confirm 확인 후 배열에서 제거하고, 검색어 입력·상태 필터 select 값이 바뀔 때마다 목록을 다시 그리는 필터링 기능을 구현했습니다.",
      "차량 이미지가 없거나 로드에 실패하면 img 태그의 error 이벤트를 감지해 '이미지 준비중' 플레이스홀더로 자동 교체되는 예외 처리를 JavaScript로 구현했습니다."
    ],

    result: `
      차량 등록, 조회, 수정, 삭제가 모두 정상적으로 동작하며, 제조사·모델명 검색과 판매 상태 필터가 조합되어도 목록이 올바르게 갱신됩니다. 넓은 화면에서는 입력 영역과 목록 영역이 2열로 배치되고, 좁은 화면에서는 1열로 자동 전환되는 반응형 레이아웃도 확인했습니다.
    `,

    learned: `
      상태(state)를 배열로 관리하고 그 상태를 기준으로 화면을 다시 그리는 렌더링 패턴을 익혔습니다. 등록과 수정이 같은 폼과 검증 로직을 공유하도록 설계하면 코드 중복을 줄일 수 있다는 점과, data 속성과 이벤트 위임을 활용하면 동적으로 생성되는 카드의 버튼도 깔끔하게 제어할 수 있다는 점을 배웠습니다.
    `
  },

  {
    id: "academic-management-system",

    title: "학사관리시스템 설계 및 구현",

    category: "Database",

    period: "2026.07",

    description:
      "학과·교수·학생·과목·수강신청 개체를 아우르는 학사관리시스템의 ERD를 설계하고, PostgreSQL로 제약조건을 반영한 DDL 작성부터 데이터 입력, 다양한 SELECT 조회까지 구현한 프로젝트입니다.",

    skills: [
      "PostgreSQL",
      "SQL",
      "ERD 설계",
      "DDL",
      "제약조건 설계",
      "JOIN",
      "GROUP BY",
      "CASE WHEN",
      "COALESCE",
      "날짜 함수"
    ],

    thumbnail: "assets/images/스마트데이터_종합실습1ERP.png",

    github: "",
    colab: "",
    links: [
      {
        label: "학사관리시스템 설계 및 구현 PDF",
        url: "https://github.com/gyu2301/SKALA-Portfolio/blob/main/original-projects/5.%20판교_08반_최규원.pdf"
      }
    ],

    overview: `
      대학의 학과, 교수, 학생, 과목, 수강신청 정보를 하나의 데이터베이스에서 통합 관리하는 학사관리시스템을 설계하고 구현한 프로젝트입니다. 각 엔터티 간 1:N, M:N 관계를 정의하고 PK·FK·CHECK·UNIQUE·DEFAULT 제약조건으로 데이터 무결성을 보장하는 ERD를 설계한 뒤, PostgreSQL에서 실제 DDL과 DML로 구현했습니다.
    `,

    process: [
      "학과(department)·교수(professor)·학생(student)·과목(course)·수강신청(enrollment) 5개 엔터티의 요구사항을 정의하고, 학과-교수/학생 1:N, 교수-과목 1:N, 교수-학생(지도) 1:N, 학생-과목 M:N 관계를 반영한 ERD를 설계했습니다.",
      "SERIAL 기본키, 외래키 참조, NOT NULL, CHECK(성별 M/F, 학점 1~3, 성적 등급), UNIQUE(학과명, 수강신청 중복 방지), DEFAULT(CURRENT_DATE) 등 제약조건을 포함한 CREATE TABLE DDL을 작성했습니다.",
      "학과 10건, 교수·학생·과목 각 10건 이상, 수강신청 16건의 데이터를 INSERT하고, WHERE·ORDER BY를 활용한 기초 조회 쿼리를 실행했습니다.",
      "COALESCE로 연락처 결측값을 대체 표시하고, CASE WHEN으로 성적을 등급 구간으로 변환했으며, AGE·DATE_PART 날짜 함수로 나이와 재학 연수를 계산했습니다.",
      "학생-과목-교수-학과를 모두 연결하는 다중 JOIN 조회와, 과목별 수강 인원을 집계하는 GROUP BY 쿼리를 작성해 수강신청 교차 테이블을 검증했습니다."
    ],

    result: `
      PostgreSQL 환경에서 5개 테이블 전체의 제약조건이 정상적으로 동작함을 확인했습니다(중복 학과명 방지, 중복 수강신청 방지, 성별·학점·성적 범위 제한 등). 다중 JOIN과 GROUP BY 집계를 통해 학생별 수강 내역과 과목별 수강 인원을 정확히 조회할 수 있었습니다.
    `,

    learned: `
      관계형 데이터베이스에서 M:N 관계는 교차 테이블로 분해해야 한다는 원칙과, PK·FK·CHECK·UNIQUE·DEFAULT 같은 제약조건을 설계 단계에서부터 촘촘히 정의해야 데이터 무결성을 지킬 수 있다는 점을 배웠습니다. 또한 COALESCE, CASE WHEN, 날짜 함수, 다중 JOIN, GROUP BY 집계를 실제 데이터에 적용해보며 요구사항을 SQL로 옮기는 실무 감각을 길렀습니다.
    `
  },

  {
    id: "campushub-advanced-sql",

    title: "CampusHub 고급 SQL 데이터 분석 실습",

    category: "Database",

    period: "2026.07",

    description:
      "종합실습1에서 설계한 CampusHub 학사관리 스키마와 사내 조직도 데이터를 바탕으로, 다중 JOIN·서브쿼리·집합연산·재귀 CTE·윈도우 함수 등 25개의 고급 SQL 문제를 pgAdmin 4에서 직접 풀어낸 실습 프로젝트입니다.",

    skills: [
      "PostgreSQL",
      "서브쿼리",
      "다중 JOIN",
      "RECURSIVE CTE",
      "윈도우 함수",
      "ROLLUP",
      "STRING_AGG",
      "집합 연산",
      "pgAdmin"
    ],

    thumbnail: "assets/images/스마트데이터_종합실습2.png",

    github: "",
    colab: "",
    links: [
      {
        label: "CampusHub 고급 SQL 실습 PDF",
        url: "https://github.com/gyu2301/SKALA-Portfolio/blob/main/original-projects/6.%20판교_08반_최규원_스마트데이터종합실습2.pdf"
      }
    ],

    overview: `
      종합실습1에서 구축한 CampusHub(학과·교수·학생·과목·수강신청) 스키마와 사내 조직도(emp-manager) 데이터를 바탕으로, INNER·OUTER·SELF·CROSS JOIN부터 상관 서브쿼리, 집합 연산, ROLLUP 집계, 재귀 CTE, 윈도우 함수까지 총 25개의 SQL 문제를 pgAdmin 4에서 직접 작성하고 결과를 검증한 실습 프로젝트입니다.
    `,

    process: [
      "데이터 적재 스크립트에서 emp_id 12~311 구간의 manager_id가 잘못 매핑된 off-by-one 오류를 발견해 UPDATE로 수정하고, 매니저별 직속 인원 수를 재검증하는 것으로 실습을 시작했습니다.",
      "INNER·LEFT·RIGHT·FULL OUTER JOIN, SELF JOIN, CROSS JOIN과 NOT EXISTS·EXISTS를 활용한 안티·세미 조인 패턴으로 학생·과목·조직 데이터를 다각도로 조회했습니다.",
      "COALESCE, TO_CHAR 통화 포맷팅, STRING_AGG로 학생별 수강 과목 목록을 집계하고, ROW_NUMBER()로 5개 과목을 매니저에게 순환 배정하는 course_owner 매핑 테이블을 새로 만들었습니다.",
      "스칼라·비상관·상관 서브쿼리와 WITH CTE, UNION ALL 집합 연산, ROLLUP과 GROUPING을 이용한 전공·GPA 구간별 소계·총계 리포트를 작성했습니다.",
      "WITH RECURSIVE로 매니저-부하 조직도를 depth·path까지 계산하는 재귀 트리 쿼리를 구현하고, ROW_NUMBER·RANK·DENSE_RANK·COUNT OVER(PARTITION BY)로 그룹별 Top-N을 서브쿼리 방식과 CTE 방식 두 가지로 각각 구현했습니다.",
      "LAG() 윈도우 함수로 학생별 성적 등급(A~D)을 점수화해 추세를 분석하고, 이동합계·이동평균과 누적 비율을 SUM()·AVG() OVER(ROWS BETWEEN ... PRECEDING)로 계산하며 실습을 마무리했습니다."
    ],

    result: `
      pgAdmin 4에서 총 25개 문항의 쿼리를 모두 실행해 의도한 결과를 확인했습니다. 매니저 11명의 조직 트리가 최대 depth 10까지 재귀적으로 조회되었고, GPA 구간(3.0 미만·3.0~3.5·3.5 초과)별 전공 소계와 전체 총계가 ROLLUP으로 정확히 집계되었으며, 학생별 성적 추세와 누적 비율까지 윈도우 함수로 검증했습니다.
    `,

    learned: `
      단순 JOIN만으로는 풀리지 않는 문제일수록 상관 서브쿼리, 재귀 CTE, 윈도우 함수 같은 고급 기법이 필요하다는 점과, 같은 Top-N 문제도 서브쿼리 방식과 CTE 방식으로 다르게 풀어보며 가독성과 성능 측면의 장단점을 비교할 수 있었습니다. 또한 데이터 적재 단계의 사소한 오류(off-by-one)가 이후 모든 집계 결과를 왜곡시킬 수 있다는 것을 확인하며, 분석 전 데이터 검증의 중요성을 체감했습니다.
    `
  },

  {
    id: "hr-slow-query-tuning",

    title: "HR DB 느린 쿼리 최적화 - EXPLAIN Before/After 비교",

    category: "Database",

    period: "2026.07",

    description:
      "직원 5만 명 규모 HR DB에서 느려진 검색·조회 쿼리를 EXPLAIN (ANALYZE, BUFFERS)로 진단하고, 함수 기반 인덱스·부분 인덱스·복합 인덱스·쿼리 재작성으로 튜닝한 뒤 Before/After 실행계획을 비교 분석한 프로젝트입니다.",

    skills: [
      "PostgreSQL",
      "EXPLAIN ANALYZE",
      "쿼리 튜닝",
      "함수 기반 인덱스",
      "부분 인덱스",
      "복합 인덱스",
      "Index Only Scan",
      "SARGable",
      "실행계획 분석"
    ],

    thumbnail: "assets/images/스마트데이터_종합실습3.png",

    github: "",
    colab: "",
    links: [
      {
        label: "HR DB 느린 쿼리 최적화 PDF",
        url: "https://github.com/gyu2301/SKALA-Portfolio/blob/main/original-projects/7.%ED%8C%90%EA%B5%90_08%EB%B0%98_%EC%B5%9C%EA%B7%9C%EC%9B%90_%EC%8A%A4%EB%A7%88%ED%8A%B8%EB%8D%B0%EC%9D%B4%ED%84%B0%EC%A2%85%ED%95%A9%EC%8B%A4%EC%8A%B53.pdf"
      }
    ],

    overview: `
      직원 수가 5만 명 이상으로 늘면서 검색 속도가 느려지고 보고서 생성이 지연되는 인사 관리 시스템을 가정하고, 이메일 검색·LIKE 접미사 검색·정렬+필터 결합 쿼리·OR 조건 쿼리 총 4가지 유형의 느린 쿼리를 각각 EXPLAIN (ANALYZE, BUFFERS)로 진단한 뒤 인덱스 설계와 쿼리 재작성으로 튜닝하고, Before/After 실행계획과 버퍼·실행시간 지표를 비교한 실습 프로젝트입니다.
    `,

    process: [
      "lower(email)·upper(email) 함수 적용, ILIKE 비교가 각각 왜 인덱스를 타지 못하고 Seq Scan으로 5만 행을 전수 비교하는지 실행계획으로 확인한 뒤, 함수 기반 인덱스(idx_employees_lower_email)와 컬럼 자체가 이미 소문자임을 활용한 함수 제거(sargable 재작성), INCLUDE 커버링 인덱스로 Index Only Scan까지 단계적으로 튜닝했습니다.",
      "'%gmail.com'처럼 선행 와일드카드가 붙은 LIKE, right(), split_part() 접미사 추출 쿼리를 비교하고, reverse() 함수 인덱스+text_pattern_ops, right() 함수 인덱스, split_part() 함수 인덱스 세 방식의 재사용성·인덱스 크기·성능 트레이드오프를 분석했습니다.",
      "최근 365일 입사·재직중 조건으로 급여 상위 100명을 조회하는 쿼리에서 병목이 검색이 아닌 Sort(top-N heapsort/external merge)에 있음을 확인하고, 등호 조건을 앞에 둔 복합 인덱스, status='ACTIVE' 부분 인덱스+salary DESC 정렬 인덱스로 Sort 노드를 제거했으며, WITH ... AS MATERIALIZED로 100건을 먼저 추린 뒤 조인하도록 쿼리 구조를 재작성했습니다.",
      "department_id=10 OR job_id IN (3,4,5) 조건에서 OR 나열·암묵적 타입 캐스팅(::text)이 인덱스를 어떻게 무력화하는지 확인하고, 컬럼별 인덱스+BitmapOr, UNION/UNION ALL 재작성 시 중복 집계 오류를 검증했으며, 캐스팅 제거와 INCLUDE 커버링 인덱스로 Index Only Scan을 유도했습니다.",
      "각 쿼리의 Before/After EXPLAIN 결과에서 Execution Time, Buffers, Heap Blocks, Rows Removed by Filter, Sort Method를 표로 정리해, 실행시간 단축과 버퍼 증감이 항상 비례하지 않는 이유를 블록당 행 밀도(약 63행/블록)와 선택도 관점에서 분석했습니다."
    ],

    result: `
      이메일 등호 검색은 조건을 인덱스와 일치시켜 29.6~320배, 정렬+LIMIT 조기 종료는 103.5배, 조인 전 100건 축소는 40.5배 빨라졌습니다. 반면 LIKE 접미사 검색과 OR 조건 튜닝은 실행 시간은 단축되었지만 대상 행이 여러 블록에 흩어져 있어 Buffers가 오히려 1~8% 증가하는 경우도 확인했으며, 이를 통해 인덱스 튜닝의 효과가 I/O 감소가 아니라 행별 함수·형변환 연산의 CPU 비용 감소에서 온 사례와 실제로 스캔 범위(Heap Blocks)가 줄어든 사례를 구분해 분석했습니다.
    `,

    learned: `
      좋은 쿼리 튜닝은 인덱스를 많이 추가하는 것이 아니라, 컬럼에 함수·형변환을 적용하지 않는 SARGable한 조건으로 작성하고 선택도가 높은 등호 조건을 복합 인덱스 앞쪽에 배치하며, 부분 인덱스·LIMIT 조기 종료·조인 전 필터로 처리해야 할 행 수 자체를 줄이는 것임을 배웠습니다. 또한 Buffers 지표가 항상 튜닝 효과와 비례하지 않으며, 조건값의 선택도가 낮으면 인덱스를 추가해도 읽어야 할 Heap Block 수는 줄지 않을 수 있어 Execution Time·Buffers·Heap Blocks·Rows Removed·Sort Method를 함께 비교해야 진짜 개선 원인(I/O 감소 vs CPU 연산 감소)을 판단할 수 있다는 점을 확인했습니다.
    `
  },

  {
    id: "ecommerce-sales-analysis",

    title: "E-Commerce 매출 분석 및 쿼리 성능 개선",

    category: "Database",

    period: "2026.07",

    description:
      "PostgreSQL 기반 이커머스 스키마에서 실매출·카테고리·RFM·재구매율 등 11개 분석 쿼리를 작성하고, EXPLAIN (ANALYZE, BUFFERS)로 병목을 진단해 재작성 및 인덱스로 튜닝한 뒤 Materialized View로 일별 매출 리포트를 개선한 프로젝트입니다.",

    skills: [
      "PostgreSQL",
      "매출 데이터 분석",
      "RECURSIVE CTE",
      "RFM 분석",
      "WINDOW FUNCTION",
      "안전한 나눗셈 함수",
      "EXPLAIN ANALYZE",
      "쿼리 튜닝",
      "Materialized View",
      "pg_cron",
      "Join 전략 분석"
    ],

    thumbnail: "assets/images/스마트데이터_종합실습4.png",

    github: "",
    colab: "",
    links: [
      {
        label: "E-Commerce 매출 분석 PDF",
        url: "https://github.com/gyu2301/SKALA-Portfolio/blob/main/original-projects/8.%ED%8C%90%EA%B5%90_08%EB%B0%98_%EC%B5%9C%EA%B7%9C%EC%9B%90_%EC%8A%A4%EB%A7%88%ED%8A%B8%EB%8D%B0%EC%9D%B4%ED%84%B0%EC%A2%85%ED%95%A9%EC%8B%A4%EC%8A%B54.pdf"
      }
    ],

    overview: `
      결제 전 상태와 취소·환불 주문을 제외하고 qty * unit_price - discount로 계산한 실매출을 기준으로, 최근 1개월 매출, 월별 주문수·AOV, 카테고리 Top10, 제품 누적매출 랭킹, 고객 RFM, 재구매율, 재고 임계치, 리뷰 우수상품, 쿠폰 효과, 상위 1% 고객 매출까지 총 11개 분석 쿼리를 작성한 PostgreSQL 기반 이커머스 매출 분석 프로젝트입니다. 이후 EXPLAIN (ANALYZE, BUFFERS)로 각 쿼리의 실행계획을 비교해 병목 쿼리를 재작성·인덱싱하고, 반복 조회되는 일별 매출 리포트는 Materialized View로 사전 계산해 조회 성능을 개선했습니다.
    `,

    process: [
      "현재시각과 유효 주문 최대시각 중 이른 값을 분석 기준시점으로 정의해, 시드 데이터의 미래 시각 문제와 과거 조회 시 기간이 비는 문제를 함께 방지하고 (기준시점-기간, 기준시점] 형태로 모든 기간 조건을 통일했습니다.",
      "재귀 CTE로 카테고리 트리의 전체 경로를 만들어 리프 카테고리 기준 최근 90일 매출 Top10을 뽑고, RANK() 윈도우 함수로 제품별 누적매출 Top20(동률 포함)을 산출했으며, RFM(Recency·Frequency·Monetary)과 첫 구매 후 30일 재구매율을 관찰기간이 확보된 고객만 분모로 삼아 계산했습니다.",
      "재고 임계치 미달 상품, HAVING 절 기반 리뷰 4.5점·50건 이상 효자상품, 쿠폰 사용/미사용 그룹별 평균 주문금액, ROW_NUMBER와 CEIL(고객수*1%)로 선정한 상위 1% 고객의 최근 60일 매출을 조회하고, 0 나눗셈 시 NULL을 반환하는 ecom.safe_divide() 함수를 만들어 안전한 AOV 계산에 적용했습니다.",
      "11개 쿼리에 EXPLAIN (ANALYZE, BUFFERS)를 적용해 실행시간·버퍼·스캔 방식을 비교하고, 고객별로 반복 실행되던 Q6의 EXISTS 서브쿼리를 부분 인덱스+윈도우 함수+BOOL_OR 구조로, order_items를 반복 조회하던 Q3을 MATERIALIZED CTE와 커버링 인덱스로 재작성해 각각 189.757ms→8.909ms, 15.434ms→12.879ms로 단축했습니다.",
      "Hash Join·Nested Loop·Bitmap Heap Scan의 동작 원리와 적합한 상황을 비교 분석하고, 반복되는 대규모 조인·집계 비용을 줄이기 위해 결제완료 이상 주문의 일별 매출을 미리 계산하는 mv_daily_gmv Materialized View를 설계했습니다.",
      "day 컬럼에 고유 인덱스를 만들어 CONCURRENTLY 갱신 중에도 조회가 막히지 않도록 하고, 매일 오후 3시 REFRESH MATERIALIZED VIEW CONCURRENTLY를 pg_cron으로 예약하는 운영 절차를 설계했으며, PostgreSQL·MySQL·Oracle·SQL Server의 옵티마이저·조인 전략·사전 계산 기능 차이를 비교 정리했습니다."
    ],

    result: `
      11개 분석 쿼리 모두 의도한 결과를 반환했으며, EXPLAIN 분석으로 실행시간·Shared Hit·Shared Read를 표로 정리해 Q6(재구매율)은 실행시간 95% 이상, Q3(카테고리 Top10)은 버퍼 사용량이 크게 감소했음을 확인했습니다. mv_daily_gmv Materialized View 적용 후에는 원본 테이블을 다시 JOIN·SUM하지 않고 저장된 day·gmv만 읽어 일별 매출 리포트를 즉시 조회할 수 있었습니다.
    `,

    learned: `
      실매출 정의(주문 상태·할인 반영)와 분석 기준시점을 프로젝트 초반에 명확히 고정해야 이후 모든 쿼리의 기간 조건과 집계 결과가 일관된다는 점을 배웠습니다. 또한 Hash Join과 Nested Loop 중 무엇이 항상 우수한 것은 아니며, 동일한 복합 조인이 반복 조회되는 업무에서는 매번 원본을 조인하기보다 Materialized View 같은 사전 계산 구조로 조인·집계 비용 자체를 없애는 것이 더 효과적인 성능 개선 방향이라는 것을 확인했습니다.
    `
  }
];
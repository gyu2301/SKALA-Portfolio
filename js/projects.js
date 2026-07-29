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
  }
];
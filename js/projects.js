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
  }
];
// 한국어/영어 언어 전환 기능
// 우선순위: 주소의 ?lang= 값 → 이전에 선택한 언어 → 브라우저 언어
// 다른 파일의 변수와 이름이 겹치지 않도록 함수로 감싸고, window.i18n만 공개합니다.

(() => {
  const LANG_STORAGE_KEY = "portfolio-lang";
  const SUPPORTED_LANGS = ["ko", "en"];

  // 화면 문구 사전입니다.
  // HTML에 직접 쓰인 한국어 문구는 data-i18n 속성으로 표시하고,
  // 영어 문구만 아래 en에 적어두면 됩니다.
  // JavaScript가 만드는 문구는 ko와 en 모두 적어둡니다.
  const UI_TEXT = {
    ko: {
      "meta.title": "최규원 | Data & AI Portfolio",
      "card.imageAlt": "대표 이미지",
      "card.more": "프로젝트 자세히 보기",
      "projects.empty": "등록된 프로젝트가 없습니다.",
      "detail.titleSuffix": "최규원",
      "detail.demo": "라이브 데모 보기",
      "detail.github": "GitHub 코드 보기",
      "detail.colab": "Colab에서 실행하기",
      "detail.noteLinks": "아래 버튼은 프로젝트의 원문·보고서 PDF로 연결됩니다.",
      "detail.noteColab": "아래 버튼은 Colab 노트북으로 연결됩니다.",
      "detail.noteGithub": "아래 버튼은 GitHub에서 확인할 수 있는 코드로 연결됩니다.",
      "detail.back": "← 프로젝트 목록으로",
      "detail.overview": "프로젝트 개요",
      "detail.process": "분석 과정",
      "detail.result": "분석 결과",
      "detail.learned": "배운 점과 한계점",
      "detail.otherProjects": "다른 프로젝트 보기",
      "detail.notFoundTitle": "프로젝트를 찾을 수 없습니다.",
      "detail.notFoundText": "주소가 잘못되었거나 등록되지 않은 프로젝트입니다.",
      "detail.notFoundBack": "프로젝트 목록으로 돌아가기"
    },

    en: {
      "meta.title": "Gyuwon Choi | Data & AI Portfolio",
      "meta.description": "Data analysis and AI project portfolio of Gyuwon Choi",
      "meta.detailDescription": "Project details from Gyuwon Choi's data analysis and AI portfolio",

      "hero.title": "I analyze data<br><span>and explain what it means.</span>",
      "hero.description":
        "Hi, I'm Gyuwon Choi, and I study data analysis and AI. " +
        "This site documents the projects and learning I completed at SKALA.",
      "hero.viewProjects": "View Projects",
      "hero.github": "Visit GitHub",

      "projects.description":
        "Beyond running code, each project documents the analysis process and what the results mean.",
      "projects.loading": "Loading projects...",

      "skills.description":
        "Analytics and AI skills I have applied across the projects in this portfolio.",
      "skills.python": "Advanced Python & Data Pipelines",
      "skills.e2e": "End-to-End Data Analysis & Missing Data",

      "about.title": "Learn,<br>analyze,<br>document.",
      "about.intro":
        "While studying data analysis and AI, I focus on interpreting " +
        "results logically rather than just producing them.",
      "about.p1":
        "I am currently in the SKALA program, studying Python, data analysis, " +
        "statistics, machine learning, and generative AI.",
      "about.p2":
        "This portfolio records not only project outcomes, but also the problems " +
        "I ran into, how I solved them, and what I learned along the way.",
      "about.point1": "Analysis grounded in understanding the data",
      "about.point2": "Interpretation backed by evidence",
      "about.point3": "Documentation that shows the process",

      "contact.title": "Let's talk.",
      "contact.description": "I will keep adding new projects and learning notes.",

      "footer.top": "Back to top ↑",
      "footer.home": "Back to main page",

      "card.imageAlt": "thumbnail",
      "card.more": "View project details",
      "projects.empty": "No projects yet.",
      "detail.titleSuffix": "Gyuwon Choi",
      "detail.demo": "View Live Demo",
      "detail.github": "View Code on GitHub",
      "detail.colab": "Run in Colab",
      "detail.noteLinks":
        "The buttons below open the original project reports (PDF, written in Korean).",
      "detail.noteColab": "The button below opens the Colab notebook.",
      "detail.noteGithub": "The buttons below link to the source code on GitHub.",
      "detail.back": "← Back to projects",
      "detail.overview": "Overview",
      "detail.process": "Process",
      "detail.result": "Results",
      "detail.learned": "Lessons & Limitations",
      "detail.otherProjects": "See Other Projects",
      "detail.notFoundTitle": "Project not found.",
      "detail.notFoundText": "The address is incorrect or the project does not exist.",
      "detail.notFoundBack": "Back to projects"
    }
  };

  // 기술 태그 중 한국어로 된 것만 영어로 바꿉니다.
  // 목록에 없는 태그는 원래 이름 그대로 표시됩니다.
  const TAG_TEXT_EN = {
    "기초통계": "Descriptive Statistics",
    "가설검정": "Hypothesis Testing",
    "회귀분석": "Regression Analysis",
    "이벤트 위임": "Event Delegation",
    "ERD 설계": "ERD Design",
    "제약조건 설계": "Constraint Design",
    "서브쿼리": "Subqueries",
    "다중 JOIN": "Multi-table JOIN",
    "윈도우 함수": "Window Functions",
    "집합 연산": "Set Operations",
    "쿼리 튜닝": "Query Tuning",
    "인덱스 최적화": "Index Optimization",
    "실행계획 분석": "Execution Plan Analysis",
    "RFM 분석": "RFM Analysis",
    "예외 처리": "Exception Handling",
    "사전등록 가설검정": "Pre-registered Hypotheses",
    "결측치 진단": "Missing Data Diagnosis",
    "부트스트랩": "Bootstrapping",
    "Holm 보정": "Holm Correction",
    "이벤트 기반 아키텍처": "Event-Driven Architecture",
    "Hallucination 평가": "Hallucination Evaluation",
    "Context 이해": "Context Design",
    "AI 모델 성능 향상": "LLM Output Quality",
    "토큰 효율 최적화": "Token Efficiency",
    "반응형 웹": "Responsive Web",
    "폼 검증": "Form Validation",
    "상태 관리": "State Management",
    "날짜 함수": "Date Functions",
    "함수 기반 인덱스": "Function-based Index",
    "부분 인덱스": "Partial Index",
    "복합 인덱스": "Composite Index",
    "매출 데이터 분석": "Sales Data Analysis",
    "안전한 나눗셈 함수": "Safe Division Function",
    "Join 전략 분석": "Join Strategy Analysis",
    "REST API 연동": "REST API Integration",
    "REST API 설계": "REST API Design",
    "메모리 최적화": "Memory Optimization",
    "데이터 검증": "Data Validation",
    "동시성 처리": "Concurrency Control",
    "무승부 처리 로직": "Tie-breaking Logic",
    "MSA 설계": "MSA Design"
  };

  // 현재 언어를 결정합니다.
  function detectLang() {
    const urlLang = new URLSearchParams(window.location.search).get("lang");

    if (SUPPORTED_LANGS.includes(urlLang)) {
      return urlLang;
    }

    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);

      if (SUPPORTED_LANGS.includes(savedLang)) {
        return savedLang;
      }
    } catch (error) {
      // 저장소를 쓸 수 없는 환경이면 브라우저 언어로 넘어갑니다.
    }

    const browserLang = (navigator.language || "ko").toLowerCase();

    return browserLang.startsWith("ko") ? "ko" : "en";
  }

  let currentLang = detectLang();

  function t(key) {
    return UI_TEXT[currentLang][key] ?? UI_TEXT.ko[key] ?? key;
  }

  function translateTag(tag) {
    return currentLang === "en" ? TAG_TEXT_EN[tag] ?? tag : tag;
  }

  // 프로젝트 정보를 현재 언어에 맞게 바꿔서 돌려줍니다.
  // 영어 번역은 projects-en.js에 프로젝트 id별로 저장되어 있습니다.
  function localizeProject(project) {
    if (currentLang !== "en") {
      return project;
    }

    const translation = (window.projectsEn && window.projectsEn[project.id]) || {};
    const { linkLabels, ...fields } = translation;

    const links = project.links
      ? project.links.map((link, index) => ({
          ...link,
          label: (linkLabels && linkLabels[index]) || link.label
        }))
      : project.links;

    return {
      ...project,
      ...fields,
      skills: project.skills.map(translateTag),
      links
    };
  }

  // HTML에 직접 쓰인 문구를 현재 언어로 바꿉니다.
  // 처음 한 번은 원래 한국어 문구를 저장해두었다가 한국어로 돌아올 때 사용합니다.
  function applyStaticText() {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      if (element.dataset.i18nKo === undefined) {
        element.dataset.i18nKo = element.innerHTML;
      }

      const englishText = UI_TEXT.en[element.dataset.i18n];

      element.innerHTML =
        currentLang === "en" && englishText !== undefined
          ? englishText
          : element.dataset.i18nKo;
    });

    document.querySelectorAll("[data-i18n-content]").forEach((element) => {
      if (element.dataset.i18nKo === undefined) {
        element.dataset.i18nKo = element.getAttribute("content");
      }

      const englishText = UI_TEXT.en[element.dataset.i18nContent];

      element.setAttribute(
        "content",
        currentLang === "en" && englishText !== undefined
          ? englishText
          : element.dataset.i18nKo
      );
    });

    document.querySelectorAll(".skill-tags span").forEach((tag) => {
      if (tag.dataset.i18nKo === undefined) {
        tag.dataset.i18nKo = tag.textContent;
      }

      tag.textContent = translateTag(tag.dataset.i18nKo);
    });

    document.documentElement.lang = currentLang;

    document.querySelectorAll(".lang-toggle button").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.lang === currentLang)
      );
    });
  }

  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) {
      return;
    }

    currentLang = lang;

    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (error) {
      // 저장하지 못해도 현재 화면의 언어 전환은 그대로 진행합니다.
    }

    // 주소에도 언어를 남겨서, 복사한 링크가 같은 언어로 열리게 합니다.
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);

    applyStaticText();

    // 프로젝트 목록·상세 화면이 다시 그려지도록 알립니다.
    document.dispatchEvent(new CustomEvent("langchange"));
  }

  document.querySelectorAll(".lang-toggle button").forEach((button) => {
    button.addEventListener("click", () => setLang(button.dataset.lang));
  });

  applyStaticText();

  window.i18n = {
    getLang: () => currentLang,
    t,
    localizeProject
  };
})();

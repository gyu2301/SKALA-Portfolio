// 상세 내용이 표시될 HTML 요소를 찾습니다.
const projectDetail = document.querySelector("#project-detail");

// 현재 주소에서 프로젝트 id를 가져옵니다.
// 예: project.html?id=boston-housing
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("id");

// projects.js에서 같은 id를 가진 프로젝트를 찾습니다.
const selectedProject = window.projects.find(
  (project) => project.id === projectId
);

// 프로젝트를 찾았을 때 실행합니다.
if (selectedProject) {
  // 브라우저 탭 제목을 프로젝트 이름으로 변경합니다.
  document.title = `${selectedProject.title} | 최규원`;

  // 사용 기술을 태그로 만듭니다.
  const skillTags = selectedProject.skills
    .map((skill) => `<span>${skill}</span>`)
    .join("");

  // 분석 과정을 목록으로 만듭니다.
  const processList = selectedProject.process
    .map(
      (process, index) => `
        <li>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <p>${process}</p>
        </li>
      `
    )
    .join("");

  // 프로젝트 링크 목록이 있을 때는 버튼을 여러 개 만듭니다.
  const linkButtons = selectedProject.links && selectedProject.links.length
    ? selectedProject.links
        .map(
          (link) => `
            <a
              href="${link.url}"
              class="button button-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${link.label}
            </a>
          `
        )
        .join("")
    : selectedProject.github
    ? `
        <a
          href="${selectedProject.github}"
          class="button button-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub 코드 보기
        </a>
      `
    : "";

  // Colab 주소가 있을 때만 버튼을 만듭니다.
  const colabButton = selectedProject.colab
    ? `
      <a
        href="${selectedProject.colab}"
        class="button button-secondary detail-secondary-button"
        target="_blank"
        rel="noopener noreferrer"
      >
        Colab 열기
      </a>
    `
    : "";

  // 상세 페이지 전체 내용을 생성합니다.
  projectDetail.innerHTML = `
    <!-- 프로젝트 상단 소개 -->
    <section class="project-detail-hero">
      <div class="container">
        <a href="index.html#projects" class="back-link">
          ← 프로젝트 목록으로
        </a>

        <div class="project-detail-meta">
          <span>${selectedProject.category}</span>
          <span>${selectedProject.period}</span>
        </div>

        <h1>${selectedProject.title}</h1>

        <p class="project-detail-description">
          ${selectedProject.description}
        </p>

        <div class="project-tags project-detail-tags">
          ${skillTags}
        </div>

        ${
          linkButtons || colabButton
            ? `
              <div class="project-detail-buttons">
                ${linkButtons}
                ${colabButton}
              </div>
            `
            : ""
        }
      </div>
    </section>

    <!-- 프로젝트 본문 -->
    <section class="section project-detail-content">
      <div class="container detail-container">
        <article class="detail-section">
          <p class="section-label">OVERVIEW</p>
          <h2>프로젝트 개요</h2>

          <div class="detail-text">
            ${selectedProject.overview}
          </div>
        </article>

        <article class="detail-section">
          <p class="section-label">PROCESS</p>
          <h2>분석 과정</h2>

          <ol class="process-list">
            ${processList}
          </ol>
        </article>

        <article class="detail-section">
          <p class="section-label">RESULT</p>
          <h2>분석 결과</h2>

          <div class="detail-text">
            ${selectedProject.result}
          </div>
        </article>

        <article class="detail-section">
          <p class="section-label">WHAT I LEARNED</p>
          <h2>배운 점과 한계점</h2>

          <div class="detail-text">
            ${selectedProject.learned}
          </div>
        </article>

        <div class="detail-bottom-link">
          <a href="index.html#projects" class="button button-primary">
            다른 프로젝트 보기
          </a>
        </div>
      </div>
    </section>
  `;
} else {
  // 주소에 잘못된 프로젝트 id가 들어온 경우입니다.
  projectDetail.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="project-error">
          <p class="section-label">PROJECT NOT FOUND</p>

          <h1>프로젝트를 찾을 수 없습니다.</h1>

          <p>
            주소가 잘못되었거나 등록되지 않은 프로젝트입니다.
          </p>

          <a href="index.html#projects" class="button button-primary">
            프로젝트 목록으로 돌아가기
          </a>
        </div>
      </div>
    </section>
  `;
}
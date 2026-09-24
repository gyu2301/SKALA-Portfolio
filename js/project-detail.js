// 상세 내용이 표시될 HTML 요소를 찾습니다.
const projectDetail = document.querySelector("#project-detail");

// 현재 주소에서 프로젝트 id를 가져옵니다.
// 예: project.html?id=boston-housing
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("id");

// 언어 전환 기능(i18n.js)에서 번역 함수를 가져옵니다.
const { t, localizeProject } = window.i18n;

// 상세 화면을 현재 언어로 그립니다.
// 언어가 바뀔 때마다 다시 호출됩니다.
function renderProjectDetail() {
  // projects.js에서 같은 id를 가진 프로젝트를 찾습니다.
  const foundProject = window.projects.find(
    (project) => project.id === projectId
  );

  // 프로젝트를 찾았을 때 실행합니다.
  if (foundProject) {
    const selectedProject = localizeProject(foundProject);

    // 브라우저 탭 제목을 프로젝트 이름으로 변경합니다.
    document.title = `${selectedProject.title} | ${t("detail.titleSuffix")}`;

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

    // 데모 주소가 있을 때만 버튼을 만듭니다.
    const demoButton = selectedProject.demo
      ? `
        <a
          href="${selectedProject.demo}"
          class="button button-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${t("detail.demo")}
        </a>
      `
      : "";

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
            ${t("detail.github")}
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
          ${t("detail.colab")}
        </a>
      `
      : "";

    // 버튼이 어디로 연결되는지 알려주는 안내 문구입니다.
    const sourceNote = selectedProject.links && selectedProject.links.length
      ? { icon: "📄", text: t("detail.noteLinks") }
      : selectedProject.colab
      ? { icon: "🧪", text: t("detail.noteColab") }
      : selectedProject.github
      ? { icon: "🔗", text: t("detail.noteGithub") }
      : null;

    const hasButtons = demoButton || linkButtons || colabButton;

    const buttonGroup = hasButtons
      ? `
        <div class="project-detail-buttons">
          ${demoButton}
          ${linkButtons}
          ${colabButton}
        </div>
      `
      : "";

    // 상세 페이지 전체 내용을 생성합니다.
    projectDetail.innerHTML = `
      <!-- 프로젝트 상단 소개 -->
      <section class="project-detail-hero">
        <div class="container">
          <a href="index.html#projects" class="back-link">
            ${t("detail.back")}
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
            sourceNote || hasButtons
              ? `
                <div class="project-detail-actions">
                  ${
                    sourceNote
                      ? `
                        <div class="project-source-note">
                          <div class="project-source-note-text">
                            <span class="project-source-note-icon">${sourceNote.icon}</span>
                            <p>${sourceNote.text}</p>
                          </div>
                          ${buttonGroup}
                        </div>
                      `
                      : buttonGroup
                  }
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
            <h2>${t("detail.overview")}</h2>

            <div class="detail-text">
              ${selectedProject.overview}
            </div>
          </article>

          <article class="detail-section">
            <p class="section-label">PROCESS</p>
            <h2>${t("detail.process")}</h2>

            <ol class="process-list">
              ${processList}
            </ol>
          </article>

          <article class="detail-section">
            <p class="section-label">RESULT</p>
            <h2>${t("detail.result")}</h2>

            <div class="detail-text">
              ${selectedProject.result}
            </div>
          </article>

          <article class="detail-section">
            <p class="section-label">WHAT I LEARNED</p>
            <h2>${t("detail.learned")}</h2>

            <div class="detail-text">
              ${selectedProject.learned}
            </div>
          </article>

          <div class="detail-bottom-link">
            <a href="index.html#projects" class="button button-primary">
              ${t("detail.otherProjects")}
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

            <h1>${t("detail.notFoundTitle")}</h1>

            <p>
              ${t("detail.notFoundText")}
            </p>

            <a href="index.html#projects" class="button button-primary">
              ${t("detail.notFoundBack")}
            </a>
          </div>
        </div>
      </section>
    `;
  }
}

renderProjectDetail();

document.addEventListener("langchange", renderProjectDetail);

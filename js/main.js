// 프로젝트 카드가 들어갈 HTML 요소를 찾습니다.
const projectsGrid = document.querySelector("#projects-grid");

// 프로젝트 개수가 표시될 요소를 찾습니다.
const projectCount = document.querySelector("#project-count");

// 프로젝트 정보가 존재하는지 확인합니다.
if (window.projects && window.projects.length > 0) {
  // 메인 화면에 실제 프로젝트 개수를 표시합니다.
  projectCount.textContent = window.projects.length;

  // 기존의 "불러오는 중" 문장을 제거합니다.
  projectsGrid.innerHTML = "";

  // 프로젝트를 하나씩 꺼내 카드로 만듭니다.
  window.projects.forEach((project) => {
    const projectCard = document.createElement("article");

    projectCard.classList.add("project-card");

    // 대표 이미지가 있으면 이미지를 표시하고,
    // 없으면 프로젝트 제목을 대신 표시합니다.
    const thumbnailContent = project.thumbnail
      ? `
        <img
          src="${project.thumbnail}"
          alt="${project.title} 대표 이미지"
        >
      `
      : `
        <div class="project-thumbnail-placeholder">
          ${project.title}
        </div>
      `;

    // 기술 태그를 자동으로 생성합니다.
    const skillTags = project.skills
      .map((skill) => `<span>${skill}</span>`)
      .join("");

    projectCard.innerHTML = `
      <a href="project.html?id=${project.id}">
        <div class="project-thumbnail">
          ${thumbnailContent}
        </div>

        <div class="project-content">
          <div class="project-meta">
            <span>${project.category}</span>
            <span>${project.period}</span>
          </div>

          <h3>${project.title}</h3>

          <p class="project-description">
            ${project.description}
          </p>

          <div class="project-tags">
            ${skillTags}
          </div>

          <span class="project-link">
            프로젝트 자세히 보기
          </span>
        </div>
      </a>
    `;

    projectsGrid.appendChild(projectCard);
  });
} else {
  // 프로젝트 정보가 없을 때 표시할 문장입니다.
  projectsGrid.innerHTML = `
    <p class="loading-message">
      등록된 프로젝트가 없습니다.
    </p>
  `;

  projectCount.textContent = "0";
}
// 카테고리 정보 (표시 순서, 라벨, 아이콘)
const CATEGORIES = [
  { key: 'realistic', label: '현실적인 변명', icon: '🧩' },
  { key: 'shameless', label: '뻔뻔한 변명', icon: '😎' },
  { key: 'touching', label: '감동적인 변명', icon: '😢' },
  { key: 'scifi', label: 'SF 영화급 변명', icon: '🛸' },
  { key: 'forbidden', label: '절대 사용하면 안 되는 변명', icon: '⚠️' },
]

// 상대방별 존댓말/반말 구분과 인사말, 마무리 말
const RECIPIENTS = {
  professor: {
    label: '교수님',
    formal: true,
    openings: [
      '교수님, 드릴 말씀이 있습니다.',
      '교수님, 죄송한 말씀 먼저 드립니다.',
      '교수님, 사실 말씀드리기 조심스럽지만...',
    ],
    closings: [
      '넓은 마음으로 양해 부탁드립니다.',
      '다시는 이런 일이 없도록 하겠습니다.',
      '이해해 주시면 정말 감사하겠습니다.',
    ],
  },
  boss: {
    label: '직장 상사',
    formal: true,
    openings: [
      '팀장님, 잠시 드릴 말씀이 있습니다.',
      '팀장님, 보고드릴 게 있는데 조금 곤란한 내용입니다.',
      '팀장님, 먼저 죄송하다는 말씀부터 드리겠습니다.',
    ],
    closings: [
      '다음부터는 절대 이런 일 없도록 하겠습니다.',
      '너그럽게 봐주시면 감사하겠습니다.',
      '바로 만회하겠습니다.',
    ],
  },
  friend: {
    label: '친구',
    formal: false,
    openings: [
      '야, 사실 할 말이 있어.',
      '저기... 사실대로 말할게.',
      '미안한데 사실은 말이야.',
    ],
    closings: [
      '진짜 미안해, 이해해 줘.',
      '다음에 내가 제대로 갚을게.',
      '너니까 믿고 말하는 거야.',
    ],
  },
}

// 카테고리별 변명의 핵심 문장. formal은 교수님·상사용, casual은 친구용이다.
const REASON_BANK = {
  realistic: {
    formal: [
      '어제 밤늦게까지 준비하다가 컴퓨터가 갑자기 꺼지면서 파일이 저장되지 않았습니다.',
      '집에 갑작스러운 일이 생겨 급히 처리하느라 시간을 놓쳤습니다.',
      '몸살 기운이 있어 병원에 다녀오느라 예정보다 늦어졌습니다.',
    ],
    casual: [
      '어제 늦게까지 준비하다가 컴퓨터가 꺼지면서 파일이 다 날아갔어.',
      '집에 급한 일이 생겨서 거기 정신이 팔려 있었어.',
      '몸이 안 좋아서 병원 갔다 오느라 늦었어.',
    ],
  },
  shameless: {
    formal: [
      '사실 그냥 깜빡했습니다. 이번 한 번만 넘어가 주시면 다음부터는 확실히 하겠습니다.',
      '일정이 너무 많아서 순위에서 밀렸습니다. 그래도 이렇게 솔직히 말씀드리는 태도는 나쁘지 않지 않습니까.',
      '원래 하려고 했는데 다른 걸 보다가 시간 가는 줄 몰랐습니다.',
    ],
    casual: [
      '사실 그냥 깜빡했어. 이번만 좀 봐줘라.',
      '할 일이 너무 많아서 우선순위에서 밀렸어. 근데 이렇게 솔직하게 말하는 거 보면 나 좀 괜찮지 않냐.',
      '하려고 했는데 딴 거 보다가 시간 가는 줄 몰랐어 ㅋㅋ',
    ],
  },
  touching: {
    formal: [
      '사실 요즘 개인적으로 힘든 일이 있어서 마음을 추스르는 데 시간이 걸렸습니다. 그럼에도 포기하지 않고 여기까지 온 것에 의미를 두고 싶습니다.',
      '가족 중 한 분이 편찮으셔서 곁을 지키느라 다른 일에 집중하기 어려웠습니다.',
      '제 나름대로는 최선을 다했지만 결과가 따라주지 않았습니다. 그 과정만큼은 알아주셨으면 합니다.',
    ],
    casual: [
      '사실 요즘 좀 힘든 일이 있어서 마음 추스르느라 그랬어. 그래도 포기 안 하고 여기까지 온 거 알아줬으면 해.',
      '가족이 좀 아파서 옆에 있어야 했어.',
      '나름 최선을 다했는데 결과가 안 따라줬어. 과정은 진심이었어.',
    ],
  },
  scifi: {
    formal: [
      '사실 어젯밤 시공간이 뒤틀리는 현상을 겪었고, 그 여파로 하루가 통째로 사라졌습니다.',
      '평행우주에서 온 또 다른 제가 이 일을 대신 처리해 주기로 했는데 아직 도착하지 않았습니다.',
      '일정을 관리하던 인공지능이 오류를 일으켜 시간 좌표가 꼬였습니다.',
    ],
    casual: [
      '사실 어젯밤에 시공간이 뒤틀리는 걸 겪었는데, 그 여파로 하루가 통째로 사라졌어.',
      '평행우주에 있는 또 다른 내가 이거 대신 해주기로 했는데 아직 안 왔어.',
      'AI가 내 일정 관리하다가 오류나서 시간 좌표가 꼬였어.',
    ],
  },
  forbidden: {
    formal: [
      '사실 이건 애초에 불가능한 요구였다고 생각합니다.',
      '이 정도는 원래 다들 그렇게 하지 않습니까.',
      '솔직히 그렇게 중요한 일이라고 생각하지 않았습니다.',
    ],
    casual: [
      '사실 이건 애초에 좀 무리한 부탁이었다고 생각해.',
      '다들 이 정도는 그냥 넘어가지 않냐.',
      '솔직히 그렇게 중요한 일이라고 생각 안 했어.',
    ],
  },
}

// 카테고리별 성공 확률 범위 (상대방 보정 전)
const PROBABILITY_RANGE = {
  realistic: [55, 80],
  shameless: [15, 40],
  touching: [35, 65],
  scifi: [1, 8],
  forbidden: [-15, 5],
}

// 상대방에 따라 성공 확률을 가감한다.
const RECIPIENT_MODIFIER = {
  professor: 0,
  boss: -8,
  friend: 10,
}

// 카테고리별로 상대방이 보일 법한 반응 유형
const REACTION_TYPE = {
  realistic: 'believable',
  shameless: 'skeptical',
  scifi: 'absurd',
  forbidden: 'angry',
}

// 상대방·반응 유형별 예상 답변
const REPLY_BANK = {
  professor: {
    believable: [
      '음, 그런 사정이 있었으면 어쩔 수 없죠. 다음엔 미리 말씀해 주세요.',
      '알겠습니다. 이번엔 넘어가겠지만 다음부턴 주의하세요.',
    ],
    skeptical: [
      '...정말입니까? 어딘가 믿음이 안 가는군요.',
      '다음 번엔 좀 더 그럴듯한 이유를 준비해 오세요.',
    ],
    moved: [
      '그런 사정이 있었군요. 힘든 얘기 해줘서 고맙습니다. 이번엔 이해하겠습니다.',
      '고생 많았네요. 다음엔 미리 얘기해 주면 좋겠습니다.',
    ],
    absurd: [
      '지금 저랑 장난하십니까?',
      '...상담 센터 번호를 알려드릴까요?',
    ],
    angry: [
      '지금 그걸 변명이라고 하는 겁니까?',
      '학생, 다시 얘기해 보시죠.',
    ],
  },
  boss: {
    believable: [
      '그런 사정이면 어쩔 수 없죠. 다음엔 미리 보고해 주세요.',
      '알겠습니다. 이번만 넘어가겠습니다.',
    ],
    skeptical: [
      '흠... 진짜예요?',
      '다음부턴 좀 더 설득력 있는 이유를 준비하세요.',
    ],
    moved: [
      '그런 일이 있었군요. 미리 말하지 그랬어요. 이번은 이해합니다.',
      '고생했네요. 다음엔 얘기 좀 해주세요.',
    ],
    absurd: [
      '지금 나랑 장난해요?',
      '...퇴근하고 좀 쉬어요.',
    ],
    angry: [
      '지금 그걸 보고라고 하는 겁니까?',
      '다시 제대로 설명해 보세요.',
    ],
  },
  friend: {
    believable: [
      '아 그랬구나, 어쩔 수 없었네. 다음엔 미리 말해줘.',
      '그럴 수도 있지 뭐. 담부턴 조심해.',
    ],
    skeptical: [
      '진짜야...? 좀 의심스러운데.',
      '야 그거 좀 약한데 ㅋㅋ',
    ],
    moved: [
      '아... 힘들었겠다. 얘기해줘서 고마워. 이번엔 이해할게.',
      '고생했네 진짜. 담엔 미리 말해줘라.',
    ],
    absurd: [
      '...너 지금 나 놀리냐?',
      '스트레스 좀 풀고 와라 ㅋㅋㅋ',
    ],
    angry: [
      '와 진짜 어이없다.',
      '야 그건 좀 아니지 않냐?',
    ],
  },
}

// HTML 요소 가져오기
const situationInput = document.querySelector('#situationInput')
const recipientSelect = document.querySelector('#recipientSelect')
const generateButton = document.querySelector('#generateButton')

const resultsSection = document.querySelector('#resultsSection')
const resultsSubtext = document.querySelector('#resultsSubtext')
const resultsGrid = document.querySelector('#resultsGrid')

const battleSection = document.querySelector('#battleSection')
const battleArena = document.querySelector('#battleArena')
const newBattleButton = document.querySelector('#newBattleButton')
const scoreboardList = document.querySelector('#scoreboardList')

// 방금 생성한 변명 5종을 저장해 둔다. 복사, 배틀 기능에서 재사용한다.
let currentExcuses = []

// 변명 유형별 배틀 승리 횟수. 브라우저를 새로 열어도 유지되도록 저장한다.
let battleScore = loadScore()

// 목록에서 무작위로 하나를 꺼낸다.
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// 배열을 무작위로 섞은 새 배열을 반환한다.
function shuffleCopy(list) {
  const copy = list.slice()

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }

  return copy
}

// 변명 문장을 조립한다.
function buildExcuseText(category, recipientKey, situation) {
  const recipient = RECIPIENTS[recipientKey]
  const formality = recipient.formal ? 'formal' : 'casual'

  const opening = pickRandom(recipient.openings)
  const closing = pickRandom(recipient.closings)
  const reason = pickRandom(REASON_BANK[category][formality])

  const leadIn = recipient.formal
    ? `『${situation}』, 이렇게 된 데에는 사실 이유가 있습니다.`
    : `『${situation}』, 사실 이렇게 된 데에는 이유가 있어.`

  return `${opening} ${leadIn} ${reason} ${closing}`
}

// 카테고리별 성공 확률을 계산한다. 0~99 사이로 제한한다.
function calcProbability(category, recipientKey) {
  const [min, max] = PROBABILITY_RANGE[category]
  const base = min + Math.random() * (max - min)
  const value = Math.round(base + RECIPIENT_MODIFIER[recipientKey])

  return Math.max(0, Math.min(99, value))
}

// 감동적인 변명은 상대방이 감동할 수도, 반신반의할 수도 있어 무작위로 반응 유형을 정한다.
function getReactionType(category) {
  if (category === 'touching') {
    return pickRandom(['moved', 'skeptical'])
  }

  return REACTION_TYPE[category]
}

function buildReply(category, recipientKey) {
  const reactionType = getReactionType(category)
  return pickRandom(REPLY_BANK[recipientKey][reactionType])
}

// 카테고리 5종의 변명, 성공 확률, 예상 답변을 한 번에 만든다.
function generateExcuses(situation, recipientKey) {
  return CATEGORIES.map(function (categoryInfo) {
    return {
      key: categoryInfo.key,
      label: categoryInfo.label,
      icon: categoryInfo.icon,
      text: buildExcuseText(categoryInfo.key, recipientKey, situation),
      probability: calcProbability(categoryInfo.key, recipientKey),
      reply: buildReply(categoryInfo.key, recipientKey),
    }
  })
}

// 생성 결과를 화면에 그린다.
function renderResults(excuses, recipientLabel) {
  resultsGrid.innerHTML = excuses
    .map(function (excuse, index) {
      const warningHtml =
        excuse.key === 'forbidden'
          ? '<p class="forbidden-warning">⚠️ 실제로 사용하면 관계가 더 나빠질 수 있습니다.</p>'
          : ''

      return `
        <article class="excuse-card ${excuse.key}">
          <div class="excuse-card-header">
            <span class="excuse-icon">${excuse.icon}</span>
            <h3>${excuse.label}</h3>
          </div>

          <p class="excuse-text">${excuse.text}</p>

          <div class="probability-row">
            <span class="probability-label">성공 확률</span>
            <div class="probability-bar">
              <div class="probability-fill" style="width: ${excuse.probability}%"></div>
            </div>
            <span class="probability-value">${excuse.probability}%</span>
          </div>

          ${warningHtml}

          <div class="reply-box">
            <p class="reply-label">예상 답변 · ${recipientLabel}</p>
            <p class="reply-text">${excuse.reply}</p>
          </div>

          <button type="button" class="copy-button" data-index="${index}">
            변명 복사하기
          </button>
        </article>
      `
    })
    .join('')

  resultsSection.hidden = false
  resultsSubtext.textContent =
    `"${recipientLabel}"에게 사용할 변명 5종을 만들었습니다. 그럴듯한 순서는 아니니 참고만 하세요.`
}

// 텍스트를 클립보드에 복사한다. 최신 API가 없으면 임시 textarea로 대체한다.
function copyToClipboard(text, button) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showCopied(button)
    })
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'

  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)

  showCopied(button)
}

function showCopied(button) {
  const originalText = button.textContent
  button.textContent = '복사됨!'

  setTimeout(function () {
    button.textContent = originalText
  }, 1500)
}

// 결과 카드 안의 복사 버튼 처리 (이벤트 위임)
resultsGrid.addEventListener('click', function (event) {
  const button = event.target.closest('.copy-button')

  if (button === null) {
    return
  }

  const index = Number(button.dataset.index)
  copyToClipboard(currentExcuses[index].text, button)
})

// 생성된 변명 중 두 개를 무작위로 뽑아 배틀 화면을 만든다.
function startNewBattle() {
  if (currentExcuses.length < 2) {
    return
  }

  const pair = shuffleCopy(currentExcuses).slice(0, 2)
  renderBattle(pair)
}

function renderBattle(pair) {
  battleSection.hidden = false

  battleArena.innerHTML = pair
    .map(function (excuse) {
      return `
        <div class="battle-card">
          <div class="battle-card-header">
            <span class="excuse-icon">${excuse.icon}</span>
            <h3>${excuse.label}</h3>
          </div>
          <p class="excuse-text">${excuse.text}</p>
          <button type="button" class="vote-button" data-category="${excuse.key}">
            이 변명 승리!
          </button>
        </div>
      `
    })
    .join('<div class="battle-vs">VS</div>')

  renderScoreboard()
}

// 배틀 투표 버튼 처리 (이벤트 위임)
battleArena.addEventListener('click', function (event) {
  const button = event.target.closest('.vote-button')

  if (button === null) {
    return
  }

  const category = button.dataset.category
  battleScore[category] = (battleScore[category] || 0) + 1
  saveScore(battleScore)

  startNewBattle()
})

newBattleButton.addEventListener('click', startNewBattle)

// 승리 기록판을 그린다.
function renderScoreboard() {
  const scores = CATEGORIES.map(function (categoryInfo) {
    return battleScore[categoryInfo.key] || 0
  })
  const maxScore = Math.max(1, ...scores)

  scoreboardList.innerHTML = CATEGORIES.map(function (categoryInfo) {
    const score = battleScore[categoryInfo.key] || 0
    const width = Math.round((score / maxScore) * 100)

    return `
      <div class="score-row">
        <span class="score-label">${categoryInfo.icon} ${categoryInfo.label}</span>
        <div class="score-bar"><div class="score-fill" style="width: ${width}%"></div></div>
        <span class="score-value">${score}승</span>
      </div>
    `
  }).join('')
}

function loadScore() {
  const saved = localStorage.getItem('ai-excuse-factory-battle-score')

  if (saved === null) {
    return { realistic: 0, shameless: 0, touching: 0, scifi: 0, forbidden: 0 }
  }

  return JSON.parse(saved)
}

function saveScore(score) {
  localStorage.setItem('ai-excuse-factory-battle-score', JSON.stringify(score))
}

// 빠른 입력 칩을 누르면 입력창에 예시 문장을 채운다.
document.querySelectorAll('.chip').forEach(function (chip) {
  chip.addEventListener('click', function () {
    situationInput.value = chip.dataset.example
    situationInput.focus()
  })
})

// 변명 생성 버튼 처리
generateButton.addEventListener('click', function () {
  const situation = situationInput.value.trim()

  if (situation === '') {
    alert('먼저 어떤 상황인지 입력해 주세요.')
    situationInput.focus()
    return
  }

  const recipientKey = recipientSelect.value
  const recipientLabel = RECIPIENTS[recipientKey].label

  currentExcuses = generateExcuses(situation, recipientKey)
  renderResults(currentExcuses, recipientLabel)
  startNewBattle()

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

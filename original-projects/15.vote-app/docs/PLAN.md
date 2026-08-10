# 링크 공유형 투표 웹사이트 구현 계획

## Context

링크 하나로 공유해서 여러 사람이 참여하는 투표 사이트를 만든다. 주 용도는 팀 점심 메뉴 정하기와 일정 조율.
현재 관련 코드베이스는 없는 신규 프로젝트다. 다만 `~/Documents/saju-idol-match-.../worker/`에서
Cloudflare Worker + KV + `wrangler secret put ADMIN_TOKEN` / `IP_SALT` 패턴을 이미 써본 이력이 있어,
그 관례(시크릿은 toml에 두지 않고 `wrangler secret`으로 등록)를 그대로 따른다.

결과물은 계정 가입 없이 링크만으로 참여 가능하되, 아무나 남의 투표를 지울 수는 없는 사이트다.

### 확정된 설계 결정 (대화에서 합의)

| 항목 | 결정 |
|---|---|
| 참여자 식별 | 계정 없음. 이름 입력 + `localStorage` voterId. 생성 시 **참여자 명단은 선택 입력** |
| 날짜투표 | **When2meet 그리드형** (날짜×시간 격자 드래그 → 히트맵) |
| 투표 타입 | **`choice`(선택지 투표) / `schedule`(날짜 조율) 두 타입 분리**. 공통 옵션은 양쪽 동일 적용 |
| 관리자 | **투표별 관리 비번 + 전역 관리자** (`/admin`) 양쪽 다 |
| 마감 | **마감시각 + 수동 마감 + 명단 전원 완료 시 자동 마감** 세 가지 모두 |
| 데이터 정합성 | **투표 1건 = KV 키 1개** (ballot-per-key), 집계는 `list()` |
| 재투표 | **같은 링크에서 라운드 증가** (동점 선택지만 남기고 표 초기화) |
| 결과 공개 | 생성 시 `항상 / 내가 투표한 뒤 / 마감 후` 중 선택 (기본: 내가 투표한 뒤) |
| 배포 | **단일 Worker** (Workers Static Assets로 SPA + `/api/*` 동시 서빙) |
| 중복 방지 | 브라우저 voterId + IP 해시(솔트 적용, 원본 IP 미저장) |
| 스타일링 | **Tailwind CSS v4** (`@tailwindcss/vite`), UI 라이브러리 없음 |
| 위치 | `~/Documents/SKALA/vote-app`, 신규 git 저장소 |

### 검증된 버전 (2026-08-09 기준, npm 조회)

vite 8.2.1 · @vitejs/plugin-react 6.0.5 · react 19.2.8 · tailwindcss/@tailwindcss/vite 4.3.3 ·
wrangler 4.120.0 · vitest 4.1.10 · @cloudflare/vitest-pool-workers 0.20.3 (peer: vitest ^4.1.0 — 호환 확인됨)

---

## 핵심 기술 설계

### 1. KV로 표 유실 없이 집계하기 — metadata 활용

KV는 read-modify-write가 원자적이지 않으므로 집계값을 한 키에 두면 동시 투표 시 표가 사라진다.
따라서 **투표 1건마다 별도 키**를 쓴다. 서로 다른 키라 쓰기 충돌이 원천적으로 없다.

문제는 집계다. `list()`는 **키 이름만** 돌려주므로 값을 읽으려면 N번의 `get()`이 필요하고,
이는 Workers 서브리퀘스트 한도(무료 50/요청)에 바로 걸린다.

**해결: 집계에 필요한 최소 정보를 KV metadata에 넣는다.** `list()`는 각 키의 metadata를 **함께** 반환하므로
**추가 read 0회**로 전체 집계가 끝난다.

```js
// 쓰기: 상세는 value에, 집계용 요약은 metadata에
await env.VOTE_KV.put(
  `ballot:${pollId}:${round}:${voterId}`,
  JSON.stringify(fullBallot),
  { metadata: { n: name, s: [0, 2], t: Date.now(), a: false } }   // a = 기권
);

// 집계: list 한 번으로 끝. get() 호출 없음
const { keys, list_complete, cursor } = await env.VOTE_KV.list({ prefix: `ballot:${pollId}:${round}:` });
for (const k of keys) tally(k.metadata);
```

제약과 대응:
- **metadata는 키당 1024바이트** — `choice`는 수십 바이트. `schedule`은 슬롯을 **비트마스크 → base64**로
  인코딩(최대 14일 × 48슬롯 = 672비트 = base64 112자)해 넉넉히 들어간다.
  서버에서 직렬화 크기를 검사해 초과 시 400을 반환한다.
- **`list()`는 페이지당 1000개** — `cursor`로 이어받는 루프를 구현한다(실질 도달 가능성은 낮음).
- **KV는 결과적 일관성(eventual consistency)** — 방금 낸 내 표가 목록에 바로 안 보일 수 있다.
  클라이언트가 자기 ballot을 voterId 기준으로 낙관적 병합해 화면에서는 즉시 반영한다.
  이 한계와 Durable Objects 업그레이드 경로를 README에 명시한다.

### 2. 마감은 Cron 없이 지연 평가

`closeAt`이 지났는지는 **투표를 읽을 때마다 서버가 확인**해서 상태를 전환한다. Cron Trigger 불필요.
마감 시 그 시점의 집계를 `result:{pollId}:{round}`에 **동결 저장**해, 이후 누가 봐도 같은 결과가 나오게 한다.

### 3. 룰렛 승자는 결정적(deterministic)으로 뽑는다

동시에 두 명이 결과 화면을 열어도 승자가 갈리면 안 된다. `crypto.getRandomValues()`로 뽑아 저장하면
경합 구간이 생기므로, **HMAC 시드**로 뽑는다:

```js
seed = HMAC-SHA256(AUTH_SECRET, `tiebreak:${pollId}:${round}:${ballotSetHash}`)
winnerIndex = Number(BigInt('0x' + seed.slice(0, 16)) % BigInt(tiedOptions.length))
```

같은 입력이면 언제 누가 계산해도 같은 답이 나오므로 경합이 무해하다.
서버 시크릿이 섞여 있어 참여자가 결과를 미리 예측할 수도 없다.
클라이언트는 저장된 승자 인덱스로 **역산한 각도**까지 휠을 회전시킨다 — 새로고침해도 승자는 동일하다.

### 4. 무승부 처리 UX (요구사항 2)

생성 시 `무승부 처리` = `룰렛 자동 / 재투표 자동 / 마감 후 관리자가 선택` 3지선다.
`마감 후 선택`이면 마감 시점에 관리자에게 **[룰렛 돌리기] / [재투표 시작]** 두 버튼을 띄운다 (요구사항 문구에 가장 충실).
재투표는 `round += 1`, 동점 선택지만 남기고 표 초기화, **URL은 그대로**. 이전 라운드는 `history`에 보관한다.
마지막 라운드에서 또 동점이면 룰렛을 권하는 안내를 띄운다.

### 5. 인증

- **투표별**: 생성 시 관리 비번 → `adminSalt`(랜덤) + `SHA-256(salt + pw)`만 저장.
  검증 성공 시 12시간짜리 HMAC 서명 토큰을 발급해 `localStorage`에 둔다.
- **전역**: `ADMIN_PASSWORD` 시크릿으로 `/admin` 로그인 → `role: "global"` 토큰. 모든 투표 조회·삭제 가능.
- 시크릿 3개: `AUTH_SECRET`(토큰 서명 + 룰렛 시드), `IP_SALT`, `ADMIN_PASSWORD`.

### 6. 중복투표 방지

1. **1차 키 = voterId** (`localStorage`의 `crypto.randomUUID()`). 재접속 시 본인 투표를 수정할 수 있다.
2. **기명 모드에서는 이름도 유니크 키.** 이미 있는 이름이면 "본인이면 수정, 아니면 다른 이름" 안내.
3. **보조 = IP 해시**: `SHA-256(IP_SALT + cf-connecting-ip + pollId)`. poll마다 값이 달라 IP 추적이 불가능하다.
   같은 IP에서 서로 다른 voterId가 `maxPerIp`(**기본 5**)를 넘으면 차단.
   → 사내 공용망(NAT)에서 여러 명이 같은 IP를 쓰는 오탐을 막기 위해 기본값을 넉넉히 잡는다.

### 7. 익명 ↔ 명단의 모순 방지

명단·완료현황은 "누가 투표했는지"를 아는 기능이므로 **익명 모드에서는 비활성화**한다.
UI에서 익명을 켜면 명단 입력과 `전원 완료 시 자동 마감`이 자동으로 잠긴다. 익명일 때는 참여자 **수**만 표시한다.

---

## 프로젝트 구조

```
~/Documents/SKALA/vote-app/
├─ wrangler.jsonc          # assets + KV 바인딩
├─ vite.config.js          # react + tailwind 플러그인
├─ vitest.config.js        # workers pool
├─ index.html
├─ shared/                 # 프론트/워커 공용 순수 로직 (import 경로만 다름)
│  ├─ slots.js             # 그리드 슬롯 ↔ 비트마스크(base64) 인코딩
│  └─ constants.js         # 가격대 구간, 제한값
├─ src/                    # React SPA
│  ├─ main.jsx, App.jsx, api.js, index.css
│  ├─ lib/voter.js         # localStorage voterId / 관리 토큰 / 최근 투표 목록
│  ├─ pages/
│  │  ├─ Home.jsx          # 최근 만든·참여한 투표 (localStorage 기반)
│  │  ├─ CreatePoll.jsx    # 타입 선택 → 선택지/일정 입력 → 옵션 설정
│  │  ├─ PollView.jsx      # 투표 화면 (타입별 분기)
│  │  ├─ ResultView.jsx    # 결과 + 무승부 패널
│  │  └─ AdminPage.jsx     # 전역 관리자
│  └─ components/
│     ├─ choice/OptionEditor.jsx, OptionCard.jsx      # 메뉴명·가게명·가격대
│     ├─ schedule/TimeGrid.jsx, Heatmap.jsx           # 드래그 선택 / 히트맵
│     ├─ tiebreak/RouletteWheel.jsx, TiebreakPanel.jsx
│     ├─ ParticipantPanel.jsx                          # 완료현황·미참여자
│     └─ ui/                                           # Button, Modal, Toast, Field
└─ worker/
   ├─ index.js             # 라우터 + /p/* OG 태그 주입
   ├─ routes/polls.js, ballots.js, results.js, admin.js
   └─ lib/
      ├─ kv.js             # 키 규약, cursor 페이징 list 집계
      ├─ auth.js           # 비번 해시, HMAC 토큰 발급/검증
      ├─ tally.js          # 집계 + 1위 동점 판정 (choice/schedule 공용)
      ├─ tiebreak.js       # HMAC 시드 룰렛, 라운드 전환
      ├─ dedupe.js         # voterId / 이름 / IP 해시 검사
      └─ schema.js         # 입력 검증 (라이브러리 없이 수동)
```

### `wrangler.jsonc` 핵심

```jsonc
{
  "name": "vote-app",
  "main": "worker/index.js",
  "compatibility_date": "2026-08-01",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*", "/p/*"]   // 스키마 확인 완료: 글롭 배열 지원
  },
  "kv_namespaces": [{ "binding": "VOTE_KV", "id": "<생성 후 교체>", "preview_id": "<...>" }]
}
```

`run_worker_first`가 없으면 SPA 폴백이 `/api/*`까지 삼켜 index.html을 돌려준다 — **반드시 필요**하다.
`/p/*`를 포함시키는 이유는 아래 OG 태그 주입 때문이다.

### KV 키 규약

| 키 | value | metadata |
|---|---|---|
| `poll:{id}` | 투표 정의 전체 | `{title, type, status, createdAt}` (전역 관리자 목록용) |
| `ballot:{id}:{round}:{voterId}` | 투표지 상세 | **집계용 요약** `{n, s\|b, t, a}` |
| `result:{id}:{round}` | 동결된 결과 + 승자 + 무승부 처리 방식 | — |
| `dup:{id}:{round}:{ipHash}` | 해당 IP에서 나온 voterId 목록 | — |

### API

```
POST   /api/polls                      생성 → { id, adminToken }
GET    /api/polls/:id                  정의 + (공개 조건 충족 시) 집계 + 내 투표
POST   /api/polls/:id/ballots          투표 / 수정 / 기권
DELETE /api/polls/:id/ballots/mine     투표 취소
POST   /api/polls/:id/auth             관리 비번 → 토큰
PATCH  /api/polls/:id                  제목·설명·선택지 수정        [관리]
DELETE /api/polls/:id/options/:oid     선택지 삭제                  [관리]
POST   /api/polls/:id/close            수동 마감                    [관리]
POST   /api/polls/:id/tiebreak         { mode: "roulette"|"runoff" } [관리]
DELETE /api/polls/:id                  투표 삭제                    [관리]
POST   /api/admin/auth                 전역 관리자 로그인
GET    /api/admin/polls                전체 목록                    [전역]
DELETE /api/admin/polls/:id            강제 삭제                    [전역]
```

**결과 공개는 서버에서 강제한다.** `resultVisibility` 조건을 만족하지 않으면 응답에 집계를 아예 담지 않고
참여자 수만 내려보낸다 (프론트에서 숨기는 방식은 개발자도구로 뚫린다).

---

## 구현 단계

각 단계는 그 자체로 동작하는 상태로 끝난다. 단계 끝마다 커밋한다.

**Phase 0 — 스캐폴딩**
`git init` → Vite React 템플릿 → Tailwind v4 (`@tailwindcss/vite`, CSS에 `@import "tailwindcss";`) →
`wrangler.jsonc` 작성 → KV 네임스페이스 2개 생성(prod/preview) → `.dev.vars`에 로컬 시크릿 →
`wrangler dev`로 프론트+API가 한 포트에서 뜨는 것 확인. `.gitignore`에 `.dev.vars`, `dist`, `.wrangler`.

**Phase 1 — 선택지 투표 코어**
생성 → 링크 발급 → 투표 → 결과. `익명 / 복수선택(최대 n) / 기권` 옵션.
ballot-per-key + metadata 집계, cursor 페이징, 낙관적 병합, 5초 폴링(탭 활성 시에만).

**Phase 2 — 관리자**
투표별 비번(salt+SHA-256) 발급·검증, HMAC 토큰. 제목·선택지 수정/삭제, 투표 삭제.
`ADMIN_PASSWORD`로 `/admin` 로그인 + 전체 목록/강제 삭제.
→ *요구사항 1의 "아무나 삭제 못 하게"가 여기서 충족된다.*

**Phase 3 — 기명 + 투표완료관리**
이름 입력, 선택적 참여자 명단, `3/5명 완료 · 미참여: 박민수` 패널, 이름 기준 중복 검사,
IP 해시 보조 검사(`maxPerIp` 기본 5). 익명 모드일 때 명단 UI 잠금.

**Phase 4 — 마감 + 무승부**
`closeAt` 지연 평가, 수동 마감, 명단 전원 완료 시 자동 마감. 마감 시 결과 동결.
동점 판정 → HMAC 시드 룰렛(SVG 휠, 4초 감속, `prefers-reduced-motion` 존중) / 재투표 라운드 전환 + 히스토리.

**Phase 5 — 메뉴 선정 옵션 (요구사항 3)**
선택지 입력 폼을 `메뉴명(필수) / 가게명(선택) / 가격대(선택)`로 확장.
가격대는 프리셋 구간(~7천 / 7천~1만 / 1만~1.5만 / 1.5만~) + 직접 입력.
결과 카드에 가게·가격대 표시, 선택된 메뉴들의 평균 가격대 요약.

**Phase 6 — 날짜 조율 (When2meet 그리드)**
생성 폼: 후보 날짜 다중 선택 + 시간 범위 + 슬롯 길이(30/60분).
`TimeGrid`: Pointer Events 드래그 페인트(빈칸에서 시작=칠하기, 채운 칸에서 시작=지우기),
`touch-action: none`으로 모바일 대응. 슬롯은 비트마스크 → base64로 metadata에 저장.
결과: 인원수 농도 히트맵, 셀 hover 시 가능한 사람 명단, 최다 겹침 시간대 자동 추천.
최다 슬롯이 여러 개면 Phase 4의 룰렛/재투표 로직을 그대로 재사용.

**Phase 7 — 공유 · 마무리**
공유 버튼(클립보드 + Web Share API), **`/p/:id` 요청을 Worker가 가로채 HTMLRewriter로 OG 태그 주입**
(카카오톡·슬랙에 링크를 붙였을 때 투표 제목이 미리보기로 뜨게 — SPA는 클라이언트에서 이걸 못 한다).
모바일 반응형, 로딩/에러/빈 상태, 키보드 접근성, README, 배포.

---

## 검증 방법

**자동 테스트** — Vitest + `@cloudflare/vitest-pool-workers` (실제 workerd에서 KV까지 함께 구동):
- `tally.js`: 복수선택·기권 집계, 1위 동점 판정, 빈 투표
- `tiebreak.js`: 같은 입력 → 항상 같은 승자(결정성), 라운드 전환 시 동점 선택지만 남는지
- `dedupe.js`: 같은 voterId 재투표=수정, 다른 voterId 같은 이름 차단, `maxPerIp` 임계
- `auth.js`: 틀린 비번 거부, 만료 토큰 거부, 다른 투표의 토큰으로 접근 거부
- `slots.js`: 비트마스크 인코딩 왕복, 1024바이트 이내 확인
- **동시성**: `Promise.all`로 ballot 20건을 동시에 쓴 뒤 집계가 정확히 20인지 (표 유실 없음 검증 — 이 설계의 핵심)
- 결과 공개 정책: `afterClose` 투표에서 마감 전 GET 응답에 집계가 없는지

**수동 E2E** (`wrangler dev`, 브라우저 창 2개 + 시크릿 창):
1. 메뉴 투표 생성 → 링크 복사 → 다른 창에서 투표 → 원래 창에서 5초 내 반영
2. 일부러 동점 만들기 → 룰렛 돌리고 **양쪽 창 새로고침 후 승자가 동일한지**
3. 같은 상황에서 재투표 선택 → 같은 URL에서 2라운드 시작, 히스토리에 1라운드 남는지
4. 관리 비번 없이 삭제 시도 → 403. 비번 입력 후 삭제 → 성공
5. 명단 5명 등록 → 5번째 투표 순간 자동 마감되는지
6. 날짜 조율: 모바일 크기 창에서 그리드 드래그 → 히트맵에 반영
7. `resultVisibility: afterClose`에서 마감 전 DevTools Network 응답에 집계가 안 담기는지

**배포 확인**: `npm run build && wrangler deploy` → `*.workers.dev` URL에서 위 1~3 재확인,
카카오톡에 링크를 붙여 OG 미리보기가 뜨는지 확인.

---

## 알아둘 제약

- **KV 결과적 일관성**: 지역이 다른 참여자 간에는 반영이 수 초~최대 60초 늦을 수 있다. 낙관적 병합으로
  본인 화면은 즉시 갱신되지만, 초 단위 실시간이 필요해지면 Durable Objects로 옮겨야 한다 (유료 플랜 $5/월).
- **IP 해시 오탐**: 사내 공용망에서 여러 명이 같은 IP를 쓴다. `maxPerIp` 기본값 5로 완화했고, 설정에서 조절 가능하게 한다.
- **투표당 1000명 초과** 시 `list()` cursor 페이징이 여러 번 돌아 응답이 느려진다. 구현은 하되 실사용 범위는 아니다.

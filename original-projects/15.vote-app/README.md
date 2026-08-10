# 투표하기

링크 하나로 공유하는 간편 투표. 계정 없이 만들고, 계정 없이 참여합니다.

- 🍽️ **선택지 투표** — 메뉴명·가게명·가격대를 곁들인 다지선다
- 📅 **날짜 조율** — When2meet 스타일 그리드로 가능한 시간대 겹쳐보기
- 익명/기명, 복수선택, 기권, 참여자 명단·완료현황, 마감(수동/시각/전원완료)
- 동점 시 **룰렛으로 뽑기** 또는 **동점자끼리 재투표** (같은 링크에서 라운드만 올라감)
- 투표별 관리 비밀번호 + 전역 관리자(`/admin`) — 아무나 남의 투표를 지울 수 없음

기술 스택: React (Vite) · Cloudflare Workers · Cloudflare KV. 단일 Worker가 정적 자산과
`/api/*`를 함께 서빙합니다.

## 로컬 개발

```bash
npm install
cp .dev.vars.example .dev.vars   # 값을 채워 넣는다
npm run dev                       # http://localhost:8787 — 프론트+API 동시 서빙
```

프론트만 HMR로 빠르게 고치고 싶다면 터미널을 하나 더 열어 `npm run dev:vite`를 함께 띄우세요
(`vite.config.js`가 `/api`를 8787로 프록시합니다).

## 테스트

```bash
npm test          # vitest + @cloudflare/vitest-pool-workers (실제 workerd + KV로 실행)
npm run test:watch
```

`test/unit.test.js`는 집계·비트마스크·룰렛 결정성을 검증하고, `test/api.test.js`는 라우트 전체를
HTTP 레벨로 검증합니다. 특히 **20명이 동시에 투표해도 표가 유실되지 않는지** 확인하는 동시성
테스트가 있는데, 이건 "투표 1건 = KV 키 1개" 설계가 실제로 동작하는지 보장하는 핵심 테스트입니다.

## 배포

```bash
npx wrangler login
npx wrangler kv namespace create VOTE_KV
npx wrangler kv namespace create VOTE_KV --preview
```

출력된 `id`/`preview_id`를 `wrangler.jsonc`의 `kv_namespaces`에 채워 넣은 뒤:

```bash
npx wrangler secret put AUTH_SECRET       # 관리 토큰 서명 + 룰렛 시드용 임의의 긴 문자열
npx wrangler secret put IP_SALT           # IP 해시 솔트 (원본 IP는 저장되지 않음)
npx wrangler secret put ADMIN_PASSWORD    # 전역 관리자(/admin) 비밀번호

npm run deploy
```

`*.workers.dev` 주소로 바로 접속됩니다. 커스텀 도메인은 Cloudflare 대시보드의 Workers Routes에서
연결하세요.

## 알아둘 제약

- **KV 결과적 일관성**: 지역이 다른 참여자 간 반영이 최대 수십 초 늦을 수 있습니다. 본인 표는
  낙관적 병합으로 화면에 즉시 반영되지만, 초 단위 실시간이 필요하면 Durable Objects로 옮겨야 합니다
  (유료 플랜 필요).
- **IP 기반 중복 방지**는 사내 공용망(NAT)에서 여러 명이 같은 IP를 쓰는 걸 감안해 기본 5명까지
  허용합니다. 투표 생성 시 조절할 수 있습니다.
- 관리 비밀번호를 잊으면 되찾을 방법이 없습니다(해시만 저장). 전역 관리자로 삭제는 가능합니다.

## 구조

```
worker/          Cloudflare Worker (API + OG 태그 주입)
  lib/            인증, KV 집계, 투표 로직, 무승부, 중복방지, 입력검증
  routes/         라우트 핸들러
src/              React SPA
  pages/          Home · CreatePoll · PollView · AdminPage
  components/     선택지/날짜그리드/룰렛/관리자 UI
shared/           프론트·워커 공용 순수 로직 (슬롯 비트마스크, 상수)
test/             Vitest (workerd 위에서 실행)
docs/PLAN.md      설계 배경과 구현 계획
```

설계 배경(왜 KV metadata에 집계를 넣는지, 왜 룰렛이 결정적인지 등)은 `docs/PLAN.md`에 정리돼
있습니다.

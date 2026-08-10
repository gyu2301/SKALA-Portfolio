import { errorResponse, HttpError, json } from './lib/http.js';
import { getPoll } from './lib/kv.js';
import { adminDeletePoll, adminListPolls, adminLogin } from './routes/admin.js';
import { castBallot, retractBallot } from './routes/ballots.js';
import {
  authenticatePoll,
  closePollRoute,
  createPoll,
  deleteOption,
  deletePoll,
  readPoll,
  readRoundResult,
  tiebreakRoute,
  updatePoll,
} from './routes/polls.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, url);
      if (url.pathname.startsWith('/p/')) return await handleShareLink(request, env, url);
    } catch (err) {
      return errorResponse(err);
    }

    // run_worker_first에 걸리지 않은 경로는 정적 자산으로 넘긴다.
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url) {
  const method = request.method.toUpperCase();
  // '/api/polls/:id/ballots/mine'.split('/') === ['', 'api', 'polls', ':id', 'ballots', 'mine']
  const [, , section, a, b, c] = url.pathname.split('/');

  if (section === 'polls') {
    if (!a) {
      if (method === 'POST') return createPoll(request, env);
      throw new HttpError(405, '지원하지 않는 요청입니다.');
    }

    // /api/polls/:id
    if (!b) {
      if (method === 'GET') return readPoll(request, env, a, url);
      if (method === 'PATCH') return updatePoll(request, env, a);
      if (method === 'DELETE') return deletePoll(request, env, a);
      throw new HttpError(405, '지원하지 않는 요청입니다.');
    }

    // /api/polls/:id/<sub>
    switch (b) {
      case 'auth':
        if (method === 'POST') return authenticatePoll(request, env, a);
        break;
      case 'ballots':
        if (method === 'POST' && !c) return castBallot(request, env, a);
        if (method === 'DELETE' && c === 'mine') return retractBallot(request, env, a, url);
        break;
      case 'options':
        if (method === 'DELETE' && c) return deleteOption(request, env, a, c);
        break;
      case 'close':
        if (method === 'POST') return closePollRoute(request, env, a);
        break;
      case 'tiebreak':
        if (method === 'POST') return tiebreakRoute(request, env, a);
        break;
      case 'results':
        if (method === 'GET' && c) return readRoundResult(request, env, a, c);
        break;
      default:
        break;
    }
    throw new HttpError(404, '요청한 경로를 찾을 수 없습니다.');
  }

  if (section === 'admin') {
    if (a === 'auth' && method === 'POST') return adminLogin(request, env);
    if (a === 'polls' && !b && method === 'GET') return adminListPolls(request, env, url);
    if (a === 'polls' && b && method === 'DELETE') return adminDeletePoll(request, env, b);
    throw new HttpError(404, '요청한 경로를 찾을 수 없습니다.');
  }

  if (section === 'health') return json({ ok: true, time: Date.now() });

  throw new HttpError(404, '요청한 경로를 찾을 수 없습니다.');
}

/**
 * /p/:id 는 SPA가 그리는 화면이지만, 카카오톡·슬랙 같은 곳에 링크를 붙였을 때
 * 미리보기에 투표 제목이 뜨게 하려면 서버가 HTML에 OG 태그를 넣어줘야 한다.
 * SPA는 자바스크립트를 실행하지 않는 크롤러에게 이걸 해줄 수 없다.
 */
async function handleShareLink(request, env, url) {
  const indexRequest = new Request(new URL('/index.html', url), { method: 'GET' });
  const asset = await env.ASSETS.fetch(indexRequest);

  const id = url.pathname.split('/')[2];
  const poll = id ? await getPoll(env, id) : null;
  if (!poll || !asset.ok) return asset;

  const title = `${poll.title} · 투표하기`;
  const description =
    poll.description?.trim() ||
    (poll.type === 'schedule'
      ? '가능한 시간대를 표시해주세요.'
      : `${poll.options.length}개 선택지 중에서 골라주세요.`);

  const setText = { element: (el) => el.setInnerContent(title) };
  const setContent = (value) => ({ element: (el) => el.setAttribute('content', value) });

  const rewritten = new HTMLRewriter()
    .on('title', setText)
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[name="description"]', setContent(description))
    .transform(asset);

  // 자산 자체는 모든 투표가 공유하므로, ETag를 그대로 두면 다른 투표의 미리보기가 캐시될 수 있다.
  const headers = new Headers(rewritten.headers);
  headers.delete('etag');
  headers.set('cache-control', 'no-store');
  return new Response(rewritten.body, { status: rewritten.status, headers });
}

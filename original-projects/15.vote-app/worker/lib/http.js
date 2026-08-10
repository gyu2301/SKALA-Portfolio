/** 라우트 핸들러에서 던지면 index.js가 적절한 상태코드로 변환한다. */
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    return json({ error: err.message, code: err.code ?? null }, err.status);
  }
  console.error('unhandled error', err?.stack || err);
  return json({ error: '서버에서 문제가 발생했습니다.' }, 500);
}

export async function readJson(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpError(400, '요청 형식이 올바르지 않습니다.');
    }
    return body;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, '요청 본문을 읽을 수 없습니다.');
  }
}

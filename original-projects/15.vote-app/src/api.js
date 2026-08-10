export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* 본문이 비어 있을 수 있다 */
  }

  if (!res.ok) throw new ApiError(data?.error || `요청에 실패했습니다 (${res.status})`, res.status);
  return data;
}

const q = encodeURIComponent;

export const api = {
  createPoll: (body) => request('/api/polls', { method: 'POST', body }),
  getPoll: (id, voterId) => request(`/api/polls/${q(id)}?voterId=${q(voterId || '')}`),
  vote: (id, body) => request(`/api/polls/${q(id)}/ballots`, { method: 'POST', body }),
  retract: (id, voterId) =>
    request(`/api/polls/${q(id)}/ballots/mine?voterId=${q(voterId)}`, { method: 'DELETE' }),
  roundResult: (id, round) => request(`/api/polls/${q(id)}/results/${round}`),

  authPoll: (id, password) => request(`/api/polls/${q(id)}/auth`, { method: 'POST', body: { password } }),
  updatePoll: (id, body, token) => request(`/api/polls/${q(id)}`, { method: 'PATCH', body, token }),
  deleteOption: (id, optionId, token) =>
    request(`/api/polls/${q(id)}/options/${q(optionId)}`, { method: 'DELETE', token }),
  closePoll: (id, token) => request(`/api/polls/${q(id)}/close`, { method: 'POST', token }),
  tiebreak: (id, mode, token) =>
    request(`/api/polls/${q(id)}/tiebreak`, { method: 'POST', body: { mode }, token }),
  deletePoll: (id, token) => request(`/api/polls/${q(id)}`, { method: 'DELETE', token }),

  adminLogin: (password) => request('/api/admin/auth', { method: 'POST', body: { password } }),
  adminPolls: (token) => request('/api/admin/polls', { token }),
  adminDelete: (id, token) => request(`/api/admin/polls/${q(id)}`, { method: 'DELETE', token }),
};

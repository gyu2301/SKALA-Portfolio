import { hmacHex, sha256Hex } from './crypto.js';

/**
 * 투표지 집합의 결정적 해시. 같은 투표 구성이면 언제 계산해도 같은 값이 나온다.
 * 룰렛 시드의 입력으로 쓴다.
 */
export async function ballotSetHash(ballots) {
  const canonical = ballots
    .map((b) => b.voterId)
    .sort()
    .join(',');
  return sha256Hex(canonical);
}

/**
 * 동점 후보 중 승자 인덱스를 뽑는다.
 *
 * crypto.getRandomValues()로 뽑아 저장하지 않는 이유:
 * 두 사람이 동시에 결과 화면을 열어 각자 마감을 트리거하면 서로 다른 승자가 저장될 수 있다.
 * HMAC 시드는 같은 입력에 대해 항상 같은 답을 내므로 그 경합이 무해해진다.
 * 서버 시크릿(AUTH_SECRET)이 섞여 있어 참여자가 결과를 미리 계산할 수는 없다.
 */
export async function pickWinnerIndex(env, pollId, round, setHash, candidateCount) {
  if (candidateCount <= 0) return -1;
  if (candidateCount === 1) return 0;
  const digest = await hmacHex(env.AUTH_SECRET, `tiebreak:${pollId}:${round}:${setHash}`);
  const n = BigInt('0x' + digest.slice(0, 16));
  return Number(n % BigInt(candidateCount));
}

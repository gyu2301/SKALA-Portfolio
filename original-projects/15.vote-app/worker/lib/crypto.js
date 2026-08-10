const encoder = new TextEncoder();

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomHex(bytes = 16) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input) {
  return bufToHex(await crypto.subtle.digest('SHA-256', encoder.encode(input)));
}

export async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return bufToHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

/** 길이가 같을 때 조기 반환하지 않는 비교. 비밀번호 해시/서명 비교에 쓴다. */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function b64urlEncode(str) {
  const bytes = encoder.encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// 헷갈리는 글자(i, l, o, u)를 뺀 32자 알파벳.
// 32는 256의 약수라서 바이트를 그대로 나눠도 모듈로 편향이 없다.
const ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

export function shortId(len = 7) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return [...a].map((b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('');
}

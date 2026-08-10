import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

// wrangler.jsonc를 그대로 쓰지 않고 miniflare 옵션을 직접 준다.
// 테스트는 /api/* 만 때리므로 정적 자산(assets) 바인딩이 필요 없고,
// 시크릿도 .dev.vars 대신 고정값을 써야 결과가 재현 가능하다.
export default defineConfig({
  plugins: [
    cloudflareTest({
      main: './worker/index.js',
      miniflare: {
        compatibilityDate: '2026-08-01',
        kvNamespaces: ['VOTE_KV'],
        bindings: {
          AUTH_SECRET: 'test-auth-secret',
          IP_SALT: 'test-ip-salt',
          ADMIN_PASSWORD: 'test-admin-password',
        },
      },
    }),
  ],
  test: {
    include: ['test/**/*.test.js'],
  },
});

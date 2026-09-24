import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.js'

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:8080'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('access_token') || null)
  const user = ref(JSON.parse(sessionStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const isVendor = computed(() => user.value?.role === 'VENDOR' || user.value?.role === 'INSTRUCTOR')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isInstructor = isVendor // 하위 호환 별칭

  function setToken(token) {
    accessToken.value = token
    sessionStorage.setItem('access_token', token)
  }

  function setUser(userData) {
    user.value = userData
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  async function fetchUser() {
    try {
      const res = await authApi.getMe()
      console.log('[AuthStore] /me response =', res.data)

      const userData = res?.data?.data ?? res?.data

      if (!userData || typeof userData !== 'object') {
        throw new Error('사용자 정보 형식이 올바르지 않습니다.')
      }

      setUser(userData)
    } catch (error) {
      console.error('[AuthStore] 사용자 정보 조회 실패:', error)
      logout(false)
    }
  }

  function logout(redirect = true) {
    accessToken.value = null
    user.value = null
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')

    if (redirect) {
      window.location.href = '/login'
    }
  }

  // OAuth2 Authorization Code Flow
  function redirectToLogin() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      scope: 'openid profile read write'
    })

    window.location.href = `${AUTH_SERVER_URL}/oauth2/authorize?${params.toString()}`
  }

  // 인앱 로그인 — 인증서버 기본 로그인 페이지로 튕기지 않고,
  // 우리 폼에서 받은 id/pw로 세션 로그인 후 OAuth2 코드를 교환한다.
  async function login(username, password) {
    // 1) 인증서버 세션 로그인 (숨은 폼 POST, 프록시 경유 — CSRF 미사용)
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    await fetch('/proxy-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      credentials: 'include',
      redirect: 'manual'
    })

    // 2) authorize 재요청 — 세션 유효하면 같은 오리진 /callback?code= 로 리다이렉트되어 code를 읽을 수 있고,
    //    세션이 없으면(비번 오류) 크로스오리진 로그인 페이지로 튕겨 fetch가 예외를 던진다.
    const authz = `/oauth2/authorize?response_type=code`
      + `&client_id=${encodeURIComponent(import.meta.env.VITE_CLIENT_ID)}`
      + `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_REDIRECT_URI)}`
      + `&scope=${encodeURIComponent('openid profile read write')}`

    let code = null
    try {
      const res = await fetch(authz, { credentials: 'include', redirect: 'follow' })
      code = new URL(res.url, window.location.origin).searchParams.get('code')
    } catch (_) {
      // 미인증 → 크로스오리진 리다이렉트로 인한 예외 (아래에서 오류 처리)
    }
    if (!code) {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
    }
    await handleCallback(code)
  }

  async function handleCallback(code) {
    const res = await authApi.exchangeCode(code)
    console.log('[AuthStore] token response =', res.data)

    const token = res?.data?.access_token

    if (!token) {
      throw new Error('액세스 토큰을 받지 못했습니다.')
    }

    setToken(token)
    await fetchUser()
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isInstructor,
    isVendor,
    isAdmin,
    setToken,
    setUser,
    fetchUser,
    logout,
    login,
    redirectToLogin,
    handleCallback
  }
})

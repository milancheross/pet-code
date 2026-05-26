'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'

export default function LoginPage() {
  const sb = createClient()
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async () => {
    setLoading(true); setError('')
    const { error } = await sb.auth.signInWithPassword({ email, password: pass })
    if (error) {
      setError(t('login_error'))
      setLoading(false)
      return
    }
    // Full page reload so the middleware picks up the new session cookie
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <Link href="/"><PetCodeLogo size="sm" /></Link>
          <LangSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🐾</div>
          <h1 className="text-2xl font-black text-navy">{t('login_title')}</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">{t('login_sub')}</p>
        </div>

        <div className="card space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}
          <div>
            <label className="label">{t('login_email')}</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>
          <div>
            <label className="label">{t('login_pass')}</label>
            <input
              className="input"
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>
          <button
            onClick={login}
            disabled={loading || !email || !pass}
            className="btn-teal w-full"
          >
            {loading ? t('login_loading') : t('login_submit')}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          Nemate nalog? Skenirajte QR privezak i aktivirajte ga.
        </p>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import Link from 'next/link'

export default function LoginPage() {
  const sb = createClient(); const router = useRouter(); const { t } = useLang()
  const [email,setEmail]=useState(''); const [pass,setPass]=useState('')
  const [loading,setLoading]=useState(false); const [error,setError]=useState('')

  const login = async () => {
    setLoading(true); setError('')
    const { error } = await sb.auth.signInWithPassword({ email, password: pass })
    if (error) { setError(t('login_error')); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f0fffe] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="font-black text-navy">pet<span className="text-teal">code</span>.rs</Link>
          <LangSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🐾</div>
          <h1 className="text-2xl font-black text-navy">{t('login_title')}</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">{t('login_sub')}</p>
        </div>
        <div className="card space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm font-semibold">⚠️ {error}</div>}
          <div><label className="label">{t('login_email')}</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div><label className="label">{t('login_pass')}</label><input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} /></div>
          <button onClick={login} disabled={loading||!email||!pass} className="btn-teal w-full">{loading?t('login_loading'):t('login_submit')}</button>
        </div>
      </div>
    </div>
  )
}

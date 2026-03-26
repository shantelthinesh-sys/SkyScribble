import { useState } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

type Role = 'teacher' | 'student'
type Screen = 'select' | 'login' | 'signup' | 'dashboard'

interface User { name: string; email: string; password: string; role: Role }

const getUsers = (): User[] => { try { return JSON.parse(localStorage.getItem('study_users') || '[]') } catch { return [] } }
const saveUsers = (u: User[]) => localStorage.setItem('study_users', JSON.stringify(u))

const AuthForm = ({ role, onSuccess, onBack }: { role: Role; onSuccess: (name: string) => void; onBack: () => void }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    setError('')
    if (!email || !password) { setError('Email and password required'); return }
    const users = getUsers()
    if (tab === 'signup') {
      if (!name) { setError('Name required'); return }
      if (users.find(u => u.email === email)) { setError('Email already registered'); return }
      const newUser: User = { name, email, password, role }
      saveUsers([...users, newUser])
      onSuccess(name)
    } else {
      const user = users.find(u => u.email === email && u.password === password && u.role === role)
      if (!user) { setError('Invalid credentials or wrong role'); return }
      onSuccess(user.name)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold text-white capitalize">{role} Portal</h2>
        </div>
        <div className="flex gap-2 mb-6 bg-slate-900 rounded-xl p-1">
          {(['login', 'signup'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={submit} className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-semibold text-white transition-colors mt-2">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

const StudyMode = () => {
  const [screen, setScreen] = useState<Screen>('select')
  const [role, setRole] = useState<Role>('teacher')
  const [userName, setUserName] = useState('')
  const [color, setColor] = useState('#60a5fa')
  const [brushSize, setBrushSize] = useState(6)
  const [saved, setSaved] = useState<string[]>([])
  const colors = ['#60a5fa', '#ffffff', '#f87171', '#4ade80', '#facc15', '#a78bfa']

  if (screen === 'select') return (
    <Layout title="Study Mode" subtitle="Select your role to continue">
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
        {(['teacher', 'student'] as Role[]).map(r => (
          <button key={r} onClick={() => { setRole(r); setScreen('login') }}
            className="bg-[#0F172A] border border-slate-700 hover:border-blue-600 rounded-2xl p-10 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20 group">
            <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-blue-900/40 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={r === 'teacher'
                  ? "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  : "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"} />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 capitalize">{r} Dashboard</h2>
            <p className="text-slate-500 text-sm">{r === 'teacher' ? 'Virtual whiteboard, session management, live explanation mode' : 'View content, practice drawing, submit answers'}</p>
          </button>
        ))}
      </div>
    </Layout>
  )

  if (screen === 'login') return (
    <Layout title="Study Mode">
      <AuthForm role={role} onSuccess={name => { setUserName(name); setScreen('dashboard') }} onBack={() => setScreen('select')} />
    </Layout>
  )

  return (
    <Layout title={`${role === 'teacher' ? 'Teacher' : 'Student'} Dashboard`} subtitle={`Welcome, ${userName}`}>
      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={() => { setScreen('select'); setUserName('') }} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">Logout</button>
        <div className="flex gap-2 items-center bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2">
          {colors.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ background: c }} />
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2">
          <span className="text-xs text-slate-400">Size</span>
          <input type="range" min={2} max={20} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-20 accent-blue-500" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AirCanvas color={color} brushSize={brushSize} height={480} onSave={url => setSaved(s => [...s, url])} />
        </div>
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">{role === 'teacher' ? 'Session Tools' : 'Student Panel'}</h3>
            <div className="space-y-2">
              {(role === 'teacher'
                ? ['Start Live Session', 'Upload Slides', 'Share Screen', 'End Session']
                : ['View Teacher Board', 'Practice Mode', 'Submit Answer', 'Ask Question']
              ).map(t => (
                <button key={t} className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">{t}</button>
              ))}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Saved ({saved.length})</h3>
            {saved.length === 0 && <p className="text-xs text-slate-600">Nothing saved yet</p>}
            {saved.map((url, i) => (
              <a key={i} href={url} download={`session-${i + 1}.png`} className="block text-xs text-blue-400 hover:text-blue-300">Session {i + 1}</a>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default StudyMode

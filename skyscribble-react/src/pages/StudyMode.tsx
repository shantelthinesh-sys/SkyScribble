import { useState } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

const StudyMode = () => {
  const [role, setRole] = useState<'select' | 'teacher' | 'student'>('select')
  const [color, setColor] = useState('#60a5fa')
  const [brushSize, setBrushSize] = useState(6)
  const [saved, setSaved] = useState<string[]>([])
  const colors = ['#60a5fa', '#ffffff', '#f87171', '#4ade80', '#facc15', '#a78bfa']

  if (role === 'select') return (
    <Layout title="Study Mode" subtitle="Select your role to continue">
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
        <button onClick={() => setRole('teacher')}
          className="bg-[#0F172A] border border-slate-700 hover:border-blue-600 rounded-2xl p-10 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20 group">
          <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-blue-900/40 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Teacher Dashboard</h2>
          <p className="text-slate-500 text-sm">Virtual whiteboard, session management, live explanation mode</p>
        </button>
        <button onClick={() => setRole('student')}
          className="bg-[#0F172A] border border-slate-700 hover:border-blue-600 rounded-2xl p-10 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20 group">
          <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-blue-900/40 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Student Dashboard</h2>
          <p className="text-slate-500 text-sm">View content, practice drawing, submit answers</p>
        </button>
      </div>
    </Layout>
  )

  return (
    <Layout title={role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}
      subtitle="Air drawing with hand gestures — show your hand to the camera">
      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={() => setRole('select')} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">Switch Role</button>
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
              {role === 'teacher'
                ? ['Start Live Session', 'Upload Slides', 'Share Screen', 'End Session'].map(t => (
                  <button key={t} className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">{t}</button>
                ))
                : ['View Teacher Board', 'Practice Mode', 'Submit Answer', 'Ask Question'].map(t => (
                  <button key={t} className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">{t}</button>
                ))
              }
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

import { useState } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

const shapes = ['Circle', 'Star', 'House', 'Tree']
const colors = ['#60a5fa', '#f87171', '#4ade80', '#facc15', '#a78bfa', '#fb923c', '#ffffff']

const ShapeOverlay = ({ shape }: { shape: string }) => (
  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-15">
    <svg width="200" height="200" viewBox="0 0 200 200">
      {shape === 'Circle' && <circle cx="100" cy="100" r="80" fill="none" stroke="#94a3b8" strokeWidth="4" />}
      {shape === 'Star' && <polygon points="100,20 120,80 180,80 130,115 150,175 100,140 50,175 70,115 20,80 80,80" fill="none" stroke="#94a3b8" strokeWidth="4" />}
      {shape === 'House' && <><polygon points="100,20 180,80 180,180 20,180 20,80" fill="none" stroke="#94a3b8" strokeWidth="4" /><rect x="70" y="120" width="60" height="60" fill="none" stroke="#94a3b8" strokeWidth="4" /></>}
      {shape === 'Tree' && <><polygon points="100,20 160,120 40,120" fill="none" stroke="#94a3b8" strokeWidth="4" /><rect x="85" y="120" width="30" height="50" fill="none" stroke="#94a3b8" strokeWidth="4" /></>}
    </svg>
  </div>
)

const KidsMode = () => {
  const [shape, setShape] = useState(0)
  const [color, setColor] = useState('#60a5fa')
  const [brushSize, setBrushSize] = useState(8)

  return (
    <Layout title="Kids Mode" subtitle="Trace shapes using air drawing — show your index finger to draw">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">SHAPES</p>
            <div className="grid grid-cols-2 gap-2">
              {shapes.map((s, i) => (
                <button key={s} onClick={() => setShape(i)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${shape === i ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">COLORS</p>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-2">BRUSH SIZE</p>
            <input type="range" min={4} max={24} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-full accent-blue-500" />
            <p className="text-xs text-slate-500 mt-1 text-center">{brushSize}px</p>
          </div>
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-2">GESTURES</p>
            <div className="space-y-1 text-xs text-slate-400">
              <p>Index finger — Draw</p>
              <p>Two fingers — Erase</p>
              <p>3+ fingers — Pause</p>
              <p>Closed fist — Clear</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 relative">
          <ShapeOverlay shape={shapes[shape]} />
          <AirCanvas color={color} brushSize={brushSize} height={480} />
        </div>
      </div>
    </Layout>
  )
}

export default KidsMode

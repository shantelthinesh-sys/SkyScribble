import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

const SHAPES = [
  'Circle', 'Star', 'House', 'Tree', 'Heart', 'Diamond',
  'Sun', 'Moon', 'Fish', 'Flower', 'Car', 'Rocket',
]
const COLORS = ['#60a5fa','#f87171','#4ade80','#facc15','#a78bfa','#fb923c','#f9a8d4','#ffffff']

const ShapeSVG = ({ shape }: { shape: string }) => {
  const s: Record<string, JSX.Element> = {
    Circle:  <circle cx="100" cy="100" r="80" fill="none" stroke="#94a3b8" strokeWidth="4" />,
    Star:    <polygon points="100,20 120,80 180,80 130,115 150,175 100,140 50,175 70,115 20,80 80,80" fill="none" stroke="#94a3b8" strokeWidth="4" />,
    House:   <><polygon points="100,20 180,80 180,180 20,180 20,80" fill="none" stroke="#94a3b8" strokeWidth="4" /><rect x="70" y="120" width="60" height="60" fill="none" stroke="#94a3b8" strokeWidth="4" /></>,
    Tree:    <><polygon points="100,20 160,120 40,120" fill="none" stroke="#94a3b8" strokeWidth="4" /><rect x="85" y="120" width="30" height="50" fill="none" stroke="#94a3b8" strokeWidth="4" /></>,
    Heart:   <path d="M100,160 C100,160 20,110 20,60 C20,35 40,20 60,20 C75,20 90,30 100,45 C110,30 125,20 140,20 C160,20 180,35 180,60 C180,110 100,160 100,160Z" fill="none" stroke="#94a3b8" strokeWidth="4" />,
    Diamond: <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="#94a3b8" strokeWidth="4" />,
    Sun:     <><circle cx="100" cy="100" r="40" fill="none" stroke="#94a3b8" strokeWidth="4" />{[0,45,90,135,180,225,270,315].map(a=><line key={a} x1={100+50*Math.cos(a*Math.PI/180)} y1={100+50*Math.sin(a*Math.PI/180)} x2={100+70*Math.cos(a*Math.PI/180)} y2={100+70*Math.sin(a*Math.PI/180)} stroke="#94a3b8" strokeWidth="4" />)}</>,
    Moon:    <path d="M130,30 A70,70 0 1,0 130,170 A50,50 0 1,1 130,30Z" fill="none" stroke="#94a3b8" strokeWidth="4" />,
    Fish:    <><ellipse cx="90" cy="100" rx="60" ry="35" fill="none" stroke="#94a3b8" strokeWidth="4" /><polygon points="150,100 180,70 180,130" fill="none" stroke="#94a3b8" strokeWidth="4" /><circle cx="65" cy="90" r="5" fill="#94a3b8" /></>,
    Flower:  <>{[0,60,120,180,240,300].map(a=>{ const fx=100+30*Math.cos(a*Math.PI/180), fy=100+30*Math.sin(a*Math.PI/180); return <ellipse key={a} cx={fx} cy={fy} rx={18} ry={10} transform={`rotate(${a} ${fx} ${fy})`} fill="none" stroke="#94a3b8" strokeWidth="3" /> })} <circle cx="100" cy="100" r="15" fill="none" stroke="#94a3b8" strokeWidth="4" /></>,
    Car:     <><rect x="20" y="80" width="160" height="70" rx="10" fill="none" stroke="#94a3b8" strokeWidth="4" /><polygon points="50,80 70,40 130,40 150,80" fill="none" stroke="#94a3b8" strokeWidth="4" /><circle cx="55" cy="155" r="18" fill="none" stroke="#94a3b8" strokeWidth="4" /><circle cx="145" cy="155" r="18" fill="none" stroke="#94a3b8" strokeWidth="4" /></>,
    Rocket:  <><polygon points="100,20 130,100 100,90 70,100" fill="none" stroke="#94a3b8" strokeWidth="4" /><rect x="80" y="90" width="40" height="60" fill="none" stroke="#94a3b8" strokeWidth="4" /><polygon points="80,150 60,180 100,165 140,180 120,150" fill="none" stroke="#94a3b8" strokeWidth="4" /></>,
  }
  return <svg width="200" height="200" viewBox="0 0 200 200">{s[shape]}</svg>
}

const KidsMode = () => {
  const [shape, setShape]       = useState(0)
  const [color, setColor]       = useState('#60a5fa')
  const [brushSize, setBrushSize] = useState(8)
  const [customImg, setCustomImg] = useState<string | null>(null)
  const [useCustom, setUseCustom] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  return (
    <Layout title="Kids Mode" subtitle="Trace shapes using air drawing — show your index finger to draw">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">SHAPES</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {SHAPES.map((s, i) => (
                <button key={s} onClick={() => { setShape(i); setUseCustom(false) }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${!useCustom && shape === i ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">CUSTOM UPLOAD</p>
            <label className={`block w-full py-2 text-center border border-dashed rounded-lg text-xs cursor-pointer transition-colors ${useCustom ? 'border-blue-600 text-blue-400' : 'border-slate-700 text-slate-400 hover:border-blue-600 hover:text-blue-400'}`}>
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (!f) return
                const r = new FileReader(); r.onload = ev => { setCustomImg(ev.target?.result as string); setUseCustom(true) }; r.readAsDataURL(f)
              }} />
            </label>
            {customImg && (
              <button onClick={() => setUseCustom(true)}
                className={`w-full mt-2 py-1.5 rounded-lg text-xs transition-all ${useCustom ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                Use Uploaded
              </button>
            )}
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">COLORS</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
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

        {/* Canvas */}
        <div className="lg:col-span-3 relative">
          {/* Shape/image overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-15">
            {useCustom && customImg
              ? <img ref={imgRef} src={customImg} alt="custom" className="max-w-full max-h-full object-contain" />
              : <ShapeSVG shape={SHAPES[shape]} />
            }
          </div>
          <AirCanvas color={color} brushSize={brushSize} height={480} />
        </div>
      </div>
    </Layout>
  )
}

export default KidsMode

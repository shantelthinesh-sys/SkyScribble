import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

const colors = ['#60a5fa','#f87171','#4ade80','#facc15','#a78bfa','#fb923c','#f9a8d4','#ffffff','#1e293b','#94a3b8']
const patterns = ['Solid', 'Stripes', 'Dots', 'Plaid', 'Floral']

const FashionMode = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [uploadedImg, setUploadedImg] = useState<string | null>(null)
  const [color, setColor] = useState('#60a5fa')
  const [brushSize, setBrushSize] = useState(10)
  const [tool, setTool] = useState<'brush' | 'erase' | 'pattern'>('brush')
  const [pattern, setPattern] = useState('Solid')
  const [mode, setMode] = useState<'air' | 'mouse'>('air')
  const [drawing, setDrawing] = useState(false)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!uploadedImg || uploadedImg === 'blank') return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height) }
    img.src = uploadedImg
  }, [uploadedImg])

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width), y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height) }
  }

  const applyPattern = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const r = brushSize * 2
    ctx.fillStyle = color
    if (pattern === 'Dots') {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.arc(x + (Math.random() - 0.5) * r * 2, y + (Math.random() - 0.5) * r * 2, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (pattern === 'Stripes') {
      ctx.strokeStyle = color; ctx.lineWidth = 2
      for (let i = -r; i < r; i += 6) { ctx.beginPath(); ctx.moveTo(x + i, y - r); ctx.lineTo(x + i, y + r); ctx.stroke() }
    } else {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => { setDrawing(true); setLastPos(getPos(e)) }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !lastPos) return
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'
    if (tool === 'pattern') { applyPattern(ctx, pos.x, pos.y) }
    else { ctx.strokeStyle = color; ctx.lineWidth = tool === 'erase' ? brushSize * 3 : brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke() }
    setLastPos(pos)
  }
  const handleMouseUp = () => { setDrawing(false); setLastPos(null) }
  const save = () => { const a = document.createElement('a'); a.href = canvasRef.current!.toDataURL(); a.download = 'fashion-design.png'; a.click() }

  return (
    <Layout title="Fashion Designing" subtitle="Design clothing with air gestures or mouse">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">DRAWING MODE</p>
            <div className="flex gap-2">
              {(['air', 'mouse'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${mode === m ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {m === 'air' ? 'Air Draw' : 'Mouse'}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">UPLOAD TEMPLATE</p>
            <label className="block w-full py-3 text-center border border-dashed border-slate-700 rounded-lg text-sm text-slate-400 hover:border-blue-600 hover:text-blue-400 cursor-pointer transition-colors">
              Choose Image
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (!f) return
                const r = new FileReader(); r.onload = ev => setUploadedImg(ev.target?.result as string); r.readAsDataURL(f)
              }} />
            </label>
            <button onClick={() => setUploadedImg('blank')} className="w-full mt-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:bg-slate-700 transition-colors">Blank Canvas</button>
          </div>
          {mode === 'mouse' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 tracking-widest mb-3">TOOL</p>
              <div className="flex flex-col gap-2">
                {(['brush', 'pattern', 'erase'] as const).map(t => (
                  <button key={t} onClick={() => setTool(t)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize transition-all ${tool === t ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {t === 'brush' ? 'Brush' : t === 'pattern' ? 'Pattern' : 'Erase'}
                  </button>
                ))}
              </div>
              {tool === 'pattern' && (
                <div className="mt-3 flex flex-col gap-1">
                  {patterns.map(p => (
                    <button key={p} onClick={() => setPattern(p)}
                      className={`py-1 rounded text-xs transition-all ${pattern === p ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">COLORS</p>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-2">BRUSH SIZE</p>
            <input type="range" min={2} max={40} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-full accent-blue-500" />
          </div>
          {mode === 'mouse' && <button onClick={save} className="w-full py-3 bg-blue-700 hover:bg-blue-600 rounded-xl text-sm font-semibold text-white transition-colors">Download</button>}
        </div>

        <div className="lg:col-span-3">
          {mode === 'air' ? (
            <AirCanvas color={color} brushSize={brushSize} height={520} />
          ) : !uploadedImg ? (
            <div className="h-96 bg-[#0F172A] border border-dashed border-slate-700 rounded-2xl flex items-center justify-center">
              <p className="text-slate-600 text-sm">Upload a clothing template or use blank canvas</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
              <canvas ref={canvasRef} width={800} height={600} className="w-full cursor-crosshair"
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default FashionMode

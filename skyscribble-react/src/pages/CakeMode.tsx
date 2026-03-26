import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

const icingColors = ['#f9a8d4','#fde68a','#a7f3d0','#bfdbfe','#ddd6fe','#ffffff','#fca5a5','#6ee7b7']
const decorations = ['Sprinkles', 'Stars', 'Dots', 'Swirls', 'Flowers']

const CakeMode = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState('#f9a8d4')
  const [brushSize, setBrushSize] = useState(12)
  const [tool, setTool] = useState<'icing' | 'decor' | 'erase'>('icing')
  const [decor, setDecor] = useState('Sprinkles')
  const [mode, setMode] = useState<'air' | 'mouse'>('air')
  const [drawing, setDrawing] = useState(false)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (mode !== 'mouse') return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Draw cake outline
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 3
    const cx = canvas.width / 2, cy = canvas.height / 2
    ctx.beginPath(); ctx.ellipse(cx, cy + 60, 160, 40, 0, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx - 160, cy + 60); ctx.lineTo(cx - 160, cy - 60)
    ctx.ellipse(cx, cy - 60, 160, 40, 0, Math.PI, 0); ctx.lineTo(cx + 160, cy + 60); ctx.stroke()
  }, [mode])

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width), y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height) }
  }

  const drawDecor = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = color
    if (decor === 'Sprinkles') {
      for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, d = Math.random() * brushSize * 2; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 4, 2) }
    } else if (decor === 'Dots') {
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + (Math.random() - 0.5) * brushSize * 3, y + (Math.random() - 0.5) * brushSize * 3, 3, 0, Math.PI * 2); ctx.fill() }
    } else { ctx.beginPath(); ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2); ctx.fill() }
  }

  const handleMouseDown = (e: React.MouseEvent) => { setDrawing(true); setLastPos(getPos(e)) }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !lastPos) return
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'
    if (tool === 'decor') { drawDecor(ctx, pos.x, pos.y) }
    else { ctx.strokeStyle = color; ctx.lineWidth = tool === 'erase' ? brushSize * 2 : brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke() }
    setLastPos(pos)
  }
  const handleMouseUp = () => { setDrawing(false); setLastPos(null) }
  const save = () => { const a = document.createElement('a'); a.href = canvasRef.current!.toDataURL(); a.download = 'cake-design.png'; a.click() }

  return (
    <Layout title="Cake Designing" subtitle="Design cakes with icing and decorations using air gestures or mouse">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">DRAWING MODE</p>
            <div className="flex gap-2">
              {(['air', 'mouse'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === m ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {m === 'air' ? 'Air Draw' : 'Mouse'}
                </button>
              ))}
            </div>
          </div>
          {mode === 'mouse' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 tracking-widest mb-3">TOOL</p>
              <div className="flex flex-col gap-2">
                {(['icing', 'decor', 'erase'] as const).map(t => (
                  <button key={t} onClick={() => setTool(t)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${tool === t ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {t === 'icing' ? 'Icing Brush' : t === 'decor' ? 'Decorations' : 'Erase'}
                  </button>
                ))}
              </div>
              {tool === 'decor' && (
                <div className="mt-3 flex flex-col gap-1">
                  {decorations.map(d => (
                    <button key={d} onClick={() => setDecor(d)}
                      className={`py-1 rounded text-xs transition-all ${decor === d ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{d}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">ICING COLOR</p>
            <div className="flex flex-wrap gap-2">
              {icingColors.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-2">BRUSH SIZE</p>
            <input type="range" min={4} max={40} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-full accent-blue-500" />
          </div>
          {mode === 'mouse' && <button onClick={save} className="w-full py-3 bg-blue-700 hover:bg-blue-600 rounded-xl text-sm font-semibold text-white transition-colors">Download</button>}
        </div>

        <div className="lg:col-span-3">
          {mode === 'air' ? (
            <AirCanvas color={color} brushSize={brushSize} height={520} />
          ) : (
            <div className="rounded-2xl overflow-hidden border border-slate-700">
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

export default CakeMode

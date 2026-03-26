import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

const ICING_COLORS = ['#f9a8d4','#fde68a','#a7f3d0','#bfdbfe','#ddd6fe','#ffffff','#fca5a5','#6ee7b7','#fbbf24','#c084fc']
const DECORATIONS  = ['Sprinkles', 'Stars', 'Dots', 'Swirls', 'Candles', 'Cherries', 'Flowers', 'Hearts', 'Pearls', 'Drizzle']

const drawDecoration = (ctx: CanvasRenderingContext2D, x: number, y: number, decor: string, color: string, size: number) => {
  ctx.fillStyle = color; ctx.strokeStyle = color
  switch (decor) {
    case 'Sprinkles':
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * size * 2.5
        ctx.save(); ctx.translate(x + Math.cos(a)*d, y + Math.sin(a)*d); ctx.rotate(Math.random()*Math.PI)
        ctx.fillStyle = ['#f9a8d4','#bfdbfe','#a7f3d0','#fde68a','#ddd6fe'][Math.floor(Math.random()*5)]
        ctx.fillRect(-5, -2, 10, 4); ctx.restore()
      }
      break
    case 'Stars':
      for (let i = 0; i < 3; i++) {
        const sx = x + (Math.random()-0.5)*size*3, sy = y + (Math.random()-0.5)*size*3
        ctx.save(); ctx.translate(sx, sy)
        ctx.beginPath()
        for (let j = 0; j < 5; j++) {
          const a = (j*4*Math.PI/5) - Math.PI/2
          j === 0 ? ctx.moveTo(Math.cos(a)*8, Math.sin(a)*8) : ctx.lineTo(Math.cos(a)*8, Math.sin(a)*8)
        }
        ctx.closePath(); ctx.fill(); ctx.restore()
      }
      break
    case 'Dots':
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x+(Math.random()-.5)*size*3, y+(Math.random()-.5)*size*3, 4, 0, Math.PI*2); ctx.fill() }
      break
    case 'Swirls':
      ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.beginPath()
      for (let t = 0; t < Math.PI*4; t += 0.1) { const r = t*3; ctx.lineTo(x+Math.cos(t)*r, y+Math.sin(t)*r) }
      ctx.stroke(); ctx.restore()
      break
    case 'Candles':
      ctx.save()
      // candle body
      ctx.fillStyle = color; ctx.fillRect(x-5, y-20, 10, 20)
      // flame
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath(); ctx.ellipse(x, y-25, 4, 7, 0, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6
      ctx.beginPath(); ctx.ellipse(x, y-26, 2, 4, 0, 0, Math.PI*2); ctx.fill()
      ctx.restore()
      break
    case 'Cherries':
      ctx.save()
      // stem
      ctx.strokeStyle = '#166534'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x+10, y-15, x+8, y-20); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x-10, y-15, x-8, y-20); ctx.stroke()
      // cherries
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(x+8, y-20, 7, 0, Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(x-8, y-20, 7, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.4
      ctx.beginPath(); ctx.arc(x+6, y-22, 3, 0, Math.PI*2); ctx.fill()
      ctx.restore()
      break
    case 'Flowers':
      ctx.save()
      for (let a = 0; a < 360; a += 60) {
        ctx.fillStyle = color
        ctx.beginPath(); ctx.ellipse(x+Math.cos(a*Math.PI/180)*8, y+Math.sin(a*Math.PI/180)*8, 5, 3, a*Math.PI/180, 0, Math.PI*2); ctx.fill()
      }
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2); ctx.fill()
      ctx.restore()
      break
    case 'Hearts':
      ctx.save(); ctx.translate(x, y); ctx.scale(0.5, 0.5)
      ctx.beginPath(); ctx.moveTo(0, -10)
      ctx.bezierCurveTo(10, -25, 30, -10, 0, 15)
      ctx.bezierCurveTo(-30, -10, -10, -25, 0, -10)
      ctx.fill(); ctx.restore()
      break
    case 'Pearls':
      for (let i = 0; i < 5; i++) {
        const px = x+(Math.random()-.5)*size*3, py = y+(Math.random()-.5)*size*3
        const g = ctx.createRadialGradient(px-2, py-2, 1, px, py, 7)
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, color); g.addColorStop(1, '#94a3b8')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI*2); ctx.fill()
      }
      break
    case 'Drizzle':
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(x-size*2, y)
      for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(x-size*2+i*size, y+(i%2===0?10:-10), x-size*2+(i+1)*size, y)
      ctx.stroke(); ctx.restore()
      break
  }
}

const CakeMode = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [uploadedImg, setUploadedImg] = useState<string | null>(null)
  const [color, setColor]       = useState('#f9a8d4')
  const [brushSize, setBrushSize] = useState(12)
  const [tool, setTool]         = useState<'icing' | 'decor' | 'erase'>('icing')
  const [decor, setDecor]       = useState('Sprinkles')
  const [mode, setMode]         = useState<'air' | 'mouse'>('air')
  const [drawing, setDrawing]   = useState(false)
  const [lastPos, setLastPos]   = useState<{ x: number; y: number } | null>(null)

  const initCanvas = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    if (uploadedImg && uploadedImg !== 'blank') {
      const img = new Image()
      img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height) }
      img.src = uploadedImg
    } else {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 3
      const cx = canvas.width / 2, cy = canvas.height / 2
      ctx.beginPath(); ctx.ellipse(cx, cy+60, 160, 40, 0, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx-160, cy+60); ctx.lineTo(cx-160, cy-60)
      ctx.ellipse(cx, cy-60, 160, 40, 0, Math.PI, 0); ctx.lineTo(cx+160, cy+60); ctx.stroke()
    }
  }

  useEffect(() => { if (mode === 'mouse') initCanvas() }, [mode, uploadedImg])

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX-rect.left)*(canvasRef.current!.width/rect.width), y: (e.clientY-rect.top)*(canvasRef.current!.height/rect.height) }
  }

  const handleMouseDown = (e: React.MouseEvent) => { setDrawing(true); setLastPos(getPos(e)) }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !lastPos) return
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'
    if (tool === 'decor') { drawDecoration(ctx, pos.x, pos.y, decor, color, brushSize) }
    else if (tool === 'erase') { ctx.lineWidth = brushSize*2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke() }
    else { ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke() }
    setLastPos(pos)
  }
  const handleMouseUp = () => { setDrawing(false); setLastPos(null) }
  const save = () => { const a = document.createElement('a'); a.href = canvasRef.current!.toDataURL(); a.download = 'cake-design.png'; a.click() }

  return (
    <Layout title="Cake Designing" subtitle="Design cakes with icing, candles, cherries and more">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-3 overflow-y-auto">
          {/* Mode */}
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

          {/* Upload */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">UPLOAD CAKE IMAGE</p>
            <label className="block w-full py-2 text-center border border-dashed border-slate-700 rounded-lg text-xs text-slate-400 hover:border-blue-600 hover:text-blue-400 cursor-pointer transition-colors">
              Choose Image
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (!f) return
                const r = new FileReader(); r.onload = ev => setUploadedImg(ev.target?.result as string); r.readAsDataURL(f)
              }} />
            </label>
            <button onClick={() => setUploadedImg('blank')} className="w-full mt-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:bg-slate-700 transition-colors">Default Cake</button>
          </div>

          {/* Tool */}
          {mode === 'mouse' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 tracking-widest mb-3">TOOL</p>
              <div className="flex flex-col gap-1.5">
                {(['icing', 'decor', 'erase'] as const).map(t => (
                  <button key={t} onClick={() => setTool(t)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${tool === t ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {t === 'icing' ? 'Icing Brush' : t === 'decor' ? 'Decorations' : 'Erase'}
                  </button>
                ))}
              </div>
              {tool === 'decor' && (
                <div className="mt-3 grid grid-cols-2 gap-1">
                  {DECORATIONS.map(d => (
                    <button key={d} onClick={() => setDecor(d)}
                      className={`py-1 rounded text-xs transition-all ${decor === d ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{d}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Colors */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">ICING COLOR</p>
            <div className="flex flex-wrap gap-2">
              {ICING_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-2">BRUSH SIZE</p>
            <input type="range" min={4} max={40} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-full accent-blue-500" />
          </div>

          {mode === 'mouse' && (
            <button onClick={save} className="w-full py-3 bg-blue-700 hover:bg-blue-600 rounded-xl text-sm font-semibold text-white transition-colors">Download Design</button>
          )}
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

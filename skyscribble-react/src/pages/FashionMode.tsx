import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import AirCanvas from '../components/AirCanvas'

const COLORS = ['#60a5fa','#f87171','#4ade80','#facc15','#a78bfa','#fb923c','#f9a8d4','#ffffff','#1e293b','#94a3b8','#ffd700','#c0c0c0']
const PATTERNS = ['Solid', 'Stripes', 'Dots', 'Plaid', 'Floral', 'Zigzag']
const EFFECTS  = ['Glitter', 'Sequins', 'Rhinestones', 'Lace', 'Embroidery', 'Metallic']

const applyEffect = (ctx: CanvasRenderingContext2D, x: number, y: number, effect: string, color: string, size: number) => {
  ctx.fillStyle = color
  ctx.strokeStyle = color
  switch (effect) {
    case 'Glitter':
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * size * 2.5
        const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d
        ctx.save(); ctx.globalAlpha = 0.6 + Math.random() * 0.4
        ctx.fillStyle = Math.random() > 0.5 ? color : '#ffffff'
        ctx.beginPath(); ctx.arc(px, py, 1.5 + Math.random() * 2, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
      break
    case 'Sequins':
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * size * 2
        ctx.save(); ctx.globalAlpha = 0.85
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 5, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill()
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke()
        ctx.restore()
      }
      break
    case 'Rhinestones':
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * size * 1.8
        const rx = x + Math.cos(a) * d, ry = y + Math.sin(a) * d
        ctx.save()
        const grad = ctx.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, 7)
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, color); grad.addColorStop(1, '#000000')
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(rx, ry, 7, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
      break
    case 'Lace':
      ctx.save(); ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.strokeStyle = color
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.beginPath(); ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(a) * size * 2, y + Math.sin(a) * size * 2)
        ctx.stroke()
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * size * 1.5, y + Math.sin(a) * size * 1.5, 4, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.restore()
      break
    case 'Embroidery':
      ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.globalAlpha = 0.8
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.beginPath(); ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(a) * size * 2.5, y + Math.sin(a) * size * 2.5); ctx.stroke()
      }
      ctx.restore()
      break
    case 'Metallic':
      ctx.save()
      const mGrad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 1, x, y, size * 2)
      mGrad.addColorStop(0, '#ffffff'); mGrad.addColorStop(0.3, color); mGrad.addColorStop(1, '#1e293b')
      ctx.fillStyle = mGrad; ctx.beginPath(); ctx.arc(x, y, size * 2, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      break
  }
}

const applyPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, pattern: string, color: string, size: number) => {
  ctx.fillStyle = color; ctx.strokeStyle = color
  const r = size * 2
  if (pattern === 'Dots') {
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + (Math.random()-0.5)*r*2, y + (Math.random()-0.5)*r*2, 3, 0, Math.PI*2); ctx.fill() }
  } else if (pattern === 'Stripes') {
    ctx.lineWidth = 2
    for (let i = -r; i < r; i += 6) { ctx.beginPath(); ctx.moveTo(x+i, y-r); ctx.lineTo(x+i, y+r); ctx.stroke() }
  } else if (pattern === 'Zigzag') {
    ctx.lineWidth = 2; ctx.beginPath()
    for (let i = -r; i < r; i += 8) { ctx.lineTo(x+i, i%16===0 ? y-r/2 : y+r/2) }
    ctx.stroke()
  } else if (pattern === 'Plaid') {
    ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6
    for (let i = -r; i < r; i += 8) { ctx.beginPath(); ctx.moveTo(x+i, y-r); ctx.lineTo(x+i, y+r); ctx.stroke() }
    for (let i = -r; i < r; i += 8) { ctx.beginPath(); ctx.moveTo(x-r, y+i); ctx.lineTo(x+r, y+i); ctx.stroke() }
    ctx.globalAlpha = 1
  } else if (pattern === 'Floral') {
    for (let a = 0; a < 360; a += 60) { ctx.beginPath(); ctx.ellipse(x+Math.cos(a*Math.PI/180)*10, y+Math.sin(a*Math.PI/180)*10, 6, 3, a*Math.PI/180, 0, Math.PI*2); ctx.fill() }
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2); ctx.fill()
  } else {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
  }
}

const FashionMode = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [uploadedImg, setUploadedImg] = useState<string | null>(null)
  const [color, setColor]       = useState('#60a5fa')
  const [brushSize, setBrushSize] = useState(10)
  const [tool, setTool]         = useState<'brush' | 'erase' | 'pattern' | 'effect'>('brush')
  const [pattern, setPattern]   = useState('Solid')
  const [effect, setEffect]     = useState('Glitter')
  const [mode, setMode]         = useState<'air' | 'mouse'>('air')
  const [drawing, setDrawing]   = useState(false)
  const [lastPos, setLastPos]   = useState<{ x: number; y: number } | null>(null)

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

  const handleMouseDown = (e: React.MouseEvent) => { setDrawing(true); setLastPos(getPos(e)) }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !lastPos) return
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'
    if (tool === 'pattern') { applyPattern(ctx, pos.x, pos.y, pattern, color, brushSize) }
    else if (tool === 'effect') { applyEffect(ctx, pos.x, pos.y, effect, color, brushSize) }
    else if (tool === 'erase') { ctx.lineWidth = brushSize * 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke() }
    else { ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke() }
    setLastPos(pos)
  }
  const handleMouseUp = () => { setDrawing(false); setLastPos(null) }
  const save = () => { const a = document.createElement('a'); a.href = canvasRef.current!.toDataURL(); a.download = 'fashion-design.png'; a.click() }

  return (
    <Layout title="Fashion Designing" subtitle="Design clothing with air gestures, patterns, glitter, sequins and more">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-3 overflow-y-auto max-h-screen">
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
            <p className="text-xs text-slate-500 tracking-widest mb-3">UPLOAD TEMPLATE</p>
            <label className="block w-full py-2 text-center border border-dashed border-slate-700 rounded-lg text-xs text-slate-400 hover:border-blue-600 hover:text-blue-400 cursor-pointer transition-colors">
              Choose Clothing Image
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (!f) return
                const r = new FileReader(); r.onload = ev => setUploadedImg(ev.target?.result as string); r.readAsDataURL(f)
              }} />
            </label>
            <button onClick={() => setUploadedImg('blank')} className="w-full mt-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:bg-slate-700 transition-colors">Blank Canvas</button>
          </div>

          {/* Tool */}
          {mode === 'mouse' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 tracking-widest mb-3">TOOL</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['brush', 'pattern', 'effect', 'erase'] as const).map(t => (
                  <button key={t} onClick={() => setTool(t)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize transition-all ${tool === t ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
              {tool === 'pattern' && (
                <div className="mt-3 grid grid-cols-2 gap-1">
                  {PATTERNS.map(p => (
                    <button key={p} onClick={() => setPattern(p)}
                      className={`py-1 rounded text-xs transition-all ${pattern === p ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p}</button>
                  ))}
                </div>
              )}
              {tool === 'effect' && (
                <div className="mt-3 grid grid-cols-2 gap-1">
                  {EFFECTS.map(ef => (
                    <button key={ef} onClick={() => setEffect(ef)}
                      className={`py-1 rounded text-xs transition-all ${effect === ef ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{ef}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Colors */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-3">COLORS</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 tracking-widest mb-2">BRUSH SIZE</p>
            <input type="range" min={2} max={40} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-full accent-blue-500" />
          </div>

          {mode === 'mouse' && uploadedImg && (
            <button onClick={save} className="w-full py-3 bg-blue-700 hover:bg-blue-600 rounded-xl text-sm font-semibold text-white transition-colors">Download Design</button>
          )}
        </div>

        <div className="lg:col-span-3">
          {mode === 'air' ? (
            <AirCanvas color={color} brushSize={brushSize} height={520} />
          ) : !uploadedImg ? (
            <div className="h-96 bg-[#0F172A] border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3">
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

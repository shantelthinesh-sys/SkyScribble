import { useRef, useEffect, useState } from 'react'

interface GestureCanvasProps {
  width?: number
  height?: number
  color?: string
  brushSize?: number
  onSave?: (dataUrl: string) => void
}

const GestureCanvas = ({ width = 800, height = 480, color = '#60a5fa', brushSize = 6, onSave }: GestureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const draw = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true)
    setLastPos(getPos(e))
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !lastPos) return
    const pos = getPos(e)
    draw(lastPos, pos)
    setLastPos(pos)
  }

  const handleEnd = () => { setDrawing(false); setLastPos(null) }

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
  }

  const saveCanvas = () => {
    if (onSave && canvasRef.current) onSave(canvasRef.current.toDataURL())
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        <div className="absolute top-3 left-3 text-xs text-slate-600 select-none">Draw here</div>
      </div>
      <div className="flex gap-3">
        <button onClick={clearCanvas} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
          Clear
        </button>
        {onSave && (
          <button onClick={saveCanvas} className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white transition-colors">
            Save
          </button>
        )}
      </div>
    </div>
  )
}

export default GestureCanvas

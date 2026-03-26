import { useRef, useCallback, useState, useEffect } from 'react'
import { useHandTracking, GestureMode, HandPoint, HAND_CONNECTIONS } from '../hooks/useHandTracking'

interface AirCanvasProps {
  color?: string
  brushSize?: number
  onSave?: (dataUrl: string) => void
  height?: number
  showSkeleton?: boolean
  children?: React.ReactNode   // optional overlay (e.g. shape guides)
}

const G_LABEL: Record<GestureMode, string> = {
  DRAW: 'Drawing', ERASE: 'Erasing', HOLD: 'Paused', CLEAR: 'Clearing', IDLE: 'No hand detected',
}
const G_COLOR: Record<GestureMode, string> = {
  DRAW: '#60a5fa', ERASE: '#f87171', HOLD: '#facc15', CLEAR: '#f87171', IDLE: '#475569',
}

export default function AirCanvas({
  color = '#60a5fa',
  brushSize = 6,
  onSave,
  height = 480,
  showSkeleton = true,
  children,
}: AirCanvasProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const drawRef    = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const prevRef    = useRef<HandPoint | null>(null)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const colorRef   = useRef(color)
  const sizeRef    = useRef(brushSize)
  colorRef.current = color
  sizeRef.current  = brushSize

  const [showCam, setShowCam]   = useState(true)
  const [canvasW, setCanvasW]   = useState(640)

  // keep canvas width in sync with container
  useEffect(() => {
    const el = drawRef.current?.parentElement
    if (!el) return
    const obs = new ResizeObserver(() => setCanvasW(el.clientWidth || 640))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // ── draw skeleton on overlay ──────────────────────────────────────────────
  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, lm: HandPoint[], W: number, H: number) => {
    ctx.strokeStyle = 'rgba(96,165,250,0.6)'
    ctx.lineWidth = 1.5
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(lm[a].x * W, lm[a].y * H)
      ctx.lineTo(lm[b].x * W, lm[b].y * H)
      ctx.stroke()
    }
    for (let i = 0; i < lm.length; i++) {
      ctx.beginPath()
      ctx.arc(lm[i].x * W, lm[i].y * H, i === 8 ? 6 : 3, 0, Math.PI * 2)
      ctx.fillStyle = i === 8 ? G_COLOR['DRAW'] : 'rgba(148,163,184,0.8)'
      ctx.fill()
    }
  }, [])

  // ── main gesture handler ──────────────────────────────────────────────────
  const handleFrame = useCallback((
    mode: GestureMode,
    tip: HandPoint | null,
    landmarks: HandPoint[] | null
  ) => {
    const draw = drawRef.current
    const overlay = overlayRef.current
    if (!draw || !overlay) return

    const dCtx = draw.getContext('2d')!
    const oCtx = overlay.getContext('2d')!
    const W = draw.width, H = draw.height

    oCtx.clearRect(0, 0, W, H)

    // skeleton
    if (showSkeleton && landmarks) drawSkeleton(oCtx, landmarks, W, H)

    if (!tip) { prevRef.current = null; return }

    const px = tip.x * W
    const py = tip.y * H

    // cursor ring
    oCtx.beginPath()
    oCtx.arc(px, py, sizeRef.current + 6, 0, Math.PI * 2)
    oCtx.strokeStyle = G_COLOR[mode]
    oCtx.lineWidth = 2
    oCtx.stroke()
    // inner dot
    oCtx.beginPath()
    oCtx.arc(px, py, 3, 0, Math.PI * 2)
    oCtx.fillStyle = G_COLOR[mode]
    oCtx.fill()

    // CLEAR: hold fist 600ms
    if (mode === 'CLEAR') {
      if (!clearTimer.current) {
        clearTimer.current = setTimeout(() => {
          dCtx.clearRect(0, 0, W, H)
          clearTimer.current = null
        }, 600)
      }
      prevRef.current = null
      return
    }
    if (clearTimer.current) { clearTimeout(clearTimer.current); clearTimer.current = null }

    if (mode === 'HOLD' || mode === 'IDLE') { prevRef.current = null; return }

    const prev = prevRef.current
    if (!prev) { prevRef.current = { x: px, y: py }; return }

    if (mode === 'ERASE') {
      dCtx.save()
      dCtx.globalCompositeOperation = 'destination-out'
      dCtx.strokeStyle = 'rgba(0,0,0,1)'
      dCtx.lineWidth = sizeRef.current * 5
      dCtx.lineCap = 'round'
      dCtx.beginPath(); dCtx.moveTo(prev.x, prev.y); dCtx.lineTo(px, py); dCtx.stroke()
      dCtx.restore()
    } else if (mode === 'DRAW') {
      dCtx.strokeStyle = colorRef.current
      dCtx.lineWidth = sizeRef.current
      dCtx.lineCap = 'round'
      dCtx.lineJoin = 'round'
      dCtx.shadowColor = colorRef.current
      dCtx.shadowBlur = 6
      dCtx.beginPath(); dCtx.moveTo(prev.x, prev.y); dCtx.lineTo(px, py); dCtx.stroke()
      dCtx.shadowBlur = 0
    }

    prevRef.current = { x: px, y: py }
  }, [drawSkeleton, showSkeleton])

  const { status, gesture, start, stop } = useHandTracking(
    videoRef as React.RefObject<HTMLVideoElement>,
    handleFrame
  )

  const clearCanvas = () => {
    const ctx = drawRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, drawRef.current!.width, drawRef.current!.height)
  }

  const saveCanvas = () => {
    if (!onSave || !drawRef.current) return
    onSave(drawRef.current.toDataURL())
  }

  const isRunning = status === 'ready' || status === 'loading'

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── status bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0F172A] border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            status === 'ready'   ? 'bg-green-500' :
            status === 'loading' ? 'bg-yellow-400 animate-pulse' :
            status === 'error'   ? 'bg-red-500' : 'bg-slate-600'
          }`} />
          <span className="text-slate-300 font-medium" style={{ color: G_COLOR[gesture] }}>
            {status === 'idle'    ? 'Camera off — click Start Camera' :
             status === 'loading' ? 'Loading MediaPipe model...' :
             status === 'error'   ? 'Camera unavailable' :
             G_LABEL[gesture]}
          </span>
        </div>
        <div className="hidden md:flex gap-4 text-slate-600">
          <span>Index = Draw</span>
          <span>2 fingers = Erase</span>
          <span>3+ = Pause</span>
          <span>Fist = Clear</span>
        </div>
      </div>

      {/* ── canvas workspace ── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950"
        style={{ height: `${height}px` }}
      >
        {/* webcam */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ transform: 'scaleX(-1)', opacity: showCam ? 0.35 : 0 }}
          playsInline muted
        />

        {/* optional children (shape guides, templates) */}
        {children && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {children}
          </div>
        )}

        {/* drawing canvas */}
        <canvas
          ref={drawRef}
          width={canvasW}
          height={height}
          className="absolute inset-0 w-full h-full z-20"
        />

        {/* overlay: skeleton + cursor */}
        <canvas
          ref={overlayRef}
          width={canvasW}
          height={height}
          className="absolute inset-0 w-full h-full z-30 pointer-events-none"
        />

        {/* idle splash */}
        {status === 'idle' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-slate-950/85">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Click Start Camera to begin air drawing</p>
            <p className="text-slate-600 text-xs">Camera permission required</p>
          </div>
        )}

        {/* error splash */}
        {status === 'error' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-slate-950/85">
            <div className="w-12 h-12 rounded-xl bg-red-900/30 border border-red-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-red-400 text-sm">Camera access denied or unavailable</p>
            <p className="text-slate-600 text-xs">Allow camera permission and try again</p>
          </div>
        )}

        {/* gesture badge (top-left) */}
        {status === 'ready' && (
          <div
            className="absolute top-3 left-3 z-40 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
            style={{
              background: G_COLOR[gesture] + '18',
              color: G_COLOR[gesture],
              border: `1px solid ${G_COLOR[gesture]}40`,
            }}
          >
            {G_LABEL[gesture]}
          </div>
        )}

        {/* cam toggle (top-right) */}
        {isRunning && (
          <button
            onClick={() => setShowCam(v => !v)}
            className="absolute top-3 right-3 z-40 px-3 py-1 rounded-full text-xs bg-slate-900/70 border border-slate-700 text-slate-400 hover:text-white transition-colors backdrop-blur-sm"
          >
            {showCam ? 'Hide Cam' : 'Show Cam'}
          </button>
        )}
      </div>

      {/* ── controls ── */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={isRunning ? stop : start}
          disabled={status === 'loading'}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
            isRunning
              ? 'bg-red-900/40 border border-red-800 text-red-300 hover:bg-red-900/60'
              : 'bg-blue-700 hover:bg-blue-600 text-white'
          }`}
        >
          {status === 'loading' ? 'Loading model...' : isRunning ? 'Stop Camera' : 'Start Camera'}
        </button>

        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
        >
          Clear Canvas
        </button>

        {onSave && (
          <button
            onClick={saveCanvas}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            Save
          </button>
        )}
      </div>
    </div>
  )
}

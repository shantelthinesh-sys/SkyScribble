import { useEffect, useRef, useState, useCallback } from 'react'

export type GestureMode = 'DRAW' | 'ERASE' | 'HOLD' | 'CLEAR' | 'IDLE'
export interface HandPoint { x: number; y: number }

declare global {
  interface Window { Hands: any }
}

// ── script loader ──────────────────────────────────────────────────────────
const loaded = new Set<string>()
function loadScript(src: string): Promise<void> {
  if (loaded.has(src)) return Promise.resolve()
  return new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => { loaded.add(src); res() }
    s.onerror = rej
    document.head.appendChild(s)
  })
}

// ── gesture resolver ───────────────────────────────────────────────────────
export function resolveGesture(lm: { x: number; y: number }[]): GestureMode {
  const tipAbovePip = (tip: number, pip: number) => lm[tip].y < lm[pip].y - 0.02
  const index  = tipAbovePip(8,  6)
  const middle = tipAbovePip(12, 10)
  const ring   = tipAbovePip(16, 14)
  const pinky  = tipAbovePip(20, 18)
  const count  = [index, middle, ring, pinky].filter(Boolean).length

  // fist: all fingers curled
  if (count === 0) return 'CLEAR'
  // 3+ fingers: hold/pause
  if (count >= 3) return 'HOLD'
  // index + middle: erase
  if (index && middle) return 'ERASE'
  // only index: draw
  if (index) return 'DRAW'
  return 'IDLE'
}

// ── skeleton edges ─────────────────────────────────────────────────────────
export const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
]

// ── smoothing buffer ───────────────────────────────────────────────────────
const SMOOTH = 0.55 // lerp factor (higher = more responsive, lower = smoother)

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement>,
  onFrame?: (mode: GestureMode, tip: HandPoint | null, landmarks: HandPoint[] | null) => void
) {
  const [status, setStatus]   = useState<'idle'|'loading'|'ready'|'error'>('idle')
  const [gesture, setGesture] = useState<GestureMode>('IDLE')
  const [tip, setTip]         = useState<HandPoint | null>(null)

  const handsRef   = useRef<any>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const rafRef     = useRef<number>(0)
  const cbRef      = useRef(onFrame)
  const smoothRef  = useRef<HandPoint | null>(null)   // smoothed tip position
  cbRef.current = onFrame

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    handsRef.current?.close()
    handsRef.current = null
    streamRef.current = null
    smoothRef.current = null
    setStatus('idle')
    setGesture('IDLE')
    setTip(null)
  }, [])

  const start = useCallback(async () => {
    if (status === 'loading' || status === 'ready') return
    setStatus('loading')
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream

      const video = videoRef.current!
      video.srcObject = stream
      await new Promise<void>(r => { video.onloadedmetadata = () => r() })
      await video.play()

      const hands = new window.Hands({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      })
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      })

      hands.onResults((results: any) => {
        if (!results.multiHandLandmarks?.length) {
          smoothRef.current = null
          setGesture('IDLE')
          setTip(null)
          cbRef.current?.('IDLE', null, null)
          return
        }

        const lm: HandPoint[] = results.multiHandLandmarks[0].map((p: any) => ({ x: p.x, y: p.y }))
        const mode = resolveGesture(lm)

        // mirror x (selfie view) + smooth
        const rawTip: HandPoint = { x: 1 - lm[8].x, y: lm[8].y }
        if (!smoothRef.current) {
          smoothRef.current = rawTip
        } else {
          smoothRef.current = {
            x: smoothRef.current.x + (rawTip.x - smoothRef.current.x) * SMOOTH,
            y: smoothRef.current.y + (rawTip.y - smoothRef.current.y) * SMOOTH,
          }
        }

        // mirror all landmarks for skeleton
        const mirroredLm: HandPoint[] = lm.map(p => ({ x: 1 - p.x, y: p.y }))

        setGesture(mode)
        setTip({ ...smoothRef.current })
        cbRef.current?.(mode, { ...smoothRef.current }, mirroredLm)
      })

      handsRef.current = hands

      const loop = async () => {
        if (videoRef.current?.readyState >= 2) {
          await hands.send({ image: videoRef.current })
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
      setStatus('ready')
    } catch (e) {
      console.error('[HandTracking]', e)
      setStatus('error')
    }
  }, [status, videoRef])

  useEffect(() => () => stop(), [stop])
  return { status, gesture, tip, start, stop }
}

import { useState, useRef, useCallback } from 'react'
import Layout from '../components/Layout'
import { useHandTracking, GestureMode, HandPoint } from '../hooks/useHandTracking'

// ── Shared camera hook for gaming ─────────────────────────────────────────
function useGameCamera(onCell: (cell: number) => void, gridCols: number, gridRows: number) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const overlayRef  = useRef<HTMLCanvasElement>(null)
  const hoverTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCell    = useRef<number>(-1)

  const handleFrame = useCallback((mode: GestureMode, tip: HandPoint | null) => {
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')!
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    if (!tip) { lastCell.current = -1; return }

    const col  = Math.floor(tip.x * gridCols)
    const row  = Math.floor(tip.y * gridRows)
    const cell = row * gridCols + col

    // draw cursor
    const cx = tip.x * overlay.width
    const cy = tip.y * overlay.height
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.strokeStyle = mode === 'DRAW' ? '#60a5fa' : '#475569'
    ctx.lineWidth = 2; ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#60a5fa'; ctx.fill()

    if (mode === 'DRAW') {
      if (cell !== lastCell.current) {
        lastCell.current = cell
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        hoverTimer.current = setTimeout(() => onCell(cell), 900)
      }
    } else {
      lastCell.current = -1
      if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null }
    }
  }, [onCell, gridCols, gridRows])

  const { status, start, stop } = useHandTracking(
    videoRef as React.RefObject<HTMLVideoElement>,
    handleFrame
  )

  return { videoRef, overlayRef, status, start, stop }
}

// ── Tic Tac Toe ───────────────────────────────────────────────────────────
const TicTacToe = () => {
  const [board, setBoard]   = useState<(string|null)[]>(Array(9).fill(null))
  const [xTurn, setXTurn]   = useState(true)
  const [scores, setScores] = useState({ X: 0, O: 0 })

  const checkWinner = (b: (string|null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (const [a,b2,c] of lines) if (b[a] && b[a]===b[b2] && b[a]===b[c]) return b[a]
    return b.every(Boolean) ? 'Draw' : null
  }
  const winner = checkWinner(board)

  const handleCell = useCallback((i: number) => {
    setBoard(prev => {
      if (prev[i] || checkWinner(prev)) return prev
      const next = [...prev]
      next[i] = xTurn ? 'X' : 'O'
      const w = checkWinner(next)
      if (w && w !== 'Draw') setScores(s => ({ ...s, [w]: (s as any)[w] + 1 }))
      setXTurn(t => !t)
      return next
    })
  }, [xTurn])

  const { videoRef, overlayRef, status, start, stop } = useGameCamera(handleCell, 3, 3)
  const isRunning = status === 'ready' || status === 'loading'

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Camera panel */}
      <div className="flex flex-col gap-3">
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950" style={{ height: 300 }}>
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-40" style={{ transform: 'scaleX(-1)' }} playsInline muted />
          <canvas ref={overlayRef} width={640} height={300} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
          {!isRunning && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
              <p className="text-slate-400 text-sm">Start camera to play with gestures</p>
            </div>
          )}
          {isRunning && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs bg-slate-900/70 text-blue-400 border border-slate-700">
              Hover index finger over a cell for 0.9s to place
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={isRunning ? stop : start} disabled={status==='loading'}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isRunning ? 'bg-red-900/40 border border-red-800 text-red-300' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}>
            {status==='loading' ? 'Loading...' : isRunning ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>
      </div>

      {/* Game board */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white">Tic Tac Toe</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-blue-400">X: {scores.X}</span>
            <span className="text-slate-400">O: {scores.O}</span>
          </div>
        </div>
        {winner
          ? <div className="mb-3 text-center text-sm font-semibold text-blue-400">{winner==='Draw'?'Draw!': `${winner} wins!`}</div>
          : <div className="mb-3 text-center text-xs text-slate-500">Turn: {xTurn?'X':'O'}</div>
        }
        <div className="grid grid-cols-3 gap-2 mb-4">
          {board.map((cell, i) => (
            <button key={i} onClick={() => handleCell(i)}
              className={`h-20 rounded-xl border text-3xl font-bold transition-all
                ${cell ? 'border-blue-700 bg-slate-800' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'}
                ${cell==='X' ? 'text-blue-400' : 'text-slate-300'}`}>
              {cell}
            </button>
          ))}
        </div>
        <button onClick={() => { setBoard(Array(9).fill(null)); setXTurn(true) }}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
          New Game
        </button>
      </div>
    </div>
  )
}

// ── Maze ──────────────────────────────────────────────────────────────────
const MAZE = [[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0],[1,1,0,0,0],[0,0,0,1,0]]

const MazeGame = () => {
  const [pos, setPos] = useState({ r:0, c:0 })
  const won = pos.r===4 && pos.c===4

  const handleFrame = useCallback((_mode: GestureMode, tip: HandPoint | null) => {
    if (!tip) return
    const col = Math.min(4, Math.floor(tip.x * 5))
    const row = Math.min(4, Math.floor(tip.y * 5))
    if (MAZE[row][col] !== 1) setPos({ r: row, c: col })
  }, [])

  const videoRef   = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const { status, start, stop } = useHandTracking(
    videoRef as React.RefObject<HTMLVideoElement>,
    handleFrame
  )
  const isRunning = status==='ready'||status==='loading'

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-3">
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950" style={{ height: 280 }}>
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-40" style={{ transform:'scaleX(-1)' }} playsInline muted />
          {!isRunning && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80"><p className="text-slate-400 text-sm">Start camera to navigate with hand</p></div>}
        </div>
        <button onClick={isRunning?stop:start} disabled={status==='loading'}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isRunning?'bg-red-900/40 border border-red-800 text-red-300':'bg-blue-700 hover:bg-blue-600 text-white'}`}>
          {status==='loading'?'Loading...':isRunning?'Stop Camera':'Start Camera'}
        </button>
      </div>
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4">Maze — move hand to navigate</h3>
        {won && <div className="mb-3 text-center text-sm font-semibold text-green-400">You escaped!</div>}
        <div className="grid gap-1 mb-4" style={{ gridTemplateColumns:'repeat(5,1fr)' }}>
          {MAZE.map((row,r) => row.map((cell,c) => (
            <div key={`${r}-${c}`} className={`h-12 rounded flex items-center justify-center text-xs font-bold
              ${cell===1?'bg-slate-700':'bg-slate-900 border border-slate-800'}
              ${pos.r===r&&pos.c===c?'bg-blue-700 border-blue-500':''}
              ${r===4&&c===4?'bg-green-900 border-green-700':''}`}>
              {pos.r===r&&pos.c===c?'●':r===4&&c===4?'G':''}
            </div>
          )))}
        </div>
        <button onClick={()=>setPos({r:0,c:0})} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">Reset</button>
      </div>
    </div>
  )
}

// ── Sudoku ────────────────────────────────────────────────────────────────
const INITIAL = [
  [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9],
]
const SudokuGame = () => {
  const [grid, setGrid] = useState(INITIAL.map(r=>[...r]))
  const [sel, setSel]   = useState<[number,number]|null>(null)

  const handleCell = useCallback((i: number) => {
    const r = Math.floor(i/9), c = i%9
    if (INITIAL[r][c]===0) setSel([r,c])
  }, [])

  const { videoRef, overlayRef, status, start, stop } = useGameCamera(handleCell, 9, 9)
  const isRunning = status==='ready'||status==='loading'

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-3">
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950" style={{ height:280 }}>
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-40" style={{transform:'scaleX(-1)'}} playsInline muted />
          <canvas ref={overlayRef} width={640} height={280} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
          {!isRunning && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80"><p className="text-slate-400 text-sm">Start camera to select cells</p></div>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={isRunning?stop:start} disabled={status==='loading'}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isRunning?'bg-red-900/40 border border-red-800 text-red-300':'bg-blue-700 hover:bg-blue-600 text-white'}`}>
            {status==='loading'?'Loading...':isRunning?'Stop Camera':'Start Camera'}
          </button>
          {sel && [1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => {
              const [r,c]=sel!; const g=grid.map(row=>[...row]); g[r][c]=n; setGrid(g); setSel(null)
            }} className="w-8 h-8 bg-slate-800 hover:bg-blue-700 border border-slate-700 rounded text-xs text-white transition-colors">{n}</button>
          ))}
        </div>
      </div>
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-white mb-3">Sudoku — hover to select cell</h3>
        <div className="grid gap-0.5" style={{gridTemplateColumns:'repeat(9,1fr)'}}>
          {grid.map((row,r)=>row.map((cell,c)=>(
            <div key={`${r}-${c}`} onClick={()=>INITIAL[r][c]===0&&setSel([r,c])}
              className={`h-7 flex items-center justify-center text-xs rounded cursor-pointer border transition-all
                ${sel&&sel[0]===r&&sel[1]===c?'bg-blue-700 border-blue-500 text-white':
                  INITIAL[r][c]!==0?'bg-slate-800 border-slate-700 text-blue-300':'bg-slate-900 border-slate-800 text-white hover:border-blue-600'}`}>
              {cell||''}
            </div>
          )))}
        </div>
        <button onClick={()=>{setGrid(INITIAL.map(r=>[...r]));setSel(null)}} className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">Reset</button>
      </div>
    </div>
  )
}

// ── Puzzle ────────────────────────────────────────────────────────────────
const PuzzleGame = () => {
  const shuffle = () => { const t=[...Array.from({length:9},(_,i)=>i)]; for(let i=t.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[t[i],t[j]]=[t[j],t[i]]};return t }
  const [tiles, setTiles] = useState(shuffle)
  const empty = tiles.indexOf(0)
  const solved = tiles.every((t,i)=>t===i)

  const move = useCallback((i: number) => {
    const er=Math.floor(empty/3),ec=empty%3,tr=Math.floor(i/3),tc=i%3
    if(Math.abs(er-tr)+Math.abs(ec-tc)!==1) return
    setTiles(prev=>{const n=[...prev];[n[empty],n[i]]=[n[i],n[empty]];return n})
  }, [empty])

  const handleCell = useCallback((i: number) => move(i), [move])
  const { videoRef, overlayRef, status, start, stop } = useGameCamera(handleCell, 3, 3)
  const isRunning = status==='ready'||status==='loading'

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-3">
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950" style={{height:280}}>
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-40" style={{transform:'scaleX(-1)'}} playsInline muted />
          <canvas ref={overlayRef} width={640} height={280} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
          {!isRunning && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80"><p className="text-slate-400 text-sm">Start camera to play with gestures</p></div>}
        </div>
        <button onClick={isRunning?stop:start} disabled={status==='loading'}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isRunning?'bg-red-900/40 border border-red-800 text-red-300':'bg-blue-700 hover:bg-blue-600 text-white'}`}>
          {status==='loading'?'Loading...':isRunning?'Stop Camera':'Start Camera'}
        </button>
      </div>
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4">Slide Puzzle — hover tile to move</h3>
        {solved && <div className="mb-3 text-center text-sm font-semibold text-green-400">Solved!</div>}
        <div className="grid gap-1 mb-4" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
          {tiles.map((t,i)=>(
            <button key={i} onClick={()=>move(i)}
              className={`h-20 rounded-xl text-2xl font-bold transition-all ${t===0?'bg-slate-900 border border-slate-800':'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300'}`}>
              {t!==0?t:''}
            </button>
          ))}
        </div>
        <button onClick={()=>setTiles(shuffle())} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">Shuffle</button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
const GamingMode = () => {
  const [game, setGame] = useState<'menu'|'ttt'|'sudoku'|'maze'|'puzzle'>('menu')
  const games = [
    { id:'ttt',    name:'Tic Tac Toe',  desc:'Hover index finger over a cell for 0.9s to place X or O' },
    { id:'sudoku', name:'Sudoku',        desc:'Hover to select a cell, then pick a number' },
    { id:'maze',   name:'Maze',          desc:'Move your hand to navigate through the maze' },
    { id:'puzzle', name:'Slide Puzzle',  desc:'Hover over a tile to slide it into the empty space' },
  ]

  if (game==='menu') return (
    <Layout title="Gaming Mode" subtitle="Gesture-controlled games — all powered by hand tracking">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {games.map(g=>(
          <button key={g.id} onClick={()=>setGame(g.id as any)}
            className="bg-[#0F172A] border border-slate-700 hover:border-blue-600 rounded-2xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20 group">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{g.name}</h3>
            <p className="text-slate-500 text-sm">{g.desc}</p>
          </button>
        ))}
      </div>
    </Layout>
  )

  return (
    <Layout title={games.find(g=>g.id===game)?.name||'Game'}>
      <button onClick={()=>setGame('menu')} className="mb-6 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">Back to Games</button>
      {game==='ttt'    && <TicTacToe />}
      {game==='sudoku' && <SudokuGame />}
      {game==='maze'   && <MazeGame />}
      {game==='puzzle' && <PuzzleGame />}
    </Layout>
  )
}

export default GamingMode

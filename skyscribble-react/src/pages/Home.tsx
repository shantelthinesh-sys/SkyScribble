import { Link } from 'react-router-dom'

const modules = [
  { name: 'Study Mode', path: '/study', desc: 'Virtual air whiteboard for teachers and students with gesture-based drawing and session management.' },
  { name: 'Gaming Mode', path: '/gaming', desc: 'Gesture-controlled games including Tic Tac Toe, Sudoku, Maze, and Puzzle.' },
  { name: 'Kids Mode', path: '/kids', desc: 'Camera-based tracing and coloring activities with cartoon outlines.' },
  { name: 'Anime Mode', path: '/anime', desc: 'Upload black-and-white anime sketches and color them with gesture tools.' },
  { name: 'Fashion Designing', path: '/fashion', desc: 'Design clothing with patterns, textures, and 3D preview using Three.js.' },
  { name: 'Cake Designing', path: '/cake', desc: 'Design cakes with icing tools, decorations, and 3D rotation preview.' },
]

const icons = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
]

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-400 tracking-widest">SKYSCRIBBLE</span>
        <div className="flex gap-6 text-sm text-slate-400">
          <a href="#modules" className="hover:text-white transition-colors">Modules</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block px-3 py-1 rounded-full border border-blue-800 text-blue-400 text-xs tracking-widest mb-8">
          GESTURE-BASED INTERACTION PLATFORM
        </div>
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Sky<span className="text-blue-500">Scribble</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          SkyScribble is an advanced gesture-based interaction platform that enables users to draw, design, learn, and create using hand movements in real time.
        </p>
      </div>

      {/* Modules */}
      <div id="modules" className="max-w-6xl mx-auto px-8 pb-24">
        <p className="text-xs text-slate-500 tracking-widest mb-8 text-center">SELECT A MODULE</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <Link
              key={mod.name}
              to={mod.path}
              className="group bg-[#0F172A] border border-slate-800 rounded-2xl p-8 flex flex-col gap-4 hover:border-blue-700 hover:bg-[#111827] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-blue-900/40 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-all duration-300">
                {icons[i]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {mod.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{mod.desc}</p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Open module</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Gesture guide */}
      <div className="border-t border-slate-800 bg-[#0F172A]">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <p className="text-xs text-slate-500 tracking-widest mb-6 text-center">GESTURE CONTROLS</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { gesture: 'Index Finger', action: 'Draw' },
              { gesture: 'Open Palm', action: 'Select Color' },
              { gesture: 'Closed Fist', action: 'Erase' },
              { gesture: 'Two Fingers', action: 'Switch Tool' },
            ].map(g => (
              <div key={g.gesture} className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800">
                <p className="text-blue-400 font-medium text-sm">{g.gesture}</p>
                <p className="text-slate-500 text-xs mt-1">{g.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

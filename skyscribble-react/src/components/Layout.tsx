import { Link } from 'react-router-dom'
import { ReactNode } from 'react'

interface LayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

const Layout = ({ title, subtitle, children }: LayoutProps) => (
  <div className="min-h-screen bg-[#0B0F19] text-white">
    <nav className="border-b border-slate-800 px-8 py-4 flex items-center gap-4">
      <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>
      <span className="text-slate-700">|</span>
      <span className="text-blue-400 font-bold tracking-widest text-sm">SKYSCRIBBLE</span>
    </nav>
    <div className="max-w-7xl mx-auto px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-2">{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>
)

export default Layout

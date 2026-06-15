import { Link, useLocation } from 'react-router'
import { BookOpen, Home, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: '4.1 基本概念', path: '/concept' },
  { label: '4.2 乐观准则', path: '/optimistic' },
  { label: '4.3 悲观准则', path: '/pessimistic' },
  { label: '4.4 折中准则', path: '/compromise' },
  { label: '4.5 后悔值', path: '/regret' },
  { label: '4.6 等概率', path: '/laplace' },
  { label: '4.7 案例分析', path: '/case-study' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1B3A5F]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white no-underline">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-semibold">决策理论与方法</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <a
            href="../"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md transition-colors duration-150 text-white/70 hover:text-white hover:bg-white/10 no-underline"
            title="返回课程目录"
          >
            <Home className="w-4 h-4" />
            目录
          </a>
          <Link
            to="/"
            className={`relative px-3 py-1.5 text-[13px] rounded-md transition-colors duration-150 no-underline ${
              isActive('/') ? 'text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            首页
            {isActive('/') && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full" />}
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-3 py-1.5 text-[13px] rounded-md transition-colors duration-150 no-underline ${
                isActive(item.path)
                  ? 'text-white font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
              {isActive(item.path) && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#1B3A5F] border-t border-white/10 shadow-lg md:hidden">
          <div className="max-w-[1200px] mx-auto px-4 py-2">
            <a
              href="../"
              className="flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors no-underline"
            >
              <Home className="w-4 h-4" />
              返回课程目录
            </a>
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 text-sm rounded-md transition-colors no-underline ${
                isActive('/') ? 'text-white font-medium bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              首页
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 text-sm rounded-md transition-colors no-underline ${
                  isActive(item.path)
                    ? 'text-white font-medium bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

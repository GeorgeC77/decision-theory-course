import { Link, useLocation } from 'react-router'
import { GitBranch, Home, Menu, X, ArrowLeft } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: '首页' },
  { path: '/6-1', label: '6.1 多阶段决策' },
  { path: '/6-2', label: '6.2 序列决策' },
  { path: '/6-3', label: '6.3 马尔可夫决策' },
  { path: '/6-4', label: '6.4 群体决策简介' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="h-14 bg-[#1B3A5F] flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 z-50 shadow-md">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-white no-underline">
        <GitBranch className="w-5 h-5 text-[#C8963E]" />
        <span className="text-base font-semibold hidden sm:inline">决策理论与方法</span>
        <span className="text-base font-semibold sm:hidden">决策理论</span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1">
        <a
          href="../"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 no-underline text-gray-300 hover:text-white hover:bg-[#2A4A73]"
          title="返回课程目录"
        >
          <Home className="w-4 h-4" />
          目录
        </a>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors no-underline ${
                isActive
                  ? 'text-[#C8963E] bg-[#1B3A5F] underline underline-offset-4 decoration-[#C8963E]'
                  : 'text-gray-300 hover:text-white hover:bg-[#2A4A73]'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white p-1"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#1B3A5F] border-t border-[#2A4A73] md:hidden shadow-lg">
          <div className="flex flex-col p-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-md transition-colors no-underline ${
                    isActive
                      ? 'text-[#C8963E] bg-[#2A4A73]'
                      : 'text-gray-300 hover:text-white hover:bg-[#2A4A73]'
                  }`}
                >
                  {item.path === '/' ? <ArrowLeft className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center text-xs">{item.label.split(' ')[0]}</span>}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}

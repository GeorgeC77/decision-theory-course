import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { BookOpen, Home, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: '首页', path: '/' },
  { label: '4.1 基本概念', path: '/concept' },
  { label: '4.2 乐观准则', path: '/optimistic' },
  { label: '4.3 悲观准则', path: '/pessimistic' },
  { label: '4.4 折中准则', path: '/compromise' },
  { label: '4.5 后悔值', path: '/regret' },
  { label: '4.6 等概率', path: '/laplace' },
  { label: '4.7 案例分析', path: '/case-study' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center"
      style={{ backgroundColor: '#1B3A5F' }}
    >
      <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Book icon + title */}
        <Link to="/" className="flex items-center gap-2 text-white no-underline">
          <BookOpen size={18} strokeWidth={2} />
          <span className="text-sm font-medium">决策理论与方法</span>
        </Link>

        {/* Right: Desktop nav links */}
        <div className="hidden lg:flex items-center gap-1">
          <a
            href="../"
            className="flex items-center gap-1.5 px-3 py-1 text-white text-[13px] no-underline transition-opacity duration-200 rounded-md hover:bg-white/10"
            title="返回课程目录"
          >
            <Home size={14} />
            目录
          </a>
          {navLinks.map((link) => {
            const isActive =
              link.path === '/'
                ? location.pathname === '/'
                : location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-2 py-1 text-white text-[13px] no-underline transition-opacity duration-200"
                style={{
                  opacity: isActive ? 1 : 0.7,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.target as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.target as HTMLElement).style.opacity = '0.7';
                }}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    style={{ borderRadius: '1px' }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-14 left-0 right-0 lg:hidden flex flex-col"
            style={{ backgroundColor: '#1B3A5F' }}
          >
            <a
              href="../"
              className="px-4 py-3 text-white text-[13px] no-underline flex items-center gap-2"
              style={{ opacity: 0.8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setMobileOpen(false)}
            >
              <Home size={14} />
              返回课程目录
            </a>
            {navLinks.map((link) => {
              const isActive =
                link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="px-4 py-3 text-white text-[13px] no-underline"
                  style={{
                    opacity: isActive ? 1 : 0.7,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
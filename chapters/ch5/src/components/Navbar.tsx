import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Menu, X } from 'lucide-react';

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/criteria-system', label: '5.1' },
  { path: '/utility-merging', label: '5.2' },
  { path: '/ahp', label: '5.3' },
  { path: '/dea', label: '5.4' },
  { path: '/fuzzy-eval', label: '5.5' },
  { path: '/anp', label: '5.6' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6"
      style={{ background: '#1B3A5F', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-white no-underline">
        <BookOpen size={20} />
        <span className="text-sm font-medium">决策理论与方法</span>
      </Link>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 no-underline"
            style={{
              color: isActive(link.path) ? '#ffffff' : 'rgba(255,255,255,0.7)',
            }}
          >
            {link.label}
            {isActive(link.path) && (
              <motion.div
                layoutId="navbar-indicator"
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                style={{ background: '#C8963E' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
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
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-14 left-0 right-0 md:hidden flex flex-col p-4 gap-1"
            style={{ background: '#1B3A5F', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 no-underline"
                style={{
                  color: isActive(link.path) ? '#ffffff' : '#9E9E9E',
                  background: isActive(link.path) ? '#2A4A73' : 'transparent',
                }}
              >
                {link.label === '首页' ? '首页' : `第${link.label}节`}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

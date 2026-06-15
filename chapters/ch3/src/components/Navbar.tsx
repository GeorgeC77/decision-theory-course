import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BookOpen, Menu, X } from 'lucide-react';

const navItems = [
  { label: '3.1 期望值准则', tab: 0 },
  { label: '3.2 决策树分析', tab: 1 },
  { label: '3.3 贝叶斯决策', tab: 2 },
  { label: '3.4 灵敏度分析', tab: 3 },
  { label: '3.5 效用理论', tab: 4 },
];

interface NavbarProps {
  activeTab?: number;
  onNavClick?: (tab: number) => void;
}

export default function Navbar({ activeTab = 0, onNavClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isModulePage = location.pathname === '/module';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (tab: number) => {
    if (isModulePage) {
      // Already on module page — just switch tabs
      onNavClick?.(tab);
    } else {
      // On chapter home — navigate to module page with tab
      navigate(`/module?tab=${tab}`);
    }
    setMobileOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav
      className={
        'fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#1B3A5F] transition-shadow duration-200 ' +
        (scrolled ? 'shadow-md' : '')
      }
    >
      {/* Left: Brand */}
      <button
        onClick={handleHomeClick}
        className="flex items-center gap-2 cursor-pointer"
      >
        <BookOpen className="w-5 h-5 text-white" />
        <span className="text-[13px] font-semibold text-white">决策理论与方法</span>
      </button>

      {/* Right: Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        {/* Home link */}
        <button
          onClick={handleHomeClick}
          className={
            'px-3 py-1.5 text-[13px] rounded-md transition-colors duration-150 cursor-pointer ' +
            (!isModulePage
              ? 'text-white font-medium'
              : 'text-white/70 hover:text-white')
          }
        >
          首页
          {!isModulePage && (
            <div className="h-0.5 bg-white rounded-full mt-0.5" />
          )}
        </button>

        {navItems.map((item) => {
          const isActive = isModulePage && item.tab === activeTab;
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.tab)}
              className={
                'px-3 py-1.5 text-[13px] rounded-md transition-colors duration-150 cursor-pointer ' +
                (isActive
                  ? 'text-white font-medium'
                  : 'text-white/70 hover:text-white')
              }
            >
              {item.label}
              {isActive && (
                <div className="h-0.5 bg-white rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden text-white p-1 cursor-pointer"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#1B3A5F] border-t border-white/10 shadow-lg md:hidden">
          {/* Home link */}
          <button
            onClick={handleHomeClick}
            className={
              'block w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ' +
              (!isModulePage
                ? 'text-white font-medium bg-white/10'
                : 'text-white/70 hover:text-white hover:bg-white/5')
            }
          >
            首页
          </button>
          {navItems.map((item) => {
            const isActive = isModulePage && item.tab === activeTab;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.tab)}
                className={
                  'block w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ' +
                  (isActive
                    ? 'text-white font-medium bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5')
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}

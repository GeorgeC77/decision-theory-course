import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  activeTab?: number;
  onNavClick?: (tab: number) => void;
}

export default function Layout({ children, activeTab, onNavClick }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2]">
      <Navbar activeTab={activeTab} onNavClick={onNavClick} />
      <main className="pt-14 flex-1">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

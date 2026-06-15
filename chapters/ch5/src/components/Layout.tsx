import type { ReactNode } from 'react';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: '#F8F6F2' }}>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1" style={{ paddingTop: '56px' }}>
        {/* Left Sidebar - only on pages with sidebar */}
        {showSidebar && <LeftSidebar />}

        {/* Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2]">
      <Navbar />
      <main className="pt-14 flex-1">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

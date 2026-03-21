import { Outlet } from 'react-router-dom'
import Navbar from './common/Navbar'
import Footer from './common/Footer'
import Chatbot from './common/Chatbot'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-foreground">
      <Navbar />
      
      <main className="flex-1 pb-10 w-full relative z-0">
        <Outlet />
      </main>

      <Footer />
      <Chatbot />
    </div>
  )
}

import { Routes, Route } from 'react-router'
import ChapterHome from './pages/ChapterHome'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChapterHome />} />
      <Route path="/module" element={<Home />} />
    </Routes>
  )
}

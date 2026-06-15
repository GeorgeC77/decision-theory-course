import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Concept from './pages/Concept'
import Optimistic from './pages/Optimistic'
import Pessimistic from './pages/Pessimistic'
import Compromise from './pages/Compromise'
import Regret from './pages/Regret'
import Laplace from './pages/Laplace'
import CaseStudy from './pages/CaseStudy'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/concept" element={<Concept />} />
        <Route path="/optimistic" element={<Optimistic />} />
        <Route path="/pessimistic" element={<Pessimistic />} />
        <Route path="/compromise" element={<Compromise />} />
        <Route path="/regret" element={<Regret />} />
        <Route path="/laplace" element={<Laplace />} />
        <Route path="/case-study" element={<CaseStudy />} />
      </Routes>
    </Layout>
  )
}
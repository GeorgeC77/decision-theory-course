import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import MultiStageDecision from './pages/MultiStageDecision'
import SequentialDecision from './pages/SequentialDecision'
import MarkovDecision from './pages/MarkovDecision'
import GroupDecision from './pages/GroupDecision'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/6-1" element={<MultiStageDecision />} />
        <Route path="/6-2" element={<SequentialDecision />} />
        <Route path="/6-3" element={<MarkovDecision />} />
        <Route path="/6-4" element={<GroupDecision />} />
      </Routes>
    </Layout>
  )
}

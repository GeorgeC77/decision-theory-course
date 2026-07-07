import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import ConceptAndElements from './pages/ConceptAndElements'
import ClassificationAndPrinciples from './pages/ClassificationAndPrinciples'
import StepsAndTracking from './pages/StepsAndTracking'
import MethodsOverview from './pages/MethodsOverview'
import CaseStudy from './pages/CaseStudy'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/1-1" element={<ConceptAndElements />} />
        <Route path="/1-2" element={<ClassificationAndPrinciples />} />
        <Route path="/1-3" element={<StepsAndTracking />} />
        <Route path="/1-4" element={<MethodsOverview />} />
        <Route path="/1-5" element={<CaseStudy />} />
      </Routes>
    </Layout>
  )
}

import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import CriteriaSystemPage from './pages/CriteriaSystem';
import UtilityMergingPage from './pages/UtilityMerging';
import AhpPage from './pages/Ahp';
import DeaPage from './pages/Dea';
import FuzzyEvalPage from './pages/FuzzyEval';
import AnpPage from './pages/Anp';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/criteria-system" element={<CriteriaSystemPage />} />
      <Route path="/utility-merging" element={<UtilityMergingPage />} />
      <Route path="/ahp" element={<AhpPage />} />
      <Route path="/dea" element={<DeaPage />} />
      <Route path="/fuzzy-eval" element={<FuzzyEvalPage />} />
      <Route path="/anp" element={<AnpPage />} />
    </Routes>
  );
}

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import ModuleTabs from '../components/ModuleTabs';
import ExpectedValueCriterion from '../modules/ExpectedValueCriterion';
import DecisionTreeAnalysis from '../modules/DecisionTreeAnalysis';
import BayesianDecision from '../modules/BayesianDecision';
import SensitivityAnalysis from '../modules/SensitivityAnalysis';
import UtilityTheory from '../modules/UtilityTheory';

const tabContentVariants = {
  enter: { opacity: 0, y: 10 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12, ease: 'easeIn' as const },
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read tab from URL query param on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (tabIndex >= 0 && tabIndex <= 4) {
        setActiveTab(tabIndex);
      }
    }
  }, [searchParams]);

  const renderModule = () => {
    switch (activeTab) {
      case 0:
        return <ExpectedValueCriterion />;
      case 1:
        return <DecisionTreeAnalysis />;
      case 2:
        return <BayesianDecision />;
      case 3:
        return <SensitivityAnalysis />;
      case 4:
        return <UtilityTheory />;
      default:
        return <ExpectedValueCriterion />;
    }
  };

  return (
    <Layout activeTab={activeTab} onNavClick={setActiveTab}>
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#1B3A5F] transition-colors duration-150 cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回章节首页
        </button>
      </motion.div>

      {/* Tab Navigation */}
      <ModuleTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Module Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {renderModule()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

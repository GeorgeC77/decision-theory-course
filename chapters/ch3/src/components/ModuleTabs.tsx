import { motion } from 'framer-motion';
import {
  TrendingUp,
  GitBranch,
  Brain,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';

const tabs = [
  { id: 0, label: '3.1 期望值准则', icon: TrendingUp },
  { id: 1, label: '3.2 决策树分析', icon: GitBranch },
  { id: 2, label: '3.3 贝叶斯决策', icon: Brain },
  { id: 3, label: '3.4 灵敏度分析', icon: SlidersHorizontal },
  { id: 4, label: '3.5 效用理论', icon: Scale },
];

interface ModuleTabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

export default function ModuleTabs({ activeTab, onTabChange }: ModuleTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-6 flex gap-2 overflow-x-auto pb-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ' +
              (isActive
                ? 'bg-[#1B3A5F] text-white border border-transparent shadow-sm'
                : 'bg-white text-[#6B6B6B] border border-[#E0DDD5] hover:bg-[#F0EDE8]')
            }
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </motion.div>
  );
}

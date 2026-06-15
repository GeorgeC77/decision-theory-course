import { motion } from 'framer-motion';
import {
  TrendingUp,
  GitBranch,
  Brain,
  SlidersHorizontal,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import Layout from '../components/Layout';

const modules = [
  {
    id: 0,
    number: '3.1',
    title: '期望值准则',
    icon: TrendingUp,
    description:
      '基于期望值选择最优决策方案，支持实时编辑收益矩阵并自动计算EVPI',
    tags: ['期望值', 'EVPI'],
  },
  {
    id: 1,
    number: '3.2',
    title: '决策树分析',
    icon: GitBranch,
    description: '可视化决策树与逆向归纳法，直观理解多阶段决策过程',
    tags: ['决策树', '逆向归纳'],
  },
  {
    id: 2,
    number: '3.3',
    title: '贝叶斯决策',
    icon: Brain,
    description: '贝叶斯定理更新先验概率，计算后验概率与信息价值EVSI',
    tags: ['贝叶斯', 'EVSI'],
  },
  {
    id: 3,
    number: '3.4',
    title: '灵敏度分析',
    icon: SlidersHorizontal,
    description: '分析概率变化对决策结果的影响，计算转折概率',
    tags: ['灵敏度', '转折概率'],
  },
  {
    id: 4,
    number: '3.5',
    title: '效用理论',
    icon: Scale,
    description: '基于效用曲线的风险偏好分析，期望效用决策',
    tags: ['效用曲线', '风险偏好'],
  },
];

const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.1 + i * 0.1, ease: 'easeOut' as const },
  }),
};

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.4 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export default function ChapterHome() {
  const navigate = useNavigate();

  const handleEnterModule = (tabIndex: number) => {
    navigate(`/module?tab=${tabIndex}`);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col">
        {/* Title Section */}
        <div className="text-center pt-12 pb-8">
          <motion.h1
            custom={0}
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            className="text-4xl font-extrabold text-[#1B3A5F]"
          >
            风险型决策分析
          </motion.h1>
          <motion.p
            custom={1}
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            className="text-base text-[#6B6B6B] mt-2"
          >
            决策理论与方法 · 第3章
          </motion.p>
          <motion.div
            custom={2}
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            className="w-16 h-1 bg-[#C8963E] mx-auto mt-4 rounded-full"
          />
        </div>

        {/* Cards Grid */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 pb-12"
        >
          {/* First row: 2 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {modules.slice(0, 2).map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onEnter={() => handleEnterModule(module.id)}
              />
            ))}
          </div>

          {/* Second row: 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.slice(2).map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onEnter={() => handleEnterModule(module.id)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

interface ModuleCardProps {
  module: (typeof modules)[number];
  onEnter: () => void;
}

function ModuleCard({ module, onEnter }: ModuleCardProps) {
  const Icon = module.icon;
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl border border-[#E0DDD5] p-6 shadow-sm flex flex-col"
    >
      {/* Header: badge + icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1B3A5F] flex items-center justify-center">
          <span className="text-white font-bold text-sm">{module.number}</span>
        </div>
        <Icon className="w-5 h-5 text-[#6B6B6B]" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-[#2B2B2B] mt-3">{module.title}</h3>

      {/* Description */}
      <p className="text-sm text-[#6B6B6B] mt-2 line-clamp-2 flex-1">
        {module.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3">
        {module.tags.map((tag) => (
          <span
            key={tag}
            className="bg-[#F0EDE8] text-[#6B6B6B] text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Enter button */}
      <button
        onClick={onEnter}
        className="mt-4 w-full bg-[#1B3A5F] text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1 hover:bg-[#2A4A73] transition-colors duration-150 cursor-pointer"
      >
        进入学习
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

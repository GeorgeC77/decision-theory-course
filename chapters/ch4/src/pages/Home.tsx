import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  Shield,
  SlidersHorizontal,
  RefreshCw,
  Scale,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ModuleCard {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tags: string[];
  link: string;
}

const modules: ModuleCard[] = [
  {
    number: '4.1',
    icon: BookOpen,
    title: '不确定型决策的基本概念',
    description: '决策者对未来自然状态发生概率完全未知的决策问题，与确定型和风险型决策的区别与联系',
    tags: ['不确定型', '决策分类', '概率未知'],
    link: '/concept',
  },
  {
    number: '4.2',
    icon: TrendingUp,
    title: '乐观决策准则',
    description: '决策者持乐观态度，选择各方案最大收益中的最大值，也称大中取大准则',
    tags: ['Maximax', '大中取大', '乐观'],
    link: '/optimistic',
  },
  {
    number: '4.3',
    icon: Shield,
    title: '悲观决策准则',
    description: '决策者持悲观态度，选择各方案最小收益中的最大值，也称小中取大或 Wald 准则',
    tags: ['Maximin', '小中取大', 'Wald'],
    link: '/pessimistic',
  },
  {
    number: '4.4',
    icon: SlidersHorizontal,
    title: '折中决策准则',
    description: '引入乐观系数 α(0≤α≤1)，计算折中收益值 CV = α×max + (1−α)×min，平衡乐观与悲观',
    tags: ['Hurwicz', '折中', '乐观系数'],
    link: '/compromise',
  },
  {
    number: '4.5',
    icon: RefreshCw,
    title: '后悔值决策准则',
    description: '构建后悔值矩阵，选择最大后悔值中最小的方案，也称最小最大后悔值或 Savage 准则',
    tags: ['Savage', '后悔值', '最小最大'],
    link: '/regret',
  },
  {
    number: '4.6',
    icon: Scale,
    title: '等概率决策准则',
    description: '假设各自然状态等概率发生，计算期望收益并选择最大者，也称拉普拉斯准则',
    tags: ['Laplace', '等概率', '期望收益'],
    link: '/laplace',
  },
  {
    number: '4.7',
    icon: Briefcase,
    title: '案例分析',
    description: '综合运用以上五种准则进行实际决策分析，对比不同准则的决策结果',
    tags: ['综合', '对比分析', '实践'],
    link: '/case-study',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const heroTitleVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 },
  },
};

const heroSubtitleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, delay: 0.3 },
  },
};

const heroLineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.4, delay: 0.5 },
  },
};

function ModuleCardComponent({ module }: { module: ModuleCard }) {
  const Icon = module.icon;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 32px rgba(27,58,95,0.08)',
        transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
      }}
      className="rounded-xl p-6 flex flex-col"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E0DDD5',
        boxShadow: '0 2px 8px rgba(27,58,95,0.04)',
      }}
    >
      {/* Top row: number circle + icon */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: '#1B3A5F' }}
        >
          {module.number}
        </div>
        <Icon size={20} color="#6B6B6B" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3
        className="text-lg font-semibold mt-4"
        style={{ color: '#1B3A5F', lineHeight: 1.4 }}
      >
        {module.title}
      </h3>

      {/* Description */}
      <p
        className="text-sm mt-2 flex-1"
        style={{ color: '#6B6B6B', lineHeight: 1.7, minHeight: '48px' }}
      >
        {module.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3">
        {module.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: '#F8F6F2',
              color: '#5d6d7e',
              borderRadius: '20px',
              fontSize: '12px',
              letterSpacing: '0.02em',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Button */}
      <Link
        to={module.link}
        className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white rounded-lg transition-all duration-200"
        style={{
          backgroundColor: '#1B3A5F',
          padding: '10px',
          fontSize: '14px',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = '#2A4A73';
          el.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = '#1B3A5F';
          el.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
      >
        进入学习
        <ArrowRight size={14} strokeWidth={2} />
      </Link>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-6">
        <motion.h1
          variants={heroTitleVariants}
          initial="hidden"
          animate="visible"
          className="font-serif"
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#1B3A5F',
            lineHeight: 1.3,
            letterSpacing: '0.02em',
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          不确定型决策分析
        </motion.h1>

        <motion.p
          variants={heroSubtitleVariants}
          initial="hidden"
          animate="visible"
          style={{
            fontSize: '14px',
            color: '#6B6B6B',
            marginTop: '8px',
          }}
        >
          决策理论与方法 · 第4章
        </motion.p>

        <motion.div
          variants={heroLineVariants}
          initial="hidden"
          animate="visible"
          style={{
            width: '48px',
            height: '3px',
            backgroundColor: '#C8963E',
            marginTop: '16px',
            transformOrigin: 'center',
          }}
        />
      </section>

      {/* Module Cards Grid */}
      <section>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {modules.map((m) => (
            <ModuleCardComponent key={m.number} module={m} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}

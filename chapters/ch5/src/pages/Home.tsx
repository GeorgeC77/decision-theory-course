import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitFork,
  Combine,
  Layers,
  BarChart3,
  ArrowRight,
  Sparkles,
  Network,
} from 'lucide-react';
import Layout from '@/components/Layout';

const cardData = [
  {
    badge: '5.1',
    icon: GitFork,
    title: '目标准则体系',
    description: '多目标决策的目标准则体系，包括单层次与多层次结构、效用函数标准化、风险因素处理',
    tags: ['多目标', '准则体系', '树形结构'],
    link: '/criteria-system',
  },
  {
    badge: '5.2',
    icon: Combine,
    title: '多维效用并合',
    description: '多准则效用并合方法，包括代换规则、加法规则、乘法规则和混合规则四种并合模型',
    tags: ['效用并合', '加权求和', '乘法模型'],
    link: '/utility-merging',
  },
  {
    badge: '5.3',
    icon: Layers,
    title: '层次分析(AHP)',
    description: '层次分析方法，构建递阶层次结构，通过判断矩阵进行一致性检验和层次排序',
    tags: ['AHP', '判断矩阵', '一致性检验'],
    link: '/ahp',
  },
  {
    badge: '5.4',
    icon: BarChart3,
    title: 'DEA思想简化演示',
    description: '演示DEA相对效率思想（投入产出比值法），了解DEA数据包络分析的基本概念',
    tags: ['DEA', '效率评价', '简化演示'],
    link: '/dea',
  },
  {
    badge: '5.5',
    icon: Sparkles,
    title: '模糊综合评价',
    description: '基于模糊数学的综合评价方法，通过因素集、评语集和模糊关系矩阵进行多因素模糊评判',
    tags: ['模糊数学', '隶属度', '综合评价'],
    link: '/fuzzy-eval',
  },
  {
    badge: '5.6',
    icon: Network,
    title: '网络分析法(ANP)',
    description: '扩展AHP的网络结构方法，考虑准则间相互依赖和反馈关系，通过超矩阵计算极限优先级',
    tags: ['ANP', '超矩阵', '网络结构'],
    link: '/anp',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* ====== HERO SECTION ====== */}
      <section
        className="w-full text-center mb-8"
        style={{
          padding: '64px 24px 56px',
        }}
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="text-[#1B3A5F] font-bold"
          style={{
            fontSize: '36px',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          多目标决策分析
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
          style={{
            color: '#6B6B6B',
            fontSize: '16px',
            fontWeight: 400,
            marginTop: '12px',
          }}
        >
          决策理论与方法 · 第5章（完整版）
        </motion.p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.4 }}
          style={{
            width: '40px',
            height: '3px',
            background: '#C8963E',
            borderRadius: '2px',
            margin: '20px auto 0',
            transformOrigin: 'center',
          }}
        />
      </section>

      {/* ====== SECTION CARDS GRID ====== */}
      <section className="w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {cardData.map((card) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.badge}
                variants={cardVariants}
                className="card-hover flex flex-col gap-4 p-6 bg-white rounded-xl cursor-pointer"
                style={{
                  border: '1px solid #E0DDD5',
                  gap: '16px',
                }}
                onClick={() => navigate(card.link)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(card.link);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[13px] font-semibold"
                    style={{
                      background: '#1B3A5F',
                      color: 'white',
                    }}
                  >
                    {card.badge}
                  </span>
                  <IconComponent size={20} style={{ color: '#9E9E9E' }} />
                </div>

                {/* Title */}
                <h2
                  className="text-xl font-semibold"
                  style={{ color: '#2A4A73', lineHeight: 1.3 }}
                >
                  {card.title}
                </h2>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#6B6B6B', lineHeight: 1.6 }}
                >
                  {card.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        background: '#f1f5f9',
                        color: '#6B6B6B',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Button */}
                <div className="mt-auto pt-2">
                  <button
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors duration-150 cursor-pointer"
                    style={{ background: '#2A4A73' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1B3A5F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#2A4A73';
                    }}
                  >
                    进入学习
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </Layout>
  );
}

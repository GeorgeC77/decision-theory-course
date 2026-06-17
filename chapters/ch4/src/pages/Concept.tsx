import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  Percent,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Tab data                                                            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const scrollReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

/* ------------------------------------------------------------------ */
/*  Comparison card data                                               */
/* ------------------------------------------------------------------ */
const decisionTypes = [
  {
    icon: CheckCircle,
    iconBg: '#e8f5e9',
    iconColor: '#4CAF50',
    title: '确定型决策',
    desc: '未来状态完全确定，每种方案只对应一个确定结果',
    features: [
      '自然状态唯一且已知',
      '每种方案只有一个结果',
      '直接比较即可决策',
    ],
    example: '从A地到B地选择最短路线',
    highlight: false,
  },
  {
    icon: Percent,
    iconBg: '#fff3e0',
    iconColor: '#e67e22',
    title: '风险型决策',
    desc: '未来状态的概率分布已知，可用期望值等准则决策',
    features: [
      '各状态概率已知',
      '可计算期望收益',
      '存在不确定性但可量化',
    ],
    example: '已知降雨概率时决定是否带伞',
    highlight: false,
  },
  {
    icon: HelpCircle,
    iconBg: '#e3f2fd',
    iconColor: '#1B3A5F',
    title: '不确定型决策',
    desc: '未来状态发生概率完全未知，决策者仅凭主观准则选择',
    features: [
      '各状态概率未知',
      '无法计算期望值',
      '依赖决策者主观态度',
    ],
    example: '新产品投放全新市场的策略选择',
    highlight: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Core characteristics data                                          */
/* ------------------------------------------------------------------ */
const characteristics = [
  {
    num: 1,
    title: '状态概率未知',
    desc: '决策者无法获知各自然状态发生的概率，这是不确定型决策区别于风险型决策的关键',
  },
  {
    num: 2,
    title: '无历史数据',
    desc: '往往缺乏足够的历史统计数据来估计状态概率，常见于全新环境下的决策',
  },
  {
    num: 3,
    title: '依赖决策者主观判断',
    desc: '需要依赖决策者的个人态度和主观判断准则来选择方案，不同的决策者可能选择不同方案',
  },
  {
    num: 4,
    title: '多种决策准则',
    desc: '乐观、悲观、折中、后悔值、等概率等不同准则可能给出不同的最优方案',
  },
];

/* ------------------------------------------------------------------ */
/*  Matrix sample data                                                 */
/* ------------------------------------------------------------------ */
const matrixData = {
  alts: ['A₁(积极)', 'A₂(稳健)', 'A₃(保守)'],
  states: ['S₁(好)', 'S₂(中)', 'S₃(差)'],
  values: [
    [500, 150, -50],
    [300, 200, 100],
    [200, 200, 150],
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Concept() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div style={{ backgroundColor: '#F8F6F2' }}>
      {/* ==================== TAB NAVIGATION ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      </motion.div>

      {/* ==================== PAGE TITLE ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} style={{ color: '#C8963E' }} />
          <h1
            className="text-2xl font-semibold"
            style={{ color: '#1B3A5F', letterSpacing: '0.02em', fontFamily: "'Noto Serif SC', serif" }}
          >
            不确定型决策的基本概念
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#6B6B6B' }}>
          Decision Making Under Uncertainty
        </p>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: '#5d6d7e' }}>
          决策者对未来自然状态发生概率完全未知的决策问题。与确定型决策和风险型决策并列，构成决策理论的三大类型。
        </p>
      </motion.div>

      {/* ==================== THREE DECISION TYPES ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {decisionTypes.map((type, idx) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.title}
                variants={itemVariants}
                className="flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-300"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: type.highlight ? '#1B3A5F' : '#E0DDD5',
                  borderWidth: type.highlight ? '1.5px' : '1px',
                  transform: hoveredCard === idx ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: hoveredCard === idx ? '0 8px 24px rgba(27,58,95,0.1)' : 'none',
                }}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: type.iconBg }}
                >
                  <Icon size={24} style={{ color: type.iconColor }} />
                </div>

                {/* Title */}
                <h3
                  className="text-base font-semibold mt-3"
                  style={{ color: '#1B3A5F' }}
                >
                  {type.title}
                </h3>

                {/* Description */}
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: '#6B6B6B' }}>
                  {type.desc}
                </p>

                {/* Features */}
                <div className="flex flex-col gap-1.5 mt-3 w-full text-left">
                  {type.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[13px]" style={{ color: '#5d6d7e' }}>
                      <span style={{ color: type.iconColor, fontSize: '12px' }}>●</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Example */}
                <div
                  className="mt-3 text-[12px] px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#f8f6f3', color: '#6B6B6B' }}
                >
                  例：{type.example}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ==================== KEY CHARACTERISTICS ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #E0DDD5' }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              不确定型决策的核心特征
            </h2>
          </div>

          {/* Characteristics list */}
          <div className="flex flex-col gap-4">
            {characteristics.map((c) => (
              <div key={c.num} className="flex gap-3 items-start">
                {/* Number circle */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: '#1B3A5F' }}
                >
                  {c.num}
                </div>
                {/* Content */}
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: '#1B3A5F' }}>
                    {c.title}
                  </h4>
                  <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: '#6B6B6B' }}>
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ==================== DECISION MATRIX EXAMPLE ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #E0DDD5' }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              收益矩阵示例
            </h2>
            <span
              className="text-[12px] px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#F8F6F2', color: '#6B6B6B' }}
            >
              不可编辑
            </span>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            以下是一个典型的不确定型决策收益矩阵，三种策略面对三种经济状态
          </p>

          {/* Matrix table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F' }}>
                  <th className="text-left text-white px-4 py-3 font-medium rounded-tl-lg">
                    方案 \ 状态
                  </th>
                  {matrixData.states.map((s) => (
                    <th key={s} className="text-center text-white px-4 py-3 font-medium">
                      {s}
                    </th>
                  ))}
                  <th className="text-center text-white px-4 py-3 font-medium rounded-tr-lg">
                    说明
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixData.values.map((row, i) => (
                  <tr
                    key={i}
                    style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8f6f3' }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: '#1B3A5F' }}>
                      {matrixData.alts[i]}
                    </td>
                    {row.map((val, j) => (
                      <td
                        key={j}
                        className="text-center px-4 py-3"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: '#1B3A5F' }}
                      >
                        {val}
                      </td>
                    ))}
                    <td
                      className="text-center px-4 py-3 text-[12px]"
                      style={{ color: '#6B6B6B' }}
                    >
                      {i === 0 ? '收益值 a₁ⱼ' : i === 1 ? '收益值 a₂ⱼ' : '收益值 a₃ⱼ'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notation explanation */}
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#f8f6f3' }}>
            <p className="text-[13px] leading-relaxed" style={{ color: '#5d6d7e' }}>
              <span className="font-semibold" style={{ color: '#1B3A5F' }}>符号说明：</span>
              元素 <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>aᵢⱼ</span> 表示方案 Aᵢ 在自然状态 Sⱼ 下的收益值。
              矩阵中不包含任何概率信息，这是不确定型决策与风险型决策的本质区别。
            </p>
          </div>
        </div>
      </motion.div>

      {/* ==================== KNOWLEDGE CARD ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-12"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#faf3e0', border: '1px solid #f0e6cc' }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} style={{ color: '#1B3A5F' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              知识点：不确定型决策
            </h3>
          </div>

          {/* Content */}
          <div className="text-sm leading-relaxed" style={{ color: '#5d6d7e' }}>
            <p className="font-semibold mb-2" style={{ color: '#1B3A5F' }}>
              不确定型决策的四大要素：
            </p>
            <ol className="flex flex-col gap-1.5 ml-1 mb-3">
              <li>
                <span className="font-medium" style={{ color: '#1B3A5F' }}>1. 决策者：</span>
                需要做出决策的主体
              </li>
              <li>
                <span className="font-medium" style={{ color: '#1B3A5F' }}>2. 备选方案集 A = {'{A₁, A₂, ..., Aₘ}'}：</span>
                可供选择的行动方案
              </li>
              <li>
                <span className="font-medium" style={{ color: '#1B3A5F' }}>3. 自然状态集 Θ = {'{θ₁, θ₂, ..., θₙ}'}：</span>
                未来可能出现的各种状态（概率未知）
              </li>
              <li>
                <span className="font-medium" style={{ color: '#1B3A5F' }}>4. 收益矩阵 D = (dᵢⱼ)ₘₓₙ：</span>
                方案 Aᵢ 在状态 θⱼ 下的收益值
              </li>
            </ol>
            <div
              className="p-3 rounded-lg text-[13px] leading-relaxed"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            >
              <Lightbulb size={14} className="inline mr-1" style={{ color: '#C8963E' }} />
              不确定型决策的目标是：根据决策准则从备选方案集中选择一个"最优"方案。
              不同的决策准则反映了决策者不同的风险态度。
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

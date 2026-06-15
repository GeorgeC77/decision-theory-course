import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitFork,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { BlockMath } from 'react-katex';
import KnowledgeCard from '@/components/KnowledgeCard';
import type { KnowledgeSection } from '@/components/KnowledgeCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StructureType = 'single' | 'sequential' | 'non-sequential';

interface CriterionType {
  key: string;
  label: string;
  type: 'benefit' | 'cost';
}

interface TableRow {
  name: string;
  returnRate: number;
  npv: number;
  carbon: number;
  employment: number;
}

/* ------------------------------------------------------------------ */
/*  Default data                                                       */
/* ------------------------------------------------------------------ */

const defaultTableData: TableRow[] = [
  { name: '方案A₁', returnRate: 15, npv: 500, carbon: 200, employment: 100 },
  { name: '方案A₂', returnRate: 10, npv: 300, carbon: 100, employment: 150 },
  { name: '方案A₃', returnRate: 8, npv: 200, carbon: 50, employment: 80 },
];

const defaultCriteria: CriterionType[] = [
  { key: 'returnRate', label: '投资回报率(%)', type: 'benefit' },
  { key: 'npv', label: '净现值(万元)', type: 'benefit' },
  { key: 'carbon', label: '碳排放量(吨)', type: 'cost' },
  { key: 'employment', label: '就业人数(人)', type: 'benefit' },
];

/* ------------------------------------------------------------------ */
/*  Normalization helpers                                              */
/* ------------------------------------------------------------------ */

function normalizeValue(
  value: number,
  values: number[],
  type: 'benefit' | 'cost'
): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0.5;
  const normalized = (value - min) / (max - min);
  return type === 'benefit' ? normalized : 1 - normalized;
}

function computeUtility(row: TableRow, criteria: CriterionType[]): number {
  const allValues = defaultTableData.map((r) => [
    r.returnRate,
    r.npv,
    r.carbon,
    r.employment,
  ]);
  let sum = 0;
  const weight = 1 / criteria.length;
  criteria.forEach((c, idx) => {
    const values = allValues.map((v) => v[idx]);
    const val = [row.returnRate, row.npv, row.carbon, row.employment][idx];
    sum += weight * normalizeValue(val, values, c.type);
  });
  return sum;
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function CriteriaSystemPage() {
  /* -- structure type state -- */
  const [structureType, setStructureType] = useState<StructureType>('sequential');

  /* -- table state -- */
  const [tableData, setTableData] = useState<TableRow[]>(defaultTableData);
  const [criteria, setCriteria] = useState<CriterionType[]>(defaultCriteria);
  const [showCalcSteps, setShowCalcSteps] = useState(false);
  const [flashCell, setFlashCell] = useState<{ row: number; col: number } | null>(null);

  /* -- reset all -- */
  const handleReset = useCallback(() => {
    setStructureType('sequential');
    setTableData(defaultTableData);
    setCriteria(defaultCriteria);
  }, []);

  /* -- table actions -- */
  const handleTableChange = useCallback(
    (rowIndex: number, field: keyof TableRow, value: string) => {
      const num = parseFloat(value);
      if (Number.isNaN(num)) return;
      setTableData((prev) => {
        const next = prev.map((r, i) => (i === rowIndex ? { ...r, [field]: num } : r));
        return next;
      });
      const colIdx = ['returnRate', 'npv', 'carbon', 'employment'].indexOf(field);
      if (colIdx >= 0) setFlashCell({ row: rowIndex, col: colIdx });
      setTimeout(() => setFlashCell(null), 300);
    },
    []
  );

  const handleToggleCriterionType = useCallback((key: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.key === key ? { ...c, type: c.type === 'benefit' ? 'cost' : 'benefit' } : c))
    );
  }, []);

  const handleResetTable = useCallback(() => {
    setTableData(defaultTableData);
    setCriteria(defaultCriteria);
  }, []);

  /* -- computed utilities -- */
  const utilities = tableData.map((row) => computeUtility(row, criteria));
  const maxUtility = Math.max(...utilities);
  const bestIndex = utilities.indexOf(maxUtility);

  /* -- knowledge card data -- */
  const knowledgeSections: KnowledgeSection[] = [
    {
      subtitle: '适用条件',
      content: [
        '适用于决策问题涉及多个评价准则，且各准则之间存在层次关系或逻辑关联的复杂决策场景。',
      ],
    },
    {
      subtitle: '结构类型',
      content: [
        '单层次：所有准则并列在同一层级，无层次关系',
        '序列型多层次：准则按层次逐级分解，每层准则属于且仅属于一个上层准则',
        '非序列型多层次：准则之间存在交叉关联，一个下层准则可能属于多个上层准则',
      ],
    },
    {
      subtitle: '效用标准化公式',
      content: [
        '效益型准则: u = (x - x_min) / (x_max - x_min)，值越大效用越高',
        '成本型准则: u = (x_max - x) / (x_max - x_min)，值越小效用越高',
      ],
    },
    {
      subtitle: '特点',
      content: [
        '将复杂的多目标问题分解为层次化的准则体系',
        '通过标准化消除量纲差异，实现统一比较',
        '可根据实际问题灵活调整准则层次和权重',
        '树形结构直观展示目标与准则之间的逻辑关系',
      ],
    },
    {
      subtitle: '注意事项',
      content: [
        '准则体系的构建需要决策者和专家的共同参与',
        '准则之间应满足独立性和完备性原则',
        '标准化方法的选择会影响最终的决策结果',
        '权重设置对综合效用计算至关重要',
      ],
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
        {/* ========== Breadcrumb ========== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Breadcrumb
            items={[
              { label: '首页', path: '/' },
              { label: '5.1 目标准则体系' },
            ]}
          />
        </motion.div>

        {/* ========== Section Header ========== */}
        <motion.div
          className="mt-6 mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-semibold text-white"
                style={{ background: '#1B3A5F' }}
              >
                <GitFork size={16} className="mr-1" />
                5.1
              </span>
            </div>
            <h1
              className="text-[28px] font-bold mt-3"
              style={{ color: '#2A4A73', letterSpacing: '-0.02em', lineHeight: 1.2 }}
            >
              目标准则体系
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#6B6B6B' }}>
              Criteria System — 多目标决策的目标准则体系构建与效用标准化
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['多目标决策', '准则体系', '树形结构', '效用标准化'].map((tag) => (
                <motion.span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: '#f1f5f9', color: '#6B6B6B' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + Math.random() * 0.1, duration: 0.3 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer self-start"
            style={{ border: '1px solid #E0DDD5', color: '#6B6B6B' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <RotateCcw size={14} />
            重置全部
          </button>
        </motion.div>

        {/* ========== Section 2: Theory — 目标准则体系的意义 ========== */}
        <motion.div
          className="bg-white rounded-xl p-6 mb-6 card-hover"
          style={{ border: '1px solid #E0DDD5' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              目标准则体系的意义
            </h2>
          </div>
          <div className="flex flex-col gap-4 text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>
            <p>
              在实际决策问题中，决策者往往面临多个相互联系、相互制约甚至相互冲突的目标。例如，企业投资决策需要同时考虑收益最大化、风险最小化、环境保护和社会效益等多个目标。多目标决策分析就是研究如何在多个目标之间进行权衡和协调，从而找到令决策者满意的方案。
            </p>
            <p>
              目标准则体系是多目标决策分析的基础，它将复杂的决策目标分解为若干个层次清晰、相互关联的准则，形成完整的评价框架。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {[
                { title: '目标间联系', desc: '不同目标之间可能存在正向关联（如技术进步与效率提升）', color: '#4CAF50' },
                { title: '目标间制约', desc: '某些目标的实现可能限制其他目标（如成本控制与质量提升）', color: '#f59e0b' },
                { title: '目标间冲突', desc: '多个目标无法同时达到最优（如短期收益与长期发展）', color: '#ef4444' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg p-4"
                  style={{ background: '#F8F6F2', border: '1px solid #E0DDD5' }}
                >
                  <h4 className="text-sm font-semibold mb-1.5" style={{ color: item.color }}>
                    {item.title}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: '#6B6B6B' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ========== Section 3: Structure Type Visualizations ========== */}
        <motion.div
          className="bg-white rounded-xl p-6 mb-6 card-hover"
          style={{ border: '1px solid #E0DDD5' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              准则体系结构类型
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>
            选择不同的结构类型查看对应的层次结构示意、特点说明及AHP/ANP方法适用性
          </p>

          {/* Structure type pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['single', 'sequential', 'non-sequential'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setStructureType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  structureType === type
                    ? 'text-white shadow-sm'
                    : 'bg-white border border-slate-200 hover:border-blue-300'
                }`}
                style={
                  structureType === type
                    ? { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }
                    : { color: '#6B6B6B' }
                }
              >
                {type === 'single' && '单层次结构'}
                {type === 'sequential' && '序列型多层次'}
                {type === 'non-sequential' && '非序列型多层次'}
              </button>
            ))}
          </div>

          {/* Description card */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
            <p className="text-sm" style={{ color: '#1e40af' }}>
              {structureType === 'single' && '所有准则直接关联总目标，无中间层次。适用于目标简单、准则数量较少的决策问题。'}
              {structureType === 'sequential' && '准则按层次逐级分解，形成清晰的树形结构。每个子准则只属于一个父准则，层次关系明确。'}
              {structureType === 'non-sequential' && '准则间存在交叉关联，某些子准则可能属于多个父准则（如"技术创新度"既属技术效益也影响经济效益）。需用网络结构表示。'}
            </p>
          </div>

          {/* Structure image */}
          <motion.div
            key={structureType}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl overflow-hidden border border-slate-200 bg-white"
          >
            <img
              src={
                structureType === 'single'
                  ? '/tree-single-level.jpg'
                  : structureType === 'sequential'
                  ? '/tree-sequential.jpg'
                  : '/tree-non-sequential.jpg'
              }
              alt={
                structureType === 'single'
                  ? '单层次结构'
                  : structureType === 'sequential'
                  ? '序列型多层次结构'
                  : '非序列型多层次结构'
              }
              className="w-full h-auto"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
          </motion.div>

          {/* Key features list */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {structureType === 'single' && (
              <>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>结构特点</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>总目标 → 若干准则，一层分解</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>适用场景</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>决策问题简单，准则数量 ≤ 7</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>AHP适用性</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>可直接构建判断矩阵</div>
                </div>
              </>
            )}
            {structureType === 'sequential' && (
              <>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>结构特点</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>多层递阶，每层准则逐级细分</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>适用场景</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>复杂决策，准则需分层细化</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>AHP适用性</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>经典AHP递阶层次结构</div>
                </div>
              </>
            )}
            {structureType === 'non-sequential' && (
              <>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>结构特点</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>准则间交叉关联，非纯树形</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>适用场景</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>准则相互依赖、反馈关系</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1B3A5F' }}>ANP适用性</div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>需用网络分析法(ANP)</div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ========== Section 4: Utility Normalization ========== */}
        <motion.div
          className="bg-white rounded-xl p-6 mb-6 card-hover"
          style={{ border: '1px solid #E0DDD5' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.35 }}
        >
          {/* Title */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} style={{ color: '#3b82f6' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                评价准则与效用标准化
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: '#E8F5E9', color: '#4CAF50' }}
              >
                可编辑
              </span>
            </div>
            <button
              onClick={handleResetTable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
              style={{ background: '#f1f5f9', color: '#6B6B6B' }}
            >
              <RotateCcw size={13} />
              重置数据
            </button>
          </div>

          {/* Theory content */}
          <div className="mb-4 text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>
            <p className="mb-3">
              在多目标决策中，各评价准则往往具有不同的度量单位（如万元、吨、百分比等），需要将它们转化为无量纲的效用值，才能在统一的标度上进行比较和并合。
            </p>
            <p className="text-xs font-medium mb-2" style={{ color: '#2A4A73' }}>
              常用标准化方法：
            </p>
          </div>

          {/* Formula blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="formula-block">
              <BlockMath math="u = \frac{x - x_{\min}}{x_{\max} - x_{\min}}" />
              <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>效益型：越大越好</p>
            </div>
            <div className="formula-block">
              <BlockMath math="u = \frac{x_{\max} - x}{x_{\max} - x_{\min}}" />
              <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>成本型：越小越好</p>
            </div>
          </div>

          {/* Interactive Normalization Table */}
          <div className="mb-4">
            <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
              点击准则类型图标可切换 效益型/成本型。修改数值将自动重新计算标准化效用。
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ border: '1px solid #E0DDD5', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Header */}
                <thead>
                  <tr style={{ background: '#2A4A73' }}>
                    <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">方案</th>
                    {criteria.map((c) => (
                      <th
                        key={c.key}
                        className="px-4 py-3 text-center text-white font-medium whitespace-nowrap"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {c.label}
                          <button
                            onClick={() => handleToggleCriterionType(c.key)}
                            className="inline-flex items-center justify-center p-0.5 rounded cursor-pointer transition-colors"
                            style={{ background: 'rgba(255,255,255,0.15)' }}
                            title={c.type === 'benefit' ? '效益型（点击切换）' : '成本型（点击切换）'}
                          >
                            {c.type === 'benefit' ? (
                              <TrendingUp size={13} style={{ color: '#86efac' }} />
                            ) : (
                              <TrendingDown size={13} style={{ color: '#fca5a5' }} />
                            )}
                          </button>
                        </div>
                        <span
                          className="block text-[10px] font-normal mt-0.5"
                          style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                          {c.type === 'benefit' ? '效益型 ↑' : '成本型 ↓'}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">
                      综合效用U
                      <span className="block text-[10px] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        等权重0.25
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">结果</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {tableData.map((row, rowIndex) => {
                    const utility = utilities[rowIndex];
                    const isBest = rowIndex === bestIndex;
                    const rowValues = [row.returnRate, row.npv, row.carbon, row.employment];


                    return (
                      <motion.tr
                        key={rowIndex}
                        style={{
                          background: rowIndex % 2 === 0 ? '#ffffff' : '#F8F6F2',
                          borderLeft: isBest ? '3px solid #4CAF50' : '3px solid transparent',
                        }}
                        animate={
                          flashCell?.row === rowIndex
                            ? { opacity: [1, 0.6, 1] }
                            : {}
                        }
                        transition={{ duration: 0.3 }}
                      >
                        {/* Name */}
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap" style={{ color: '#2A4A73' }}>
                          {row.name}
                        </td>

                        {/* Editable criteria values */}
                        {criteria.map((c, colIdx) => (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            <input
                              type="number"
                              value={rowValues[colIdx]}
                              onChange={(e) =>
                                handleTableChange(rowIndex, c.key as keyof TableRow, e.target.value)
                              }
                              className="w-20 px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
                              style={{
                                border: '1px solid #E0DDD5',
                                background: '#ffffff',
                                color: '#2A4A73',
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#60a5fa';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.15)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#E0DDD5';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </td>
                        ))}

                        {/* Utility */}
                        <td
                          className="px-4 py-2.5 text-center whitespace-nowrap font-semibold"
                          style={{ color: isBest ? '#4CAF50' : '#2A4A73', background: isBest ? '#E8F5E9' : 'transparent' }}
                        >
                          {utility.toFixed(3)}
                        </td>

                        {/* Result */}
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          {isBest ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: '#E8F5E9', color: '#4CAF50' }}
                            >
                              最优
                            </span>
                          ) : (
                            <span style={{ color: '#9E9E9E' }}>—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculation Steps Toggle */}
            <div className="mt-4">
              <button
                onClick={() => setShowCalcSteps(!showCalcSteps)}
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 cursor-pointer"
                style={{ color: '#3b82f6' }}
              >
                <AlertTriangle size={15} />
                {showCalcSteps ? '隐藏' : '查看'}标准化计算过程
              </button>

              <AnimatePresence>
                {showCalcSteps && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mt-3 p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto"
                      style={{ background: '#F8F6F2', border: '1px solid #E0DDD5' }}
                    >
                      {/* Step 1 */}
                      <div className="mb-3">
                        <span className="font-semibold" style={{ color: '#2A4A73' }}>
                          Step 1: 找出各准则的最大值和最小值
                        </span>
                        <div className="mt-1.5" style={{ color: '#6B6B6B' }}>
                          {criteria.map((c) => {
                            const values = tableData.map((r) => r[c.key as keyof TableRow] as number);
                            return (
                              <div key={c.key}>
                                {c.label}: max={Math.max(...values)}, min={Math.min(...values)} ({c.type === 'benefit' ? '效益型' : '成本型'})
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="mb-3">
                        <span className="font-semibold" style={{ color: '#2A4A73' }}>
                          Step 2: 计算各方案的标准化效用值
                        </span>
                        {tableData.map((row, ri) => (
                          <div key={ri} className="mt-2" style={{ color: '#6B6B6B' }}>
                            <span className="font-medium" style={{ color: '#1B3A5F' }}>
                              {row.name}:
                            </span>
                            <div className="ml-3">
                              {criteria.map((c) => {
                                const values = tableData.map((r) => r[c.key as keyof TableRow] as number);
                                const val = row[c.key as keyof TableRow] as number;
                                const norm = normalizeValue(val, values, c.type);
                                return (
                                  <div key={c.key}>
                                    u({c.label}) = {norm.toFixed(3)} {c.type === 'cost' ? '[成本型反转]' : ''}
                                  </div>
                                );
                              })}
                              <div className="font-medium" style={{ color: '#3b82f6' }}>
                                U{ri + 1} = {utilities[ri].toFixed(3)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Step 3 */}
                      <div>
                        <span className="font-semibold" style={{ color: '#2A4A73' }}>
                          Step 3: 最优方案
                        </span>
                        <div className="mt-1.5" style={{ color: '#4CAF50' }}>
                          → 最优方案: {tableData[bestIndex]?.name} (综合效用最高: {maxUtility.toFixed(3)})
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ========== Section 5: Risk Factor Card ========== */}
        <motion.div
          className="bg-white rounded-xl p-6 mb-6 card-hover"
          style={{ border: '1px solid #E0DDD5' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              风险因素处理
            </h2>
          </div>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: '#6B6B6B' }}>
            当决策问题中存在风险因素时，目标准则体系需要考虑各准则的确定性程度。通常有两种处理方式：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: '期望效用法',
                content:
                  '将各准则的期望值作为评价标准，适用于风险可量化的场景。计算各方案在各自然状态下的期望效用值，然后按确定性准则处理。',
              },
              {
                title: '安全标准法',
                content:
                  '设定各准则的最低可接受标准（安全阈值），排除不满足最低标准的方案，缩小可行方案集。',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="rounded-lg p-4"
                style={{ background: '#F8F6F2', border: '1px solid #E0DDD5' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
              >
                <h4 className="text-base font-semibold mb-2" style={{ color: '#2A4A73' }}>
                  方式{i + 1}：{item.title}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>
                  {item.content}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ========== Section 6: Knowledge Card ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <KnowledgeCard
            title="目标准则体系"
            sections={knowledgeSections}
            tags={['多目标决策', '准则体系', '效用标准化', '层次结构', '风险处理']}
          />
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </Layout>
  );
}

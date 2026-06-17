import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  Boxes,
  TrendingUp,
  Calculator,
  RotateCcw,
  Minus,
  Plus,
  Medal,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import CalculationSteps from '@/components/CalculationSteps';
import KnowledgeCard from '@/components/KnowledgeCard';
import { SafeBlockMath as BlockMath } from '@/components/SafeKatex';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/* ================================================================
   Types
   ================================================================ */
interface DMUData {
  name: string;
  inputs: number[];
  outputs: number[];
}

interface EfficiencyResult {
  dmuIndex: number;
  name: string;
  theta: number;
  rank: number;
  effective: boolean;
  inputScores: number[];
  outputScores: number[];
  inputRedundancy: number[];
}

/* ================================================================
   Default Data
   ================================================================ */
const DEFAULT_DMU_NAMES = ['DMU₁', 'DMU₂', 'DMU₃', 'DMU₄', 'DMU₅'];
const DEFAULT_INPUT_LABELS = ['资金投入X₁(万元)', '人力投入X₂(人)'];
const DEFAULT_OUTPUT_LABELS = ['产值Y₁(万元)', '利润Y₂(万元)'];

const DEFAULT_INPUTS: number[][] = [
  [100, 50],
  [150, 40],
  [80, 60],
  [200, 30],
  [120, 45],
];

const DEFAULT_OUTPUTS: number[][] = [
  [200, 30],
  [250, 35],
  [180, 25],
  [300, 40],
  [220, 32],
];

/* ================================================================
   Animation Variants
   ================================================================ */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

/* ================================================================
   Efficiency Calculation — Simplified Proxy (NOT rigorous DEA)
   Uses output-to-input productivity ratio normalized by best performer.
   Rigorous DEA requires linear programming (CCR model).
   ================================================================ */
function calculateEfficiency(
  dmus: DMUData[],
  _inputLabels: string[],
  _outputLabels: string[]
): EfficiencyResult[] {
  if (dmus.length === 0) return [];

  // Compute raw efficiency = output sum / input sum (productivity ratio)
  const rawEfficiencies = dmus.map((d) => {
    const outSum = d.outputs.reduce((a, b) => a + b, 0);
    const inSum = d.inputs.reduce((a, b) => a + b, 0);
    // Productivity ratio: output sum / input sum
    return outSum / inSum;
  });

  const maxRaw = Math.max(...rawEfficiencies);

  // Step 6: Normalize to [0, 1] by dividing by max
  const thetas = rawEfficiencies.map((r) => {
    const theta = r / maxRaw;
    return Math.min(theta, 1);
  });

  // Step 7: Build results with ranking and reference DMUs
  const indexed = thetas
    .map((theta, idx) => ({ theta, idx }))
    .sort((a, b) => b.theta - a.theta);

  const rankMap = new Map<number, number>();
  indexed.forEach((item, rank) => {
    rankMap.set(item.idx, rank + 1);
  });

  return dmus.map((dmu, idx) => {
    const theta = thetas[idx];
    const effective = theta >= 0.98;
    const rank = rankMap.get(idx) ?? 0;

    // Illustrative input improvement room for non-effective DMUs
    const inputRedundancy = dmu.inputs.map((inp) =>
      effective ? 0 : Math.round((1 - theta) * inp * 10) / 10
    );

    return {
      dmuIndex: idx,
      name: dmu.name,
      theta: Math.round(theta * 1000) / 1000,
      rank,
      effective,
      inputScores: dmu.inputs,
      outputScores: dmu.outputs,
      inputRedundancy,
    };
  });
}

/* ================================================================
   Section Pills (inline, since it's specific to this page context)
   ================================================================ */

/* ================================================================
   Main Component
   ================================================================ */
export default function DeaPage() {
  const [dmuCount, setDmuCount] = useState(5);
  const [inputCount, setInputCount] = useState(2);
  const [outputCount, setOutputCount] = useState(2);
  const [dmuNames, setDmuNames] = useState<string[]>(DEFAULT_DMU_NAMES);
  const [inputLabels, setInputLabels] = useState<string[]>(DEFAULT_INPUT_LABELS);
  const [outputLabels, setOutputLabels] = useState<string[]>(DEFAULT_OUTPUT_LABELS);
  const [inputs, setInputs] = useState<number[][]>(DEFAULT_INPUTS.map((r) => [...r]));
  const [outputs, setOutputs] = useState<number[][]>(DEFAULT_OUTPUTS.map((r) => [...r]));
  const [selectedDMU, setSelectedDMU] = useState(0);

  // Build DMU data array
  const dmuData: DMUData[] = useMemo(() => {
    return dmuNames.slice(0, dmuCount).map((name, i) => ({
      name,
      inputs: inputs[i]?.slice(0, inputCount) ?? new Array(inputCount).fill(0),
      outputs: outputs[i]?.slice(0, outputCount) ?? new Array(outputCount).fill(0),
    }));
  }, [dmuNames, dmuCount, inputs, inputCount, outputs, outputCount]);

  // Calculate efficiency results
  const results = useMemo(
    () => calculateEfficiency(dmuData, inputLabels.slice(0, inputCount), outputLabels.slice(0, outputCount)),
    [dmuData, inputLabels, inputCount, outputLabels, outputCount]
  );

  // Chart data
  const chartData = useMemo(
    () =>
      results.map((r) => ({
        name: r.name,
        theta: r.theta,
        effective: r.effective,
        rank: r.rank,
      })),
    [results]
  );

  /* ---- Input handlers ---- */
  const handleInputChange = useCallback(
    (dmuIdx: number, inputIdx: number, val: string) => {
      const num = parseFloat(val);
      if (Number.isNaN(num) || num < 0) return;
      setInputs((prev) => {
        const next = prev.map((row) => [...row]);
        if (!next[dmuIdx]) next[dmuIdx] = new Array(inputCount).fill(0);
        next[dmuIdx][inputIdx] = num;
        return next;
      });
    },
    [inputCount]
  );

  const handleOutputChange = useCallback(
    (dmuIdx: number, outputIdx: number, val: string) => {
      const num = parseFloat(val);
      if (Number.isNaN(num) || num < 0) return;
      setOutputs((prev) => {
        const next = prev.map((row) => [...row]);
        if (!next[dmuIdx]) next[dmuIdx] = new Array(outputCount).fill(0);
        next[dmuIdx][outputIdx] = num;
        return next;
      });
    },
    [outputCount]
  );

  const handleDmuCountChange = (delta: number) => {
    const newCount = Math.max(3, Math.min(10, dmuCount + delta));
    setDmuCount(newCount);
    // Extend names if needed
    setDmuNames((prev) => {
      const next = [...prev];
      while (next.length < newCount) {
        next.push(`DMU${next.length + 1}`);
      }
      return next;
    });
    // Extend input/output rows
    setInputs((prev) => {
      const next = prev.map((r) => [...r]);
      while (next.length < newCount) {
        next.push(new Array(inputCount).fill(0));
      }
      return next;
    });
    setOutputs((prev) => {
      const next = prev.map((r) => [...r]);
      while (next.length < newCount) {
        next.push(new Array(outputCount).fill(0));
      }
      return next;
    });
  };

  const handleReset = () => {
    setDmuCount(5);
    setInputCount(2);
    setOutputCount(2);
    setDmuNames([...DEFAULT_DMU_NAMES]);
    setInputLabels([...DEFAULT_INPUT_LABELS]);
    setOutputLabels([...DEFAULT_OUTPUT_LABELS]);
    setInputs(DEFAULT_INPUTS.map((r) => [...r]));
    setOutputs(DEFAULT_OUTPUTS.map((r) => [...r]));
    setSelectedDMU(0);
  };

  // Stats
  const effectiveCount = results.filter((r) => r.effective).length;
  const avgEfficiency =
    results.length > 0
      ? Math.round((results.reduce((s, r) => s + r.theta, 0) / results.length) * 1000) / 1000
      : 0;
  const minResult = results.length > 0 ? results.reduce((a, b) => (a.theta < b.theta ? a : b)) : null;

  // Rank icons
  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal size={16} style={{ color: '#C8963E' }} />;
    if (rank === 2) return <Medal size={16} style={{ color: '#9E9E9E' }} />;
    if (rank === 3) return <Medal size={16} style={{ color: '#b45309' }} />;
    return null;
  };

  // Build calculation steps for selected DMU
  const selectedResult = results[selectedDMU];
  const calcSteps = selectedResult
    ? [
        {
          title: `Step 1: 计算 ${selectedResult.name} 的产出综合得分`,
          formula: `产出综合 = ${dmuData[selectedDMU]?.outputs.map((v, i) => `${v}/${Math.max(...dmuData.map((d) => d.outputs[i]))}`).join(' + ') ?? ''}`,
          result: `产出综合得分 = ${selectedResult.outputScores.reduce((a, b) => a + b, 0).toFixed(3)}`,
          highlight: false,
        },
        {
          title: `Step 2: 计算 ${selectedResult.name} 的投入综合得分`,
          formula: `投入综合 = ${dmuData[selectedDMU]?.inputs.map((v) => String(v)).join(' + ') ?? ''}`,
          result: `投入综合 = ${selectedResult.inputScores.reduce((a, b) => a + b, 0)}`,
          highlight: false,
        },
        {
          title: `Step 3: 计算效率值 θ`,
          formula: 'θ = (产出综合 / 投入综合) / 最大值',
          result: `θ* = ${selectedResult.theta.toFixed(3)}`,
          highlight: true,
          optimal: selectedResult.effective,
        },
        {
          title: `Step 4: 判定相对有效性`,
          formula: `θ* = ${selectedResult.theta.toFixed(3)} ${selectedResult.effective ? '≈ 1' : '< 1'}`,
          result: selectedResult.effective
            ? `${selectedResult.name} 在简化比值代理下相对有效（比值接近最高）`
            : `${selectedResult.name} 在简化比值代理下相对非有效，可参照有效单元改进`,
          highlight: true,
          optimal: selectedResult.effective,
        },
      ]
    : [];

  // Knowledge card sections
  const knowledgeSections = [
    {
      subtitle: '适用条件',
      content: [
        '适用于评价具有相同类型的多投入、多产出的决策单元（如企业、部门、项目等）的相对效率',
        '无需预设生产函数形式，避免主观赋权',
        'DMU数量建议 ≥ 2×(投入数 + 产出数)',
      ],
    },
    {
      subtitle: '本演示的简化效率代理',
      content: [
        '效率代理值 = (某 DMU 产出综合) / (某 DMU 投入综合)',
        '再以效率最高的 DMU 为基准做归一化，得到相对效率值 θ ∈ [0,1]',
        '注意：这不是严格的 C²R 线性规划模型，仅用于理解“相对效率”思想',
      ],
    },
    {
      subtitle: '相对有效性判定',
      content: [
        'θ ≈ 1 → 相对有效（本演示中 θ ≥ 0.98 视为有效）',
        'θ < 1 → 相对非有效，可参照有效单元改进',
      ],
    },
    {
      subtitle: '特点与注意事项',
      content: [
        '无需预先设定权重，避免主观性',
        '无需指定生产函数的具体形式',
        '本演示仅给出简化的相对效率代理值，不涉及严格DEA的效率分解',
        '可示意非有效DMU的投入改进空间（非严格DEA投影结果）',
        '评价的是相对效率而非绝对效率',
        'DEA对异常值敏感，结果对指标选择较为敏感',
      ],
    },
  ];

  return (
    <Layout>
      <div className="">
        {/* ====== Page Header ====== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-6 mb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
                style={{ background: '#1B3A5F', color: '#ffffff' }}
              >
                5.4
                <BarChart3 size={16} />
              </span>
            </div>
            <h1
              className="text-[28px] font-bold"
              style={{ color: '#1B3A5F', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              DEA思想简化演示
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
              投入产出效率比值分析 — 演示DEA相对效率思想（注：非严格DEA线性规划模型）
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['DEA', '效率评价', '简化演示', '投入产出比'].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: '#f1f5f9', color: '#6B6B6B' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer self-start"
            style={{ background: '#f1f5f9', color: '#6B6B6B' }}
          >
            <RotateCcw size={14} />
            重置全部数据
          </button>
        </motion.div>

        {/* ====== Section 2: DEA Theory Overview ====== */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#2A4A73' }}>
            📖 DEA方法概述（简化演示版）
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B6B6B' }}>
            数据包络分析（Data Envelopment Analysis, DEA）是1978年由Charnes、Cooper和Rhodes提出的非参数化效率评价方法，经典的C²R模型需通过线性规划求解。本演示为降低理解门槛，采用“产出综合/投入综合”的比值作为相对效率的近似代理，并非严格的DEA线性规划结果。
          </p>
          <div className="rounded-lg p-3 mb-4" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <p className="text-xs font-medium" style={{ color: '#b45309' }}>
              ⚠️ 重要声明：本页面使用「产出综合/投入综合」的比值作为效率的近似代理，并非严格DEA方法的线性规划求解结果。仅供理解DEA"相对效率"的思想，请勿用于正式决策分析。如需严格DEA分析，请使用DEA专业软件（如MaxDEA、DEAP等）。
            </p>
          </div>

          {/* Concept cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: Building2,
                title: '决策单元(DMU)',
                desc: '被评价的对象，如企业、部门、项目等，具有相同的投入和产出指标',
              },
              {
                icon: Boxes,
                title: '生产可能集概念（示意）',
                desc: '所有投入产出组合构成的集合；严格DEA在此集合上寻找最优参照，本演示仅做概念示意',
              },
              {
                icon: TrendingUp,
                title: '相对效率参照（示意）',
                desc: '以最高投入产出比为基准，近似展示相对效率最高的DMU；非严格包络面/前沿示意',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="rounded-lg p-4"
                style={{
                  background: '#F8F6F2',
                  border: '1px solid #E0DDD5',
                }}
              >
                <card.icon size={20} style={{ color: '#3b82f6', marginBottom: '8px' }} />
                <h3 className="text-base font-semibold mb-1" style={{ color: '#2A4A73' }}>
                  {card.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: '#6B6B6B' }}>
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ====== Section 3: Simplified Efficiency Proxy ====== */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#2A4A73' }}>
            📐 简化效率比值模型
          </h2>
          <div className="rounded-lg p-3 mb-4" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <p className="text-xs font-medium" style={{ color: '#b45309' }}>
              ⚠️ 本页面仅用于直观理解DEA的相对效率思想，当前计算是“产出综合/投入综合”的简化比值代理，不是CCR/BCC线性规划结果，不能用于正式DEA评价。
            </p>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B6B6B' }}>
            本演示使用简化比值代理来近似DEA的相对效率思想。先计算每个DMU的产出综合与投入综合之比，再以最高比值为基准归一化到[0,1]。严格DEA需对每个DMU求解线性规划。
          </p>

          <div className="formula-block">
            <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>简化效率代理（非严格 DEA）</p>
            <BlockMath math="\text{原始效率}_j = \frac{\sum_{r=1}^{s} y_{rj}}{\sum_{i=1}^{m} x_{ij}}" />
            <BlockMath math="\theta_j = \frac{\text{原始效率}_j}{\max_k\{\text{原始效率}_k\}} \in [0,1]" />
          </div>

          <p className="text-sm leading-relaxed mt-4 mb-4" style={{ color: '#6B6B6B' }}>
            严格 DEA 的 C²R 模型需对每个 DMU 求解线性规划，本演示未实现该过程，仅用于理解“相对效率”思想。
          </p>

          {/* DEA Validity Cards */}
          <h3 className="text-sm font-semibold mt-5 mb-3" style={{ color: '#2A4A73' }}>
            简化相对效率代理解释
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                bg: '#E8F5E9',
                border: '#bbf7d0',
                color: '#4CAF50',
                title: '相对效率代理值最高',
                condition: 'θ ≈ 1',
                meaning: '在简化比值代理下投入产出比最高',
              },
              {
                bg: '#eff6ff',
                border: '#bae6fd',
                color: '#2563eb',
                title: '相对效率代理值较高',
                condition: 'θ 接近 1',
                meaning: '投入产出比接近最高值',
              },
              {
                bg: '#FDE8E8',
                border: '#fecaca',
                color: '#dc2626',
                title: '相对效率代理值较低',
                condition: 'θ 明显小于 1',
                meaning: '投入产出比明显低于最高值',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-lg p-4"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                }}
              >
                <span className="text-sm font-semibold" style={{ color: card.color }}>
                  {card.title}
                </span>
                <p className="text-xs mt-1 font-mono" style={{ color: '#6B6B6B' }}>
                  {card.condition}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                  {card.meaning}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ====== Section 4: Input/Output Data Tables ====== */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          {/* Title */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                📊 投入产出数据
              </h2>
              <p className="text-[13px] mt-1" style={{ color: '#6B6B6B' }}>
                输入各决策单元的投入和产出数据，系统将自动计算简化效率代理值
              </p>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium self-start"
              style={{ background: '#E8F5E9', color: '#4CAF50' }}
            >
              可编辑
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg" style={{ background: '#F8F6F2' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: '#6B6B6B' }}>
                决策单元数:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDmuCountChange(-1)}
                  className="p-1 rounded-md cursor-pointer transition-colors"
                  style={{ background: '#E0DDD5', color: '#6B6B6B' }}
                >
                  <Minus size={14} />
                </button>
                <span
                  className="px-3 py-1 rounded-md text-sm font-medium text-center min-w-[32px]"
                  style={{ background: '#ffffff', border: '1px solid #E0DDD5', color: '#2A4A73' }}
                >
                  {dmuCount}
                </span>
                <button
                  onClick={() => handleDmuCountChange(1)}
                  className="p-1 rounded-md cursor-pointer transition-colors"
                  style={{ background: '#E0DDD5', color: '#6B6B6B' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Input Table */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#2A4A73' }}>
              投入数据
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#2A4A73' }}>
                    <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">DMU</th>
                    {inputLabels.slice(0, inputCount).map((label, i) => (
                      <th key={i} className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dmuNames.slice(0, dmuCount).map((name, dmuIdx) => (
                    <tr
                      key={dmuIdx}
                      style={{
                        background: dmuIdx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                      }}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                        {name}
                      </td>
                      {Array.from({ length: inputCount }).map((_, inputIdx) => (
                        <td key={inputIdx} className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={inputs[dmuIdx]?.[inputIdx] ?? 0}
                            onChange={(e) => handleInputChange(dmuIdx, inputIdx, e.target.value)}
                            className="w-24 px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Output Table */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#2A4A73' }}>
              产出数据
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#2A4A73' }}>
                    <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">DMU</th>
                    {outputLabels.slice(0, outputCount).map((label, i) => (
                      <th key={i} className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dmuNames.slice(0, dmuCount).map((name, dmuIdx) => (
                    <tr
                      key={dmuIdx}
                      style={{
                        background: dmuIdx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                      }}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                        {name}
                      </td>
                      {Array.from({ length: outputCount }).map((_, outputIdx) => (
                        <td key={outputIdx} className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={outputs[dmuIdx]?.[outputIdx] ?? 0}
                            onChange={(e) => handleOutputChange(dmuIdx, outputIdx, e.target.value)}
                            className="w-24 px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* ====== Section 5: Efficiency Calculation ====== */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          {/* Title */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                ⚖️ 简化效率代理值计算
              </h2>
              <p className="text-[13px] mt-1" style={{ color: '#6B6B6B' }}>
                基于简化投入产出比值代理计算各决策单元的相对效率值
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: '#eff6ff', color: '#2563eb' }}
            >
              <Calculator size={13} />
              自动计算
            </span>
          </div>

          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            采用简化效率比值代理：θ = (某DMU产出综合/投入综合) ÷ (所有DMU中最大产出投入比)。θ越接近1表示相对效率越高。
          </p>

          {/* Efficiency Results Table */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">DMU</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">效率值 θ</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">排名</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">有效性</th>

                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.06 }}
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                      borderLeft: r.effective ? '3px solid #4CAF50' : '3px solid transparent',
                    }}
                    className={r.effective ? 'bg-green-50' : ''}
                  >
                    <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                      {r.name}
                    </td>
                    <td
                      className="px-4 py-2.5 text-center font-mono font-semibold"
                      style={{ color: r.effective ? '#4CAF50' : '#2A4A73' }}
                    >
                      {r.theta.toFixed(3)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {rankIcon(r.rank)}
                        <span style={{ color: '#2A4A73' }}>{r.rank}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.effective ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#E8F5E9', color: '#4CAF50' }}
                        >
                          <CheckCircle size={12} />
                          相对有效
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#f1f5f9', color: '#6B6B6B' }}
                        >
                          <AlertTriangle size={12} />
                          相对非有效
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DMU selector for calculation steps */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium" style={{ color: '#6B6B6B' }}>
              查看计算过程:
            </span>
            <div className="flex flex-wrap gap-2">
              {dmuNames.slice(0, dmuCount).map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDMU(idx)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150"
                  style={{
                    background: selectedDMU === idx ? '#3b82f6' : '#f1f5f9',
                    color: selectedDMU === idx ? '#ffffff' : '#6B6B6B',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Steps */}
          <CalculationSteps
            title={`${selectedResult?.name ?? ''} 效率计算过程`}
            steps={calcSteps}
          />

          {/* Improvement suggestions for non-effective DMUs */}
          {selectedResult && !selectedResult.effective && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg p-4"
              style={{
                background: '#fefce8',
                border: '1px solid #fde68a',
              }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                💡 {selectedResult.name} 改进建议
              </h4>
              <p className="text-sm mb-2" style={{ color: '#78350f' }}>
                示意性改进方向:
              </p>
              <ul className="flex flex-col gap-1 mb-2">
                {selectedResult.inputRedundancy.map((red, i) =>
                  red > 0 ? (
                    <li key={i} className="text-sm flex items-center gap-2" style={{ color: '#78350f' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#C8963E' }} />
                      {inputLabels[i]}: 可减少 {((1 - selectedResult.theta) * 100).toFixed(1)}%（约{red.toFixed(1)}）
                    </li>
                  ) : null
                )}
              </ul>
              <p className="text-sm" style={{ color: '#1B3A5F' }}>
                若以当前最高投入产出比为参照，{selectedResult.name}可考虑降低投入或提高产出，以提升相对效率代理值。
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* ====== Section 6: Efficiency Bar Chart ====== */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#2A4A73' }}>
            📈 各决策单元简化效率代理值对比
          </h2>
          <p className="text-[13px] mb-5" style={{ color: '#6B6B6B' }}>
            θ≈1 的决策单元在简化代理下相对效率最高
          </p>

          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
                <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 13 }} />
                <YAxis
                  domain={[0, 1.1]}
                  tick={{ fill: '#6B6B6B', fontSize: 12 }}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #E0DDD5',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`θ = ${value.toFixed(3)}`, '效率值']}
                />
                <ReferenceLine
                  y={1}
                  stroke="#4CAF50"
                  strokeDasharray="5 5"
                  label={{
                    value: '相对效率参考线 θ=1',
                    position: 'right',
                    fill: '#4CAF50',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="theta" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.effective ? '#4CAF50' : '#9E9E9E'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mt-5"
          >
            {[
              { label: '有效DMU', value: `${effectiveCount}/${results.length}`, color: '#4CAF50' },
              { label: '平均效率', value: avgEfficiency.toFixed(3), color: '#3b82f6' },
              {
                label: '最低效率',
                value: minResult ? `${minResult.theta.toFixed(3)} (${minResult.name})` : '—',
                color: '#ef4444',
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="text-center px-5 py-3 rounded-lg"
                style={{ background: '#F8F6F2' }}
              >
                <div className="text-lg font-semibold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ====== Section 7: Knowledge Card ====== */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <KnowledgeCard
            title="DEA数据包络分析"
            sections={knowledgeSections}
            tags={['DEA', '效率评价', '简化演示', '投入产出比']}
          />
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </Layout>
  );
}

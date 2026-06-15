import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  HelpCircle,
  ChevronDown,
  Award,
  AlertCircle,
} from 'lucide-react';

/* ── Default Data ── */
const DEFAULT_PRIOR = [0.5, 0.5];
const DEFAULT_LIKELIHOOD = [
  [0.9, 0.1],
  [0.2, 0.8],
];
const DEFAULT_PAYOFFS = {
  drillOil: 500,
  drillNoOil: -100,
  noDrill: 0,
  testCost: 60,
};

/* ── Animations ── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

/* ── Step Number Badge ── */
function StepBadge({ num }: { num: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[#C8963E] text-white text-sm font-bold flex items-center justify-center shrink-0">
      {num}
    </div>
  );
}

export default function BayesianDecision() {
  /* ── State ── */
  const [prior, setPrior] = useState<number[]>([...DEFAULT_PRIOR]);
  const [likelihood, setLikelihood] = useState<number[][]>(
    DEFAULT_LIKELIHOOD.map((row) => [...row])
  );
  const [payoffs, setPayoffs] = useState({ ...DEFAULT_PAYOFFS });
  const [teachingOpen, setTeachingOpen] = useState(false);

  /* ── Computed ── */
  const priorSum = useMemo(() => prior.reduce((s, p) => s + (isNaN(p) ? 0 : p), 0), [prior]);

  /* Bayesian calculations for each test result (good=0, bad=1) */
  const bayesianTables = useMemo(() => {
    return [0, 1].map((resultIdx) => {
      const rows = prior.map((p, hIdx) => {
        const joint = p * likelihood[hIdx][resultIdx];
        return {
          hypothesis: hIdx === 0 ? 'H₁(有油)' : 'H₂(无油)',
          prior: p,
          likelihood: likelihood[hIdx][resultIdx],
          joint,
        };
      });
      const pA = rows.reduce((s, r) => s + r.joint, 0);
      const posteriors = rows.map((r) => (pA > 0 ? r.joint / pA : 0));
      return { rows, pA, posteriors };
    });
  }, [prior, likelihood]);

  /* Pre-test EMV */
  const preTestEMV = useMemo(() => {
    const emvDrill =
      prior[0] * payoffs.drillOil + prior[1] * payoffs.drillNoOil;
    const emvNoDrill = payoffs.noDrill;
    return {
      drill: emvDrill,
      noDrill: emvNoDrill,
      optimal: emvDrill >= emvNoDrill ? 'drill' : ('noDrill' as const),
      value: Math.max(emvDrill, emvNoDrill),
    };
  }, [prior, payoffs]);

  /* Post-test EMV */
  const postTestEMV = useMemo(() => {
    return bayesianTables.map((table) => {
      const emvDrill =
        table.posteriors[0] * payoffs.drillOil +
        table.posteriors[1] * payoffs.drillNoOil;
      const emvNoDrill = payoffs.noDrill;
      const optimalDrill = emvDrill >= emvNoDrill;
      return {
        drill: emvDrill,
        noDrill: emvNoDrill,
        optimal: optimalDrill ? 'drill' : ('noDrill' as const),
        value: Math.max(emvDrill, emvNoDrill),
      };
    });
  }, [bayesianTables, payoffs]);

  /* EVSI calculation */
  const evsi = useMemo(() => {
    const postValue =
      bayesianTables[0].pA * postTestEMV[0].value +
      bayesianTables[1].pA * postTestEMV[1].value;
    const evsiValue = postValue - preTestEMV.value;
    const netEVSI = evsiValue - payoffs.testCost;
    return { postValue, evsiValue, netEVSI };
  }, [bayesianTables, postTestEMV, preTestEMV, payoffs]);

  const recommendTest = evsi.netEVSI > 0;

  /* ── Handlers ── */
  const handlePriorChange = useCallback(
    (idx: number, value: string) => {
      const num = parseFloat(value);
      const newP = isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
      setPrior((prev) => {
        const next = [...prev];
        next[idx] = newP;
        next[1 - idx] = Math.round((1 - newP) * 100) / 100;
        return next;
      });
    },
    []
  );

  const handleLikelihoodChange = useCallback(
    (rowIdx: number, colIdx: number, value: string) => {
      const num = parseFloat(value);
      const newVal = isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
      setLikelihood((prev) => {
        const next = prev.map((row) => [...row]);
        next[rowIdx][colIdx] = newVal;
        next[rowIdx][1 - colIdx] =
          Math.round((1 - newVal) * 100) / 100;
        return next;
      });
    },
    []
  );

  const handlePayoffChange = useCallback(
    (field: keyof typeof payoffs, value: string) => {
      const num = parseFloat(value);
      setPayoffs((prev) => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setPrior([...DEFAULT_PRIOR]);
    setLikelihood(DEFAULT_LIKELIHOOD.map((row) => [...row]));
    setPayoffs({ ...DEFAULT_PAYOFFS });
  }, []);

  const likelihoodRowSums = useMemo(
    () => likelihood.map((row) => row.reduce((s, v) => s + v, 0)),
    [likelihood]
  );

  return (
    <div className="space-y-6 mt-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-[22px] h-[22px] text-[#C8963E]" />
            <h2 className="text-[22px] font-bold text-[#2B2B2B]">
              贝叶斯决策分析 (Bayesian Decision)
            </h2>
          </div>
          <p className="text-[13px] text-[#6B6B6B] mt-1">
            基于贝叶斯定理更新概率信念，计算信息价值辅助抽样决策
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#F0EDE8] px-3 py-2 rounded-lg transition-all cursor-pointer self-start sm:self-auto active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          重置数据
        </button>
      </div>

      {/* ── Card 1: Bayesian Formula Display ── */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-[#1B3A5F]/[0.06] to-[#C8963E]/[0.06] border border-[#C8963E]/20 rounded-2xl p-8 text-center relative"
      >
        <StepBadge num={1} />

        {/* Formula */}
        <div className="mt-4 mb-6">
          <div className="font-serif text-2xl text-[#1B3A5F] font-semibold leading-relaxed">
            <span className="text-[#4CAF50]">P(Hᵢ|A)</span>
            <span className="text-[#2B2B2B] mx-1">=</span>
            <span className="inline-flex flex-col items-center align-middle mx-1">
              <span className="border-b-2 border-[#2B2B2B] pb-1 px-1">
                <span className="text-[#C8963E]">P(A|Hᵢ)</span>
                <span className="text-[#2B2B2B] mx-1">×</span>
                <span className="text-[#1B3A5F]">P(Hᵢ)</span>
              </span>
              <span className="text-[#9E9E9E] pt-1">P(A)</span>
            </span>
          </div>
        </div>

        {/* Four labeled cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            <div className="text-[#1B3A5F] font-bold mb-1">P(Hᵢ)</div>
            <div className="text-[#6B6B6B] text-xs">先验概率</div>
            <div className="text-[#9E9E9E] text-[11px] mt-0.5">
              试验前的初始信念
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            <div className="text-[#C8963E] font-bold mb-1">P(A|Hᵢ)</div>
            <div className="text-[#6B6B6B] text-xs">似然</div>
            <div className="text-[#9E9E9E] text-[11px] mt-0.5">
              假设下观测的概率
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            <div className="text-[#4CAF50] font-bold mb-1">P(Hᵢ|A)</div>
            <div className="text-[#6B6B6B] text-xs">后验概率</div>
            <div className="text-[#9E9E9E] text-[11px] mt-0.5">
              观测后更新的信念
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            <div className="text-[#7C6BAF] font-bold mb-1">P(A)</div>
            <div className="text-[#6B6B6B] text-xs">全概率</div>
            <div className="text-[#9E9E9E] text-[11px] mt-0.5">
              观测结果的边际概率
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Card 2: Prior Probability Settings ── */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <StepBadge num={2} />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
            先验概率
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <label className="text-sm text-[#6B6B6B] whitespace-nowrap">
              P(H₁)=P(有油)
            </label>
            <input
              type="number"
              step={0.1}
              min={0}
              max={1}
              value={prior[0]}
              onChange={(e) => handlePriorChange(0, e.target.value)}
              className="w-20 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[#6B6B6B] whitespace-nowrap">
              P(H₂)=P(无油)
            </label>
            <input
              type="number"
              step={0.1}
              min={0}
              max={1}
              value={prior[1]}
              onChange={(e) => handlePriorChange(1, e.target.value)}
              className="w-20 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
            />
          </div>
          <span className="text-xs text-[#9E9E9E]">
            （自动归一化：P(H₁) + P(H₂) = {priorSum.toFixed(2)}）
          </span>
        </div>
      </motion.div>

      {/* ── Card 3: Likelihood Matrix ── */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <StepBadge num={3} />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
            似然矩阵（条件概率 P(试验结果|假设)）
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1B3A5F] text-white h-11">
                <th className="px-4 py-2 text-left font-semibold rounded-tl-xl">
                  假设 \ 试验结果
                </th>
                <th className="px-4 py-2 text-center font-semibold">
                  好 (A₁)
                </th>
                <th className="px-4 py-2 text-center font-semibold">
                  差 (A₂)
                </th>
                <th className="px-4 py-2 text-center font-semibold rounded-tr-xl">
                  合计
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'H₁ (有油)', idx: 0 },
                { label: 'H₂ (无油)', idx: 1 },
              ].map((row) => (
                <tr
                  key={row.idx}
                  className="h-12 bg-white border-b border-[#EFEBE5] hover:bg-[#F0EDE8]/50"
                >
                  <td className="px-4 py-2 font-medium text-[#2B2B2B]">
                    {row.label}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      value={likelihood[row.idx][0]}
                      onChange={(e) =>
                        handleLikelihoodChange(row.idx, 0, e.target.value)
                      }
                      className="w-16 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      value={likelihood[row.idx][1]}
                      onChange={(e) =>
                        handleLikelihoodChange(row.idx, 1, e.target.value)
                      }
                      className="w-16 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
                    />
                  </td>
                  <td className="px-4 py-2 text-center font-medium tabular-nums bg-[#F0EDE8]">
                    {likelihoodRowSums[row.idx].toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#9E9E9E] mt-2">
          （似然矩阵每行自动归一化：P(好|H) + P(差|H) = 1）
        </p>
      </motion.div>

      {/* ── Card 4: Decision Payoff Parameters ── */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <StepBadge num={4} />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
            决策收益参数（万元）
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: '钻井有油收益',
              field: 'drillOil' as const,
              value: payoffs.drillOil,
            },
            {
              label: '钻井无油收益',
              field: 'drillNoOil' as const,
              value: payoffs.drillNoOil,
            },
            { label: '不钻井收益', field: 'noDrill' as const, value: payoffs.noDrill },
            { label: '试验费用', field: 'testCost' as const, value: payoffs.testCost },
          ].map((item) => (
            <div
              key={item.field}
              className="bg-[#F0EDE8] rounded-lg p-4 flex flex-col items-center gap-2"
            >
              <label className="text-sm text-[#6B6B6B] text-center whitespace-nowrap">
                {item.label}
              </label>
              <input
                type="number"
                value={item.value}
                onChange={(e) =>
                  handlePayoffChange(item.field, e.target.value)
                }
                className="w-24 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Card 5: Bayesian Calculation Tables ── */}
      <motion.div
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <StepBadge num={5} />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
            贝叶斯计算表格
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bayesianTables.map((table, tIdx) => (
            <div key={tIdx}>
              <div className="text-sm font-semibold text-[#4CAF50] mb-2">
                {tIdx === 0
                  ? '情况一：试验结果 = 好 (A₁)'
                  : '情况二：试验结果 = 差 (A₂)'}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1B3A5F] text-white h-11">
                      <th className="px-3 py-2 text-left font-semibold rounded-tl-xl">
                        假设
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-[#93C5FD]">
                        先验 P(H)
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-[#FDE68A]">
                        似然 P(A{tIdx === 0 ? '₁' : '₂'}|H)
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        联合 P(A∩H)
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-[#86EFAC] rounded-tr-xl">
                        后验 P(H|A{tIdx === 0 ? '₁' : '₂'})
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="h-12 bg-white border-b border-[#EFEBE5]"
                      >
                        <td className="px-3 py-2 font-medium text-[#2B2B2B]">
                          {rIdx === 0 ? 'H₁(有油)' : 'H₂(无油)'}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-[#1B3A5F]">
                          {(row.prior * 100).toFixed(4)}%
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-[#C8963E]">
                          {(row.likelihood * 100).toFixed(4)}%
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums">
                          {(row.joint * 100).toFixed(4)}%
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-[#4CAF50] font-bold">
                          {(table.posteriors[rIdx] * 100).toFixed(4)}%
                        </td>
                      </tr>
                    ))}
                    {/* P(A) row */}
                    <tr className="h-12 bg-[#F0EDE8] font-bold">
                      <td className="px-3 py-2">
                        P(A{tIdx === 0 ? '₁' : '₂'})=联合之和
                      </td>
                      <td className="px-3 py-2 text-center text-[#9E9E9E]">
                        —
                      </td>
                      <td className="px-3 py-2 text-center text-[#9E9E9E]">
                        —
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        {(table.pA * 100).toFixed(4)}%
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        100.0000%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Card 6: EVSI Information Value ── */}
      <motion.div
        custom={5}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-white to-[#C8963E]/[0.05] border border-[#C8963E]/20 rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <StepBadge num={6} />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
            信息价值计算 (EVSI)
          </h3>
        </div>

        <div className="space-y-5">
          {/* Step 1: Pre-test optimal */}
          <div className="border-l-4 border-[#1B3A5F] pl-4">
            <div className="text-xs text-[#9E9E9E] mb-1">
              ① 验前最优决策（基于先验概率的期望收益最大值）
            </div>
            <div className="text-sm text-[#6B6B6B]">
              最优行动：
              <span className="font-bold text-[#2B2B2B]">
                {preTestEMV.optimal === 'drill' ? '钻井' : '不钻井'}
              </span>
              <span className="mx-2 text-[#E0DDD5]">|</span>
              期望收益：
              <span className="text-lg font-bold text-[#1B3A5F] tabular-nums">
                {preTestEMV.value.toFixed(2)}
              </span>
              <span className="text-sm text-[#6B6B6B]"> 万元</span>
            </div>
          </div>

          {/* Step 2: Post-test optimal */}
          <div className="border-l-4 border-[#C8963E] pl-4">
            <div className="text-xs text-[#9E9E9E] mb-1">
              ② 验后最优决策（考虑试验结果后的期望收益）
            </div>
            <div className="space-y-1 text-sm text-[#6B6B6B]">
              <div>
                试验=好时：最优行动=
                <span className="font-bold text-[#2B2B2B]">
                  {postTestEMV[0].optimal === 'drill' ? '钻井' : '不钻井'}
                </span>
                ，期望收益=
                <span className="font-bold tabular-nums">
                  {postTestEMV[0].value.toFixed(2)}
                </span>
                万元
              </div>
              <div>
                试验=差时：最优行动=
                <span className="font-bold text-[#2B2B2B]">
                  {postTestEMV[1].optimal === 'drill' ? '钻井' : '不钻井'}
                </span>
                ，期望收益=
                <span className="font-bold tabular-nums">
                  {postTestEMV[1].value.toFixed(2)}
                </span>
                万元
              </div>
              <div className="pt-1 border-t border-[#EFEBE5] mt-1">
                验后期望收益 = P(A₁) ×{' '}
                {postTestEMV[0].value.toFixed(2)} + P(A₂) ×{' '}
                {postTestEMV[1].value.toFixed(2)} ={' '}
                <span className="text-lg font-bold text-[#C8963E] tabular-nums">
                  {evsi.postValue.toFixed(2)}
                </span>
                万元
              </div>
            </div>
          </div>

          {/* Step 3: Information value */}
          <div className="border-l-4 border-[#4CAF50] pl-4">
            <div className="text-xs text-[#9E9E9E] mb-1">
              ③ 信息价值
            </div>
            <div className="font-mono text-sm text-[#6B6B6B] tabular-nums space-y-1">
              <div>
                EVSI = 验后期望 - 验前期望 = {evsi.postValue.toFixed(2)} - {preTestEMV.value.toFixed(2)} ={' '}
                <span className="font-bold">{evsi.evsiValue.toFixed(2)}</span> 万元
              </div>
              <div>试验费用：{payoffs.testCost.toFixed(2)} 万元</div>
              <div>
                净信息价值 ={' '}
                <span
                  className={`text-lg font-bold ${recommendTest ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}
                >
                  {evsi.netEVSI.toFixed(2)}
                </span>{' '}
                万元
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div
            className={`rounded-lg p-4 text-center ${
              recommendTest
                ? 'bg-[#E8F5E9] border border-[#4CAF50]/30'
                : 'bg-[#FDE8E8] border border-[#F44336]/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {recommendTest ? (
                <Award className="w-5 h-5 text-[#4CAF50]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#F44336]" />
              )}
              <span
                className={`font-bold text-lg ${
                  recommendTest ? 'text-[#4CAF50]' : 'text-[#F44336]'
                }`}
              >
                净EVSI {recommendTest ? '＞' : '≤'} 0，
                {recommendTest ? '建议' : '不建议'}进行试验抽样
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Card 7: Teaching Points ── */}
      <motion.div
        custom={6}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#1B3A5F]/[0.03] border border-[#1B3A5F]/10 rounded-xl"
      >
        <button
          onClick={() => setTeachingOpen(!teachingOpen)}
          className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#1B3A5F]" />
            <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
              教学要点
            </h3>
          </div>
          <motion.div
            animate={{ rotate: teachingOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-[#6B6B6B]" />
          </motion.div>
        </button>

        <AnimatePresence>
          {teachingOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <ol className="space-y-3 text-sm text-[#6B6B6B]">
                  {[
                    <>
                      <strong className="text-[#2B2B2B]">先验概率</strong>{' '}
                      P(H)：反映我们对假设的初始信念，基于历史数据或主观判断。
                    </>,
                    <>
                      <strong className="text-[#2B2B2B]">似然</strong>{' '}
                      P(A|H)：表示在假设成立条件下观察到试验结果的概率。
                    </>,
                    <>
                      <strong className="text-[#2B2B2B]">联合概率</strong>{' '}
                      P(A∩H) = P(A|H)×P(H)：先验与似然的乘积。
                    </>,
                    <>
                      <strong className="text-[#2B2B2B]">全概率</strong>{' '}
                      P(A) = ΣP(A∩H)：将所有假设下的联合概率求和。
                    </>,
                    <>
                      <strong className="text-[#2B2B2B]">后验概率</strong>{' '}
                      P(H|A) = P(A∩H)/P(A)：贝叶斯定理的核心——根据观察结果更新信念。
                    </>,
                    <>
                      <strong className="text-[#2B2B2B]">EVSI</strong>
                      （信息期望价值）= 验后期望收益 - 验前期望收益，衡量试验信息的价值。
                    </>,
                    <>
                      当{' '}
                      <strong className="text-[#2B2B2B]">EVSI &gt; 试验费用</strong>
                      时，进行信息抽样是有利可图的。
                    </>,
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-[#C8963E] font-bold shrink-0">
                        {idx + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer note */}
      <div className="bg-[#1B3A5F]/[0.03] border-t border-[#E0DDD5] rounded-lg p-4 text-center">
        <p className="text-sm text-[#9E9E9E]">
          贝叶斯决策分析 — 数据驱动 · 科学决策
        </p>
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  RotateCcw,
  GraduationCap,
  ChevronDown,
  Award,
} from 'lucide-react';

/* ── Types ── */
interface StateConfig {
  name: string;
  prob: number;
  annualPayoff: number;
}

interface SchemeConfig {
  name: string;
  investment: number;
  serviceYears: number;
  states: [StateConfig, StateConfig];
}

/* ── Default Data ── */
const DEFAULT_SCHEMES: [SchemeConfig, SchemeConfig] = [
  {
    name: '建大厂',
    investment: 300,
    serviceYears: 10,
    states: [
      { name: '销路好', prob: 0.7, annualPayoff: 100 },
      { name: '销路差', prob: 0.3, annualPayoff: -20 },
    ],
  },
  {
    name: '建小厂',
    investment: 160,
    serviceYears: 10,
    states: [
      { name: '销路好', prob: 0.7, annualPayoff: 40 },
      { name: '销路差', prob: 0.3, annualPayoff: 10 },
    ],
  },
];

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

export default function DecisionTreeAnalysis() {
  /* ── State ── */
  const [schemes, setSchemes] = useState<SchemeConfig[]>(
    DEFAULT_SCHEMES.map((s) => ({
      ...s,
      states: s.states.map((st) => ({ ...st })) as [StateConfig, StateConfig],
    }))
  );
  const [expanded, setExpanded] = useState(true);

  /* ── Computed ── */
  const evs = useMemo(() => {
    return schemes.map((scheme) => {
      const totalPayoff = scheme.states.reduce(
        (sum, st) => sum + st.prob * st.annualPayoff * scheme.serviceYears,
        0
      );
      return totalPayoff - scheme.investment;
    });
  }, [schemes]);

  const maxEV = useMemo(() => Math.max(...evs), [evs]);
  const optimalIdx = useMemo(
    () => evs.findIndex((ev) => ev === maxEV),
    [evs, maxEV]
  );

  /* ── Handlers ── */
  const handleReset = useCallback(() => {
    setSchemes(
      DEFAULT_SCHEMES.map((s) => ({
        ...s,
        states: s.states.map((st) => ({ ...st })) as [StateConfig, StateConfig],
      }))
    );
  }, []);

  const updateSchemeField = useCallback(
    (schemeIdx: number, field: keyof SchemeConfig, value: string | number) => {
      setSchemes((prev) => {
        const next = prev.map((s) => ({
          ...s,
          states: s.states.map((st) => ({ ...st })) as [StateConfig, StateConfig],
        }));
        if (field === 'name') {
          next[schemeIdx].name = String(value);
        } else if (field === 'investment' || field === 'serviceYears') {
          const num = parseFloat(String(value));
          next[schemeIdx][field] = isNaN(num) ? 0 : num;
        }
        return next;
      });
    },
    []
  );

  const updateStateField = useCallback(
    (
      schemeIdx: number,
      stateIdx: number,
      field: keyof StateConfig,
      value: string
    ) => {
      setSchemes((prev) => {
        const next = prev.map((s) => ({
          ...s,
          states: s.states.map((st) => ({ ...st })) as [StateConfig, StateConfig],
        }));
        if (field === 'name') {
          next[schemeIdx].states[stateIdx].name = value;
        } else {
          const num = parseFloat(value);
          next[schemeIdx].states[stateIdx][field] = isNaN(num) ? 0 : num;
        }
        return next;
      });
    },
    []
  );

  const handleProbChange = useCallback(
    (schemeIdx: number, stateIdx: number, value: string) => {
      const num = parseFloat(value);
      const newProb = isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
      setSchemes((prev) => {
        const next = prev.map((s) => ({
          ...s,
          states: s.states.map((st) => ({ ...st })) as [StateConfig, StateConfig],
        }));
        next[schemeIdx].states[stateIdx].prob = newProb;
        // Auto-normalize: adjust other state's probability
        const otherIdx = 1 - stateIdx;
        next[schemeIdx].states[otherIdx].prob =
          Math.round((1 - newProb) * 100) / 100;
        return next;
      });
    },
    []
  );

  /* ── SVG Tree Layout ── */
  const scheme1 = schemes[0];
  const scheme2 = schemes[1];
  const ev1 = evs[0];
  const ev2 = evs[1];
  const isOptimal1 = optimalIdx === 0;
  const isOptimal2 = optimalIdx === 1;

  return (
    <div className="space-y-6 mt-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-[22px] h-[22px] text-[#C8963E]" />
            <h2 className="text-[22px] font-bold text-[#2B2B2B]">
              决策树分析 (Decision Tree Analysis)
            </h2>
          </div>
          <p className="text-[13px] text-[#6B6B6B] mt-1">
            通过决策树可视化和逆向归纳法选择最优决策方案
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#F0EDE8] px-3 py-2 rounded-lg transition-all cursor-pointer self-start sm:self-auto active:scale-[0.97]"
        >
          <RotateCcw className="w-4 h-4" />
          重置默认
        </button>
      </div>

      {/* ── Card 1: Decision Tree SVG ── */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5 relative"
        style={{ borderTop: '4px solid #C8963E' }}
      >
        <h3 className="text-[17px] font-semibold text-[#2B2B2B] mb-4">
          决策树可视化
        </h3>

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 850 340" className="w-full" style={{ minWidth: 600, height: 340 }}>
            {/* ── Definitions ── */}
            <defs>
              <filter id="optimalGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Decision Node ── */}
            <rect x={30} y={155} width={20} height={20} rx={2} fill="white" stroke="#1B3A5F" strokeWidth={2} />

            {/* ══════════════════════ Scheme 1: 建大厂 ══════════════════════ */}
            {/* Main branch line */}
            <line
              x1={50} y1={165}
              x2={160} y2={95}
              stroke={isOptimal1 ? '#4CAF50' : '#E0DDD5'}
              strokeWidth={isOptimal1 ? 3 : 2}
              strokeDasharray={isOptimal1 ? undefined : '5,3'}
              filter={isOptimal1 ? 'url(#optimalGlow)' : undefined}
            />
            {/* Scheme 1 label */}
            <text x={55} y={125} className="text-xs font-semibold fill-[#2B2B2B]">
              {scheme1.name}
            </text>
            <text x={55} y={139} className="text-[10px] fill-[#6B6B6B]">
              投资{scheme1.investment}万
            </text>

            {/* Chance Node 1 */}
            <circle
              cx={172} cy={87} r={12}
              fill="white"
              stroke="#1B3A5F"
              strokeWidth={2}
            />
            {/* EV label for scheme 1 */}
            <rect x={125} y={55} width={100} height={24} rx={6} fill={isOptimal1 ? '#E8F5E9' : '#FDE8E8'} stroke={isOptimal1 ? '#4CAF50' : '#F44336'} strokeWidth={1} />
            <text x={175} y={71} textAnchor="middle" className={`text-xs font-bold ${isOptimal1 ? 'fill-[#4CAF50]' : 'fill-[#F44336]'}`}>
              EV = {ev1.toFixed(0)}万 {isOptimal1 ? '★' : ''}
            </text>

            {/* Branch: 好 (scheme 1) */}
            <line x1={184} y1={80} x2={310} y2={45} stroke="#E0DDD5" strokeWidth={2} />
            <text x={235} y={56} className="text-[10px] fill-[#6B6B6B]">
              P={scheme1.states[0].prob}
            </text>
            <text x={330} y={48} className="text-[10px] fill-[#2B2B2B]">
              {scheme1.states[0].annualPayoff}万/年 × {scheme1.serviceYears}年 = {(scheme1.states[0].annualPayoff * scheme1.serviceYears).toFixed(0)}万
            </text>
            <circle cx={310} cy={45} r={4} fill="#6B6B6B" />

            {/* Branch: 差 (scheme 1) */}
            <line x1={184} y1={94} x2={310} y2={125} stroke="#E0DDD5" strokeWidth={2} />
            <text x={235} y={118} className="text-[10px] fill-[#6B6B6B]">
              P={scheme1.states[1].prob}
            </text>
            <text x={330} y={129} className="text-[10px] fill-[#2B2B2B]">
              {scheme1.states[1].annualPayoff}万/年 × {scheme1.serviceYears}年 = {(scheme1.states[1].annualPayoff * scheme1.serviceYears).toFixed(0)}万
            </text>
            <circle cx={310} cy={125} r={4} fill="#6B6B6B" />

            {/* ══════════════════════ Scheme 2: 建小厂 ══════════════════════ */}
            {/* Main branch line */}
            <line
              x1={50} y1={165}
              x2={160} y2={235}
              stroke={isOptimal2 ? '#4CAF50' : '#E0DDD5'}
              strokeWidth={isOptimal2 ? 3 : 2}
              strokeDasharray={isOptimal2 ? undefined : '5,3'}
              filter={isOptimal2 ? 'url(#optimalGlow)' : undefined}
            />
            {/* Prune mark for scheme 2 */}
            {!isOptimal2 && (
              <g transform="translate(100, 195)">
                <line x1={0} y1={0} x2={10} y2={10} stroke="#F44336" strokeWidth={2} />
                <line x1={10} y1={0} x2={0} y2={10} stroke="#F44336" strokeWidth={2} />
              </g>
            )}
            {/* Scheme 2 label */}
            <text x={55} y={212} className="text-xs font-semibold fill-[#2B2B2B]">
              {scheme2.name}
            </text>
            <text x={55} y={226} className="text-[10px] fill-[#6B6B6B]">
              投资{scheme2.investment}万
            </text>

            {/* Chance Node 2 */}
            <circle
              cx={172} cy={243} r={12}
              fill="white"
              stroke="#1B3A5F"
              strokeWidth={2}
            />
            {/* EV label for scheme 2 */}
            <rect x={125} y={261} width={100} height={24} rx={6} fill={isOptimal2 ? '#E8F5E9' : '#FDE8E8'} stroke={isOptimal2 ? '#4CAF50' : '#F44336'} strokeWidth={1} />
            <text x={175} y={277} textAnchor="middle" className={`text-xs font-bold ${isOptimal2 ? 'fill-[#4CAF50]' : 'fill-[#F44336]'}`}>
              EV = {ev2.toFixed(0)}万 {isOptimal2 ? '★' : '[剪枝]'}
            </text>

            {/* Branch: 好 (scheme 2) */}
            <line x1={184} y1={236} x2={310} y2={205} stroke="#E0DDD5" strokeWidth={2} />
            <text x={235} y={213} className="text-[10px] fill-[#6B6B6B]">
              P={scheme2.states[0].prob}
            </text>
            <text x={330} y={209} className="text-[10px] fill-[#2B2B2B]">
              {scheme2.states[0].annualPayoff}万/年 × {scheme2.serviceYears}年 = {(scheme2.states[0].annualPayoff * scheme2.serviceYears).toFixed(0)}万
            </text>
            <circle cx={310} cy={205} r={4} fill="#6B6B6B" />

            {/* Branch: 差 (scheme 2) */}
            <line x1={184} y1={250} x2={310} y2={285} stroke="#E0DDD5" strokeWidth={2} />
            <text x={235} y={278} className="text-[10px] fill-[#6B6B6B]">
              P={scheme2.states[1].prob}
            </text>
            <text x={330} y={293} className="text-[10px] fill-[#2B2B2B]">
              {scheme2.states[1].annualPayoff}万/年 × {scheme2.serviceYears}年 = {(scheme2.states[1].annualPayoff * scheme2.serviceYears).toFixed(0)}万
            </text>
            <circle cx={310} cy={285} r={4} fill="#6B6B6B" />

            {/* ── Legend (right side) ── */}
            <rect x={580} y={20} width={150} height={155} rx={8} fill="white" stroke="#E0DDD5" strokeWidth={1} />
            <text x={655} y={42} textAnchor="middle" className="text-xs font-semibold fill-[#2B2B2B]">
              图例
            </text>
            {/* Decision node */}
            <rect x={595} y={55} width={14} height={14} rx={2} fill="white" stroke="#1B3A5F" strokeWidth={2} />
            <text x={618} y={66} className="text-[11px] fill-[#6B6B6B]">决策节点</text>
            {/* Chance node */}
            <circle cx={602} cy={87} r={8} fill="white" stroke="#1B3A5F" strokeWidth={2} />
            <text x={618} y={91} className="text-[11px] fill-[#6B6B6B]">机会节点</text>
            {/* Optimal path */}
            <line x1={595} y1={110} x2={609} y2={110} stroke="#4CAF50" strokeWidth={3} />
            <text x={618} y={114} className="text-[11px] fill-[#6B6B6B]">最优路径</text>
            {/* Pruned branch */}
            <line x1={595} y1={133} x2={609} y2={133} stroke="#F44336" strokeWidth={2} strokeDasharray="5,3" />
            <text x={618} y={137} className="text-[11px] fill-[#6B6B6B]">剪枝分支</text>
            {/* Cross mark */}
            <g transform="translate(598, 150)">
              <line x1={0} y1={0} x2={8} y2={8} stroke="#F44336" strokeWidth={1.5} />
              <line x1={8} y1={0} x2={0} y2={8} stroke="#F44336" strokeWidth={1.5} />
            </g>
            <text x={618} y={159} className="text-[11px] fill-[#6B6B6B]">剪枝标记</text>
          </svg>
        </div>

        {/* Bottom conclusion */}
        <div className="text-center mt-3 pt-3 border-t border-[#EFEBE5]">
          <span className="text-sm font-bold text-[#4CAF50]">
            ★ 最优方案（EV = {maxEV.toFixed(0)}万）= {schemes[optimalIdx].name}
          </span>
        </div>
      </motion.div>

      {/* ── Cards 2 & 3: EV Calculation + Parameter Settings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Card 2: EV Calculation Process */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
        >
          <h3 className="text-[17px] font-semibold text-[#2B2B2B] mb-4">
            期望值计算过程
          </h3>

          {/* Scheme 1 calculation */}
          <div
            className={`rounded-lg p-4 mb-3 border ${
              isOptimal1
                ? 'bg-[#E8F5E9]/30 border-[#4CAF50]/20'
                : 'bg-[#FDE8E8]/30 border-[#F44336]/20'
            }`}
          >
            <div className={`font-bold text-sm mb-2 flex items-center gap-1 ${isOptimal1 ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
              {isOptimal1 && <Award className="w-4 h-4" />}
              {isOptimal1 ? '★ ' : ''}
              {scheme1.name} {isOptimal1 ? '（最优）' : '[剪枝]'}
            </div>
            <div className="font-mono text-sm text-[#6B6B6B] tabular-nums space-y-1">
              <div>
                EV = {scheme1.states[0].prob} × {scheme1.states[0].annualPayoff}万/年 × {scheme1.serviceYears}年 + {scheme1.states[1].prob} × ({scheme1.states[1].annualPayoff}万/年) × {scheme1.serviceYears}年 - {scheme1.investment}万投资
              </div>
              <div className="text-[#9E9E9E]">
                = {(scheme1.states[0].prob * scheme1.states[0].annualPayoff * scheme1.serviceYears).toFixed(0)}万 + {(scheme1.states[1].prob * scheme1.states[1].annualPayoff * scheme1.serviceYears).toFixed(0)}万 - {scheme1.investment}万
              </div>
              <div className={`text-xl font-bold ${isOptimal1 ? 'text-[#4CAF50]' : 'text-[#F44336] line-through'}`}>
                = {ev1.toFixed(0)}万
              </div>
            </div>
          </div>

          {/* Scheme 2 calculation */}
          <div
            className={`rounded-lg p-4 border ${
              isOptimal2
                ? 'bg-[#E8F5E9]/30 border-[#4CAF50]/20'
                : 'bg-[#FDE8E8]/30 border-[#F44336]/20'
            }`}
          >
            <div className={`font-bold text-sm mb-2 flex items-center gap-1 ${isOptimal2 ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
              {isOptimal2 && <Award className="w-4 h-4" />}
              {isOptimal2 ? '★ ' : ''}
              {scheme2.name} {isOptimal2 ? '（最优）' : '[剪枝]'}
            </div>
            <div className="font-mono text-sm text-[#6B6B6B] tabular-nums space-y-1">
              <div>
                EV = {scheme2.states[0].prob} × {scheme2.states[0].annualPayoff}万/年 × {scheme2.serviceYears}年 + {scheme2.states[1].prob} × {scheme2.states[1].annualPayoff}万/年 × {scheme2.serviceYears}年 - {scheme2.investment}万投资
              </div>
              <div className="text-[#9E9E9E]">
                = {(scheme2.states[0].prob * scheme2.states[0].annualPayoff * scheme2.serviceYears).toFixed(0)}万 + {(scheme2.states[1].prob * scheme2.states[1].annualPayoff * scheme2.serviceYears).toFixed(0)}万 - {scheme2.investment}万
              </div>
              <div className={`text-xl font-bold ${isOptimal2 ? 'text-[#4CAF50]' : 'text-[#F44336] line-through'}`}>
                = {ev2.toFixed(0)}万
              </div>
            </div>
          </div>

          {/* Decision Conclusion Card */}
          <div className="mt-4 bg-gradient-to-r from-[#4CAF50]/10 to-transparent border border-[#4CAF50]/30 rounded-lg p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">{scheme1.name}</span>
                <span className={`font-bold tabular-nums ${isOptimal1 ? 'text-[#4CAF50]' : 'text-[#2B2B2B]'}`}>
                  EV = {ev1.toFixed(0)} 万元
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">{scheme2.name}</span>
                <span className={`font-bold tabular-nums ${isOptimal2 ? 'text-[#4CAF50]' : 'text-[#2B2B2B]'}`}>
                  EV = {ev2.toFixed(0)} 万元
                </span>
              </div>
              <div className="border-t border-[#E0DDD5] pt-2 mt-2">
                <span className="text-lg font-bold text-[#4CAF50]">
                  最优决策：{schemes[optimalIdx].name}（EV = {maxEV.toFixed(0)}万）
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Parameter Settings */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
              参数设置
            </h3>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#F0EDE8] px-2 py-1 rounded transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              重置默认
            </button>
          </div>

          {schemes.map((scheme, sIdx) => (
            <div
              key={sIdx}
              className="border border-[#E0DDD5] rounded-lg p-4 mb-4 last:mb-0"
            >
              <h4 className="text-[15px] font-semibold text-[#2B2B2B] mb-3">
                方案 {sIdx + 1}：{scheme.name}
              </h4>

              <div className="space-y-3">
                {/* Name */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#6B6B6B] w-16 shrink-0">
                    名称
                  </label>
                  <input
                    type="text"
                    value={scheme.name}
                    onChange={(e) =>
                      updateSchemeField(sIdx, 'name', e.target.value)
                    }
                    className="flex-1 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium px-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
                  />
                </div>
                {/* Investment */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#6B6B6B] w-16 shrink-0">
                    投资额
                  </label>
                  <input
                    type="number"
                    value={scheme.investment}
                    onChange={(e) =>
                      updateSchemeField(sIdx, 'investment', e.target.value)
                    }
                    className="w-20 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
                  />
                  <span className="text-xs text-[#9E9E9E]">万元</span>
                </div>
                {/* Service years */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#6B6B6B] w-16 shrink-0">
                    服务期
                  </label>
                  <input
                    type="number"
                    value={scheme.serviceYears}
                    onChange={(e) =>
                      updateSchemeField(sIdx, 'serviceYears', e.target.value)
                    }
                    className="w-20 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
                  />
                  <span className="text-xs text-[#9E9E9E]">年</span>
                </div>

                {/* State 1 */}
                <div className="pt-2 border-t border-[#EFEBE5]">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-[#6B6B6B]">自然状态1</label>
                    <input
                      type="text"
                      value={scheme.states[0].name}
                      onChange={(e) =>
                        updateStateField(sIdx, 0, 'name', e.target.value)
                      }
                      className="w-20 h-8 border border-[#E0DDD5] rounded-lg text-center text-xs px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20"
                    />
                    <span className="text-xs text-[#9E9E9E]">, P=</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      value={scheme.states[0].prob}
                      onChange={(e) =>
                        handleProbChange(sIdx, 0, e.target.value)
                      }
                      className="w-16 h-8 border border-[#E0DDD5] rounded-lg text-center text-xs font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#6B6B6B] w-20">
                      年收益1
                    </label>
                    <input
                      type="number"
                      value={scheme.states[0].annualPayoff}
                      onChange={(e) =>
                        updateStateField(sIdx, 0, 'annualPayoff', e.target.value)
                      }
                      className="w-20 h-8 border border-[#E0DDD5] rounded-lg text-center text-xs font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20"
                    />
                    <span className="text-xs text-[#9E9E9E]">万元/年</span>
                  </div>
                </div>

                {/* State 2 */}
                <div className="pt-2 border-t border-[#EFEBE5]">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-[#6B6B6B]">自然状态2</label>
                    <input
                      type="text"
                      value={scheme.states[1].name}
                      onChange={(e) =>
                        updateStateField(sIdx, 1, 'name', e.target.value)
                      }
                      className="w-20 h-8 border border-[#E0DDD5] rounded-lg text-center text-xs px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20"
                    />
                    <span className="text-xs text-[#9E9E9E]">, P=</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      value={scheme.states[1].prob}
                      onChange={(e) =>
                        handleProbChange(sIdx, 1, e.target.value)
                      }
                      className="w-16 h-8 border border-[#E0DDD5] rounded-lg text-center text-xs font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#6B6B6B] w-20">
                      年收益2
                    </label>
                    <input
                      type="number"
                      value={scheme.states[1].annualPayoff}
                      onChange={(e) =>
                        updateStateField(sIdx, 1, 'annualPayoff', e.target.value)
                      }
                      className="w-20 h-8 border border-[#E0DDD5] rounded-lg text-center text-xs font-medium tabular-nums px-1 focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20"
                    />
                    <span className="text-xs text-[#9E9E9E]">万元/年</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Card 5: Teaching Tip — Reverse Induction ── */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#1B3A5F]/[0.03] border border-[#1B3A5F]/10 rounded-xl"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#1B3A5F]" />
            <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
              教学提示：逆向归纳法
            </h3>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-[#6B6B6B]" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4">
                {/* Decision tree elements */}
                <div>
                  <h4 className="text-[15px] font-semibold text-[#2B2B2B] mb-2">
                    决策树构成要素
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#6B6B6B]">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 border-2 border-[#1B3A5F] rounded-sm bg-white shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#2B2B2B]">决策节点（□）</strong>
                        ：表示需要做出选择的点
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-[#1B3A5F] bg-white shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#2B2B2B]">机会节点（○）</strong>
                        ：表示不确定的自然状态
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-0.5 bg-[#E0DDD5] mt-2.5 shrink-0" />
                      <span>
                        <strong className="text-[#2B2B2B]">概率枝</strong>
                        ：标注各状态的发生概率，ΣP = 1
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#6B6B6B] mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-[#2B2B2B]">结果点</strong>
                        ：标注各路径的最终收益
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reverse induction steps */}
                <div className="border-t border-[#EFEBE5] pt-3">
                  <h4 className="text-[15px] font-semibold text-[#2B2B2B] mb-2">
                    逆向归纳法步骤
                  </h4>
                  <ol className="space-y-2 text-sm text-[#6B6B6B]">
                    <li className="flex gap-2">
                      <span className="text-[#C8963E] font-bold shrink-0">1.</span>
                      <span>从树的最右端（结果点）开始向左计算</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#C8963E] font-bold shrink-0">2.</span>
                      <span>
                        对每个<strong>机会节点</strong>计算期望值 EV = Σ(P × 收益)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#C8963E] font-bold shrink-0">3.</span>
                      <span>
                        对每个<strong>决策节点</strong>选择 EV 最大的方案
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#C8963E] font-bold shrink-0">4.</span>
                      <span>
                        在次优方案上标记"剪枝"（×），保留最优路径
                      </span>
                    </li>
                  </ol>
                </div>

                <p className="text-xs text-[#9E9E9E] italic">
                  提示：修改左侧面板中的参数，决策树和计算结果会实时更新！
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

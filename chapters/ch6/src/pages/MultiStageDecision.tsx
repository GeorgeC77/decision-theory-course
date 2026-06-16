import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Clock,
  Link2,
  Target,
  GitFork,
  ArrowRight,
  Calculator,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

// ── KaTeX renderer helper ──────────────────────────────────────
function Katex({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
      });
    } catch {
      return tex;
    }
  }, [tex, display]);
  return (
    <span
      className={display ? "block my-3" : "inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Types ──────────────────────────────────────────────────────
interface PayoffRow {
  theta: string;
  prob: number;
  a1: number;
  a2: number;
  a3: number;
}

interface LikelihoodRow {
  theta: string;
  h1: number;
  h2: number;
  h3: number;
}

// ── Default data ───────────────────────────────────────────────
const defaultPayoffData: PayoffRow[] = [
  { theta: "\\theta_1\\text{(畅销)}", prob: 0.4, a1: 40000, a2: 30000, a3: 10000 },
  { theta: "\\theta_2\\text{(一般)}", prob: 0.3, a1: 20000, a2: 30000, a3: 10000 },
  { theta: "\\theta_3\\text{(滞销)}", prob: 0.3, a1: -30000, a2: -20000, a3: 10000 },
];

const defaultLikelihood: LikelihoodRow[] = [
  { theta: "\\theta_1", h1: 0.4, h2: 0.3, h3: 0.3 },
  { theta: "\\theta_2", h1: 0.2, h2: 0.4, h3: 0.4 },
  { theta: "\\theta_3", h1: 0.4, h2: 0.5, h3: 0.1 },
];

// ── Number input helper ────────────────────────────────────────
function EditableCell({
  value,
  onChange,
  isProb = false,
  highlight = false,
}: {
  value: number;
  onChange: (v: number) => void;
  isProb?: boolean;
  highlight?: boolean;
}) {
  return (
    <input
      type="number"
      step={isProb ? 0.01 : 1000}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full text-center px-2 py-1.5 rounded border text-sm font-medium transition-all
        ${
          highlight
            ? "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300"
            : "border-slate-200 bg-white hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
        }
        focus:outline-none`}
    />
  );
}

// ── Editable prob cell ─────────────────────────────────────────
function ProbCell({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      step={0.01}
      min={0}
      max={1}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full text-center px-2 py-1.5 rounded border border-slate-200 bg-white hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 focus:outline-none text-sm font-medium"
    />
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function MultiStageDecision() {
  // ── State ────────────────────────────────────────────────────
  const [payoffData, setPayoffData] = useState<PayoffRow[]>(
    JSON.parse(JSON.stringify(defaultPayoffData))
  );
  const [likelihood, setLikelihood] = useState<LikelihoodRow[]>(
    JSON.parse(JSON.stringify(defaultLikelihood))
  );
  const [showPosterior, setShowPosterior] = useState(false);

  // ── Computed: prior probabilities from payoffData ────────────
  const priorProbs = useMemo(() => payoffData.map((r) => r.prob), [payoffData]);

  // ── Computed: Expected values (without buying) ───────────────
  const expectedValues = useMemo(() => {
    const ev = [0, 0, 0];
    payoffData.forEach((row) => {
      ev[0] += row.prob * row.a1;
      ev[1] += row.prob * row.a2;
      ev[2] += row.prob * row.a3;
    });
    return ev;
  }, [payoffData]);

  const maxEv = Math.max(...expectedValues);
  const bestActionIndex = expectedValues.indexOf(maxEv);

  // ── Computed: Posterior probabilities ────────────────────────
  const posteriorResults = useMemo(() => {
    if (!showPosterior) return null;

    // P(H_k) = sum_j P(theta_j) * P(H_k | theta_j)
    const pH = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3; j++) {
        const lh =
          k === 0 ? likelihood[j].h1 : k === 1 ? likelihood[j].h2 : likelihood[j].h3;
        pH[k] += priorProbs[j] * lh;
      }
    }

    // P(theta_j | H_k) = P(theta_j) * P(H_k | theta_j) / P(H_k)
    const posterior: number[][] = [[], [], []];
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3; j++) {
        const lh =
          k === 0 ? likelihood[j].h1 : k === 1 ? likelihood[j].h2 : likelihood[j].h3;
        posterior[k][j] =
          pH[k] > 0 ? (priorProbs[j] * lh) / pH[k] : 0;
      }
    }

    // Expected values under each H_k
    const evPosterior: number[][] = [[], [], []];
    for (let k = 0; k < 3; k++) {
      for (let a = 0; a < 3; a++) {
        let ev = 0;
        for (let j = 0; j < 3; j++) {
          const payoff =
            a === 0
              ? payoffData[j].a1
              : a === 1
              ? payoffData[j].a2
              : payoffData[j].a3;
          ev += posterior[k][j] * payoff;
        }
        evPosterior[k][a] = ev;
      }
    }

    return { pH, posterior, evPosterior };
  }, [showPosterior, likelihood, priorProbs, payoffData]);

  // ── Handlers ─────────────────────────────────────────────────
  const updatePayoff = useCallback(
    (rowIdx: number, field: keyof PayoffRow, value: number) => {
      setPayoffData((prev) =>
        prev.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  const updateLikelihood = useCallback(
    (rowIdx: number, field: keyof LikelihoodRow, value: number) => {
      setLikelihood((prev) =>
        prev.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  // ── Reset ────────────────────────────────────────────────────
  const handleReset = () => {
    setPayoffData(JSON.parse(JSON.stringify(defaultPayoffData)));
    setLikelihood(JSON.parse(JSON.stringify(defaultLikelihood)));
    setShowPosterior(false);
  };

  // ── Module 1: 多阶段决策概述 ─────────────────────────────────
  const ModuleOverview = () => (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F8F6F2] rounded-lg">
            <GitFork className="w-5 h-5 text-[#1B3A5F]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1B3A5F]">
            多阶段决策问题
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-slate-700 leading-relaxed">
          在经济活动中，常常遇到需要将过程分为若干个相互联系的阶段，在每个阶段都需要做出决策，从而使整个过程达到最好的活动效果。这类问题称为
          <strong>多阶段决策问题</strong>（Multi-Stage Decision Problem）。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 特点 1 */}
          <div className="bg-white border border-[#E0DDD5] rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#F8F6F2] text-[#1B3A5F] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#1B3A5F]">时间先后性</h3>
            </div>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              决策者需要做出时间上有先后之别的多次决策，各阶段决策构成一个序列。
            </p>
          </div>

          {/* 特点 2 */}
          <div className="bg-white border border-[#E0DDD5] rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#F8F6F2] text-[#1B3A5F] flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#1B3A5F]">前序影响后续</h3>
            </div>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              前一次决策的选择将直接影响到后一次决策，后一次决策的状态取决于前一次决策的结果。
            </p>
          </div>

          {/* 特点 3 */}
          <div className="bg-white border border-[#E0DDD5] rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#F8F6F2] text-[#1B3A5F] flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#1B3A5F]">关注总结果</h3>
            </div>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              决策者关心的是多次决策的总结果，而不是各次决策的即时后果。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ── Module 2: 多阶段决策方法 ─────────────────────────────────
  const ModuleMethod = () => (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F8F6F2] rounded-lg">
            <GitFork className="w-5 h-5 text-[#1B3A5F]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1B3A5F]">
            决策树与逆序归纳法
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 决策树构成 */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            决策树的构成
          </h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-700">
              决策树由<strong>节点</strong>和<strong>分枝</strong>组成：
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <span className="inline-block w-6 h-6 border-2 border-slate-700 bg-white rounded-sm" />
                <span className="text-sm text-slate-700">
                  决策节点（□）：表示需要做出选择的点
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-6 h-6 border-2 border-slate-700 bg-white rounded-full" />
                <span className="text-sm text-slate-700">
                  机会节点（○）：表示随机事件的发生点
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 逆序归纳法步骤 */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-blue-500" />
            逆序归纳法（Backward Induction）
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            从后到前进行决策分析，主要步骤如下：
          </p>
          <div className="space-y-3">
            {[
              {
                step: 1,
                title: "划分阶段",
                desc: "根据具体问题适当划分阶段，确定决策的时间节点。",
              },
              {
                step: 2,
                title: "确定状态变量",
                desc: "确定各阶段的状态变量，寻找各阶段之间的联系。",
              },
              {
                step: 3,
                title: "逆序求解",
                desc: "由后到前用逆序归纳法进行决策分析，逐步求出最优策略。",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 bg-slate-50 rounded-lg p-4"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 关键公式 */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            动态规划基本方程
          </h3>
          <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
            <Katex
              tex="V_n(s) = \max_{a \in A(s)} \left\{ R(s,a) + \gamma \sum_{s'} P(s'|s,a) V_{n+1}(s') \right\}"
              display
            />
            <p className="text-xs text-slate-500 mt-2">
              其中{" "}
              <Katex tex="V_n(s)" /> 为第{" "}
              <Katex tex="n" />{" "}
              阶段状态{" "}
              <Katex tex="s" />{" "}
              的最优值函数，{" "}
              <Katex tex="R(s,a)" />{" "}
              为即时收益，{" "}
              <Katex tex="\gamma" />{" "}
              为折扣因子。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ── Module 3: 应用举例 ───────────────────────────────────────
  const ModuleExample = () => (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F8F6F2] rounded-lg">
            <TrendingUp className="w-5 h-5 text-[#1B3A5F]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1B3A5F]">
            例6-1 某公司产销新产品的收益矩阵
          </CardTitle>
        </div>
        <p className="text-sm text-slate-500">
          某公司考虑是否花费4000元从某科研机构购买某项技术，然后产销新产品。如果不买技术，可获利8000元。
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ── 收益矩阵 ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-500" />
              收益矩阵（可编辑）
            </h3>
            <div className="text-xs text-slate-500">
              单位：元 | 技术购买费用：4000元
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2.5 text-center font-semibold min-w-[100px]">
                    <Katex tex="\theta" />
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold min-w-[80px]">
                    <Katex tex="P(\theta)" />
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold min-w-[100px]">
                    <Katex tex="a_1" />
                    <br />
                    大批生产
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold min-w-[100px]">
                    <Katex tex="a_2" />
                    <br />
                    中批生产
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold min-w-[100px]">
                    <Katex tex="a_3" />
                    <br />
                    小批生产
                  </th>
                </tr>
              </thead>
              <tbody>
                {payoffData.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-3 py-2 text-center font-medium text-slate-700">
                      <Katex tex={row.theta} />
                    </td>
                    <td className="px-3 py-2">
                      <ProbCell
                        value={row.prob}
                        onChange={(v) => updatePayoff(i, "prob", v)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell
                        value={row.a1}
                        onChange={(v) => updatePayoff(i, "a1", v)}
                        highlight={bestActionIndex === 0}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell
                        value={row.a2}
                        onChange={(v) => updatePayoff(i, "a2", v)}
                        highlight={bestActionIndex === 1}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell
                        value={row.a3}
                        onChange={(v) => updatePayoff(i, "a3", v)}
                        highlight={bestActionIndex === 2}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 期望收益计算 ─────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            各方案期望收益值（先验分析）
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "a_1（大批生产）", ev: expectedValues[0], idx: 0 },
              { label: "a_2（中批生产）", ev: expectedValues[1], idx: 1 },
              { label: "a_3（小批生产）", ev: expectedValues[2], idx: 2 },
            ].map((item) => (
              <div
                key={item.idx}
                className={`rounded-lg p-4 border-2 transition-all ${
                  item.idx === bestActionIndex
                    ? "border-emerald-400 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="text-sm font-medium text-slate-600 mb-1">
                  <Katex tex={item.label} />
                </div>
                <div
                  className={`text-lg font-bold ${
                    item.idx === bestActionIndex
                      ? "text-emerald-700"
                      : "text-slate-800"
                  }`}
                >
                  {item.ev.toLocaleString("zh-CN", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  元
                </div>
                {item.idx === bestActionIndex && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    最优方案
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 扣除技术费后的净收益 */}
          <div className="mt-4 bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              购买技术后的净收益（扣除4000元技术费）
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {expectedValues.map((ev, i) => {
                const net = ev - 4000;
                const isBest = i === bestActionIndex;
                return (
                  <div
                    key={i}
                    className={`text-center rounded-md py-2 px-3 text-sm font-medium ${
                      isBest
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Katex tex={`a_${i + 1}:`} />{" "}
                    {net.toLocaleString("zh-CN", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    元
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-sm text-slate-600">
              不买技术的收益：
              <strong>8000 元</strong>
              {maxEv - 4000 > 8000 ? (
                <span className="text-emerald-600 ml-2">
                  → 购买技术更优（净收益 {(maxEv - 4000).toLocaleString("zh-CN", { maximumFractionDigits: 0 })} 元）
                </span>
              ) : (
                <span className="text-amber-600 ml-2">
                  → 不购买技术更优
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── 贝叶斯计算交互区 ─────────────────────────────────── */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-500" />
            贝叶斯分析 — 试销信息
          </h3>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
            <p className="text-sm text-purple-800 mb-2">
              试销费用：<strong>600元</strong> | 试销结果：H₁(受欢迎), H₂(一般), H₃(不受欢迎)
            </p>
            <p className="text-xs text-purple-600">
              通过试销获取补充信息，利用贝叶斯公式更新对市场状态的概率估计，从而做出更准确的决策。
            </p>
          </div>

          {/* 似然矩阵 */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              似然分布{" "}
              <Katex tex="P(H_k | \\theta_j)" />（可编辑）
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-3 py-2 text-center font-semibold">
                      <Katex tex="\\theta" />
                    </th>
                    <th className="px-3 py-2 text-center font-semibold">
                      <Katex tex="P(H_1|\\theta)" />
                      <br />
                      受欢迎
                    </th>
                    <th className="px-3 py-2 text-center font-semibold">
                      <Katex tex="P(H_2|\\theta)" />
                      <br />
                      一般
                    </th>
                    <th className="px-3 py-2 text-center font-semibold">
                      <Katex tex="P(H_3|\\theta)" />
                      <br />
                      不受欢迎
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {likelihood.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-3 py-2 text-center font-medium text-slate-700">
                        <Katex tex={row.theta} />
                      </td>
                      <td className="px-3 py-2">
                        <ProbCell
                          value={row.h1}
                          onChange={(v) =>
                            updateLikelihood(i, "h1", v)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <ProbCell
                          value={row.h2}
                          onChange={(v) =>
                            updateLikelihood(i, "h2", v)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <ProbCell
                          value={row.h3}
                          onChange={(v) =>
                            updateLikelihood(i, "h3", v)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 贝叶斯公式 */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              贝叶斯公式
            </h4>
            <Katex
              tex="P(\\theta_j | H_k) = \\frac{P(\\theta_j) \\cdot P(H_k | \\theta_j)}{P(H_k)} = \\frac{P(\\theta_j) \\cdot P(H_k | \\theta_j)}{\\sum_{i} P(\\theta_i) \\cdot P(H_k | \\theta_i)}"
              display
            />
          </div>

          {/* 计算按钮 */}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={() => setShowPosterior(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Calculator className="w-4 h-4 mr-2" />
              计算后验概率
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重置数据
            </Button>
          </div>

          {/* 后验概率结果 */}
          {showPosterior && posteriorResults && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                后验概率计算结果
              </h4>

              <div className="overflow-x-auto rounded-lg border border-emerald-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-emerald-700 text-white">
                      <th className="px-3 py-2.5 text-center font-semibold">
                        <Katex tex="H_k" />
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">
                        <Katex tex="P(H_k)" />
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">
                        <Katex tex="P(\\theta_1|H_k)" />
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">
                        <Katex tex="P(\\theta_2|H_k)" />
                      </th>
                      <th className="px-3 py-2.5 text-center font-semibold">
                        <Katex tex="P(\\theta_3|H_k)" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posteriorResults.pH.map((ph, k) => (
                      <tr
                        key={k}
                        className={k % 2 === 0 ? "bg-white" : "bg-emerald-50/50"}
                      >
                        <td className="px-3 py-2.5 text-center font-medium text-slate-700">
                          <Katex tex={`H_${k + 1}`} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-700">
                          {ph.toFixed(3)}
                        </td>
                        {posteriorResults.posterior[k].map((p, j) => (
                          <td
                            key={j}
                            className="px-3 py-2.5 text-center font-mono text-slate-700"
                          >
                            {p.toFixed(3)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 后验期望收益 */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  后验期望收益（考虑试销后）
                </h4>
                <div className="space-y-3">
                  {posteriorResults.evPosterior.map((evs, k) => {
                    const maxPosteriorEv = Math.max(...evs);
                    const bestIdx = evs.indexOf(maxPosteriorEv);
                    return (
                      <div
                        key={k}
                        className="bg-white rounded-lg p-4 border border-emerald-100"
                      >
                        <div className="text-sm font-medium text-emerald-800 mb-2">
                          若试销结果为 <Katex tex={`H_${k + 1}`} />
                          （P=<strong>{posteriorResults.pH[k].toFixed(3)}</strong>）：
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {evs.map((ev, a) => (
                            <div
                              key={a}
                              className={`text-center rounded-md py-2 px-2 text-sm font-medium ${
                                a === bestIdx
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Katex tex={`a_${a + 1}:`} />
                              <br />
                              {(ev - 4000 - 600).toLocaleString("zh-CN", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              元
                              {a === bestIdx && (
                                <span className="text-xs block mt-0.5 text-emerald-600">
                                  最优
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 最终结论 */}
                <div className="mt-4 bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-slate-800 text-sm">
                        决策结论
                      </h5>
                      <p className="text-sm text-slate-600 mt-1">
                        综合先验分析，最优决策为购买技术（4000元）并采用
                        <strong className="text-emerald-700">
                          {" "}
                          {bestActionIndex === 0
                            ? "大批生产"
                            : bestActionIndex === 1
                            ? "中批生产"
                            : "小批生产"}
                        </strong>
                        ，期望净收益为{" "}
                        <strong className="text-emerald-700">
                          {(maxEv - 4000).toLocaleString("zh-CN", {
                            maximumFractionDigits: 0,
                          })}{" "}
                          元
                        </strong>
                        。在试销信息价值分析中，若试销的期望收益增量不超过试销费用600元，则不进行试销。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ── Module 4: 知识点总结 ─────────────────────────────────────
  const ModuleSummary = () => (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-600" />
          知识点总结
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="conditions">
            <AccordionTrigger className="text-sm font-semibold text-slate-800 hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                适用条件
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 space-y-2 px-2">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  决策问题可以分解为若干个相互联系的阶段或时间节点
                </li>
                <li>
                  每个阶段的决策会影响下一阶段的状态或可选方案
                </li>
                <li>
                  存在不确定性因素（如市场状态），且可用概率描述
                </li>
                <li>
                  决策者关注的是整个过程的总体收益或效用最大化
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="steps">
            <AccordionTrigger className="text-sm font-semibold text-slate-800 hover:no-underline">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                关键步骤
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 space-y-2 px-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  明确决策问题的各阶段，绘制决策树或建立动态规划模型
                </li>
                <li>
                  确定各阶段的状态变量和决策变量
                </li>
                <li>
                  估计各状态的概率分布（先验概率）
                </li>
                <li>
                  确定各方案在不同状态下的收益值
                </li>
                <li>
                  使用逆序归纳法或贝叶斯分析求解最优决策序列
                </li>
                <li>
                  进行敏感性分析，评估结果对参数变化的稳健性
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notes">
            <AccordionTrigger className="text-sm font-semibold text-slate-800 hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                注意事项
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 space-y-2 px-2">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  阶段的划分应当适度，过粗会丢失关键信息，过细会增加计算复杂度
                </li>
                <li>
                  先验概率的估计应尽量基于历史数据或专家判断，避免主观偏差
                </li>
                <li>
                  贝叶斯分析中，补充信息的价值应与其获取成本相比较
                </li>
                <li>
                  逆序归纳法假设决策者是理性的，实际应用中需考虑行为因素
                </li>
                <li>
                  当状态空间或决策空间很大时，动态规划可能存在"维度灾难"问题
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <ModuleOverview />
      <ModuleMethod />
      <ModuleExample />
      <ModuleSummary />
    </>
  );
}

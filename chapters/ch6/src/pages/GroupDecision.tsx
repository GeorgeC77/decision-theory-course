import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  Vote,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Trophy,
  Lightbulb,
  BarChart3,
  Scale,
  Info,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

/* ============================================================
   KaTeX Renderer Component
   ============================================================ */
function TeX({ math, display = false }: { math: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: display,
        trust: true,
        strict: false,
      });
    } catch {
      return math;
    }
  }, [math, display]);

  return (
    <span
      className={display ? "block my-2" : "inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ============================================================
   Module 1: 群体决策概述
   ============================================================ */
function OverviewSection() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F8F6F2] rounded-lg">
            <Users className="w-5 h-5 text-[#1B3A5F]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1B3A5F]">群体决策问题</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* 定义 */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            群体决策概念
          </h3>
          <p className="text-slate-700 leading-relaxed">
            群体决策（Group Decision Making）是指<span className="font-semibold text-amber-700">多个决策者共同参与、共同做出决定</span>的决策过程。
            当决策问题涉及多个利益相关方，或问题复杂度超出个人能力范围时，需要采用群体决策方法。
          </p>
        </div>

        {/* 必要性 */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            群体决策的必要性
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "知识互补", desc: "集思广益，汇聚不同领域专业知识" },
              { title: "风险分散", desc: "减少个人偏见和判断失误的影响" },
              { title: "增强认同", desc: "提高决策执行的可接受度和支持度" },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3"
              >
                <h4 className="font-medium text-slate-700">{item.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 群体与个人决策对比 */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#1B3A5F]" />
            群体决策 vs 个人决策
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-4 py-2 text-left text-slate-800 rounded-tl-lg">
                    比较维度
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-left text-slate-800">
                    群体决策
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-left text-slate-800 rounded-tr-lg">
                    个人决策
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["信息来源", "多渠道、多角度", "单一视角"],
                  ["决策质量", "更全面，可能更优", "依赖个人能力"],
                  ["决策速度", "较慢，需要协调", "快速高效"],
                  ["责任归属", "分散", "明确"],
                  ["执行认同", "更容易被接受", "可能遇到阻力"],
                  ["成本", "较高（时间、人力）", "较低"],
                ].map(([dim, group, personal], i) => (
                  <tr
                    key={dim}
                    className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="border border-slate-200 px-4 py-2 font-medium text-slate-700">
                      {dim}
                    </td>
                    <td className="border border-slate-200 px-4 py-2 text-slate-600">
                      {group}
                    </td>
                    <td className="border border-slate-200 px-4 py-2 text-slate-600">
                      {personal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Module 2: 投票规则与波德规则计算器
   ============================================================ */

interface Voter {
  name: string;
  ranking: string[]; // ordered list of candidate names
}

const DEFAULT_CANDIDATES = ["A", "B", "C", "D", "E"];
const DEFAULT_VOTERS: Voter[] = [
  { name: "张", ranking: ["A", "C", "D", "E", "B"] },
  { name: "赵", ranking: ["B", "A", "C", "D", "E"] },
];

function BordaCountSection() {
  const [candidates, setCandidates] = useState<string[]>(DEFAULT_CANDIDATES);
  const [voters, setVoters] = useState<Voter[]>(
    DEFAULT_VOTERS.map((v) => ({ ...v, ranking: [...v.ranking] }))
  );
  const [newCandidate, setNewCandidate] = useState("");
  const [newVoterName, setNewVoterName] = useState("");

  const bordaScores = useCallback(() => {
    const n = candidates.length;
    const scores: Record<string, number> = {};
    candidates.forEach((c) => (scores[c] = 0));

    voters.forEach((voter) => {
      voter.ranking.forEach((candidate, idx) => {
        if (scores[candidate] !== undefined) {
          scores[candidate] += n - idx;
        }
      });
    });

    return scores;
  }, [candidates, voters]);

  const scores = bordaScores();
  const sortedCandidates = [...candidates].sort(
    (a, b) => scores[b] - scores[a]
  );
  const winner = sortedCandidates[0];

  function moveCandidate(voterIdx: number, candIdx: number, dir: -1 | 1) {
    setVoters((prev) => {
      const next = prev.map((v) => ({ ...v, ranking: [...v.ranking] }));
      const ranking = next[voterIdx].ranking;
      const newIdx = candIdx + dir;
      if (newIdx < 0 || newIdx >= ranking.length) return prev;
      [ranking[candIdx], ranking[newIdx]] = [ranking[newIdx], ranking[candIdx]];
      return next;
    });
  }

  function addCandidate() {
    const name = newCandidate.trim();
    if (!name || candidates.includes(name)) return;
    setCandidates((prev) => [...prev, name]);
    setVoters((prev) =>
      prev.map((v) => ({ ...v, ranking: [...v.ranking, name] }))
    );
    setNewCandidate("");
  }

  function removeCandidate(cand: string) {
    if (candidates.length <= 2) return;
    setCandidates((prev) => prev.filter((c) => c !== cand));
    setVoters((prev) =>
      prev.map((v) => ({ ...v, ranking: v.ranking.filter((c) => c !== cand) }))
    );
  }

  function addVoter() {
    const name = newVoterName.trim();
    if (!name) return;
    setVoters((prev) => [...prev, { name, ranking: [...candidates] }]);
    setNewVoterName("");
  }

  function removeVoter(idx: number) {
    if (voters.length <= 1) return;
    setVoters((prev) => prev.filter((_, i) => i !== idx));
  }

  function resetDefault() {
    setCandidates([...DEFAULT_CANDIDATES]);
    setVoters(
      DEFAULT_VOTERS.map((v) => ({ ...v, ranking: [...v.ranking] }))
    );
  }

  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F8F6F2] rounded-lg">
            <Vote className="w-5 h-5 text-[#1B3A5F]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1B3A5F]">
            投票规则与波德规则
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* 简单多数规则说明 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            简单多数规则
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            每位投票人投一票给最偏好的方案，得票最多的方案获胜。
            简单直接，但可能存在<span className="font-semibold text-red-600">循环悖论</span>（Condorcet
            Paradox）：即使每个投票人的偏好都是理性的，群体偏好也可能出现 A&gt;B&gt;C&gt;A 的循环。
          </p>
        </div>

        {/* 波德规则说明 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            波德规则（Borda Count）
          </h3>
          <p className="text-sm text-emerald-700 leading-relaxed">
            每位投票人对所有方案进行排序。若有 <TeX math="n" />{" "}
            个方案，最优方案得 <TeX math="n" /> 分，次优得{" "}
            <TeX math="n-1" /> 分，以此类推。累计所有投票人的波德数，得分最高的方案获胜。
          </p>
        </div>

        {/* 交互式计算器 */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              交互式波德规则计算器
            </h3>
            <Button variant="outline" size="sm" onClick={resetDefault}>
              重置默认数据
            </Button>
          </div>

          {/* Manage Candidates */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">方案/候选人</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {candidates.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="text-base px-3 py-1 gap-1"
                >
                  {c}
                  <button
                    onClick={() => removeCandidate(c)}
                    className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="新方案名称"
                value={newCandidate}
                onChange={(e) => setNewCandidate(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCandidate()}
                className="w-40"
              />
              <Button size="sm" onClick={addCandidate} variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                添加方案
              </Button>
            </div>
          </div>

          {/* Manage Voters */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">投票人</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {voters.map((v, i) => (
                <Badge
                  key={`${v.name}-${i}`}
                  variant="outline"
                  className="gap-1 px-2 py-1"
                >
                  {v.name}
                  <button
                    onClick={() => removeVoter(i)}
                    className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="投票人姓名"
                value={newVoterName}
                onChange={(e) => setNewVoterName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addVoter()}
                className="w-40"
              />
              <Button size="sm" onClick={addVoter} variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                添加投票人
              </Button>
            </div>
          </div>

          {/* Voter Rankings Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-3 py-2 text-left text-slate-700 rounded-tl-lg">
                    投票人
                  </th>
                  {candidates.map((_, i) => (
                    <th
                      key={i}
                      className="border border-slate-200 px-3 py-2 text-center text-slate-500"
                    >
                      第{i + 1}位
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {voters.map((voter, vi) => (
                  <tr key={`${voter.name}-${vi}`} className="bg-white">
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">
                      {voter.name}
                    </td>
                    {voter.ranking.map((cand, ci) => (
                      <td
                        key={`${voter.name}-${ci}`}
                        className="border border-slate-200 px-2 py-1"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono font-semibold text-slate-700 min-w-[1.5rem] text-center">
                            {cand}
                          </span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveCandidate(vi, ci, -1)}
                              className="text-slate-400 hover:text-emerald-600 disabled:opacity-30"
                              disabled={ci === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveCandidate(vi, ci, 1)}
                              className="text-slate-400 hover:text-emerald-600 disabled:opacity-30"
                              disabled={ci === voter.ranking.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scoring Explanation */}
          <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
            <p className="text-slate-600">
              共 <TeX math={`n=${candidates.length}`} /> 个方案，{" "}
              <TeX math={`m=${voters.length}`} /> 位投票人。第{" "}
              <TeX math="k" /> 位得{" "}
              <TeX math={`n-k+1`} /> 分。
            </p>
          </div>

          {/* Borda Results */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              波德数计算结果
            </h4>
            <div className="space-y-2">
              {sortedCandidates.map((c, i) => {
                const maxScore = Math.max(...Object.values(scores));
                const pct = maxScore > 0 ? (scores[c] / maxScore) * 100 : 0;
                return (
                  <div key={c} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-6">
                      #{i + 1}
                    </span>
                    <span
                      className={`font-mono font-bold w-8 text-center ${
                        c === winner
                          ? "text-yellow-700 text-lg"
                          : "text-slate-700"
                      }`}
                    >
                      {c}
                    </span>
                    <div className="flex-1 bg-white rounded-full h-6 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                          c === winner
                            ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                            : "bg-gradient-to-r from-slate-300 to-slate-400"
                        }`}
                        style={{ width: `${Math.max(pct, 10)}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {scores[c]}
                        </span>
                      </div>
                    </div>
                    {c === winner && (
                      <Badge className="bg-yellow-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        最优
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-yellow-200 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">最优方案：</span>
              <span className="font-bold text-yellow-700 text-lg ml-1">
                {winner}
              </span>
              <span className="ml-2 text-slate-500">
                （波德数 = {scores[winner]}）
              </span>
            </div>
          </div>

          {/* Paradox Demo */}
          <ParadoxDemo />
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Paradox Demonstration
   ============================================================ */
function ParadoxDemo() {
  const [showD, setShowD] = useState(false);

  const candidates2 = showD ? ["A", "B", "C", "D"] : ["A", "B", "C"];
  const voters2 = [
    { name: "张", ranking: showD ? ["A", "C", "D", "B"] : ["A", "C", "B"] },
    { name: "赵", ranking: showD ? ["B", "A", "C", "D"] : ["B", "A", "C"] },
    { name: "王", ranking: showD ? ["C", "B", "D", "A"] : ["C", "B", "A"] },
  ];

  const n = candidates2.length;
  const scores: Record<string, number> = {};
  candidates2.forEach((c) => (scores[c] = 0));
  voters2.forEach((v) => {
    v.ranking.forEach((c, idx) => {
      scores[c] += n - idx;
    });
  });
  const sorted = [...candidates2].sort((a, b) => scores[b] - scores[a]);

  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        无关方案悖论演示
      </h4>
      <p className="text-sm text-red-700 mb-3">
        当加入一个看似无关的方案时，可能改变原有方案的排序！点击切换查看效果。
      </p>
      <Button
        size="sm"
        variant={showD ? "default" : "outline"}
        onClick={() => setShowD(!showD)}
        className="mb-3"
      >
        {showD ? "移除方案D" : "加入方案D"}
      </Button>

      <div className="bg-white rounded-lg p-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium text-slate-700 mb-1">投票人排序</p>
            {voters2.map((v) => (
              <p key={v.name} className="text-slate-600">
                <span className="font-semibold">{v.name}:</span>{" "}
                {v.ranking.join(" > ")}
              </p>
            ))}
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-1">波德数排名</p>
            {sorted.map((c, i) => (
              <p key={c} className="text-slate-600">
                <span className="font-mono">#{i + 1}</span> {c} ={" "}
                <span className="font-semibold">{scores[c]}</span> 分
              </p>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-red-600 font-medium">
          {showD
            ? "注意：加入D后，原有方案的排名可能发生变化！"
            : "当前只有A/B/C三个方案。"}
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   Module 3: 综合加权法
   ============================================================ */
function WeightedMethodSection() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F8F6F2] rounded-lg">
            <BarChart3 className="w-5 h-5 text-[#1B3A5F]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1B3A5F]">综合加权法</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* 步骤 */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">方法步骤</h3>
          <ol className="space-y-2 text-sm text-slate-700">
            {[
              "每个决策者单独对各方案进行多指标决策",
              "计算各方案的算术加权平均分和几何加权平均分",
              "计算混合平均分：",
              "计算总体平均分：",
              "计算评价系数并排序：",
              "计算协调系数 W 检验一致性",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">
                  {i === 2 ? (
                    <>
                      {step}
                      <TeX math="t_i = (p_i + q_i)/2" display />
                    </>
                  ) : i === 3 ? (
                    <>
                      {step}
                      <TeX math="v_i = \sum_{k=1}^{m} \lambda_k t_i^{(k)}" display />
                    </>
                  ) : i === 4 ? (
                    <>
                      {step}
                      <TeX math="e_i = v_i / \sum v_i" display />
                    </>
                  ) : (
                    step
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* 公式展示 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-800 mb-3">核心公式</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormulaCard
              title="算术加权平均分"
              formula="p_i^{(k)} = \sum_{j=1}^{n} w_j u_{ij}^{(k)}"
              desc="对专家k的方案i，按指标权重加权求和"
            />
            <FormulaCard
              title="几何加权平均分"
              formula="q_i^{(k)} = \prod_{j=1}^{n} \left(u_{ij}^{(k)}\right)^{w_j}"
              desc="对专家k的方案i，按指标权重加权连乘"
            />
            <FormulaCard
              title="混合平均分"
              formula="t_i = \frac{p_i + q_i}{2}"
              desc="算术与几何平均的折中"
            />
            <FormulaCard
              title="总体平均分"
              formula="v_i = \sum_{k=1}^{m} \lambda_k t_i^{(k)}"
              desc="综合各专家的加权结果"
            />
            <FormulaCard
              title="评价系数"
              formula="e_i = \frac{v_i}{\sum_{i=1}^{n} v_i}"
              desc="归一化后的综合评分"
            />
            <FormulaCard
              title="协调系数"
              formula="W = \frac{12}{m^2(n^3-n)} \sum_{j=1}^{n} d_j^2"
              desc="检验专家意见一致性程度"
            />
          </div>
        </div>

        {/* 示例计算 */}
        <WeightedExample />
      </CardContent>
    </Card>
  );
}

function FormulaCard({
  title,
  formula,
  desc,
}: {
  title: string;
  formula: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <h4 className="text-sm font-medium text-slate-700 mb-1">{title}</h4>
      <div className="text-sm overflow-x-auto">
        <TeX math={formula} display />
      </div>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  );
}

/* ============================================================
   Weighted Method Example
   ============================================================ */
function WeightedExample() {
  // Example 6-10: 5 schemes, 2 experts, 2 objectives
  // Simplified data for demonstration
  const schemes = ["方案1", "方案2", "方案3", "方案4", "方案5"];
  const experts = ["专家1", "专家2"];
  const weights = [0.5, 0.5]; // w1, w2 for two objectives
  const lambda = [0.5, 0.5]; // expert weights

  // Raw scores: each expert scores each scheme on 2 objectives
  const rawScores: Record<string, Record<string, number[]>> = {
    专家1: {
      方案1: [8, 7],
      方案2: [7, 9],
      方案3: [6, 8],
      方案4: [9, 6],
      方案5: [5, 7],
    },
    专家2: {
      方案1: [7, 8],
      方案2: [8, 7],
      方案3: [9, 6],
      方案4: [6, 9],
      方案5: [7, 5],
    },
  };

  // Calculations
  const arithmeticAvg: Record<string, Record<string, number>> = {};
  const geometricAvg: Record<string, Record<string, number>> = {};
  const mixedAvg: Record<string, Record<string, number>> = {};

  experts.forEach((exp) => {
    arithmeticAvg[exp] = {};
    geometricAvg[exp] = {};
    mixedAvg[exp] = {};
    schemes.forEach((s) => {
      const scores = rawScores[exp][s];
      const p =
        weights[0] * scores[0] + weights[1] * scores[1];
      const q = Math.pow(scores[0], weights[0]) * Math.pow(scores[1], weights[1]);
      arithmeticAvg[exp][s] = parseFloat(p.toFixed(3));
      geometricAvg[exp][s] = parseFloat(q.toFixed(3));
      mixedAvg[exp][s] = parseFloat(((p + q) / 2).toFixed(3));
    });
  });

  // Overall average
  const overallAvg: Record<string, number> = {};
  schemes.forEach((s) => {
    const v =
      lambda[0] * mixedAvg[experts[0]][s] +
      lambda[1] * mixedAvg[experts[1]][s];
    overallAvg[s] = parseFloat(v.toFixed(3));
  });

  // Evaluation coefficient
  const sumV = Object.values(overallAvg).reduce((a, b) => a + b, 0);
  const evalCoeff: Record<string, number> = {};
  schemes.forEach((s) => {
    evalCoeff[s] = parseFloat((overallAvg[s] / sumV).toFixed(4));
  });

  // Ranking
  const sortedSchemes = [...schemes].sort(
    (a, b) => evalCoeff[b] - evalCoeff[a]
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-[#1B3A5F] text-white px-4 py-3">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          示例计算（5个方案，2个专家，2个目标）
        </h3>
        <p className="text-xs text-white/70 mt-1">
          <TeX math="W=(0.5, 0.5)^T" />，<TeX math="\lambda_1=\lambda_2=0.5" />
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Raw Data */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            ① 原始评分数据
          </h4>
          {experts.map((exp) => (
            <div key={exp} className="mb-2">
              <p className="text-xs text-slate-500 mb-1">{exp}（目标1, 目标2）</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        方案
                      </th>
                      {schemes.map((s) => (
                        <th
                          key={s}
                          className="border border-slate-200 px-2 py-1 text-center"
                        >
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-2 py-1 font-medium">
                        目标1
                      </td>
                      {schemes.map((s) => (
                        <td
                          key={s}
                          className="border border-slate-200 px-2 py-1 text-center"
                        >
                          {rawScores[exp][s][0]}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-2 py-1 font-medium">
                        目标2
                      </td>
                      {schemes.map((s) => (
                        <td
                          key={s}
                          className="border border-slate-200 px-2 py-1 text-center"
                        >
                          {rawScores[exp][s][1]}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Arithmetic & Geometric Averages */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            ② 算术加权平均分与几何加权平均分
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-purple-50">
                  <th className="border border-purple-200 px-2 py-1 text-left">
                    计算
                  </th>
                  {schemes.map((s) => (
                    <th
                      key={s}
                      className="border border-purple-200 px-2 py-1 text-center"
                    >
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experts.map((exp) => (
                  <>
                    <tr key={`${exp}-p`}>
                      <td className="border border-slate-200 px-2 py-1 font-medium">
                        {exp} <TeX math="p_i" />
                      </td>
                      {schemes.map((s) => (
                        <td
                          key={s}
                          className="border border-slate-200 px-2 py-1 text-center font-mono"
                        >
                          {arithmeticAvg[exp][s]}
                        </td>
                      ))}
                    </tr>
                    <tr key={`${exp}-q`}>
                      <td className="border border-slate-200 px-2 py-1 font-medium">
                        {exp} <TeX math="q_i" />
                      </td>
                      {schemes.map((s) => (
                        <td
                          key={s}
                          className="border border-slate-200 px-2 py-1 text-center font-mono"
                        >
                          {geometricAvg[exp][s]}
                        </td>
                      ))}
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mixed Average */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            ③ 混合平均分 <TeX math="t_i = (p_i + q_i)/2" />
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="border border-emerald-200 px-2 py-1 text-left">
                    专家
                  </th>
                  {schemes.map((s) => (
                    <th
                      key={s}
                      className="border border-emerald-200 px-2 py-1 text-center"
                    >
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experts.map((exp) => (
                  <tr key={exp}>
                    <td className="border border-slate-200 px-2 py-1 font-medium">
                      {exp}
                    </td>
                    {schemes.map((s) => (
                      <td
                        key={s}
                        className="border border-slate-200 px-2 py-1 text-center font-mono"
                      >
                        {mixedAvg[exp][s]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overall & Evaluation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              ④ 总体平均分{" "}
              <TeX math="v_i = \sum \lambda_k t_i^{(k)}" />
            </h4>
            <div className="bg-emerald-50 rounded-lg p-3">
              {schemes.map((s) => (
                <div
                  key={s}
                  className="flex justify-between text-sm py-0.5"
                >
                  <span className="font-mono text-slate-700">{s}</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {overallAvg[s]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              ⑤ 评价系数 <TeX math="e_i = v_i / \sum v_i" />
            </h4>
            <div className="space-y-1">
              {sortedSchemes.map((s, i) => {
                const pct = (evalCoeff[s] * 100).toFixed(2);
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-6">
                      #{i + 1}
                    </span>
                    <span className="font-mono text-sm w-12">{s}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          i === 0
                            ? "bg-yellow-400"
                            : i === 1
                            ? "bg-slate-300"
                            : "bg-slate-200"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-600 w-16 text-right">
                      {evalCoeff[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Final Result */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 mb-1">最终排名</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {sortedSchemes.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-400 mx-1">&gt;</span>}
                <Badge
                  variant={i === 0 ? "default" : "outline"}
                  className={
                    i === 0
                      ? "bg-yellow-500 text-white text-base px-3 py-1"
                      : "text-sm px-2 py-0.5"
                  }
                >
                  {i === 0 && <Trophy className="w-3 h-3 mr-1" />}
                  {s} ({evalCoeff[s]})
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Module 4: 知识点总结
   ============================================================ */
function SummarySection() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F8F6F2] rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-[#1B3A5F]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1B3A5F]">知识点总结</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="scenarios">
            <AccordionTrigger className="text-slate-800 font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                群体决策适用场景
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 text-sm space-y-2 px-2">
              <ul className="list-disc list-inside space-y-1">
                <li>决策结果影响多个部门或群体的利益</li>
                <li>问题复杂度高，需要多种专业知识</li>
                <li>决策执行需要多方配合与支持</li>
                <li>希望提高决策的合法性和可接受性</li>
                <li>重大战略性决策，风险后果严重</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="comparison">
            <AccordionTrigger className="text-slate-800 font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-500" />
                各方法优缺点对比
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 text-sm px-2">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-orange-50">
                      <th className="border border-orange-200 px-3 py-2 text-left">
                        方法
                      </th>
                      <th className="border border-orange-200 px-3 py-2 text-left">
                        优点
                      </th>
                      <th className="border border-orange-200 px-3 py-2 text-left">
                        缺点
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-slate-200 px-3 py-2 font-medium">
                        简单多数
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        简单直观，易于实施
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        可能产生循环悖论，忽略偏好强度
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 font-medium">
                        波德规则
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        考虑完整排序，减少悖论概率
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        无关方案可能改变结果（不独立）
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-slate-200 px-3 py-2 font-medium">
                        综合加权法
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        结合多指标与多专家，全面系统
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        计算复杂，需要大量数据
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notes">
            <AccordionTrigger className="text-slate-800 font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                注意事项
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 text-sm space-y-2 px-2">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <span className="font-semibold">策略操纵</span>
                  ：投票人可能不投真实偏好，策略性投票可能改变结果
                </li>
                <li>
                  <span className="font-semibold">无关方案独立性</span>
                  ：理想情况下，加入或删除非最优方案不应改变最优方案
                </li>
                <li>
                  <span className="font-semibold">专家权重</span>
                  ：综合加权法中，专家权重的确定对结果影响重大
                </li>
                <li>
                  <span className="font-semibold">协调系数</span>
                  ：W值越接近1，说明专家意见越一致
                </li>
                <li>
                  不存在完美的群体决策方法（Arrow不可能定理），应根据实际情况选择合适方法
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Main Export
   ============================================================ */
export default function GroupDecision() {
  return (
    <>
      <OverviewSection />
      <BordaCountSection />
      <WeightedMethodSection />
      <SummarySection />
    </>
  );
}

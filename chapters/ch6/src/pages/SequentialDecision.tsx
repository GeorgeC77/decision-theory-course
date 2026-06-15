import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  GitBranch,
  TrendingUp,
  Layers,
  Lightbulb,
  CheckCircle2,
  Info,
  ChevronRight,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

/* ────────────────────────────────────────────
   Helper: KaTeX renderer
   ──────────────────────────────────────────── */
function TeX({ formula, display = false }: { formula: string; display?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      katex.render(formula, ref.current, {
        throwOnError: false,
        displayMode: display,
      });
    }
  }, [formula, display]);
  return <span ref={ref} />;
}

/* ────────────────────────────────────────────
   Module 1: 序列决策概述
   ──────────────────────────────────────────── */
function OverviewModule() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-slate-800">
            序列决策问题
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            定义
          </h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            序列决策（Sequential Decision）是指在决策过程中，
            <strong>初始决策之后会产生新的情况</strong>
            ，需要根据新情况进行后续决策，形成
            <strong>多阶段、有先后顺序</strong>的决策链。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: "阶段性",
              desc: "决策分多个阶段进行，各阶段相互关联",
              color: "bg-emerald-50 border-emerald-100 text-emerald-900",
            },
            {
              title: "动态性",
              desc: "后一阶段的决策依赖前一阶段的结果",
              color: "bg-violet-50 border-violet-100 text-violet-900",
            },
            {
              title: "信息更新",
              desc: "随时间推移，可获得更多信息进行修正",
              color: "bg-amber-50 border-amber-100 text-amber-900",
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`${item.color} border rounded-lg p-3 text-sm`}
            >
              <div className="font-semibold mb-1">{item.title}</div>
              <div className="opacity-80">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 mb-3">
            与多阶段决策的区别
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">
                    对比维度
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">
                    序列决策
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">
                    一般多阶段决策
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[
                  [
                    "决策时机",
                    "分阶段逐步做出",
                    "可一次性整体规划",
                  ],
                  [
                    "信息获取",
                    "后续决策可利用前期反馈",
                    "各阶段信息相对独立",
                  ],
                  [
                    "调整能力",
                    "可根据实际情况灵活调整",
                    "通常按预定方案执行",
                  ],
                ].map(([dim, seq, multi]) => (
                  <tr key={dim} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3 font-medium">{dim}</td>
                    <td className="py-2 px-3 text-emerald-700">{seq}</td>
                    <td className="py-2 px-3 text-slate-500">{multi}</td>
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

/* ────────────────────────────────────────────
   Module 2: SVG Decision Tree
   ──────────────────────────────────────────── */

interface NodeInfo {
  label: string;
  detail: string;
}

function DecisionTreeSVG() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);

  const handleNodeHover = (id: string, info: NodeInfo) => {
    setHoveredNode(id);
    setNodeInfo(info);
  };

  const handleNodeLeave = () => {
    setHoveredNode(null);
    setNodeInfo(null);
  };

  // Node positions and colors
  const normalStroke = "#6B6B6B"; // slate-600
  const optStroke = "#C8963E";
  const decisionFill = "#e0f2fe"; // sky-100
  const chanceFill = "#F5EDE0"; // amber-100
  const optFill = "#fef9c3"; // yellow-100

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-slate-800">
            决策树构建方法
          </CardTitle>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          例6-6 石油钻探决策 — 交互式决策树（最优路径以橙色高亮）
        </p>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-slate-600 bg-sky-100 rounded-sm" />
            <span>决策节点 □</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-slate-600 bg-amber-100 rounded-full" />
            <span>机会节点 ○</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-amber-600" />
            <span>最优路径</span>
          </div>
        </div>

        {/* SVG Tree */}
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 900 520"
            className="w-full min-w-[700px]"
            style={{ maxHeight: "520px" }}
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="6"
                markerHeight="4"
                refX="6"
                refY="2"
                orient="auto"
              >
                <path d="M0,0 L6,2 L0,4 Z" fill="#9E9E9E" />
              </marker>
              <marker
                id="arrowOpt"
                markerWidth="6"
                markerHeight="4"
                refX="6"
                refY="2"
                orient="auto"
              >
                <path d="M0,0 L6,2 L0,4 Z" fill="#C8963E" />
              </marker>
            </defs>

            {/* ─── Level 0: Root decision node ─── */}
            {/* D1: decision node */}
            <rect
              x="30"
              y="245"
              width="36"
              height="28"
              rx="3"
              fill={decisionFill}
              stroke={optStroke}
              strokeWidth={hoveredNode === "D1" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("D1", {
                  label: "决策点1（根）",
                  detail: "选择：做地震试验（花费3000）vs 不做试验",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="48" y="263" textAnchor="middle" fontSize="11" fill="#2A4A73">
              D1
            </text>

            {/* ─── D1 → "试验" branch ─── */}
            <line
              x1="66"
              y1="252"
              x2="140"
              y2="120"
              stroke={optStroke}
              strokeWidth="2.5"
              markerEnd="url(#arrowOpt)"
            />
            <text x="85" y="178" fontSize="10" fill={optStroke} fontWeight="bold">
              试验(-3000)
            </text>

            {/* ─── D1 → "不试验" branch ─── */}
            <line
              x1="66"
              y1="266"
              x2="140"
              y2="400"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="85" y="340" fontSize="10" fill="#6B6B6B">
              不试验
            </text>

            {/* ─── Level 1: Chance nodes ─── */}
            {/* C2: result of "试验" */}
            <circle
              cx="160"
              cy="108"
              r="18"
              fill={chanceFill}
              stroke={normalStroke}
              strokeWidth={hoveredNode === "C2" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("C2", {
                  label: "机会节点2",
                  detail: "试验结果：好(概率0.6) vs 不好(概率0.4)",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="160" y="113" textAnchor="middle" fontSize="11" fill="#2A4A73">
              C2
            </text>

            {/* C3: result of "不试验" */}
            <circle
              cx="160"
              cy="412"
              r="18"
              fill={chanceFill}
              stroke={normalStroke}
              strokeWidth={hoveredNode === "C3" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("C3", {
                  label: "机会节点3",
                  detail: "直接钻探结果：出油(0.55) vs 不出油(0.45)",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="160" y="417" textAnchor="middle" fontSize="11" fill="#2A4A73">
              C3
            </text>

            {/* ─── C2 → "好" branch ─── */}
            <line
              x1="178"
              y1="96"
              x2="260"
              y2="50"
              stroke={optStroke}
              strokeWidth="2.5"
              markerEnd="url(#arrowOpt)"
            />
            <text x="200" y="68" fontSize="10" fill={optStroke} fontWeight="bold">
              好(0.6)
            </text>

            {/* ─── C2 → "不好" branch ─── */}
            <line
              x1="178"
              y1="120"
              x2="260"
              y2="166"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="195" y="152" fontSize="10" fill="#6B6B6B">
              不好(0.4)
            </text>

            {/* ─── C3 → branches ─── */}
            <line
              x1="178"
              y1="400"
              x2="260"
              y2="356"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="198" y="374" fontSize="10" fill="#6B6B6B">
              出油(0.55)
            </text>

            <line
              x1="178"
              y1="424"
              x2="260"
              y2="466"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="198" y="454" fontSize="10" fill="#6B6B6B">
              不出油(0.45)
            </text>

            {/* ─── Level 2: Decision nodes under "好" / terminal under C3 ─── */}
            {/* D4: drill or not (after "好") */}
            <rect
              x="260"
              y="36"
              width="36"
              height="28"
              rx="3"
              fill={decisionFill}
              stroke={optStroke}
              strokeWidth={hoveredNode === "D4" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("D4", {
                  label: "决策点4",
                  detail: "试验结果好：钻井(-10000) vs 不钻井",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="278" y="54" textAnchor="middle" fontSize="11" fill="#2A4A73">
              D4
            </text>

            {/* D5: drill or not (after "不好") */}
            <rect
              x="260"
              y="152"
              width="36"
              height="28"
              rx="3"
              fill={decisionFill}
              stroke={normalStroke}
              strokeWidth={hoveredNode === "D5" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("D5", {
                  label: "决策点5",
                  detail: "试验结果不好：钻井(-10000) vs 不钻井",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="278" y="170" textAnchor="middle" fontSize="11" fill="#2A4A73">
              D5
            </text>

            {/* Terminal nodes under C3 */}
            {/* D8-like decision node under C3 */}
            <rect
              x="260"
              y="342"
              width="36"
              height="28"
              rx="3"
              fill={decisionFill}
              stroke={normalStroke}
              strokeWidth={hoveredNode === "D8" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("D8", {
                  label: "决策点8",
                  detail: "不做试验：钻井(-10000) vs 不钻井",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="278" y="360" textAnchor="middle" fontSize="11" fill="#2A4A73">
              D8
            </text>

            {/* Terminal: no drill after C3 */}
            <rect
              x="260"
              y="452"
              width="70"
              height="26"
              rx="3"
              fill="#f1f5f9"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            <text x="295" y="469" textAnchor="middle" fontSize="9" fill="#6B6B6B">
              不钻: U=0.68
            </text>

            {/* ─── D4 branches ─── */}
            <line
              x1="296"
              y1="42"
              x2="380"
              y2="22"
              stroke={optStroke}
              strokeWidth="2.5"
              markerEnd="url(#arrowOpt)"
            />
            <text x="320" y="32" fontSize="9" fill={optStroke} fontWeight="bold">
              钻井(-10000)
            </text>

            <line
              x1="296"
              y1="58"
              x2="380"
              y2="78"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="320" y="74" fontSize="9" fill="#6B6B6B">
              不钻井
            </text>

            {/* ─── D5 branches ─── */}
            <line
              x1="296"
              y1="158"
              x2="380"
              y2="138"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="320" y="144" fontSize="9" fill="#6B6B6B">
              钻井(-10000)
            </text>

            <line
              x1="296"
              y1="174"
              x2="380"
              y2="194"
              stroke={optStroke}
              strokeWidth="2.5"
              markerEnd="url(#arrowOpt)"
            />
            <text x="320" y="190" fontSize="9" fill={optStroke} fontWeight="bold">
              不钻井
            </text>

            {/* ─── D8 branches ─── */}
            <line
              x1="296"
              y1="348"
              x2="380"
              y2="328"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="320" y="334" fontSize="9" fill="#6B6B6B">
              钻井(-10000)
            </text>

            <line
              x1="296"
              y1="364"
              x2="380"
              y2="384"
              stroke={optStroke}
              strokeWidth="2.5"
              markerEnd="url(#arrowOpt)"
            />
            <text x="320" y="380" fontSize="9" fill={optStroke} fontWeight="bold">
              不钻井
            </text>

            {/* ─── Level 3: Chance/Terminal nodes ─── */}
            {/* C6: drilling result after "good" + drill */}
            <circle
              cx="400"
              cy="22"
              r="18"
              fill={chanceFill}
              stroke={optStroke}
              strokeWidth={hoveredNode === "C6" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("C6", {
                  label: "机会节点6",
                  detail: "结果好且钻井：出油(0.85) vs 不出油(0.15)",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="400" y="27" textAnchor="middle" fontSize="11" fill="#2A4A73">
              C6
            </text>

            {/* Terminal: not drill after "good" → loss 3000, U=0.6 */}
            <rect
              x="380"
              y="66"
              width="80"
              height="26"
              rx="3"
              fill={optFill}
              stroke={optStroke}
              strokeWidth="1.5"
            />
            <text x="420" y="83" textAnchor="middle" fontSize="9" fill="#2A4A73">
              U(-3000)=0.60
            </text>

            {/* C7: drilling result after "bad" + drill */}
            <circle
              cx="400"
              cy="138"
              r="18"
              fill={chanceFill}
              stroke={normalStroke}
              strokeWidth={hoveredNode === "C7" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("C7", {
                  label: "机会节点7",
                  detail: "结果不好且钻井：出油(0.10) vs 不出油(0.90)",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="400" y="143" textAnchor="middle" fontSize="11" fill="#2A4A73">
              C7
            </text>

            {/* Terminal: not drill after "bad" → loss 3000, U=0.6 */}
            <rect
              x="380"
              y="182"
              width="80"
              height="26"
              rx="3"
              fill={optFill}
              stroke={optStroke}
              strokeWidth="1.5"
            />
            <text x="420" y="199" textAnchor="middle" fontSize="9" fill="#2A4A73">
              U(-3000)=0.60
            </text>

            {/* C9: drilling result after "no test" + drill */}
            <circle
              cx="400"
              cy="328"
              r="18"
              fill={chanceFill}
              stroke={normalStroke}
              strokeWidth={hoveredNode === "C9" ? 3 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() =>
                handleNodeHover("C9", {
                  label: "机会节点9",
                  detail: "不做试验且钻井：出油(0.55) vs 不出油(0.45)",
                })
              }
              onMouseLeave={handleNodeLeave}
            />
            <text x="400" y="333" textAnchor="middle" fontSize="11" fill="#2A4A73">
              C9
            </text>

            {/* Terminal: not drill after "no test" → 0, U=0.68 */}
            <rect
              x="380"
              y="372"
              width="80"
              height="26"
              rx="3"
              fill={optFill}
              stroke={optStroke}
              strokeWidth="1.5"
            />
            <text x="420" y="389" textAnchor="middle" fontSize="9" fill="#2A4A73">
              U(0)=0.68
            </text>

            {/* ─── C6 branches → terminals ─── */}
            <line
              x1="418"
              y1="12"
              x2="510"
              y2="6"
              stroke={optStroke}
              strokeWidth="2.5"
              markerEnd="url(#arrowOpt)"
            />
            <text x="440" y="10" fontSize="9" fill={optStroke} fontWeight="bold">
              出油(0.85)
            </text>

            <line
              x1="418"
              y1="32"
              x2="510"
              y2="38"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="440" y="36" fontSize="9" fill="#6B6B6B">
              不出油(0.15)
            </text>

            {/* ─── C7 branches → terminals ─── */}
            <line
              x1="418"
              y1="128"
              x2="510"
              y2="122"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="440" y="126" fontSize="9" fill="#6B6B6B">
              出油(0.10)
            </text>

            <line
              x1="418"
              y1="148"
              x2="510"
              y2="154"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="440" y="152" fontSize="9" fill="#6B6B6B">
              不出油(0.90)
            </text>

            {/* ─── C9 branches → terminals ─── */}
            <line
              x1="418"
              y1="318"
              x2="510"
              y2="312"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="440" y="316" fontSize="9" fill="#6B6B6B">
              出油(0.55)
            </text>

            <line
              x1="418"
              y1="338"
              x2="510"
              y2="344"
              stroke={normalStroke}
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x="440" y="342" fontSize="9" fill="#6B6B6B">
              不出油(0.45)
            </text>

            {/* ─── Terminal nodes ─── */}
            {/* C6 terminals */}
            <rect
              x="510"
              y="0"
              width="100"
              height="22"
              rx="3"
              fill={optFill}
              stroke={optStroke}
              strokeWidth="2"
            />
            <text x="560" y="14" textAnchor="middle" fontSize="9" fill="#2A4A73" fontWeight="bold">
              收入27000, U=0.98
            </text>

            <rect
              x="510"
              y="28"
              width="100"
              height="22"
              rx="3"
              fill="#f1f5f9"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            <text x="560" y="42" textAnchor="middle" fontSize="9" fill="#6B6B6B">
              损失13000, U=0
            </text>

            {/* C7 terminals */}
            <rect
              x="510"
              y="112"
              width="100"
              height="22"
              rx="3"
              fill="#f1f5f9"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            <text x="560" y="126" textAnchor="middle" fontSize="9" fill="#6B6B6B">
              收入27000, U=0.98
            </text>

            <rect
              x="510"
              y="140"
              width="100"
              height="22"
              rx="3"
              fill="#f1f5f9"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            <text x="560" y="154" textAnchor="middle" fontSize="9" fill="#6B6B6B">
              损失13000, U=0
            </text>

            {/* C9 terminals */}
            <rect
              x="510"
              y="302"
              width="100"
              height="22"
              rx="3"
              fill="#f1f5f9"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            <text x="560" y="316" textAnchor="middle" fontSize="9" fill="#6B6B6B">
              收入30000, U=1
            </text>

            <rect
              x="510"
              y="330"
              width="100"
              height="22"
              rx="3"
              fill="#f1f5f9"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            <text x="560" y="344" textAnchor="middle" fontSize="9" fill="#6B6B6B">
              损失10000, U=0.27
            </text>

            {/* ─── Backward induction labels on the right ─── */}
            <rect
              x="640"
              y="0"
              width="250"
              height="230"
              rx="6"
              fill="#fffbeb"
              stroke="#fcd34d"
              strokeWidth="1"
            />
            <text x="650" y="20" fontSize="12" fill="#1B3A5F" fontWeight="bold">
              逆序归纳计算过程
            </text>

            <text x="650" y="42" fontSize="10" fill="#78350f">
              D6: max&#123;0.85×0.98+0.15×0, 0.6&#125;
            </text>
            <text x="660" y="56" fontSize="10" fill={optStroke} fontWeight="bold">
              = max&#123;0.833, 0.6&#125; = 0.833 ✓ 钻井
            </text>

            <text x="650" y="78" fontSize="10" fill="#78350f">
              D7: max&#123;0.10×0.98+0.90×0, 0.6&#125;
            </text>
            <text x="660" y="92" fontSize="10" fill={optStroke} fontWeight="bold">
              = max&#123;0.098, 0.6&#125; = 0.60 ✗ 不钻井
            </text>

            <text x="650" y="114" fontSize="10" fill="#78350f">
              D8: max&#123;0.55×1+0.45×0.27, 0.68&#125;
            </text>
            <text x="660" y="128" fontSize="10" fill={optStroke} fontWeight="bold">
              = max&#123;0.672, 0.68&#125; = 0.68 ✗ 不钻井
            </text>

            <line x1="650" y1="140" x2="880" y2="140" stroke="#fcd34d" strokeWidth="1" />

            <text x="650" y="158" fontSize="10" fill="#78350f">
              C2: 0.6 × 0.833 + 0.4 × 0.60
            </text>
            <text x="660" y="172" fontSize="10" fill={optStroke} fontWeight="bold">
              = 0.4998 + 0.24 = 0.7398
            </text>

            <text x="650" y="194" fontSize="10" fill="#78350f">
              D1: max&#123;0.7398, 0.68&#125;
            </text>
            <text x="660" y="208" fontSize="10" fill={optStroke} fontWeight="bold">
              = 0.7398 ✓ 做试验
            </text>

            {/* Final conclusion */}
            <rect
              x="640"
              y="250"
              width="250"
              height="55"
              rx="6"
              fill="#ecfdf5"
              stroke="#6ee7b7"
              strokeWidth="1"
            />
            <text x="650" y="270" fontSize="11" fill="#065f46" fontWeight="bold">
              最优决策序列：
            </text>
            <text x="650" y="290" fontSize="10" fill="#065f46">
              做试验 → 结果好则钻井，结果不好则不钻井
            </text>
          </svg>
        </div>

        {/* Hover info */}
        {nodeInfo && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
            <div className="font-medium text-slate-800">{nodeInfo.label}</div>
            <div className="text-slate-600 mt-1">{nodeInfo.detail}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────
   Module 3: 连续情形决策分析 (例6-2)
   ──────────────────────────────────────────── */
function ContinuousDecisionModule() {
  const [activeYear, setActiveYear] = useState<number | null>(null);

  const solutionSteps = [
    {
      year: 4,
      title: "第四年（最后一年）",
      desc: "剩余资金全部投入产出率最高的方案",
      result: "f_4(s_4) = \\max\\{2000s_4, 3000s_4\\} = 3000s_4",
      choice: "方案2（y₄ = s₄）",
    },
    {
      year: 3,
      title: "第三年",
      desc: "考虑第三年及以后的累计收益",
      result: "f_3(s_3) = \\max\\{8000s_3, 7800s_3\\} = 8000s_3",
      choice: "方案1（x₃ = s₃）",
    },
    {
      year: 2,
      title: "第二年",
      desc: "两年累计收益最大化",
      result: "f_2(s_2) = \\max\\{11800s_2, 12000s_2\\} = 12000s_2",
      choice: "方案2（y₂ = s₂）",
    },
    {
      year: 1,
      title: "第一年",
      desc: "四年累计总收益最大化",
      result: "f_1(s_1) = \\max\\{23720s_1, 23600s_1\\} = 23720s_1",
      choice: "方案1（x₁ = s₁ = 10万）",
    },
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-slate-800">
            例6-2 连续情形决策分析
          </CardTitle>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          10万元资金四年分配问题 — 逆序归纳法求解
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Problem description */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 mb-2">问题描述</h4>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            某工厂现有
            <strong>10万元</strong>
            资金可供生产某种产品使用，生产过程有两个方案，需要在
            <strong>四年</strong>
            内进行资金分配决策。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-md p-3">
              <Badge variant="outline" className="mb-2 text-xs">
                方案1
              </Badge>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>每万元每年利润：0.5万元</li>
                <li>年产量：2000吨/万元</li>
              </ul>
            </div>
            <div className="bg-white border border-slate-200 rounded-md p-3">
              <Badge variant="outline" className="mb-2 text-xs">
                方案2
              </Badge>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>每万元每年利润：0.2万元</li>
                <li>年产量：3000吨/万元</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div>
          <h4 className="font-medium text-slate-800 mb-2">约束条件</h4>
          <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
            <div className="text-sm space-y-1 text-slate-700">
              <div>
                <TeX formula="x_1 + y_1 = 10" display />
              </div>
              <div>
                <TeX formula="x_2 + y_2 = 0.5x_1 + 0.2y_1" display />
              </div>
              <div>
                <TeX
                  formula="x_3 + y_3 = 0.5(x_1+x_2) + 0.2(y_1+y_2)"
                  display
                />
              </div>
              <div>
                <TeX
                  formula="x_4 + y_4 = 0.5(x_1+x_2+x_3) + 0.2(y_1+y_2+y_3)"
                  display
                />
              </div>
              <div>
                <TeX formula="x_i, y_i \\geq 0 \\quad (i=1,2,3,4)" display />
              </div>
            </div>
          </div>
        </div>

        {/* Objective function */}
        <div>
          <h4 className="font-medium text-slate-800 mb-2">目标函数</h4>
          <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
            <div className="text-sm text-slate-700">
              <TeX
                formula="\\max Q = \\sum_{i=1}^{4}(4-i+1)(2000x_i + 3000y_i)"
                display
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Backward induction solution */}
        <div>
          <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            逆序归纳法求解过程
          </h4>

          <div className="space-y-2">
            {solutionSteps.map((step) => (
              <div
                key={step.year}
                className={`border rounded-lg cursor-pointer transition-all ${
                  activeYear === step.year
                    ? "border-blue-300 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
                onClick={() =>
                  setActiveYear(activeYear === step.year ? null : step.year)
                }
              >
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.year === 1
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {step.year}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500">{step.desc}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeYear === step.year ? "rotate-90" : ""
                    }`}
                  />
                </div>
                {activeYear === step.year && (
                  <div className="px-3 pb-3 pl-14">
                    <div className="bg-white border border-slate-200 rounded-md p-3 text-sm space-y-2">
                      <div className="text-slate-700">
                        <TeX formula={step.result} />
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-700 font-medium">
                          {step.choice}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final result */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">最优策略</h4>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            第一年将全部10万元资金分配给
            <strong>方案1</strong>
            ，之后每年产生的利润全部投入
            <strong>方案2</strong>
            。此策略可在四年内获得最大累计产量。
          </p>
          <div className="mt-3 p-2 bg-white/60 rounded-md">
            <p className="text-xs text-amber-700 font-medium">
              关键思路：方案1利润率高（ reinvestment能力强），方案2产量高（单位资金产出多）。先积累资本再转产高量方案。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────
   Module 4: Knowledge Summary (Accordion)
   ──────────────────────────────────────────── */
function SummaryModule() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-slate-800">
            知识点总结
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Applicable conditions */}
          <AccordionItem value="conditions" className="border-slate-200">
            <AccordionTrigger className="text-sm font-medium text-slate-800 hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                适用条件
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 space-y-2">
              <ul className="space-y-2 pl-6 list-disc">
                <li>
                  决策问题可以分解为
                  <strong>多个阶段</strong>，每个阶段需要做出决策
                </li>
                <li>
                  后一阶段的决策
                  <strong>依赖于</strong>前一阶段的决策结果和状态
                </li>
                <li>
                  每个阶段面临的选择和结果可以用
                  <strong>概率分布</strong>描述
                </li>
                <li>
                  存在明确的<strong>效用函数</strong>或收益度量标准
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Solution steps */}
          <AccordionItem value="steps" className="border-slate-200">
            <AccordionTrigger className="text-sm font-medium text-slate-800 hover:no-underline">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-500" />
                求解步骤（逆序归纳法）
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600">
              <ol className="space-y-3 pl-6 list-decimal">
                <li>
                  <strong className="text-slate-800">构建决策树</strong>
                  <p className="text-slate-500 mt-1">
                    从左至右绘制决策节点（□）和机会节点（○），标注各分枝的概率和收益
                  </p>
                </li>
                <li>
                  <strong className="text-slate-800">计算终端效用</strong>
                  <p className="text-slate-500 mt-1">
                    确定各结局节点的效用值（或货币收益值）
                  </p>
                </li>
                <li>
                  <strong className="text-slate-800">
                    从最右端开始逆序计算
                  </strong>
                  <p className="text-slate-500 mt-1">
                    机会节点：计算期望效用 = Σ(概率 × 子节点效用)
                  </p>
                  <p className="text-slate-500">
                    决策节点：取max&#123;各选择分支的效用&#125;
                  </p>
                </li>
                <li>
                  <strong className="text-slate-800">确定最优策略</strong>
                  <p className="text-slate-500 mt-1">
                    从根节点沿最优选择路径追踪，得到完整决策序列
                  </p>
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* Key points */}
          <AccordionItem value="keypoints" className="border-slate-200">
            <AccordionTrigger className="text-sm font-medium text-slate-800 hover:no-underline">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                关键要点
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 space-y-2">
              <ul className="space-y-2 pl-6 list-disc">
                <li>
                  决策树的<strong>决策节点</strong>用方形 □ 表示，代表决策者可以主动选择的点
                </li>
                <li>
                  <strong>机会节点</strong>用圆形 ○ 表示，代表不受决策者控制的自然状态
                </li>
                <li>
                  逆序归纳法保证了所求策略是
                  <strong>全局最优</strong>，而非局部最优
                </li>
                <li>
                  当存在信息收集（如试验）选项时，需要比较
                  <strong>信息价值与获取成本</strong>
                </li>
                <li>
                  对于连续资源分配问题，逆序归纳法可转化为
                  <strong>动态规划</strong>求解
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────
   Main Page Component
   ──────────────────────────────────────────── */
function BookOpen(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export default function SequentialDecision() {
  return (
    <TooltipProvider>
      <>
        {/* Module 1: Overview */}
        <OverviewModule />

        {/* Module 2: Decision Tree */}
        <DecisionTreeSVG />

        {/* Module 3: Continuous Decision */}
        <ContinuousDecisionModule />

        {/* Module 4: Summary */}
        <SummaryModule />
      </>
    </TooltipProvider>
  );
}

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Lightbulb,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

/* ─── KaTeX helper ─── */
function KaTeX({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: false });
    } catch {
      return tex;
    }
  }, [tex, display]);

  return (
    <span
      className={display ? "block my-3 overflow-x-auto" : "inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ─── Matrix math utilities ─── */
function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const m = b[0].length;
  const p = b.length;
  const result: number[][] = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < p; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

function matrixPower(mat: number[][], power: number): number[][] {
  const n = mat.length;
  if (power === 1) return mat.map((row) => [...row]);
  let result: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j): number => (i === j ? 1 : 0))
  );
  let base = mat.map((row) => [...row]);
  let p = power;
  while (p > 0) {
    if (p % 2 === 1) {
      result = multiplyMatrices(result, base);
    }
    base = multiplyMatrices(base, base);
    p = Math.floor(p / 2);
  }
  return result;
}

/* Solve steady-state probabilities using Gaussian elimination */
function solveSteadyState(P: number[][]): number[] | null {
  const n = P.length;
  // Build augmented matrix for: π_j = Σ_i π_i * P_ij, Σ π_i = 1
  // Use equation: π(P^T - I) = 0, with Σπ_i = 1 replacing last equation
  const A: number[][] = [];
  for (let j = 0; j < n; j++) {
    const row: number[] = [];
    for (let i = 0; i < n; i++) {
      row.push(i === j ? P[i][j] - 1 : P[i][j]);
    }
    row.push(0);
    A.push(row);
  }
  // Replace last equation with Σ π_i = 1
  for (let i = 0; i < n; i++) {
    A[n - 1][i] = 1;
  }
  A[n - 1][n] = 1;

  // Gaussian elimination
  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
        maxRow = row;
      }
    }
    if (Math.abs(A[maxRow][col]) < 1e-10) continue;
    [A[col], A[maxRow]] = [A[maxRow], A[col]];

    // Eliminate
    for (let row = col + 1; row < n; row++) {
      const factor = A[row][col] / A[col][col];
      for (let j = col; j <= n; j++) {
        A[row][j] -= factor * A[col][j];
      }
    }
  }

  // Back substitution
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(A[i][i]) < 1e-10) continue;
    let sum = A[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= A[i][j] * x[j];
    }
    x[i] = sum / A[i][i];
  }

  // Validate: all non-negative and sum to ~1
  const sum = x.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-6 || x.some((v) => v < -1e-6)) return null;

  // Normalize
  return x.map((v) => (sum > 0 ? v / sum : 0));
}

/* ─── Matrix Input Component ─── */
function MatrixEditor({
  matrix,
  labels,
  onChange,
  readOnly = false,
}: {
  matrix: number[][];
  labels: string[];
  onChange?: (m: number[][]) => void;
  readOnly?: boolean;
}) {
  const handleChange = (i: number, j: number, val: string) => {
    if (!onChange || readOnly) return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const newMat = matrix.map((row) => [...row]);
    newMat[i][j] = num;
    onChange(newMat);
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-slate-600 w-8" />
        <div className="flex gap-1">
          {labels.map((l, i) => (
            <span key={i} className="w-16 text-center text-xs text-slate-500 font-medium">
              {l}
            </span>
          ))}
        </div>
      </div>
      {matrix.map((row, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="text-sm font-medium text-slate-600 w-8 text-right pr-1">
            {labels[i]}
          </span>
          <div className="flex gap-1">
            {row.map((val, j) => (
              <Input
                key={j}
                type="number"
                step={0.01}
                min={0}
                max={1}
                value={val}
                readOnly={readOnly}
                onChange={(e) => handleChange(i, j, e.target.value)}
                className={`w-16 h-9 text-center text-sm font-mono p-1 ${
                  readOnly
                    ? "bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-white border-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Matrix Display (LaTeX) ─── */
function MatrixLatex({ matrix, name }: { matrix: number[][]; name?: string }) {
  const tex =
    (name ? name + " = " : "") +
    "\\begin{bmatrix}" +
    matrix.map((row) => row.map((v) => v.toFixed(3)).join(" & ")).join(" \\\\") +
    "\\end{bmatrix}";
  return <KaTeX tex={tex} display />;
}

/* ─── Convergence Bar Chart ─── */
function ConvergenceChart({ matrices }: { matrices: number[][][] }) {
  const n = matrices[0]?.length || 0;
  const powers = ["P", "P^2", "P^3"];

  return (
    <div className="space-y-3">
      {Array.from({ length: n }, (_, stateIdx) => (
        <div key={stateIdx}>
          <div className="text-xs font-medium text-slate-600 mb-1">
            从 S_{stateIdx + 1} 出发的转移概率
          </div>
          <div className="flex items-end gap-2 h-24">
            {matrices.map((mat, pi) =>
              mat[stateIdx].map((val, sj) => (
                <div
                  key={`${pi}-${sj}`}
                  className="flex flex-col items-center gap-0.5"
                  style={{ width: `${100 / (n * matrices.length)}%` }}
                >
                  <span className="text-[10px] text-slate-500">{val.toFixed(2)}</span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max(val * 80, 4)}px`,
                      backgroundColor:
                        sj === 0
                          ? `hsl(220, 70%, ${60 - pi * 10}%)`
                          : `hsl(340, 70%, ${60 - pi * 10}%)`,
                    }}
                  />
                  <span className="text-[9px] text-slate-400">
                    {powers[pi]}→S_{sj + 1}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function MarkovDecision() {
  // Module 2: Interactive matrix state
  const [matrixSize, setMatrixSize] = useState<2 | 3>(2);
  const [transitionMatrix, setTransitionMatrix] = useState<number[][]>([
    [0.8, 0.2],
    [0.4, 0.6],
  ]);
  const [customLabels, setCustomLabels] = useState<string[]>(["S_1", "S_2"]);
  const [steadyResult, setSteadyResult] = useState<number[] | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("p1");

  // Module 3: Example 6-7 matrix
  const [exampleMatrix, setExampleMatrix] = useState<number[][]>([
    [0.8, 0.2],
    [0.4, 0.6],
  ]);
  const [exampleSteady, setExampleSteady] = useState<number[] | null>(null);
  const [exampleRowError, setExampleRowError] = useState<string | null>(null);

  // Ad strategy matrices
  const noAdMatrix = [
    [0.8, 0.2],
    [0.4, 0.6],
  ];
  const adMatrix = [
    [0.9, 0.1],
    [0.7, 0.3],
  ];

  const validateRows = useCallback(
    (m: number[][]) => {
      for (let i = 0; i < m.length; i++) {
        const sum = m[i].reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1) > 0.01 || m[i].some((v) => v < 0)) {
          setRowError(`第 ${i + 1} 行概率之和为 ${sum.toFixed(3)} 或存在负数，应为 1 且各元素非负`);
          return false;
        }
      }
      setRowError(null);
      return true;
    },
    []
  );

  const handleMatrixChange = useCallback(
    (newMat: number[][]) => {
      setTransitionMatrix(newMat);
      validateRows(newMat);
      setSteadyResult(null);
    },
    [validateRows]
  );

  const handleSizeChange = useCallback(
    (size: 2 | 3) => {
      setMatrixSize(size);
      if (size === 2) {
        setTransitionMatrix([
          [0.8, 0.2],
          [0.4, 0.6],
        ]);
        setCustomLabels(["S_1", "S_2"]);
      } else {
        setTransitionMatrix([
          [0.7, 0.2, 0.1],
          [0.3, 0.5, 0.2],
          [0.1, 0.3, 0.6],
        ]);
        setCustomLabels(["S_1", "S_2", "S_3"]);
      }
      setSteadyResult(null);
      setRowError(null);
    },
    []
  );

  const computeSteady = useCallback(() => {
    if (!validateRows(transitionMatrix)) return;
    const result = solveSteadyState(transitionMatrix);
    setSteadyResult(result);
  }, [transitionMatrix, validateRows]);

  const validateExampleRows = useCallback((m: number[][]) => {
    for (let i = 0; i < m.length; i++) {
      const sum = m[i].reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 0.01 || m[i].some((v) => v < 0)) {
        setExampleRowError(`第 ${i + 1} 行概率之和为 ${sum.toFixed(3)} 或存在负数，应为 1 且各元素非负`);
        return false;
      }
    }
    setExampleRowError(null);
    return true;
  }, []);

  const computeExampleSteady = useCallback(() => {
    if (!validateExampleRows(exampleMatrix)) return;
    const result = solveSteadyState(exampleMatrix);
    setExampleSteady(result);
  }, [exampleMatrix, validateExampleRows]);

  const p2 = useMemo(() => matrixPower(transitionMatrix, 2), [transitionMatrix]);
  const p3 = useMemo(() => matrixPower(transitionMatrix, 3), [transitionMatrix]);

  const profitS1 = 100;
  const profitS2 = 30;
  const longTermProfit = exampleSteady
    ? exampleSteady[0] * profitS1 + exampleSteady[1] * profitS2
    : null;

  // Ad strategy calculations
  const noAdP2 = useMemo(() => matrixPower(noAdMatrix, 2), []);
  const noAdP3 = useMemo(() => matrixPower(noAdMatrix, 3), []);
  const adW2 = useMemo(() => matrixPower(adMatrix, 2), []);
  const adW3 = useMemo(() => matrixPower(adMatrix, 3), []);

  const noAdYear1 = 100 * 0.8 + 30 * 0.2;
  const noAdYear2 = 100 * noAdP2[0][0] + 30 * noAdP2[0][1];
  const noAdYear3 = 100 * noAdP3[0][0] + 30 * noAdP3[0][1];
  const noAdTotal = noAdYear1 + noAdYear2 + noAdYear3;

  const adYear1 = 100 * 0.9 + 30 * 0.1 - 15;
  const adYear2 = 100 * adW2[0][0] + 30 * adW2[0][1] - 15;
  const adYear3 = 100 * adW3[0][0] + 30 * adW3[0][1] - 15;
  const adTotal = adYear1 + adYear2 + adYear3;

  return (
    <>
      {/* ════════════════════════════════════════════
          Module 1: 马尔可夫链决策分析概述
      ════════════════════════════════════════════ */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F8F6F2] rounded-lg">
              <BookOpen className="h-5 w-5 text-[#1B3A5F]" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1B3A5F]">马尔可夫链决策分析</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-700 leading-relaxed">
            有一类决策问题，虽然采取的行动已经确定，但将这个行动付诸实践的过程又分为几个时期。在不同的时期，系统可以处在不同的状态，而这些状态发生的概率又可受前面时期实际所处状态的影响。
          </p>

          <Alert className="bg-amber-50 border-amber-200">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>马尔可夫性（无后效性）</strong>：系统的下一状态只与当前状态有关，而与之前的历史状态无关。
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, title: "市场预测", desc: "产品畅销/滞销状态转移分析" },
              { icon: BarChart3, title: "广告策略", desc: "评估广告投放对状态转移的影响" },
              { icon: RefreshCw, title: "设备维修", desc: "机器运行/故障状态决策" },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-slate-50 rounded-lg p-4 border border-slate-200"
              >
                <item.icon className="h-5 w-5 text-indigo-500 mb-2" />
                <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════
          Module 2: 状态转移矩阵与稳态概率
      ════════════════════════════════════════════ */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F8F6F2] rounded-lg">
              <Calculator className="h-5 w-5 text-[#1B3A5F]" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1B3A5F]">状态转移矩阵与稳态概率</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula section */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
            <p className="text-sm text-slate-600">稳态概率满足以下方程组：</p>
            <KaTeX tex="\pi = \pi P" display />
            <KaTeX tex="\sum_{i} \pi_i = 1" display />
            <p className="text-xs text-slate-500 mt-2">
              其中 <KaTeX tex="\pi = {[\pi_1, \pi_2, \dots, \pi_n]}" /> 为稳态概率向量，P 为状态转移矩阵。
            </p>
          </div>

          {/* Interactive Matrix Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-slate-800">交互式转移矩阵编辑器</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={matrixSize === 2 ? "default" : "outline"}
                  onClick={() => handleSizeChange(2)}
                >
                  2×2 矩阵
                </Button>
                <Button
                  size="sm"
                  variant={matrixSize === 3 ? "default" : "outline"}
                  onClick={() => handleSizeChange(3)}
                >
                  3×3 矩阵
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">P =</span>
                <MatrixEditor
                  matrix={transitionMatrix}
                  labels={customLabels}
                  onChange={handleMatrixChange}
                />
              </div>

              {rowError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{rowError}</span>
                </div>
              )}

              {!rowError && (
                <div className="flex items-center gap-1 text-emerald-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>每行概率之和正确</span>
                </div>
              )}

              <Button
                onClick={computeSteady}
                disabled={!!rowError}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Calculator className="h-4 w-4 mr-2" />
                计算稳态概率
              </Button>

              {steadyResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 w-full max-w-md">
                  <h4 className="font-semibold text-emerald-800 mb-2">稳态概率结果</h4>
                  <div className="space-y-1">
                    {steadyResult.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <KaTeX tex={`\\pi_${i + 1}`} />
                        <span className="text-emerald-700 font-mono">
                          = {v.toFixed(4)} ({((v) * 100).toFixed(2)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-200">
                    <KaTeX
                      tex={`\\pi = [${steadyResult.map((v) => v.toFixed(3)).join(", ")}]`}
                      display
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multi-step Transfer Visualization */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800">多步转移矩阵可视化</h3>
            {rowError ? (
              <div className="rounded-lg p-4 text-sm font-medium" style={{ background: '#FDE8E8', border: '1px solid #fecaca', color: '#dc2626' }}>
                请先修正转移矩阵，使每行概率非负且和为 1。
              </div>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="p1">P（一步）</TabsTrigger>
                    <TabsTrigger value="p2">P²（二步）</TabsTrigger>
                    <TabsTrigger value="p3">P³（三步）</TabsTrigger>
                  </TabsList>
                  <TabsContent value="p1">
                    <MatrixLatex matrix={transitionMatrix} name="P" />
                  </TabsContent>
                  <TabsContent value="p2">
                    <MatrixLatex matrix={p2} name="P^2" />
                  </TabsContent>
                  <TabsContent value="p3">
                    <MatrixLatex matrix={p3} name="P^3" />
                  </TabsContent>
                </Tabs>

                {/* Convergence chart */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    矩阵幂变化趋势（从各状态出发）
                  </h4>
                  <ConvergenceChart matrices={[transitionMatrix, p2, p3]} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════
          Module 3: 应用举例
      ════════════════════════════════════════════ */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F8F6F2] rounded-lg">
              <BarChart3 className="h-5 w-5 text-[#1B3A5F]" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1B3A5F]">例6-7 畅销与滞销状态转移决策</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Problem description */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-700 leading-relaxed">
              某产品在市场上有两种状态：畅销
              <KaTeX tex="(S_1)" /> 和滞销
              <KaTeX tex="(S_2)" />。根据历史数据，状态转移矩阵如下。畅销时每年可获利润100万元，滞销时每年可获利润30万元。求长期经营下的年期望利润。
            </p>
          </div>

          {/* Editable example matrix */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">转移矩阵（可编辑）</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">P =</span>
                <MatrixEditor
                  matrix={exampleMatrix}
                  labels={["S_1", "S_2"]}
                  onChange={(m) => {
                    setExampleMatrix(m);
                    setExampleSteady(null);
                    validateExampleRows(m);
                  }}
                />
              </div>
              {exampleRowError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {exampleRowError}
                </p>
              )}
              <Button
                size="sm"
                onClick={computeExampleSteady}
                disabled={!!exampleRowError}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Calculator className="h-4 w-4 mr-2" />
                求解稳态概率
              </Button>
              {exampleRowError && (
                <p className="text-xs text-amber-700">
                  请先修正转移矩阵，使每行概率非负且和为1。
                </p>
              )}
            </div>
          </div>

          {/* Steady state calculation */}
          {exampleSteady && (
            <div className="space-y-4">
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                <h4 className="font-semibold text-violet-800 mb-2">稳态概率求解过程</h4>
                <p className="text-sm text-violet-700 mb-2">建立方程组：</p>
                <div className="space-y-1 text-sm text-violet-700">
                  <KaTeX
                    tex={`\\pi_1 = ${exampleMatrix[0][0]}\\pi_1 + ${exampleMatrix[1][0]}\\pi_2`}
                    display
                  />
                  <KaTeX
                    tex={`\\pi_2 = ${exampleMatrix[0][1]}\\pi_1 + ${exampleMatrix[1][1]}\\pi_2`}
                    display
                  />
                  <KaTeX tex="\pi_1 + \pi_2 = 1" display />
                </div>
                <div className="mt-3 pt-3 border-t border-violet-200">
                  <p className="text-sm text-violet-700 font-medium mb-1">解得：</p>
                  <div className="flex gap-4">
                    <KaTeX tex={`\\pi_1 = ${exampleSteady[0].toFixed(4)} \\approx ${(exampleSteady[0] * 100).toFixed(1)}\%`} />
                    <KaTeX tex={`\\pi_2 = ${exampleSteady[1].toFixed(4)} \\approx ${(exampleSteady[1] * 100).toFixed(1)}\%`} />
                  </div>
                </div>
              </div>

              {/* Long-term profit calculation */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-800 mb-2">长期利润期望计算</h4>
                <KaTeX
                  tex={`E = 100 \\times \\pi_1 + 30 \\times \\pi_2 = 100 \\times ${exampleSteady[0].toFixed(3)} + 30 \\times ${exampleSteady[1].toFixed(3)}`}
                  display
                />
                <KaTeX
                  tex={`= ${(100 * exampleSteady[0]).toFixed(2)} + ${(30 * exampleSteady[1]).toFixed(2)} = ${longTermProfit?.toFixed(2)} \\text{（万元）}`}
                  display
                />
                <p className="text-sm text-emerald-700 mt-2 font-medium">
                  长期年期望利润为 {longTermProfit?.toFixed(2)} 万元
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              Ad Strategy Comparison
          ════════════════════════════════════════════ */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg">
              例6-8 广告策略对比分析
            </h3>

            <p className="text-sm text-slate-700">
              现考虑是否采取广告策略。采取广告策略每年需花费15万元，但可以改变状态转移概率。下面比较两种策略下三年的总利润期望。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* No ad strategy */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <Badge variant="secondary" className="mb-2">
                  策略A：不采取广告
                </Badge>
                <MatrixLatex matrix={noAdMatrix} name="P" />
              </div>

              {/* Ad strategy */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <Badge variant="secondary" className="mb-2">
                  策略B：采取广告策略
                </Badge>
                <MatrixLatex matrix={adMatrix} name="P_A" />
              </div>
            </div>

            {/* Calculation steps */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-800">多步转移矩阵计算</h4>
              <Tabs defaultValue="no-ad">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="no-ad">不采取广告</TabsTrigger>
                  <TabsTrigger value="ad">采取广告</TabsTrigger>
                </TabsList>
                <TabsContent value="no-ad" className="space-y-2">
                  <MatrixLatex matrix={noAdP2} name="P^2" />
                  <MatrixLatex matrix={noAdP3} name="P^3" />
                </TabsContent>
                <TabsContent value="ad" className="space-y-2">
                  <MatrixLatex matrix={adW2} name="P_A^2" />
                  <MatrixLatex matrix={adW3} name="P_A^3" />
                </TabsContent>
              </Tabs>
            </div>

            {/* Comparison table */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-800">三年利润期望值对比</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>年份</TableHead>
                    <TableHead>不采取广告（万元）</TableHead>
                    <TableHead>采取广告（万元）</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">第一年</TableCell>
                    <TableCell>{noAdYear1.toFixed(2)}</TableCell>
                    <TableCell>{adYear1.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">第二年</TableCell>
                    <TableCell>{noAdYear2.toFixed(2)}</TableCell>
                    <TableCell>{adYear2.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">第三年</TableCell>
                    <TableCell>{noAdYear3.toFixed(2)}</TableCell>
                    <TableCell>{adYear3.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50 font-semibold">
                    <TableCell>合计</TableCell>
                    <TableCell className="text-emerald-600">
                      {noAdTotal.toFixed(2)}
                      {noAdTotal > adTotal && (
                        <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          更优
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={adTotal > noAdTotal ? "text-emerald-600" : ""}>
                      {adTotal.toFixed(2)}
                      {adTotal > noAdTotal && (
                        <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          更优
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Conclusion */}
            <Alert className="bg-amber-50 border-amber-200">
              <ArrowRight className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>结论：</strong>不采取广告策略的三年总利润期望为 {noAdTotal.toFixed(2)} 万元，
                采取广告策略为 {adTotal.toFixed(2)} 万元。
                <span className="font-bold">
                  {(() => {
                    if (noAdTotal > adTotal) {
                      return `因此不采取广告策略更优，可多得 ${(noAdTotal - adTotal).toFixed(2)} 万元`;
                    } else if (adTotal > noAdTotal) {
                      return `因此采取广告策略更优，可多得 ${(adTotal - noAdTotal).toFixed(2)} 万元`;
                    } else {
                      return "因此两种策略三年总利润期望相同";
                    }
                  })()}
                </span>
                。
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════
          Module 4: 知识点总结（折叠面板）
      ════════════════════════════════════════════ */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F8F6F2] rounded-lg">
              <BookOpen className="h-5 w-5 text-[#1B3A5F]" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1B3A5F]">知识点总结</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>马尔可夫性定义</AccordionTrigger>
              <AccordionContent className="space-y-2 text-slate-700">
                <p>
                  如果一个系统的未来状态只依赖于当前状态，而与过去的历史状态无关，则称该系统具有<strong>马尔可夫性</strong>（Markov Property）。
                </p>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <KaTeX
                    tex="P(X_{n+1} = j \mid X_n = i, X_{n-1}, \dots, X_0) = P(X_{n+1} = j \mid X_n = i)"
                    display
                  />
                </div>
                <p className="text-sm">
                  这一性质大大简化了状态转移的建模，因为只需要知道一步转移概率即可。
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>稳态概率求解方法</AccordionTrigger>
              <AccordionContent className="space-y-2 text-slate-700">
                <p>在满足一定条件的马尔可夫链中，例如有限、不可约且非周期时，状态概率分布会随时间趋于稳定分布。一般情形下，稳态分布的存在不一定等同于从任意初始状态出发都会收敛。</p>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                  <p className="text-sm font-medium">求解步骤：</p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>
                      建立方程组：<KaTeX tex="\pi_j = \sum_i \pi_i P_{ij}" />（对所有状态 j）
                    </li>
                    <li>
                      添加归一化条件：<KaTeX tex="\sum_i \pi_i = 1" />
                    </li>
                    <li>用任一方程替换为归一化条件（通常替换最后一个方程）</li>
                    <li>解线性方程组得到稳态概率</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>应用场景与决策方法</AccordionTrigger>
              <AccordionContent className="space-y-2 text-slate-700">
                <div className="space-y-2">
                  {[
                    {
                      title: "市场状态分析",
                      desc: "分析产品的畅销/滞销状态转移，预测长期市场占有率",
                    },
                    {
                      title: "策略对比",
                      desc: "通过比较不同策略下的转移矩阵，计算各策略的长期收益期望",
                    },
                    {
                      title: "设备维护决策",
                      desc: "分析设备正常/故障状态转移，制定最优维修策略",
                    },
                    {
                      title: "库存管理",
                      desc: "根据需求状态转移规律，优化库存补充策略",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-sm">{item.title}</span>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 p-3 rounded border border-amber-200 mt-2">
                  <p className="text-sm text-amber-800">
                    <strong>决策流程：</strong>确定状态 → 估计转移矩阵 → 计算稳态概率 → 评估各方案收益 → 选择最优策略
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}

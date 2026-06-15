import { Shield, BookOpen } from 'lucide-react';

export default function ChapterHeader() {
  return (
    <div className="rounded-2xl p-6 sm:p-4 bg-gradient-to-br from-[#1B3A5F] via-[#2A4A73] to-[#1B3A5F] text-white">
      <div className="flex items-start gap-3 mb-1">
        <Shield className="w-8 h-8 text-[#C8963E] mt-0.5 shrink-0" />
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
            第三章 风险型决策分析
          </h1>
          <p className="text-[15px] text-white/70 font-normal mt-1">
            期望值准则、决策树、贝叶斯分析、灵敏度分析与效用理论
          </p>
        </div>
      </div>

      {/* Textbook Tip Box */}
      <div className="mt-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 flex items-start gap-3">
        <BookOpen className="w-[18px] h-[18px] text-[#C8963E] shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-semibold text-white">教材提示：</span>
          <p className="text-sm text-white/80 leading-relaxed mt-0.5">
            风险型决策分析的基本条件是：存在明确决策目标、两个以上备选方案、两种以上自然状态、各方案各状态损益值已知、各状态概率可估计。风险是可测定的不确定性，决策准则包括期望值准则、决策树法、贝叶斯分析、效用理论等。
          </p>
        </div>
      </div>
    </div>
  );
}

import { SafeInlineMath, SafeBlockMath } from '@/components/SafeKatex';

interface FormulaBlockProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export default function FormulaBlock({ formula, displayMode = true, className = '' }: FormulaBlockProps) {
  return (
    <div className={`formula-block ${className}`}>
      {displayMode ? (
        <SafeBlockMath math={formula} />
      ) : (
        <SafeInlineMath math={formula} />
      )}
    </div>
  );
}

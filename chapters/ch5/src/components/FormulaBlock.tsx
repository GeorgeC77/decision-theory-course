import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface FormulaBlockProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export default function FormulaBlock({ formula, displayMode = true, className = '' }: FormulaBlockProps) {
  return (
    <div className={`formula-block ${className}`}>
      {displayMode ? (
        <BlockMath math={formula} />
      ) : (
        <InlineMath math={formula} />
      )}
    </div>
  );
}

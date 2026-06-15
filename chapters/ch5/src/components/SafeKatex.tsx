import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface SafeMathProps {
  math: string;
}

export function SafeInlineMath({ math }: SafeMathProps) {
  return (
    <InlineMath
      math={math}
      renderError={(error: Error) => (
        <span className="text-red-600" title={error.message}>
          {math}
        </span>
      )}
    />
  );
}

export function SafeBlockMath({ math }: SafeMathProps) {
  return (
    <BlockMath
      math={math}
      renderError={(error: Error) => (
        <div className="text-red-600" title={error.message}>
          {math}
        </div>
      )}
    />
  );
}

import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm flex-wrap">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span style={{ color: '#9E9E9E' }}>/</span>
          )}
          {item.path && index < items.length - 1 ? (
            <Link
              to={item.path}
              className="transition-colors duration-150 hover:underline no-underline"
              style={{ color: '#6B6B6B' }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="font-medium"
              style={{ color: '#2A4A73' }}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

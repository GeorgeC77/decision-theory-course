import { GraduationCap } from 'lucide-react';

export interface KnowledgeSection {
  subtitle: string;
  content: string[];
}

interface KnowledgeCardProps {
  title: string;
  sections: KnowledgeSection[];
  tags?: string[];
}

export default function KnowledgeCard({ title, sections, tags }: KnowledgeCardProps) {
  return (
    <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E0DDD5' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <GraduationCap size={20} style={{ color: '#3b82f6' }} />
        <h3 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
          知识点: {title}
        </h3>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">
        {sections.map((section, index) => (
          <div key={index}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
              {section.subtitle}
            </h4>
            <ul className="flex flex-col gap-1.5">
              {section.content.map((item, i) => (
                <li
                  key={i}
                  className="text-sm leading-relaxed flex items-start gap-2"
                  style={{ color: '#6B6B6B' }}
                >
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#9E9E9E' }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-5 pt-4" style={{ borderTop: '1px solid #E0DDD5' }}>
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2.5 py-1 rounded-md text-xs font-medium"
              style={{ background: '#f1f5f9', color: '#6B6B6B' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

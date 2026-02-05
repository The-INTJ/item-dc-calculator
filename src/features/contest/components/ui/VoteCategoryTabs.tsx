import type { AttributeConfig } from '../../contexts/contest/contestTypes';

interface VoteCategoryTabsProps {
  categories: AttributeConfig[];
  activeCategoryId: string | null;
  onChange: (categoryId: string) => void;
  className?: string;
  emptyLabel?: string;
}

export function VoteCategoryTabs({
  categories,
  activeCategoryId,
  onChange,
  className,
  emptyLabel = 'No categories yet.',
}: VoteCategoryTabsProps) {
  if (categories.length === 0) {
    return <div className="contest-empty">{emptyLabel}</div>;
  }

  return (
    <div
      className={`contest-vote-tabs ${className ?? ''}`.trim()}
      role="tablist"
      aria-label="Vote categories"
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategoryId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`contest-vote-tabs__button ${isActive ? 'contest-vote-tabs__button--active' : ''}`.trim()}
            aria-pressed={isActive}
            role="tab"
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

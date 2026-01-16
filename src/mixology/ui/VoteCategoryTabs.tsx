import type { VoteCategory } from '../data/uiTypes';

interface VoteCategoryTabsProps {
  categories: VoteCategory[];
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
    return <div className="mixology-empty">{emptyLabel}</div>;
  }

  return (
    <div
      className={`mixology-vote-tabs ${className ?? ''}`.trim()}
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
            className={`mixology-vote-tabs__button ${isActive ? 'mixology-vote-tabs__button--active' : ''}`.trim()}
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

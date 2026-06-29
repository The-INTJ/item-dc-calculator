import { getActiveFilterCount } from '../lib/search';
import type { FilterCategory, FilterState } from '../lib/types';
import { categoryLabels, filterOptions } from '../lib/filter-options';
import { MaterialSymbol } from './MaterialSymbol';
import styles from './HeritageHymnsDemo.module.scss';

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function RefinePanel({
  activeCategory,
  filters,
  onCategoryChange,
  onToggleFilter,
  onToggleGroup,
  onClearAll,
  onClose,
  drawer = false,
}: {
  activeCategory: FilterCategory;
  filters: FilterState;
  onCategoryChange: (category: FilterCategory) => void;
  onToggleFilter: (category: FilterCategory, value: string) => void;
  onToggleGroup: (category: FilterCategory, values: string[]) => void;
  onClearAll: () => void;
  onClose?: () => void;
  drawer?: boolean;
}) {
  const activeCount = getActiveFilterCount(filters);
  const options = filterOptions[activeCategory];

  return (
    <aside className={cx(styles.refinePanel, drawer && styles.refinePanelDrawer)} aria-label="Refine hymns">
      <header className={styles.refineHeader}>
        <div>
          <p>Refine</p>
          {activeCount > 0 ? <strong>{`${activeCount} selected`}</strong> : null}
        </div>
        <div className={styles.refineActions}>
          <button type="button" onClick={onClearAll} disabled={activeCount === 0}>
            Clear All
          </button>
          {onClose ? (
            <button type="button" className={styles.closeDrawerButton} onClick={onClose} aria-label="Close filters">
              Close
            </button>
          ) : null}
        </div>
      </header>
      <div className={styles.refineGrid}>
        <nav className={styles.categoryNav} aria-label="Filter categories">
          {(Object.keys(categoryLabels) as FilterCategory[]).map((category) => {
            const categoryCount = filters[category].length;
            return (
              <button
                type="button"
                key={category}
                className={cx(category === activeCategory && styles.categoryButtonActive)}
                onClick={() => onCategoryChange(category)}
                aria-pressed={category === activeCategory}
              >
                <span>{categoryLabels[category]}</span>
                {categoryCount > 0 ? <em>{categoryCount}</em> : null}
              </button>
            );
          })}
        </nav>
        <div className={styles.optionList} aria-label={`${categoryLabels[activeCategory]} options`}>
          {options.map((option) => {
            const selected = option.selectable && filters[activeCategory].includes(option.value);
            const hasGroupChildren = !option.selectable && (option.children?.length ?? 0) > 0;
            const hasSelectedChild =
              hasGroupChildren &&
              option.children?.some((child) => filters[activeCategory].includes(child));
            return (
              <button
                type="button"
                key={`${activeCategory}-${option.value}`}
                className={cx(
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                  option.depth === 1 && styles.optionButtonNested,
                  !option.selectable && styles.optionButtonGroup,
                  hasSelectedChild && styles.optionButtonGroupWithSelection,
                )}
                disabled={!option.selectable && !hasGroupChildren}
                onClick={() => {
                  if (option.selectable) {
                    onToggleFilter(activeCategory, option.value);
                    return;
                  }

                  if (option.children) {
                    onToggleGroup(activeCategory, option.children);
                  }
                }}
                aria-pressed={option.selectable ? selected : undefined}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {option.selectable ? (
                  <span className={styles.optionCheck} aria-hidden="true">
                    {selected ? <MaterialSymbol icon="check" /> : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

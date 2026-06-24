import styles from './HeritageHymnsDemo.module.scss';

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function MaterialSymbol({ icon, className }: { icon: string; className?: string }) {
  return (
    <span className={cx(styles.materialSymbol, className)} aria-hidden="true">
      {icon}
    </span>
  );
}

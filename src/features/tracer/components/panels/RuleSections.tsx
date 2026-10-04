import type { RuleSet } from '../../engine';
import { howToPlay } from './content';

/** How to play under `rules`, one section per topic. */
export function RuleSections({ rules }: { rules: RuleSet }) {
  return howToPlay(rules).map((section) => (
    <section key={section.title}>
      <h3>{section.title}</h3>
      <ul>
        {section.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  ));
}

'use client';

import { useCallback, useState } from 'react';
import type { AttributeConfig, ContestConfig } from '../../contexts/contest/contestTypes';
import {
  buildContestConfigFromDraft,
  createContestConfigDraft,
  validateContestConfigDraft,
  type ContestConfigDraft,
} from '../../lib/domain/contestConfigDraft';

export type ConfigTextField = keyof Omit<ContestConfigDraft, 'attributes'>;

/**
 * The in-progress edit of an existing contest's scoring configuration. Held
 * apart from the saved config so cancelling restores what the contest
 * actually has, not whatever the form was last left showing.
 *
 * Distinct from `useContestConfigDraft`, which builds a config during contest
 * creation and has a template mode this editor has no use for.
 */
export function useConfigEditDraft(
  effectiveConfig: ContestConfig,
  onSave: (config: ContestConfig) => Promise<void>,
) {
  const [draft, setDraft] = useState<ContestConfigDraft>(() =>
    createContestConfigDraft(effectiveConfig),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(name: ConfigTextField, value: string) {
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function setAttributes(attributes: AttributeConfig[]) {
    setDraft((prev) => ({ ...prev, attributes }));
  }

  const reset = useCallback(() => {
    setDraft(createContestConfigDraft(effectiveConfig));
    setError(null);
  }, [effectiveConfig]);

  /** Resolves true once saved, so the caller knows it can leave edit mode. */
  const save = async (): Promise<boolean> => {
    const validationError = validateContestConfigDraft({
      topic: draft.topic,
      attributes: draft.attributes,
    });
    if (validationError) {
      setError(validationError);
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(buildContestConfigFromDraft(draft));
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save config.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { draft, setField, setAttributes, isSaving, error, reset, save };
}

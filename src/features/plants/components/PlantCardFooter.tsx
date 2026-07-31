'use client';

import styles from './PlantCard.module.scss';
import type { usePlantManageActions } from './plantCardActions';

type PlantManageActions = ReturnType<typeof usePlantManageActions>;

interface PlantCardFooterProps {
  plantName: string;
  manage: PlantManageActions;
}

export function PlantCardFooter({ plantName, manage }: PlantCardFooterProps) {
  return (
    <div className={styles.footer}>
      {manage.renaming ? (
        <form className={styles.renameForm} onSubmit={manage.submitRename}>
          <input
            className={styles.renameInput}
            value={manage.nameDraft}
            onChange={(event) => manage.setNameDraft(event.target.value)}
            maxLength={80}
            autoFocus
            aria-label="Plant name"
          />
          <button type="submit" className={styles.textButton}>
            Save
          </button>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              manage.setRenaming(false);
              manage.setNameDraft(plantName);
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          className={styles.textButton}
          onClick={() => manage.setRenaming(true)}
        >
          Rename
        </button>
      )}

      {manage.confirmingRemove ? (
        <span className={styles.confirmRow}>
          <span className={styles.confirmText}>
            Delete this plant and its history?
          </span>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={manage.confirmRemove}
            disabled={manage.removing}
          >
            {manage.removing ? 'Removing…' : 'Delete'}
          </button>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => manage.setConfirmingRemove(false)}
            disabled={manage.removing}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          className={styles.dangerLink}
          onClick={() => manage.setConfirmingRemove(true)}
        >
          Remove plant
        </button>
      )}
    </div>
  );
}

import { SyncEvent } from '../schemas/index.js';

export function createSyncEvent(
  author: string,
  contractChanges: string[] = [],
  filesChanged: string[] = [],
  blocked: string | null = null,
): SyncEvent {
  return {
    author,
    at: new Date().toISOString(),
    contract_changes: contractChanges,
    files_changed: filesChanged,
    blocked,
  };
}

export function isTrivialEvent(event: SyncEvent): boolean {
  return (
    event.contract_changes.length === 0 &&
    event.files_changed.length === 0 &&
    event.blocked === null
  );
}

export function eventFilename(event: SyncEvent): string {
  // Format: YYYY-MM-DDTHH-MM-SS_author.json
  const timestamp = event.at.replace(/[:.]/g, '-').split('.')[0];
  return `${timestamp}_${event.author}.json`;
}

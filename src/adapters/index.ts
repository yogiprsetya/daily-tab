/**
 * Adapters Export
 * Adapter layer handles external dependencies and side effects
 * (storage, DOM, file I/O, etc.)
 */

export { storageAdapter, type StorageAdapter } from './storage.adapter';
export {
  notesAdapter,
  createNotesAdapter,
  type NotesAdapter,
} from './notes.adapter';
export {
  settingsAdapter,
  createSettingsAdapter,
  type SettingsAdapter,
} from './settings.adapter';
export { domAdapter, createDOMAdapter, type DOMAdapter } from './dom.adapter';

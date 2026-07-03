import { atom } from 'recoil';

export interface AiiPageContextPayload {
  url: string;
  title?: string;
  capturedAt: string; // ISO 8601
  excerpt?: string;
  markdown: string;
}

/**
 * Holds the most recently captured page context from the aii copilot extension.
 * Set to null when no context has been captured or after it has been used.
 */
export const aiiPageContext = atom<AiiPageContextPayload | null>({
  key: 'aiiPageContext',
  default: null,
});

/**
 * True while the user has the "read page" toggle enabled.
 * The next submitted message will include the page context block when this
 * is true and a valid aiiPageContext payload is available.
 */
export const aiiContextRequested = atom<boolean>({
  key: 'aiiContextRequested',
  default: false,
});

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
 * Set to null when no context has been captured or after an explicit clear.
 * Auto-injected into the first message of each new conversation.
 */
export const aiiPageContext = atom<AiiPageContextPayload | null>({
  key: 'aiiPageContext',
  default: null,
});

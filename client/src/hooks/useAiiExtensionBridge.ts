import { useEffect, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { aiiPageContext, aiiContextRequested } from '~/store/aiiPageContext';
import type { AiiPageContextPayload } from '~/store/aiiPageContext';

/**
 * Mounts a postMessage listener for AII_PAGE_CONTEXT messages sent by the
 * aii copilot browser extension's sidepanel frame.
 *
 * Security: checks event.source === window.parent, which confirms the message
 * came from the extension frame that loaded this iframe — no extension ID
 * hardcoding required and it works in both dev and prod environments.
 *
 * Only active when running inside an iframe (i.e. the extension sidepanel).
 */
export function useAiiExtensionBridge() {
  const setPageContext = useSetRecoilState(aiiPageContext);
  const setContextRequested = useSetRecoilState(aiiContextRequested);

  useEffect(() => {
    if (window === window.parent) return; // top-level browser tab — skip

    function handler(event: MessageEvent) {
      if (event.source !== window.parent) return;

      const data = event.data as { type?: string; payload?: AiiPageContextPayload | null } | undefined;
      if (!data?.type) return;

      if (data.type === 'AII_PAGE_CONTEXT') {
        // When the extension delivers context, mark the toggle as ready.
        // A null payload (explicit clear from the extension) turns the toggle off.
        setPageContext(data.payload ?? null);
        if (data.payload) setContextRequested(true);
      }
    }

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setPageContext, setContextRequested]);
}

/**
 * Sends a REQUEST_PAGE_CONTEXT message to the extension parent frame.
 * Only works when running inside the extension sidepanel iframe.
 */
export function requestPageContext() {
  if (window === window.parent) return;
  window.parent.postMessage({ type: 'REQUEST_PAGE_CONTEXT' }, '*');
}

import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { aiiPageContext } from '~/store/aiiPageContext';
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

  useEffect(() => {
    if (window === window.parent) return; // top-level browser tab — skip

    function handler(event: MessageEvent) {
      if (event.source !== window.parent) return;

      const data = event.data as { type?: string; payload?: AiiPageContextPayload | null } | undefined;
      if (!data?.type) return;

      if (data.type === 'AII_PAGE_CONTEXT') {
        setPageContext(data.payload ?? null);
      }
    }

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setPageContext]);
}

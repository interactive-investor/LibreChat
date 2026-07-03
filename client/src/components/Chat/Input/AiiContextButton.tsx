import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Globe, Loader2 } from 'lucide-react';
import { cn } from '~/utils';
import { aiiPageContext, aiiContextRequested } from '~/store/aiiPageContext';
import { requestPageContext } from '~/hooks/useAiiExtensionBridge';

/**
 * Toolbar toggle that lets the user include the current browser tab's content
 * in their next chat message.
 *
 * Only renders when running inside the aii copilot extension sidepanel iframe.
 * States:
 *   off      — toggle is inactive; clicking requests page context from the extension
 *   loading  — request sent, waiting for extension to respond
 *   active   — context received and ready to be injected on next message submit
 */
export default function AiiContextButton() {
  const [pageCtx, setPageCtx] = useRecoilState(aiiPageContext);
  const [requested, setRequested] = useRecoilState(aiiContextRequested);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window !== window.parent);
  }, []);

  if (!isInIframe) return null;

  const isLoading = requested && !pageCtx;
  const isActive = requested && !!pageCtx;

  function handleClick() {
    if (isActive || isLoading) {
      // Turn off: clear context and cancel the request
      setRequested(false);
      setPageCtx(null);
    } else {
      // Turn on: ask the extension for fresh page context
      setRequested(true);
      requestPageContext();
    }
  }

  const label = isActive
    ? `Reading: ${pageCtx?.title ?? pageCtx?.url ?? 'current page'}`
    : isLoading
      ? 'Reading page…'
      : 'Read current page';

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        isActive
          ? 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:text-blue-400'
          : isLoading
            ? 'bg-surface-tertiary text-text-secondary cursor-wait'
            : 'bg-surface-tertiary text-text-secondary hover:bg-surface-hover hover:text-text-primary',
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {isActive && pageCtx?.title ? (
        <span className="max-w-[120px] truncate">{pageCtx.title}</span>
      ) : isLoading ? (
        <span>Reading…</span>
      ) : null}
    </button>
  );
}

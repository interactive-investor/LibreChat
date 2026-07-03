import { useCallback, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { replaceSpecialVars } from 'librechat-data-provider';
import { useChatContext, useChatFormContext, useAddedChatContext } from '~/Providers';
import { useAuthContext } from '~/hooks/AuthContext';
import { mainTextareaId } from '~/common';
import store from '~/store';
import { aiiPageContext } from '~/store/aiiPageContext';

export default function useSubmitMessage() {
  const { user } = useAuthContext();
  const methods = useChatFormContext();
  const { conversation: addedConvo } = useAddedChatContext();
  const { ask, index, getMessages, setMessages } = useChatContext();
  const latestMessage = useRecoilValue(store.latestMessageFamily(index));
  const pageCtx = useRecoilValue(aiiPageContext);
  const clearPageCtx = useSetRecoilState(aiiPageContext);
  // Track the last URL injected so we don't re-inject the same page twice
  const lastInjectedUrlRef = useRef<string | null>(null);

  const autoSendPrompts = useRecoilValue(store.autoSendPrompts);
  const setActivePrompt = useSetRecoilState(store.activePromptByIndex(index));

  const submitMessage = useCallback(
    (data?: { text: string }) => {
      if (!data) {
        return console.warn('No data provided to submitMessage');
      }
      const rootMessages = getMessages();
      const isLatestInRootMessages = rootMessages?.some(
        (message) => message.messageId === latestMessage?.messageId,
      );
      if (!isLatestInRootMessages && latestMessage) {
        setMessages([...(rootMessages || []), latestMessage]);
      }

      let { text } = data;

      // Auto-inject page context into the first message of a new conversation.
      // This lets the user ask "what\'s this page about?" naturally without
      // any extra clicks — the AI already has the page content.
      const isFirstMessage = !rootMessages?.length;
      if (pageCtx && isFirstMessage && pageCtx.url !== lastInjectedUrlRef.current) {
        const domain = (() => { try { return new URL(pageCtx.url).hostname; } catch { return pageCtx.url; } })();
        const contextBlock = [
          `<page-context url="${pageCtx.url}" title="${pageCtx.title ?? domain}" captured="${pageCtx.capturedAt}">`,
          pageCtx.excerpt ?? '',
          '</page-context>',
        ].filter(Boolean).join('\n');
        text = `${contextBlock}\n\n${text}`;
        lastInjectedUrlRef.current = pageCtx.url;
        // Clear atom so subsequent new conversations don\'t re-inject stale context
        clearPageCtx(null);
      }

      ask(
        { text },
        { addedConvo: addedConvo ?? undefined },
      );
      methods.reset();
    },
    [ask, methods, addedConvo, setMessages, getMessages, latestMessage, pageCtx, clearPageCtx],
  );

  const submitPrompt = useCallback(
    (text: string) => {
      const parsedText = replaceSpecialVars({ text, user });
      if (autoSendPrompts) {
        submitMessage({ text: parsedText });
        return;
      }

      const textarea = document.getElementById(mainTextareaId) as HTMLTextAreaElement | null;
      const currentText = textarea?.value ?? methods.getValues('text');
      const newText = currentText.trim().length > 1 ? `\n${parsedText}` : parsedText;
      setActivePrompt(newText);
    },
    [autoSendPrompts, submitMessage, setActivePrompt, methods, user],
  );

  return { submitMessage, submitPrompt };
}

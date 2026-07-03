import { useCallback } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { replaceSpecialVars } from 'librechat-data-provider';
import { useChatContext, useChatFormContext, useAddedChatContext } from '~/Providers';
import { useAuthContext } from '~/hooks/AuthContext';
import { mainTextareaId } from '~/common';
import store from '~/store';
import { aiiPageContext, aiiContextRequested } from '~/store/aiiPageContext';

export default function useSubmitMessage() {
  const { user } = useAuthContext();
  const methods = useChatFormContext();
  const { conversation: addedConvo } = useAddedChatContext();
  const { ask, index, getMessages, setMessages } = useChatContext();
  const latestMessage = useRecoilValue(store.latestMessageFamily(index));
  const [pageCtx, setPageCtx] = useRecoilState(aiiPageContext);
  const [contextRequested, setContextRequested] = useRecoilState(aiiContextRequested);

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

      // Inject page context when the user has the "read page" toggle enabled.
      if (contextRequested && pageCtx) {
        const domain = (() => { try { return new URL(pageCtx.url).hostname; } catch { return pageCtx.url; } })();
        const label = pageCtx.title ? `${pageCtx.title} (${domain})` : domain;
        // Build a clean block: human-readable header + full markdown body.
        // The <page-context> wrapper tells the LLM the content comes from the
        // user's browser tab — no need for it to fetch the URL via MCP tools.
        const contextBlock = [
          `<page-context source="${pageCtx.url}" title="${label}" captured="${pageCtx.capturedAt}">`,
          pageCtx.markdown.trim(),
          '</page-context>',
        ].join('\n');
        text = `${contextBlock}\n\n${text}`;
        // Reset toggle and clear context after use
        setContextRequested(false);
        setPageCtx(null);
      }

      ask(
        { text },
        { addedConvo: addedConvo ?? undefined },
      );
      methods.reset();
    },
    [ask, methods, addedConvo, setMessages, getMessages, latestMessage, pageCtx, setPageCtx, contextRequested, setContextRequested],
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

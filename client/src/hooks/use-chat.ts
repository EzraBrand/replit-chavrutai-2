import { useChat as useAIChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { UIMessage } from 'ai';

export interface ChatContext {
  tractate?: string;
  page?: string;
  section?: number | string;
  range?: string;
  hebrewText?: string;
  englishText?: string;
}

export interface ToolCall {
  tool: string;
  arguments: Record<string, any>;
  result: any;
}

export function useChat(context?: ChatContext) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({ context }),
  }), [context?.tractate, context?.page, context?.section, context?.range]);

  const {
    messages,
    sendMessage: aiSendMessage,
    status,
    error,
    setMessages,
    stop,
  } = useAIChat({ transport });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i];
    }
    return null;
  }, [messages]);

  const isLastAssistantStreaming = useMemo(() => {
    if (!isLoading || !lastAssistantMessage) return false;
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.role === 'assistant';
  }, [isLoading, lastAssistantMessage, messages]);

  const reasoningText = useMemo(() => {
    if (!lastAssistantMessage?.parts) return '';
    if (isLoading && !isLastAssistantStreaming) return '';
    return lastAssistantMessage.parts
      .filter((p) => p.type === 'reasoning')
      .map((p) => 'reasoning' in p ? p.reasoning : '')
      .join('');
  }, [lastAssistantMessage, isLoading, isLastAssistantStreaming]);

  const lastToolCalls = useMemo((): ToolCall[] => {
    if (!lastAssistantMessage?.parts) return [];
    if (isLoading && !isLastAssistantStreaming) return [];
    return lastAssistantMessage.parts
      .filter((p) => p.type === 'tool-invocation' && 'state' in p && p.state === 'output-available')
      .map((p: any) => ({
        tool: p.toolName,
        arguments: p.args as Record<string, any>,
        result: p.output
      }));
  }, [lastAssistantMessage, isLoading, isLastAssistantStreaming]);

  const streamingContent = useMemo(() => {
    if (!isLastAssistantStreaming || !lastAssistantMessage?.parts) return '';
    return lastAssistantMessage.parts
      .filter((p) => p.type === 'text')
      .map((p) => 'text' in p ? p.text : '')
      .join('');
  }, [isLastAssistantStreaming, lastAssistantMessage]);

  const statusMessage = useMemo(() => {
    if (!isLoading) return '';
    if (status === 'submitted') return 'Thinking...';
    if (!isLastAssistantStreaming || !lastAssistantMessage) return 'Thinking...';
    const parts = lastAssistantMessage.parts || [];
    const hasReasoning = parts.some((p) => p.type === 'reasoning');
    const hasText = parts.some((p) => p.type === 'text' && 'text' in p && p.text);
    const hasToolCall = parts.some((p) => p.type === 'tool-invocation');
    if (hasText) return '';
    if (hasToolCall) return 'Using tools...';
    if (hasReasoning) return 'Reasoning...';
    return 'Thinking...';
  }, [isLoading, status, isLastAssistantStreaming, lastAssistantMessage]);

  const sendMessage = useCallback(async (content: string) => {
    await aiSendMessage({ text: content });
  }, [aiSendMessage]);

  const clearMessages = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop, setMessages]);

  const getMessageContent = useCallback((msg: UIMessage): string => {
    return msg.parts
      .filter((p) => p.type === 'text')
      .map((p) => 'text' in p ? p.text : '')
      .join('');
  }, []);

  return {
    messages,
    isLoading,
    error: error?.message || null,
    lastToolCalls,
    elapsedSeconds,
    reasoningText,
    streamingContent,
    statusMessage,
    sendMessage,
    clearMessages,
    stop,
    getMessageContent,
  };
}

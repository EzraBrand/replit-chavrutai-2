import { useState, useRef, useEffect, useCallback } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastToolCalls, setLastToolCalls] = useState<ToolCall[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reasoningText, setReasoningText] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);
    setReasoningText('');
    setStreamingContent('');
    setStatusMessage('');
    setLastToolCalls([]);

    const userMessage: ChatMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let accumulatedReasoning = '';
      const accumulatedToolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));

              if (currentEvent === 'reasoning') {
                accumulatedReasoning += data.delta;
                setReasoningText(accumulatedReasoning);
              } else if (currentEvent === 'text') {
                accumulatedText += data.delta;
                setStreamingContent(accumulatedText);
              } else if (currentEvent === 'tool_call') {
                accumulatedToolCalls.push(data);
                setLastToolCalls([...accumulatedToolCalls]);
              } else if (currentEvent === 'status') {
                setStatusMessage(data.message || '');
              } else if (currentEvent === 'done') {
                if (data.toolCalls) {
                  setLastToolCalls(data.toolCalls);
                }
              } else if (currentEvent === 'error') {
                setError(data.message || 'Chat request failed');
              }
            } catch {
            }
            currentEvent = '';
          }
        }
      }

      if (accumulatedText) {
        setMessages([...newMessages, { role: 'assistant', content: accumulatedText }]);
      }
      setStreamingContent('');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      abortRef.current = null;
    }
  }, [messages, context]);

  const clearMessages = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setMessages([]);
    setLastToolCalls([]);
    setError(null);
    setReasoningText('');
    setStreamingContent('');
    setStatusMessage('');
  }, []);

  return {
    messages,
    isLoading,
    error,
    lastToolCalls,
    elapsedSeconds,
    reasoningText,
    streamingContent,
    statusMessage,
    sendMessage,
    clearMessages
  };
}

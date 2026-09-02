import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { trackPublishingEvent } from '@/lib/publishing-analytics';

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

export interface ChatResponse {
  message: ChatMessage;
  toolCalls: ToolCall[];
}

export function useChat(context?: ChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastToolCalls, setLastToolCalls] = useState<ToolCall[]>([]);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const res = await apiRequest('POST', '/api/chat', {
        messages: newMessages,
        context
      });

      const response: ChatResponse = await res.json();

      setLastToolCalls(response.toolCalls);
      setMessages([...newMessages, response.message]);
      trackPublishingEvent('ai_response_received', {
        has_context: Boolean(context),
        conversation_turn: newMessages.filter((message) => message.role === 'user').length,
        tool_call_count: response.toolCalls.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setLastToolCalls([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    lastToolCalls,
    sendMessage,
    clearMessages
  };
}

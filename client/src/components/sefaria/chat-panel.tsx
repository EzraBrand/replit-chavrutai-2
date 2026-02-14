import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Send, Square, Trash2, ExternalLink, Loader2, Globe, BookOpen, Search, Clock, Info, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { useChat, type ChatContext, type ToolCall } from '@/hooks/use-chat';
import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatPanelProps {
  context?: ChatContext;
}

export function ChatPanel({ context }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [showReasoning, setShowReasoning] = useState(true);
  const { messages, isLoading, error, lastToolCalls, elapsedSeconds, reasoningText, streamingContent, statusMessage, sendMessage, clearMessages, stop, getMessageContent } = useChat(context);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, streamingContent, reasoningText]);

  const markdownComponents = {
    a: ({ href, children, ...props }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
    )
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    sendMessage(inputValue);
    setInputValue('');
    setShowReasoning(true);
  };

  const renderToolCalls = (toolCalls: ToolCall[]) => {
    if (toolCalls.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {toolCalls.map((tc, i) => {
          if (tc.tool === 'webSearch' || tc.tool === 'web_search') {
            const sources = Array.isArray(tc.result) ? tc.result : [];
            return (
              <div key={i} className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
                <div className="font-semibold text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Web search{tc.arguments?.query && tc.arguments.query !== 'web search' ? `: "${tc.arguments.query}"` : ''}
                </div>
                {sources.length > 0 && (
                  <div className="space-y-1">
                    {sources.slice(0, 5).map((source: any, j: number) => (
                      <div key={j} className="flex items-start gap-1">
                        <span className="text-green-600 dark:text-green-400">•</span>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 hover:underline flex-1 truncate"
                        >
                          {source.title || source.url}
                        </a>
                        <ExternalLink className="h-3 w-3 text-green-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (tc.tool === 'fetchSefariaCommentary') {
            const result = tc.result || {};
            const commentators = result.availableCommentators || [];
            const results = result.results || [];
            return (
              <div key={i} className="text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Sefaria commentary lookup
                </div>
                {commentators.length > 0 && (
                  <div className="text-amber-600 dark:text-amber-400 mb-1">
                    Found {result.totalCommentaries} commentaries from: {commentators.slice(0, 8).join(', ')}{commentators.length > 8 ? '...' : ''}
                  </div>
                )}
                {results.length > 0 && (
                  <div className="space-y-1">
                    {results.slice(0, 5).map((r: any, j: number) => (
                      <div key={j} className="flex items-start gap-1">
                        <span className="text-amber-600 dark:text-amber-400">•</span>
                        <a 
                          href={r.sefariaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-amber-600 dark:text-amber-400 hover:underline flex-1"
                        >
                          {r.commentator}: {r.reference}
                        </a>
                        <ExternalLink className="h-3 w-3 text-amber-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={i} className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                <Search className="h-3 w-3" />
                Blog search: {tc.tool}
              </div>
              {tc.result && Array.isArray(tc.result) && tc.result.length > 0 && (
                <div className="space-y-1">
                  {tc.result.map((post: any, j: number) => (
                    <div key={j} className="flex items-start gap-1">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <a 
                        href={post.blogUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex-1"
                      >
                        {post.title}
                      </a>
                      <ExternalLink className="h-3 w-3 text-blue-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderReasoningBlock = () => {
    if (!reasoningText) return null;

    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] w-full">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mb-1 font-medium"
          >
            <Brain className="h-3.5 w-3.5" />
            {isLoading ? 'Thinking...' : 'Thought process'}
            {showReasoning ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {showReasoning && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 italic whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {reasoningText}
              {isLoading && <span className="animate-pulse">|</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Study Assistant</CardTitle>
            <CardDescription className="text-sm">
              Ask questions about the Talmud text, commentators, and related material
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              data-testid="button-clear-chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0 min-h-0">
        <div className="flex items-start gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>Powered by GPT-5.2 Pro with reasoning. Responses may take 10-30s when using commentary lookup, web search, and blog search.</span>
        </div>
        <ScrollArea ref={scrollRef} className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-2">Start a conversation!</p>
                <p className="text-sm">
                  Try asking: "What is this passage about?" or "What does Rashi say?"
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.role}-${i}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">{getMessageContent(msg)}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0
                      prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                      {getMessageContent(msg) ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {getMessageContent(msg)}
                        </ReactMarkdown>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Generating response...</span>
                      )}
                    </div>
                  )}
                  
                  {msg.role === 'assistant' && i === messages.length - 1 && lastToolCalls.length > 0 && (
                    renderToolCalls(lastToolCalls)
                  )}
                </div>
              </div>
            ))}

            {renderReasoningBlock()}

            {isLoading && (
              <>
                {lastToolCalls.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] w-full">
                      {renderToolCalls(lastToolCalls)}
                    </div>
                  </div>
                )}

                {streamingContent ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      <div className="prose prose-sm dark:prose-invert max-w-none
                        prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0
                        prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {streamingContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{statusMessage || (reasoningText ? 'Reasoning...' : 'Thinking...')}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {elapsedSeconds}s
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {error && (
          <Alert variant="destructive" className="mb-4" data-testid="alert-chat-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {context && (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Badge variant="outline" className="text-xs">
              Context: {context.range || `${context.tractate} ${context.page}${context.section !== 'all' ? `:${context.section}` : ''}`}
            </Badge>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="min-h-[100px] max-h-[200px] resize-none"
            rows={4}
            data-testid="input-chat-message"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => stop()}
              data-testid="button-stop-message"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!inputValue.trim()}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

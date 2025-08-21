import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Wifi, WifiOff, Users } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { Message } from '@/libs/types';

interface ChatProps {
  room: string;
}

export function Chat({ room }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [author, setAuthor] = useState(() => {
    // Try to get author from localStorage, fallback to User
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat-author') || 'User';
    }
    return 'User';
  });
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(0);
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    connectionStatus,
    reconnect,
    refresh 
  } = useMessages(room);

  // Save author to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-author', author);
    }
  }, [author]);

  // Check if user is near bottom of scroll
  const checkScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  }, []);

  // Auto-scroll to bottom only when appropriate
  useEffect(() => {
    const messagesAdded = messages.length > previousMessagesLength.current;
    previousMessagesLength.current = messages.length;

    if (messagesAdded && shouldAutoScroll) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, shouldAutoScroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage, author);
    setNewMessage('');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageBubbleClass = (message: Message) => {
    const isWebhook = message.source === 'webhook';
    const isOptimistic = message.id.startsWith('temp-');
    
    let classes = 'max-w-2xl px-4 py-3 rounded-2xl break-words shadow-sm ';
    
    if (isWebhook) {
      classes += 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 text-purple-900';
    } else if (isOptimistic) {
      classes += 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-800 opacity-75';
    } else {
      classes += 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-gray-900';
    }
    
    return classes;
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{room}</h3>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <span className="text-sm text-gray-600">{messages.length} messages</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus.connected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {connectionStatus.connected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${
              connectionStatus.connected ? 'text-green-700' : 'text-red-600'
            }`}>
              {connectionStatus.connected ? 'Live' : 'Offline'}
            </span>
            {connectionStatus.reconnectAttempts > 0 && (
              <span className="text-xs text-yellow-600">
                (Retry {connectionStatus.reconnectAttempts})
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md transition-colors disabled:opacity-50"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {!connectionStatus.connected && (
              <button
                onClick={reconnect}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        onScroll={checkScrollPosition}
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isConsecutive = index > 0 && messages[index - 1].author === message.author;
              
              return (
                <div key={message.id} className={`flex flex-col ${isConsecutive ? 'space-y-1' : 'space-y-2'}`}>
                  {!isConsecutive && (
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          message.source === 'webhook' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {message.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {message.author}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      <div className="flex items-center space-x-1">
                        {message.source === 'webhook' && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            Bot
                          </span>
                        )}
                        {message.id.startsWith('temp-') && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            Sending...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className={`ml-8 ${getMessageBubbleClass(message)}`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {isConsecutive && (
                      <span className="text-xs text-gray-400 mt-1 block">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex space-x-3 mb-3">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={!connectionStatus.connected}
            />
          </div>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={connectionStatus.connected ? "Type your message..." : "Reconnect to send messages"}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!connectionStatus.connected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              {newMessage.trim() && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  Enter to send
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || !connectionStatus.connected}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {!shouldAutoScroll && (
            <button
              onClick={() => {
                setShouldAutoScroll(true);
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-3 w-full py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              ↓ Scroll to latest messages
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
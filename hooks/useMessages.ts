import useSWR, { mutate } from 'swr';
import { useState, useCallback } from 'react';
import { Message } from '@/libs/types';
import { useSSE } from './useSSE';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMessages(room: string) {
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  
  // Fetch messages with SWR
  const { 
    data: messages = [], 
    error, 
    isLoading,
    mutate: mutateMessages 
  } = useSWR<Message[]>(`/api/messages?room=${room}`, fetcher, {
    refreshInterval: 0, // Disable polling since we use SSE
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Handle real-time messages via SSE
  const handleSSEMessage = useCallback((newMessage: Message) => {
    if (newMessage.room === room) {
      // Remove from optimistic messages if it exists
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.id !== newMessage.id)
      );
      
      // Update SWR cache
      mutateMessages((currentMessages: Message[] = []) => {
        const exists = currentMessages.some(msg => msg.id === newMessage.id);
        if (exists) return currentMessages;
        return [...currentMessages, newMessage].sort((a, b) => a.timestamp - b.timestamp);
      }, false);
    }
  }, [room, mutateMessages]);

  const { connectionStatus, reconnect } = useSSE(handleSSEMessage);

  // Send message with optimistic UI
  const sendMessage = useCallback(async (content: string, author: string) => {
    if (!content.trim()) return;

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: content.trim(),
      room,
      timestamp: Date.now(),
      author,
      source: 'user',
    };

    // Add optimistic message
    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: optimisticMessage.content,
          room: optimisticMessage.room,
          author: optimisticMessage.author,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const serverMessage: Message = await response.json();
      
      // Remove optimistic message and let SSE handle the server response
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.id !== optimisticMessage.id)
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.id !== optimisticMessage.id)
      );
      
      // Could add error handling UI here
      alert('Failed to send message. Please try again.');
    }
  }, [room]);

  // Combine server messages with optimistic messages
  const allMessages = [...messages, ...optimisticMessages]
    .sort((a, b) => a.timestamp - b.timestamp);

  return {
    messages: allMessages,
    isLoading,
    error,
    sendMessage,
    connectionStatus,
    reconnect,
    refresh: () => mutateMessages(),
  };
}
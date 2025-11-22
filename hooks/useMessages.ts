
import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { STORAGE_KEY } from '../constants';

const USER_ID_KEY = 'anon_log_user_id';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Initialize User ID
  useEffect(() => {
    let storedUserId = localStorage.getItem(USER_ID_KEY);
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Load messages from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  const addMessage = useCallback((content: string, parentId?: string, manualTags: string[] = []) => {
    if (!userId) return;

    // 1. Extract tags from content via Regex
    const tagRegex = /#[a-zA-Z0-9_а-яА-ЯёЁ]+/g;
    const regexMatches = content.match(tagRegex) || [] as string[];
    
    // 2. Process manual tags
    // Ensure they start with #, trim, and filter empty
    const processedManualTags = manualTags
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    // 3. Combine and Deduplicate
    const allTags = [...regexMatches, ...processedManualTags];
    const uniqueTags = Array.from(new Set(allTags))
      .filter(tag => tag.length <= 32) // Max length check
      .map(tag => tag.toLowerCase()); // Normalize

    setMessages((prevMessages) => {
      const nextSequence = prevMessages.length > 0 ? prevMessages[0].sequenceNumber + 1 : 1;
      
      const newMessage: Message = {
        id: crypto.randomUUID(),
        content: content.trim(),
        timestamp: Date.now(),
        sequenceNumber: nextSequence,
        senderId: userId,
        parentId: parentId,
        tags: uniqueTags
      };

      // Add new message to the beginning of the array
      return [newMessage, ...prevMessages];
    });
  }, [userId]);

  return {
    messages,
    addMessage,
    userId
  };
};

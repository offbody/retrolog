
import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';

const USER_ID_KEY = 'anon_log_user_id';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string>('');

  // 1. Initialize User ID (Client Side Identity)
  useEffect(() => {
    let storedUserId = localStorage.getItem(USER_ID_KEY);
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // 2. Subscribe to Firestore Messages (Real-time)
  useEffect(() => {
    // Query messages sorted by timestamp descending (newest first)
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching messages from Firebase:", error);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // 3. Add Message Function
  const addMessage = useCallback(async (content: string, parentId?: string, manualTags: string[] = []) => {
    if (!userId) return;

    // Process Tags
    const tagRegex = /#[a-zA-Z0-9_а-яА-ЯёЁ]+/g;
    const regexMatches = content.match(tagRegex) || [] as string[];
    const processedManualTags = manualTags
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const allTags = [...regexMatches, ...processedManualTags];
    const uniqueTags = Array.from(new Set(allTags))
      .filter(tag => tag.length <= 32)
      .map(tag => tag.toLowerCase());

    try {
      // OPTIMIZATION: Calculate Next Sequence Locally
      // Instead of asking the server (slow), we look at the local messages we already have.
      // Since messages are sorted by timestamp desc, the first one usually has the highest sequence.
      // We iterate to be safe (in case of sorting race conditions), but purely in memory.
      
      let nextSequence = 1;
      if (messages.length > 0) {
          const maxSeq = Math.max(...messages.map(m => m.sequenceNumber || 0));
          nextSequence = maxSeq + 1;
      }

      // Construct Message
      const newMessage: Omit<Message, 'id'> = {
        content: content.trim(),
        timestamp: Date.now(),
        sequenceNumber: nextSequence,
        senderId: userId,
        parentId: parentId || null,
        tags: uniqueTags
      };

      // Write to Firebase
      // Firebase SDK handles this optimistically locally, then syncs to cloud.
      // Since we removed the 'await getDocs', this line executes immediately after calculation.
      await addDoc(collection(db, 'messages'), newMessage);

    } catch (e) {
      console.error("Error adding document: ", e);
    }

  }, [userId, messages]); // Added messages dependency to calculate sequence

  return {
    messages,
    addMessage,
    userId
  };
};

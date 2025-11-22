
import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';

const USER_ID_KEY = 'anon_log_user_id';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoaded, setIsLoaded] = useState(false);
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
      setIsLoaded(true);
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
      // Determine Sequence Number
      // We fetch the very latest message by sequenceNumber to increment it.
      // Note: In high-traffic apps, this needs a cloud function or transaction.
      // For this MVP, client-side fetching is acceptable.
      const lastMsgQuery = query(
          collection(db, 'messages'), 
          orderBy('sequenceNumber', 'desc'), 
          limit(1)
      );
      const lastMsgSnap = await getDocs(lastMsgQuery);
      let nextSequence = 1;
      
      if (!lastMsgSnap.empty) {
          const lastMsgData = lastMsgSnap.docs[0].data();
          nextSequence = (lastMsgData.sequenceNumber || 0) + 1;
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
      await addDoc(collection(db, 'messages'), newMessage);

    } catch (e) {
      console.error("Error adding document: ", e);
    }

  }, [userId]);

  return {
    messages,
    addMessage,
    userId
  };
};


import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';

const USER_ID_KEY = 'anon_log_user_id';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set());

  // 1. Initialize User ID (Client Side Identity)
  useEffect(() => {
    let storedUserId = localStorage.getItem(USER_ID_KEY);
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // 2. Subscribe to Banned Users
  useEffect(() => {
      const unsubscribeBans = onSnapshot(collection(db, 'banned_users'), (snapshot) => {
          const bans = new Set(snapshot.docs.map(doc => doc.data().userId));
          setBannedUserIds(bans);
      });
      return () => unsubscribeBans();
  }, []);

  // 3. Subscribe to Firestore Messages (Real-time)
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

  // 4. Add Message Function
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
      // OPTIMISTIC UPDATE (Client-side)
      let nextSequence = 1;
      if (messages.length > 0) {
          const maxSeq = Math.max(...messages.map(m => m.sequenceNumber || 0));
          nextSequence = maxSeq + 1;
      }
      
      const isUserAdmin = !!auth.currentUser;

      // Construct Message
      const newMessage: Omit<Message, 'id'> = {
        content: content.trim(),
        timestamp: Date.now(),
        sequenceNumber: nextSequence,
        senderId: userId,
        parentId: parentId || null,
        tags: uniqueTags,
        isAdmin: isUserAdmin,
        votes: {} // Initialize empty votes
      };
      
      await addDoc(collection(db, 'messages'), newMessage);

    } catch (e) {
      console.error("Error adding document: ", e);
    }

  }, [userId, messages]);

  // 5. Delete Message Function (Admin)
  const deleteMessage = useCallback(async (id: string) => {
      try {
          await deleteDoc(doc(db, 'messages', id));
      } catch (e) {
          console.error("Error deleting document: ", e);
          alert("Ошибка удаления. Проверьте правила Firebase.");
      }
  }, []);

  // 6. Block User Function (Admin)
  const blockUser = useCallback(async (senderId: string) => {
      try {
          await addDoc(collection(db, 'banned_users'), { userId: senderId, timestamp: Date.now() });
      } catch (e) {
          console.error("Error blocking user: ", e);
          alert("Ошибка блокировки.");
      }
  }, []);

  // 7. Voting Function
  const toggleVote = useCallback(async (messageId: string, voteType: 'up' | 'down') => {
    if (!userId) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentVotes = message.votes || {};
    const previousVote = currentVotes[userId] || 0;
    const newVoteValue = voteType === 'up' ? 1 : -1;

    let updatedVotes = { ...currentVotes };

    if (previousVote === newVoteValue) {
        // Remove vote if clicking the same button
        delete updatedVotes[userId];
    } else {
        // Change or add vote
        updatedVotes[userId] = newVoteValue;
    }

    try {
        await updateDoc(doc(db, 'messages', messageId), {
            votes: updatedVotes
        });
    } catch (e) {
        console.error("Error updating vote:", e);
    }
  }, [userId, messages]);

  // Filter out messages from banned users
  const visibleMessages = messages.filter(msg => !bannedUserIds.has(msg.senderId));

  return {
    messages: visibleMessages,
    addMessage,
    deleteMessage,
    blockUser,
    toggleVote,
    userId
  };
};


import { useState, useEffect, useCallback } from 'react';
import { Message, UserProfile } from '../types';
import { db, auth, googleProvider } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot, 
  query, 
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const USER_ID_KEY = 'anon_log_user_id';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set());
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 1. Authentication & Profile Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser) {
            // Logged in via Google
            setUserId(firebaseUser.uid);
            
            // Check/Create User Profile in Firestore
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const newProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    email: firebaseUser.email,
                    karma: 0,
                    createdAt: Date.now()
                };
                await setDoc(userRef, newProfile);
                setUserProfile(newProfile);
            } else {
                setUserProfile(userSnap.data() as UserProfile);
            }
        } else {
            // Guest Mode (Legacy Anonymous)
            let storedUserId = localStorage.getItem(USER_ID_KEY);
            if (!storedUserId) {
                storedUserId = crypto.randomUUID();
                localStorage.setItem(USER_ID_KEY, storedUserId);
            }
            setUserId(storedUserId);
            setUserProfile(null);
        }
        setIsAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Listen to real-time profile updates (Karma, Ban status)
  useEffect(() => {
      if (!userId || !userProfile) return;
      
      const unsubscribeProfile = onSnapshot(doc(db, 'users', userId), (doc) => {
          if (doc.exists()) {
              setUserProfile(doc.data() as UserProfile);
          }
      });

      return () => unsubscribeProfile();
  }, [userId]); // Only re-run if userId changes

  // 3. Login/Logout Functions
  const loginWithGoogle = async () => {
      try {
          await signInWithPopup(auth, googleProvider);
      } catch (error) {
          console.error("Login failed", error);
          throw error; // Rethrow to allow UI to handle state
      }
  };

  const logout = async () => {
      await signOut(auth);
      window.location.reload(); // Reload to reset anonymous state cleanly
  };

  // 4. Subscribe to Banned Users
  useEffect(() => {
      const unsubscribeBans = onSnapshot(collection(db, 'banned_users'), (snapshot) => {
          const bans = new Set(snapshot.docs.map(doc => doc.data().userId));
          setBannedUserIds(bans);
      });
      return () => unsubscribeBans();
  }, []);

  // 5. Subscribe to Messages
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });
    return () => unsubscribe();
  }, []);

  // 6. Add Post/Message
  const addMessage = useCallback(async (content: string, title: string, parentId?: string, manualTags: string[] = []) => {
    if (!userId) return;

    // Tags Logic
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
      let nextSequence = 1;
      if (messages.length > 0) {
          const maxSeq = Math.max(...messages.map(m => m.sequenceNumber || 0));
          nextSequence = maxSeq + 1;
      }
      
      const isAdmin = userProfile?.email?.includes('admin') || false; // Simple check for now

      const newMessage: Omit<Message, 'id'> = {
        title: title.trim() || undefined,
        content: content.trim(),
        timestamp: Date.now(),
        sequenceNumber: nextSequence,
        senderId: userId,
        senderName: userProfile?.displayName || undefined,
        senderAvatar: userProfile?.photoURL || undefined,
        parentId: parentId || null,
        tags: uniqueTags,
        isAdmin: isAdmin,
        votes: {} 
      };
      
      await addDoc(collection(db, 'messages'), newMessage);

    } catch (e) {
      console.error("Error adding document: ", e);
    }

  }, [userId, messages, userProfile]);

  const deleteMessage = useCallback(async (id: string) => {
      try {
          await deleteDoc(doc(db, 'messages', id));
      } catch (e) {
          console.error("Error deleting:", e);
      }
  }, []);

  const blockUser = useCallback(async (senderId: string) => {
      try {
          await addDoc(collection(db, 'banned_users'), { userId: senderId, timestamp: Date.now() });
      } catch (e) {
          console.error("Error blocking:", e);
      }
  }, []);

  const toggleVote = useCallback(async (messageId: string, voteType: 'up' | 'down') => {
    if (!userId) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentVotes = message.votes || {};
    const previousVote = currentVotes[userId] || 0;
    const newVoteValue = voteType === 'up' ? 1 : -1;

    let updatedVotes = { ...currentVotes };

    if (previousVote === newVoteValue) {
        delete updatedVotes[userId];
    } else {
        updatedVotes[userId] = newVoteValue;
    }

    try {
        await updateDoc(doc(db, 'messages', messageId), {
            votes: updatedVotes
        });
        
        // TODO: Karma logic for the author would go here in a Cloud Function
    } catch (e) {
        console.error("Error voting:", e);
    }
  }, [userId, messages]);

  const visibleMessages = messages.filter(msg => !bannedUserIds.has(msg.senderId));

  return {
    messages: visibleMessages,
    addMessage,
    deleteMessage,
    blockUser,
    toggleVote,
    userId,
    userProfile,
    loginWithGoogle,
    logout,
    isAuthLoading
  };
};

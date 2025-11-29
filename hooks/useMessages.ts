
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

// Name Generator for Google Users
const generateCyberpunkName = (): string => {
    const adj = ['Neon', 'Cyber', 'Night', 'Digital', 'Techno', 'Binary', 'Quantum', 'Glitch', 'Retro', 'Hyper', 'Data', 'Null', 'Void', 'Flux'];
    const noun = ['Walker', 'Ghost', 'Surfer', 'Runner', 'Drifter', 'Punk', 'Coder', 'Signal', 'System', 'Core', 'Viper', 'Ronin', 'Wraith', 'Node'];
    const randomAdj = adj[Math.floor(Math.random() * adj.length)];
    const randomNoun = noun[Math.floor(Math.random() * noun.length)];
    const randomNum = Math.floor(Math.random() * 999);
    return `${randomAdj}${randomNoun}_${randomNum}`;
};

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set());
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 1. Authentication & Profile Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        setIsAuthLoading(true);
        
        if (firebaseUser) {
            // --- LOGGED IN STATE ---
            const uid = firebaseUser.uid;
            setUserId(uid);
            
            // Prepare Fallback Profile (Use Auth data immediately)
            // This ensures UI updates even if Firestore fails
            let fallbackName = firebaseUser.displayName;
            const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');

            // Generate name if missing or if it's Google (optional style choice)
            if (isGoogle && !fallbackName) {
                fallbackName = generateCyberpunkName();
            }
            if (!fallbackName && firebaseUser.email) {
                fallbackName = firebaseUser.email.split('@')[0];
            }

            const fallbackProfile: UserProfile = {
                uid: uid,
                displayName: fallbackName || 'RETRO_USER',
                photoURL: firebaseUser.photoURL,
                email: firebaseUser.email,
                karma: 0,
                createdAt: Date.now()
            };

            try {
                // Try to fetch existing profile from Firestore
                const userRef = doc(db, 'users', uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    // Profile exists in DB -> Use it
                    setUserProfile(userSnap.data() as UserProfile);
                } else {
                    // Profile does NOT exist -> Create it
                    // We try to write to DB, but even if this fails, we set local state below
                    await setDoc(userRef, fallbackProfile);
                    setUserProfile(fallbackProfile);
                }
            } catch (error) {
                console.warn("Firestore access failed (likely permissions). Using fallback profile.", error);
                // CRITICAL FALLBACK:
                // Even if DB fails, log the user in VISUALLY using the data we have.
                setUserProfile(fallbackProfile);
            }
        } else {
            // --- GUEST STATE ---
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
      
      // Wrap in try-catch logic (onSnapshot throws via error callback)
      const unsubscribeProfile = onSnapshot(doc(db, 'users', userId), (doc) => {
          if (doc.exists()) {
              setUserProfile(doc.data() as UserProfile);
          }
      }, (error) => {
          console.warn("Realtime profile sync failed:", error);
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
          const bans = new Set(snapshot.docs.map(doc => doc.data().userId as string));
          setBannedUserIds(bans);
      }, (error) => {
           console.warn("Banned users sync failed:", error);
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
      
      // SECURITY FIX: Strict check for admin email only.
      const isAdmin = userProfile?.email === 'offbody@gmail.com';

      // NOTE: Firestore throws "invalid-argument" if any field is undefined.
      // We must construct the object carefully, omitting undefined fields or using null.
      
      const newMessageData: any = {
        content: content.trim(),
        timestamp: Date.now(),
        sequenceNumber: nextSequence,
        senderId: userId,
        parentId: parentId || null, // null is valid
        tags: uniqueTags,
        isAdmin: isAdmin,
        votes: {} 
      };

      // Only add optional fields if they have values to avoid "undefined" error
      if (title && title.trim()) {
          newMessageData.title = title.trim();
      }
      
      if (userProfile?.displayName) {
          newMessageData.senderName = userProfile.displayName;
      }
      
      if (userProfile?.photoURL) {
          newMessageData.senderAvatar = userProfile.photoURL;
      }

      await addDoc(collection(db, 'messages'), newMessageData);

    } catch (e) {
      console.error("Error adding document: ", e);
      // RETHROW the error so the UI knows it failed!
      throw e;
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
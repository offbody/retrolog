
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

// --- DEVELOPMENT CONFIG ---
// Set this to TRUE to simulate a logged-in user in the Preview window
const SIMULATE_AUTH_IN_PREVIEW = true; 

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
    // --- SIMULATION MODE FOR PREVIEW ---
    if (SIMULATE_AUTH_IN_PREVIEW) {
        const mockUid = 'mock-architect-8080';
        setUserId(mockUid);
        setUserProfile({
            uid: mockUid,
            displayName: 'RETRO_ARCHITECT',
            photoURL: null, // Will use generated avatar color
            email: 'architect@retrolog.ru',
            karma: 1984,
            createdAt: Date.now(),
            emailVerified: false // Simulating unverified state for UI testing
        });
        setIsAuthLoading(false);
        return; 
    }
    // -----------------------------------

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        setIsAuthLoading(true);
        
        if (firebaseUser) {
            // --- LOGGED IN STATE ---
            const uid = firebaseUser.uid;
            setUserId(uid);
            
            // Prepare Fallback Profile (Use Auth data immediately)
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
                createdAt: Date.now(),
                emailVerified: firebaseUser.emailVerified
            };

            try {
                // Try to fetch existing profile from Firestore
                const userRef = doc(db, 'users', uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    // Profile exists in DB -> Use it, but ensure emailVerified is fresh from Auth
                    const data = userSnap.data() as UserProfile;
                    setUserProfile({
                        ...data,
                        emailVerified: firebaseUser.emailVerified
                    });
                } else {
                    // Profile does NOT exist -> Create it
                    // We try to write to DB, but even if this fails, we set local state below
                    await setDoc(userRef, fallbackProfile);
                    setUserProfile(fallbackProfile);
                }
            } catch (error) {
                console.warn("Firestore access failed (likely permissions). Using fallback profile.", error);
                // CRITICAL FALLBACK:
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
      if (!userId || !userProfile || SIMULATE_AUTH_IN_PREVIEW) return;
      
      const unsubscribeProfile = onSnapshot(doc(db, 'users', userId), (doc) => {
          if (doc.exists()) {
              // Merge Firestore data with current auth state (to keep emailVerified fresh if it was just updated)
              const firestoreData = doc.data() as UserProfile;
              setUserProfile(prev => prev ? { ...firestoreData, emailVerified: prev.emailVerified } : firestoreData);
          }
      }, (error) => {
          console.warn("Realtime profile sync failed:", error);
      });

      return () => unsubscribeProfile();
  }, [userId]); 

  // 3. Login/Logout Functions
  const loginWithGoogle = async () => {
      try {
          if (SIMULATE_AUTH_IN_PREVIEW) {
              alert("В режиме симуляции вход не требуется.");
              return;
          }
          await signInWithPopup(auth, googleProvider);
      } catch (error) {
          console.error("Login failed", error);
          throw error;
      }
  };

  const logout = async () => {
      if (SIMULATE_AUTH_IN_PREVIEW) {
          // Just reload to clear simulation if we were to turn it off dynamically, 
          // but since it's hardcoded, it will just come back. 
          // For now, let's just alert.
          alert("Выход не работает в режиме симуляции Preview.");
          return;
      }
      await signOut(auth);
      window.location.reload(); 
  };

  // 4. Subscribe to Banned Users
  useEffect(() => {
      // In simulation, no bans
      if (SIMULATE_AUTH_IN_PREVIEW) return;

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
    // In simulation, we might start with some dummy messages if empty
    if (SIMULATE_AUTH_IN_PREVIEW) {
        if (messages.length === 0) {
             // Optional: Seed with one welcome message
             const seed: Message = {
                 id: 'seed-1',
                 content: 'Добро пожаловать в режим архитектора. Система готова к тестированию.',
                 timestamp: Date.now(),
                 sequenceNumber: 1,
                 senderId: 'system',
                 senderName: 'SYSTEM',
                 tags: ['#retrolog'],
                 votes: {},
                 commentCount: 0,
                 media: []
             };
             setMessages([seed]);
        }
        return;
    }

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

    // --- SIMULATION LOGIC ---
    if (SIMULATE_AUTH_IN_PREVIEW) {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));

        let nextSequence = 1;
        if (messages.length > 0) {
            const maxSeq = Math.max(...messages.map(m => m.sequenceNumber || 0));
            nextSequence = maxSeq + 1;
        }

        const newSimMsg: Message = {
            id: `sim-${Date.now()}`,
            content: content.trim(),
            title: title ? title.trim() : undefined,
            timestamp: Date.now(),
            sequenceNumber: nextSequence,
            senderId: userId,
            senderName: userProfile?.displayName || 'SIM_USER',
            senderAvatar: userProfile?.photoURL || undefined,
            parentId: parentId || null,
            tags: uniqueTags,
            isAdmin: false,
            votes: {},
            commentCount: 0,
            media: []
        };

        setMessages(prev => [newSimMsg, ...prev]);
        return;
    }
    // ------------------------

    try {
      let nextSequence = 1;
      if (messages.length > 0) {
          const maxSeq = Math.max(...messages.map(m => m.sequenceNumber || 0));
          nextSequence = maxSeq + 1;
      }
      
      const isAdmin = userProfile?.email === 'root@retrolog.ru';

      const newMessageData: any = {
        content: content.trim(),
        timestamp: Date.now(),
        sequenceNumber: nextSequence,
        senderId: userId,
        parentId: parentId || null, 
        tags: uniqueTags,
        isAdmin: isAdmin,
        votes: {},
        commentCount: 0,
        media: []
      };

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
      throw e;
    }

  }, [userId, messages, userProfile]);

  const deleteMessage = useCallback(async (id: string) => {
      if (SIMULATE_AUTH_IN_PREVIEW) {
          setMessages(prev => prev.filter(m => m.id !== id));
          return;
      }
      try {
          await deleteDoc(doc(db, 'messages', id));
      } catch (e) {
          console.error("Error deleting:", e);
      }
  }, []);

  const blockUser = useCallback(async (senderId: string) => {
      if (SIMULATE_AUTH_IN_PREVIEW) {
          alert(`[SIMULATION] User ${senderId} would be blocked.`);
          return;
      }
      try {
          await addDoc(collection(db, 'banned_users'), { userId: senderId, timestamp: Date.now() });
      } catch (e) {
          console.error("Error blocking:", e);
      }
  }, []);

  const toggleVote = useCallback(async (messageId: string, voteType: 'up' | 'down') => {
    if (!userId) return;
    
    // --- SIMULATION ---
    if (SIMULATE_AUTH_IN_PREVIEW) {
        setMessages(prev => prev.map(msg => {
            if (msg.id !== messageId) return msg;
            
            const currentVotes = msg.votes || {};
            const previousVote = currentVotes[userId] || 0;
            const newVoteValue = voteType === 'up' ? 1 : -1;
            
            const updatedVotes = { ...currentVotes };
            if (previousVote === newVoteValue) {
                delete updatedVotes[userId];
            } else {
                updatedVotes[userId] = newVoteValue;
            }
            return { ...msg, votes: updatedVotes };
        }));
        return;
    }
    // ----------------

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

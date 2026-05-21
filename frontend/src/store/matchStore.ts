import { create } from 'zustand';

interface MatchState {
  gender: string;
  preferredGender: string;
  interests: string[];
  onlineCount: number;
  isSearching: boolean;
  isMatched: boolean;
  currentRoomId: string | null;
  isInitiator: boolean;
  error: string | null;
  queueStatus: 'idle' | 'searching' | 'matched';

  setGender: (gender: string) => void;
  setPreferredGender: (preferredGender: string) => void;
  setInterests: (interests: string[]) => void;
  setOnlineCount: (count: number) => void;
  startSearch: () => void;
  setMatched: (roomId: string, isInitiator: boolean) => void;
  stopSearch: () => void;
  resetMatch: () => void;
  setError: (error: string | null) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  gender: localStorage.getItem('gender') || 'unspecified',
  preferredGender: localStorage.getItem('preferredGender') || 'random',
  interests: localStorage.getItem('interests') ? JSON.parse(localStorage.getItem('interests')!) : [],
  onlineCount: 0,
  isSearching: false,
  isMatched: false,
  currentRoomId: null,
  isInitiator: false,
  error: null,
  queueStatus: 'idle',

  setGender: (gender) => {
    localStorage.setItem('gender', gender);
    set({ gender });
  },

  setPreferredGender: (preferredGender) => {
    localStorage.setItem('preferredGender', preferredGender);
    set({ preferredGender });
  },

  setInterests: (interests) => {
    localStorage.setItem('interests', JSON.stringify(interests));
    set({ interests });
  },

  setOnlineCount: (onlineCount) => set({ onlineCount }),

  startSearch: () => set({ 
    isSearching: true, 
    isMatched: false, 
    currentRoomId: null, 
    isInitiator: false,
    queueStatus: 'searching',
    error: null 
  }),

  setMatched: (currentRoomId, isInitiator) => set({ 
    isSearching: false, 
    isMatched: true, 
    currentRoomId, 
    isInitiator,
    queueStatus: 'matched' 
  }),

  stopSearch: () => set({ 
    isSearching: false, 
    isMatched: false, 
    currentRoomId: null, 
    isInitiator: false,
    queueStatus: 'idle' 
  }),

  resetMatch: () => set({ 
    isMatched: false, 
    currentRoomId: null, 
    isInitiator: false,
    queueStatus: 'idle' 
  }),

  setError: (error) => set({ error })
}));

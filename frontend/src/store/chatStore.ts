import { create } from 'zustand';

export interface ChatMessage {
  senderId: string;
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isPeerTyping: boolean;
  peerTypingTimeout: any | null;
  
  addMessage: (message: ChatMessage) => void;
  setPeerTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isPeerTyping: false,
  peerTypingTimeout: null,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      isPeerTyping: false, // reset typing indicator on new message
    }));
  },

  setPeerTyping: (typing) => {
    const { peerTypingTimeout } = get();
    if (peerTypingTimeout) {
      clearTimeout(peerTypingTimeout);
    }

    if (typing) {
      // Auto-clear typing indicator after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        set({ isPeerTyping: false, peerTypingTimeout: null });
      }, 3000);
      set({ isPeerTyping: true, peerTypingTimeout: timeout });
    } else {
      set({ isPeerTyping: false, peerTypingTimeout: null });
    }
  },

  clearMessages: () => {
    const { peerTypingTimeout } = get();
    if (peerTypingTimeout) {
      clearTimeout(peerTypingTimeout);
    }
    set({ messages: [], isPeerTyping: false, peerTypingTimeout: null });
  }
}));

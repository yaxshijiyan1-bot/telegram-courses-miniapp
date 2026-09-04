import { create } from 'zustand';

interface UIState {
  // Theme & layout preferences
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Active sheets and dialogs
  isCheckoutOpen: boolean;
  selectedCourseId: string | null;
  openCheckout: (courseId: string) => void;
  closeCheckout: () => void;

  isNotificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  // Local search filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  isCheckoutOpen: false,
  selectedCourseId: null,
  openCheckout: (courseId: string) => set({ isCheckoutOpen: true, selectedCourseId: courseId }),
  closeCheckout: () => set({ isCheckoutOpen: false, selectedCourseId: null }),

  isNotificationsOpen: false,
  setNotificationsOpen: (open: boolean) => set({ isNotificationsOpen: open }),

  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  selectedCategory: 'all',
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
}));

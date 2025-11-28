// src/store/uiStore.js
import { create } from 'zustand';

const useUIStore = create((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isAuthModalOpen: false,
  authModalView: 'login', // 'login' | 'register' | 'forgot'
  isQuickViewOpen: false,
  quickViewProduct: null,
  isFilterOpen: false,

  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  setAuthModalOpen: (isOpen, view = 'login') => set({ isAuthModalOpen: isOpen, authModalView: view }),
  setQuickView: (isOpen, product = null) => set({ isQuickViewOpen: isOpen, quickViewProduct: product }),
  setFilterOpen: (isOpen) => set({ isFilterOpen: isOpen }),
}));

export default useUIStore;
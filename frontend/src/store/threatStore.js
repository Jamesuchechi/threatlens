import { create } from 'zustand';

const initialFilters = {
  severity: 'all',
  source: 'all',
  days: 7,
  search: '',
  industry: '',
  exploited: null,
};

export const useThreatStore = create((set) => ({
  // Authentication State
  user: JSON.parse(localStorage.getItem('threatlens_user') || 'null'),
  token: localStorage.getItem('threatlens_token') || null,
  
  setAuth: (user, token) => {
    localStorage.setItem('threatlens_token', token);
    localStorage.setItem('threatlens_user', JSON.stringify(user));
    set({ user, token });
  },
  
  logout: () => {
    localStorage.removeItem('threatlens_token');
    localStorage.removeItem('threatlens_user');
    set({ user: null, token: null });
  },

  // Filters State
  filters: { ...initialFilters },
  
  setFilter: (key, value) => 
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
    
  resetFilters: () => set({ filters: { ...initialFilters } }),
}));

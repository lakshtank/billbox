import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSidebar: () => set({ sidebarOpen: true }),

  activeBatchId: null,
  setActiveBatchId: (batchId) => set({ activeBatchId: batchId }),
  clearActiveBatch: () => set({ activeBatchId: null }),

  isAskBillBoxOpen: false,
  openAskBillBox: () => set({ isAskBillBoxOpen: true }),
  closeAskBillBox: () => set({ isAskBillBoxOpen: false }),
  toggleAskBillBox: () => set((state) => ({ isAskBillBoxOpen: !state.isAskBillBoxOpen })),
}));

export default useUiStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 게임 설정 스토어 (localStorage에 저장)
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // 사운드 설정
      soundEnabled: true,
      soundVolume: 0.7,

      // 애니메이션 설정
      animationSpeed: 'normal', // 'slow', 'normal', 'fast', 'skip'
      reduceMotion: false,

      // 확인 다이얼로그 설정
      confirmBeforePlace: true,
      showTieWarning: true,

      // 튜토리얼 설정
      hasSeenTutorial: false,
      showContextualHints: true,

      // 접근성 설정
      colorBlindMode: false,
      highContrast: false,

      // Actions
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
      toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),
      toggleConfirmBeforePlace: () => set((state) => ({ confirmBeforePlace: !state.confirmBeforePlace })),
      toggleShowTieWarning: () => set((state) => ({ showTieWarning: !state.showTieWarning })),
      setHasSeenTutorial: (value) => set({ hasSeenTutorial: value }),
      toggleContextualHints: () => set((state) => ({ showContextualHints: !state.showContextualHints })),
      toggleColorBlindMode: () => set((state) => ({ colorBlindMode: !state.colorBlindMode })),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),

      // 설정 초기화
      resetSettings: () => set({
        soundEnabled: true,
        soundVolume: 0.7,
        animationSpeed: 'normal',
        reduceMotion: false,
        confirmBeforePlace: true,
        showTieWarning: true,
        showContextualHints: true,
        colorBlindMode: false,
        highContrast: false,
      }),
    }),
    {
      name: 'lasvegas-settings',
    }
  )
);

// 게임 UI 상태 스토어 (임시 상태)
export const useGameUIStore = create((set, get) => ({
  // 모달 상태
  showSettings: false,
  showTutorial: false,
  showRoundSummary: false,
  showConfirmDialog: false,

  // 정산 애니메이션 상태
  isPayoutAnimating: false,
  payoutStep: 0,
  payoutData: null,

  // 확인 다이얼로그 데이터
  confirmDialogData: null,

  // 라운드 요약 데이터
  roundSummaryData: null,

  // 토스트 메시지
  toasts: [],

  // Actions
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),

  openTutorial: () => set({ showTutorial: true }),
  closeTutorial: () => set({ showTutorial: false }),

  openRoundSummary: (data) => set({ showRoundSummary: true, roundSummaryData: data }),
  closeRoundSummary: () => set({ showRoundSummary: false, roundSummaryData: null }),

  openConfirmDialog: (data) => set({ showConfirmDialog: true, confirmDialogData: data }),
  closeConfirmDialog: () => set({ showConfirmDialog: false, confirmDialogData: null }),

  // 정산 애니메이션
  startPayoutAnimation: (data) => set({
    isPayoutAnimating: true,
    payoutStep: 0,
    payoutData: data
  }),
  nextPayoutStep: () => set((state) => ({ payoutStep: state.payoutStep + 1 })),
  endPayoutAnimation: () => set({
    isPayoutAnimating: false,
    payoutStep: 0,
    payoutData: null
  }),

  // 토스트
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), ...toast }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));

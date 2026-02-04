import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Chat from './components/Chat/Chat';
import Join from './components/Join/Join';
import Game from './components/Game/Game';
import Tutorial from './components/Tutorial/Tutorial';
import Settings from './components/Settings/Settings';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import RoundSummary from './components/RoundSummary/RoundSummary';
import ToastContainer from './components/Toast/Toast';
import { useSettingsStore, useGameUIStore } from './stores/gameStore';

const App = () => {
  const { hasSeenTutorial, reduceMotion, highContrast, colorBlindMode } = useSettingsStore();
  const {
    showSettings,
    showTutorial,
    toasts,
    removeToast,
    openTutorial
  } = useGameUIStore();

  // 첫 방문 시 튜토리얼 표시
  useEffect(() => {
    if (!hasSeenTutorial) {
      // 약간의 딜레이 후 튜토리얼 표시
      const timer = setTimeout(() => {
        openTutorial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial, openTutorial]);

  // 접근성: prefers-reduced-motion 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && !reduceMotion) {
      // 시스템 설정이 모션 감소인 경우 알림
      console.log('System prefers reduced motion');
    }
  }, [reduceMotion]);

  // 접근성 클래스 적용
  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
    document.body.classList.toggle('color-blind-mode', colorBlindMode);
    document.body.classList.toggle('reduce-motion', reduceMotion);
  }, [highContrast, colorBlindMode, reduceMotion]);

  return (
    <Router>
      {/* 메인 라우트 */}
      <Route exact path="/" component={Join} />
      <Route path="/chat" component={Chat} />
      <Route path="/game" component={Game} />

      {/* 전역 오버레이 컴포넌트 */}
      <AnimatePresence>
        {showTutorial && <Tutorial key="tutorial" />}
        {showSettings && <Settings key="settings" />}
      </AnimatePresence>

      {/* 확인 다이얼로그 */}
      <ConfirmDialog />

      {/* 라운드 요약 */}
      <RoundSummary />

      {/* 토스트 알림 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Router>
  );
};

export default App;

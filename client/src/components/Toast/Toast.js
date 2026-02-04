import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { mobile } from '../../utill';

// 토스트 타입별 설정
const toastConfig = {
  success: {
    icon: '✅',
    bgColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
    textColor: '#4ade80',
  },
  error: {
    icon: '❌',
    bgColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: 'rgba(255, 107, 107, 0.4)',
    textColor: '#ff6b6b',
  },
  warning: {
    icon: '⚠️',
    bgColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
    textColor: '#ffd700',
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'rgba(79, 172, 254, 0.15)',
    borderColor: 'rgba(79, 172, 254, 0.4)',
    textColor: '#4facfe',
  },
  turn: {
    icon: '🎲',
    bgColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
    textColor: '#ffd700',
  },
  money: {
    icon: '💰',
    bgColor: 'rgba(74, 222, 128, 0.2)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
    textColor: '#4ade80',
  },
  tie: {
    icon: '⚡',
    bgColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.5)',
    textColor: '#ff6b6b',
  },
  placement: {
    icon: '🎯',
    bgColor: 'rgba(102, 126, 234, 0.15)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
    textColor: '#667eea',
  },
};

const ToastItem = ({ toast, onRemove }) => {
  const config = toastConfig[toast.type] || toastConfig.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <ToastWrapper
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20 }}
      bgColor={config.bgColor}
      borderColor={config.borderColor}
      onClick={() => onRemove(toast.id)}
      role="alert"
      aria-live="polite"
    >
      <ToastIcon>{toast.icon || config.icon}</ToastIcon>
      <ToastContent>
        {toast.title && (
          <ToastTitle textColor={config.textColor}>{toast.title}</ToastTitle>
        )}
        <ToastMessage>{toast.message}</ToastMessage>
      </ToastContent>
      <CloseButton onClick={() => onRemove(toast.id)} aria-label="닫기">
        ✕
      </CloseButton>
      <ProgressBar duration={toast.duration || 4000} bgColor={config.borderColor} />
    </ToastWrapper>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <Container>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </Container>
  );
};

// 게임 이벤트별 토스트 헬퍼 함수들
export const createToast = {
  turn: (playerName, isMyTurn) => ({
    type: 'turn',
    title: isMyTurn ? '당신의 턴!' : '턴 변경',
    message: isMyTurn ? '주사위를 굴려주세요!' : `${playerName}의 턴입니다.`,
    duration: isMyTurn ? 5000 : 3000,
    icon: isMyTurn ? '🎲' : '👤',
  }),

  placement: (playerName, casinoNumber, diceCount) => ({
    type: 'placement',
    title: '주사위 배치',
    message: `${playerName}이(가) 카지노 ${casinoNumber}에 ${diceCount}개 배치`,
    duration: 3000,
  }),

  tie: (casinoNumber, players) => ({
    type: 'tie',
    title: '동점 발생!',
    message: `카지노 ${casinoNumber}: ${players.join(', ')} 모두 제거!`,
    duration: 5000,
  }),

  money: (playerName, casinoNumber, amount) => ({
    type: 'money',
    title: '지폐 획득!',
    message: `${playerName}이(가) 카지노 ${casinoNumber}에서 $${amount.toLocaleString()} 획득`,
    duration: 4000,
  }),

  roundEnd: (roundNumber) => ({
    type: 'info',
    title: '라운드 종료',
    message: `${roundNumber}라운드가 종료되었습니다.`,
    duration: 3000,
  }),

  gameEnd: (winnerName) => ({
    type: 'success',
    title: '게임 종료!',
    message: `${winnerName}님이 우승했습니다!`,
    duration: 6000,
    icon: '🏆',
  }),

  error: (message) => ({
    type: 'error',
    title: '오류',
    message,
    duration: 5000,
  }),

  connectionLost: () => ({
    type: 'error',
    title: '연결 끊김',
    message: '서버와 연결이 끊어졌습니다. 재연결 시도 중...',
    duration: 10000,
    icon: '🔌',
  }),

  connectionRestored: () => ({
    type: 'success',
    title: '연결 복구',
    message: '서버에 다시 연결되었습니다.',
    duration: 3000,
    icon: '✅',
  }),

  playerJoined: (playerName) => ({
    type: 'info',
    title: '플레이어 참가',
    message: `${playerName}님이 참가했습니다.`,
    duration: 3000,
    icon: '👋',
  }),

  playerLeft: (playerName) => ({
    type: 'warning',
    title: '플레이어 퇴장',
    message: `${playerName}님이 나갔습니다.`,
    duration: 3000,
    icon: '👋',
  }),
};

const progress = keyframes`
  from { width: 100%; }
  to { width: 0%; }
`;

const Container = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2000;
  max-width: 380px;
  width: 100%;
  pointer-events: none;

  ${mobile} {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    width: auto;
  }
`;

const ToastWrapper = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.bgColor};
  border: 1px solid ${props => props.borderColor};
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  overflow: hidden;

  ${mobile} {
    padding: 12px 14px;
    border-radius: 10px;
  }
`;

const ToastIcon = styled.span`
  font-size: 1.3rem;
  flex-shrink: 0;
`;

const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.textColor};
  margin: 0 0 4px 0;
`;

const ToastMessage = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: ${props => props.bgColor};
  animation: ${progress} ${props => props.duration}ms linear forwards;
`;

export default ToastContainer;

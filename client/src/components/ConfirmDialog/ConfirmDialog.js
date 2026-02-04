import React, { useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { useGameUIStore, useSettingsStore } from '../../stores/gameStore';
import { useGameSound } from '../../hooks/useSound';
import { mobile } from '../../utill';

const ConfirmDialog = () => {
  const { showConfirmDialog, confirmDialogData, closeConfirmDialog } = useGameUIStore();
  const { showTieWarning } = useSettingsStore();
  const { playClick, playTieWarning } = useGameSound();

  const handleConfirm = useCallback(() => {
    playClick();
    if (confirmDialogData?.onConfirm) {
      confirmDialogData.onConfirm();
    }
    closeConfirmDialog();
  }, [confirmDialogData, closeConfirmDialog, playClick]);

  const handleCancel = useCallback(() => {
    playClick();
    if (confirmDialogData?.onCancel) {
      confirmDialogData.onCancel();
    }
    closeConfirmDialog();
  }, [confirmDialogData, closeConfirmDialog, playClick]);

  // 타이 경고 사운드
  useEffect(() => {
    if (showConfirmDialog && confirmDialogData?.isTieWarning && showTieWarning) {
      playTieWarning();
    }
  }, [showConfirmDialog, confirmDialogData, showTieWarning, playTieWarning]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showConfirmDialog) {
        handleCancel();
      } else if (e.key === 'Enter' && showConfirmDialog) {
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmDialog, handleCancel, handleConfirm]);

  if (!showConfirmDialog || !confirmDialogData) return null;

  const { title, message, casinoNumber, diceCount, isTieWarning, tieWith } = confirmDialogData;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCancel}
      >
        <DialogBox
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          isTieWarning={isTieWarning}
          role="dialog"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {isTieWarning && (
            <WarningBanner>
              <WarningIcon>⚠️</WarningIcon>
              <WarningText>타이 위험!</WarningText>
            </WarningBanner>
          )}

          <DialogContent>
            <DialogIcon isTieWarning={isTieWarning}>
              {isTieWarning ? '⚡' : '🎲'}
            </DialogIcon>

            <DialogTitle id="dialog-title" isTieWarning={isTieWarning}>
              {title || (isTieWarning ? '동점 경고!' : '주사위 배치 확인')}
            </DialogTitle>

            <DialogMessage id="dialog-description">
              {message || `카지노 ${casinoNumber}번에 주사위 ${diceCount}개를 배치합니다.`}
            </DialogMessage>

            {isTieWarning && tieWith && (
              <TieWarningBox>
                <TieWarningTitle>현재 동점 상황</TieWarningTitle>
                <TieWarningContent>
                  {tieWith.map((player, idx) => (
                    <TiePlayer key={idx} color={player.color}>
                      <TiePlayerDot color={player.color} />
                      <span>{player.name}: {player.count}개</span>
                    </TiePlayer>
                  ))}
                </TieWarningContent>
                <TieWarningNote>
                  💡 동점이 되면 모두 제거됩니다!
                </TieWarningNote>
              </TieWarningBox>
            )}

            <PreviewBox>
              <PreviewLabel>배치 프리뷰</PreviewLabel>
              <PreviewContent>
                <CasinoPreview>
                  <CasinoNumber>{casinoNumber}</CasinoNumber>
                </CasinoPreview>
                <Arrow>←</Arrow>
                <DicePreview>
                  {Array(diceCount).fill(0).map((_, i) => (
                    <PreviewDice key={i}>🎲</PreviewDice>
                  ))}
                  <span>{diceCount}개</span>
                </DicePreview>
              </PreviewContent>
            </PreviewBox>
          </DialogContent>

          <DialogActions>
            <CancelButton onClick={handleCancel}>
              취소
            </CancelButton>
            <ConfirmButton onClick={handleConfirm} isTieWarning={isTieWarning}>
              {isTieWarning ? '그래도 배치' : '확인'}
            </ConfirmButton>
          </DialogActions>

          <KeyboardHint>
            <span>Enter: 확인</span>
            <span>ESC: 취소</span>
          </KeyboardHint>
        </DialogBox>
      </Overlay>
    </AnimatePresence>
  );
};

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1800;
  padding: 20px;
`;

const DialogBox = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  border: 2px solid ${props => props.isTieWarning
    ? 'rgba(255, 107, 107, 0.5)'
    : 'rgba(255, 215, 0, 0.3)'};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              ${props => props.isTieWarning
                ? '0 0 40px rgba(255, 107, 107, 0.2)'
                : '0 0 40px rgba(255, 215, 0, 0.1)'};

  ${props => props.isTieWarning && `
    animation: ${shake} 0.3s ease-in-out;
  `}

  ${mobile} {
    border-radius: 16px;
  }
`;

const WarningBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(90deg, rgba(255, 107, 107, 0.3) 0%, rgba(255, 107, 107, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 107, 107, 0.3);
`;

const WarningIcon = styled.span`
  font-size: 1.5rem;
  animation: ${pulse} 1s ease-in-out infinite;
`;

const WarningText = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #ff6b6b;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const DialogContent = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  ${mobile} {
    padding: 20px;
  }
`;

const DialogIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  ${props => props.isTieWarning && `animation: ${pulse} 1s ease-in-out infinite;`}
`;

const DialogTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${props => props.isTieWarning ? '#ff6b6b' : '#ffd700'};
  margin: 0 0 12px 0;

  ${mobile} {
    font-size: 1.1rem;
  }
`;

const DialogMessage = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin: 0;

  ${mobile} {
    font-size: 0.9rem;
  }
`;

const TieWarningBox = styled.div`
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  width: 100%;
`;

const TieWarningTitle = styled.h4`
  font-size: 0.85rem;
  color: #ff6b6b;
  margin: 0 0 12px 0;
  font-weight: 600;
`;

const TieWarningContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const TiePlayer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
`;

const TiePlayerDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const TieWarningNote = styled.p`
  margin: 12px 0 0 0;
  font-size: 0.8rem;
  color: rgba(255, 107, 107, 0.9);
  font-weight: 500;
`;

const PreviewBox = styled.div`
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  width: 100%;
`;

const PreviewLabel = styled.span`
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
`;

const PreviewContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const CasinoPreview = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 10px;
`;

const CasinoNumber = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;
`;

const Arrow = styled.span`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.5);
`;

const DicePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const PreviewDice = styled.span`
  font-size: 1.2rem;
`;

const DialogActions = styled.div`
  display: flex;
  gap: 12px;
  padding: 0 24px 24px 24px;

  ${mobile} {
    padding: 0 20px 20px 20px;
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const CancelButton = styled(Button)`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const ConfirmButton = styled(Button)`
  background: ${props => props.isTieWarning
    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)'
    : 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)'};
  border: none;
  color: ${props => props.isTieWarning ? 'white' : '#1a1a2e'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px ${props => props.isTieWarning
      ? 'rgba(255, 107, 107, 0.4)'
      : 'rgba(255, 215, 0, 0.4)'};
  }
`;

const KeyboardHint = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  span {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }

  ${mobile} {
    display: none;
  }
`;

export default ConfirmDialog;

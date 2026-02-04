import React, { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { useSettingsStore, useGameUIStore } from '../../stores/gameStore';
import { useGameSound } from '../../hooks/useSound';
import { mobile } from '../../utill';

/**
 * 정산 시퀀스 애니메이션 컴포넌트
 *
 * payoutData 구조:
 * {
 *   casinos: [
 *     {
 *       number: 1,
 *       money: [80000, 30000],
 *       placements: [{ playerId, color, count }],
 *       ties: [{ players: ['red', 'blue'], count: 3 }],
 *       winners: [{ playerId, color, rank, money }]
 *     }
 *   ]
 * }
 */
const PayoutSequence = ({ payoutData, onComplete }) => {
  const [currentCasino, setCurrentCasino] = useState(0);
  const [phase, setPhase] = useState('intro'); // 'intro', 'ties', 'payout', 'complete'
  const [animatingItem, setAnimatingItem] = useState(null);

  const { animationSpeed, reduceMotion } = useSettingsStore();
  const { playTieRemove, playMoneyWin, playRoundEnd } = useGameSound();

  // 애니메이션 속도 설정
  const getDelay = useCallback(() => {
    if (reduceMotion) return 0;
    const speeds = { slow: 2000, normal: 1200, fast: 600, skip: 0 };
    return speeds[animationSpeed] || 1200;
  }, [animationSpeed, reduceMotion]);

  // 정산 시퀀스 진행
  useEffect(() => {
    if (!payoutData?.casinos) return;

    const casinos = payoutData.casinos;
    const delay = getDelay();

    if (phase === 'intro') {
      playRoundEnd();
      const timer = setTimeout(() => {
        setPhase('ties');
      }, delay);
      return () => clearTimeout(timer);
    }

    if (phase === 'ties') {
      const casino = casinos[currentCasino];
      if (casino?.ties?.length > 0) {
        playTieRemove();
        setAnimatingItem({ type: 'tie', data: casino.ties });
        const timer = setTimeout(() => {
          setPhase('payout');
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setPhase('payout');
      }
    }

    if (phase === 'payout') {
      const casino = casinos[currentCasino];
      if (casino?.winners?.length > 0) {
        playMoneyWin();
        setAnimatingItem({ type: 'payout', data: casino.winners });
      }

      const timer = setTimeout(() => {
        if (currentCasino < casinos.length - 1) {
          setCurrentCasino((prev) => prev + 1);
          setPhase('ties');
          setAnimatingItem(null);
        } else {
          setPhase('complete');
        }
      }, delay);
      return () => clearTimeout(timer);
    }

    if (phase === 'complete') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, delay / 2);
      return () => clearTimeout(timer);
    }
  }, [phase, currentCasino, payoutData, getDelay, playTieRemove, playMoneyWin, playRoundEnd, onComplete]);

  if (!payoutData?.casinos) return null;

  const casino = payoutData.casinos[currentCasino];

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SequenceContainer>
        {/* 헤더 */}
        <Header>
          <Title>정산 중...</Title>
          <CasinoProgress>
            {payoutData.casinos.map((_, idx) => (
              <ProgressDot
                key={idx}
                active={idx === currentCasino}
                completed={idx < currentCasino}
              />
            ))}
          </CasinoProgress>
        </Header>

        {/* 현재 카지노 */}
        <CasinoDisplay>
          <AnimatePresence mode="wait">
            <CasinoCard
              key={casino?.number}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <CasinoNumber>{casino?.number}</CasinoNumber>
              <CasinoLabel>Casino {casino?.number}</CasinoLabel>

              {/* 지폐 표시 */}
              <MoneyStack>
                {casino?.money?.map((amount, idx) => (
                  <MoneyChip
                    key={idx}
                    value={amount}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    ${(amount / 1000).toFixed(0)}K
                  </MoneyChip>
                ))}
              </MoneyStack>

              {/* 주사위 배치 현황 */}
              <PlacementsArea>
                {casino?.placements?.map((placement, idx) => (
                  <PlacementRow
                    key={idx}
                    color={placement.color}
                    isTied={casino?.ties?.some(t =>
                      t.players.includes(placement.color)
                    )}
                  >
                    <PlayerDot color={placement.color} />
                    <span>{placement.color}</span>
                    <DiceCount>{placement.count}개</DiceCount>
                  </PlacementRow>
                ))}
              </PlacementsArea>
            </CasinoCard>
          </AnimatePresence>
        </CasinoDisplay>

        {/* 애니메이션 영역 */}
        <AnimationArea>
          <AnimatePresence mode="wait">
            {/* 타이 제거 애니메이션 */}
            {phase === 'ties' && animatingItem?.type === 'tie' && (
              <TieAnimation
                key="tie"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <TieIcon>⚡</TieIcon>
                <TieText>동점 제거!</TieText>
                <TiedPlayers>
                  {animatingItem.data.map((tie, idx) => (
                    <TiedGroup key={idx}>
                      {tie.players.map((player, pidx) => (
                        <TiedPlayer key={pidx} color={player}>
                          {player} ({tie.count}개)
                        </TiedPlayer>
                      ))}
                    </TiedGroup>
                  ))}
                </TiedPlayers>
              </TieAnimation>
            )}

            {/* 지폐 획득 애니메이션 */}
            {phase === 'payout' && animatingItem?.type === 'payout' && (
              <PayoutAnimation
                key="payout"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
              >
                {animatingItem.data.map((winner, idx) => (
                  <WinnerRow
                    key={idx}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.2 }}
                  >
                    <WinnerRank>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}위`}
                    </WinnerRank>
                    <WinnerColor color={winner.color} />
                    <WinnerName>{winner.color}</WinnerName>
                    <WinnerMoney>
                      <MoneyIcon>💰</MoneyIcon>
                      +${winner.money?.toLocaleString()}
                    </WinnerMoney>
                  </WinnerRow>
                ))}
              </PayoutAnimation>
            )}

            {/* 완료 */}
            {phase === 'complete' && (
              <CompleteAnimation
                key="complete"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <CompleteIcon>✨</CompleteIcon>
                <CompleteText>정산 완료!</CompleteText>
              </CompleteAnimation>
            )}
          </AnimatePresence>
        </AnimationArea>

        {/* 스킵 버튼 */}
        {animationSpeed !== 'skip' && (
          <SkipButton onClick={onComplete}>
            스킵 →
          </SkipButton>
        )}
      </SequenceContainer>
    </Overlay>
  );
};

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1700;
`;

const SequenceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
  max-width: 500px;
  width: 100%;

  ${mobile} {
    padding: 20px;
    gap: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffd700;
  margin: 0;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  animation: ${pulse} 2s ease-in-out infinite;

  ${mobile} {
    font-size: 1.4rem;
  }
`;

const CasinoProgress = styled.div`
  display: flex;
  gap: 8px;
`;

const ProgressDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    if (props.active) return '#ffd700';
    if (props.completed) return 'rgba(255, 215, 0, 0.5)';
    return 'rgba(255, 255, 255, 0.2)';
  }};
  transition: all 0.3s ease;
  ${props => props.active && `animation: ${pulse} 1s ease-in-out infinite;`}
`;

const CasinoDisplay = styled.div`
  width: 100%;
`;

const CasinoCard = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 24px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.1);

  ${mobile} {
    padding: 16px;
    border-radius: 16px;
  }
`;

const CasinoNumber = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 16px;
  font-size: 2rem;
  font-weight: 800;
  color: #1a1a2e;

  ${mobile} {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }
`;

const CasinoLabel = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
`;

const MoneyStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
`;

const MoneyChip = styled(motion.div)`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  background: ${props => {
    const v = props.value;
    if (v >= 70000) return 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)';
    if (v >= 40000) return 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)';
    return 'linear-gradient(135deg, #cd7f32 0%, #b06820 100%)';
  }};
`;

const PlacementsArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PlacementRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: ${props => props.isTied
    ? 'rgba(255, 107, 107, 0.2)'
    : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 10px;
  border: 1px solid ${props => props.isTied
    ? 'rgba(255, 107, 107, 0.4)'
    : 'transparent'};
  ${props => props.isTied && `animation: ${shake} 0.3s ease-in-out;`}

  span {
    flex: 1;
    font-size: 0.9rem;
    color: ${props => props.color};
    text-transform: capitalize;
  }
`;

const PlayerDot = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const DiceCount = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
`;

const AnimationArea = styled.div`
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TieAnimation = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 20px;
  border: 2px solid rgba(255, 107, 107, 0.4);
`;

const TieIcon = styled.div`
  font-size: 3rem;
  animation: ${pulse} 0.5s ease-in-out infinite;
`;

const TieText = styled.div`
  font-size: 1.3rem;
  font-weight: 800;
  color: #ff6b6b;
  text-transform: uppercase;
`;

const TiedPlayers = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TiedGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const TiedPlayer = styled.div`
  padding: 6px 12px;
  background: ${props => props.color};
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
`;

const PayoutAnimation = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const WinnerRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
`;

const WinnerRank = styled.div`
  font-size: 1.5rem;
  min-width: 40px;
  text-align: center;
`;

const WinnerColor = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${props => props.color};
`;

const WinnerName = styled.span`
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
`;

const WinnerMoney = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  font-weight: 700;
  color: #4ade80;
`;

const MoneyIcon = styled.span`
  font-size: 1.2rem;
`;

const CompleteAnimation = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const CompleteIcon = styled.div`
  font-size: 4rem;
  animation: ${pulse} 1s ease-in-out infinite;
`;

const CompleteText = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(90deg, #ffd700, #4ade80, #ffd700);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 2s linear infinite;
`;

const SkipButton = styled.button`
  padding: 10px 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

export default PayoutSequence;

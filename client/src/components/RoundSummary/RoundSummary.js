import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { useGameUIStore, useSettingsStore } from '../../stores/gameStore';
import { useGameSound } from '../../hooks/useSound';
import { mobile } from '../../utill';

const RoundSummary = () => {
  const { showRoundSummary, roundSummaryData, closeRoundSummary } = useGameUIStore();
  const { animationSpeed } = useSettingsStore();
  const { playRoundEnd, playMoneyWin, playClick } = useGameSound();

  useEffect(() => {
    if (showRoundSummary) {
      playRoundEnd();
      // 승자에게 돈 획득 사운드
      setTimeout(() => {
        if (roundSummaryData?.results?.length > 0) {
          playMoneyWin();
        }
      }, 500);
    }
  }, [showRoundSummary, roundSummaryData, playRoundEnd, playMoneyWin]);

  if (!showRoundSummary || !roundSummaryData) return null;

  const { round, totalRounds, results, standings, isGameEnd } = roundSummaryData;

  // 애니메이션 속도 설정
  const getDelay = (index) => {
    const speeds = { slow: 0.5, normal: 0.3, fast: 0.15, skip: 0 };
    return index * (speeds[animationSpeed] || 0.3);
  };

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <SummaryCard
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          isGameEnd={isGameEnd}
        >
          {isGameEnd ? (
            <GameEndHeader>
              <TrophyIcon>🏆</TrophyIcon>
              <GameEndTitle>게임 종료!</GameEndTitle>
            </GameEndHeader>
          ) : (
            <Header>
              <RoundBadge>ROUND {round}</RoundBadge>
              <HeaderTitle>라운드 결과</HeaderTitle>
            </Header>
          )}

          <Content>
            {/* 이번 라운드/게임 획득 금액 */}
            <Section>
              <SectionTitle>
                {isGameEnd ? '최종 결과' : '이번 라운드 획득'}
              </SectionTitle>
              <ResultList>
                {results.map((result, index) => (
                  <ResultItem
                    key={result.playerId || index}
                    rank={index + 1}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: getDelay(index) }}
                    isWinner={index === 0 && isGameEnd}
                  >
                    <RankBadge rank={index + 1}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </RankBadge>
                    <PlayerInfo>
                      <PlayerColor color={result.color}>
                        {result.isAI ? '🤖' : '👤'}
                      </PlayerColor>
                      <PlayerName color={result.color}>
                        {result.name || result.color}
                        {result.isAI && <AITag>AI</AITag>}
                      </PlayerName>
                    </PlayerInfo>
                    <MoneyEarned positive={result.money > 0}>
                      {result.money > 0 ? '+' : ''}${result.money.toLocaleString()}
                    </MoneyEarned>
                  </ResultItem>
                ))}
              </ResultList>
            </Section>

            {/* 누적 순위 (게임 종료가 아닐 때만) */}
            {!isGameEnd && standings && (
              <Section>
                <SectionTitle>누적 순위</SectionTitle>
                <StandingsList>
                  {standings.map((player, index) => (
                    <StandingItem
                      key={player.playerId || index}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: getDelay(index) + 0.3 }}
                    >
                      <StandingRank>#{index + 1}</StandingRank>
                      <StandingColor color={player.color} />
                      <StandingName>{player.name || player.color}</StandingName>
                      <StandingMoney>${player.totalMoney.toLocaleString()}</StandingMoney>
                    </StandingItem>
                  ))}
                </StandingsList>
              </Section>
            )}

            {/* 게임 종료 시 축하 메시지 */}
            {isGameEnd && standings && standings[0] && (
              <WinnerSection
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <Confetti>🎊</Confetti>
                <WinnerText>
                  <WinnerColor color={standings[0].color} />
                  <span>{standings[0].name || standings[0].color}</span>
                  <span>님이 우승!</span>
                </WinnerText>
                <WinnerMoney>
                  총 ${standings[0].totalMoney.toLocaleString()} 획득
                </WinnerMoney>
                <Confetti>🎊</Confetti>
              </WinnerSection>
            )}
          </Content>

          <Footer>
            {!isGameEnd && (
              <RoundProgress>
                {Array(totalRounds).fill(0).map((_, i) => (
                  <RoundDot key={i} completed={i < round} current={i === round - 1} />
                ))}
              </RoundProgress>
            )}

            <NextButton
              onClick={() => {
                playClick();
                closeRoundSummary();
              }}
              isGameEnd={isGameEnd}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGameEnd ? '🚪 나가기' : `다음 라운드 →`}
            </NextButton>
          </Footer>
        </SummaryCard>
      </Overlay>
    </AnimatePresence>
  );
};

const confettiAnimation = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(180deg); }
  100% { transform: translateY(0) rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
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
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1600;
  padding: 20px;
`;

const SummaryCard = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  max-width: 450px;
  width: 100%;
  overflow: hidden;
  border: 2px solid ${props => props.isGameEnd
    ? 'rgba(255, 215, 0, 0.5)'
    : 'rgba(255, 255, 255, 0.1)'};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              ${props => props.isGameEnd && '0 0 60px rgba(255, 215, 0, 0.2)'};

  ${mobile} {
    border-radius: 16px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
`;

const Header = styled.div`
  padding: 24px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 16px;

  ${mobile} {
    padding: 16px;
  }
`;

const RoundBadge = styled.div`
  padding: 8px 16px;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #1a1a2e;
`;

const HeaderTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  margin: 0;

  ${mobile} {
    font-size: 1.1rem;
  }
`;

const GameEndHeader = styled.div`
  padding: 32px 24px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 107, 107, 0.2) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const TrophyIcon = styled.div`
  font-size: 4rem;
  animation: ${pulse} 1s ease-in-out infinite;
`;

const GameEndTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #ffd700, #ff6b6b, #ffd700);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 2s linear infinite;

  ${mobile} {
    font-size: 1.5rem;
  }
`;

const Content = styled.div`
  padding: 24px;
  max-height: 400px;
  overflow-y: auto;

  ${mobile} {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px 0;
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ResultItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.isWinner
    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)'
    : 'rgba(255, 255, 255, 0.03)'};
  border-radius: 12px;
  border: 1px solid ${props => props.isWinner
    ? 'rgba(255, 215, 0, 0.3)'
    : 'rgba(255, 255, 255, 0.05)'};

  ${props => props.isWinner && `
    animation: ${pulse} 2s ease-in-out infinite;
  `}
`;

const RankBadge = styled.div`
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.rank <= 3 ? '1.3rem' : '0.9rem'};
  font-weight: 700;
  color: ${props => {
    if (props.rank === 1) return '#ffd700';
    if (props.rank === 2) return '#c0c0c0';
    if (props.rank === 3) return '#cd7f32';
    return 'rgba(255, 255, 255, 0.5)';
  }};
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const PlayerColor = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

const PlayerName = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => props.color};
  text-transform: capitalize;
`;

const AITag = styled.span`
  padding: 2px 6px;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  font-size: 0.65rem;
  border-radius: 4px;
  font-weight: 700;
`;

const MoneyEarned = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.positive ? '#4ade80' : 'rgba(255, 255, 255, 0.5)'};
`;

const StandingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StandingItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
`;

const StandingRank = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  min-width: 24px;
`;

const StandingColor = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${props => props.color};
`;

const StandingName = styled.span`
  flex: 1;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: capitalize;
`;

const StandingMoney = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffd700;
`;

const WinnerSection = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  flex-wrap: wrap;
`;

const Confetti = styled.span`
  font-size: 2rem;
  animation: ${confettiAnimation} 1s ease-in-out infinite;
`;

const WinnerText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffd700;
`;

const WinnerColor = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${props => props.color};
`;

const WinnerMoney = styled.span`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
`;

const Footer = styled.div`
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  ${mobile} {
    padding: 16px;
  }
`;

const RoundProgress = styled.div`
  display: flex;
  gap: 8px;
`;

const RoundDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    if (props.current) return '#ffd700';
    if (props.completed) return 'rgba(255, 215, 0, 0.5)';
    return 'rgba(255, 255, 255, 0.2)';
  }};
  transition: all 0.3s ease;
`;

const NextButton = styled(motion.button)`
  padding: 14px 32px;
  border-radius: 14px;
  border: none;
  background: ${props => props.isGameEnd
    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)'
    : 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)'};
  color: ${props => props.isGameEnd ? 'white' : '#1a1a2e'};
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;

  ${mobile} {
    width: 100%;
    padding: 12px 24px;
    font-size: 1rem;
  }
`;

export default RoundSummary;

import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore, useGameUIStore } from '../../stores/gameStore';
import { useGameSound } from '../../hooks/useSound';
import { mobile } from '../../utill';

const tutorialSteps = [
  {
    id: 'welcome',
    title: '라스베가스에 오신 것을 환영합니다!',
    content: '라스베가스는 주사위를 굴려 카지노에서 돈을 따는 게임입니다. 4라운드 후 가장 많은 돈을 모은 플레이어가 승리합니다!',
    icon: '🎰',
    highlight: null,
  },
  {
    id: 'casinos',
    title: '6개의 카지노',
    content: '게임에는 1~6번까지 6개의 카지노가 있습니다. 각 카지노에는 지폐가 놓여 있어요. 높은 금액의 지폐를 가져가세요!',
    icon: '🏢',
    highlight: 'casino',
  },
  {
    id: 'dice-roll',
    title: '주사위 굴리기',
    content: '자신의 턴이 되면 남은 주사위를 모두 굴립니다. 시작할 때 8개의 주사위를 가지고 있어요.',
    icon: '🎲',
    highlight: 'roll-button',
  },
  {
    id: 'dice-select',
    title: '숫자 선택하기',
    content: '굴린 주사위 중 하나의 숫자를 선택합니다. 선택한 숫자의 주사위는 모두 해당 번호의 카지노에 배치됩니다.',
    icon: '👆',
    highlight: 'dice-group',
    example: '예: 3이 4개 나왔다면, 3을 선택하면 4개 모두 카지노 3번에!',
  },
  {
    id: 'tie-rule',
    title: '⚠️ 핵심 규칙: 타이 (동점)',
    content: '같은 카지노에 동일한 개수의 주사위를 놓은 플레이어들은 모두 제거됩니다! 이것이 게임의 핵심 전략입니다.',
    icon: '⚡',
    highlight: 'tie-warning',
    example: '예: A가 3개, B가 3개 → 둘 다 제거되고 C의 2개가 1등!',
    isImportant: true,
  },
  {
    id: 'payout',
    title: '정산하기',
    content: '모든 플레이어의 주사위가 소진되면 정산합니다. 각 카지노에서 가장 많은 주사위를 가진 플레이어가 최고액 지폐를 가져갑니다.',
    icon: '💰',
    highlight: 'money',
  },
  {
    id: 'rounds',
    title: '4라운드 진행',
    content: '게임은 총 4라운드로 진행됩니다. 매 라운드마다 주사위가 리셋되고, 새로운 지폐가 배치됩니다.',
    icon: '🔄',
    highlight: null,
  },
  {
    id: 'tips',
    title: '전략 팁',
    content: '타이를 유발하여 상대를 제거하거나, 타이를 피해 안전하게 수익을 챙기세요. 때로는 적은 주사위로 높은 수익을 얻을 수 있습니다!',
    icon: '💡',
    highlight: null,
  },
];

const Tutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { closeTutorial } = useGameUIStore();
  const { setHasSeenTutorial } = useSettingsStore();
  const { playClick } = useGameSound();

  const handleNext = useCallback(() => {
    playClick();
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setHasSeenTutorial(true);
      closeTutorial();
    }
  }, [currentStep, closeTutorial, setHasSeenTutorial, playClick]);

  const handlePrev = useCallback(() => {
    playClick();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, playClick]);

  const handleSkip = useCallback(() => {
    playClick();
    setHasSeenTutorial(true);
    closeTutorial();
  }, [closeTutorial, setHasSeenTutorial, playClick]);

  const step = tutorialSteps[currentStep];

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <TutorialCard
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        isImportant={step.isImportant}
      >
        <ProgressBar>
          <ProgressFill style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }} />
        </ProgressBar>

        <StepCounter>
          {currentStep + 1} / {tutorialSteps.length}
        </StepCounter>

        <AnimatePresence mode="wait">
          <StepContent
            key={step.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <StepIcon isImportant={step.isImportant}>{step.icon}</StepIcon>
            <StepTitle isImportant={step.isImportant}>{step.title}</StepTitle>
            <StepDescription>{step.content}</StepDescription>

            {step.example && (
              <ExampleBox isImportant={step.isImportant}>
                <ExampleLabel>예시</ExampleLabel>
                <ExampleText>{step.example}</ExampleText>
              </ExampleBox>
            )}

            {step.id === 'tie-rule' && (
              <TieAnimation>
                <TiePlayer color="red">
                  <TieDice>3개</TieDice>
                </TiePlayer>
                <TieVs>VS</TieVs>
                <TiePlayer color="blue">
                  <TieDice>3개</TieDice>
                </TiePlayer>
                <TieResult>
                  <TieArrow>→</TieArrow>
                  <TieText>둘 다 제거!</TieText>
                </TieResult>
              </TieAnimation>
            )}
          </StepContent>
        </AnimatePresence>

        <ButtonGroup>
          <SkipButton onClick={handleSkip}>
            건너뛰기
          </SkipButton>

          <NavButtons>
            {currentStep > 0 && (
              <NavButton onClick={handlePrev} variant="secondary">
                ← 이전
              </NavButton>
            )}
            <NavButton onClick={handleNext} variant="primary">
              {currentStep === tutorialSteps.length - 1 ? '시작하기!' : '다음 →'}
            </NavButton>
          </NavButtons>
        </ButtonGroup>

        <DotsContainer>
          {tutorialSteps.map((_, index) => (
            <Dot
              key={index}
              active={index === currentStep}
              onClick={() => {
                playClick();
                setCurrentStep(index);
              }}
            />
          ))}
        </DotsContainer>
      </TutorialCard>
    </Overlay>
  );
};

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
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
  z-index: 2000;
  padding: 20px;
`;

const TutorialCard = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  border: 2px solid ${(props) => props.isImportant ? '#ff6b6b' : 'rgba(255, 215, 0, 0.3)'};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              ${(props) => props.isImportant
                ? '0 0 40px rgba(255, 107, 107, 0.3)'
                : '0 0 40px rgba(255, 215, 0, 0.1)'};
  position: relative;

  ${mobile} {
    padding: 20px;
    border-radius: 16px;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px 24px 0 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  transition: width 0.3s ease;
`;

const StepCounter = styled.span`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const StepContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
`;

const StepIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 16px;
  animation: ${(props) => props.isImportant ? pulse : 'none'} 1s ease-in-out infinite;

  ${mobile} {
    font-size: 3rem;
  }
`;

const StepTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${(props) => props.isImportant ? '#ff6b6b' : '#ffd700'};
  margin: 0 0 16px 0;
  text-shadow: 0 0 20px ${(props) => props.isImportant
    ? 'rgba(255, 107, 107, 0.5)'
    : 'rgba(255, 215, 0, 0.5)'};

  ${mobile} {
    font-size: 1.2rem;
  }
`;

const StepDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0;

  ${mobile} {
    font-size: 0.9rem;
  }
`;

const ExampleBox = styled.div`
  margin-top: 20px;
  padding: 16px;
  background: ${(props) => props.isImportant
    ? 'rgba(255, 107, 107, 0.1)'
    : 'rgba(255, 215, 0, 0.1)'};
  border: 1px solid ${(props) => props.isImportant
    ? 'rgba(255, 107, 107, 0.3)'
    : 'rgba(255, 215, 0, 0.3)'};
  border-radius: 12px;
  width: 100%;
`;

const ExampleLabel = styled.span`
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
`;

const ExampleText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-style: italic;
`;

const TieAnimation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  flex-wrap: wrap;

  ${mobile} {
    gap: 8px;
    padding: 12px;
  }
`;

const TiePlayer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${(props) => props.color};
  border-radius: 12px;
  animation: ${shake} 0.5s ease-in-out infinite;
`;

const TieDice = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: white;
`;

const TieVs = styled.span`
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffd700;
`;

const TieResult = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TieArrow = styled.span`
  font-size: 1.5rem;
  color: #ff6b6b;
`;

const TieText = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #ff6b6b;
  animation: ${pulse} 1s ease-in-out infinite;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  ${mobile} {
    flex-direction: column-reverse;
    gap: 12px;
  }
`;

const SkipButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px 16px;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: 12px;

  ${mobile} {
    width: 100%;
    justify-content: center;
  }
`;

const NavButton = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
    border: none;
    color: #1a1a2e;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255, 215, 0, 0.4);
    }
  ` : `
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.05);
    }
  `}

  ${mobile} {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
`;

const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
`;

const Dot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: ${(props) => props.active
    ? '#ffd700'
    : 'rgba(255, 255, 255, 0.2)'};
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: ${(props) => props.active
      ? '#ffd700'
      : 'rgba(255, 255, 255, 0.4)'};
    transform: scale(1.2);
  }
`;

export default Tutorial;

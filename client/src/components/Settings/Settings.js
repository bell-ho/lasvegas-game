import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useSettingsStore, useGameUIStore } from '../../stores/gameStore';
import { useGameSound } from '../../hooks/useSound';
import { mobile } from '../../utill';

const Settings = () => {
  const {
    soundEnabled,
    soundVolume,
    animationSpeed,
    reduceMotion,
    confirmBeforePlace,
    showTieWarning,
    showContextualHints,
    colorBlindMode,
    highContrast,
    toggleSound,
    setSoundVolume,
    setAnimationSpeed,
    toggleReduceMotion,
    toggleConfirmBeforePlace,
    toggleShowTieWarning,
    toggleContextualHints,
    toggleColorBlindMode,
    toggleHighContrast,
    resetSettings,
  } = useSettingsStore();

  const { closeSettings, openTutorial } = useGameUIStore();
  const { playClick } = useGameSound();

  const handleToggle = (toggleFn) => {
    playClick();
    toggleFn();
  };

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeSettings}
    >
      <SettingsPanel
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <Title>설정</Title>
          <CloseButton onClick={closeSettings} aria-label="설정 닫기">
            ✕
          </CloseButton>
        </Header>

        <SettingsContent>
          {/* 사운드 설정 */}
          <Section>
            <SectionTitle>
              <SectionIcon>🔊</SectionIcon>
              사운드
            </SectionTitle>

            <SettingRow>
              <SettingLabel>
                <span>사운드 효과</span>
                <SettingDescription>게임 효과음 활성화</SettingDescription>
              </SettingLabel>
              <Toggle
                active={soundEnabled}
                onClick={() => handleToggle(toggleSound)}
                role="switch"
                aria-checked={soundEnabled}
              >
                <ToggleThumb active={soundEnabled} />
              </Toggle>
            </SettingRow>

            {soundEnabled && (
              <SettingRow>
                <SettingLabel>
                  <span>볼륨</span>
                </SettingLabel>
                <VolumeSlider>
                  <VolumeInput
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    aria-label="볼륨 조절"
                  />
                  <VolumeValue>{Math.round(soundVolume * 100)}%</VolumeValue>
                </VolumeSlider>
              </SettingRow>
            )}
          </Section>

          {/* 애니메이션 설정 */}
          <Section>
            <SectionTitle>
              <SectionIcon>✨</SectionIcon>
              애니메이션
            </SectionTitle>

            <SettingRow>
              <SettingLabel>
                <span>애니메이션 속도</span>
                <SettingDescription>정산 연출 및 효과 속도</SettingDescription>
              </SettingLabel>
              <SpeedSelector>
                {[
                  { value: 'slow', label: '느림' },
                  { value: 'normal', label: '보통' },
                  { value: 'fast', label: '빠름' },
                  { value: 'skip', label: '스킵' },
                ].map((option) => (
                  <SpeedButton
                    key={option.value}
                    active={animationSpeed === option.value}
                    onClick={() => {
                      playClick();
                      setAnimationSpeed(option.value);
                    }}
                  >
                    {option.label}
                  </SpeedButton>
                ))}
              </SpeedSelector>
            </SettingRow>

            <SettingRow>
              <SettingLabel>
                <span>움직임 줄이기</span>
                <SettingDescription>애니메이션 최소화 (접근성)</SettingDescription>
              </SettingLabel>
              <Toggle
                active={reduceMotion}
                onClick={() => handleToggle(toggleReduceMotion)}
                role="switch"
                aria-checked={reduceMotion}
              >
                <ToggleThumb active={reduceMotion} />
              </Toggle>
            </SettingRow>
          </Section>

          {/* 게임플레이 설정 */}
          <Section>
            <SectionTitle>
              <SectionIcon>🎮</SectionIcon>
              게임플레이
            </SectionTitle>

            <SettingRow>
              <SettingLabel>
                <span>배치 전 확인</span>
                <SettingDescription>주사위 배치 전 확인 다이얼로그</SettingDescription>
              </SettingLabel>
              <Toggle
                active={confirmBeforePlace}
                onClick={() => handleToggle(toggleConfirmBeforePlace)}
                role="switch"
                aria-checked={confirmBeforePlace}
              >
                <ToggleThumb active={confirmBeforePlace} />
              </Toggle>
            </SettingRow>

            <SettingRow>
              <SettingLabel>
                <span>타이 경고 표시</span>
                <SettingDescription>동점 위험 시 경고 표시</SettingDescription>
              </SettingLabel>
              <Toggle
                active={showTieWarning}
                onClick={() => handleToggle(toggleShowTieWarning)}
                role="switch"
                aria-checked={showTieWarning}
              >
                <ToggleThumb active={showTieWarning} />
              </Toggle>
            </SettingRow>

            <SettingRow>
              <SettingLabel>
                <span>힌트 표시</span>
                <SettingDescription>게임 중 도움말 표시</SettingDescription>
              </SettingLabel>
              <Toggle
                active={showContextualHints}
                onClick={() => handleToggle(toggleContextualHints)}
                role="switch"
                aria-checked={showContextualHints}
              >
                <ToggleThumb active={showContextualHints} />
              </Toggle>
            </SettingRow>
          </Section>

          {/* 접근성 설정 */}
          <Section>
            <SectionTitle>
              <SectionIcon>♿</SectionIcon>
              접근성
            </SectionTitle>

            <SettingRow>
              <SettingLabel>
                <span>색맹 모드</span>
                <SettingDescription>색상 외 패턴으로 구분</SettingDescription>
              </SettingLabel>
              <Toggle
                active={colorBlindMode}
                onClick={() => handleToggle(toggleColorBlindMode)}
                role="switch"
                aria-checked={colorBlindMode}
              >
                <ToggleThumb active={colorBlindMode} />
              </Toggle>
            </SettingRow>

            <SettingRow>
              <SettingLabel>
                <span>고대비 모드</span>
                <SettingDescription>텍스트/UI 대비 강화</SettingDescription>
              </SettingLabel>
              <Toggle
                active={highContrast}
                onClick={() => handleToggle(toggleHighContrast)}
                role="switch"
                aria-checked={highContrast}
              >
                <ToggleThumb active={highContrast} />
              </Toggle>
            </SettingRow>
          </Section>

          {/* 도움말 */}
          <Section>
            <SectionTitle>
              <SectionIcon>❓</SectionIcon>
              도움말
            </SectionTitle>

            <HelpButton onClick={() => {
              playClick();
              closeSettings();
              openTutorial();
            }}>
              <span>📖</span>
              튜토리얼 다시 보기
            </HelpButton>
          </Section>

          {/* 초기화 */}
          <ResetButton onClick={() => {
            playClick();
            resetSettings();
          }}>
            설정 초기화
          </ResetButton>
        </SettingsContent>
      </SettingsPanel>
    </Overlay>
  );
};

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1500;
  display: flex;
  justify-content: flex-end;
`;

const SettingsPanel = styled(motion.div)`
  width: 400px;
  max-width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-left: 1px solid rgba(255, 215, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${mobile} {
    width: 100%;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffd700;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const SettingsContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 3px;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-of-type {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SectionIcon = styled.span`
  font-size: 1.1rem;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const SettingLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  > span:first-of-type {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }
`;

const SettingDescription = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
`;

const Toggle = styled.button`
  width: 48px;
  height: 26px;
  border-radius: 13px;
  border: none;
  padding: 2px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${(props) => props.active
    ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)'
    : 'rgba(255, 255, 255, 0.2)'};
`;

const ToggleThumb = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
  transform: translateX(${(props) => props.active ? '22px' : '0'});
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const VolumeSlider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VolumeInput = styled.input`
  width: 100px;
  height: 4px;
  border-radius: 2px;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  outline: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffd700;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
  }

  ${mobile} {
    width: 80px;
  }
`;

const VolumeValue = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  min-width: 36px;
`;

const SpeedSelector = styled.div`
  display: flex;
  gap: 4px;
`;

const SpeedButton = styled.button`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid ${(props) => props.active
    ? 'rgba(255, 215, 0, 0.5)'
    : 'rgba(255, 255, 255, 0.1)'};
  background: ${(props) => props.active
    ? 'rgba(255, 215, 0, 0.2)'
    : 'transparent'};
  color: ${(props) => props.active
    ? '#ffd700'
    : 'rgba(255, 255, 255, 0.6)'};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 215, 0, 0.3);
    background: rgba(255, 215, 0, 0.1);
  }
`;

const HelpButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
    color: #ffd700;
  }
`;

const ResetButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;

  &:hover {
    background: rgba(255, 107, 107, 0.2);
  }
`;

export default Settings;

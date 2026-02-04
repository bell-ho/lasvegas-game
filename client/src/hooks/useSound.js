import { useCallback } from 'react';
import { useSettingsStore } from '../stores/gameStore';

// 사운드 파일 정의 (Web Audio API로 생성하는 합성 사운드)
const createSynthSound = (type) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  return {
    play: (volume = 0.7) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (type) {
        case 'diceRoll':
          // 주사위 굴리는 소리 - 짧은 노이즈 버스트
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.15);
          break;

        case 'dicePlace':
          // 주사위 배치 소리 - 딱 소리
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);
          gainNode.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;

        case 'tieWarning':
          // 타이 경고 소리 - 경고음
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case 'tieRemove':
          // 타이 제거 소리 - 쉭 소리
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;

        case 'moneyWin':
          // 돈 획득 소리 - 차칭
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
          oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3); // C6
          gainNode.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;

        case 'turnStart':
          // 턴 시작 소리 - 벨
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;

        case 'roundEnd':
          // 라운드 종료 소리 - 드럼롤 느낌
          oscillator.type = 'triangle';
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              const osc = audioContext.createOscillator();
              const gain = audioContext.createGain();
              osc.connect(gain);
              gain.connect(audioContext.destination);
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(200 + i * 50, audioContext.currentTime);
              gain.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
              osc.start(audioContext.currentTime);
              osc.stop(audioContext.currentTime + 0.1);
            }, i * 80);
          }
          return; // Early return since we handle this differently

        case 'gameEnd':
          // 게임 종료 소리 - 승리 팡파레
          const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
          notes.forEach((freq, i) => {
            setTimeout(() => {
              const osc = audioContext.createOscillator();
              const gain = audioContext.createGain();
              osc.connect(gain);
              gain.connect(audioContext.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, audioContext.currentTime);
              gain.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
              osc.start(audioContext.currentTime);
              osc.stop(audioContext.currentTime + 0.2);
            }, i * 100);
          });
          return;

        case 'click':
          // 클릭 소리
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.05);
          break;

        case 'error':
          // 에러 소리
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;

        default:
          break;
      }
    }
  };
};

// 사운드 인스턴스 캐시
const soundCache = {};

const getSound = (type) => {
  if (!soundCache[type]) {
    soundCache[type] = createSynthSound(type);
  }
  return soundCache[type];
};

// 사운드 훅
export const useGameSound = () => {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const soundVolume = useSettingsStore((state) => state.soundVolume);

  const playSound = useCallback((type) => {
    if (!soundEnabled) return;

    try {
      const sound = getSound(type);
      sound.play(soundVolume);
    } catch (error) {
      console.warn('Sound play failed:', error);
    }
  }, [soundEnabled, soundVolume]);

  return {
    playDiceRoll: () => playSound('diceRoll'),
    playDicePlace: () => playSound('dicePlace'),
    playTieWarning: () => playSound('tieWarning'),
    playTieRemove: () => playSound('tieRemove'),
    playMoneyWin: () => playSound('moneyWin'),
    playTurnStart: () => playSound('turnStart'),
    playRoundEnd: () => playSound('roundEnd'),
    playGameEnd: () => playSound('gameEnd'),
    playClick: () => playSound('click'),
    playError: () => playSound('error'),
  };
};

export default useGameSound;

import React, { Children, useCallback, useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import socket from '../../socket';
import { mobile, tablet, tabletAndBelow } from '../../utill';
import { useHistory } from 'react-router-dom';
import DiceRoller from '../DiceRoller/DiceRoller';
import { useGameSound } from '../../hooks/useSound';
import { useSettingsStore, useGameUIStore } from '../../stores/gameStore';
import { createToast } from '../Toast/Toast';

const Ground = ({ color }) => {
  const history = useHistory();
  const [out, setOut] = useState(false);
  const [groundData, setGroundData] = useState([]);
  const [who, setWho] = useState({});
  const [printDice, setPrintDice] = useState([]);
  const [actRoll, setActRoll] = useState(false);
  const [roundInfo, setRoundInfo] = useState({ currentRound: 1, totalRounds: 4 });
  const [users, setUsers] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [draggedNumber, setDraggedNumber] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [diceCountForRoll, setDiceCountForRoll] = useState(8);
  const [dealerDiceCountForRoll, setDealerDiceCountForRoll] = useState(0);
  const prevTurnRef = useRef(null);

  // Hooks for new features
  const { playDiceRoll, playDicePlace, playTurnStart, playTieWarning, playClick } = useGameSound();
  const { confirmBeforePlace, showTieWarning, colorBlindMode } = useSettingsStore();
  const { openSettings, openConfirmDialog, addToast, openRoundSummary } = useGameUIStore();

  useEffect(() => {
    socket.emit('groundInfo');
  }, []);

  useEffect(() => {
    socket.on('out', () => {
      setOut(true);
    });

    socket.on('whoTurn', (data) => {
      setWho(data);
      setActRoll(false);

      // 턴 변경 사운드 및 토스트
      if (prevTurnRef.current !== data?.color) {
        const isMyTurn = data?.color === color;
        if (isMyTurn) {
          playTurnStart();
        }
        addToast(createToast.turn(data?.color, isMyTurn));
        prevTurnRef.current = data?.color;
      }
    });

    socket.on('groundResult', (data) => {
      setGroundData(data);
    });

    socket.on('printDice', (data) => {
      setPrintDice(data);
    });

    socket.on('newRound', (data) => {
      setRoundInfo(data);
      setPrintDice([]);
      setActRoll(false);
    });

    socket.on('roomData', (data) => {
      setUsers(data.users || []);
    });

    // 라운드 결과 이벤트 (서버에서 추가 필요)
    socket.on('roundResult', (data) => {
      openRoundSummary(data);
    });

    return () => {
      socket.off('out');
      socket.off('whoTurn');
      socket.off('groundResult');
      socket.off('printDice');
      socket.off('newRound');
      socket.off('roomData');
      socket.off('roundResult');
    };
  }, [color, playTurnStart, addToast, openRoundSummary]);

  const [displayCount, setDisplayCount] = useState(0);

  const rollDice = (playerColor) => {
    playDiceRoll();
    socket.emit('rollDice', playerColor);
    setActRoll(true);
    setDisplayCount(0);
    setIsRolling(true);

    // 주사위 개수 설정
    const count = (who?.diceCnt || 4) + (who?.dealerDiceCnt || 0);
    setDiceCountForRoll(count);
    setDealerDiceCountForRoll(who?.dealerDiceCnt || 0);
  };

  const handleDiceRollComplete = useCallback(() => {
    setIsRolling(false);
  }, []);

  // 타이 체크 함수
  const checkForTie = (casinoNumber) => {
    const casino = groundData.find((g) => g.id === casinoNumber);
    if (!casino) return { isTie: false, tieWith: [] };

    const myDiceCount = printDice.filter((d) => d.number === casinoNumber).length;
    const existingCounts = {};

    casino.placedDice.forEach((diceColor) => {
      existingCounts[diceColor] = (existingCounts[diceColor] || 0) + 1;
    });

    const tieWith = [];
    Object.entries(existingCounts).forEach(([playerColor, count]) => {
      if (count === myDiceCount && playerColor !== color) {
        tieWith.push({
          color: playerColor,
          name: playerColor,
          count,
        });
      }
    });

    return { isTie: tieWith.length > 0, tieWith };
  };

  const executeSelectDice = (number) => {
    playDicePlace();
    const selectedDice = printDice.filter((v) => v.number === number);
    socket.emit('selectDice', { color, number, selectedDice });
    setDisplayCount(0);
    setDraggedNumber(null);

    // 토스트 알림
    addToast(createToast.placement(color, number, selectedDice.length));
  };

  const selectDice = (number) => {
    const selectedDice = printDice.filter((v) => v.number === number);
    const diceCount = selectedDice.length;

    // 타이 체크
    const { isTie, tieWith } = checkForTie(number);

    // 확인 다이얼로그 표시 여부
    if (confirmBeforePlace || (isTie && showTieWarning)) {
      openConfirmDialog({
        title: isTie ? '동점 경고!' : '주사위 배치 확인',
        message: `카지노 ${number}번에 주사위 ${diceCount}개를 배치합니다.`,
        casinoNumber: number,
        diceCount,
        isTieWarning: isTie,
        tieWith: isTie ? tieWith : null,
        onConfirm: () => executeSelectDice(number),
        onCancel: () => {
          setDraggedNumber(null);
        },
      });
    } else {
      executeSelectDice(number);
    }
  };

  // 드래그 앤 드롭 핸들러 (데스크톱)
  const handleDragStart = (e, diceNumber) => {
    if (color !== who?.color) return;
    setDraggedNumber(diceNumber);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, casinoId) => {
    e.preventDefault();
    if (draggedNumber === casinoId) {
      setDropTarget(casinoId);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e, casinoId) => {
    e.preventDefault();
    setDropTarget(null);
    if (draggedNumber === casinoId && color === who?.color) {
      selectDice(casinoId);
    }
  };

  const handleDragEnd = () => {
    setDraggedNumber(null);
    setDropTarget(null);
  };

  // 터치 이벤트 핸들러 (모바일)
  const touchStartPos = useRef({ x: 0, y: 0 });
  const currentDragNumber = useRef(null);

  const handleTouchStart = (e, diceNumber) => {
    if (color !== who?.color) return;
    e.preventDefault();
    currentDragNumber.current = diceNumber;
    setDraggedNumber(diceNumber);
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e) => {
    if (!currentDragNumber.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // 카지노 카드 찾기
    const casinoCard = element?.closest('[data-casino-id]');
    if (casinoCard) {
      const casinoId = parseInt(casinoCard.dataset.casinoId);
      if (currentDragNumber.current === casinoId) {
        setDropTarget(casinoId);
      } else {
        setDropTarget(null);
      }
    } else {
      setDropTarget(null);
    }
  };

  const handleTouchEnd = (e) => {
    if (!currentDragNumber.current) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // 카지노 카드 찾기
    const casinoCard = element?.closest('[data-casino-id]');
    if (casinoCard) {
      const casinoId = parseInt(casinoCard.dataset.casinoId);
      if (currentDragNumber.current === casinoId && color === who?.color) {
        selectDice(casinoId);
      }
    }

    currentDragNumber.current = null;
    setDraggedNumber(null);
    setDropTarget(null);
  };

  useEffect(() => {
    if (displayCount < printDice.length) {
      const timer = setTimeout(() => {
        setDisplayCount((prev) => prev + 1);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [displayCount, printDice]);

  const clickOut = useCallback(() => {
    history.push(`/`);
    window.location.reload();
  }, []);

  return (
    <PageWrapper role="main" aria-label="라스베가스 게임 화면">
      <TopBar role="banner" aria-label="게임 정보">
        <PlayerInfo>
          <PlayerBadge color={color} aria-label={`내 플레이어: ${color}`}>
            <PlayerIcon aria-hidden="true">👤</PlayerIcon>
            <span>{color.toUpperCase()}</span>
          </PlayerBadge>
        </PlayerInfo>
        <RoundBadge aria-live="polite" aria-label={`현재 라운드: ${roundInfo.currentRound}/${roundInfo.totalRounds}`}>
          <RoundIcon aria-hidden="true">🎯</RoundIcon>
          <span>ROUND {roundInfo.currentRound} / {roundInfo.totalRounds}</span>
        </RoundBadge>
        <SettingsButton
          onClick={() => {
            playClick();
            openSettings();
          }}
          aria-label="설정 열기"
        >
          <span aria-hidden="true">⚙️</span>
        </SettingsButton>
      </TopBar>

      {users.length > 0 && (
        <ScoreBoard role="region" aria-label="플레이어 점수판">
          {users.map((u) => (
            <ScoreItem
              key={u.color}
              isMe={u.color === color}
              isAI={u.isAI}
              data-player-color={u.color}
              aria-label={`${u.color} 플레이어${u.isAI ? ' (AI)' : ''}: ${(u.totalMoney || 0).toLocaleString()}원, 주사위 ${u.diceCnt + u.dealerDiceCnt}개`}
            >
              <ScoreColor color={u.color} aria-hidden="true">
                {u.isAI ? '🤖' : '👤'}
              </ScoreColor>
              <ScoreInfo>
                <ScoreName color={u.color}>
                  {u.color} {u.isAI && <AITag>AI</AITag>}
                </ScoreName>
                <ScoreMoney aria-label={`보유 금액: ${(u.totalMoney || 0).toLocaleString()}원`}>
                  <span aria-hidden="true">💰</span> {(u.totalMoney || 0).toLocaleString()}
                </ScoreMoney>
              </ScoreInfo>
              <DiceCount aria-label={`남은 주사위: ${u.diceCnt + u.dealerDiceCnt}개`}>
                <span aria-hidden="true">🎲</span> {u.diceCnt + u.dealerDiceCnt}
              </DiceCount>
            </ScoreItem>
          ))}
        </ScoreBoard>
      )}

      <GameSection role="region" aria-label="게임 영역">
        <TurnIndicator aria-live="polite" aria-label={`현재 턴: ${who?.color || '대기 중'}`}>
          <TurnLabel>현재 턴</TurnLabel>
          <TurnPlayer color={who?.color}>
            {who?.isAI ? '🤖' : '👤'} {who?.color?.toUpperCase()}
            {who?.isAI && <AIIndicator>AI 진행 중...</AIIndicator>}
          </TurnPlayer>
        </TurnIndicator>

        <ActionArea>
          {who?.isAI ? (
            <ActionButton disabled isAI>
              <ButtonSpinner />
              AI 플레이 중...
            </ActionButton>
          ) : (
            <ActionButton
              onClick={() => rollDice(color)}
              disabled={actRoll || color !== who?.color}
              isMyTurn={color === who?.color}
            >
              🎲 주사위 굴리기
            </ActionButton>
          )}

          {out && (
            <ExitButton onClick={clickOut}>
              🚪 나가기
            </ExitButton>
          )}
        </ActionArea>

        {/* 3D 물리 시뮬레이션 주사위 굴리기 (Three.js + Cannon.js) */}
        {isRolling && (
          <DiceRoller
            diceCount={diceCountForRoll}
            dealerDiceCount={dealerDiceCountForRoll}
            onComplete={handleDiceRollComplete}
            playerColor={color}
          />
        )}

        {printDice.length > 0 && !isRolling && (
          <DiceArea>
            <DiceLegend>
              <LegendItem>
                <LegendDice color={color} />
                <span>내 주사위</span>
              </LegendItem>
              <LegendItem>
                <LegendDice isDealer />
                <span>딜러 주사위 (D)</span>
              </LegendItem>
            </DiceLegend>
            <DragHint>
              {color === who?.color && who?.diceCnt + who?.dealerDiceCnt === displayCount
                ? '💡 주사위 그룹을 탭하면 해당 카지노에 배치됩니다!'
                : color === who?.color
                ? '주사위가 모두 나올 때까지 기다려주세요...'
                : '상대방 턴입니다'}
            </DragHint>

            {/* 숫자별로 그룹화하여 표시 */}
            <DiceGroupContainer>
              {[...new Set(printDice.slice(0, displayCount).map(d => d.number))]
                .sort((a, b) => a - b)
                .map((number) => {
                  const diceGroup = printDice.filter(d => d.number === number);
                  const isBeingDragged = draggedNumber === number;
                  return (
                    <DiceGroup
                      key={number}
                      draggable={color === who?.color && who?.diceCnt + who?.dealerDiceCnt === displayCount}
                      onDragStart={(e) => handleDragStart(e, number)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, number)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => {
                        if (color === who?.color && who?.diceCnt + who?.dealerDiceCnt === displayCount) {
                          selectDice(number);
                        }
                      }}
                      isDragging={isBeingDragged}
                      isMyTurn={color === who?.color && who?.diceCnt + who?.dealerDiceCnt === displayCount}
                    >
                      <DiceGroupHeader>
                        <DiceGroupNumber>Casino {number}</DiceGroupNumber>
                        <DiceGroupCount>{diceGroup.length}개</DiceGroupCount>
                      </DiceGroupHeader>
                      <DiceGroupDice>
                        {diceGroup.map((dice, i) => (
                          <DiceFace
                            key={i}
                            color={dice.owner}
                            isDealer={dice.owner === 'white'}
                            isGrouped
                          >
                            {renderDiceDots(dice.number)}
                            {dice.owner === 'white' && <DealerBadge>D</DealerBadge>}
                          </DiceFace>
                        ))}
                      </DiceGroupDice>
                    </DiceGroup>
                  );
                })}
            </DiceGroupContainer>
          </DiceArea>
        )}
      </GameSection>

      <CasinoGrid role="region" aria-label="카지노 보드">
        {groundData &&
          Children.toArray(
            groundData.map((v, i) => (
              <CasinoCard
                key={v.id}
                index={i}
                data-casino-id={v.id}
                onDragOver={(e) => handleDragOver(e, v.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, v.id)}
                isDropTarget={dropTarget === v.id}
                canDrop={draggedNumber === v.id}
                role="region"
                aria-label={`카지노 ${v.id}번, 지폐: ${v.money.map(m => `$${(m/1000).toFixed(0)}K`).join(', ')}, 배치된 주사위: ${v.placedDice.length}개`}
                tabIndex={0}
              >
                <CasinoHeader>
                  <CasinoNumber aria-hidden="true">{v.id}</CasinoNumber>
                  <CasinoName>Casino {v.id}</CasinoName>
                  {draggedNumber && (
                    <DropIndicator canDrop={draggedNumber === v.id} aria-live="polite">
                      {draggedNumber === v.id ? '✓ 여기에 놓으세요!' : '✗ 숫자 불일치'}
                    </DropIndicator>
                  )}
                </CasinoHeader>

                <MoneyStack aria-label={`지폐: ${v.money.map(m => `$${(m/1000).toFixed(0)}K`).join(', ')}`}>
                  {v.money
                    .sort((a, b) => b - a)
                    .map((m, mi) => (
                      <MoneyChip key={mi} value={m} aria-label={`$${(m/1000).toFixed(0)}K`}>
                        ${(m / 1000).toFixed(0)}K
                      </MoneyChip>
                    ))}
                </MoneyStack>

                <PlacedDiceArea aria-label={`배치된 주사위: ${v.placedDice.length > 0 ? v.placedDice.join(', ') : '없음'}`}>
                  {v.placedDice.length > 0 ? (
                    v.placedDice.sort().map((diceColor, di) => (
                      <PlacedDice key={di} color={diceColor} data-player-color={diceColor} aria-label={`${diceColor} 주사위`} />
                    ))
                  ) : (
                    <EmptySlot>주사위 없음</EmptySlot>
                  )}
                </PlacedDiceArea>
              </CasinoCard>
            )),
          )}
      </CasinoGrid>
    </PageWrapper>
  );
};

const renderDiceDots = (number) => {
  const dotPositions = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  };

  return dotPositions[number]?.map((pos, i) => (
    <DiceDot key={i} position={pos} />
  ));
};

const renderDiceDots3D = (number) => {
  const dotPositions = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  };

  return dotPositions[number]?.map((pos, i) => (
    <DiceDot3D key={i} position={pos} />
  ));
};

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const popIn = keyframes`
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

// 3D 주사위 굴리기 애니메이션
const roll3D = keyframes`
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  20% {
    transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg);
  }
  40% {
    transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg);
  }
  60% {
    transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg);
  }
  80% {
    transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg);
  }
  100% {
    transform: rotateX(900deg) rotateY(450deg) rotateZ(225deg);
  }
`;

const bounceIn = keyframes`
  0% {
    transform: translateY(-200px) rotateX(0deg) rotateY(0deg);
    opacity: 0;
  }
  50% {
    transform: translateY(20px) rotateX(360deg) rotateY(180deg);
    opacity: 1;
  }
  70% {
    transform: translateY(-10px) rotateX(540deg) rotateY(270deg);
  }
  100% {
    transform: translateY(0) rotateX(720deg) rotateY(360deg);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-2deg); }
  75% { transform: translateX(5px) rotate(2deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// 물리 시뮬레이션 주사위 스타일
const RollingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const RollingModal = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  border: 3px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(255, 215, 0, 0.1);

  ${mobile} {
    padding: 20px;
    margin: 10px;
  }
`;

const RollingTitle = styled.h2`
  color: #ffd700;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  animation: ${pulse} 1s ease-in-out infinite;

  ${mobile} {
    font-size: 1.2rem;
  }
`;

const DiceBoard = styled.div`
  position: relative;
  width: 400px;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  perspective: 1000px;

  ${mobile} {
    width: 320px;
    height: 240px;
  }
`;

const BoardSurface = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    linear-gradient(135deg, #1e5128 0%, #2d6a3f 50%, #1e5128 100%);
  border: 8px solid #8b4513;
  border-radius: 12px;
  box-shadow:
    inset 0 0 50px rgba(0, 0, 0, 0.5),
    inset 0 0 100px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    border: 2px solid rgba(255, 215, 0, 0.2);
    border-radius: 8px;
  }

  &::after {
    content: '🎰 LAS VEGAS 🎰';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    font-weight: 800;
    color: rgba(255, 215, 0, 0.15);
    white-space: nowrap;
    pointer-events: none;
  }
`;

const PhysicsDice = styled.div`
  position: absolute;
  width: 50px;
  height: 50px;
  transform-style: preserve-3d;
  transition: ${props => props.settled ? 'box-shadow 0.3s ease' : 'none'};
  ${props => props.settled && `
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  `}

  ${mobile} {
    width: 40px;
    height: 40px;
  }
`;

const PhysicsDiceFace = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
  backface-visibility: visible;

  ${props => {
    const size = 25; // half of dice size
    switch (props.face) {
      case 'front':
        return `transform: rotateY(0deg) translateZ(${size}px);`;
      case 'back':
        return `transform: rotateY(180deg) translateZ(${size}px);`;
      case 'right':
        return `transform: rotateY(90deg) translateZ(${size}px);`;
      case 'left':
        return `transform: rotateY(-90deg) translateZ(${size}px);`;
      case 'top':
        return `transform: rotateX(90deg) translateZ(${size}px);`;
      case 'bottom':
        return `transform: rotateX(-90deg) translateZ(${size}px);`;
      default:
        return '';
    }
  }}

  ${mobile} {
    ${props => {
      const size = 20;
      switch (props.face) {
        case 'front':
          return `transform: rotateY(0deg) translateZ(${size}px);`;
        case 'back':
          return `transform: rotateY(180deg) translateZ(${size}px);`;
        case 'right':
          return `transform: rotateY(90deg) translateZ(${size}px);`;
        case 'left':
          return `transform: rotateY(-90deg) translateZ(${size}px);`;
        case 'top':
          return `transform: rotateX(90deg) translateZ(${size}px);`;
        case 'bottom':
          return `transform: rotateX(-90deg) translateZ(${size}px);`;
        default:
          return '';
      }
    }}
  }
`;

const ResultOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out;
  border-radius: 12px;
`;

const ResultText = styled.span`
  color: #ffd700;
  font-size: 2rem;
  font-weight: 800;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  animation: ${pulse} 0.5s ease-in-out infinite;
`;

const RollingHint = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4); }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  ${tabletAndBelow} {
    padding: 1.25rem;
    gap: 1.25rem;
  }

  ${mobile} {
    height: 100vh;
    height: 100dvh;
    min-height: auto;
    padding: 0.5rem;
    gap: 0.4rem;
    overflow: hidden;
  }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  ${tabletAndBelow} {
    padding: 0.85rem 1.25rem;
    border-radius: 14px;
  }

  ${mobile} {
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    flex-shrink: 0;
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayerBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: ${props => props.color};
  border-radius: 30px;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  box-shadow: 0 4px 15px ${props => props.color}60;

  ${tabletAndBelow} {
    padding: 8px 16px;
    font-size: 1rem;
    gap: 8px;
  }

  ${mobile} {
    padding: 4px 8px;
    font-size: 0.7rem;
    gap: 4px;
    border-radius: 20px;
  }
`;

const PlayerIcon = styled.span`
  font-size: 1.2rem;

  ${mobile} {
    font-size: 0.8rem;
  }
`;

const RoundBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 107, 107, 0.2) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 30px;
  color: #ffd700;
  font-weight: 700;
  font-size: 1rem;

  ${tabletAndBelow} {
    padding: 8px 16px;
    font-size: 0.9rem;
    gap: 8px;
  }

  ${mobile} {
    padding: 4px 8px;
    font-size: 0.65rem;
    gap: 4px;
    border-radius: 20px;
  }
`;

const RoundIcon = styled.span`
  font-size: 1.1rem;

  ${mobile} {
    font-size: 0.7rem;
  }
`;

const SettingsButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
    transform: rotate(45deg);
  }

  ${mobile} {
    width: 32px;
    height: 32px;
    font-size: 1rem;
    border-radius: 8px;
  }
`;

const ScoreBoard = styled.div`
  display: flex;
  gap: 12px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  flex-wrap: wrap;

  ${tabletAndBelow} {
    gap: 10px;
    padding: 0.85rem;
  }

  ${mobile} {
    gap: 4px;
    padding: 0.3rem;
    border-radius: 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
    flex-shrink: 0;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
  }
`;

const ScoreItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: ${props => props.isMe ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.isMe ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 12px;
  min-width: 200px;
  flex: 1;
  transition: all 0.3s ease;

  ${tabletAndBelow} {
    min-width: 170px;
    padding: 8px 14px;
  }

  ${mobile} {
    min-width: auto;
    padding: 4px 6px;
    gap: 4px;
    border-radius: 6px;
    flex: 0 0 auto;
  }
`;

const ScoreColor = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;

  ${mobile} {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    font-size: 0.7rem;
  }
`;

const ScoreInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  ${mobile} {
    display: none;
  }
`;

const ScoreName = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.color};
  text-transform: uppercase;
`;

const AITag = styled.span`
  padding: 2px 6px;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  font-size: 0.65rem;
  border-radius: 4px;
`;

const ScoreMoney = styled.span`
  font-size: 0.85rem;
  color: #ffd700;
  font-weight: 600;
`;

const DiceCount = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  ${mobile} {
    font-size: 0.65rem;
    padding: 2px 5px;
    border-radius: 4px;
  }
`;

const GameSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  ${tabletAndBelow} {
    padding: 1.25rem;
    gap: 0.85rem;
    border-radius: 16px;
  }

  ${mobile} {
    padding: 0.4rem;
    gap: 0.3rem;
    border-radius: 8px;
    flex-shrink: 0;
  }
`;

const TurnIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  ${mobile} {
    gap: 0.3rem;
  }
`;

const TurnLabel = styled.span`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;

  ${mobile} {
    font-size: 0.6rem;
    letter-spacing: 0;
  }
`;

const TurnPlayer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: ${props => props.color || '#666'};
  border-radius: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  ${tabletAndBelow} {
    padding: 8px 16px;
    gap: 8px;
    font-size: 0.95rem;
  }

  ${mobile} {
    padding: 4px 8px;
    gap: 4px;
    font-size: 0.7rem;
    border-radius: 6px;
  }
`;

const AIIndicator = styled.span`
  font-size: 0.8rem;
  opacity: 0.8;
  font-weight: 500;
`;

const ActionArea = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  ${mobile} {
    gap: 0.3rem;
  }
`;

const ButtonSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  background: ${props => {
    if (props.isAI) return 'rgba(255, 107, 107, 0.2)';
    if (props.disabled) return 'rgba(255, 255, 255, 0.1)';
    if (props.isMyTurn) return 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${props => {
    if (props.isAI) return '#ff6b6b';
    if (props.disabled) return 'rgba(255, 255, 255, 0.3)';
    if (props.isMyTurn) return '#1a1a2e';
    return 'rgba(255, 255, 255, 0.5)';
  }};
  border: 1px solid ${props => props.isAI ? 'rgba(255, 107, 107, 0.3)' : 'transparent'};

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
  }

  ${tabletAndBelow} {
    padding: 12px 22px;
    font-size: 1rem;
    border-radius: 12px;
  }

  ${mobile} {
    padding: 6px 10px;
    font-size: 0.7rem;
    border-radius: 6px;
    flex: 1;
    gap: 4px;
  }
`;

const ExitButton = styled.button`
  padding: 14px 28px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 14px;
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 107, 107, 0.2);
  }

  ${tabletAndBelow} {
    padding: 12px 22px;
    border-radius: 12px;
    font-size: 0.95rem;
  }

  ${mobile} {
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 0.85rem;
    flex: 1;
  }
`;

// 3D 주사위 굴리기 영역
const RollingArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  border: 2px solid rgba(255, 215, 0, 0.3);
`;

const RollingDiceContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  perspective: 1000px;

  ${mobile} {
    gap: 12px;
  }
`;

const Dice3DWrapper = styled.div`
  width: 60px;
  height: 60px;
  perspective: 600px;
  animation: ${bounceIn} 0.8s ease-out forwards;
  animation-delay: ${props => props.delay}s;
  opacity: 0;

  ${mobile} {
    width: 45px;
    height: 45px;
  }
`;

const Dice3D = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: ${roll3D} 1.5s ease-in-out infinite;
`;

const DiceFace3D = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);

  ${props => {
    switch (props.face) {
      case 'front':
        return 'transform: rotateY(0deg) translateZ(30px);';
      case 'back':
        return 'transform: rotateY(180deg) translateZ(30px);';
      case 'right':
        return 'transform: rotateY(90deg) translateZ(30px);';
      case 'left':
        return 'transform: rotateY(-90deg) translateZ(30px);';
      case 'top':
        return 'transform: rotateX(90deg) translateZ(30px);';
      case 'bottom':
        return 'transform: rotateX(-90deg) translateZ(30px);';
      default:
        return '';
    }
  }}

  ${mobile} {
    ${props => {
      switch (props.face) {
        case 'front':
          return 'transform: rotateY(0deg) translateZ(22px);';
        case 'back':
          return 'transform: rotateY(180deg) translateZ(22px);';
        case 'right':
          return 'transform: rotateY(90deg) translateZ(22px);';
        case 'left':
          return 'transform: rotateY(-90deg) translateZ(22px);';
        case 'top':
          return 'transform: rotateX(90deg) translateZ(22px);';
        case 'bottom':
          return 'transform: rotateX(-90deg) translateZ(22px);';
        default:
          return '';
      }
    }}
  }
`;

const DiceDot3D = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: #1a1a2e;
  border-radius: 50%;

  ${props => {
    const positions = {
      'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
      'top-left': 'top: 18%; left: 18%;',
      'top-right': 'top: 18%; right: 18%;',
      'middle-left': 'top: 50%; left: 18%; transform: translateY(-50%);',
      'middle-right': 'top: 50%; right: 18%; transform: translateY(-50%);',
      'bottom-left': 'bottom: 18%; left: 18%;',
      'bottom-right': 'bottom: 18%; right: 18%;',
    };
    return positions[props.position] || '';
  }}

  ${mobile} {
    width: 7px;
    height: 7px;
  }
`;

const RollingText = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffd700;
  animation: ${shake} 0.5s ease-in-out infinite;
`;

const DragHint = styled.div`
  text-align: center;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%);
  border-radius: 10px;
  font-size: 0.85rem;
  color: #ffd700;
  font-weight: 500;

  ${mobile} {
    font-size: 0.6rem;
    padding: 3px 6px;
    border-radius: 6px;
  }
`;

const DiceArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;

  ${tabletAndBelow} {
    padding: 1.25rem;
    gap: 1.25rem;
    border-radius: 14px;
  }

  ${mobile} {
    padding: 0.3rem;
    gap: 0.3rem;
    border-radius: 8px;
  }
`;

const DiceLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 8px;

  ${mobile} {
    display: none;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);

  ${mobile} {
    gap: 4px;
    font-size: 0.6rem;
  }
`;

const LegendDice = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: ${props => props.isDealer ? 'white' : props.color};
  border: ${props => props.isDealer ? '2px dashed rgba(255, 215, 0, 0.8)' : '2px solid rgba(0, 0, 0, 0.2)'};

  ${mobile} {
    width: 12px;
    height: 12px;
    border-width: 1px;
  }
`;

const DiceDisplay = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;

  ${mobile} {
    gap: 4px;
  }
`;

const DiceGroupContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;

  ${mobile} {
    gap: 4px;
  }
`;

const DiceGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: ${props => props.isDragging
    ? 'rgba(255, 215, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.isDragging
    ? '#ffd700'
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 16px;
  cursor: ${props => props.isMyTurn ? 'grab' : 'default'};
  transition: all 0.3s ease;
  min-width: 120px;
  touch-action: none;
  user-select: none;

  ${props => props.isMyTurn && `
    &:hover {
      transform: scale(1.05);
      border-color: rgba(255, 215, 0, 0.5);
      box-shadow: 0 8px 25px rgba(255, 215, 0, 0.2);
    }

    &:active {
      cursor: grabbing;
      transform: scale(1.08);
    }
  `}

  ${props => props.isDragging && `
    opacity: 0.6;
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4);
  `}

  ${mobile} {
    padding: 6px;
    min-width: 50px;
    gap: 4px;
    border-radius: 8px;
    border-width: 1px;
  }
`;

const DiceGroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  ${mobile} {
    padding-bottom: 3px;
    flex-direction: column;
    gap: 2px;
  }
`;

const DiceGroupNumber = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffd700;

  ${mobile} {
    font-size: 0.6rem;
  }
`;

const DiceGroupCount = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;

  ${mobile} {
    font-size: 0.5rem;
    padding: 1px 4px;
    border-radius: 6px;
  }
`;

const DiceGroupDice = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;

  ${mobile} {
    gap: 2px;
  }
`;

const DiceWrapper = styled.div`
  animation: ${popIn} 0.4s ease-out forwards;
  animation-delay: ${props => props.delay}s;
  opacity: 0;
  cursor: ${props => props.isMyTurn ? 'grab' : 'default'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  ${props => props.isDragging && `
    opacity: 0.5;
    transform: scale(1.1);
  `}

  ${props => props.isMyTurn && `
    &:hover {
      transform: scale(1.1);
      z-index: 10;
    }

    &:active {
      cursor: grabbing;
    }
  `}
`;

const DiceNumberBadge = styled.div`
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

  ${mobile} {
    font-size: 0.6rem;
    padding: 2px 6px;
    bottom: -6px;
  }
`;

const DiceFace = styled.div`
  width: ${props => props.isGrouped ? '45px' : '55px'};
  height: ${props => props.isGrouped ? '45px' : '55px'};
  background: ${props => props.color || 'white'};
  border-radius: ${props => props.isGrouped ? '8px' : '10px'};
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2);
  border: ${props => props.isDealer ? '3px dashed rgba(255, 215, 0, 0.8)' : '3px solid rgba(0, 0, 0, 0.2)'};
  transition: transform 0.2s ease;

  ${mobile} {
    width: ${props => props.isGrouped ? '22px' : '28px'};
    height: ${props => props.isGrouped ? '22px' : '28px'};
    border-radius: 4px;
    border-width: 1px;
  }
`;

const DealerBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: #1a1a2e;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

  ${mobile} {
    width: 12px;
    height: 12px;
    font-size: 0.45rem;
    top: -4px;
    right: -4px;
  }
`;

const DiceDot = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: #1a1a2e;
  border-radius: 50%;

  ${props => {
    const positions = {
      'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
      'top-left': 'top: 15%; left: 15%;',
      'top-right': 'top: 15%; right: 15%;',
      'middle-left': 'top: 50%; left: 15%; transform: translateY(-50%);',
      'middle-right': 'top: 50%; right: 15%; transform: translateY(-50%);',
      'bottom-left': 'bottom: 15%; left: 15%;',
      'bottom-right': 'bottom: 15%; right: 15%;',
    };
    return positions[props.position] || '';
  }}

  ${mobile} {
    width: 4px;
    height: 4px;
  }
`;

const DiceSelector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const SelectorLabel = styled.span`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
`;

const SelectorButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

const SelectButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 10px 25px rgba(255, 215, 0, 0.4);
  }

  ${tabletAndBelow} {
    padding: 10px 18px;
    border-radius: 10px;
  }

  ${mobile} {
    padding: 10px 16px;
    border-radius: 10px;
    min-width: 60px;
  }
`;

const SelectNumber = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;

  ${mobile} {
    font-size: 1.25rem;
  }
`;

const SelectDiceInfo = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const SelectDiceCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => props.isDealer ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 46, 0.2)'};
  color: ${props => props.isDealer ? '#1a1a2e' : props.color || '#1a1a2e'};
  border: ${props => props.isDealer ? '1px dashed #1a1a2e' : 'none'};
`;

const CasinoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding: 1rem 0;

  ${tabletAndBelow} {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  ${mobile} {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.3rem;
    padding: 0;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
`;

const casinoColors = [
  'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
  'linear-gradient(135deg, #ffd700 0%, #f0c800 100%)',
  'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
  'linear-gradient(135deg, #667eea 0%, #5a6fd6 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
];

const CasinoCard = styled.div`
  background: ${props => props.isDropTarget ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: ${props => {
    if (props.isDropTarget) return '3px solid #ffd700';
    if (props.canDrop) return '2px dashed rgba(255, 215, 0, 0.5)';
    return '1px solid rgba(255, 255, 255, 0.1)';
  }};
  overflow: hidden;
  transition: all 0.3s ease;
  animation: ${props => props.isDropTarget ? glow : 'none'} 1s ease-in-out infinite;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }

  ${props => props.canDrop && `
    transform: scale(1.02);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);
  `}

  ${mobile} {
    border-radius: 8px;
    display: flex;
    flex-direction: column;
  }
`;

const DropIndicator = styled.div`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: auto;
  background: ${props => props.canDrop ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' : 'rgba(255, 107, 107, 0.2)'};
  color: ${props => props.canDrop ? 'white' : '#ff6b6b'};

  ${mobile} {
    display: none;
  }
`;

const CasinoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem 1.25rem;
  background: rgba(0, 0, 0, 0.2);

  ${tabletAndBelow} {
    padding: 0.85rem 1rem;
    gap: 10px;
  }

  ${mobile} {
    padding: 0.25rem;
    gap: 4px;
    justify-content: center;
  }
`;

const CasinoNumber = styled.div`
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 12px;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;

  ${tabletAndBelow} {
    width: 40px;
    height: 40px;
    font-size: 1.35rem;
    border-radius: 10px;
  }

  ${mobile} {
    width: 24px;
    height: 24px;
    font-size: 0.9rem;
    border-radius: 6px;
  }
`;

const CasinoName = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;

  ${tabletAndBelow} {
    font-size: 1rem;
  }

  ${mobile} {
    display: none;
  }
`;

const MoneyStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 1rem 1.25rem;

  ${tabletAndBelow} {
    padding: 0.85rem 1rem;
    gap: 6px;
  }

  ${mobile} {
    padding: 0.2rem;
    gap: 2px;
    justify-content: center;
  }
`;

const MoneyChip = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  color: white;

  ${props => {
    const colors = {
      10000: '#4ade80',
      20000: '#22c55e',
      30000: '#3b82f6',
      40000: '#6366f1',
      50000: '#8b5cf6',
      60000: '#d946ef',
      70000: '#f43f5e',
      80000: '#f97316',
      90000: '#fbbf24',
    };
    return css`background: ${colors[props.value] || '#64748b'};`;
  }}

  ${tabletAndBelow} {
    padding: 6px 12px;
    font-size: 0.85rem;
    border-radius: 16px;
  }

  ${mobile} {
    padding: 2px 4px;
    font-size: 0.55rem;
    border-radius: 8px;
  }
`;

const PlacedDiceArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 1rem 1.25rem;
  min-height: 60px;
  background: rgba(0, 0, 0, 0.1);

  ${tabletAndBelow} {
    padding: 0.85rem 1rem;
    min-height: 50px;
    gap: 5px;
  }

  ${mobile} {
    padding: 0.2rem;
    min-height: 24px;
    gap: 2px;
    flex: 1;
    justify-content: center;
  }
`;

const PlacedDice = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${props => props.color};
  box-shadow: 0 2px 8px ${props => props.color === 'white' ? 'rgba(255, 215, 0, 0.5)' : props.color + '60'};
  border: ${props => props.color === 'white' ? '2px dashed rgba(255, 215, 0, 0.8)' : '2px solid rgba(0, 0, 0, 0.2)'};
  position: relative;

  ${props => props.color === 'white' && `
    &::after {
      content: 'D';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.65rem;
      font-weight: 800;
      color: #1a1a2e;
    }
  `}

  ${tabletAndBelow} {
    width: 24px;
    height: 24px;
    border-radius: 5px;
  }

  ${mobile} {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border-width: 1px;

    ${props => props.color === 'white' && `
      &::after {
        font-size: 0.4rem;
      }
    `}
  }
`;

const EmptySlot = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;

  ${mobile} {
    font-size: 0.5rem;
  }
`;

export default Ground;

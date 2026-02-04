import React, { Children } from 'react';
import './TextContainer.css';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useHistory } from 'react-router-dom';
import socket from '../../socket';

const TextContainer = ({
  me,
  users,
  onReady,
  roomId,
  secret,
  toggleHandlerSecret,
}) => {
  const history = useHistory();
  const ready = users.every((v) => v.ready === true);

  if (ready) {
    socket.emit('groundSetting', { roomId }, (result) => {
      if (result.status === 200) {
        history.push(`/game?color=${me?.color}&roomId=${roomId}`);
      }
    });
  }

  return (
    <div className="textContainer">
      <Header>
        <Title>🎰 대기실</Title>
        <SwitchWrapper>
          {secret === false ? (
            <SwitchLabel>숨기기</SwitchLabel>
          ) : (
            <SwitchLabel active>일반</SwitchLabel>
          )}
          <ToggleContainer onClick={toggleHandlerSecret}>
            <div className={`toggle-container ${secret ? 'toggle--checked' : null}`} />
            <div className={`toggle-circle ${secret ? 'toggle--checked' : null}`} />
          </ToggleContainer>
        </SwitchWrapper>
      </Header>

      <ReadyButton onClick={onReady} isReady={me?.ready}>
        {me?.ready ? '✓ 준비완료!' : '🎲 READY'}
      </ReadyButton>

      {users ? (
        <div className="activeContainer">
          <PlayersTitle>참가자 ({users.length}명)</PlayersTitle>
          {Children.toArray(
            users.map(({ color, ready, isAI }) => (
              <PlayerCard isReady={ready}>
                <PlayerColor color={color}>
                  {isAI ? '🤖' : '👤'}
                </PlayerColor>
                <PlayerInfo>
                  <PlayerName color={color}>
                    {color.toUpperCase()}
                    {isAI && <AIBadge>AI</AIBadge>}
                  </PlayerName>
                  <PlayerStatus isReady={ready}>
                    {ready ? '준비완료' : '대기중...'}
                  </PlayerStatus>
                </PlayerInfo>
                <ReadyIndicator isReady={ready}>
                  {ready ? '✓' : '○'}
                </ReadyIndicator>
              </PlayerCard>
            )),
          )}
        </div>
      ) : null}
    </div>
  );
};

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SwitchLabel = styled.span`
  color: ${props => props.active ? '#ffd700' : 'rgba(255, 255, 255, 0.5)'};
  font-size: 0.85rem;
`;

const ToggleContainer = styled.div`
  position: relative;
  cursor: pointer;

  > .toggle-container {
    width: 44px;
    height: 24px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  > .toggle-container.toggle--checked {
    background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  }

  > .toggle-circle {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  > .toggle-circle.toggle--checked {
    left: 23px;
  }
`;

const ReadyButton = styled.button`
  width: 100%;
  padding: 18px;
  border: none;
  border-radius: 14px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.isReady
    ? 'linear-gradient(135deg, #00c853 0%, #69f0ae 100%)'
    : 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)'
  };
  color: ${props => props.isReady ? 'white' : '#1a1a2e'};
  animation: ${props => props.isReady ? 'none' : pulse} 2s ease-in-out infinite;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px ${props => props.isReady
      ? 'rgba(0, 200, 83, 0.3)'
      : 'rgba(255, 215, 0, 0.3)'
    };
  }
`;

const PlayersTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const PlayerCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.isReady
    ? 'rgba(0, 200, 83, 0.1)'
    : 'rgba(255, 255, 255, 0.03)'
  };
  border: 1px solid ${props => props.isReady
    ? 'rgba(0, 200, 83, 0.3)'
    : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 12px;
  transition: all 0.3s ease;
`;

const PlayerColor = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 4px 15px ${props => props.color}40;
`;

const PlayerInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PlayerName = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1rem;
  color: ${props => props.color};
  text-transform: uppercase;
  text-shadow: 0 0 10px ${props => props.color}40;
`;

const AIBadge = styled.span`
  padding: 2px 8px;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  font-size: 0.7rem;
  border-radius: 6px;
`;

const PlayerStatus = styled.span`
  font-size: 0.85rem;
  color: ${props => props.isReady ? '#69f0ae' : 'rgba(255, 255, 255, 0.5)'};
`;

const ReadyIndicator = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  background: ${props => props.isReady
    ? 'linear-gradient(135deg, #00c853 0%, #69f0ae 100%)'
    : 'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => props.isReady ? 'white' : 'rgba(255, 255, 255, 0.3)'};
`;

export default TextContainer;

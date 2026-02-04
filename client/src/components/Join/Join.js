import React, { Children, useCallback, useEffect, useState } from 'react';
import './Join.css';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import MakeRoom from './MakeRoom';
import socket from '../../socket';
import { useHistory } from 'react-router-dom';
import Secret from '../Secret/Secret';
import Normal from '../Secret/Normal';
import { mobile, tablet, tabletAndBelow } from '../../utill';

const Join = () => {
  const [secret, setSecret] = useState(false);
  const [waitRooms, setWaitRooms] = useState([]);
  const [isOn, setIsOn] = useState(false);

  const toggleHandler = () => {
    setIsOn(!isOn);
  };

  const toggleHandlerSecret = () => {
    setSecret(!secret);
  };

  useEffect(() => {
    socket.emit('waitRoomList', (result) => {
      setWaitRooms(result?.rooms);
    });
  }, []);

  useEffect(() => {
    socket.on('waitRoomList', (result) => {
      setWaitRooms(result?.rooms);
    });
  }, []);

  const history = useHistory();
  const moveRoom = useCallback((roomId) => {
    history.push(`/chat?id=${socket.id}&roomId=${roomId}`);
  }, []);

  const ComponentLayout = secret ? Secret : Normal;

  return (
    <ComponentLayout>
      <ComponentWrapper>
        <LogoWrapper>
          <MainTitle>🎰 LAS VEGAS</MainTitle>
          <SubTitle>Board Game</SubTitle>
        </LogoWrapper>

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

        {!secret && (
          <WelcomeImage src={'welcome.png'} alt={''} />
        )}

        <TabWrapper>
          <TabButton active={!isOn} onClick={() => setIsOn(false)}>
            🏠 대기실
          </TabButton>
          <TabButton active={isOn} onClick={() => setIsOn(true)}>
            ➕ 방 만들기
          </TabButton>
        </TabWrapper>

        <ContentCard>
          {isOn === false ? (
            <WaitWrapper>
              {waitRooms.length > 0 ? (
                Children.toArray(
                  waitRooms.map((v) => (
                    <RoomCard onClick={() => moveRoom(v.id)}>
                      <RoomInfo>
                        <RoomName>{v.name || '게임룸'}</RoomName>
                        <RoomMeta>
                          <Badge>{v.currentCnt}/{v.total} 명</Badge>
                          <Badge variant="round">{v.totalRounds || 4} 라운드</Badge>
                          {v.aiCount > 0 && <Badge variant="ai">AI {v.aiCount}</Badge>}
                        </RoomMeta>
                      </RoomInfo>
                      <JoinArrow>→</JoinArrow>
                    </RoomCard>
                  )),
                )
              ) : (
                <EmptyState>
                  <EmptyIcon>🎲</EmptyIcon>
                  <EmptyText>대기 중인 방이 없습니다</EmptyText>
                  <EmptySubText>새로운 방을 만들어보세요!</EmptySubText>
                </EmptyState>
              )}
            </WaitWrapper>
          ) : (
            <MakeRoom />
          )}
        </ContentCard>
      </ComponentWrapper>
    </ComponentLayout>
  );
};

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const LogoWrapper = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

const MainTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #ffd700 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 3s linear infinite;
  margin: 0;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.3);

  ${tabletAndBelow} {
    font-size: 2.5rem;
  }

  ${mobile} {
    font-size: 2rem;
  }
`;

const SubTitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
  margin: 0.5rem 0 0 0;
  letter-spacing: 3px;
  text-transform: uppercase;

  ${tabletAndBelow} {
    font-size: 1.1rem;
    letter-spacing: 2px;
  }

  ${mobile} {
    font-size: 0.95rem;
    letter-spacing: 1.5px;
  }
`;

const WelcomeImage = styled.img`
  width: 300px;
  object-fit: contain;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: ${float} 3s ease-in-out infinite;

  ${tabletAndBelow} {
    width: 250px;
    border-radius: 16px;
  }

  ${mobile} {
    width: 180px;
    border-radius: 14px;
  }
`;

const SwitchWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  ${mobile} {
    padding: 10px 16px;
    gap: 10px;
  }
`;

const SwitchLabel = styled.span`
  color: ${props => props.active ? '#ffd700' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 0.9rem;
  font-weight: 500;
`;

const ToggleContainer = styled.div`
  position: relative;
  cursor: pointer;

  > .toggle-container {
    width: 50px;
    height: 26px;
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
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  > .toggle-circle.toggle--checked {
    left: 27px;
  }
`;

const TabWrapper = styled.div`
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px;
  border-radius: 16px;

  ${mobile} {
    width: 100%;
    justify-content: center;
    gap: 4px;
  }
`;

const TabButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'transparent'};
  color: ${props => props.active ? '#1a1a2e' : 'rgba(255, 255, 255, 0.6)'};

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #ffea00 0%, #ffd700 100%)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.active ? '#1a1a2e' : 'white'};
  }

  ${tabletAndBelow} {
    padding: 10px 20px;
    font-size: 0.95rem;
  }

  ${mobile} {
    padding: 10px 16px;
    font-size: 0.85rem;
    flex: 1;
    text-align: center;
  }
`;

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  min-width: 350px;
  max-width: 500px;
  width: 100%;

  ${tabletAndBelow} {
    min-width: 320px;
    padding: 20px;
    border-radius: 16px;
  }

  ${mobile} {
    min-width: unset;
    width: 100%;
    padding: 16px;
    border-radius: 14px;
  }
`;

const WaitWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;

  ${tabletAndBelow} {
    max-height: 350px;
    gap: 10px;
  }

  ${mobile} {
    max-height: 300px;
    gap: 8px;
  }
`;

const RoomCard = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateX(5px);
  }

  ${mobile} {
    padding: 12px 14px;
    border-radius: 10px;
  }
`;

const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`;

const RoomName = styled.span`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;

  ${mobile} {
    font-size: 0.95rem;
  }
`;

const RoomMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  ${mobile} {
    gap: 4px;
  }
`;

const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    if (props.variant === 'round') return 'rgba(102, 126, 234, 0.2)';
    if (props.variant === 'ai') return 'rgba(255, 107, 107, 0.2)';
    return 'rgba(255, 215, 0, 0.2)';
  }};
  color: ${props => {
    if (props.variant === 'round') return '#667eea';
    if (props.variant === 'ai') return '#ff6b6b';
    return '#ffd700';
  }};

  ${mobile} {
    padding: 3px 8px;
    font-size: 0.7rem;
  }
`;

const JoinArrow = styled.span`
  color: #ffd700;
  font-size: 1.5rem;
  transition: transform 0.3s ease;

  ${RoomCard}:hover & {
    transform: translateX(5px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
`;

const EmptyIcon = styled.span`
  font-size: 3rem;
  margin-bottom: 16px;
  animation: ${float} 2s ease-in-out infinite;
`;

const EmptyText = styled.p`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const EmptySubText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin: 8px 0 0 0;
`;

const ComponentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 2rem;
  min-height: 100vh;

  ${tabletAndBelow} {
    padding: 1.5rem;
    gap: 16px;
  }

  ${mobile} {
    padding: 1rem;
    gap: 14px;
  }
`;

export default Join;

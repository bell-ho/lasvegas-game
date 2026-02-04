import React, { useEffect, useState } from 'react';
import queryString from 'query-string';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import Ground from '../Ground/Ground';
import Messages from '../Messages/Messages';
import Input from '../Input/Input';
import socket from '../../socket';
import { mobile } from '../../utill';

const Game = ({ location }) => {
  const { color, roomId } = queryString.parse(location.search);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const sendMessage = (event) => {
    event.preventDefault();

    if (message) {
      socket.emit('sendMessage', message, () => setMessage(''));
    }
  };

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((messages) => [...messages, message]);
      if (!chatOpen) {
        setUnreadCount(prev => prev + 1);
      }
    });
  }, [chatOpen]);

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <Wrapper>
      <Ground color={color} roomId={roomId} />

      {/* 데스크톱 채팅 */}
      <DesktopChat>
        <ChatHeader>
          <ChatTitle>💬 CHAT</ChatTitle>
        </ChatHeader>
        <Messages messages={messages} color={color} />
        <Input
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      </DesktopChat>

      {/* 모바일 채팅 토글 버튼 */}
      <MobileChatButton onClick={toggleChat} hasUnread={unreadCount > 0}>
        {chatOpen ? '✕' : '💬'}
        {unreadCount > 0 && !chatOpen && (
          <UnreadBadge>{unreadCount > 9 ? '9+' : unreadCount}</UnreadBadge>
        )}
      </MobileChatButton>

      {/* 모바일 채팅 오버레이 */}
      <MobileChatOverlay isOpen={chatOpen}>
        <MobileChatContainer>
          <MobileChatHeader>
            <ChatTitle>💬 GAME CHAT</ChatTitle>
            <CloseButton onClick={toggleChat}>✕</CloseButton>
          </MobileChatHeader>
          <Messages messages={messages} color={color} />
          <Input
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
          />
        </MobileChatContainer>
      </MobileChatOverlay>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  padding: 1rem;

  ${mobile} {
    padding: 0;
    gap: 0;
    flex-direction: column;
  }
`;

const DesktopChat = styled.div`
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 35, 0.98) 100%);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  width: 350px;
  max-height: 100vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

  ${mobile} {
    display: none;
  }
`;

const ChatHeader = styled.div`
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 107, 107, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`;

const ChatTitle = styled.h3`
  margin: 0;
  color: #ffd700;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 1px;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const MobileChatButton = styled.button`
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  border: none;
  color: #1a1a2e;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
  transition: all 0.3s ease;
  animation: ${props => props.hasUnread ? pulse : 'none'} 1s ease-in-out infinite;

  &:active {
    transform: scale(0.95);
  }

  ${mobile} {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: #ff3b30;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const MobileChatOverlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 1001;
  opacity: ${props => props.isOpen ? 1 : 0};
  pointer-events: ${props => props.isOpen ? 'auto' : 'none'};
  transition: opacity 0.3s ease;

  ${mobile} {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
  }
`;

const MobileChatContainer = styled.div`
  width: 100%;
  max-height: 70vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%);
  border-radius: 20px 20px 0 0;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-bottom: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${slideUp} 0.3s ease-out;
`;

const MobileChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 107, 107, 0.15) 100%);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export default Game;

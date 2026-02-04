import React, { useEffect, useState } from 'react';
import queryString from 'query-string';

import TextContainer from '../TextContainer/TextContainer';
import Messages from '../Messages/Messages';
import InfoBar from '../InfoBar/InfoBar';
import Input from '../Input/Input';

import './Chat.css';
import socket from '../../socket';
import { useHistory } from 'react-router-dom';
import Secret from '../Secret/Secret';
import Normal from '../Secret/Normal';

const Chat = ({ location }) => {
  const history = useHistory();
  const [secret, setSecret] = useState(false);

  const [me, setMe] = useState({});
  const [users, setUsers] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const { roomId } = queryString.parse(location.search);
    setRoomId(roomId);
    socket.emit('join', { roomId }, (result) => {
      if (result.status === 400) {
        alert(result.error);
        history.push(`/`);
      }
    });
  }, [location.search]);

  useEffect(() => {
    const { id } = queryString.parse(location.search);

    socket.on('message', (message) => {
      setMessages((messages) => [...messages, message]);
    });

    socket.on('roomData', ({ users }) => {
      setUsers(users);
      const me = users.find((v) => v.id === id);
      setMe(me);
    });
  }, []);

  const sendMessage = (event) => {
    event.preventDefault();

    if (message) {
      socket.emit('sendMessage', message, () => setMessage(''));
    }
  };

  const onReady = () => {
    socket.emit('ready');
  };

  const toggleHandlerSecret = () => {
    setSecret(!secret);
  };

  const ComponentLayout = secret ? Secret : Normal;

  return (
    <ComponentLayout>
      <div className="outerContainer">
        <TextContainer
          me={me}
          roomId={roomId}
          onReady={onReady}
          users={users}
          secret={secret}
          toggleHandlerSecret={toggleHandlerSecret}
        />

        <div className="container">
          <InfoBar room={roomId} />
          <Messages messages={messages} color={me?.color} />
          <Input
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
          />
        </div>
      </div>
    </ComponentLayout>
  );
};

export default Chat;

import io from 'socket.io-client';

// API 서버 (WebSocket)
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://vegas-api.bellho.org';
const socket = io(SOCKET_URL);
export default socket;

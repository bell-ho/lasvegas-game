import express from 'express';
import socketio from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import cors from 'cors';

import router from './router.js';

import { addUser, createRoom, getGroundInfo, getRoom, getRooms, getUser, getUsersInRoom, groundSetting, removeUser, resetDiceForNewRound, incrementRound, isGameFinished, addMoneyToUser, addAIUser, rollDiceForAI, calculateAIChoice, isAIUser, getAIUsers, checkAndRemoveAIOnlyRoom } from './users.js';
import { countWords, determineNextUser, filterUniqueCounts, getColorArray } from './util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3003;
const TURN_TIMEOUT = 30000; // 30초 타이머

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// 턴 타이머 관리
const turnTimers = {};

// 턴 타이머 시작
const startTurnTimer = (roomId, currentUser) => {
  // 기존 타이머 취소
  clearTurnTimer(roomId);

  // AI는 타이머 필요 없음
  if (currentUser?.isAI) return;

  turnTimers[roomId] = setTimeout(() => {
    autoPlayForUser(roomId, currentUser);
  }, TURN_TIMEOUT);

  // 클라이언트에 타이머 시작 알림
  io.to(roomId).emit('turnTimerStart', { timeout: TURN_TIMEOUT });
};

// 턴 타이머 취소
const clearTurnTimer = (roomId) => {
  if (turnTimers[roomId]) {
    clearTimeout(turnTimers[roomId]);
    delete turnTimers[roomId];
  }
  io.to(roomId).emit('turnTimerStop');
};

// 자동 플레이 (30초 초과 시)
const autoPlayForUser = (roomId, user) => {
  if (!user || user.isAI) return;
  if (user.diceCnt + user.dealerDiceCnt <= 0) return;

  const users = getUsersInRoom(roomId);
  const groundInfo = getGroundInfo(roomId)?.arr;

  // 1. 주사위 굴리기
  const diceArr = Array(user.diceCnt).fill().map(() => ({
    owner: user.color,
    number: Math.floor(Math.random() * 6) + 1
  }));
  const dealerDiceArr = Array(user.dealerDiceCnt).fill().map(() => ({
    owner: 'white',
    number: Math.floor(Math.random() * 6) + 1
  }));
  const diceResults = [...diceArr, ...dealerDiceArr];

  io.to(roomId).emit('printDice', diceResults);
  io.to(roomId).emit('message', {
    user: 'Admin',
    text: `⏰ ${user.color}님이 시간 초과! AI가 대신 선택합니다.`,
  });

  // 2. AI 로직으로 최적의 선택
  setTimeout(() => {
    const chosenNumber = calculateAIChoice(diceResults, groundInfo, user.color, users);
    const selectedDice = diceResults.filter(d => d.number === chosenNumber);

    io.to(roomId).emit('message', {
      user: 'Admin',
      text: `⏰ ${user.color}님 대신 ${chosenNumber}번 카지노 선택 (${selectedDice.length}개)`,
    });

    // 3. 주사위 배치
    const ground = groundInfo.find(g => g.id === chosenNumber);
    if (ground) {
      updateGroundWithDice({ ground, color: user.color, selectedDice });
      updateUserDiceCount(user, selectedDice, user.color);
    }

    // 4. 다음 턴
    const nextUser = determineNextUser(users, user.color);

    io.to(roomId).emit('whoTurn', nextUser);
    io.to(roomId).emit('groundResult', getGroundInfo(roomId)?.arr);
    io.to(roomId).emit('printDice', []);
    io.to(roomId).emit('roomData', {
      room: roomId,
      users: getUsersInRoom(roomId),
    });

    // 5. 게임 종료 체크
    checkAndHandleGameEnd(user, users);

    // 6. 다음 플레이어 처리
    if (nextUser?.isAI && nextUser.diceCnt + nextUser.dealerDiceCnt > 0) {
      setTimeout(() => processAITurn(nextUser, roomId), 1500);
    } else if (nextUser && !nextUser.isAI) {
      startTurnTimer(roomId, nextUser);
    }
  }, 1500);
};
app.use(cors());

// 클라이언트 정적 파일 제공 (API 라우트보다 먼저)
app.use(express.static(path.join(__dirname, '../client/build')));

// API 라우트
app.use('/api', router);

// SPA fallback - API가 아닌 모든 요청은 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('새로운 연결');

  socket.on('createRoom', ({ id, name, total, totalRounds, aiCount = 0 }, callback) => {
    const { error, room } = createRoom({ id, name, total, totalRounds, aiCount });
    if (error) callback({ status: 400, error });

    io.emit('waitRoomList', { status: 200, rooms: getRooms() });
    callback({ status: 200, room });
  });

  socket.on('join', ({ roomId }, callback) => {
    const { error, user } = addUser({ id: socket.id, roomId });
    if (error) callback({ status: 400, error });

    if (user) {
      socket.emit('message', {
        user: 'Admin',
        text: `${user.color}, 님 어서오세요.`,
      });
      socket.broadcast.to(user.roomId).emit('message', {
        user: 'Admin',
        text: `${user.color} 님이 입장하였습니다.`,
      });
      io.to(user.roomId).emit('roomData', {
        room: user.roomId,
        users: getUsersInRoom(user.roomId),
      });
      socket.emit('roomData', {
        room: user.roomId,
        users: getUsersInRoom(user.roomId),
      });

      socket.join(user.roomId);
    }

    callback({ status: 200 });
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    io.to(user?.roomId).emit('message', { user: user?.color, text: message });
    callback();
  });

  socket.on('ready', () => {
    const user = getUser(socket.id);
    user.ready = true;
    io.to(user?.roomId).emit('roomData', {
      room: user?.roomId,
      users: getUsersInRoom(user?.roomId),
    });
    socket.emit('roomData', {
      room: user?.roomId,
      users: getUsersInRoom(user?.roomId),
    });
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      const roomId = user.roomId;

      io.to(roomId).emit('message', {
        user: 'Admin',
        text: `${user.color} 님이 방을 나갔습니다.`,
      });

      // AI만 남았는지 확인하고 방 삭제
      const roomDeleted = checkAndRemoveAIOnlyRoom(roomId);

      if (roomDeleted) {
        // 타이머 정리
        clearTurnTimer(roomId);
        // 대기실 목록 갱신
        io.emit('waitRoomList', { status: 200, rooms: getRooms() });
        io.to(roomId).emit('message', {
          user: 'Admin',
          text: '모든 플레이어가 나가서 방이 삭제되었습니다.',
        });
        io.to(roomId).emit('out');
      } else {
        io.to(roomId).emit('roomData', {
          room: roomId,
          users: getUsersInRoom(roomId),
        });
      }
    }
  });

  socket.on('groundSetting', ({ roomId }, callback) => {
    const user = getUser(socket.id);
    const room = getRooms().find((v) => v.id === roomId);

    // AI 플레이어 추가
    if (room?.aiCount > 0) {
      const existingAIs = getAIUsers(roomId);
      if (existingAIs.length === 0) {
        for (let i = 0; i < room.aiCount; i++) {
          addAIUser({ roomId, aiIndex: i });
        }
      }
    }

    const readyCnt = getUsersInRoom(user?.roomId).filter((v) => v.ready === true)?.length;

    if (Number(room?.total) === readyCnt) {
      groundSetting(user?.roomId);

      // 라운드 정보 전송
      io.to(user?.roomId).emit('newRound', {
        currentRound: room.currentRound || 1,
        totalRounds: room.totalRounds || 4,
      });

      io.to(user?.roomId).emit('message', {
        user: 'Admin',
        text: `=== ${room.currentRound || 1}라운드 시작! (총 ${room.totalRounds || 4}라운드) ===`,
      });

      // 유저 데이터 전송 (AI 포함)
      io.to(user?.roomId).emit('roomData', {
        room: user?.roomId,
        users: getUsersInRoom(user?.roomId),
      });

      callback({ status: 200 });

      // 첫 턴이 AI인 경우 처리, 아니면 타이머 시작
      const users = getUsersInRoom(user?.roomId);
      if (users[0]?.isAI) {
        setTimeout(() => processAITurn(users[0], user?.roomId), 1500);
      } else {
        startTurnTimer(user?.roomId, users[0]);
      }
    }
  });

  socket.on('groundInfo', () => {
    const user = getUser(socket.id);
    const users = getUsersInRoom(user?.roomId);
    socket.emit('whoTurn', users[0]);
    socket.emit('groundResult', getGroundInfo(user?.roomId)?.arr);
  });

  socket.on('rollDice', () => {
    const user = getUser(socket.id);

    const diceArr = Array(user?.diceCnt).fill().map(() => {
      return { owner: user?.color, number: Math.floor(Math.random() * 6) + 1 };
    });

    const dealerDiceArr = Array(user?.dealerDiceCnt).fill().map(() => {
      return { owner: 'white', number: Math.floor(Math.random() * 6) + 1 };
    });

    const printDice = [...diceArr, ...dealerDiceArr];
    socket.emit('printDice', printDice);
    io.to(user?.roomId).emit('printDice', printDice);
  });

  socket.on('selectDice', ({ color, number, selectedDice }) => {
    const user = getUser(socket.id);
    const users = getUsersInRoom(user?.roomId);
    const ground = getGroundInfo(user?.roomId)?.arr?.find((v) => v.id === number);

    if (!user || !users || !ground) return;

    // 타이머 취소
    clearTurnTimer(user?.roomId);

    updateGroundWithDice({ ground, color, selectedDice });
    updateUserDiceCount(user, selectedDice, color);
    const nextUser = determineNextUser(users, color);
    notifyTurnUpdate(socket, user, nextUser);
    notifyGroundUpdate(socket, user);
    checkAndHandleGameEnd(user, users);

    // 다음 플레이어가 AI면 AI 턴 실행, 아니면 타이머 시작
    if (nextUser?.isAI && nextUser.diceCnt + nextUser.dealerDiceCnt > 0) {
      setTimeout(() => processAITurn(nextUser, user?.roomId), 1500);
    } else if (nextUser && !nextUser.isAI && nextUser.diceCnt + nextUser.dealerDiceCnt > 0) {
      startTurnTimer(user?.roomId, nextUser);
    }
  });

  socket.on('waitRoomList', (callback) => {
    callback({ status: 200, rooms: getRooms() });
  });
});

const announceRoundResults = (roundMoneyPerUser, user, currentRound) => {
  io.to(user?.roomId).emit('message', {
    user: 'Admin',
    text: `=== ${currentRound}라운드 결과 ===`,
  });

  Object.entries(roundMoneyPerUser)
    .sort((a, b) => b[1] - a[1])
    .forEach((entry) => {
      const [userColor, money] = entry;
      io.to(user?.roomId).emit('message', {
        user: 'Admin',
        text: `${userColor}: +${money.toLocaleString()}원`,
      });
    });
};

const announceFinalWinners = (users, user) => {
  io.to(user?.roomId).emit('message', {
    user: 'Admin',
    text: `========== 최종 결과 ==========`,
  });

  const sortedUsers = [...users].sort((a, b) => b.totalMoney - a.totalMoney);
  sortedUsers.forEach((u, i) => {
    io.to(user?.roomId).emit('message', {
      user: 'Admin',
      text: `${i + 1}등: ${u.color} - ${u.totalMoney.toLocaleString()}원`,
    });
  });
};

const distributeMoneyAmongPlayers = (roundMoneyPerUser, ground, candidate, roomId) => {
  const minLength = Math.min(candidate.length, ground.money.length);
  const confirmedUsers = candidate.slice(0, minLength);
  const confirmedMoney = ground.money.sort((a, b) => b - a).slice(0, minLength);

  confirmedUsers.forEach((userColor, index) => {
    const amount = confirmedMoney[index];
    roundMoneyPerUser[userColor] = (roundMoneyPerUser[userColor] || 0) + amount;
    // 누적 상금에 추가
    addMoneyToUser(roomId, userColor, amount);
  });
};

const processRoundResults = (user) => {
  const roundMoneyPerUser = {};
  const info = getGroundInfo(user?.roomId)?.arr;
  const room = getRoom(user?.roomId);
  const currentRound = room?.currentRound || 1;

  info.forEach(ground => {
    const wordCounts = countWords(ground.placedDice);
    const candidate = filterUniqueCounts(wordCounts);
    distributeMoneyAmongPlayers(roundMoneyPerUser, ground, candidate, user?.roomId);
  });

  announceRoundResults(roundMoneyPerUser, user, currentRound);
  return roundMoneyPerUser;
};

const startNewRound = (user, users) => {
  const room = getRoom(user?.roomId);
  incrementRound(user?.roomId);

  io.to(user?.roomId).emit('message', {
    user: 'Admin',
    text: `=== ${room.currentRound}라운드 시작! ===`,
  });

  // 주사위 리셋
  resetDiceForNewRound(user?.roomId);

  // 새 배당금 배치
  groundSetting(user?.roomId);

  // 유저 목록 새로 가져오기 (리셋된 주사위 포함)
  const refreshedUsers = getUsersInRoom(user?.roomId);

  // 클라이언트에 새 라운드 정보 전송
  io.to(user?.roomId).emit('newRound', {
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
  });

  io.to(user?.roomId).emit('groundResult', getGroundInfo(user?.roomId)?.arr);
  io.to(user?.roomId).emit('whoTurn', refreshedUsers[0]);
  io.to(user?.roomId).emit('roomData', {
    room: user?.roomId,
    users: refreshedUsers,
  });

  // 첫 턴이 AI면 AI 턴 실행, 아니면 타이머 시작
  if (refreshedUsers[0]?.isAI) {
    setTimeout(() => processAITurn(refreshedUsers[0], user?.roomId), 1500);
  } else {
    startTurnTimer(user?.roomId, refreshedUsers[0]);
  }
};

const checkAndHandleGameEnd = (user, users) => {
  const totalDiceCnt = users.map(v => v.diceCnt + v.dealerDiceCnt).reduce((acc, curr) => acc + curr, 0);

  if (!totalDiceCnt) {
    // 라운드 결과 처리
    processRoundResults(user);

    const room = getRoom(user?.roomId);
    const currentRound = room?.currentRound || 1;
    const totalRounds = room?.totalRounds || 4;

    if (currentRound < totalRounds) {
      // 다음 라운드 시작
      setTimeout(() => {
        startNewRound(user, users);
      }, 2000);
    } else {
      // 게임 종료 - 타이머 정리
      clearTurnTimer(user?.roomId);
      setTimeout(() => {
        announceFinalWinners(users, user);
        io.to(user?.roomId).emit('out');
      }, 2000);
    }
  }
};

const notifyGroundUpdate = (socket, user) => {
  socket.emit('groundResult', getGroundInfo(user?.roomId)?.arr);
  io.to(user?.roomId).emit('groundResult', getGroundInfo(user?.roomId)?.arr);
  socket.emit('printDice', []);
  io.to(user?.roomId).emit('printDice', []);
};

const notifyTurnUpdate = (socket, user, nextUser) => {
  socket.emit('whoTurn', nextUser);
  io.to(user?.roomId).emit('whoTurn', nextUser);
};

const updateUserDiceCount = (user, selectedDice, color) => {
  user.diceCnt -= selectedDice.filter(v => v.owner === color).length;
  user.dealerDiceCnt -= selectedDice.filter(v => v.owner !== color).length;
};

const updateGroundWithDice = ({ ground, color, selectedDice }) => {
  const userColors = getColorArray(color, selectedDice.filter(v => v.owner === color).length);
  const dealerColors = getColorArray('white', selectedDice.filter(v => v.owner !== color).length);
  ground.placedDice = [...ground?.placedDice, ...userColors, ...dealerColors];
};

// AI 턴 처리 함수
const processAITurn = (aiUser, roomId) => {
  if (!aiUser || !aiUser.isAI) return;
  if (aiUser.diceCnt + aiUser.dealerDiceCnt <= 0) return;

  const users = getUsersInRoom(roomId);
  const groundInfo = getGroundInfo(roomId)?.arr;

  // 1. AI가 주사위를 굴림
  const diceResults = rollDiceForAI(aiUser);

  // 클라이언트에 주사위 결과 전송
  io.to(roomId).emit('printDice', diceResults);
  io.to(roomId).emit('message', {
    user: 'Admin',
    text: `🤖 ${aiUser.color} (AI)가 주사위를 굴렸습니다!`,
  });

  // 2. 잠시 대기 후 선택 (시각적 효과)
  setTimeout(() => {
    // 3. AI가 최적의 카지노 선택
    const chosenNumber = calculateAIChoice(diceResults, groundInfo, aiUser.color, users);
    const selectedDice = diceResults.filter(d => d.number === chosenNumber);

    io.to(roomId).emit('message', {
      user: 'Admin',
      text: `🤖 ${aiUser.color} (AI)가 ${chosenNumber}번 카지노를 선택했습니다! (${selectedDice.length}개)`,
    });

    // 4. 주사위 배치
    const ground = groundInfo.find(g => g.id === chosenNumber);
    if (ground) {
      updateGroundWithDice({ ground, color: aiUser.color, selectedDice });
      updateUserDiceCount(aiUser, selectedDice, aiUser.color);
    }

    // 5. 다음 턴 결정
    const nextUser = determineNextUser(users, aiUser.color);

    // 6. 클라이언트에 업데이트 전송
    io.to(roomId).emit('whoTurn', nextUser);
    io.to(roomId).emit('groundResult', getGroundInfo(roomId)?.arr);
    io.to(roomId).emit('printDice', []);
    io.to(roomId).emit('roomData', {
      room: roomId,
      users: getUsersInRoom(roomId),
    });

    // 7. 게임 종료 체크
    checkAndHandleGameEnd(aiUser, users);

    // 8. 다음 플레이어가 AI면 계속 진행, 아니면 타이머 시작
    if (nextUser?.isAI && nextUser.diceCnt + nextUser.dealerDiceCnt > 0) {
      setTimeout(() => processAITurn(nextUser, roomId), 2000);
    } else if (nextUser && !nextUser.isAI && nextUser.diceCnt + nextUser.dealerDiceCnt > 0) {
      startTurnTimer(roomId, nextUser);
    }
  }, 1500);
};

server.listen(PORT, () => console.log(`서버 ${PORT}`));

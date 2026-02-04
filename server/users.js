export const users = [];
export const grounds = [];
export const rooms = [];

export const createRoom = ({ id, name, total, totalRounds = 4, aiCount = 0 }) => {
  name = name.trim().toLowerCase();

  const existingRoom = rooms.find(
    (room) => room.id === id,
  );

  if (existingRoom) {
    return { error: '이미 방을 만들었습니다' };
  }
  const room = {
    id,
    name,
    total: Number(total),
    totalRounds: Number(totalRounds),
    currentRound: 1,
    currentCnt: 0,
    aiCount: Number(aiCount)
  };
  rooms.push(room);
  return { room };
};

export const addUser = ({ id, roomId }) => {
  const room = rooms.find((v) => v.id === roomId);

  if (room?.currentCnt === room?.total) {
    return { error: '인원이 다 찼습니다' };
  }

  // 2인: 중립 주사위 4개, 3~4인: 2개, 5인: 0개
  const dealerDiceMap = {
    2: 4,
    3: 2,
    4: 2,
    5: 0,
  };

  const colorList = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  const usersInRoom = getUsersInRoom(roomId);
  const usedColors = usersInRoom.map(user => user.color);
  const availableColors = colorList.filter(color => !usedColors.includes(color));
  const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];

  const dealerDiceCnt = dealerDiceMap[room?.total] ?? 0;
  const user = {
    id,
    roomId,
    color: randomColor,
    ready: false,
    diceCnt: 8,
    dealerDiceCnt,
    totalMoney: 0  // 누적 상금
  };

  users.push(user);
  room.currentCnt += 1;
  return { user };
};

export const groundSetting = (room) => {
  const dollar = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000];

  const arr = Array(6).fill().map((v, i) => {
    let total = 0;
    const money = [];
    // 최소 $50,000 이상이 되도록 설정 (표준 규칙)
    while (total < 50000) {
      const m = dollar[Math.floor(Math.random() * 9)];
      total += m;
      money.push(m);
    }
    return { id: i + 1, money, placedDice: [] };
  });

  const ground = { room, arr };

  const existIndex = grounds.findIndex((v) => v.room === room);

  if (existIndex === -1) {
    grounds.push(ground);
  } else {
    // 이미 존재하면 새 라운드를 위해 업데이트
    grounds[existIndex] = ground;
  }
};

// 새 라운드를 위해 주사위 리셋
export const resetDiceForNewRound = (roomId) => {
  const room = rooms.find((v) => v.id === roomId);
  const dealerDiceMap = { 2: 4, 3: 2, 4: 2, 5: 0 };
  const dealerDiceCnt = dealerDiceMap[room?.total] ?? 0;

  users.forEach(user => {
    if (user.roomId === roomId) {
      user.diceCnt = 8;
      user.dealerDiceCnt = dealerDiceCnt;
    }
  });
};

// 라운드 증가
export const incrementRound = (roomId) => {
  const room = rooms.find((v) => v.id === roomId);
  if (room) {
    room.currentRound += 1;
    return room.currentRound;
  }
  return null;
};

// 게임 종료 여부 확인
export const isGameFinished = (roomId) => {
  const room = rooms.find((v) => v.id === roomId);
  return room && room.currentRound > room.totalRounds;
};

// 유저 상금 추가
export const addMoneyToUser = (roomId, color, amount) => {
  const user = users.find(u => u.roomId === roomId && u.color === color);
  if (user) {
    user.totalMoney += amount;
  }
};

export const getGroundInfo = (room) => grounds.find(ground => ground.room === room);

export const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  const user = users.find((user) => user.id === id);

  const roomIndex = rooms.findIndex((v) => v.id === user?.roomId);
  const room = rooms.find((v) => v.id === user?.roomId);
  if (room) {
    room.currentCnt -= 1;
    if (room?.currentCnt <= 0 || room?.currentCnt > room?.total) {
      rooms.splice(roomIndex, 1);
      // 방 삭제 시 해당 방의 모든 유저(AI 포함) 제거
      removeAllUsersInRoom(user?.roomId);
    }
  }

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

// 방에 실제 플레이어가 있는지 확인 (AI 제외)
export const hasRealPlayers = (roomId) => {
  return users.some(u => u.roomId === roomId && !u.isAI);
};

// 방의 모든 유저 제거 (방 삭제 시)
export const removeAllUsersInRoom = (roomId) => {
  for (let i = users.length - 1; i >= 0; i--) {
    if (users[i].roomId === roomId) {
      users.splice(i, 1);
    }
  }
};

// AI만 남았는지 확인하고 방 삭제
export const checkAndRemoveAIOnlyRoom = (roomId) => {
  const roomUsers = getUsersInRoom(roomId);
  const realPlayers = roomUsers.filter(u => !u.isAI);

  if (realPlayers.length === 0 && roomUsers.length > 0) {
    // AI만 남음 - 방 삭제
    const roomIndex = rooms.findIndex((v) => v.id === roomId);
    if (roomIndex !== -1) {
      rooms.splice(roomIndex, 1);
    }
    // 해당 방의 모든 AI 유저 제거
    removeAllUsersInRoom(roomId);
    // 그라운드 정보도 제거
    const groundIndex = grounds.findIndex(g => g.room === roomId);
    if (groundIndex !== -1) {
      grounds.splice(groundIndex, 1);
    }
    return true; // 방이 삭제됨
  }
  return false; // 방 유지
};

export const getUser = (id) => users.find((user) => user.id === id);

export const getUsersInRoom = (roomId) => users.filter((user) => user.roomId === roomId);

export const getRooms = () => {
  return rooms;
};

export const getRoom = (roomId) => {
  return rooms.find(v => v.id === roomId);
};

// AI 플레이어 추가
export const addAIUser = ({ roomId, aiIndex }) => {
  const room = rooms.find((v) => v.id === roomId);
  if (!room) return { error: '방을 찾을 수 없습니다' };

  const dealerDiceMap = { 2: 4, 3: 2, 4: 2, 5: 0 };
  const colorList = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  const usersInRoom = getUsersInRoom(roomId);
  const usedColors = usersInRoom.map(user => user.color);
  const availableColors = colorList.filter(color => !usedColors.includes(color));
  const aiColor = availableColors[0];

  const dealerDiceCnt = dealerDiceMap[room?.total] ?? 0;
  const aiUser = {
    id: `ai-${roomId}-${aiIndex}`,
    roomId,
    color: aiColor,
    ready: true,
    diceCnt: 8,
    dealerDiceCnt,
    totalMoney: 0,
    isAI: true,
    aiName: `AI ${aiIndex + 1}`
  };

  users.push(aiUser);
  room.currentCnt += 1;
  return { user: aiUser };
};

// AI가 주사위를 굴림
export const rollDiceForAI = (aiUser) => {
  const diceArr = Array(aiUser.diceCnt).fill().map(() => ({
    owner: aiUser.color,
    number: Math.floor(Math.random() * 6) + 1
  }));

  const dealerDiceArr = Array(aiUser.dealerDiceCnt).fill().map(() => ({
    owner: 'white',
    number: Math.floor(Math.random() * 6) + 1
  }));

  return [...diceArr, ...dealerDiceArr];
};

// AI 전략: 최적의 카지노 선택 (강화된 버전)
export const calculateAIChoice = (diceResults, groundInfo, aiColor, allUsers) => {
  // 주사위 눈별로 그룹화
  const diceByNumber = {};
  diceResults.forEach(dice => {
    if (!diceByNumber[dice.number]) {
      diceByNumber[dice.number] = { own: 0, dealer: 0 };
    }
    if (dice.owner === aiColor) {
      diceByNumber[dice.number].own++;
    } else {
      diceByNumber[dice.number].dealer++;
    }
  });

  // AI의 현재 순위 파악
  const aiUser = allUsers.find(u => u.color === aiColor);
  const sortedByMoney = [...allUsers].sort((a, b) => b.totalMoney - a.totalMoney);
  const aiRank = sortedByMoney.findIndex(u => u.color === aiColor) + 1;
  const isLeading = aiRank === 1;
  const isLosing = aiRank > Math.ceil(allUsers.length / 2);

  // 상대방 남은 주사위 분석
  const opponents = allUsers.filter(u => u.color !== aiColor);
  const opponentTotalDice = opponents.reduce((sum, u) => sum + u.diceCnt + u.dealerDiceCnt, 0);
  const avgOpponentDice = opponentTotalDice / opponents.length;

  let bestChoice = null;
  let bestScore = -Infinity;

  // 각 가능한 선택에 대해 점수 계산
  Object.keys(diceByNumber).forEach(numStr => {
    const number = parseInt(numStr);
    const casino = groundInfo.find(g => g.id === number);
    if (!casino) return;

    const diceCount = diceByNumber[number];

    // 상금 분석 (1등, 2등, 3등 상금 구분)
    const sortedMoney = [...casino.money].sort((a, b) => b - a);
    const firstPrize = sortedMoney[0] || 0;
    const secondPrize = sortedMoney[1] || 0;
    const thirdPrize = sortedMoney[2] || 0;
    const totalMoney = casino.money.reduce((sum, m) => sum + m, 0);

    // 현재 카지노에 놓인 주사위 분석
    const placedDiceCount = {};
    casino.placedDice.forEach(color => {
      placedDiceCount[color] = (placedDiceCount[color] || 0) + 1;
    });

    // AI가 놓을 주사위 수
    const aiDiceToPlace = diceCount.own;
    const aiCurrentDice = placedDiceCount[aiColor] || 0;
    const aiTotalDice = aiCurrentDice + aiDiceToPlace;

    // 경쟁자 상세 분석
    const competitorDice = [];
    Object.entries(placedDiceCount).forEach(([color, count]) => {
      if (color !== aiColor && color !== 'white') {
        competitorDice.push({ color, count });
      }
    });
    competitorDice.sort((a, b) => b.count - a.count);

    const maxCompetitorDice = competitorDice[0]?.count || 0;
    const secondCompetitorDice = competitorDice[1]?.count || 0;
    const competitorCount = competitorDice.length;
    const leadingCompetitor = competitorDice[0]?.color || null;

    // 점수 계산 시작
    let score = 0;

    // === 1. 승리 예측 기반 점수 ===
    if (aiTotalDice > maxCompetitorDice) {
      // 1등 확정
      score += firstPrize * 1.5;

      // 안전 마진 보너스 (2개 이상 차이)
      if (aiTotalDice - maxCompetitorDice >= 2) {
        score += 15000;
      }
    } else if (aiTotalDice === maxCompetitorDice && maxCompetitorDice > 0) {
      // 동점 - 차단 전략
      if (isLosing) {
        // 지고 있으면 상대 차단이 유리
        score += firstPrize * 0.3;
      } else {
        // 이기고 있으면 동점은 손해
        score -= firstPrize * 0.5;
      }
    } else if (aiTotalDice > secondCompetitorDice && competitorCount >= 1) {
      // 2등 가능
      score += secondPrize * 0.8;
    } else if (competitorCount >= 2 && aiTotalDice > (competitorDice[2]?.count || 0)) {
      // 3등 가능
      score += thirdPrize * 0.5;
    } else if (competitorCount > 0) {
      // 질 가능성 높음
      score -= totalMoney * 0.3;
    }

    // === 2. 빈 카지노 선점 전략 ===
    if (competitorCount === 0) {
      score += firstPrize * 0.8;
      // 많은 주사위로 선점하면 보너스
      if (aiDiceToPlace >= 3) {
        score += 25000;
      }
    }

    // === 3. 차단/방해 전략 ===
    if (leadingCompetitor) {
      const leaderUser = allUsers.find(u => u.color === leadingCompetitor);
      if (leaderUser) {
        const leaderRank = sortedByMoney.findIndex(u => u.color === leadingCompetitor) + 1;

        // 1등을 차단하면 보너스
        if (leaderRank === 1 && aiTotalDice === maxCompetitorDice) {
          score += 30000;
        }
      }
    }

    // === 4. 주사위 효율성 ===
    // 많은 주사위를 효과적으로 사용
    if (aiDiceToPlace >= 3) {
      score += aiDiceToPlace * 8000;
    } else if (aiDiceToPlace === 2) {
      score += aiDiceToPlace * 5000;
    } else {
      score += aiDiceToPlace * 3000;
    }

    // === 5. 리드 유지 전략 (방어적) ===
    if (isLeading) {
      // 안전한 선택 선호
      if (competitorCount === 0) {
        score += 20000;
      }
      // 리스크 있는 선택 페널티
      if (aiTotalDice <= maxCompetitorDice && maxCompetitorDice > 0) {
        score -= 15000;
      }
    }

    // === 6. 추격 전략 (공격적) ===
    if (isLosing) {
      // 고액 카지노 선호
      score += totalMoney * 0.1;
      // 1등 차단 시 보너스
      if (aiTotalDice === maxCompetitorDice && maxCompetitorDice > 0) {
        score += 20000;
      }
    }

    // === 7. 중립 주사위 고려 ===
    // 중립 주사위가 많으면 상대에게 유리할 수 있음
    if (diceCount.dealer > 0) {
      // 상대가 없는 곳에 중립 주사위는 덜 해로움
      if (competitorCount === 0) {
        score -= diceCount.dealer * 1000;
      } else {
        score -= diceCount.dealer * 4000;
      }
    }

    // === 8. 후반전 전략 ===
    if (avgOpponentDice < 4) {
      // 후반전: 확실한 승리 선호
      if (aiTotalDice > maxCompetitorDice) {
        score += 15000;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestChoice = number;
    }
  });

  return bestChoice || parseInt(Object.keys(diceByNumber)[0]);
};

// AI 유저인지 확인
export const isAIUser = (userId) => {
  return userId && userId.startsWith('ai-');
};

// AI 유저 가져오기
export const getAIUsers = (roomId) => {
  return users.filter(u => u.roomId === roomId && u.isAI);
};

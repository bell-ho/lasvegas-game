export const countWords = (array) => {
  return array.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});
};

export const filterUniqueCounts = (counts) => {
  const entries = Object.entries(counts);
  const frequency = {};

  entries.forEach(([key, value]) => {
    frequency[value] = (frequency[value] || 0) + 1;
  });

  return entries
    .filter(([, count]) => frequency[count] === 1)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
};

export const getColorArray = (color, length) => {
  return Array(length).fill().map(() => color);
};

export const determineNextUser = (users, color) => {
  const startIndex = users.findIndex(item => item.color === color);
  if (startIndex === -1) return undefined;

  let currentIndex = startIndex;
  let nextUser;
  do {
    currentIndex = (currentIndex + 1) % users.length;
    nextUser = users[currentIndex];
    if (currentIndex === startIndex) break;
  } while (!(nextUser.diceCnt + nextUser.dealerDiceCnt));
  return nextUser;
};

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
const Dice = () => {
  const [number, setNumber] = useState(1);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    setRolling(true);

    const randomNum = Math.floor(Math.random() * 6) + 1;
    setTimeout(() => {
      setNumber(randomNum);
      setRolling(false);
    }, 600);
  };
  return (
    <div>
      <DiceWrapper rolling={rolling}>{number}</DiceWrapper>
      <button onClick={rollDice} disabled={rolling}>
        주사위 굴리기
      </button>
    </div>
  );
};

const DiceWrapper = styled.div`
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid black;
  font-size: 2em;
  transition: transform 0.6s;

  ${(props) => props.rolling && `animation: ${rollAnimation} 0.6s;`}
`;

const rollAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(720deg); }
`;

const Wrapper = styled('div')`
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid black;
  font-size: 2em;
  transition: transform 0.6s;
`;
export default Dice;

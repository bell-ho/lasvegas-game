import React, { useCallback, useState } from 'react';
import styled from '@emotion/styled';
import socket from '../../socket';
import { useHistory } from 'react-router-dom';
import { mobile, tabletAndBelow } from '../../utill';

const MakeRoom = () => {
  const [room, setRoom] = useState('');
  const [total, setTotal] = useState(2);
  const [totalRounds, setTotalRounds] = useState(4);
  const [aiCount, setAiCount] = useState(0);
  const history = useHistory();

  const handleChange = (event) => {
    const newTotal = Number(event.target.value);
    setTotal(newTotal);
    if (aiCount >= newTotal) {
      setAiCount(Math.max(0, newTotal - 1));
    }
  };

  const handleRoundsChange = (event) => {
    setTotalRounds(event.target.value);
  };

  const handleAiChange = (event) => {
    setAiCount(Number(event.target.value));
  };

  const createRoom = useCallback(() => {
    const id = socket.id;
    socket.emit('createRoom', { id, name: room, total, totalRounds, aiCount }, (result) => {
      if (result.status === 200) {
        history.push(`/chat?id=${id}&roomId=${id}`);
      }
    });
  }, [room, total, totalRounds, aiCount]);

  const aiOptions = [];
  for (let i = 0; i < total; i++) {
    aiOptions.push(
      <option key={i} value={i}>
        {i === 0 ? '없음' : `${i}명`}
      </option>
    );
  }

  return (
    <FormWrapper>
      <FormGroup>
        <Label>
          <LabelIcon>🏷️</LabelIcon>
          방 이름
        </Label>
        <Input
          placeholder="게임룸 이름을 입력하세요"
          type="text"
          value={room}
          onChange={(event) => setRoom(event.target.value)}
        />
      </FormGroup>

      <FormRow>
        <FormGroup>
          <Label>
            <LabelIcon>👥</LabelIcon>
            총 인원
          </Label>
          <Select value={total} onChange={handleChange}>
            <option value={2}>2명</option>
            <option value={3}>3명</option>
            <option value={4}>4명</option>
            <option value={5}>5명</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>
            <LabelIcon>🤖</LabelIcon>
            AI 플레이어
          </Label>
          <Select value={aiCount} onChange={handleAiChange}>
            {aiOptions}
          </Select>
        </FormGroup>
      </FormRow>

      {aiCount > 0 && (
        <InfoBadge>
          <span>👤</span> 실제 플레이어 {total - aiCount}명 필요
        </InfoBadge>
      )}

      <FormGroup>
        <Label>
          <LabelIcon>🎯</LabelIcon>
          라운드 수
        </Label>
        <RoundSelector>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <RoundButton
              key={num}
              active={Number(totalRounds) === num}
              onClick={() => setTotalRounds(num)}
              type="button"
            >
              {num}R
              {num === 4 && <DefaultBadge>기본</DefaultBadge>}
            </RoundButton>
          ))}
        </RoundSelector>
      </FormGroup>

      <CreateButton onClick={createRoom} type="submit">
        <ButtonIcon>🎲</ButtonIcon>
        방 만들기
      </CreateButton>
    </FormWrapper>
  );
};

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  ${tabletAndBelow} {
    gap: 16px;
  }

  ${mobile} {
    gap: 14px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;

  ${tabletAndBelow} {
    gap: 14px;
  }

  ${mobile} {
    flex-direction: column;
    gap: 12px;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
`;

const LabelIcon = styled.span`
  font-size: 1rem;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
  }

  ${tabletAndBelow} {
    padding: 12px 14px;
    font-size: 0.95rem;
  }

  ${mobile} {
    padding: 12px;
    font-size: 0.9rem;
    border-radius: 10px;
  }
`;

const Select = styled.select`
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23ffd700' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: rgba(255, 215, 0, 0.5);
  }

  option {
    background: #1a1a2e;
    color: white;
  }

  ${tabletAndBelow} {
    padding: 12px 14px;
    font-size: 0.95rem;
    padding-right: 36px;
    background-position: right 14px center;
  }

  ${mobile} {
    padding: 12px;
    font-size: 0.9rem;
    border-radius: 10px;
    padding-right: 34px;
    background-position: right 12px center;
  }
`;

const InfoBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  color: #ffd700;
  font-size: 0.9rem;
  font-weight: 500;

  ${mobile} {
    padding: 10px 12px;
    font-size: 0.85rem;
    gap: 6px;
  }
`;

const RoundSelector = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  ${mobile} {
    gap: 6px;
    justify-content: flex-start;
  }
`;

const RoundButton = styled.button`
  position: relative;
  padding: 12px 20px;
  border: 1px solid ${props => props.active ? '#ffd700' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  background: ${props => props.active ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.active ? '#ffd700' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(255, 215, 0, 0.1);
  }

  ${tabletAndBelow} {
    padding: 10px 16px;
    font-size: 0.95rem;
  }

  ${mobile} {
    padding: 10px 14px;
    font-size: 0.9rem;
    border-radius: 8px;
  }
`;

const DefaultBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 6px;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #1a1a2e;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
  }

  &:active {
    transform: translateY(-1px);
  }

  ${tabletAndBelow} {
    padding: 14px 28px;
    font-size: 1rem;
  }

  ${mobile} {
    padding: 14px 24px;
    font-size: 0.95rem;
    border-radius: 10px;
    width: 100%;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1.3rem;
`;

export default MakeRoom;

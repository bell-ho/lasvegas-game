import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const DiceRoller = ({ diceCount = 8, dealerDiceCount = 0, onComplete, playerColor = '#ff6b6b' }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);
  const [isSettled, setIsSettled] = useState(false);
  const [results, setResults] = useState([]);

  // 플레이어 주사위 개수 (전체 - 딜러)
  const playerDiceCount = diceCount - dealerDiceCount;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Camera - 옆에서 보는 시점 (왼쪽에서 오른쪽으로 굴러가는 모습)
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const goldLight = new THREE.PointLight(0xffd700, 0.5, 20);
    goldLight.position.set(-5, 5, 0);
    scene.add(goldLight);

    // 물리 월드
    const world = new CANNON.World();
    world.gravity.set(0, -30, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // 테이블 생성 (직사각형)
    createTable(scene, world);

    // 주사위 생성 (플레이어 주사위 먼저, 딜러 주사위 나중에)
    const dice = [];
    const diceBodies = [];

    for (let i = 0; i < diceCount; i++) {
      // 딜러 주사위인지 확인 (마지막 dealerDiceCount개가 딜러 주사위)
      const isDealerDice = i >= playerDiceCount;
      const color = isDealerDice ? '#ffffff' : playerColor;
      const { mesh, body } = createDice(scene, world, i, diceCount, color);
      dice.push(mesh);
      diceBodies.push(body);
    }

    // 애니메이션 루프
    let settledFrames = 0;
    const requiredSettledFrames = 60;

    const animate = () => {
      world.step(1 / 60);

      // 주사위 위치 업데이트
      dice.forEach((mesh, i) => {
        mesh.position.copy(diceBodies[i].position);
        mesh.quaternion.copy(diceBodies[i].quaternion);
      });

      // 정지 확인
      const allSettled = diceBodies.every((body) => {
        const velocity = body.velocity.length();
        const angularVelocity = body.angularVelocity.length();
        return velocity < 0.1 && angularVelocity < 0.1;
      });

      if (allSettled) {
        settledFrames++;
        if (settledFrames >= requiredSettledFrames && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setIsSettled(true);
          const diceResults = diceBodies.map((body) => getDiceValue(body));
          setResults(diceResults);
          setTimeout(() => {
            if (onCompleteRef.current) {
              onCompleteRef.current(diceResults);
            }
          }, 1500);
        }
      } else {
        settledFrames = 0;
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [diceCount, playerColor, playerDiceCount]);

  return (
    <RollerContainer>
      <RollerModal>
        <TitleSection>
          <Title>🎲 ROLLING DICE 🎲</Title>
        </TitleSection>

        <CanvasWrapper>
          <CanvasContainer ref={containerRef} />
          <DiceInfo>
            <PlayerIndicator color={playerColor}>
              🎮 x{playerDiceCount}
            </PlayerIndicator>
            {dealerDiceCount > 0 && (
              <PlayerIndicator color="#ffffff">
                🎰 x{dealerDiceCount}
              </PlayerIndicator>
            )}
          </DiceInfo>
        </CanvasWrapper>

        {isSettled && (
          <ResultsDisplay>
            <ResultTitle>RESULTS</ResultTitle>
            <ResultDice>
              {results.map((num, i) => (
                <ResultNumber key={i} color={i < playerDiceCount ? playerColor : '#ffffff'} delay={i * 0.05}>{num}</ResultNumber>
              ))}
            </ResultDice>
          </ResultsDisplay>
        )}

        <Hint>{isSettled ? 'Returning to game...' : 'Rolling...'}</Hint>
      </RollerModal>
    </RollerContainer>
  );
};

// 테이블 생성
function createTable(scene, world) {
  // 테이블 표면
  const tableGeometry = new THREE.BoxGeometry(14, 0.3, 8);
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d5c2e,
    roughness: 0.8,
  });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.y = -0.15;
  table.receiveShadow = true;
  scene.add(table);

  // 골드 테두리
  const borderMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.8,
  });

  // 앞뒤 테두리
  const frontBorder = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.4, 0.2), borderMaterial);
  frontBorder.position.set(0, 0, 4.1);
  scene.add(frontBorder);

  const backBorder = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.4, 0.2), borderMaterial);
  backBorder.position.set(0, 0, -4.1);
  scene.add(backBorder);

  // 좌우 테두리
  const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 8), borderMaterial);
  leftBorder.position.set(-7.1, 0, 0);
  scene.add(leftBorder);

  const rightBorder = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 8), borderMaterial);
  rightBorder.position.set(7.1, 0, 0);
  scene.add(rightBorder);

  // 물리 바닥
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // 벽 (물리) - 탄성 높여서 주사위가 튕겨나오도록
  const wallMaterial = new CANNON.Material({ friction: 0.2, restitution: 0.8 });

  // 앞벽
  const frontWall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: wallMaterial });
  frontWall.position.set(0, 0, 4);
  frontWall.quaternion.setFromEuler(0, Math.PI, 0);
  world.addBody(frontWall);

  // 뒷벽
  const backWall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: wallMaterial });
  backWall.position.set(0, 0, -4);
  world.addBody(backWall);

  // 왼쪽 벽
  const leftWall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: wallMaterial });
  leftWall.position.set(-7, 0, 0);
  leftWall.quaternion.setFromEuler(0, Math.PI / 2, 0);
  world.addBody(leftWall);

  // 오른쪽 벽
  const rightWall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: wallMaterial });
  rightWall.position.set(7, 0, 0);
  rightWall.quaternion.setFromEuler(0, -Math.PI / 2, 0);
  world.addBody(rightWall);
}

// 주사위 생성
function createDice(scene, world, index, totalDice, color) {
  const size = 0.8;

  const geometry = new THREE.BoxGeometry(size, size, size);
  const materials = createDiceMaterials(size, color);

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // 물리 바디
  const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    material: new CANNON.Material({ friction: 0.5, restitution: 0.4 }),
    linearDamping: 0.4,
    angularDamping: 0.4,
  });

  // 왼쪽에서 시작해서 오른쪽으로 굴러감
  const row = Math.floor(index / 4);
  const col = index % 4;
  const startX = -6 - col * 0.3;
  const startY = 1.5 + row * 1 + Math.random() * 0.3;
  const startZ = (row - 0.5) * 1.5 + (Math.random() - 0.5) * 1;

  body.position.set(startX, startY, startZ);

  // 오른쪽으로 던지는 속도 (약하게 조정)
  const throwPower = 5 + Math.random() * 3;
  body.velocity.set(
    throwPower,
    1 + Math.random() * 1.5,
    (Math.random() - 0.5) * 2
  );

  // 회전 (약하게 조정)
  body.angularVelocity.set(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10
  );

  world.addBody(body);

  return { mesh, body };
}

// 주사위 텍스처 생성
function createDiceMaterials(size, color) {
  const faceConfigs = [
    { value: 1, positions: [[0, 0]] },
    { value: 6, positions: [[-0.28, 0.28], [0.28, 0.28], [-0.28, 0], [0.28, 0], [-0.28, -0.28], [0.28, -0.28]] },
    { value: 2, positions: [[-0.25, 0.25], [0.25, -0.25]] },
    { value: 5, positions: [[-0.25, 0.25], [0.25, 0.25], [0, 0], [-0.25, -0.25], [0.25, -0.25]] },
    { value: 3, positions: [[-0.25, 0.25], [0, 0], [0.25, -0.25]] },
    { value: 4, positions: [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]] },
  ];

  // 색상을 RGB로 변환
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const rgb = hexToRgb(color);
  const isLight = (rgb.r + rgb.g + rgb.b) / 3 > 128;
  const dotColor = isLight ? '#1a1a1a' : '#ffffff';

  return faceConfigs.map((config) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 배경 그라디언트
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
    const lighterColor = `rgb(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 40)}, ${Math.min(255, rgb.b + 40)})`;
    const darkerColor = `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`;
    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, darkerColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // 미세한 텍스처
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }

    // 골드 테두리
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 244, 244);

    // 점 그리기
    config.positions.forEach(([x, y]) => {
      const dotX = 128 + x * 160;
      const dotY = 128 - y * 160;

      // 그림자
      ctx.beginPath();
      ctx.arc(dotX + 2, dotY + 2, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      // 메인 점
      ctx.beginPath();
      ctx.arc(dotX, dotY, 14, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();

      // 하이라이트
      ctx.beginPath();
      ctx.arc(dotX - 4, dotY - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.1,
    });
  });
}

// 주사위 값 읽기
function getDiceValue(body) {
  const up = new CANNON.Vec3(0, 1, 0);
  const directions = [
    { vec: new CANNON.Vec3(1, 0, 0), value: 1 },
    { vec: new CANNON.Vec3(-1, 0, 0), value: 6 },
    { vec: new CANNON.Vec3(0, 1, 0), value: 2 },
    { vec: new CANNON.Vec3(0, -1, 0), value: 5 },
    { vec: new CANNON.Vec3(0, 0, 1), value: 3 },
    { vec: new CANNON.Vec3(0, 0, -1), value: 4 },
  ];

  let maxDot = -1;
  let result = 1;

  directions.forEach(({ vec, value }) => {
    const worldVec = body.quaternion.vmult(vec);
    const dot = worldVec.dot(up);
    if (dot > maxDot) {
      maxDot = dot;
      result = value;
    }
  });

  return result;
}

// === Styled Components ===

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const RollerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const RollerModal = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
  border-radius: 20px;
  border: 2px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.2), 0 20px 40px rgba(0, 0, 0, 0.5);

  @media (max-width: 600px) {
    padding: 16px;
    margin: 12px;
    gap: 12px;
  }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  color: transparent;
  background: linear-gradient(90deg, #ffd700, #fff5c3, #ffd700);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 3px;
  margin: 0;
  animation: ${shimmer} 2s linear infinite;

  @media (max-width: 600px) {
    font-size: 1.2rem;
    letter-spacing: 2px;
  }
`;

const CanvasWrapper = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.5), 0 10px 30px rgba(0, 0, 0, 0.4);
`;

const CanvasContainer = styled.div`
  width: 500px;
  height: 320px;

  @media (max-width: 550px) {
    width: calc(100vw - 60px);
    height: 250px;
  }
`;

const DiceInfo = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 8px;
`;

const PlayerIndicator = styled.div`
  padding: 6px 12px;
  background: ${props => props.color};
  color: ${props => {
    const hex = props.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r + g + b) / 3 > 128 ? '#1a1a2e' : '#ffffff';
  }};
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const ResultsDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  animation: ${fadeIn} 0.4s ease-out;
`;

const ResultTitle = styled.span`
  color: #ffd700;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
`;

const ResultDice = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ResultNumber = styled.span`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color};
  color: ${props => {
    const hex = props.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r + g + b) / 3 > 128 ? '#1a1a2e' : '#ffffff';
  }};
  font-size: 1.3rem;
  font-weight: 800;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(212, 175, 55, 0.5);
  animation: ${fadeIn} 0.3s ease-out;
  animation-delay: ${props => props.delay}s;
`;

const Hint = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin: 0;
`;

export default DiceRoller;

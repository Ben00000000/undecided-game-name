const player = document.getElementById('player');
const joystickZone = document.getElementById('joystick');
const hpBar = document.getElementById('hpBar');
let playerX = window.innerWidth / 2;
let playerY = window.innerHeight / 2;
let playerHP = 100;
let isHPDecreasing = false;
let speed = 1;
let score = 0;
let skillUsed1 = false;
let skillUsed2 = false;
let skillUsed3 = false;
let activeSkill = null;
let canEnemyDamagePlayer = false;

const idleSpriteURL = 'https://raw.githubusercontent.com/Ben00000000/asstes/main/Idle_2.png';
const runSpriteURL = 'https://raw.githubusercontent.com/Ben00000000/asstes/main/Run.png';

setPlayerSprite(idleSpriteURL);

player.style.left = `${playerX}px`;
player.style.top = `${playerY}px`;

const manager = nipplejs.create({
  zone: joystickZone,
  color: 'gray',
  multitouch: true,
});

let joystickAngle = 0;
let isJoystickActive = false;

manager.on('move', handleJoystickMove);
manager.on('start', handleJoystickStart);
manager.on('end', handleJoystickEnd);

function handleJoystickMove(event, nipple) {
  const angle = nipple.angle.radian;
  const moveX = Math.cos(angle) * speed;

  if (moveX > 0) {
    player.classList.remove('flipped');
  } else if (moveX < 0) {
    player.classList.add('flipped');
  }

  const moveY = Math.sin(angle) * speed;
  const invertedMoveY = -moveY;

  playerX += moveX;
  playerY += invertedMoveY;

  playerX = Math.min(Math.max(playerX, 0), window.innerWidth - player.offsetWidth + 1000);
  playerY = Math.min(Math.max(playerY, 0), window.innerHeight - player.offsetHeight);

  updatePlayerPosition();
  setPlayerSprite(runSpriteURL);

  joystickAngle = angle;
}

function handleJoystickStart() {
  isJoystickActive = true;
  gameLoop();
  setPlayerSprite(runSpriteURL);

  // Allow enemy to damage player after a delay (e.g., 2 seconds)
  setTimeout(() => {
    canEnemyDamagePlayer = true;
  }, 1000);
}

function handleJoystickEnd() {
  isJoystickActive = false;
  setPlayerSprite(idleSpriteURL);
}

function setPlayerSprite(spriteURL) {
  player.style.backgroundImage = `url('${spriteURL}')`;
}

function updatePlayerPosition() {
  player.style.left = `${playerX}px`;
  player.style.top = `${playerY}px`;
}

function createEnemy() {
  const enemy = document.createElement('div');
  enemy.className = 'enemy';
  const spawnPosition = Math.floor(Math.random() * 4);

  switch (spawnPosition) {
  case 0:
    enemy.style.top = '0';
    enemy.style.left = `${Math.random() * window.innerWidth}px`;
    break;
  case 1:
    enemy.style.bottom = '0';
    enemy.style.left = `${Math.random() * window.innerWidth}px`;
    break;
  case 2:
    enemy.style.left = '0';
    enemy.style.top = `${Math.random() * window.innerHeight}px`;
    break;
  case 3:
    enemy.style.right = '0';
    enemy.style.top = `${Math.random() * window.innerHeight}px`;
    break;
  default:
    break;
  }

  document.body.appendChild(enemy);

  return enemy;
}

function moveEnemyTowardsPlayer(enemy, playerX, playerY) {
  const enemyX = parseFloat(enemy.style.left) || 0;
  const enemyY = parseFloat(enemy.style.top) || 0;

  const angle = Math.atan2(
    playerY + player.offsetHeight / 2 - (enemyY + enemy.offsetHeight / 2),
    playerX + player.offsetWidth / 2 - (enemyX + enemy.offsetWidth / 2)
  );

  const moveX = Math.cos(angle) * speed * 0.3;
  const moveY = Math.sin(angle) * speed * 0.3;

  enemy.style.left = `${enemyX + moveX}px`;
  enemy.style.top = `${enemyY + moveY}px`;
}

let blockSpawnTimer = 0;
const blockSpawnInterval = 5000; // 1 second in milliseconds

function gameLoop() {
  if (isJoystickActive) {
    const moveX = Math.cos(joystickAngle) * speed;
    const moveY = Math.sin(joystickAngle) * speed;
    const invertedMoveY = -moveY;

    playerX += moveX;
    playerY += invertedMoveY;

    playerX = Math.min(Math.max(playerX, 0), window.innerWidth - player.offsetWidth);
    playerY = Math.min(Math.max(playerY, 0), window.innerHeight - player.offsetHeight);

    updatePlayerPosition();
    checkBlockCollisions();
    // Check enemy collisions with the player
    checkEnemyCollisions();

    if (Math.random() < 0.01) {
      const enemy = createEnemy();

      function move() {
        moveEnemyTowardsPlayer(enemy, playerX, playerY);
        requestAnimationFrame(move);
      }

      move();

      // Add a delay (e.g., 1000 milliseconds) before creating a new enemy
      setTimeout(function () {
        // Call the code to create a new enemy after the delay
        if (Math.random() < 0.01) {
          const newEnemy = createEnemy();
          moveEnemyTowardsPlayer(newEnemy, playerX, playerY);
        }
      }, 5000);
    }

    // Increment the timer
    blockSpawnTimer += 16; // Assuming 60 frames per second (1000 ms / 60 frames)

    // Check if it's time to spawn a block
    if (blockSpawnTimer >= blockSpawnInterval) {
      createBlock();
      blockSpawnTimer = 0; // Reset the timer
    }
    updateSkillButtonVisibility();
    updateHPBar();
    requestAnimationFrame(gameLoop);
  }
}

function checkEnemyCollisions() {
  const enemies = document.querySelectorAll('.enemy');

  let isColliding = false;

  enemies.forEach((enemy) => {
    if (isCollision(player, enemy, 10)) {
      isColliding = true;
    }
  });

  if (isColliding) {
    handleEnemyCollision();
  } else {
    // Reset the flag when there is no collision
    isHPDecreasing = false;
  }
}

function handleEnemyCollision() {
  // Decrease player HP by 1 only if it's allowed and not already decreasing
  if (canEnemyDamagePlayer && !isHPDecreasing) {
    isHPDecreasing = true;
    decreasePlayerHP();
  }
}

function decreasePlayerHP() {
  // Decrease player HP by 1 every second
  const hpDecreaseInterval = setInterval(() => {
    if (playerHP > 0 && isHPDecreasing) {
      playerHP -= 1;
      updateHPBar();
    } else {
      clearInterval(hpDecreaseInterval);
      isHPDecreasing = false; // Reset the flag when the interval is cleared
    }
  }, 1000);
}

function updateHPBar() {
  const hpBar = document.getElementById('hpBar');
  const maxHP = 100;
  const greenThreshold = 80;
  const blueThreshold = 30;

  // Update HP bar width based on player HP
  hpBar.style.width = `${playerHP}%`;

  // Change color based on HP range
  if (playerHP >= greenThreshold) {
    hpBar.style.backgroundColor = 'green';
  } else if (playerHP >= blueThreshold) {
    hpBar.style.backgroundColor = 'blue';
  } else {
    hpBar.style.backgroundColor = 'red';
  }

  // You can also add visual effects or additional styling based on the color if needed

  // Check if player HP is zero and handle game over logic
  if (playerHP <= 0) {
    gameOver();
  }
}

function gameOver() {
  playerHP = 100;
  clearInterval(hpDecreaseInterval);
  // Handle game over logic, for example, display a message or reset the game
  // Additional game over actions can be added here
}

function createBlock() {
  const block = document.createElement('div');
  block.className = 'block';
  const blockSize = 30; // Adjust the block size
  block.style.width = `${blockSize}px`;
  block.style.height = `${blockSize}px`;
  block.style.backgroundImage = "url('https://raw.githubusercontent.com/Ben00000000/asstes/main/skillpotion.png')";
  block.style.backgroundSize = 'cover';
  block.style.position = 'absolute';
  block.style.left = `${Math.random() * (window.innerWidth - blockSize)}px`;
  block.style.top = `${Math.random() * (window.innerHeight - blockSize)}px`;
  document.body.appendChild(block);
}

function checkBlockCollisions() {
  const blocks = document.querySelectorAll('.block');

  blocks.forEach((block) => {
    if (isCollision(player, block, 10)) {
      removeBlock(block);
      increaseYellowFillWidth();
    }
  });
}

function increaseYellowFillWidth() {
  const yellowFill = document.getElementById('yellowFill');
  const yellowBar = document.getElementById('yellowBar');
  const skillButton1 = document.getElementById('skillButton1');
  const skillButton2 = document.getElementById('skillButton2');
  const skillButton3 = document.getElementById('skillButton3');

  // Get the computed style to ensure we get the actual width, even if set inline
  const computedStyles = window.getComputedStyle(yellowFill);
  let currentWidth = parseFloat(computedStyles.width) || 0;
  const newWidth = Math.min(currentWidth + 10, yellowBar.offsetWidth);

  yellowFill.style.width = `${newWidth}px`;

  // Check for specific yellow fill values and show/hide corresponding skill buttons
  if (newWidth >= 30) {
    skillButton1.style.display = 'block';
  } else {
    skillButton1.style.display = 'none';
  }

  if (newWidth >= 70) {
    skillButton2.style.display = 'block';
  } else {
    skillButton2.style.display = 'none';
  }

  if (newWidth >= 100) {
    skillButton3.style.display = 'block';
  } else {
    skillButton3.style.display = 'none';
  }
}

function isCollision(element1, element2, margin = 0) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  return (
    rect1.left + margin < rect2.right - margin &&
    rect1.right - margin > rect2.left + margin &&
    rect1.top + margin < rect2.bottom - margin &&
    rect1.bottom - margin > rect2.top + margin
  );
}

function removeBlock(block) {
  block.parentNode.removeChild(block);
}

document.getElementById('skillButton1').addEventListener('click', () => {
  if (!activeSkill) {
    activeSkill = 1;
    useSkill(1);
  }
});

document.getElementById('skillButton2').addEventListener('click', () => {
  if (!activeSkill) {
    activeSkill = 2;
    useSkill(2);
  }
});

document.getElementById('skillButton3').addEventListener('click', () => {
  if (!activeSkill) {
    activeSkill = 3;
    useSkill(3);
  }
});

function useSkill(skillNumber) {
  const skillFramesOverlay = document.getElementById('skillFramesOverlay');
  skillFramesOverlay.innerHTML = '';

  const framePrefix = `https://raw.githubusercontent.com/Ben00000000/asstes/main/hit${skillNumber}%20(`;

  for (let i = 1; i <= 10; i++) {
    const skillFrame = document.createElement('img');
    skillFrame.src = `${framePrefix}${i}).png`;
    skillFrame.className = 'skill-frame';
    skillFramesOverlay.appendChild(skillFrame);
  }

  skillFramesOverlay.style.display = 'block';

  let currentFrame = 0;
  const frameInterval = 100; // 100 milliseconds interval

  const intervalId = setInterval(() => {
    skillFramesOverlay.children[currentFrame].style.display = 'block';

    if (currentFrame > 0) {
      skillFramesOverlay.children[currentFrame - 1].style.display = 'none';
    }

    currentFrame++;

    if (currentFrame === 10) {
      clearInterval(intervalId);
      setTimeout(() => {
        skillFramesOverlay.style.display = 'none';

        updateSkillButtonVisibility();
        // Handle skill effects based on the skill number
        if (skillNumber === 1) {
          updateSkillButtonVisibility();
          decreaseYellowFill(30);
          removeEnemies(10);
          skillUsed1 = false;
        } else if (skillNumber === 2) {
          updateSkillButtonVisibility();
          decreaseYellowFill(70);
          removeEnemies(15);
          skillUsed2 = false;
        } else if (skillNumber === 3) {
          updateSkillButtonVisibility();
          decreaseYellowFill(100);
          removeAllEnemies();
          skillUsed3 = false;
        }

        activeSkill = null;
        updateSkillButtonVisibility();

      }, frameInterval);
    }
  }, frameInterval);
}

function updateSkillButtonVisibility() {
  const yellowFill = document.getElementById('yellowFill');
  const skillButton1 = document.getElementById('skillButton1');
  const skillButton2 = document.getElementById('skillButton2');
  const skillButton3 = document.getElementById('skillButton3');

  const currentWidth = parseFloat(yellowFill.style.width) || 0;

  // Check and hide relevant skill buttons based on yellow fill
  if (currentWidth < 30) {
    skillButton1.style.display = 'none';
  } else {
    skillButton1.style.display = 'block';
  }

  if (currentWidth < 70) {
    skillButton2.style.display = 'none';
  } else {
    skillButton2.style.display = 'block';
  }

  if (currentWidth < 100) {
    skillButton3.style.display = 'none';
  } else {
    skillButton3.style.display = 'block';
  }
}

function decreaseYellowFill(amount) {
  const yellowFill = document.getElementById('yellowFill');
  let currentWidth = parseFloat(yellowFill.style.width) || 0;
  const newWidth = Math.max(currentWidth - amount, 0);
  yellowFill.style.width = `${newWidth}px`;
}

function removeEnemies(count) {
  const enemies = document.querySelectorAll('.enemy');
  for (let i = 0; i < Math.min(count, enemies.length); i++) {
    const enemy = enemies[i];
    removeEnemy(enemy);
  }
}

function removeAllEnemies() {
  const enemies = document.querySelectorAll('.enemy');
  enemies.forEach((enemy) => {
    removeEnemy(enemy);
  });
}

function removeEnemy(enemy) {
  enemy.parentNode.removeChild(enemy);
  increaseScore();
}

function increaseScore() {
  score++;
  updateScoreDisplay();
}

function updateScoreDisplay() {
  const scoreDisplay = document.getElementById('scoreDisplay'); // Assuming you have an element with the id 'scoreDisplay' to show the score
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
  }
}

checkEnemyCollisions();
updateSkillButtonVisibility();
// To test, call the gameLoop function
gameLoop();
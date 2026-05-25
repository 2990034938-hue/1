// 获取DOM元素
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const currentScoreDoc = document.getElementById("current-score");
const highScoreDoc = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const finalScoreDoc = document.getElementById("final-score");
const startBtn = document.getElementById("start-btn");

// 游戏配置常量
const GRID_SIZE = 20; // 每个网格的大小 (20x20 像素)
const TILE_COUNT = canvas.width / GRID_SIZE; // 网格数量 (20x20 个)
const GAME_SPEED = 100; // 游戏刷新速度 (毫秒)，越小蛇移速越快

// 游戏变量
let snake = [];
let food = { x: 0, y: 0 };
let dx = GRID_SIZE; // 初始X轴移动速度（向右）
let dy = 0;         // 初始Y轴移动速度
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let gameLoopId = null;
let changingDirection = false; // 防控制冲突锁

// 初始化最高分显示
highScoreDoc.textContent = highScore;

// 监听键盘事件
document.addEventListener("keydown", changeDirection);
startBtn.addEventListener("click", startGame);

// 自动弹出初始开始菜单
showOverlay("贪吃蛇大作战", "准备好了吗？", "开始游戏");

/**
 * 开始/重置游戏
 */
function startGame() {
    // 隐藏遮罩层
    overlay.classList.add("hidden");
    
    // 初始化蛇身（初始长度为3，放在中间偏左）
    snake = [
        { x: GRID_SIZE * 5, y: GRID_SIZE * 10 },
        { x: GRID_SIZE * 4, y: GRID_SIZE * 10 },
        { x: GRID_SIZE * 3, y: GRID_SIZE * 10 }
    ];
    
    // 初始化变量
    dx = GRID_SIZE;
    dy = 0;
    score = 0;
    currentScoreDoc.textContent = score;
    changingDirection = false;

    // 生成第一个食物
    generateFood();

    // 清除旧的定时器并启动游戏主循环
    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(main, GAME_SPEED);
}

/**
 * 游戏主循环函数
 */
function main() {
    if (hasGameEnded()) {
        gameOver();
        return;
    }

    changingDirection = false; // 解锁方向输入
    clearCanvas();
    drawFood();
    moveSnake();
    drawSnake();
}

/**
 * 清空画布
 */
function clearCanvas() {
    ctx.fillStyle = "#1b1b2f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * 绘制蛇身
 */
function drawSnake() {
    snake.forEach((part, index) => {
        // 蛇头和蛇身颜色区分
        ctx.fillStyle = index === 0 ? "#e43f5a" : "#00fff0";
        ctx.strokeStyle = "#1b1b2f"; // 关节缝隙
        
        ctx.fillRect(part.x, part.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(part.x, part.y, GRID_SIZE, GRID_SIZE);
    });
}

/**
 * 让蛇向前移动一步
 */
function moveSnake() {
    // 根据当前方向创建新的蛇头
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); // 插到数组头部

    // 检查蛇头是否吃到食物
    const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
    if (hasEatenFood) {
        score += 10;
        currentScoreDoc.textContent = score;
        generateFood();
    } else {
        snake.pop(); // 没有吃到食物，移除蛇尾，保持长度不变
    }
}

/**
 * 操控蛇的移动方向（带防反向自撞逻辑）
 */
function changeDirection(event) {
    const LEFT_KEY = 37;
    const UP_KEY = 38;
    const RIGHT_KEY = 39;
    const DOWN_KEY = 40;

    // 如果在当前帧已经改变过方向，直接返回，防止手速过快自撞
    if (changingDirection) return;

    const keyPressed = event.keyCode;
    const goingUp = dy === -GRID_SIZE;
    const goingDown = dy === GRID_SIZE;
    const goingRight = dx === GRID_SIZE;
    const goingLeft = dx === -GRID_SIZE;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -GRID_SIZE;
        dy = 0;
        changingDirection = true;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -GRID_SIZE;
        changingDirection = true;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = GRID_SIZE;
        dy = 0;
        changingDirection = true;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = GRID_SIZE;
        changingDirection = true;
    }
}

/**
 * 随机生成食物位置（不在蛇身上）
 */
function generateFood() {
    food.x = Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE;
    food.y = Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE;

    // 递归检查：如果食物生成在蛇身上，重新生成
    const snakeOnFood = snake.some(part => part.x === food.x && part.y === food.y);
    if (snakeOnFood) generateFood();
}

/**
 * 绘制食物（带呼吸微光感）
 */
function drawFood() {
    ctx.fillStyle = "#ffaa00";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ffaa00"; // 网页版食物发光特效
    ctx.fillRect(food.x, food.y, GRID_SIZE, GRID_SIZE);
    ctx.shadowBlur = 0; // 重置发光特效，避免影响蛇身
}

/**
 * 碰撞检测（边界与自身）
 */
function hasGameEnded() {
    // 1. 撞自己检测（从索引1开始，即头是否撞到身体任何部位）
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }

    // 2. 撞墙检测
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= canvas.width;
    const hitToptWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= canvas.height;

    return hitLeftWall || hitRightWall || hitToptWall || hitBottomWall;
}

/**
 * 结束游戏
 */
function gameOver() {
    clearInterval(gameLoopId);
    
    // 更新最高分记录
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
        highScoreDoc.textContent = highScore;
    }

    showOverlay("游戏结束", score, "再来一局");
}

/**
 * 控制遮罩层显示
 */
function showOverlay(title, scoreText, btnText) {
    overlayTitle.textContent = title;
    finalScoreDoc.textContent = scoreText;
    startBtn.textContent = btnText;
    overlay.classList.remove("hidden");
}

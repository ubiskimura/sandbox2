import "./styles.css";

const BOARD_SIZE = 15;
const CELL = 36;
const MARGIN = 20;
const CANVAS_SIZE = CELL * (BOARD_SIZE - 1) + MARGIN * 2;

const state = {
  board: [],
  current: "black",
  winner: null,
  winLine: [],
  scores: { black: 0, white: 0 },
};

function initBoard() {
  state.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  state.current = "black";
  state.winner = null;
  state.winLine = [];
}

function checkWin(board, row, col, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    const line = [[row, col]];
    for (let s = 1; s <= 4; s++) {
      const r = row + dr * s, c = col + dc * s;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player)
        line.push([r, c]);
      else break;
    }
    for (let s = 1; s <= 4; s++) {
      const r = row - dr * s, c = col - dc * s;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player)
        line.push([r, c]);
      else break;
    }
    if (line.length >= 5) return line;
  }
  return null;
}

// --- Render ---

function drawBoard(ctx) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < BOARD_SIZE; i++) {
    const x = MARGIN + i * CELL;
    const y = MARGIN + i * CELL;
    ctx.beginPath(); ctx.moveTo(x, MARGIN); ctx.lineTo(x, MARGIN + (BOARD_SIZE-1)*CELL); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MARGIN, y); ctx.lineTo(MARGIN + (BOARD_SIZE-1)*CELL, y); ctx.stroke();
  }

  // Star points
  const stars = [[3,3],[3,11],[11,3],[11,11],[7,7],[3,7],[7,3],[11,7],[7,11]];
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  for (const [r, c] of stars) {
    ctx.beginPath();
    ctx.arc(MARGIN + c * CELL, MARGIN + r * CELL, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stones
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (state.board[r][c]) drawStone(ctx, r, c, state.board[r][c], false);
    }
  }

  // Highlight win line
  if (state.winLine.length) {
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const [fr, fc] = state.winLine[0];
    ctx.moveTo(MARGIN + fc * CELL, MARGIN + fr * CELL);
    for (const [r, c] of state.winLine) {
      ctx.lineTo(MARGIN + c * CELL, MARGIN + r * CELL);
    }
    ctx.stroke();
    for (const [r, c] of state.winLine) drawStone(ctx, r, c, state.board[r][c], true);
  }
}

function drawStone(ctx, row, col, player, highlight) {
  const x = MARGIN + col * CELL;
  const y = MARGIN + row * CELL;
  const r = CELL * 0.44;

  const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
  if (player === "black") {
    grad.addColorStop(0, highlight ? "#888" : "#555");
    grad.addColorStop(1, "#111");
  } else {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, highlight ? "#ffe066" : "#cccccc");
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = player === "black" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// --- UI ---

const app = document.getElementById("app");
app.innerHTML = `
  <h1>五目並べ</h1>
  <div class="info-bar">
    <div class="score-box">
      <span class="score-label">● 黒</span>
      <span class="score-value black" id="score-black">0</span>
    </div>
    <div class="divider"></div>
    <div class="turn-indicator">
      <span class="turn-label">手番</span>
      <div class="turn-stone black" id="turn-stone"></div>
    </div>
    <div class="divider"></div>
    <div class="score-box">
      <span class="score-label">○ 白</span>
      <span class="score-value white" id="score-white">0</span>
    </div>
  </div>
  <div class="board-container">
    <canvas id="board" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
  </div>
  <div class="status-message" id="status">黒の番です</div>
  <button class="btn-restart" id="btn-restart">もう一度</button>
`;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const turnStone = document.getElementById("turn-stone");
const scoreBlack = document.getElementById("score-black");
const scoreWhite = document.getElementById("score-white");

function updateUI() {
  scoreBlack.textContent = state.scores.black;
  scoreWhite.textContent = state.scores.white;

  if (state.winner) {
    const label = state.winner === "black" ? "黒" : "白";
    statusEl.textContent = `🎉 ${label}の勝ち！`;
    statusEl.className = "status-message winner";
    canvas.className = "game-over";
    turnStone.className = `turn-stone ${state.winner}`;
  } else {
    const label = state.current === "black" ? "黒" : "白";
    statusEl.textContent = `${label}の番です`;
    statusEl.className = "status-message";
    canvas.className = "";
    turnStone.className = `turn-stone ${state.current}`;
  }

  drawBoard(ctx);
}

canvas.addEventListener("click", (e) => {
  if (state.winner) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  const col = Math.round((mx - MARGIN) / CELL);
  const row = Math.round((my - MARGIN) / CELL);

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
  if (state.board[row][col]) return;

  state.board[row][col] = state.current;
  const line = checkWin(state.board, row, col, state.current);

  if (line) {
    state.winner = state.current;
    state.winLine = line.slice(0, 5);
    state.scores[state.current]++;
  } else {
    state.current = state.current === "black" ? "white" : "black";
  }

  updateUI();
});

document.getElementById("btn-restart").addEventListener("click", () => {
  initBoard();
  updateUI();
});

initBoard();
updateUI();

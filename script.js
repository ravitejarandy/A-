const mazeContainer = document.getElementById('maze-container');
const aiPlayerButton = document.getElementById('ai-player');
const timerElement = document.getElementById('timer');
const movesElement = document.getElementById('moves');
const winPopup = document.getElementById('win-popup');
const winMessage = document.getElementById('win-message');
const playAgainButton = document.getElementById('play-again');
const closeModalButton = document.getElementById('close-modal');
const resetGameButton = document.getElementById('reset-game');
const newMazeButton = document.getElementById('new-maze');
const startMenu = document.getElementById('start-menu');
const startGameButton = document.getElementById('start-game');
const gameContent = document.getElementById('game-content');
const fullscreenButton = document.getElementById('fullscreen-btn');
const closeGameButton = document.getElementById('close-game');

// Maze generation constants
const MAZE_SIZE = 20;
let maze = [];
let playerPosition = { x: 0, y: 0 };
let timer = 0;
let moves = 0;
let timerInterval;
let isSolving = false;
let isFirstMove = true;

class MazeGenerator {
  constructor(width = 20, height = 20) {
    this.width = width;
    this.height = height;
    this.maze = [];
    this.start = { x: 1, y: 1 };
    this.end = { x: width - 2, y: height - 2 };
  }

  // Initialize the maze grid with walls
  initializeMaze() {
    for (let y = 0; y < this.height; y++) {
      this.maze[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.maze[y][x] = 'W'; // Fill everything with walls initially
      }
    }
  }

  // Check if a cell is within bounds
  isInBounds(x, y) {
    return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
  }

  // Check if a cell is a wall (unvisited)
  isWall(x, y) {
    return this.maze[y][x] === 'W';
  }

  // Get all unvisited neighbors of a cell
  getUnvisitedNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -2 }, // Up
      { dx: 2, dy: 0 },  // Right
      { dx: 0, dy: 2 },  // Down
      { dx: -2, dy: 0 }  // Left
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (this.isInBounds(nx, ny) && this.isWall(nx, ny)) {
        neighbors.push({ x: nx, y: ny, dir });
      }
    }

    return neighbors;
  }

  // Carve a path between two cells
  carvePath(x1, y1, x2, y2) {
    const midX = Math.floor((x1 + x2) / 2);
    const midY = Math.floor((y1 + y2) / 2);
    this.maze[y1][x1] = 'O';
    this.maze[midY][midX] = 'O';
    this.maze[y2][x2] = 'O';
  }

  // Recursive backtracking algorithm
  generateMaze(x = this.start.x, y = this.start.y) {
    const stack = [{x, y}];
    this.maze[y][x] = 'O';

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current.x, current.y);

      if (neighbors.length === 0) {
        stack.pop();
        continue;
      }

      // Choose a random unvisited neighbor
      const randomIndex = Math.floor(Math.random() * neighbors.length);
      const next = neighbors[randomIndex];

      // Carve a path to the chosen neighbor
      this.carvePath(current.x, current.y, next.x, next.y);
      stack.push({ x: next.x, y: next.y });
    }
  }

  // Set start and end positions
  setStartAndEnd() {
    // Set start position
    this.maze[this.start.y][this.start.x] = 'S';
    
    // Set end position
    this.maze[this.end.y][this.end.x] = 'E';
    
    // Ensure there's a path to both start and end
    this.maze[this.start.y][this.start.x + 1] = 'O';
    this.maze[this.start.y + 1][this.start.x] = 'O';
    this.maze[this.end.y][this.end.x - 1] = 'O';
    this.maze[this.end.y - 1][this.end.x] = 'O';
  }

  // Generate the complete maze
  generate() {
    this.initializeMaze();
    this.generateMaze();
    this.setStartAndEnd();
    return this.maze;
  }
}

// Generate a random maze using the MazeGenerator class
function generateMaze() {
  const mazeGenerator = new MazeGenerator(MAZE_SIZE, MAZE_SIZE);
  return mazeGenerator.generate();
}

// Helper function to count adjacent paths
function countAdjacentPaths(maze, x, y) {
  let count = 0;
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dx, dy] of directions) {
    const newX = x + dx;
    const newY = y + dy;
    if (newX >= 0 && newX < MAZE_SIZE && newY >= 0 && newY < MAZE_SIZE 
        && maze[newY][newX] !== 'W') {
      count++;
    }
  }
  
  return count;
}

// Modify addCheckpoints to ensure better placement
function addCheckpoints(maze) {
  const numCheckpoints = 2; // Fixed number of checkpoints
  let checkpointsAdded = 0;
  const visited = new Set();
  
  // Find all valid path cells
  const validCells = [];
  for (let y = 2; y < MAZE_SIZE-2; y++) {
    for (let x = 2; x < MAZE_SIZE-2; x++) {
      if (maze[y][x] === 'O' && countAdjacentPaths(maze, x, y) >= 2) {
        validCells.push({x, y});
      }
    }
  }

  // Place checkpoints at roughly 1/3 and 2/3 of the path length
  validCells.sort((a, b) => {
    const distA = Math.abs(a.x - 2) + Math.abs(a.y - 2);
    const distB = Math.abs(b.x - 2) + Math.abs(b.y - 2);
    return distA - distB;
  });

  const third = Math.floor(validCells.length / 3);
  if (validCells[third]) {
    const cp1 = validCells[third];
    maze[cp1.y][cp1.x] = 'C';
  }
  if (validCells[third * 2]) {
    const cp2 = validCells[third * 2];
    maze[cp2.y][cp2.x] = 'C';
  }
}

// Update game info display
function updateGameInfo() {
  timerElement.textContent = `Time: ${timer}s`;
  movesElement.textContent = `Moves: ${moves}`;
}

// Reset game state
function resetGame() {
  clearInterval(timerInterval);
  timer = 0;
  moves = 0;
  isFirstMove = true;
  isSolving = false;
  
  // Clear all AI paths
  document.querySelectorAll('.ai-path').forEach(cell => {
    cell.classList.remove('ai-path');
  });
  
  updateGameInfo();
  
  // Find start position and reset player
  for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      if (maze[y][x] === 'S') {
        playerPosition = { x, y };
        updatePlayerPosition();
        return;
      }
    }
  }
}

// Load a new randomly generated maze
function loadMap() {
  try {
    maze = generateMaze();
    renderMaze();
    initializePlayer();
  } catch (error) {
    console.error('Error generating maze:', error);
    alert(`Error generating maze: ${error.message}. Please refresh the page.`);
  }
}

// Render the maze on the page
function renderMaze() {
  mazeContainer.innerHTML = '';
  
  // Create a grid container
  const gridContainer = document.createElement('div');
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = `repeat(${MAZE_SIZE}, 35px)`;
  gridContainer.style.gap = '0';
  gridContainer.style.fontSize = '0'; // Remove any text spacing
  gridContainer.style.lineHeight = '0'; // Remove any line height spacing
  gridContainer.style.border = '1px solid var(--border-color)';
  gridContainer.style.backgroundColor = 'var(--background-color)';
  
  for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.style.width = '35px';
      cell.style.height = '35px';
      cell.style.margin = '0';
      cell.style.padding = '0';
      cell.style.display = 'inline-block';
      
      switch (maze[y][x]) {
        case 'W':
          cell.classList.add('wall');
          break;
        case 'O':
          cell.classList.add('empty');
          break;
        case 'S':
          cell.classList.add('start');
          break;
        case 'E':
          cell.classList.add('goal');
          break;
        case 'C':
          cell.classList.add('checkpoint');
          break;
      }
      
      cell.dataset.x = x;
      cell.dataset.y = y;
      gridContainer.appendChild(cell);
    }
  }
  
  mazeContainer.appendChild(gridContainer);
}

// Initialize the player at the start position
function initializePlayer() {
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === 'S') {
        playerPosition = { x, y };
        updatePlayerPosition();
        return;
      }
    }
  }
}

// Check if a move is valid
function isValidMove(x, y) {
  return (
    x >= 0 &&
    x < maze[0].length &&
    y >= 0 &&
    y < maze.length &&
    maze[y][x] !== 'W'
  );
}

// Update player position on the grid
function updatePlayerPosition() {
  document.querySelectorAll('.player').forEach((el) => {
    el.classList.remove('player');
    el.textContent = ''; // Clear any previous player marker
  });
  const playerCell = document.querySelector(`[data-x='${playerPosition.x}'][data-y='${playerPosition.y}']`);
  if (playerCell) {
    playerCell.classList.add('player');
    playerCell.textContent = 'P'; // Add player marker
  }
}

// New function to generate a new maze
function newMaze() {
  clearInterval(timerInterval);
  timer = 0;
  moves = 0;
  isFirstMove = true;
  updateGameInfo();
  loadMap();
  renderMaze();
  initializePlayer();
}

// Event Listeners
playAgainButton.addEventListener('click', () => {
  winPopup.classList.add('hidden');
  resetGame();
});

closeModalButton.addEventListener('click', () => {
  winPopup.classList.add('hidden');
  resetGame();
});

resetGameButton.addEventListener('click', resetGame);
newMazeButton.addEventListener('click', newMaze);

// AI Player button
aiPlayerButton.addEventListener('click', () => {
  if (isSolving) return;
  if (isFirstMove) {
    startTimer();
    isFirstMove = false;
  }
  isSolving = true;
  solveMazeWithAStar();
});

// A* Algorithm Implementation
function solveMazeWithAStar() {
  const start = playerPosition;
  const goal = findGoal();
  
  if (!goal) {
    console.error('No goal found in maze');
    isSolving = false;
    return;
  }

  const path = aStar(start, goal);
  if (!path || path.length === 0) {
    console.error('No path found to goal');
    isSolving = false;
    return;
  }

  animatePath(path);
}

function aStar(start, goal) {
  if (!start || !goal) return [];
  
  const openSet = [start];
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  gScore.set(`${start.x},${start.y}`, 0);
  fScore.set(`${start.x},${start.y}`, heuristic(start, goal));

  while (openSet.length > 0) {
    let current = openSet.reduce((best, node) => {
      const bestScore = fScore.get(`${best.x},${best.y}`) || Infinity;
      const currentScore = fScore.get(`${node.x},${node.y}`) || Infinity;
      return currentScore < bestScore ? node : best;
    });

    if (current.x === goal.x && current.y === goal.y) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(openSet.indexOf(current), 1);
    closedSet.add(`${current.x},${current.y}`);

    const neighbors = getValidNeighbors(current);
    for (let neighbor of neighbors) {
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

      const tentativeGScore = (gScore.get(`${current.x},${current.y}`) || 0) + 1;

      if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
        openSet.push(neighbor);
      }
      
      if (tentativeGScore < (gScore.get(`${neighbor.x},${neighbor.y}`) || Infinity)) {
        cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
        gScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore);
        fScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore + heuristic(neighbor, goal));
      }
    }
  }
  return []; // No path found
}

// Get valid neighbors for pathfinding
function getValidNeighbors(node) {
  const neighbors = [];
  const directions = [
    { x: 0, y: -1 },  
    { x: 0, y: 1 },   
    { x: -1, y: 0 },  
    { x: 1, y: 0 }    
  ];

  for (let dir of directions) {
    const newX = node.x + dir.x;
    const newY = node.y + dir.y;
    if (isValidMove(newX, newY)) {
      neighbors.push({ x: newX, y: newY });
    }
  }
  return neighbors;
}

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom, current) {
  const path = [current];
  while (cameFrom.has(`${current.x},${current.y}`)) {
    current = cameFrom.get(`${current.x},${current.y}`);
    path.unshift(current);
  }
  return path;
}

function findGoal() {
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === 'G' || maze[y][x] === 'E') {
        return { x, y };
      }
    }
  }
  console.error('No goal (G/E) found in maze structure:', maze);
  return null;
}

// Animate the AI player solving the maze
async function animatePath(path) {
  let aiMoves = 0;
  
  for (let i = 0; i < path.length; i++) {
    const cell = document.querySelector(`[data-x='${path[i].x}'][data-y='${path[i].y}']`);
    if (cell) {
      cell.classList.add('ai-path');
    }
    
    playerPosition = path[i];
    updatePlayerPosition();
    aiMoves++;
    moves = aiMoves;
    updateGameInfo();
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  clearInterval(timerInterval);
  isSolving = false;
}

// Handle player movement
document.addEventListener('keydown', (e) => {
  if (isSolving) return;
  
  let { x, y } = playerPosition;
  let newX = x;
  let newY = y;
  
  switch (e.key) {
    case 'ArrowUp':
      newY = y - 1;
      break;
    case 'ArrowDown':
      newY = y + 1;
      break;
    case 'ArrowLeft':
      newX = x - 1;
      break;
    case 'ArrowRight':
      newX = x + 1;
      break;
    default:
      return;
  }

  if (isValidMove(newX, newY)) {
    if (isFirstMove) {
      startTimer();
      isFirstMove = false;
    }
    playerPosition = { x: newX, y: newY };
    moves++;
    updateGameInfo();
    updatePlayerPosition();
    checkWin();
  }
});

// Modify checkWin to show optimal path length
function checkWin() {
  const goalCell = document.querySelector('.goal');
  if (!isSolving && goalCell && goalCell.classList.contains('player')) {
    clearInterval(timerInterval);
    
    const goal = findGoal();
    const startPos = findStart();
    const optimalPath = aStar(startPos, goal);
    const optimalMoves = optimalPath ? optimalPath.length - 1 : 0;
    
    winMessage.innerHTML = `
      <h2>You Win!</h2>
      <div class="win-stats">
        <div class="win-stat-line">Time: ${timer}s</div>
        <div class="win-stat-line">Your Moves: ${moves}</div>
        <div class="win-stat-line">Shortest Path: ${optimalMoves} moves</div>
      </div>
    `;
    winPopup.classList.remove('hidden');
  }
}

// Helper function to find start position
function findStart() {
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === 'S') {
        return { x, y };
      }
    }
  }
  return null;
}

// Start menu functionality
startGameButton.addEventListener('click', () => {
  startMenu.classList.add('hidden');
  gameContent.classList.remove('hidden');
  toggleFullscreen();
  newMaze();
});

// Add ESC key handler for fullscreen
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.fullscreenElement) {
    document.exitFullscreen();
  }
});

// Initialize the game
loadMap();

// Start timers
function startTimer() {
  timer = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    updateGameInfo();
  }, 1000);
}

// Fullscreen functionality
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Update fullscreen button text based on state
function updateFullscreenButton() {
  fullscreenButton.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
}

// Add fullscreen change event listener
document.addEventListener('fullscreenchange', updateFullscreenButton);

// Fullscreen button click handler
fullscreenButton.addEventListener('click', toggleFullscreen);

// Close game button handler
closeGameButton.addEventListener('click', () => window.close());

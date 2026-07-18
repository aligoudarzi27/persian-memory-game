import { persianWords, themes } from './words.js';

class MemoryGame {
  constructor() {
    // Add audio elements
    this.successSound = new Audio('/music.mp3');
    this.wrongSound = new Audio('/wrong.mp3');
    this.tashvighSound = new Audio('/tashvigh.mp3');
    this.backgroundMusic = new Audio('/music.mp3');
    this.backgroundMusic.loop = true;

    this.gameBoard = document.getElementById('game-board');
    this.timerDisplay = document.querySelector('#timer span');
    this.scoreDisplay = document.querySelector('#score span');
    this.startButton = document.getElementById('start');
    this.restartButton = document.getElementById('restart');
    this.customizeButton = document.getElementById('customize');
    this.guideButton = document.getElementById('guide');
    this.modal = document.getElementById('customModal');
    this.guideModal = document.getElementById('guideModal');
    this.saveCustomWordsButton = document.getElementById('saveCustomWords');
    this.closeModalButton = document.getElementById('closeModal');
    this.closeGuideButton = document.getElementById('closeGuide');
    this.customWordsTextarea = document.getElementById('customWords');
    this.cardCountSelect = document.getElementById('cardCount');
    this.customTimerSelect = document.getElementById('customTimer');
    this.increaseSizeButton = document.getElementById('increaseSize');
    this.decreaseSizeButton = document.getElementById('decreaseSize');
    this.increaseFontSizeButton = document.getElementById('increaseFontSize');
    this.decreaseFontSizeButton = document.getElementById('decreaseFontSize');
    
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.score = 0;
    this.timeLeft = parseInt(this.customTimerSelect.value); // Default timer value
    this.timer = null;
    this.usedWords = new Set();
    this.customWords = [];
    this.gameStarted = false;
    this.cardCount = 16; // Default card count
    
    this.difficultyLevels = {
      easy: { 
        words: persianWords.easy,
        description: 'کلمات ساده روزمره'
      },
      medium: { 
        words: persianWords.medium,
        description: 'کلمات متوسط'
      },
      hard: { 
        words: persianWords.hard,
        description: 'کلمات پیشرفته'
      }
    };
    
    this.soundToggle = document.getElementById('soundToggle');
    this.homeButton = document.getElementById('home');
    this.soundOn = true;
    
    // Add sound elements to array for easier management
    this.soundElements = [
      this.successSound,
      this.wrongSound,
      this.tashvighSound,
      this.backgroundMusic
    ];
    
    this.gameSizeScale = 1;
    this.fontSizeScale = 1;
    
    // Add results tracking
    this.currentPlayer = this.loadCurrentPlayer();
    this.results = this.loadResults();
    this.showResultsButton = document.getElementById('showResults');
    this.resultsModal = document.getElementById('resultsModal');
    this.playerNameInput = document.getElementById('playerName');
    this.saveProfileButton = document.getElementById('saveProfile');
    this.clearResultsButton = document.getElementById('clearResults');
    this.closeResultsButton = document.getElementById('closeResults');
    
    // Initialize player name if exists
    if (this.currentPlayer) {
      this.playerNameInput.value = this.currentPlayer;
    }

    this.setupInitialState();
    this.bindEvents();
  }

  setupInitialState() {
    this.matchedPairs = 0;
    this.score = 0;
    this.timeLeft = parseInt(this.customTimerSelect.value); // Use selected timer value
    this.flippedCards = [];
    this.updateScore();
    this.updateTimer();
    this.gameBoard.innerHTML = '';
    this.startButton.style.display = 'block';
    this.restartButton.style.display = 'none';
    this.customizeButton.style.display = 'block';
    this.guideButton.style.display = 'block';
    
    // Update game board class based on card count
    this.gameBoard.className = `cards-${this.cardCount}`;
  }

  initGame() {
    this.gameStarted = true;
    this.startButton.style.display = 'none';
    this.customizeButton.style.display = 'none';
    this.guideButton.style.display = 'none';
    
    // Start background music
    this.backgroundMusic.play();
    
    // Get random words based on selected card count
    const pairCount = this.cardCount / 2;
    const gameWords = this.getRandomWords(pairCount);
    const pairs = [...gameWords, ...gameWords];
    this.cards = this.shuffle(pairs);

    // Create cards
    this.cards.forEach((word, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.index = index;
      card.dataset.word = word;
      card.innerHTML = '?';
      this.gameBoard.appendChild(card);
    });

    // Start timer
    this.startTimer();
  }

  getRandomWords(count) {
    let wordPool = this.customWords.length > 0 ? this.customWords : persianWords.easy;
    
    // If we don't have enough words, concatenate the arrays from different difficulties
    if (wordPool.length < count) {
      wordPool = [
        ...persianWords.easy,
        ...persianWords.medium,
        ...persianWords.hard
      ];
    }
    
    let availableWords = wordPool.filter(word => !this.usedWords.has(word));
    
    if (availableWords.length < count) {
      this.usedWords.clear();
      availableWords = [...wordPool];
    }
    
    const shuffled = this.shuffle([...availableWords]);
    const selectedWords = shuffled.slice(0, count);
    
    selectedWords.forEach(word => this.usedWords.add(word));
    
    return selectedWords;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  flipCard(card) {
    if (
      this.flippedCards.length >= 2 ||
      card.classList.contains('matched') ||
      card.classList.contains('flipped')
    ) {
      return;
    }

    card.classList.add('flipped');
    card.innerHTML = card.dataset.word;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;
    const match = card1.dataset.word === card2.dataset.word;

    if (match) {
      card1.classList.add('matched');
      card2.classList.add('matched');
      this.matchedPairs++;
      this.score += 10;
      this.updateScore();
      this.tashvighSound.play();
      
      if (this.matchedPairs === this.cards.length / 2) {
        this.endGame(true);
      }
    } else {
      this.score = Math.max(0, this.score - 1);
      this.updateScore();
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.innerHTML = '?';
        card2.innerHTML = '?';
      }, 1000);
    }

    this.flippedCards = [];
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      
      if (this.timeLeft <= 0) {
        this.endGame(false);
      }
    }, 1000);
  }

  endGame(won) {
    clearInterval(this.timer);
    this.gameStarted = false;
    this.restartButton.style.display = 'block';
    this.customizeButton.style.display = 'block';
    this.guideButton.style.display = 'block';
    
    // Stop background music
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
    
    if (won) {
      this.successSound.play();
      alert('آفرین! شما برنده شدید!');
      // Save the result when game is won
      this.saveResult(this.timeLeft, this.score);
    } else {
      this.wrongSound.play();
      alert('وقت تمام شد!');
    }
  }

  updateScore() {
    this.scoreDisplay.textContent = this.score;
  }

  updateTimer() {
    this.timerDisplay.textContent = this.timeLeft;
  }

  loadCurrentPlayer() {
    return localStorage.getItem('currentPlayer');
  }

  loadResults() {
    const results = localStorage.getItem('gameResults');
    return results ? JSON.parse(results) : {};
  }

  saveResult(timeLeft, score) {
    if (!this.currentPlayer) return;
    
    if (!this.results[this.currentPlayer]) {
      this.results[this.currentPlayer] = [];
    }

    const result = {
      date: new Date().toLocaleDateString('fa-IR'),
      timeLeft: timeLeft,
      score: score,
      cardCount: this.cardCount
    };

    this.results[this.currentPlayer].push(result);
    localStorage.setItem('gameResults', JSON.stringify(this.results));
    this.updateResultsTable();
  }

  updateResultsTable() {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';

    if (this.currentPlayer && this.results[this.currentPlayer]) {
      this.results[this.currentPlayer].forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${result.date}</td>
          <td>${result.timeLeft}</td>
          <td>${result.score}</td>
          <td>${result.cardCount}</td>
        `;
        tbody.appendChild(row);
      });
    }
  }

  bindEvents() {
    this.startButton.addEventListener('click', () => {
      this.initGame();
    });

    this.gameBoard.addEventListener('click', (e) => {
      if (e.target.classList.contains('card') && this.gameStarted) {
        this.flipCard(e.target);
      }
    });

    this.restartButton.addEventListener('click', () => {
      this.setupInitialState();
    });

    this.customizeButton.addEventListener('click', () => {
      this.modal.style.display = 'block';
      this.customWordsTextarea.value = this.customWords.join('\n');
    });

    const easyModeBtn = document.getElementById('easyMode');
    const mediumModeBtn = document.getElementById('mediumMode');
    const hardModeBtn = document.getElementById('hardMode');

    easyModeBtn.addEventListener('click', async () => {
      const aiWords = await this.generateAIWords('easy');
      this.customWordsTextarea.value = aiWords.join('\n');
    });

    mediumModeBtn.addEventListener('click', async () => {
      const aiWords = await this.generateAIWords('medium');
      this.customWordsTextarea.value = aiWords.join('\n');
    });

    hardModeBtn.addEventListener('click', async () => {
      const aiWords = await this.generateAIWords('hard');
      this.customWordsTextarea.value = aiWords.join('\n');
    });

    this.saveCustomWordsButton.addEventListener('click', () => {
      const words = this.customWordsTextarea.value
        .split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      const requiredWords = this.cardCount / 2;
      if (words.length < requiredWords) {
        alert(`لطفاً حداقل ${requiredWords} کلمه وارد کنید`);
        return;
      }

      this.customWords = words;
      this.usedWords.clear();
      this.timeLeft = parseInt(this.customTimerSelect.value); // Update timer when saving
      this.modal.style.display = 'none';
      this.setupInitialState();
    });

    this.closeModalButton.addEventListener('click', () => {
      this.modal.style.display = 'none';
    });

    this.cardCountSelect.addEventListener('change', (e) => {
      this.cardCount = parseInt(e.target.value);
      this.setupInitialState();
    });

    this.customTimerSelect.addEventListener('change', (e) => {
      this.timeLeft = parseInt(e.target.value);
      this.updateTimer();
    });

    this.saveCustomWordsButton.addEventListener('click', () => {
      const words = this.customWordsTextarea.value
        .split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      const requiredWords = this.cardCount / 2;
      if (words.length < requiredWords) {
        alert(`لطفاً حداقل ${requiredWords} کلمه وارد کنید`);
        return;
      }

      this.customWords = words;
      this.usedWords.clear();
      this.timeLeft = parseInt(this.customTimerSelect.value); // Update timer when saving
      this.modal.style.display = 'none';
      this.setupInitialState();
    });

    this.soundToggle.addEventListener('click', () => {
      this.soundOn = !this.soundOn;
      this.toggleSound();
    });

    this.homeButton.addEventListener('click', () => {
      this.goHome();
    });

    this.guideButton.addEventListener('click', () => {
      this.guideModal.style.display = 'block';
    });

    this.closeGuideButton.addEventListener('click', () => {
      this.guideModal.style.display = 'none';
    });

    const guideTabs = document.querySelectorAll('.guide-tab');
    guideTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        // Remove active class from all tabs and contents
        document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to current tab and content
        tab.classList.add('active');
        document.getElementById(`${tabId}Content`).classList.add('active');
      });
    });

    this.increaseSizeButton.addEventListener('click', () => {
      this.changeGameSize(0.1);
    });

    this.decreaseSizeButton.addEventListener('click', () => {
      this.changeGameSize(-0.1);
    });

    this.increaseFontSizeButton.addEventListener('click', () => {
      this.changeFontSize(0.1);
    });

    this.decreaseFontSizeButton.addEventListener('click', () => {
      this.changeFontSize(-0.1);
    });

    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.modal.style.display = 'none';
      }
      if (e.target === this.guideModal) {
        this.guideModal.style.display = 'none';
      }
    });

    this.showResultsButton.addEventListener('click', () => {
      this.resultsModal.style.display = 'block';
      this.updateResultsTable();
    });

    this.saveProfileButton.addEventListener('click', () => {
      const name = this.playerNameInput.value.trim();
      if (name) {
        this.currentPlayer = name;
        localStorage.setItem('currentPlayer', name);
        this.updateResultsTable();
        alert('نام شما با موفقیت ذخیره شد');
      } else {
        alert('لطفا یک نام معتبر وارد کنید');
      }
    });

    this.clearResultsButton.addEventListener('click', () => {
      if (this.currentPlayer && confirm('آیا مطمئن هستید که می‌خواهید نتایج را پاک کنید؟')) {
        this.results[this.currentPlayer] = [];
        localStorage.setItem('gameResults', JSON.stringify(this.results));
        this.updateResultsTable();
      }
    });

    this.closeResultsButton.addEventListener('click', () => {
      this.resultsModal.style.display = 'none';
    });

    // Add click outside modal to close
    window.addEventListener('click', (e) => {
      if (e.target === this.resultsModal) {
        this.resultsModal.style.display = 'none';
      }
    });
  }

  toggleSound() {
    const soundOnIcon = this.soundToggle.querySelector('.sound-on');
    const soundOffIcon = this.soundToggle.querySelector('.sound-off');
    
    if (this.soundOn) {
      soundOnIcon.style.display = 'block';
      soundOffIcon.style.display = 'none';
      this.soundElements.forEach(sound => {
        sound.muted = false;
      });
      if (this.gameStarted) {
        this.backgroundMusic.play();
      }
    } else {
      soundOnIcon.style.display = 'none';
      soundOffIcon.style.display = 'block';
      this.soundElements.forEach(sound => {
        sound.muted = true;
        if (sound === this.backgroundMusic) {
          sound.pause();
        }
      });
    }
  }

  goHome() {
    // Clear any ongoing game
    clearInterval(this.timer);
    
    // Stop all sounds
    this.soundElements.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    
    // Reset game state
    this.gameStarted = false;
    this.setupInitialState();
    
    // Clear the game board
    this.gameBoard.innerHTML = '';
    
    // Show/hide appropriate buttons
    this.startButton.style.display = 'block';
    this.restartButton.style.display = 'none';
    this.customizeButton.style.display = 'block';
    this.guideButton.style.display = 'block';
  }

  async generateAIWords(difficulty = 'medium') {
    const wordPool = this.difficultyLevels[difficulty].words;
    const pairCount = this.cardCount / 2; // Use cardCount to determine number of pairs needed
    
    // Select words ensuring theme variety
    let selectedWords = [];
    const themeKeys = Object.keys(themes);
    
    // Calculate how many words we should try to get from each theme
    const wordsPerTheme = Math.ceil(pairCount / themeKeys.length);
    
    // Try to pick words from each theme
    for (let theme of themeKeys) {
      if (selectedWords.length >= pairCount) break;
      
      const themeWords = themes[theme].filter(word => wordPool.includes(word));
      for (let i = 0; i < wordsPerTheme && themeWords.length > 0; i++) {
        if (selectedWords.length >= pairCount) break;
        
        const randomIndex = Math.floor(Math.random() * themeWords.length);
        const word = themeWords.splice(randomIndex, 1)[0];
        if (!selectedWords.includes(word)) {
          selectedWords.push(word);
        }
      }
    }
    
    // Fill remaining slots with random words from the difficulty pool
    const remainingWords = wordPool.filter(word => !selectedWords.includes(word));
    while (selectedWords.length < pairCount && remainingWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingWords.length);
      selectedWords.push(remainingWords.splice(randomIndex, 1)[0]);
    }
    
    // If we still don't have enough words, reuse some words from the pool
    while (selectedWords.length < pairCount) {
      const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];
      if (!selectedWords.includes(randomWord)) {
        selectedWords.push(randomWord);
      }
    }
    
    return selectedWords;
  }

  changeGameSize(delta) {
    this.gameSizeScale = Math.max(0.6, Math.min(1.5, this.gameSizeScale + delta));
  
    // Update game board size
    this.gameBoard.style.transform = `scale(${this.gameSizeScale})`;
    this.gameBoard.style.transformOrigin = 'center center';
  
    // Add some margin to compensate for scaling
    const marginValue = 100 * (1 - this.gameSizeScale);
    this.gameBoard.style.margin = marginValue > 0 ? `${marginValue}px auto` : '0 auto';
  }

  changeFontSize(delta) {
    // Allow reduction down to 0.2 of original size (1/5th)
    this.fontSizeScale = Math.max(0.2, Math.min(1.5, this.fontSizeScale + delta));
    
    // Calculate current reduction count (starting from 1.5 down to 0.2)
    // Each step is roughly 0.087 (1.3/15) to get 15 total decrements
    
    document.documentElement.style.fontSize = `${this.fontSizeScale}em`;
    
    // Update card font size
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.style.fontSize = `${1.5 * this.fontSizeScale}em`;
    });

    // Disable decrease button if we've reached minimum size
    if (this.fontSizeScale <= 0.2) {
      document.getElementById('decreaseFontSize').disabled = true;
    } else {
      document.getElementById('decreaseFontSize').disabled = false;
    }

    // Re-enable increase button when decreasing
    document.getElementById('increaseFontSize').disabled = false;
  }

  updateDifficultyDescription(difficulty) {
    const description = document.getElementById('difficultyDescription');
    if (description) {
      description.textContent = this.difficultyLevels[difficulty].description;
    }
  }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new MemoryGame();
});
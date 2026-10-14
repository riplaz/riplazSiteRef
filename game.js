// Небольшая игра на визуальную память. Она не прогнозирует рынок и не использует котировки.
function initCandleMemoryGame() {
  const grid = document.getElementById('memoryGrid');
  const startButton = document.getElementById('gameStart');
  const movesOutput = document.querySelector('[data-game-moves]');
  const pairsOutput = document.querySelector('[data-game-pairs]');
  const messageOutput = document.querySelector('[data-game-message]');
  if (!grid || !startButton || !movesOutput || !pairsOutput || !messageOutput) return;

  const patternNames = ['фиолетовая свеча', 'розовая свеча', 'свеча с длинной тенью', 'короткая свеча', 'высокая свеча', 'свеча с узким телом'];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = true;
  let moves = 0;
  let pairs = 0;
  let mismatchTimer = null;

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function setStats() {
    movesOutput.textContent = String(moves).padStart(2, '0');
    pairsOutput.textContent = String(pairs).padStart(2, '0');
  }

  function patternMarkup(pattern) {
    return `<span class="memory-candle memory-candle--${pattern}" aria-hidden="true"><i class="memory-candle__wick"></i><i class="memory-candle__body"></i></span>`;
  }

  function flipBack(card) {
    card.classList.remove('is-flipped');
    card.setAttribute('aria-label', 'Скрытая свеча');
  }

  function handleCardClick(event) {
    const card = event.currentTarget;
    if (lockBoard || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;

    card.classList.add('is-flipped');
    card.setAttribute('aria-label', `Открыта: ${patternNames[Number(card.dataset.pattern)]}`);

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    moves++;
    setStats();
    lockBoard = true;

    if (firstCard.dataset.pattern === secondCard.dataset.pattern) {
      firstCard.classList.add('is-matched');
      secondCard.classList.add('is-matched');
      firstCard.disabled = true;
      secondCard.disabled = true;
      pairs++;
      setStats();
      messageOutput.textContent = pairs === 6 ? `Готово за ${moves} ${moves === 1 ? 'ход' : (moves < 5 ? 'хода' : 'ходов')} — хорошая память.` : 'Есть совпадение. Найди следующую пару.';
      resetTurn();
      if (pairs === 6) {
        startButton.innerHTML = 'Сыграть ещё <span class="btn__arrow" aria-hidden="true">↻</span>';
        startButton.classList.add('is-complete');
      }
    } else {
      messageOutput.textContent = 'Не совпали. Запомни рисунки и попробуй ещё.';
      mismatchTimer = window.setTimeout(() => {
        flipBack(firstCard);
        flipBack(secondCard);
        resetTurn();
      }, 720);
    }
  }

  function resetTurn() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
  }

  function startGame() {
    window.clearTimeout(mismatchTimer);
    grid.replaceChildren();
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    moves = 0;
    pairs = 0;
    setStats();
    startButton.innerHTML = 'Перезапустить <span class="btn__arrow" aria-hidden="true">↻</span>';
    startButton.classList.remove('is-complete');
    messageOutput.textContent = 'Раунд начался. Найди шесть одинаковых пар.';

    const deck = shuffle([...Array(6).keys(), ...Array(6).keys()]);
    deck.forEach((pattern, index) => {
      const card = document.createElement('button');
      card.className = 'memory-card';
      card.type = 'button';
      card.dataset.pattern = String(pattern);
      card.setAttribute('aria-label', `Скрытая свеча ${index + 1}`);
      card.innerHTML = `
        <span class="memory-card__inner">
          <span class="memory-card__back" aria-hidden="true"><span class="memory-card__back-mark">S<span>·</span></span></span>
          <span class="memory-card__front">${patternMarkup(pattern)}</span>
        </span>`;
      card.addEventListener('click', handleCardClick);
      grid.append(card);
    });
  }

  startButton.addEventListener('click', startGame);
}

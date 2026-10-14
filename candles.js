// Декоративный график со случайными свечами. Это не реальные котировки.
function createCandleChart(canvas) {
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRAMES_PER_CANDLE = 78;
  const PRICE_SCALE = 680;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let candleWidth = 16;
  let candles = [];
  let minPrice = 0;
  let maxPrice = 1;
  let slide = 0;
  let trend = 0;
  let impulse = 0;
  let mouseX = 0.5;
  let lastTime = 0;
  let tabVisible = !document.hidden;

  const randomStep = () => Math.random() - 0.5;
  const formatPrice = value => Math.round(value * PRICE_SCALE).toLocaleString('ru-RU');
  const newCandle = open => ({ open, high: open, low: open, close: open, age: 0 });

  function addTick(candle, change) {
    candle.close += change;
    candle.high = Math.max(candle.high, candle.close);
    candle.low = Math.min(candle.low, candle.close);
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.round(window.innerWidth * dpr);
    height = Math.round(window.innerHeight * dpr);
    canvas.width = width;
    canvas.height = height;
    candleWidth = Math.max(16, window.innerWidth / 34) * dpr;

    const candleCount = Math.ceil(width / candleWidth) + 2;
    candles = [];
    let price = 100;

    for (let i = 0; i < candleCount; i++) {
      const candle = newCandle(price);
      for (let tick = 0; tick < 12; tick++) addTick(candle, randomStep() * 2.4 + 0.1);
      price = candle.close;
      candles.push(candle);
    }

    minPrice = Math.min(...candles.map(c => c.low));
    maxPrice = Math.max(...candles.map(c => c.high));
  }

  function priceToY(price) {
    const range = (maxPrice - minPrice) || 1;
    return height * 0.9 - ((price - minPrice) / range) * height * 0.6;
  }

  function candleX(index) {
    const parallax = (mouseX - 0.5) * -24 * dpr;
    return width - (candles.length - index - 0.5) * candleWidth + slide + parallax;
  }

  function drawGrid() {
    ctx.lineWidth = dpr;
    ctx.font = `${11 * dpr}px Onest, sans-serif`;
    for (let i = 0; i <= 5; i++) {
      const y = height * 0.9 - (i * height * 0.6) / 5;
      ctx.strokeStyle = 'rgba(197, 139, 255, 0.08)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      ctx.fillStyle = 'rgba(197, 139, 255, 0.34)';
      ctx.fillText(formatPrice(minPrice + ((maxPrice - minPrice) * i) / 5), 8 * dpr, y - 5 * dpr);
    }
  }

  function drawCandles() {
    candles.forEach((candle, i) => {
      const x = candleX(i);
      const isUp = candle.close >= candle.open;
      const isLast = i === candles.length - 1;
      const nearCursor = Math.max(0, 1 - Math.abs(x / width - mouseX) * 5);
      const baseAlpha = isUp ? 0.30 : 0.35;
      const alpha = baseAlpha + nearCursor * 0.42 + (isLast ? 0.24 : 0);
      const color = isUp ? `rgba(87, 223, 196, ${alpha})` : `rgba(255, 46, 147, ${alpha})`;

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.shadowColor = isUp ? '#57dfc4' : '#ff2e93';
      ctx.shadowBlur = (nearCursor * 16 + (isLast ? 14 : 2)) * dpr;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.moveTo(x, priceToY(candle.high)); ctx.lineTo(x, priceToY(candle.low)); ctx.stroke();

      const bodyTop = priceToY(Math.max(candle.open, candle.close));
      const bodyHeight = Math.max(2 * dpr, Math.abs(priceToY(candle.open) - priceToY(candle.close)));
      ctx.fillRect(x - candleWidth * 0.3, bodyTop, candleWidth * 0.6, bodyHeight);
    });
    ctx.shadowBlur = 0;
  }

  function drawAverageLine() {
    const period = 8;
    ctx.strokeStyle = 'rgba(197, 139, 255, 0.48)';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    candles.forEach((candle, i) => {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - period + 1); j <= i; j++) { sum += candles[j].close; count++; }
      const y = priceToY(sum / count);
      if (i === 0) ctx.moveTo(candleX(i), y); else ctx.lineTo(candleX(i), y);
    });
    ctx.stroke();
  }

  function drawLastPrice() {
    const last = candles[candles.length - 1];
    const y = priceToY(last.close);
    const color = last.close >= last.open ? '#57dfc4' : '#ff2e93';
    ctx.setLineDash([6 * dpr, 6 * dpr]);
    ctx.globalAlpha = 0.44;
    ctx.lineWidth = dpr;
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(width - 74 * dpr, y - 11 * dpr, 74 * dpr, 22 * dpr);
    ctx.fillStyle = '#07050d';
    ctx.font = `700 ${12 * dpr}px Onest, sans-serif`;
    ctx.fillText(formatPrice(last.close), width - 68 * dpr, y + 4 * dpr);
  }

  function draw() {
    const lows = candles.map(c => c.low);
    const highs = candles.map(c => c.high);
    minPrice += (Math.min(...lows) - minPrice) * 0.06;
    maxPrice += (Math.max(...highs) - maxPrice) * 0.06;
    ctx.clearRect(0, 0, width, height);
    drawGrid(); drawCandles(); drawAverageLine(); drawLastPrice();
  }

  function loop(time) {
    requestAnimationFrame(loop);
    const delta = Math.min((time - lastTime) / 16.7 || 1, 3);
    lastTime = time;
    if (!tabVisible) return;

    const last = candles[candles.length - 1];
    trend += randomStep() * 0.02 * delta;
    trend *= 0.995;
    impulse *= Math.pow(0.985, delta);
    addTick(last, (randomStep() * 0.8 + trend + impulse) * delta);
    last.age += delta;

    if (last.age > FRAMES_PER_CANDLE) {
      candles.push(newCandle(last.close));
      candles.shift();
      slide = candleWidth;
    }
    slide *= Math.pow(0.9, delta);
    draw();
  }

  window.addEventListener('pointermove', event => {
    if (window.innerWidth > 700) mouseX = event.clientX / window.innerWidth;
  }, { passive: true });

  window.addEventListener('resize', () => {
    const nextWidth = Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 2));
    if (nextWidth !== width) setup();
    else {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      height = Math.round(window.innerHeight * dpr);
      canvas.height = height;
    }
    if (reduceMotion) draw();
  });

  document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; });
  setup();
  if (reduceMotion) draw(); else requestAnimationFrame(loop);

  return {
    // direction: 1 — условный импульс вверх, -1 — вниз. Не является сигналом.
    kick(direction) { impulse = direction * 0.18; }
  };
}

/* ============================================================
   StockDoge ($STOCKDOGE) — interactions & animations
   ============================================================ */

// ---------- Sticky nav ----------
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Mobile burger ----------
const burger = document.getElementById("burger");
const links = document.querySelector(".nav__links");
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  links.classList.toggle("open");
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    burger.classList.remove("open");
    links.classList.remove("open");
  })
);

// ---------- Scroll reveal ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal, .phase").forEach((el) => revealObserver.observe(el));

// ---------- Animated stat counters ----------
const formatNum = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(0) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(0) + "M";
  return n.toLocaleString();
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      counterObserver.unobserve(el);
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const duration = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = formatNum(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll(".stat__num[data-count]").forEach((el) => counterObserver.observe(el));

// ---------- Copy CA ----------
const copyBtn = document.getElementById("copy-ca");
const toast = document.getElementById("toast");
copyBtn.addEventListener("click", async () => {
  const text = document.getElementById("ca-text").textContent.trim();
  try {
    await navigator.clipboard.writeText(text);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  } catch (_) {
    /* clipboard unavailable — no-op */
  }
});

// ---------- Candlestick chart background (hero) ----------
(() => {
  const canvas = document.getElementById("candles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W, H, dpr;
  const CANDLE_W = 14;
  const GAP = 10;
  let candles = [];
  let price = 0.5;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function nextCandle() {
    // upward drift because $STOCKDOGE only goes up
    const drift = 0.006;
    const vol = 0.055;
    const open = price;
    let close = open + drift + (Math.random() - 0.44) * vol;
    close = Math.max(0.08, Math.min(0.95, close));
    const high = Math.max(open, close) + Math.random() * 0.03;
    const low = Math.min(open, close) - Math.random() * 0.03;
    price = close;
    return { open, close, high, low };
  }

  function seed() {
    candles = [];
    price = 0.35 + Math.random() * 0.2;
    const count = Math.ceil(W / (CANDLE_W + GAP)) + 2;
    for (let i = 0; i < count; i++) candles.push(nextCandle());
  }

  let offset = 0;
  const SPEED = 0.35;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const usableH = H * 0.72;
    const topPad = H * 0.14;
    const y = (v) => topPad + (1 - v) * usableH;

    candles.forEach((c, i) => {
      const x = i * (CANDLE_W + GAP) - offset;
      if (x + CANDLE_W < 0 || x > W) return;
      const up = c.close >= c.open;
      ctx.strokeStyle = up ? "rgba(20, 40, 5, 0.5)" : "rgba(190, 60, 60, 0.45)";
      ctx.fillStyle = up ? "rgba(20, 40, 5, 0.38)" : "rgba(190, 60, 60, 0.33)";
      ctx.lineWidth = 2;

      // wick
      ctx.beginPath();
      ctx.moveTo(x + CANDLE_W / 2, y(c.high));
      ctx.lineTo(x + CANDLE_W / 2, y(c.low));
      ctx.stroke();

      // body
      const bodyTop = y(Math.max(c.open, c.close));
      const bodyH = Math.max(2, Math.abs(y(c.open) - y(c.close)));
      ctx.fillRect(x, bodyTop, CANDLE_W, bodyH);
    });
  }

  function loop() {
    offset += SPEED;
    if (offset >= CANDLE_W + GAP) {
      offset = 0;
      candles.shift();
      candles.push(nextCandle());
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  if (reduceMotion) draw();
  else loop();
})();

// ---------- Doge tilt on mouse (hero) ----------
(() => {
  const doge = document.getElementById("doge-img");
  const hero = document.querySelector(".hero");
  if (!doge || !hero || window.matchMedia("(hover: none)").matches) return;
  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    doge.style.transform = `rotateY(${dx * 10}deg) rotateX(${-dy * 8}deg)`;
  });
  hero.addEventListener("mouseleave", () => {
    doge.style.transform = "";
  });
})();

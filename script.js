// Keep the footer year current
document.getElementById('year').textContent = new Date().getFullYear();

// Give the header a solid background once the page is scrolled
const header = document.querySelector('.site-header');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Turn the services list into a looping marquee (skipped for visitors who prefer reduced motion)
const marquee = document.querySelector('.marquee');

if (marquee && !reducedMotion) {
  const track = marquee.querySelector('.services');
  const items = Array.from(track.children);

  // Three extra copies give four sets in total, matching the -25% shift in styles.css
  for (let copy = 0; copy < 3; copy++) {
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  marquee.classList.add('is-running');
}

// Purple fireflies that drift off the mouse cursor (mouse users only; touch screens have no cursor)
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (hasMouse && !reducedMotion) {
  const FIREFLY_SPACING = 16; // mouse travel, in pixels, between each new firefly (lower = more)
  const FIREFLY_LIFE = 1400; // how long a firefly glows, in milliseconds
  const FIREFLY_BURST = 12; // how many fly out when the mouse lands on a link or button
  const FIREFLY_MAX = 160; // upper limit on screen at once

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let fireflies = [];
  let drawing = false;
  let lastFrame = 0;
  let lastX = null;
  let lastY = null;
  let travelled = 0;
  let hoveredLink = null;

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const addFirefly = (x, y, speed) => {
    if (fireflies.length >= FIREFLY_MAX) fireflies.shift();
    const angle = Math.random() * Math.PI * 2;

    fireflies.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.15, // slight upward float
      size: 1 + Math.random() * 1.6,
      life: FIREFLY_LIFE * (0.6 + Math.random() * 0.8),
      born: performance.now(),
      blink: Math.random() * Math.PI * 2,
    });

    if (!drawing) {
      drawing = true;
      lastFrame = performance.now();
      requestAnimationFrame(drawFireflies);
    }
  };

  const drawGlow = (x, y, radius, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawFireflies = (now) => {
    const step = Math.min((now - lastFrame) / 16.7, 3);
    lastFrame = now;
    fireflies = fireflies.filter((fly) => now - fly.born < fly.life);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = 'lighter';

    fireflies.forEach((fly) => {
      const age = (now - fly.born) / fly.life;

      // Wander a little, like a real firefly, and slow down over time
      fly.vx = (fly.vx + (Math.random() - 0.5) * 0.08 * step) * 0.985;
      fly.vy = (fly.vy + (Math.random() - 0.5) * 0.08 * step) * 0.985;
      fly.x += fly.vx * step;
      fly.y += fly.vy * step;

      // Fade in and out over its life, with a soft blink on top
      const blink = 0.65 + 0.35 * Math.sin(fly.blink + now * 0.009);
      const alpha = Math.sin(age * Math.PI) * blink;

      drawGlow(fly.x, fly.y, fly.size * 5, `rgba(139, 61, 255, ${alpha * 0.14})`);
      drawGlow(fly.x, fly.y, fly.size * 2.4, `rgba(169, 112, 255, ${alpha * 0.4})`);
      drawGlow(fly.x, fly.y, fly.size, `rgba(226, 204, 255, ${alpha})`);
    });

    if (fireflies.length) {
      requestAnimationFrame(drawFireflies);
    } else {
      drawing = false;
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('mousemove', (event) => {
    if (lastX !== null) {
      travelled += Math.hypot(event.clientX - lastX, event.clientY - lastY);
    }
    lastX = event.clientX;
    lastY = event.clientY;

    if (travelled >= FIREFLY_SPACING) {
      travelled = 0;
      addFirefly(lastX, lastY, 0.2 + Math.random() * 0.4);
    }
  }, { passive: true });

  // A burst of fireflies when the mouse lands on a link or button
  document.addEventListener('mouseover', (event) => {
    const link = event.target.closest('a, button');
    if (link && link !== hoveredLink) {
      for (let i = 0; i < FIREFLY_BURST; i++) {
        addFirefly(event.clientX, event.clientY, 0.8 + Math.random() * 1.6);
      }
    }
    hoveredLink = link;
  });
}

// Custom cursor: a glowing dot in place of the arrow, which grows over links and buttons
if (hasMouse && !reducedMotion) {
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);

  const root = document.documentElement;
  root.classList.add('has-cursor');

  window.addEventListener('mousemove', (event) => {
    dot.style.translate = `${event.clientX}px ${event.clientY}px`;
    root.classList.add('cursor-visible');
  }, { passive: true });

  document.addEventListener('mouseover', (event) => {
    dot.classList.toggle('is-hover', Boolean(event.target.closest('a, button')));
  });

  window.addEventListener('mousedown', () => dot.classList.add('is-pressed'));
  window.addEventListener('mouseup', () => dot.classList.remove('is-pressed'));
  root.addEventListener('mouseleave', () => root.classList.remove('cursor-visible'));
}

// Fade sections in as they scroll into view
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

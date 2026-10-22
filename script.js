// Keep the footer year current
document.getElementById('year').textContent = new Date().getFullYear();

// Give the header a solid background once the page is scrolled
const header = document.querySelector('.site-header');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Purple bar along the top that fills as the page is scrolled
const progress = document.querySelector('.scroll-progress');
let progressQueued = false;

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const amount = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  progress.style.transform = `scaleX(${amount})`;
  progressQueued = false;
};

const queueProgress = () => {
  if (progressQueued) return;
  progressQueued = true;
  requestAnimationFrame(updateProgress);
};

if (progress) {
  updateProgress();
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Deep-space background: purple bokeh and dust that slowly swirl around the middle of the
// screen, and spin faster while the page is scrolled. Reduced motion gets one still frame.
const space = document.createElement('canvas');
space.className = 'space-bg';
space.setAttribute('aria-hidden', 'true');
document.body.prepend(space);

if (space.getContext) {
  const BOKEH_PER_MILLION_PX = 70; // soft glowing circles per million screen pixels (higher = more)
  const DUST_PER_MILLION_PX = 420; // tiny twinkling specks per million screen pixels
  const IDLE_SPIN = 0.00003; // slow turn while the page is still, in radians per millisecond
  const SCROLL_SPIN = 0.0003; // extra turn per pixel scrolled (higher = more swirl)

  const ctx = space.getContext('2d');
  let width = 0;
  let height = 0;
  let bokeh = [];
  let dust = [];
  let lastFrame = 0;
  let spin = 0; // eased scroll spin, so the swirl glides instead of jumping
  let idle = 0;

  // One pre-rendered glowing disc, scaled per particle, so each frame stays cheap
  const makeSprite = (core, edge) => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const s = sprite.getContext('2d');
    const gradient = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, core);
    gradient.addColorStop(0.45, edge);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    s.fillStyle = gradient;
    s.fillRect(0, 0, 64, 64);
    return sprite;
  };

  const sprites = [
    makeSprite('rgba(201, 166, 255, 1)', 'rgba(139, 61, 255, 0.55)'),
    makeSprite('rgba(226, 204, 255, 1)', 'rgba(169, 112, 255, 0.5)'),
    makeSprite('rgba(169, 112, 255, 1)', 'rgba(110, 40, 220, 0.5)'),
  ];
  const dustSprite = makeSprite('rgba(255, 255, 255, 1)', 'rgba(201, 166, 255, 0.6)');

  const random = (min, max) => min + Math.random() * (max - min);

  // Particles sit at a radius and angle around the screen centre. The field is a circle
  // as wide as the screen's diagonal, so rotating it never leaves an empty corner.
  const makeParticle = (maxRadius, size, alpha, sprite) => ({
    radius: Math.sqrt(Math.random()) * maxRadius,
    angle: Math.random() * Math.PI * 2,
    depth: random(0.35, 1), // nearer particles (closer to 1) swirl faster
    wobble: Math.random() * Math.PI * 2,
    twinkle: Math.random() * Math.PI * 2,
    size,
    alpha,
    sprite,
  });

  const populate = () => {
    const area = (width * height) / 1e6;
    const maxRadius = Math.hypot(width, height) / 2 + 40;

    bokeh = Array.from({ length: Math.round(area * BOKEH_PER_MILLION_PX) }, () =>
      makeParticle(maxRadius, random(3, 11), random(0.18, 0.5), sprites[Math.floor(Math.random() * sprites.length)])
    );
    dust = Array.from({ length: Math.round(area * DUST_PER_MILLION_PX) }, () =>
      makeParticle(maxRadius, random(0.8, 2.6), random(0.35, 1), dustSprite)
    );
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    space.width = width * ratio;
    space.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    populate();
  };

  const drawField = (particles, rotation, now, twinkleSpeed) => {
    const cx = width / 2;
    const cy = height / 2;

    particles.forEach((p) => {
      const angle = p.angle + rotation * p.depth;
      // A small in-and-out breathing on the radius, so the swirl isn't perfectly rigid
      const radius = p.radius + Math.sin(p.wobble + now * 0.0004) * 6 * p.depth;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (x < -20 || y < -20 || x > width + 20 || y > height + 20) return;

      const size = p.size * (0.6 + p.depth * 0.6);
      ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle + now * twinkleSpeed));
      ctx.drawImage(p.sprite, x - size * 2, y - size * 2, size * 4, size * 4);
    });
  };

  const draw = (time) => {
    const now = reducedMotion ? 0 : time;
    const elapsed = lastFrame ? Math.min(now - lastFrame, 50) : 0;
    lastFrame = now;

    idle += elapsed * IDLE_SPIN;
    const target = window.scrollY * SCROLL_SPIN;
    spin = reducedMotion ? target : spin + (target - spin) * Math.min(elapsed / 700, 1);

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    drawField(bokeh, idle + spin, now, 0.0008);
    drawField(dust, idle + spin, now, 0.003);
    ctx.globalAlpha = 1;

    if (!reducedMotion) requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (reducedMotion) draw(0);
  });

  if (reducedMotion) {
    draw(0);
  } else {
    requestAnimationFrame(draw);
  }
}

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
  const FIREFLY_SERVICE_BURST = 30; // how many flash out of a service when the mouse lands on it
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
  let hoveredService = null;

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

    // A flash of fireflies out of a service when the mouse lands on it
    const service = event.target.closest('.services li');
    if (service && service !== hoveredService) {
      const box = service.getBoundingClientRect();
      for (let i = 0; i < FIREFLY_SERVICE_BURST; i++) {
        addFirefly(
          box.left + Math.random() * box.width,
          box.top + Math.random() * box.height,
          1 + Math.random() * 2.2
        );
      }
    }
    hoveredService = service;
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

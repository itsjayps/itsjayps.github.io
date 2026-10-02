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

// Purple trail behind the mouse cursor (mouse users only; touch screens have no cursor)
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (hasMouse && !reducedMotion) {
  const TRAIL_LIFE = 450; // how long each part of the trail lasts, in milliseconds
  const TRAIL_WIDTH = 7; // thickness at the cursor, in pixels

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let points = [];
  let drawing = false;

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const drawTrail = (now) => {
    points = points.filter((point) => now - point.time < TRAIL_LIFE);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(139, 61, 255, 0.9)';
    ctx.shadowBlur = 16;

    for (let i = 1; i < points.length; i++) {
      const strength = 1 - (now - points[i].time) / TRAIL_LIFE;
      ctx.strokeStyle = `rgba(185, 140, 255, ${strength})`;
      ctx.lineWidth = TRAIL_WIDTH * strength + 0.5;
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }

    if (points.length) {
      requestAnimationFrame(drawTrail);
    } else {
      drawing = false;
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('mousemove', (event) => {
    points.push({ x: event.clientX, y: event.clientY, time: performance.now() });
    if (!drawing) {
      drawing = true;
      requestAnimationFrame(drawTrail);
    }
  }, { passive: true });
}

// Custom cursor: the dot sits on the mouse, the ring eases after it and grows over links and buttons
if (hasMouse && !reducedMotion) {
  const RING_EASE = 0.18; // how quickly the ring catches up (1 = instantly)

  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);

  const root = document.documentElement;
  root.classList.add('has-cursor');

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;
  let following = false;

  const followMouse = () => {
    ringX += (mouseX - ringX) * RING_EASE;
    ringY += (mouseY - ringY) * RING_EASE;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

    if (Math.abs(mouseX - ringX) > 0.1 || Math.abs(mouseY - ringY) > 0.1) {
      requestAnimationFrame(followMouse);
    } else {
      following = false;
    }
  };

  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

    // First move: start the ring on the mouse instead of flying in from the corner
    if (!root.classList.contains('cursor-visible')) {
      ringX = mouseX;
      ringY = mouseY;
      root.classList.add('cursor-visible');
    }

    if (!following) {
      following = true;
      requestAnimationFrame(followMouse);
    }
  }, { passive: true });

  document.addEventListener('mouseover', (event) => {
    const overLink = Boolean(event.target.closest('a, button'));
    dot.classList.toggle('is-hover', overLink);
    ring.classList.toggle('is-hover', overLink);
  });

  window.addEventListener('mousedown', () => ring.classList.add('is-pressed'));
  window.addEventListener('mouseup', () => ring.classList.remove('is-pressed'));
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

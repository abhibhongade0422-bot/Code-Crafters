// ═══════════════════════════════════════════════════
// PhantomWatt — 3D Animated Intro (Three.js)
// ═══════════════════════════════════════════════════

(function() {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  // ── Scene Setup ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  document.getElementById('intro-canvas-wrap').appendChild(renderer.domElement);

  // ── Glowing Energy Orb (center) ──
  const orbGeo = new THREE.SphereGeometry(0.6, 64, 64);
  const orbMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.35,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  scene.add(orb);

  // Orb glow layers
  for (let i = 1; i <= 3; i++) {
    const glowGeo = new THREE.SphereGeometry(0.6 + i * 0.25, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: i === 1 ? 0x00ff88 : i === 2 ? 0x00d4ff : 0x8844ff,
      transparent: true,
      opacity: 0.08 / i,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);
  }

  // ── Particle System (orbiting energy sparks) ──
  const PARTICLE_COUNT = 600;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const velocities = [];

  const palette = [
    [0, 1, 0.53],    // green
    [0, 0.83, 1],    // cyan
    [0.4, 0.8, 0.3], // lime
    [0.53, 0.27, 1], // purple
    [1, 0.85, 0],    // gold
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 3;
    const y = (Math.random() - 0.5) * 4;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];

    sizes[i] = Math.random() * 4 + 1;

    velocities.push({
      angle: angle,
      radius: radius,
      speed: (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
      ySpeed: (Math.random() - 0.5) * 0.01,
      y: y,
    });
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── Lightning bolts (energy streaks) ──
  const streakGroup = new THREE.Group();
  scene.add(streakGroup);

  function createStreak() {
    const points = [];
    const startAngle = Math.random() * Math.PI * 2;
    const startR = 1.2;
    let x = Math.cos(startAngle) * startR;
    let y = (Math.random() - 0.5) * 2;
    let z = Math.sin(startAngle) * startR;
    points.push(new THREE.Vector3(x, y, z));
    for (let i = 0; i < 5; i++) {
      x += (Math.random() - 0.5) * 0.4;
      y += (Math.random() - 0.5) * 0.4;
      z += (Math.random() - 0.5) * 0.4;
      points.push(new THREE.Vector3(x, y, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
      linewidth: 1,
    });
    const line = new THREE.Line(geo, mat);
    line.userData.life = 0;
    line.userData.maxLife = 30 + Math.random() * 20;
    return line;
  }

  // ── Ring pulse ──
  const ringGeo = new THREE.RingGeometry(0.8, 0.85, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  scene.add(ring);

  // ── Animation State ──
  let time = 0;
  let introComplete = false;
  let fadeOutStarted = false;
  const INTRO_DURATION = 4000;
  const startTime = Date.now();

  // ── Progress bar ──
  const progressFill = document.getElementById('intro-progress-fill');
  const introTitle = document.querySelector('.intro-title');
  const introSub = document.querySelector('.intro-subtitle');

  // ── Animate ──
  function animate() {
    if (introComplete) return;
    requestAnimationFrame(animate);
    time += 0.016;

    // Rotate particles
    const posArr = particleGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const v = velocities[i];
      v.angle += v.speed * 0.016;
      v.y += v.ySpeed;
      if (v.y > 2 || v.y < -2) v.ySpeed *= -1;
      posArr[i * 3] = Math.cos(v.angle) * v.radius;
      posArr[i * 3 + 1] = v.y;
      posArr[i * 3 + 2] = Math.sin(v.angle) * v.radius;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Pulse orb
    const pulse = 1 + Math.sin(time * 3) * 0.08;
    orb.scale.set(pulse, pulse, pulse);
    orbMat.opacity = 0.3 + Math.sin(time * 2) * 0.1;

    // Ring pulse outward
    const ringScale = 1 + (time % 2) * 0.8;
    ring.scale.set(ringScale, ringScale, 1);
    ringMat.opacity = Math.max(0, 0.4 - (time % 2) * 0.25);

    // Rotate camera slowly
    camera.position.x = Math.sin(time * 0.3) * 0.5;
    camera.position.y = Math.cos(time * 0.2) * 0.3;
    camera.lookAt(0, 0, 0);

    // Lightning streaks
    if (Math.random() < 0.05) {
      const streak = createStreak();
      streakGroup.add(streak);
    }
    streakGroup.children.forEach((s, i) => {
      s.userData.life++;
      s.material.opacity = Math.max(0, 0.6 - (s.userData.life / s.userData.maxLife) * 0.6);
      if (s.userData.life > s.userData.maxLife) {
        streakGroup.remove(s);
        s.geometry.dispose();
        s.material.dispose();
      }
    });

    renderer.render(scene, camera);

    // Progress
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / INTRO_DURATION, 1);
    if (progressFill) progressFill.style.width = (progress * 100) + '%';

    // Text reveal
    if (progress > 0.2 && introTitle) introTitle.classList.add('visible');
    if (progress > 0.5 && introSub) introSub.classList.add('visible');

    // Auto-dismiss
    if (progress >= 1 && !fadeOutStarted) {
      fadeOutStarted = true;
      dismissIntro();
    }
  }

  function dismissIntro() {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      introComplete = true;
      overlay.style.display = 'none';
      renderer.dispose();
      // Trigger landing animations
      document.body.classList.add('intro-done');
      initScrollAnimations();
    }, 800);
  }

  // Skip button
  const skipBtn = document.getElementById('intro-skip');
  if (skipBtn) skipBtn.addEventListener('click', () => {
    if (!fadeOutStarted) { fadeOutStarted = true; dismissIntro(); }
  });

  // Handle resize
  window.addEventListener('resize', () => {
    if (introComplete) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
})();

// ═══════ Scroll Animations ═══════
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  // Observe all animatable elements
  setTimeout(() => {
    document.querySelectorAll('.card, .dash-stat, .stat-pill, .dash-feature-card, .dev-card, .story-dev, .reminder-card, .cost-card, .equiv-card, .action-item, .bill-row, .insight-item').forEach(el => {
      el.classList.add('scroll-animate');
      observer.observe(el);
    });
  }, 100);

  // Re-observe on route changes
  const origHandleRoute = window.handleRoute;
  if (origHandleRoute) {
    // MutationObserver on #app to re-trigger animations
    const appEl = document.getElementById('app');
    if (appEl) {
      const mutObs = new MutationObserver(() => {
        setTimeout(() => {
          document.querySelectorAll('.card, .dash-stat, .stat-pill, .dash-feature-card, .dev-card, .story-dev, .reminder-card, .cost-card, .equiv-card, .action-item, .bill-row, .insight-item').forEach(el => {
            if (!el.classList.contains('animate-in')) {
              el.classList.add('scroll-animate');
              observer.observe(el);
            }
          });
        }, 50);
      });
      mutObs.observe(appEl, { childList: true, subtree: false });
    }
  }
}

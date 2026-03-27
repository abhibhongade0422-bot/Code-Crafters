// ═══════════════════════════════════════════════════
// PhantomWatt — Persistent 3D Elements (Three.js)
// Adds floating 3D backgrounds to Landing, Dashboard, Results pages
// ═══════════════════════════════════════════════════

const PhantomWatt3D = {
  scenes: {},
  active: null,

  // ── Initialize Landing Page 3D Particles ──
  initLandingParticles() {
    const container = document.getElementById('landing-3d-canvas');
    if (!container || this.scenes.landing) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Floating energy particles
    const PARTICLE_COUNT = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];

    const palette = [
      [0.18, 0.48, 0.31],  // forest green
      [0.23, 0.62, 0.4],   // emerald
      [0.79, 0.48, 0.16],  // amber
      [0.24, 0.49, 0.78],  // blue
      [0.35, 0.75, 0.45],  // light green
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];

      velocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003 + 0.002,
        z: (Math.random() - 0.5) * 0.002
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Floating wireframe icosahedrons
    const shapes = [];
    for (let i = 0; i < 5; i++) {
      const size = 0.3 + Math.random() * 0.5;
      const icoGeo = new THREE.IcosahedronGeometry(size, 0);
      const icoMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x2d7a4f : 0xc97b2a,
        wireframe: true,
        transparent: true,
        opacity: 0.08 + Math.random() * 0.06
      });
      const mesh = new THREE.Mesh(icoGeo, icoMat);
      mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 2);
      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.005,
        rotY: (Math.random() - 0.5) * 0.005,
        floatSpeed: 0.001 + Math.random() * 0.002,
        floatOffset: Math.random() * Math.PI * 2
      };
      scene.add(mesh);
      shapes.push(mesh);
    }

    // Floating rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(0.5 + Math.random() * 0.5, 0.02, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x2d7a4f,
        transparent: true,
        opacity: 0.06
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5, -3 + Math.random() * 2);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = { rotX: (Math.random() - 0.5) * 0.003, rotY: (Math.random() - 0.5) * 0.003 };
      scene.add(ring);
      shapes.push(ring);
    }

    let time = 0;
    const animate = () => {
      if (!this.scenes.landing) return;
      requestAnimationFrame(animate);
      time += 0.016;

      // Animate particles
      const posArr = geo.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posArr[i * 3] += velocities[i].x;
        posArr[i * 3 + 1] += velocities[i].y;
        posArr[i * 3 + 2] += velocities[i].z;
        // Wrap around
        if (posArr[i * 3 + 1] > 5) posArr[i * 3 + 1] = -5;
        if (posArr[i * 3] > 7) posArr[i * 3] = -7;
        if (posArr[i * 3] < -7) posArr[i * 3] = 7;
      }
      geo.attributes.position.needsUpdate = true;

      // Animate shapes
      shapes.forEach(s => {
        s.rotation.x += s.userData.rotX || 0;
        s.rotation.y += s.userData.rotY || 0;
        if (s.userData.floatSpeed) {
          s.position.y += Math.sin(time * s.userData.floatSpeed * 50 + s.userData.floatOffset) * 0.003;
        }
      });

      camera.position.x = Math.sin(time * 0.1) * 0.3;
      camera.position.y = Math.cos(time * 0.08) * 0.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    this.scenes.landing = { scene, camera, renderer, container, animate };
    animate();

    // Resize handler
    const resizeHandler = () => {
      if (!this.scenes.landing) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', resizeHandler);
    this.scenes.landing.resizeHandler = resizeHandler;
  },

  // ── Dashboard 3D Energy Orb ──
  initDashboardOrb() {
    const container = document.getElementById('dashboard-3d-orb');
    if (!container || this.scenes.dashboard) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(180, 180);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Wireframe sphere
    const sphereGeo = new THREE.IcosahedronGeometry(1, 2);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x2d7a4f,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Inner glow
    const glowGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x2d7a4f,
      transparent: true,
      opacity: 0.08
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // Orbiting rings
    for (let i = 0; i < 2; i++) {
      const ringGeo = new THREE.TorusGeometry(1.3 + i * 0.3, 0.01, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x2d7a4f, transparent: true, opacity: 0.12 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3 + i * 0.5;
      ring.rotation.y = i * 0.8;
      scene.add(ring);
    }

    // Tiny orbiting particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 50;
    const pPos = new Float32Array(pCount * 3);
    const pVels = [];
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 0.5;
      pPos[i * 3] = Math.cos(angle) * r;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      pPos[i * 3 + 2] = Math.sin(angle) * r;
      pVels.push({ angle, r, speed: 0.3 + Math.random() * 0.5, y: pPos[i * 3 + 1] });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.03, color: 0x3a9d64, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const pPoints = new THREE.Points(pGeo, pMat);
    scene.add(pPoints);

    let time = 0;
    const animate = () => {
      if (!this.scenes.dashboard) return;
      requestAnimationFrame(animate);
      time += 0.016;

      sphere.rotation.x += 0.003;
      sphere.rotation.y += 0.005;
      glow.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      glowMat.opacity = 0.06 + Math.sin(time * 2) * 0.03;

      const pp = pGeo.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        pVels[i].angle += pVels[i].speed * 0.016;
        pp[i * 3] = Math.cos(pVels[i].angle) * pVels[i].r;
        pp[i * 3 + 2] = Math.sin(pVels[i].angle) * pVels[i].r;
      }
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    this.scenes.dashboard = { scene, camera, renderer, animate };
    animate();
  },

  // ── Results 3D Globe ──
  initResultsGlobe() {
    const container = document.getElementById('results-3d-globe');
    if (!container || this.scenes.results) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(160, 160);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Earth wireframe
    const earthGeo = new THREE.SphereGeometry(1, 24, 24);
    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x3d7ec7,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Atmosphere
    const atmoGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x2d7a4f,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    // "Continent" dots on globe
    const dotGeo = new THREE.BufferGeometry();
    const dotCount = 80;
    const dotPos = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.01;
      dotPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dotPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dotPos[i * 3 + 2] = r * Math.cos(phi);
    }
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
    const dotMat = new THREE.PointsMaterial({ size: 0.04, color: 0x2d7a4f, transparent: true, opacity: 0.5 });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // Orbiting ring
    const orbitGeo = new THREE.TorusGeometry(1.4, 0.008, 8, 64);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0xc45d3e, transparent: true, opacity: 0.2 });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 4;
    scene.add(orbit);

    let time = 0;
    const animate = () => {
      if (!this.scenes.results) return;
      requestAnimationFrame(animate);
      time += 0.016;

      earth.rotation.y += 0.004;
      dots.rotation.y += 0.004;
      orbit.rotation.z += 0.003;

      renderer.render(scene, camera);
    };

    this.scenes.results = { scene, camera, renderer, animate };
    animate();
  },

  // ── Cleanup all scenes ──
  destroyAll() {
    Object.keys(this.scenes).forEach(key => {
      const s = this.scenes[key];
      if (s) {
        if (s.renderer) s.renderer.dispose();
        if (s.resizeHandler) window.removeEventListener('resize', s.resizeHandler);
      }
    });
    this.scenes = {};
  },

  // ── Destroy specific scene ──
  destroy(name) {
    const s = this.scenes[name];
    if (s) {
      if (s.renderer) s.renderer.dispose();
      if (s.resizeHandler) window.removeEventListener('resize', s.resizeHandler);
      delete this.scenes[name];
    }
  },

  // ── Initialize based on current page ──
  initForPage(hash) {
    // Destroy previous scenes to free memory
    this.destroyAll();

    // Delay slightly to let DOM render
    setTimeout(() => {
      if (hash === '#/' || hash === '' || !hash) {
        this.initLandingParticles();
      } else if (hash === '#/dashboard') {
        this.initDashboardOrb();
      } else if (hash === '#/results' || hash === '#/enterprise-results') {
        this.initResultsGlobe();
      }
    }, 100);
  }
};

// Hook into route changes
window.addEventListener('hashchange', () => {
  PhantomWatt3D.initForPage(window.location.hash);
});
document.addEventListener('DOMContentLoaded', () => {
  // Wait for intro to finish
  setTimeout(() => PhantomWatt3D.initForPage(window.location.hash), 4500);
});

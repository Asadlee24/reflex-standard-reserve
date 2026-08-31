import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * REFLEX 3D Mechanism Sculpture
 * A spatial, physicalized representation of the feedback loop:
 * EXIT SHOCK -> EXIT PRESSURE -> RESOLUTION FEE -> PARTICIPANT RESPONSE -> NEXT EXITS
 *
 * Responds to:
 * - Theme (Light / Dark)
 * - Simulation regime (Stable / Borderline / Cascade)
 * - Active scrubbed round metrics
 * - Pointer parallax
 */

export class ReflexSculpture {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;
    this.theme = options.theme || 'light';
    this.state = {
      classification: 'stable',
      activeRound: 0,
      exitRate: 0.1,
      pressure: 0.1,
      fee: 0.05,
      responseScore: -1.0,
    };

    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isVisible = true;
    this.clock = new THREE.Clock();
    this.nodes = [];
    this.pulses = [];

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 460;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.8);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Group for entire sculpture
    this.mainGroup = new THREE.Group();
    this.scene.add(this.mainGroup);

    // Build Mechanism Nodes & Connections
    this.buildSculpture();

    // Event listeners
    this.setupEvents();

    // Start render loop
    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  getThemeColors() {
    const isDark = this.theme === 'dark';
    return {
      bgOrb: isDark ? 0x181822 : 0xf0efe8,
      ringLine: isDark ? 0x333344 : 0xdddcce,
      ringDash: isDark ? 0x555566 : 0xb5b4a6,
      nodeExit: isDark ? 0xf0ede6 : 0x181816,
      nodePressure: isDark ? 0xe0a94e : 0xb8832a,
      nodeFee: isDark ? 0xef6b55 : 0xc74a38,
      nodeResponse: isDark ? 0x5bb87a : 0x3b8a54,
      nodeCore: isDark ? 0x888899 : 0x777770,
      pulse: isDark ? 0xffffff : 0x222220,
      wire: isDark ? 0x242430 : 0xe4e3d7,
    };
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, this.theme === 'dark' ? 0.9 : 1.4);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, this.theme === 'dark' ? 1.2 : 1.5);
    this.dirLight.position.set(5, 8, 7);
    this.scene.add(this.dirLight);

    this.pointLight = new THREE.PointLight(0xffffff, 0.8, 15);
    this.pointLight.position.set(-4, -3, 3);
    this.scene.add(this.pointLight);
  }

  buildSculpture() {
    const colors = this.getThemeColors();

    // 1. Orbital Ring Structure
    const ringRadius = 2.4;
    const ringGeo = new THREE.RingGeometry(ringRadius - 0.015, ringRadius + 0.015, 96);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: colors.ringLine,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
    this.ringMesh.rotation.x = 0.35;
    this.mainGroup.add(this.ringMesh);

    // Outer subtle dashed orbit
    const curvePoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      curvePoints.push(new THREE.Vector3(Math.cos(theta) * (ringRadius + 0.35), Math.sin(theta) * (ringRadius + 0.35), 0));
    }
    const dashedGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    this.dashedMat = new THREE.LineDashedMaterial({
      color: colors.ringDash,
      dashSize: 0.14,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.45,
    });
    this.dashedLine = new THREE.Line(dashedGeo, this.dashedMat);
    this.dashedLine.computeLineDistances();
    this.dashedLine.rotation.x = 0.35;
    this.mainGroup.add(this.dashedLine);

    // 2. Central Core Anchor (The Reserve Equilibrium)
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 2);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: colors.nodeCore,
      roughness: 0.4,
      metalness: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.mainGroup.add(this.coreMesh);

    // 3. Mechanism Nodes: 4 Spatial Nodes around the orbital loop
    // Top: Initial / Recent Exits
    // Right: Exit Pressure
    // Bottom: Resolution Fee
    // Left: Participant Response
    const nodeConfigs = [
      { id: 'exit', name: 'Exits (W)', angle: Math.PI * 0.5, color: colors.nodeExit, radius: 0.34 },
      { id: 'pressure', name: 'Pressure (P)', angle: 0, color: colors.nodePressure, radius: 0.30 },
      { id: 'fee', name: 'Resolution Fee (F)', angle: Math.PI * 1.5, color: colors.nodeFee, radius: 0.32 },
      { id: 'response', name: 'Behavior (S)', angle: Math.PI, color: colors.nodeResponse, radius: 0.28 },
    ];

    this.nodeMeshes = [];
    this.nodeConfigs = nodeConfigs;

    nodeConfigs.forEach((cfg) => {
      const x = Math.cos(cfg.angle) * ringRadius;
      const y = Math.sin(cfg.angle) * ringRadius;
      const z = 0;

      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(x, y, z);
      nodeGroup.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.35);

      // Sphere Node
      const sphereGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.25,
        metalness: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeGroup.add(sphere);

      // Outer Halo Ring
      const haloGeo = new THREE.TorusGeometry(cfg.radius * 1.45, 0.018, 16, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.5,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(halo);

      this.mainGroup.add(nodeGroup);
      this.nodeMeshes.push({
        id: cfg.id,
        group: nodeGroup,
        sphere,
        halo,
        baseRadius: cfg.radius,
        baseColor: cfg.color,
        mat: sphereMat,
        haloMat,
      });
    });

    // 4. Connecting Causal Pulses (particles traveling around orbit)
    this.pulses = [];
    const pulseCount = 14;
    const pulseGeo = new THREE.SphereGeometry(0.045, 12, 12);
    this.pulseMat = new THREE.MeshBasicMaterial({ color: colors.pulse, transparent: true, opacity: 0.8 });

    for (let i = 0; i < pulseCount; i++) {
      const pMesh = new THREE.Mesh(pulseGeo, this.pulseMat);
      this.mainGroup.add(pMesh);
      this.pulses.push({
        mesh: pMesh,
        progress: i / pulseCount,
        speed: 0.12,
      });
    }
  }

  setTheme(theme) {
    this.theme = theme;
    const colors = this.getThemeColors();

    this.ambientLight.intensity = theme === 'dark' ? 0.9 : 1.4;
    this.dirLight.intensity = theme === 'dark' ? 1.2 : 1.5;

    this.ringMat.color.setHex(colors.ringLine);
    this.dashedMat.color.setHex(colors.ringDash);
    this.coreMat.color.setHex(colors.nodeCore);
    this.pulseMat.color.setHex(colors.pulse);

    this.nodeMeshes.forEach((n) => {
      const cfg = this.nodeConfigs.find((c) => c.id === n.id);
      if (cfg) {
        let col = cfg.color;
        if (n.id === 'exit') col = colors.nodeExit;
        if (n.id === 'pressure') col = colors.nodePressure;
        if (n.id === 'fee') col = colors.nodeFee;
        if (n.id === 'response') col = colors.nodeResponse;
        n.mat.color.setHex(col);
        n.haloMat.color.setHex(col);
      }
    });
  }

  updateState(simState = {}) {
    this.state = { ...this.state, ...simState };
  }

  setupEvents() {
    const onPointerMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      this.pointer.targetX = THREE.MathUtils.clamp(x * 0.45, -0.45, 0.45);
      this.pointer.targetY = THREE.MathUtils.clamp(y * 0.35, -0.35, 0.35);
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('resize', () => this.onResize(), { passive: true });

    // IntersectionObserver to pause when offscreen
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        this.isVisible = entries[0].isIntersecting;
      }, { threshold: 0.05 });
      observer.observe(this.container);
    }
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.rafId = requestAnimationFrame(this.animate);
    if (!this.isVisible) return;

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Smooth pointer parallax
    this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.06;
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.06;

    // Regime-based dynamics
    let speedMult = 1.0;
    let wobble = 0.0;
    if (this.state.classification === 'cascade') {
      speedMult = 2.4;
      wobble = Math.sin(time * 6) * 0.035;
    } else if (this.state.classification === 'borderline') {
      speedMult = 1.2;
      wobble = Math.sin(time * 2.5) * 0.018;
    } else {
      speedMult = 0.65; // Calm settling in stable
    }

    // Rotate main group with breathing motion
    this.mainGroup.rotation.y = time * 0.12 * speedMult + this.pointer.x + wobble;
    this.mainGroup.rotation.x = Math.sin(time * 0.25) * 0.08 + this.pointer.y;
    this.mainGroup.position.y = Math.sin(time * 0.8) * 0.06;

    // Core pulsing
    if (this.coreMesh) {
      this.coreMesh.rotation.x = time * 0.2;
      this.coreMesh.rotation.y = time * 0.3;
      const coreScale = 1 + Math.sin(time * 1.8 * speedMult) * 0.08;
      this.coreMesh.scale.set(coreScale, coreScale, coreScale);
    }

    // Dynamic node scale based on simulation state
    const ringRadius = 2.4;
    this.nodeMeshes.forEach((n) => {
      let metricWeight = 1.0;
      if (n.id === 'exit') metricWeight = 1.0 + (this.state.exitRate || 0) * 1.8;
      if (n.id === 'pressure') metricWeight = 1.0 + (this.state.pressure || 0) * 1.5;
      if (n.id === 'fee') metricWeight = 1.0 + (this.state.fee || 0) * 2.0;
      if (n.id === 'response') metricWeight = 1.0 + Math.max(0, (this.state.responseScore || 0) + 1.5) * 0.35;

      const targetScale = Math.min(2.0, Math.max(0.7, metricWeight));
      n.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);

      // Rotate halo
      n.halo.rotation.z += delta * 0.9 * speedMult;
      n.halo.rotation.x = Math.sin(time * 1.2) * 0.3;
    });

    // Update pulses traversing causal direction (counter-clockwise: exit -> pressure -> fee -> response)
    const basePulseSpeed = 0.18 * speedMult;
    this.pulses.forEach((p) => {
      p.progress = (p.progress + delta * basePulseSpeed) % 1.0;
      const angle = Math.PI * 0.5 - p.progress * Math.PI * 2;
      const px = Math.cos(angle) * ringRadius;
      const py = Math.sin(angle) * ringRadius;

      // Apply initial 0.35 X axis rotation
      const vec = new THREE.Vector3(px, py, 0);
      vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.35);
      p.mesh.position.copy(vec);

      // Fade pulses near nodes
      const pulseOpacity = 0.35 + Math.sin(p.progress * Math.PI * 8) * 0.35;
      p.mesh.scale.setScalar(0.7 + pulseOpacity * 0.5);
    });

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}

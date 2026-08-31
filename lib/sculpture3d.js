/**
 * REFLEX Mechanism Visualizer
 * Pure SVG + CSS animation — no external dependencies, no CDN risk.
 * Represents the causal feedback loop: Exit → Pressure → Fee → Response → Next Exit
 * Responds to: simulation state, theme, regime classification.
 */

export class ReflexSculpture {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.theme = options.theme || 'light';
    this.state = {
      classification: 'stable',
      exitRate: 0.1,
      pressure: 0.1,
      fee: 0.05,
      responseScore: -1.0,
    };
    this._rafId = null;
    this._build();
  }

  _build() {
    this.container.innerHTML = '';
    this.svg = this._createSVG();
    this.container.appendChild(this.svg);
    this._startAnim();
  }

  _createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 440 440');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-label', 'REFLEX feedback loop mechanism diagram');
    svg.style.overflow = 'visible';
    svg.style.display = 'block';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Orbit circle clip
    const pulseFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    pulseFilter.setAttribute('id', 'softglow');
    const feGaussian = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussian.setAttribute('stdDeviation', '3.5');
    feGaussian.setAttribute('result', 'blur');
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const node1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    node1.setAttribute('in', 'blur');
    const node2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    node2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(node1);
    feMerge.appendChild(node2);
    pulseFilter.appendChild(feGaussian);
    pulseFilter.appendChild(feMerge);
    defs.appendChild(pulseFilter);

    // CSS animations embedded
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .reflex-orbit { animation: reflex-spin 18s linear infinite; transform-origin: 220px 220px; }
      .reflex-orbit-rev { animation: reflex-spin-rev 26s linear infinite; transform-origin: 220px 220px; }
      .reflex-pulse { animation: reflex-pulse-move 4s ease-in-out infinite; }
      .reflex-node-ring { animation: reflex-ring-pulse 3.5s ease-in-out infinite alternate; }
      .reflex-cascade .reflex-orbit { animation-duration: 7s; }
      .reflex-cascade .reflex-orbit-rev { animation-duration: 10s; }
      .reflex-stable .reflex-orbit { animation-duration: 24s; }
      .reflex-stable .reflex-orbit-rev { animation-duration: 36s; }
      @keyframes reflex-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes reflex-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      @keyframes reflex-ring-pulse { 0% { opacity: 0.35; r: 28; } 100% { opacity: 0.7; r: 32; } }
      @keyframes reflex-pulse-opacity { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .reflex-orbit, .reflex-orbit-rev, .reflex-node-ring, .reflex-pulse { animation: none; }
      }
    `;
    defs.appendChild(style);
    svg.appendChild(defs);

    // Root group — receives regime class
    this.rootGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.rootGroup.setAttribute('class', 'reflex-stable');
    svg.appendChild(this.rootGroup);

    // cx, cy center
    const cx = 220, cy = 220;
    const R = 132; // orbit radius

    // ── Dashed outer orbit ring ──
    const orbitDash = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    orbitDash.setAttribute('cx', cx);
    orbitDash.setAttribute('cy', cy);
    orbitDash.setAttribute('r', R);
    this._setA(orbitDash, { fill: 'none', 'stroke-dasharray': '6 7', 'stroke-width': '1' });
    this.orbitDash = orbitDash;
    this.rootGroup.appendChild(orbitDash);

    // ── Inner lighter ring ──
    const innerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerRing.setAttribute('cx', cx);
    innerRing.setAttribute('cy', cy);
    innerRing.setAttribute('r', R * 0.55);
    this._setA(innerRing, { fill: 'none', 'stroke-dasharray': '3 5', 'stroke-width': '1' });
    this.innerRing = innerRing;
    this.rootGroup.appendChild(innerRing);

    // ── Central core ──
    const coreOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    coreOuter.setAttribute('cx', cx);
    coreOuter.setAttribute('cy', cy);
    coreOuter.setAttribute('r', '20');
    this._setA(coreOuter, { fill: 'none', 'stroke-width': '1' });
    this.coreOuter = coreOuter;
    this.rootGroup.appendChild(coreOuter);

    const coreInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    coreInner.setAttribute('cx', cx);
    coreInner.setAttribute('cy', cy);
    coreInner.setAttribute('r', '9');
    this.coreInner = coreInner;
    this.rootGroup.appendChild(coreInner);

    // ── Nodes at 4 positions: Top(Exit), Right(Pressure), Bottom(Fee), Left(Response) ──
    // Angles: Top=270°, Right=0°, Bottom=90°, Left=180°
    const angles = [270, 0, 90, 180]; // degrees
    const nodeIds = ['exit', 'pressure', 'fee', 'response'];
    const nodeLabels = ['EXITS (W)', 'PRESSURE (P)', 'RESOLUTION FEE', 'RESPONSE'];
    const nodeSubLabels = ['trailing window', 'W / (D + W)', 'quadratic shape', 'behavioral score'];

    this.nodeMeshes = {};

    // Rotating group holds all causal connections
    const rotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rotGroup.setAttribute('class', 'reflex-orbit');

    // Causal arrow arcs between nodes (drawn on rotating group)
    const arcColors = ['nodeExit', 'nodePressure', 'nodeFee', 'nodeResponse'];
    for (let i = 0; i < 4; i++) {
      const fromAngle = angles[i];
      const toAngle = angles[(i + 1) % 4];
      const fromRad = (fromAngle * Math.PI) / 180;
      const toRad = (toAngle * Math.PI) / 180;
      const x1 = cx + R * Math.cos(fromRad);
      const y1 = cy + R * Math.sin(fromRad);
      const x2 = cx + R * Math.cos(toRad);
      const y2 = cy + R * Math.sin(toRad);

      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midAngle = (fromAngle + toAngle) / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const mx = cx + R * Math.cos(midRad);
      const my = cy + R * Math.sin(midRad);
      arc.setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
      this._setA(arc, { fill: 'none', 'stroke-width': '1.2', 'stroke-dasharray': '4 3' });
      arc.style.opacity = '0.4';
      this['arc' + i] = arc;
      rotGroup.appendChild(arc);
    }
    this.rootGroup.appendChild(rotGroup);
    this.rotGroup = rotGroup;

    // Pulse dots on the orbit (animated)
    const pulseGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pulseGroup.setAttribute('class', 'reflex-orbit-rev');
    this.pulseGroup = pulseGroup;
    this.pulseDots = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * 360;
      const rad = (angle * Math.PI) / 180;
      const px = cx + R * Math.cos(rad);
      const py = cy + R * Math.sin(rad);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', px.toFixed(1));
      dot.setAttribute('cy', py.toFixed(1));
      dot.setAttribute('r', '3.5');
      dot.style.animationDelay = `${i * 0.65}s`;
      dot.style.animation = `reflex-pulse-opacity 4s ease-in-out ${i * 0.65}s infinite`;
      this.pulseDots.push(dot);
      pulseGroup.appendChild(dot);
    }
    this.rootGroup.appendChild(pulseGroup);

    // Static node groups (NOT rotating)
    angles.forEach((angleDeg, idx) => {
      const rad = (angleDeg * Math.PI) / 180;
      const nx = cx + R * Math.cos(rad);
      const ny = cy + R * Math.sin(rad);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${nx.toFixed(1)}, ${ny.toFixed(1)})`);

      // Halo ring (animated)
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.setAttribute('cx', '0');
      halo.setAttribute('cy', '0');
      halo.setAttribute('r', '28');
      halo.setAttribute('class', 'reflex-node-ring');
      halo.style.animationDelay = `${idx * 0.8}s`;
      this._setA(halo, { fill: 'none', 'stroke-width': '1.5' });
      g.appendChild(halo);

      // Node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', '18');
      g.appendChild(circle);

      // Node label (offset based on position)
      const labelOffsets = [
        { x: 0, y: -38 },  // top
        { x: 44, y: 0 },   // right
        { x: 0, y: 44 },   // bottom
        { x: -44, y: 0 },  // left
      ];
      const lo = labelOffsets[idx];

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', lo.x);
      label.setAttribute('y', lo.y);
      label.setAttribute('text-anchor', lo.x < 0 ? 'end' : lo.x > 0 ? 'start' : 'middle');
      label.setAttribute('font-family', 'JetBrains Mono, Menlo, monospace');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-weight', '600');
      label.setAttribute('letter-spacing', '0.08em');
      g.appendChild(label);

      const sublabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sublabel.setAttribute('x', lo.x);
      sublabel.setAttribute('y', lo.y + 12);
      sublabel.setAttribute('text-anchor', lo.x < 0 ? 'end' : lo.x > 0 ? 'start' : 'middle');
      sublabel.setAttribute('font-family', 'JetBrains Mono, Menlo, monospace');
      sublabel.setAttribute('font-size', '7.5');
      g.appendChild(sublabel);

      // Value display in node center
      const val = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      val.setAttribute('x', '0');
      val.setAttribute('y', '4');
      val.setAttribute('text-anchor', 'middle');
      val.setAttribute('font-family', 'JetBrains Mono, Menlo, monospace');
      val.setAttribute('font-size', '7.5');
      val.setAttribute('font-weight', '600');
      val.textContent = '—';
      g.appendChild(val);

      this.rootGroup.appendChild(g);

      this.nodeMeshes[nodeIds[idx]] = { g, circle, halo, label, sublabel, val, labelText: nodeLabels[idx], subText: nodeSubLabels[idx] };
    });

    this._applyTheme();
    return svg;
  }

  _setA(el, attrs) {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }

  _applyTheme() {
    const isDark = this.theme === 'dark';
    const nodeColors = {
      exit: isDark ? '#E8E6F0' : '#141412',
      pressure: isDark ? '#FBBF24' : '#A36B15',
      fee: isDark ? '#F87171' : '#B82E2B',
      response: isDark ? '#4ADE80' : '#1F7A42',
    };
    const strokeColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,18,0.12)';
    const strokeDash = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(20,20,18,0.16)';
    const textColor = isDark ? '#9E9E94' : '#88877E';
    const coreColor = isDark ? '#2a2a3a' : '#EBEBEA';
    const coreDotColor = isDark ? '#555566' : '#C8C7BF';
    const pulseColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,18,0.4)';

    this.orbitDash?.setAttribute('stroke', strokeDash);
    this.innerRing?.setAttribute('stroke', strokeColor);
    this.coreOuter?.setAttribute('stroke', strokeColor);
    if (this.coreInner) {
      this.coreInner.setAttribute('fill', coreDotColor);
    }

    // Arc lines
    [0, 1, 2, 3].forEach((i) => {
      const arc = this['arc' + i];
      if (arc) arc.setAttribute('stroke', strokeDash);
    });

    // Pulse dots
    this.pulseDots?.forEach((d) => d.setAttribute('fill', pulseColor));

    // Nodes
    const nodeIds = ['exit', 'pressure', 'fee', 'response'];
    nodeIds.forEach((id) => {
      const n = this.nodeMeshes[id];
      if (!n) return;
      const col = nodeColors[id];
      n.circle.setAttribute('fill', col);
      n.circle.setAttribute('stroke', 'none');
      n.halo.setAttribute('stroke', col);
      n.halo.setAttribute('opacity', '0.4');
      n.label.setAttribute('fill', isDark ? '#D0CFC8' : '#38382E');
      n.sublabel.setAttribute('fill', textColor);
      n.val.setAttribute('fill', isDark ? '#F0EFE8' : '#141412');
      // Set label text
      n.label.textContent = n.labelText;
      n.sublabel.textContent = n.subText;
    });
  }

  _startAnim() {
    // Nothing to do — CSS animations handle the motion.
    // We use rAF only for state-driven value updates.
  }

  updateState(simState = {}) {
    this.state = { ...this.state, ...simState };

    // Update classification regime class
    const cls = this.state.classification || 'stable';
    if (this.rootGroup) {
      this.rootGroup.setAttribute('class',
        cls === 'cascade' ? 'reflex-cascade' : cls === 'borderline' ? 'reflex-borderline' : 'reflex-stable'
      );
    }

    // Update node value text
    const formatPct = (v) => `${(v * 100).toFixed(0)}%`;
    const formatNum = (v) => v == null ? '—' : v.toFixed(2);

    const vals = {
      exit: formatPct(this.state.exitRate || 0),
      pressure: formatNum(this.state.pressure),
      fee: formatPct(this.state.fee || 0),
      response: formatNum(this.state.responseScore),
    };

    Object.entries(vals).forEach(([id, text]) => {
      const n = this.nodeMeshes[id];
      if (n && n.val) n.val.textContent = text;
    });

    // Scale node circles based on metric magnitude
    const scales = {
      exit: 1 + (this.state.exitRate || 0) * 1.2,
      pressure: 1 + (this.state.pressure || 0) * 1.0,
      fee: 1 + (this.state.fee || 0) * 1.6,
      response: 1 + Math.max(0, (this.state.responseScore || -1) + 2) * 0.15,
    };

    Object.entries(scales).forEach(([id, scale]) => {
      const n = this.nodeMeshes[id];
      if (!n) return;
      const clamped = Math.min(1.6, Math.max(0.7, scale));
      const r = (18 * clamped).toFixed(1);
      n.circle.setAttribute('r', r);
    });
  }

  setTheme(theme) {
    this.theme = theme;
    this._applyTheme();
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this.container) this.container.innerHTML = '';
  }
}

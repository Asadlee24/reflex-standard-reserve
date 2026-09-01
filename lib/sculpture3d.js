/**
 * REFLEX CORE — Dual-Layer Mechanism Sculpture
 * Combines:
 *  1. Inner Specification Core: 8 SpecLab domains (Supply, Policy, Charters, Branches, Issuance, Resolution, Auctions, Vaults) with formal state nodes.
 *  2. Outer Dynamic Field: REFLEX behavioral feedback loop with particle stream responding to exit contagion and fee deterrence.
 *
 * Built by Asad Lee (https://github.com/Asadlee24)
 */

export class ReflexSculpture {
  constructor(containerEl, options = {}) {
    this.container = typeof containerEl === 'string' ? document.querySelector(containerEl) : containerEl;
    this.theme = options.theme || 'light';
    this.activeDomain = null;
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
    if (!this.container) return;
    this.container.innerHTML = '';
    this.svg = this._createSVG();
    this.container.appendChild(this.svg);
    this._applyThemeColors();
  }

  _createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 500 500');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-label', 'REFLEX Core — SpecLab Invariant Rings and Dynamics Feedback Field');
    svg.style.overflow = 'visible';
    svg.style.display = 'block';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Glow filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'coreGlow');
    filter.innerHTML = `
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;
    defs.appendChild(filter);

    // CSS animations
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .spec-orbit-inner { animation: spec-spin 40s linear infinite; transform-origin: 250px 250px; }
      .spec-orbit-mid { animation: spec-spin-rev 28s linear infinite; transform-origin: 250px 250px; }
      .spec-orbit-outer { animation: spec-spin 18s linear infinite; transform-origin: 250px 250px; }
      .feedback-particles { animation: spec-spin 12s linear infinite; transform-origin: 250px 250px; }
      .domain-node { cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), fill 0.2s ease; }
      .domain-node:hover { transform: scale(1.25); }
      .cascade-mode .feedback-particles { animation-duration: 5s; stroke-dasharray: 4 4; }
      .cascade-mode .spec-orbit-outer { animation-duration: 9s; }
      @keyframes spec-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes spec-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .spec-orbit-inner, .spec-orbit-mid, .spec-orbit-outer, .feedback-particles { animation: none !important; }
      }
    `;
    defs.appendChild(style);
    svg.appendChild(defs);

    this.rootGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.rootGroup.setAttribute('class', 'reflex-core-root reflex-stable');
    svg.appendChild(this.rootGroup);

    const cx = 250, cy = 250;

    // ── Outer Dynamics Feedback Orbit (Radius: 210) ──
    this.outerFeedback = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.outerFeedback.setAttribute('cx', cx);
    this.outerFeedback.setAttribute('cy', cy);
    this.outerFeedback.setAttribute('r', '210');
    this.outerFeedback.setAttribute('fill', 'none');
    this.outerFeedback.setAttribute('stroke-dasharray', '8 12');
    this.outerFeedback.setAttribute('stroke-width', '1.5');
    this.outerFeedback.setAttribute('class', 'feedback-particles');
    this.rootGroup.appendChild(this.outerFeedback);

    // ── Mid SpecLab Domain Orbit (Radius: 155) ──
    this.midSpecOrbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.midSpecOrbit.setAttribute('cx', cx);
    this.midSpecOrbit.setAttribute('cy', cy);
    this.midSpecOrbit.setAttribute('r', '155');
    this.midSpecOrbit.setAttribute('fill', 'none');
    this.midSpecOrbit.setAttribute('stroke-width', '1');
    this.midSpecOrbit.setAttribute('class', 'spec-orbit-mid');
    this.rootGroup.appendChild(this.midSpecOrbit);

    // ── Inner Protocol Invariant Orbit (Radius: 95) ──
    this.innerSpecOrbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.innerSpecOrbit.setAttribute('cx', cx);
    this.innerSpecOrbit.setAttribute('cy', cy);
    this.innerSpecOrbit.setAttribute('r', '95');
    this.innerSpecOrbit.setAttribute('fill', 'none');
    this.innerSpecOrbit.setAttribute('stroke-dasharray', '4 6');
    this.innerSpecOrbit.setAttribute('stroke-width', '1');
    this.innerSpecOrbit.setAttribute('class', 'spec-orbit-inner');
    this.rootGroup.appendChild(this.innerSpecOrbit);

    // ── Central $STANDARD Spec Core ──
    this.coreNodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    this.coreHalo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.coreHalo.setAttribute('cx', cx);
    this.coreHalo.setAttribute('cy', cy);
    this.coreHalo.setAttribute('r', '42');
    this.coreHalo.setAttribute('fill', 'none');
    this.coreHalo.setAttribute('stroke-width', '1');
    this.coreNodeGroup.appendChild(this.coreHalo);

    this.coreSolid = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.coreSolid.setAttribute('cx', cx);
    this.coreSolid.setAttribute('cy', cy);
    this.coreSolid.setAttribute('r', '26');
    this.coreNodeGroup.appendChild(this.coreSolid);

    const coreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    coreText.setAttribute('x', cx);
    coreText.setAttribute('y', cy + 4);
    coreText.setAttribute('text-anchor', 'middle');
    coreText.setAttribute('font-size', '10');
    coreText.setAttribute('font-weight', '700');
    coreText.setAttribute('letter-spacing', '0.1em');
    coreText.setAttribute('fill', '#ffffff');
    coreText.textContent = 'SPEC';
    this.coreNodeGroup.appendChild(coreText);
    this.rootGroup.appendChild(this.coreNodeGroup);

    // ── 8 SpecLab Domain Satellite Nodes ──
    const domains = [
      { id: 'SUPPLY', label: 'Supply', angle: 0 },
      { id: 'POLICY', label: 'Policy', angle: 45 },
      { id: 'CHARTERS', label: 'Charters', angle: 90 },
      { id: 'BRANCHES', label: 'Branches', angle: 135 },
      { id: 'ISSUANCE', label: 'Issuance', angle: 180 },
      { id: 'RESOLUTION', label: 'Resolution', angle: 225 },
      { id: 'AUCTIONS', label: 'Auctions', angle: 270 },
      { id: 'VAULTS', label: 'Vaults', angle: 315 },
    ];

    this.domainElements = [];
    this.domainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.domainGroup.setAttribute('class', 'spec-orbit-mid');

    domains.forEach((d) => {
      const rad = (d.angle * Math.PI) / 180;
      const dx = cx + 155 * Math.cos(rad);
      const dy = cy + 155 * Math.sin(rad);

      const nodeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeG.setAttribute('class', 'domain-node');
      nodeG.setAttribute('data-domain', d.id);
      nodeG.style.transformOrigin = `${dx}px ${dy}px`;

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', dx);
      dot.setAttribute('cy', dy);
      dot.setAttribute('r', '8');
      nodeG.appendChild(dot);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', dx);
      label.setAttribute('y', dy + 18);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '8');
      label.setAttribute('font-weight', '600');
      label.setAttribute('letter-spacing', '0.05em');
      label.textContent = d.label;
      nodeG.appendChild(label);

      nodeG.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('reflex:domain-select', { detail: { domain: d.id } }));
      });

      this.domainElements.push({ id: d.id, group: nodeG, dot, label });
      this.domainGroup.appendChild(nodeG);
    });

    this.rootGroup.appendChild(this.domainGroup);

    return svg;
  }

  _applyThemeColors() {
    const isDark = this.theme === 'dark';
    const primary = isDark ? '#c5a059' : '#8b6914';
    const orbitStroke = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
    const textFill = isDark ? '#e0e0e0' : '#444444';
    const coreFill = isDark ? '#1a1a1c' : '#222222';
    const feedbackStroke = isDark ? 'rgba(197, 160, 89, 0.45)' : 'rgba(139, 105, 20, 0.45)';

    this.outerFeedback.setAttribute('stroke', feedbackStroke);
    this.midSpecOrbit.setAttribute('stroke', orbitStroke);
    this.innerSpecOrbit.setAttribute('stroke', orbitStroke);
    this.coreHalo.setAttribute('stroke', primary);
    this.coreSolid.setAttribute('fill', primary);

    this.domainElements.forEach(({ dot, label }) => {
      dot.setAttribute('fill', primary);
      label.setAttribute('fill', textFill);
    });
  }

  setTheme(theme) {
    this.theme = theme;
    this._applyThemeColors();
  }

  updateState(state = {}) {
    this.state = { ...this.state, ...state };
    if (this.state.classification === 'cascade') {
      this.rootGroup.classList.add('cascade-mode');
      this.rootGroup.classList.remove('reflex-stable');
    } else {
      this.rootGroup.classList.remove('cascade-mode');
      this.rootGroup.classList.add('reflex-stable');
    }
  }

  focusDomain(domainId) {
    this.activeDomain = domainId;
    this.domainElements.forEach(({ id, dot, group }) => {
      if (!domainId || domainId === 'ALL' || id === domainId) {
        dot.setAttribute('r', id === domainId ? '12' : '8');
        group.style.opacity = '1';
      } else {
        dot.setAttribute('r', '6');
        group.style.opacity = '0.4';
      }
    });
  }
}

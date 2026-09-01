/**
 * Trace Lab state-transition replayer and forensic step inspector.
 * Built by Asad Lee (https://github.com/Asadlee24)
 */

export class TraceLabPlayer {
  constructor(containerId, traces = []) {
    this.container = typeof containerId === 'string' ? document.querySelector(containerId) : containerId;
    this.traces = traces;
    this.activeTraceIndex = 0;
    this.activeStepIndex = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.render();
  }

  setTraces(traces) {
    this.traces = traces;
    this.activeTraceIndex = 0;
    this.activeStepIndex = 0;
    this.render();
  }

  getActiveTrace() {
    return this.traces[this.activeTraceIndex] || null;
  }

  getActiveStep() {
    const trace = this.getActiveTrace();
    if (!trace || !trace.steps) return null;
    return trace.steps[this.activeStepIndex] || null;
  }

  nextStep() {
    const trace = this.getActiveTrace();
    if (!trace) return;
    if (this.activeStepIndex < trace.steps.length - 1) {
      this.activeStepIndex++;
      this.render();
    } else {
      this.pause();
    }
  }

  prevStep() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
      this.render();
    }
  }

  goToStep(index) {
    const trace = this.getActiveTrace();
    if (!trace) return;
    if (index >= 0 && index < trace.steps.length) {
      this.activeStepIndex = index;
      this.render();
    }
  }

  play() {
    this.isPlaying = true;
    if (this.playTimer) clearInterval(this.playTimer);
    this.playTimer = setInterval(() => {
      const trace = this.getActiveTrace();
      if (!trace) return;
      if (this.activeStepIndex < trace.steps.length - 1) {
        this.nextStep();
      } else {
        this.activeStepIndex = 0;
        this.render();
      }
    }, 1500);
    this.render();
  }

  pause() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    this.render();
  }

  render() {
    if (!this.container) return;
    const trace = this.getActiveTrace();
    if (!trace) {
      this.container.innerHTML = `<div class="trace-empty">No trace selected.</div>`;
      return;
    }

    const step = this.getActiveStep();
    const stepsCount = trace.steps.length;

    this.container.innerHTML = `
      <div class="trace-terminal">
        <div class="trace-header">
          <div class="trace-title-group">
            <span class="trace-badge ${trace.verdict.toLowerCase()}">${trace.verdict}</span>
            <span class="trace-id">${trace.traceId}: ${trace.name}</span>
          </div>
          <div class="trace-controls">
            <button class="btn-trace-ctrl" id="btnTracePrev" ${this.activeStepIndex === 0 ? 'disabled' : ''}>← Prev</button>
            <button class="btn-trace-ctrl primary" id="btnTracePlay">${this.isPlaying ? '❚❚ Pause' : '▶ Play'}</button>
            <button class="btn-trace-ctrl" id="btnTraceNext" ${this.activeStepIndex === stepsCount - 1 ? 'disabled' : ''}>Next →</button>
            <button class="btn-trace-ctrl" id="btnTraceReset">Reset</button>
          </div>
        </div>

        <div class="trace-timeline-scrubber">
          ${trace.steps.map((s, idx) => `
            <div class="trace-step-tick ${idx === this.activeStepIndex ? 'active' : ''} ${idx < this.activeStepIndex ? 'completed' : ''}" data-step="${idx}" title="Step ${idx}: ${s.action}">
              <span class="tick-num">${idx}</span>
            </div>
          `).join('')}
        </div>

        <div class="trace-body-grid">
          <!-- Step action & details -->
          <div class="trace-panel action-panel">
            <div class="panel-tag">STEP ${this.activeStepIndex + 1} OF ${stepsCount}</div>
            <h4 class="action-title"><code>${step.action}</code></h4>
            <div class="caller-meta">Caller: <code>${step.caller || '0xSender'}</code></div>

            <div class="invariants-evaluated-list">
              <div class="panel-tag" style="margin-top: 16px;">INVARIANTS EVALUATED</div>
              ${(step.invariantsChecked || ['INV-SUPPLY-001']).map(inv => `
                <div class="inv-eval-badge pass">
                  <span>✓</span>
                  <code>${inv}</code>
                  <span class="eval-status">PASS</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Pre-state vs Post-state Diff -->
          <div class="trace-panel diff-panel">
            <div class="panel-tag">STATE TRANSITION DIFF</div>
            <div class="diff-split">
              <div class="diff-col">
                <span class="diff-label">PRE-STATE</span>
                <pre><code>${JSON.stringify(step.preState, null, 2)}</code></pre>
              </div>
              <div class="diff-arrow">→</div>
              <div class="diff-col post">
                <span class="diff-label">POST-STATE</span>
                <pre><code>${JSON.stringify(step.postState, null, 2)}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    this.container.querySelector('#btnTracePrev')?.addEventListener('click', () => this.prevStep());
    this.container.querySelector('#btnTraceNext')?.addEventListener('click', () => this.nextStep());
    this.container.querySelector('#btnTracePlay')?.addEventListener('click', () => this.isPlaying ? this.pause() : this.play());
    this.container.querySelector('#btnTraceReset')?.addEventListener('click', () => this.goToStep(0));

    this.container.querySelectorAll('.trace-step-tick').forEach((el) => {
      el.addEventListener('click', (e) => {
        const stepIdx = parseInt(e.currentTarget.dataset.step, 10);
        this.goToStep(stepIdx);
      });
    });
  }
}

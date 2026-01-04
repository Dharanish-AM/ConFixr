/**
 * ConFixr DevTools Panel
 * Vanilla JS UI for rendering error intelligence results in the DevTools tab.
 */

class ConFixrPanel {
  constructor(root) {
    this.root = root;
    this.errorHistory = [];
    this.renderIdle();
    this.listenForMessages();
  }

  listenForMessages() {
    // Receive reasoning results from background/devtools pipeline
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "REASONING_COMPLETE") {
        this.errorHistory.push(message.payload);
        this.renderResult(message.payload);
        sendResponse?.({ received: true });
      }

      if (message?.type === "REASONING_ERROR") {
        this.renderError(message.error || "Analysis failed");
        sendResponse?.({ received: true });
      }
    });
  }

  renderIdle() {
    this.root.innerHTML = `
      <div class="cf-panel">
        <header class="cf-header">
          <div class="cf-logo">ConFixr</div>
          <p class="cf-subtitle">AI-Powered Console Intelligence</p>
        </header>

        <div class="cf-status">
          <span class="cf-status-indicator waiting"></span>
          <span class="cf-status-text">Waiting for console events...</span>
        </div>

        <div class="cf-content">
          <div class="cf-empty">
            <p>Open the Console and trigger an error to see analysis.</p>
            <p class="cf-hint">Try: <code>undefined.prop</code></p>
          </div>
        </div>
      </div>
    `;
  }

  renderResult(result) {
    const { classification = {}, rootCause = {}, fixes = {}, validation = {}, confidence = 0, frameId, timestamp } = result || {};
    const confidencePct = Math.round((confidence || 0) * 100);
    const confidenceClass = confidencePct >= 80 ? "high" : confidencePct >= 60 ? "medium" : "low";

    this.root.innerHTML = `
      <div class="cf-panel">
        <header class="cf-header">
          <div class="cf-logo">ConFixr</div>
          <p class="cf-subtitle">Error Analysis</p>
        </header>

        <div class="cf-status analyzing">
          <span class="cf-status-indicator analyzing"></span>
          <span class="cf-status-text">Analysis complete</span>
        </div>

        <div class="cf-content">
          <section class="cf-section">
            <h3 class="cf-section-title">Error</h3>
            <div class="cf-error-message">${this.escape(rootCause.message || classification.message || "Console error")}</div>
            <div class="cf-meta-row">
              <span class="cf-meta">Frame: ${this.escape(frameId || "-")}</span>
              <span class="cf-meta">Time: ${timestamp ? new Date(timestamp).toLocaleTimeString() : "-"}</span>
            </div>
          </section>

          <section class="cf-section">
            <h3 class="cf-section-title">Classification</h3>
            <div class="cf-badge">${this.escape(classification.category || "UNKNOWN")}</div>
            <p class="cf-muted">${this.escape(classification.reasoning || "No reasoning available")}</p>
          </section>

          <section class="cf-section">
            <h3 class="cf-section-title">Root Cause</h3>
            <div class="cf-confidence ${confidenceClass}">${confidencePct}% confident</div>
            <p class="cf-strong">${this.escape(rootCause.hypothesis || "Unknown cause")}</p>
            <div class="cf-meta-row">
              <span class="cf-meta"><strong>Origin:</strong> ${this.escape(rootCause.origin || "-")}</span>
              <span class="cf-meta"><strong>Severity:</strong> ${this.escape(rootCause.severity || "-")}</span>
              <span class="cf-meta"><strong>Trigger:</strong> ${this.escape(rootCause.trigger || "-")}</span>
            </div>
          </section>

          <section class="cf-section">
            <h3 class="cf-section-title">Recommended Fixes</h3>
            <div class="cf-fixes">
              ${(fixes.fixes || []).map((fix, idx) => `
                <div class="cf-fix">
                  <div class="cf-fix-number">Fix ${idx + 1}</div>
                  <div class="cf-fix-title">${this.escape(fix.title || "Suggested change")}</div>
                  <pre class="cf-code"><code>${this.escape(fix.code || "")}</code></pre>
                  <p class="cf-muted">${this.escape(fix.explanation || "")}</p>
                </div>
              `).join("") || "<p class=\"cf-muted\">No specific fixes provided yet.</p>"}
            </div>
            ${fixes.prevention ? `<p class="cf-prevention"><strong>Prevention:</strong> ${this.escape(fixes.prevention)}</p>` : ""}
            ${(fixes.safePatterns || []).length > 0 ? `
              <div class="cf-patterns">
                ${(fixes.safePatterns || []).map(tag => `<span class="cf-tag">${this.escape(tag)}</span>`).join("")}
              </div>
            ` : ""}
          </section>

          <section class="cf-section">
            <h3 class="cf-section-title">Validation</h3>
            <div class="cf-validation">
              ${this.renderScoreBar("Stack Match", validation.stackMatch)}
              ${this.renderScoreBar("Signal Strength", validation.signalStrength)}
              ${this.renderScoreBar("Async Correctness", validation.asyncCorrectness)}
            </div>
          </section>

          ${this.renderHistory()}
        </div>
      </div>
    `;
  }

  renderHistory() {
    if (this.errorHistory.length <= 1) return "";
    const recent = this.errorHistory.slice(-5).reverse();
    return `
      <section class="cf-section">
        <h3 class="cf-section-title">Recent Errors (${this.errorHistory.length})</h3>
        <div class="cf-history">
          ${recent.map(item => `
            <div class="cf-history-item">
              <span class="cf-meta">${item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "-"}</span>
              <span class="cf-tag">${this.escape(item.classification?.category || "UNKNOWN")}</span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  renderScoreBar(label, value = 0) {
    const pct = Math.round((value || 0) * 100);
    return `
      <div class="cf-score">
        <div class="cf-score-label">${label}</div>
        <div class="cf-score-bar"><span style="width:${pct}%"></span></div>
        <div class="cf-score-value">${pct}%</div>
      </div>
    `;
  }

  renderError(message) {
    this.root.innerHTML = `
      <div class="cf-panel">
        <header class="cf-header">
          <div class="cf-logo">ConFixr</div>
        </header>
        <div class="cf-content">
          <div class="cf-error-state">
            <p>❌ ${this.escape(message)}</p>
            <button class="cf-btn" id="cf-retry">Retry</button>
          </div>
        </div>
      </div>
    `;

    const retry = document.getElementById("cf-retry");
    if (retry) retry.onclick = () => this.renderIdle();
  }

  escape(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }
}

// Bootstrap the panel once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new ConFixrPanel(document.getElementById("root")));
} else {
  new ConFixrPanel(document.getElementById("root"));
}
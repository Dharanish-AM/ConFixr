const list = document.getElementById("list");
const emptyState = document.getElementById("empty-state");
const clearBtn = document.getElementById("clear-btn");
const debugView = document.getElementById("debug-view");
const debugBtn = document.getElementById("debug-btn");
let currentTabId = null;

console.log("[ConFixr Panel] Initializing...");

function renderCard(analysis) {
  console.log("[ConFixr Panel] Rendering card:", analysis);

  // Filter by tab ID
  if (currentTabId !== null && analysis.tabId != currentTabId) {
    return;
  }

  // Remove empty state if it's there
  if (emptyState.style.display !== "none") {
    emptyState.style.display = "none";
  }

  const { raw, classification, suggestion, reasoning, retryable, id } =
    analysis;

  const card = document.createElement("div");
  card.className = "card";
  // Add ID for finding it later
  if (id) card.dataset.id = id;

  const errorMessage = raw.message || raw.error || "Unknown Error";
  const errorSource = raw.source ? raw.source.toUpperCase() : "GENERAL";

  let actionBlock = `<div class="suggestion-block">${suggestion}</div>`;

  if (retryable) {
    actionBlock = `
        <div class="suggestion-block" style="background: rgba(255, 193, 7, 0.1); border-color: #ffc107;">
          ${suggestion}
          <button class="retry-btn" data-id="${id}" style="
            display: block; 
            margin-top: 8px; 
            background: #1f6feb; 
            color: white; 
            border: none; 
            padding: 6px 12px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 12px;
          ">🔄 Retry Analysis</button>
        </div>
      `;
  }

  card.innerHTML = `
    <div class="error-header">
      <span class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </span>
      <div class="error-message">${errorMessage}</div>
    </div>

    <div>
      <div class="section-title">Suggested Fix</div>
      ${actionBlock}
    </div>

    <div>
      <div class="section-title">Reasoning</div>
      <div class="reasoning-block">${reasoning}</div>
    </div>
    
    <div class="meta-info">
        <span>${errorSource}</span>
        <span>${classification || "Unknown Type"}</span>
    </div>
  `;

  // Attach listener if retry button exists
  if (retryable) {
    const btn = card.querySelector(".retry-btn");
    btn.addEventListener("click", () => {
      btn.textContent = "Analyzing...";
      btn.disabled = true;
      chrome.runtime.sendMessage({
        type: "RETRY_ANALYSIS",
        payload: { id, raw, tabId: analysis.tabId },
      });
    });
  }

  // If card with this ID exists, replace it, else prepend
  if (id) {
    const existing = list.querySelector(`.card[data-id="${id}"]`);
    if (existing) {
      existing.replaceWith(card);
      return;
    }
  }

  list.prepend(card);
}

// Get current tab ID and then load errors
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    currentTabId = tabs[0].id;
    console.log("[ConFixr Panel] Current Tab ID:", currentTabId);

    // Load persisted errors
    chrome.storage.local.get({ errors: [] }, (data) => {
      console.log("[ConFixr Panel] Loaded errors count:", data.errors.length);

      if (data.errors.length > 0) {
        const tabErrors = data.errors.filter((e) => e.tabId == currentTabId);
        const otherErrorsCount = data.errors.length - tabErrors.length;

        console.log(
          `[ConFixr Panel] Filtered stats: ThisTab(${tabErrors.length}), OtherTabs(${otherErrorsCount})`
        );

        if (tabErrors.length > 0) {
          tabErrors.forEach(renderCard);
        } else if (otherErrorsCount > 0) {
          const msg = document.createElement("p");
          msg.style.padding = "20px";
          msg.style.textAlign = "center";
          msg.style.color = "#8b949e";
          msg.style.fontSize = "12px";
          msg.textContent = `${otherErrorsCount} error(s) detected on other tabs. Switch tabs to view.`;
          list.appendChild(msg);

          // Keep empty state hidden if we show this message?
          // Or show both? Let's hide empty state to avoid confusion.
          if (emptyState.style.display !== "none") {
            emptyState.style.display = "none";
          }
        }
      }
    });
  } else {
    console.error("[ConFixr Panel] No active tab found.");
  }
});

// Listen for new errors
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "ANALYSIS_RESULT") return;
  console.log("[ConFixr Panel] Received live message:", msg.analysis);
  renderCard(msg.analysis);
});

// Clear errors
clearBtn.addEventListener("click", () => {
  chrome.storage.local.set({ errors: [] }, () => {
    console.log("[ConFixr Panel] Logs cleared.");
    list.innerHTML = "";
    list.appendChild(debugView); // Keep debug view
    list.appendChild(emptyState);
    emptyState.style.display = "block";
    debugView.style.display = "none";
  });
});

// Debug Toggle
debugBtn.addEventListener("click", () => {
  if (debugView.style.display === "none") {
    debugView.style.display = "block";
    chrome.storage.local.get(null, (data) => {
      const info = {
        currentTabId: currentTabId,
        storage: data,
      };
      debugView.textContent = JSON.stringify(info, null, 2);
    });
  } else {
    debugView.style.display = "none";
  }
});

const list = document.getElementById("errors");
const refreshBtn = document.getElementById("refresh");
const clearBtn = document.getElementById("clear");

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

function renderErrors(errors = []) {
  console.log("[ConFixr Popup] Rendering", errors.length, "errors");
  
  if (!errors.length) {
    list.innerHTML = `<div class="empty">No errors captured yet<br><small style="font-size: 10px; margin-top: 10px; display: block; color: #999;">Trigger errors on a webpage to see them here</small></div>`;
    return;
  }

  list.innerHTML = errors
    .slice(-50) // show latest 50
    .reverse()
    .map((e) => {
      const errorClass = e.type?.includes("NETWORK") ? "network" : e.type?.includes("RUNTIME") ? "error" : "warning";
      return `
      <div class="error-item ${errorClass}">
        <div class="type">${e.type || e.result?.type || "UNKNOWN"}</div>
        <div class="msg">${e.message || "(no message)"}</div>
        ${e.result?.cause ? `<div class="meta" style="margin-top: 4px; font-weight: 500;">${e.result.cause}</div>` : ""}
        <div class="meta">
          ${e.source ? `📍 ${e.source}` : ""} ${e.line ? `· line ${e.line}` : ""}
          <br>
          🕐 ${formatTime(e.ts || Date.now())}
        </div>
      </div>
    `;
    })
    .join("");
}

funcconsole.log("[ConFixr Popup] Loaded from storage:", errors.length, "errors");
    tion loadErrors() {
  chrome.storage.local.get({ errors: [] }, ({ errors }) => {
    renderErrors(errors);
  });
}

refreshBtn.onclick = loadErrors;

clearBtn.onclick = () => {
  chrome.storage.local.set({ errors: [] }, loadErrors);
};

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.errors) {
    renderErrors(changes.errors.newValue || []);
  }
});

loadErrors();
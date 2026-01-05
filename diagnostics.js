const logEl = document.getElementById("console-log");
const origLog = console.log;

console.log = function(...args) {
  origLog.apply(console, args);
  logEl.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n';
  logEl.scrollTop = logEl.scrollHeight;
};

// Check runtime
function checkRuntime() {
  const el = document.getElementById("runtime-status");
  const pageInfo = document.getElementById("page-info");
  
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    el.innerHTML = `<div class="status-ok">✓ chrome.runtime available</div>`;
    pageInfo.style.backgroundColor = '#d4edda';
    pageInfo.style.color = '#155724';
    pageInfo.innerHTML = '<strong>✓ Correct!</strong> Extension APIs are available. This is the extension options page.';
    console.log("✓ Chrome runtime detected");
    return true;
  } else {
    el.innerHTML = `<div class="status-error">✗ chrome.runtime NOT available</div><div style="margin-top: 10px; padding: 10px; background: #f8d7da; border-radius: 3px; color: #721c24;"><strong>⚠️ ERROR:</strong> This page is NOT loaded as an extension page!<br><br>You are viewing this as a regular file:// URL. Chrome extension APIs are not available.<br><br><strong>How to fix:</strong><br>1. Go to <code>chrome://extensions</code><br>2. Find "ConFixr"<br>3. Click "Options" button<br><br>OR right-click the ConFixr icon and select "Options"</div>`;
    console.log("✗ Chrome runtime NOT available - NOT an extension page");
    return false;
  }
}

// Check storage
function checkStorage() {
  const el = document.getElementById("storage-status");
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get({ errors: [] }, (result) => {
      const count = result.errors?.length || 0;
      el.innerHTML = `
        <div class="status-ok">✓ chrome.storage available</div>
        <div>Current stored errors: <strong>${count}</strong></div>
        <button id="btn-refresh-storage">Refresh</button>
      `;
      document.getElementById("btn-refresh-storage").addEventListener("click", refreshStorageStatus);
      console.log(`✓ Storage check: ${count} errors stored`);
    });
  } else {
    el.innerHTML = `<div class="status-error">✗ chrome.storage NOT available</div>`;
    console.log("✗ Chrome storage NOT available");
  }
}

function refreshStorageStatus() {
  checkStorage();
  updateStoredErrors();
}

// Display stored errors
function updateStoredErrors() {
  const el = document.getElementById("stored-errors");
  chrome.storage.local.get({ errors: [] }, (result) => {
    if (!result.errors.length) {
      el.innerHTML = '<div class="status-error">No errors stored yet</div>';
      return;
    }
    
    let html = `<strong>${result.errors.length} errors stored:</strong><br><br>`;
    result.errors.slice(-10).reverse().forEach((e, i) => {
      html += `
        <div style="margin-bottom: 10px; padding: 10px; background: #1e1e1e; border-left: 2px solid #f48771;">
          <div><strong>[${i + 1}] ${e.type}</strong></div>
          <div>Message: ${e.message}</div>
          <div>Source: ${e.source || 'unknown'}</div>
          <div>Time: ${new Date(e.ts).toLocaleTimeString()}</div>
          ${e.result ? `<div>Classification: ${e.result.type} - ${e.result.cause}</div>` : ''}
        </div>
      `;
    });
    el.innerHTML = html;
  });
}

// Test functions
function triggerRuntimeError() {
  console.log("Triggering runtime error...");
  try {
    undefinedVar.someMethod();
  } catch (e) {
    console.log("Error triggered:", e.message);
  }
}

function triggerConsoleError() {
  console.log("Triggering console.error()...");
  console.error("Test error message from diagnostics page");
}

function triggerPromiseRejection() {
  console.log("Triggering promise rejection...");
  Promise.reject(new Error("Test promise rejection from diagnostics"));
}

function clearStorage() {
  chrome.storage.local.set({ errors: [] }, () => {
    console.log("✓ Storage cleared");
    updateStoredErrors();
    checkStorage();
  });
}

// Initialize event listeners
function initEventListeners() {
  const btnRuntime = document.getElementById("btn-runtime");
  const btnConsole = document.getElementById("btn-console");
  const btnPromise = document.getElementById("btn-promise");
  const btnClear = document.getElementById("btn-clear");

  if (btnRuntime) btnRuntime.addEventListener("click", triggerRuntimeError);
  if (btnConsole) btnConsole.addEventListener("click", triggerConsoleError);
  if (btnPromise) btnPromise.addEventListener("click", triggerPromiseRejection);
  if (btnClear) btnClear.addEventListener("click", clearStorage);
}

// Initial checks
setTimeout(() => {
  console.log("=== ConFixr Diagnostics Started ===");
  checkRuntime();
  checkStorage();
  updateStoredErrors();
  initEventListeners();
}, 500);

// Auto-refresh every 2 seconds
setInterval(() => {
  updateStoredErrors();
}, 2000);

console.log("[ConFixr Content] Capture script loaded at", new Date().toISOString());

function sendError(type, payload) {
  console.log("[ConFixr Content] 📤 sendError:", type, "-", payload.message);
  
  try {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[ConFixr Content] ❌ Runtime error:", chrome.runtime.lastError.message);
      } else {
        console.log("[ConFixr Content] ✅ Sent to service worker");
      }
    });
  } catch (e) {
    console.error("[ConFixr Content] ❌ sendError exception:", e.message);
  }
}

console.log("[ConFixr Content] Setting up listeners...");

// JS runtime errors - this should work immediately
const errorHandler = (event) => {
  console.log("[ConFixr Content] 🔴 ERROR EVENT:", event.message);
  if (event.filename && event.lineno) {
    sendError("runtime_error", {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack || null
    });
  }
};
window.addEventListener("error", errorHandler, true); // Use capture phase
console.log("[ConFixr Content] ✅ error listener added");

// Unhandled promise rejections - this should work immediately  
const rejectionHandler = (event) => {
  console.log("[ConFixr Content] 🔴 UNHANDLED REJECTION CAUGHT:", event.reason?.message || String(event.reason));
  console.log("[ConFixr Content] 🔴 Reason type:", typeof event.reason, event.reason);
  console.log("[ConFixr Content] 🔴 Stack:", event.reason?.stack);
  sendError("promise_rejection", {
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack || null
  });
};
window.addEventListener("unhandledrejection", rejectionHandler, true); // Use capture phase
window.addEventListener("unhandledrejection", rejectionHandler, false); // Also try bubble phase
console.log("[ConFixr Content] ✅ unhandledrejection listener added (both capture & bubble)");

// Also set up global error handler as fallback
window.addEventListener("error", (event) => {
  if (event.message?.includes("promise") || event.message?.includes("rejection")) {
    console.log("[ConFixr Content] 🔴 ERROR EVENT (might be promise):", event.message);
  }
}, true);

console.log("[ConFixr Content] Listeners set up. Now wrapping Promise.reject...");

// Wrap Promise.reject to catch all promise rejections
const OriginalPromise = window.Promise;
const _origReject = OriginalPromise.reject;
OriginalPromise.reject = function(reason) {
  console.log("[ConFixr Content] 🔴 PROMISE.REJECT CALLED:", reason?.message || String(reason));
  sendError("promise_rejection_direct", {
    message: reason?.message || String(reason),
    stack: reason?.stack || null
  });
  return _origReject.call(OriginalPromise, reason);
};
console.log("[ConFixr Content] ✅ Promise.reject wrapped");

console.log("[ConFixr Content] Now wrapping console...");

// Wrap console.error and console.warn with robust approach
setTimeout(() => {
  console.log("[ConFixr Content] Setting up console overrides...");
  
  // Store originals
  const _origError = window.console.error;
  const _origWarn = window.console.warn;
  
  // Create wrapper for error
  window.console.error = function(...args) {
    console.log("[ConFixr Content] 🔴 CONSOLE.ERROR:", args[0]);
    sendError("console_error", {
      message: args.map(String).join(" "),
      args
    });
    return _origError.apply(window.console, args);
  };
  
  // Create wrapper for warn
  window.console.warn = function(...args) {
    console.log("[ConFixr Content] 🟡 CONSOLE.WARN:", args[0]);
    sendError("console_warn", {
      message: args.map(String).join(" "),
      args
    });
    return _origWarn.apply(window.console, args);
  };
  
  console.log("[ConFixr Content] ✅ Console overrides complete");
}, 100);

// Wrap fetch
console.log("[ConFixr Content] Wrapping fetch...");
const origFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const res = await origFetch.apply(this, args);
    if (!res.ok) {
      console.log("[ConFixr Content] 🔴 FETCH ERROR:", res.status);
      sendError("network_error", {
        url: args[0],
        status: res.status,
        statusText: res.statusText
      });
    }
    return res;
  } catch (err) {
    console.log("[ConFixr Content] 🔴 FETCH EXCEPTION:", err.message);
    sendError("fetch_exception", {
      url: args[0],
      message: err.message
    });
    throw err;
  }
};

console.log("[ConFixr Content] ✅ All setup complete!");
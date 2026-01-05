// This script runs in the MAIN world (page context)
// It captures errors and sends them to the content script via postMessage

(function () {
  const extensionId = document.currentScript?.dataset?.extensionId;

  function sendToContentScript(payload) {
    window.postMessage({ type: "CONFIXR_ERROR", payload }, "*");
  }

  // 1. Capture Global Runtime Errors
  window.addEventListener("error", (event) => {
    sendToContentScript({
      source: "runtime",
      message: event.message,
      file: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack || null,
    });
  });

  // 2. Capture Unhandled Promise Rejections
  window.addEventListener("unhandledrejection", (event) => {
    sendToContentScript({
      source: "promise",
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack || null,
    });
  });

  // 3. Patch console.error
  const originalError = console.error;
  console.error = function (...args) {
    sendToContentScript({
      source: "console",
      message: args
        .map((arg) => {
          try {
            return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return String(arg);
          }
        })
        .join(" "),
    });
    originalError.apply(console, args);
  };

  console.log("ConFixr Console Observer Active");
})();

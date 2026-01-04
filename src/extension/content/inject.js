// Injected into the real page context
(function () {
  const ORIGINAL_ERROR = console.error;

  function post(payload) {
    window.postMessage(
      {
        source: "CONFIXR_INJECT",
        type: "CONSOLE_EVENT",
        payload
      },
      "*"
    );
  }

  // Intercept console.error
  console.error = function (...args) {
    try {
      const first = args?.[0];

      post({
        kind: "console.error",
        message: String(first?.message || first || "Console error"),
        stack: first?.stack || new Error().stack,
        args,
        timestamp: Date.now()
      });
    } catch (_) {}

    return ORIGINAL_ERROR.apply(console, args);
  };

  // window.onerror (runtime crash)
  window.addEventListener("error", (e) => {
    post({
      kind: "window.onerror",
      message: e.message,
      stack: e.error?.stack || e.filename,
      timestamp: Date.now()
    });
  });

  // Unhandled Promise rejection
  window.addEventListener("unhandledrejection", (e) => {
    post({
      kind: "unhandledrejection",
      message: e.reason?.message || "Unhandled Promise Rejection",
      stack: e.reason?.stack,
      timestamp: Date.now()
    });
  });
})();
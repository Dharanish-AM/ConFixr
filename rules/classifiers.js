/**
 * ConFixr — Error Classifier
 * Pure rules engine (no AI) for fast local classification
 *
 * Works in:
 *  - background service worker (MV3)
 *  - content scripts
 *  - devtools panel
 */

function normalize(str = "") {
  return String(str).toLowerCase();
}

function contains(msg, patterns = []) {
  return patterns.some(p => msg.includes(p));
}

function classifyCORS(msg) {
  if (
    contains(msg, [
      "cors",
      "cross-origin",
      "has been blocked by cors policy",
      "access-control-allow-origin",
      "preflight",
      "no 'access-control-allow-origin'",
      "preflight request doesn't pass",
      "request header field authorization"
    ])
  ) {
    return {
      type: "CORS",
      cause: "Cross-origin request blocked by server policy",
      hints: [
        "Ensure backend sets Access-Control-Allow-Origin",
        "Match protocol, domain, and port (no http/https mix)",
        "Handle OPTIONS preflight requests on server",
        "Avoid wildcards when sending credentials/cookies"
      ]
    };
  }
  return null;
}

function classifyCSP(msg) {
  if (
    contains(msg, [
      "content security policy",
      "violates the following content security policy directive",
      "refused to load the script",
      "refused to connect",
      "blocked by csp"
    ])
  ) {
    return {
      type: "CSP",
      cause: "Request blocked by Content Security Policy",
      hints: [
        "Update script-src / connect-src directives",
        "Add domain to CSP or use hashed scripts",
        "Avoid inline scripts unless using nonce/hash",
        "Check extension or devtools injected scripts"
      ]
    };
  }
  return null;
}

function classifyMIME(msg) {
  if (
    contains(msg, [
      "failed to load",
      "mime",
      "text/html is not a supported mime type",
      "was served with an incorrect content-type",
      "refused to execute script",
      "expected 'application/javascript'"
    ])
  ) {
    return {
      type: "MIME_TYPE",
      cause: "Resource served with incorrect Content-Type",
      hints: [
        "Serve JS as application/javascript",
        "Serve CSS as text/css",
        "Verify CDN / reverse proxy headers",
        "Check index.html mistakenly returned for JS files"
      ]
    };
  }
  return null;
}

function classifyNetwork(msg) {
  if (
    contains(msg, [
      "net::",
      "failed to fetch",
      "dns",
      "timed out",
      "connection refused",
      "server ip address could not be found"
    ])
  ) {
    return {
      type: "NETWORK",
      cause: "Network failure or unreachable resource",
      hints: [
        "Verify URL / base path",
        "Check VPN / proxy / adblock interference",
        "Ensure HTTPS certificate validity",
        "Confirm server is online"
      ]
    };
  }
  return null;
}

function classifyRuntime(msg) {
  if (
    contains(msg, [
      "undefined",
      "is not a function",
      "cannot read properties of",
      "cannot read property",
      "null",
      "typeerror",
      "referenceerror"
    ])
  ) {
    return {
      type: "JS_RUNTIME",
      cause: "Runtime exception during execution",
      hints: [
        "Check null / undefined values before access",
        "Verify imports and module loading",
        "Ensure function binding / context",
        "Guard optional fields (?. operator)"
      ]
    };
  }
  return null;
}

function classifyFramework(msg) {
  if (contains(msg, ["react", "hydration", "hook", "render"])) {
    return {
      type: "FRAMEWORK_REACT",
      cause: "React runtime or hydration error",
      hints: [
        "Ensure server + client markup matches",
        "Avoid accessing window during SSR",
        "Check state / hook dependency ordering"
      ]
    };
  }

  if (contains(msg, ["angular", "zone", "template parse"])) {
    return {
      type: "FRAMEWORK_ANGULAR",
      cause: "Angular runtime / template issue",
      hints: [
        "Validate template bindings",
        "Check async pipe + lifecycle states"
      ]
    };
  }

  if (contains(msg, ["vite", "webpack", "hmr"])) {
    return {
      type: "BUILD_TOOL",
      cause: "Dev bundler / hot-reload error",
      hints: [
        "Restart dev server",
        "Clear cache / node_modules",
        "Verify module path resolution"
      ]
    };
  }

  return null;
}

function classifyGeneric(msg) {
  return {
    type: "UNKNOWN",
    cause: "Unclassified error",
    hints: [
      "Open DevTools to inspect full stacktrace",
      "Check network tab & request headers",
      "Verify environment / build config"
    ]
  };
}

function classify(error = {}) {
  const msg = normalize(error.message || error.stack || "");

  return (
    classifyCORS(msg) ||
    classifyCSP(msg) ||
    classifyMIME(msg) ||
    classifyNetwork(msg) ||
    classifyRuntime(msg) ||
    classifyFramework(msg) ||
    classifyGeneric(msg)
  );
}

// Export for ES modules
export { classify };

// expose in service worker / importScripts
if (typeof self !== "undefined") {
  self.classify = classify;
}
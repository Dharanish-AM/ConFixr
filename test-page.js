const logEl = document.getElementById("log");

function log(msg) {
  logEl.innerHTML += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function testRuntimeError() {
  log("❌ Testing: Runtime Error");
  try {
    undefinedVariable.someMethod();
  } catch (e) {
    log(`   Error: ${e.message}`);
  }
}

function testConsoleError() {
  log("❌ Testing: console.error()");
  console.error("Test error message from page");
}

function testConsoleWarn() {
  log("⚠️  Testing: console.warn()");
  console.warn("Test warning message from page");
}

function testPromiseRejection() {
  log("❌ Testing: Promise Rejection");
  Promise.reject(new Error("Intentional promise rejection"));
}

function testFetchError() {
  log("❌ Testing: Fetch Error (404)");
  fetch("/api/non-existent-endpoint")
    .then(r => {
      if (!r.ok) {
        log(`   Got 404 response`);
      }
    })
    .catch(e => log(`   Error: ${e.message}`));
}

function testCORSError() {
  log("❌ Testing: CORS Error");
  fetch("https://different-origin.example.com/api")
    .catch(e => log(`   CORS error caught: ${e.message}`));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  log("✅ Test page loaded!");
  log("💡 Click buttons above to trigger errors");
  log("📍 ConFixr will capture them in background");
  log("🔍 Check popup to see captured errors");

  // Add event listeners to buttons
  const btnRuntime = document.getElementById("test-runtime");
  const btnConsole = document.getElementById("test-console");
  const btnWarn = document.getElementById("test-warn");
  const btnPromise = document.getElementById("test-promise");
  const btnFetch = document.getElementById("test-fetch");
  const btnCors = document.getElementById("test-cors");

  if (btnRuntime) btnRuntime.addEventListener("click", testRuntimeError);
  if (btnConsole) btnConsole.addEventListener("click", testConsoleError);
  if (btnWarn) btnWarn.addEventListener("click", testConsoleWarn);
  if (btnPromise) btnPromise.addEventListener("click", testPromiseRejection);
  if (btnFetch) btnFetch.addEventListener("click", testFetchError);
  if (btnCors) btnCors.addEventListener("click", testCORSError);
});

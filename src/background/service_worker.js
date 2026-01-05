importScripts(
  "../utils/config.js",
  "../services/ai_service.js",
  "../utils/id.js"
);

function saveError(analysis) {
  chrome.storage.local.get({ errors: [] }, (data) => {
    // If updating an existing error (retry), replace it
    let errors = data.errors;
    const existingIndex = errors.findIndex((e) => e.id === analysis.id);

    if (existingIndex !== -1) {
      errors[existingIndex] = analysis;
    } else {
      errors.push(analysis);
      if (errors.length > 50) errors.shift();
    }

    chrome.storage.local.set({ errors });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "RETRY_ANALYSIS") {
    const { id, raw, tabId } = msg.payload;
    analyzeError(raw).then((analysis) => {
      analysis.id = id;
      analysis.tabId = tabId;
      saveError(analysis);
      chrome.runtime.sendMessage({ type: "ANALYSIS_RESULT", analysis });
    });
  }

  if (msg.type === "PAGE_ERROR") {
    const tabId = sender.tab ? sender.tab.id : null;
    const errorId = generateId();

    analyzeError(msg.payload).then((analysis) => {
      analysis.id = errorId;
      analysis.tabId = tabId;
      saveError(analysis);
      chrome.runtime.sendMessage({ type: "ANALYSIS_RESULT", analysis });
    });
  }
  return true;
});

// Web request failures
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const tabId = details.tabId;
    if (tabId === -1) return;
    const errorId = generateId();

    analyzeError({
      source: "network",
      url: details.url,
      error: details.error,
    }).then((analysis) => {
      analysis.id = errorId;
      analysis.tabId = tabId;
      saveError(analysis);
      chrome.runtime.sendMessage({ type: "ANALYSIS_RESULT", analysis });
    });
  },
  { urls: ["<all_urls>"] }
);

// HTTP Errors
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const tabId = details.tabId;
    if (tabId === -1) return;

    if (details.statusCode >= 400) {
      const errorId = generateId();
      analyzeError({
        source: "network",
        url: details.url,
        error: `HTTP ${details.statusCode}`,
      }).then((analysis) => {
        analysis.id = errorId;
        analysis.tabId = tabId;
        saveError(analysis);
        chrome.runtime.sendMessage({ type: "ANALYSIS_RESULT", analysis });
      });
    }
  },
  { urls: ["<all_urls>"] }
);

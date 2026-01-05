import { classify } from "../rules/classifiers.js";

console.log("[Service Worker] ConFixr worker.js loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[Service Worker] Message received from", sender.tab?.url);
  console.log("[Service Worker] Message content:", msg);

  try {
    // Classify the error
    const classified = classify(msg.payload);
    console.log("[Service Worker] Error classified as:", classified.type);

    // Create error record
    const errorRecord = {
      id: Date.now(),
      ts: Date.now(),
      type: msg.type,
      message: msg.payload.message || "(no message)",
      source: msg.payload.source || sender.tab?.url,
      line: msg.payload.line,
      column: msg.payload.column,
      stack: msg.payload.stack,
      result: classified
    };

    // Store in local storage
    chrome.storage.local.get({ errors: [] }, ({ errors }) => {
      errors.push(errorRecord);
      // Keep last 200 errors
      if (errors.length > 200) {
        errors = errors.slice(-200);
      }
      chrome.storage.local.set({ errors }, () => {
        console.log("[Service Worker] Error stored. Total errors:", errors.length);
        sendResponse({ success: true });
      });
    });
  } catch (error) {
    console.error("[Service Worker] Error processing message:", error);
    sendResponse({ success: false, error: error.message });
  }

  // Return true to indicate async response
  return true;
});
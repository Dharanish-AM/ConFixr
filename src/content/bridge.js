// Listen for messages from the page script (injected via manifest)
window.addEventListener("message", (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data?.type === "CONFIXR_ERROR") {
    chrome.runtime.sendMessage({
      type: "PAGE_ERROR",
      payload: event.data.payload,
    });
  }
});

// Inject inject.js into the real page context
const script = document.createElement("script");
script.src = chrome.runtime.getURL("content/inject.js");
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen for events from injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "CONFIXR_INJECT") return;

  chrome.runtime.sendMessage({
    type: "RUNTIME_EVENT",
    payload: event.data.payload
  });
});
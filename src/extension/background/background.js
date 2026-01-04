// Background script: bridges runtime error signals to the DevTools panel.

// Keep track of connected DevTools ports (optional future use)
const devtoolsPorts = new Set();

// Handle messages from content/bridge.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === "RUNTIME_EVENT") {
		const payload = message.payload || {};

		// TODO: plug in real pipeline; for now emit a stub reasoning result
		const result = buildStubResult(payload);

		// Broadcast to panel listeners
		chrome.runtime.sendMessage({ type: "REASONING_COMPLETE", payload: result });

		sendResponse?.({ received: true });
		return true;
	}
});

function buildStubResult(payload) {
	const now = Date.now();
	return {
		frameId: payload.kind || "runtime-event",
		timestamp: now,
		classification: {
			category: guessCategory(payload.message),
			reasoning: "Heuristic stub classification based on message content"
		},
		rootCause: {
			hypothesis: payload.message || "Console error",
			origin: "FRONTEND",
			severity: "MEDIUM",
			trigger: payload.kind || "console.error",
			message: payload.message
		},
		fixes: {
			fixes: [
				{
					title: "Add defensive check",
					code: "if (value != null) { /* use value */ }",
					explanation: "Guard against undefined/null before access"
				}
			],
			prevention: "Validate inputs and add null guards at call sites",
			safePatterns: ["null-check", "optional-chaining"]
		},
		validation: {
			stackMatch: 0.6,
			signalStrength: 0.5,
			asyncCorrectness: payload.kind === "unhandledrejection" ? 0.8 : 0.6
		},
		confidence: 0.65
	};
}

function guessCategory(message = "") {
	const msg = message.toLowerCase();
	if (msg.includes("undefined") || msg.includes("null")) return "NULL_UNDEFINED_ACCESS";
	if (msg.includes("promise") || msg.includes("async")) return "ASYNC_PROMISE_FAILURE";
	if (msg.includes("typeerror")) return "TYPE_MISMATCH";
	return "UNKNOWN";
}

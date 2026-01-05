const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

async function analyzeError(err) {
  const errorDetails = JSON.stringify(err, null, 2);

  const prompt = `
    You are an expert web development debugging assistant called "ConFixr".
    Analyze the following browser error and provide a fix and reasoning.
    
    Error Details:
    ${errorDetails}
    
    Return ONLY a raw JSON object (no markdown formatting) with the following structure:
    {
      "classification": "string (e.g., SyntaxError, NetworkError, CORS)",
      "suggestion": "string (concise actionable fix)",
      "reasoning": "string (explanation of why this happened, keep it short and clear)"
    }
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (response.status === 429) {
      return {
        classification: "Analysis Pending (Quota Exceeded)",
        suggestion:
          "The AI service is currently busy (Rate Limit Reached). Please retry in a few seconds.",
        reasoning: "You have exceeded the free tier quota for the Gemini API.",
        raw: err,
        retryable: true,
      };
    }

    const data = await response.json();

    // Log full data for debugging
    console.log("Gemini API Response:", data);

    if (data.error) {
      throw new Error(data.error.message || "Gemini API Error");
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      // Handle safety blocks or empty responses
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
      }
      throw new Error("No candidates returned from Gemini");
    }

    const textOrJson = candidate.content?.parts?.[0]?.text;
    if (!textOrJson) throw new Error("Empty text in candidate");

    // Clean up potential markdown code blocks if the model adds them
    const cleanJson = textOrJson.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse JSON:", cleanJson);
      throw new Error("Invalid JSON from Gemini");
    }

    return {
      raw: err,
      ...result,
    };
  } catch (apiError) {
    console.error("Gemini Analysis Failed:", apiError);
    return {
      raw: err,
      classification: "Analysis Failed",
      suggestion: "Manual investigation required.",
      reasoning: `AI analysis failed: ${
        apiError.message || "Unknown error"
      }. Check console for details.`,
    };
  }
}

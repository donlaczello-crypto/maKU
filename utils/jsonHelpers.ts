
/**
 * Safely parses a JSON string that might be wrapped in Markdown code blocks.
 * Gemini often returns JSON like:
 * ```json
 * { ... }
 * ```
 * This function strips the markdown markers and parses the content.
 */
export const cleanAndParseJson = <T>(text: string): T => {
    if (!text) {
        throw new Error("Received empty response from AI.");
    }

    let cleanText = text.trim();

    // Remove wrapping ```json ... ``` or ``` ... ```
    if (cleanText.startsWith('```')) {
        // Remove the first line (e.g., ```json)
        cleanText = cleanText.replace(/^```[a-z]*\n?/, '');
        // Remove the last line (```)
        cleanText = cleanText.replace(/```$/, '');
    }

    try {
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("JSON Parse Error on text:", cleanText);
        throw new Error("Failed to parse AI response as JSON. The model might be hallucinating plain text.");
    }
};

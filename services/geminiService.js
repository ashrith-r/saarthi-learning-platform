import axios from "axios";
import config from "../config/config.js";

export async function generateQuestionFromAI({ prompt, subject, chapter, difficulty }) {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
  }

  const systemInstruction = `You are an educational assessment writer. Generate one accurate multiple-choice question using the supplied topic, subject, chapter and difficulty context. Do not assume a specific exam board or add unsupported curriculum details.
You must respond with a valid JSON object matching the following structure:
{
  "question_text": "The text of the question. Must be clear and grammatically correct.",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctOption": 0,
  "tags": ["tag1", "tag2"],
  "solution_text": "A detailed step-by-step explanation showing how to solve the question.",
  "chapter": "Suggested chapter name"
}`;

  const userPrompt = `Generate an MCQ.
Topic/Prompt: ${prompt}
Subject: ${subject || "Not specified"}
Chapter Context: ${chapter || ""}
Difficulty Level: ${difficulty || "Medium"}

Remember: Return ONLY valid JSON, do not wrap it in markdown code blocks like \`\`\`json.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.GEMINI_MODEL)}:generateContent`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await axios.post(url, payload, { timeout: 30000, headers: { "x-goog-api-key": apiKey } });
    const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error("Invalid response format from Gemini API.");
    }

    const parsedData = JSON.parse(resultText.trim());
    if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData) ||
      typeof parsedData.question_text !== 'string' || !parsedData.question_text.trim() ||
      !Array.isArray(parsedData.options) || parsedData.options.length !== 4 ||
      parsedData.options.some(option => typeof option !== 'string' || !option.trim()) ||
      !Number.isInteger(parsedData.correctOption) || parsedData.correctOption < 0 || parsedData.correctOption > 3 ||
      !Array.isArray(parsedData.tags) || parsedData.tags.length < 1 || parsedData.tags.length > 3 ||
      parsedData.tags.some(tag => typeof tag !== 'string' || !tag.trim()) ||
      typeof parsedData.solution_text !== 'string' || !parsedData.solution_text.trim()) {
      throw new Error('AI returned an incomplete question. Review the prompt and try again.');
    }
    return parsedData;
  } catch (error) {
    console.error("Gemini Generation Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message || "Failed to contact Gemini API");
  }
}

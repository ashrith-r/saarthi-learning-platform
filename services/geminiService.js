import axios from "axios";
import config from "../config/config.js";

export async function generateQuestionFromAI({ prompt, subject, chapter, difficulty }) {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
  }

  const systemInstruction = `You are a professional educational assessment creator for academic exams (like JEE, NEET, IOE). Generate a single multiple-choice question on the specified topic.
You must respond with a valid JSON object matching the following structure:
{
  "question_text": "The text of the question. Must be clear and grammatically correct.",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctOption": 0, // 0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D
  "tags": ["tag1", "tag2"], // list of 1-3 relevant sub-topic tags
  "solution_text": "A detailed step-by-step explanation showing how to solve the question.",
  "chapter": "Suggested chapter name"
}`;

  const userPrompt = `Generate an MCQ.
Topic/Prompt: ${prompt}
Subject: ${subject || "General"}
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
    return parsedData;
  } catch (error) {
    console.error("Gemini Generation Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message || "Failed to contact Gemini API");
  }
}

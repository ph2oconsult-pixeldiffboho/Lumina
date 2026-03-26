import { GoogleGenAI, Type } from "@google/genai";

console.log("import.meta.env:", import.meta.env);
const apiKey = process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing!");
  throw new Error("Gemini API key is not configured. Please contact support.");
}
const ai = new GoogleGenAI({ apiKey });

export async function generateModuleContent(topic: string, track: string, age: number) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a personal development lesson for a ${age}-year-old child in the ${track} track. The specific challenge or topic is: "${topic}".`,
    config: {
      systemInstruction: `You are a world-class child development expert and storyteller. 
    Create a personal development lesson tailored to the child's age and specific situation.
    The tone should be engaging, empathetic, and clear.
    For 5-10 year olds (Foundations track), use magical or highly relatable stories. 
    For 11-16 year olds (Expeditions track), use mature metaphors, real-world scenarios, and respect their growing independence.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A catchy, uplifting title for the lesson" },
          description: { type: Type.STRING, description: "A short 1-sentence summary of the lesson" },
          category: { type: Type.STRING, description: "The broad category, e.g., Resilience, Digital Wellbeing, Emotional Intelligence" },
          keyConcept: { type: Type.STRING, description: "The core value being taught, e.g., Agency, Empathy, Courage" },
          content: { type: Type.STRING, description: "The main story or metaphor (Markdown formatted)" },
          parentGuide: { type: Type.STRING, description: "3-5 discussion prompts for the parent (Markdown formatted)" },
          activity: { type: Type.STRING, description: "A simple physical, creative, or reflective activity (Markdown formatted)" }
        },
        required: ["title", "description", "category", "keyConcept", "content", "parentGuide", "activity"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
}

export async function generateAudio(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

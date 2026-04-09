import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";

let engine: MLCEngine | null = null;

export const initWebLLM = async (
  modelId: string = "gemma-2-2b-it-q4f32_1-MLC",
  onProgress?: (info: { text: string; progress: number }) => void
) => {
  if (engine) return engine;
  
  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (info) => {
      if (onProgress) onProgress({ text: info.text, progress: info.progress });
    }
  });
  
  return engine;
};

export const generateWebLLMCompletion = async (
  prompt: string,
  system?: string,
  format?: 'json'
) => {
  if (!engine) throw new Error("WebLLM engine not initialized");
  
  const messages = [];
  let finalSystem = system;
  
  if (format === 'json') {
    finalSystem = (system || "") + "\n\nIMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide.";
  }

  if (finalSystem) {
    messages.push({ role: "system", content: finalSystem });
  }
  messages.push({ role: "user", content: prompt });
  
  const reply = await engine.chat.completions.create({
    messages,
    // Désactivé temporairement car cause une erreur de binding Wasm (std::string)
    // response_format: format === 'json' ? { type: "json_object" } : undefined,
  });
  
  return reply.choices[0].message.content;
};

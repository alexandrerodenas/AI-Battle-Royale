import { pipeline, env } from '@huggingface/transformers';

// Configure transformers to use WebGPU
env.allowLocalModels = false;

let generator: any = null;

export const initTransformers = async (
  modelId: string = "onnx-community/gemma-4-E2B-it-ONNX",
  onProgress?: (info: { text: string; progress: number }) => void
) => {
  if (generator) return generator;

  generator = await pipeline('text-generation', modelId, {
    device: 'webgpu',
    dtype: 'fp32', // or 'fp16' if supported
    progress_callback: (info: any) => {
      if (onProgress && info.status === 'progress') {
        onProgress({ 
          text: `Téléchargement de ${info.file}...`, 
          progress: info.progress 
        });
      }
    }
  });

  return generator;
};

export const generateTransformersCompletion = async (
  prompt: string,
  system?: string,
  format?: 'json'
) => {
  if (!generator) throw new Error("Transformers engine not initialized");

  const messages = [];
  if (system) {
    messages.push({ role: "system", content: system });
  }
  
  let finalPrompt = prompt;
  if (format === 'json') {
    finalPrompt += "\n\nIMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide.";
  }
  messages.push({ role: "user", content: finalPrompt });

  const output = await generator(messages, {
    max_new_tokens: 1024,
    temperature: 0.7,
    do_sample: true,
    return_full_text: false,
  });

  return output[0].generated_text;
};

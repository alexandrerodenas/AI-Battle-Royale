export const fetchModels = async (baseUrl: string) => {
  try {
    // Trim trailing slash
    const url = baseUrl.replace(/\/$/, '');
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return data.models.map((m: any) => m.name);
  } catch (e) {
    console.error(e);
    throw new Error('Could not connect to Ollama. Make sure it is running and CORS is enabled (OLLAMA_ORIGINS="*").');
  }
};

export const generateCompletion = async (
  baseUrl: string,
  model: string,
  prompt: string,
  system?: string,
  format?: 'json'
) => {
  const url = baseUrl.replace(/\/$/, '');
  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: false,
      format,
    }),
  });
  if (!res.ok) throw new Error('Failed to generate completion');
  const data = await res.json();
  return data.response;
};

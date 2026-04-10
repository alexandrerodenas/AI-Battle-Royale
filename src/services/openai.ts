export const fetchOpenAIModels = async (baseUrl: string, apiKey: string) => {
  try {
    const url = baseUrl.replace(/\/$/, '');
    const res = await fetch(`${url}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return data.data.map((m: any) => m.id);
  } catch (e) {
    console.error(e);
    throw new Error('Could not connect to OpenAI-like API. Check the URL and API Key.');
  }
};

export const generateOpenAICompletion = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  system?: string,
  format?: 'json'
) => {
  const url = baseUrl.replace(/\/$/, '');
  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: format === 'json' ? { type: 'json_object' } : undefined,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to generate completion from OpenAI-like API');
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

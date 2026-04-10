import { useState } from 'react';
import { fetchModels } from '../services/ollama';
import { fetchOpenAIModels } from '../services/openai';
import { Server, Cpu, Play, MonitorPlay, Globe, Key } from 'lucide-react';

export default function SetupScreen({ engine }: { engine: any }) {
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    engine.setError(null);
    try {
      if (engine.engineType === 'ollama') {
        const m = await fetchModels(engine.ollamaUrl);
        setModels(m);
        if (m.length > 0) engine.setSelectedModel(m[0]);
      } else if (engine.engineType === 'openai') {
        const m = await fetchOpenAIModels(engine.openaiUrl, engine.openaiKey);
        setModels(m);
        if (m.length > 0) engine.setOpenaiModel(m[0]);
      }
    } catch (e: any) {
      engine.setError(e.message);
    }
    setIsLoadingModels(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl shadow-fuchsia-900/20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">Configuration du Système</h2>
        <p className="text-slate-400">Choisissez votre moteur d'inférence pour commencer.</p>
      </div>

      <div className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => { engine.setEngineType('ollama'); setModels([]); }}
          className={`flex-1 min-w-fit px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${engine.engineType === 'ollama' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Server className="w-5 h-5" /> Ollama
        </button>
        <button
          onClick={() => { engine.setEngineType('openai'); setModels([]); }}
          className={`flex-1 min-w-fit px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${engine.engineType === 'openai' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Globe className="w-5 h-5" /> OpenAI-Like
        </button>
        <button
          onClick={() => { engine.setEngineType('webgpu'); setModels([]); }}
          className={`flex-1 min-w-fit px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${engine.engineType === 'webgpu' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <MonitorPlay className="w-5 h-5" /> WebGPU
        </button>
      </div>

      <div className="space-y-6">
        {engine.engineType === 'ollama' && (
          <>
            <div className="space-y-2 animate-in fade-in">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                <Server className="w-4 h-4 text-fuchsia-500" /> URL Ollama
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={engine.ollamaUrl}
                  onChange={(e) => engine.setOllamaUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all font-mono"
                />
                <button
                  onClick={handleFetchModels}
                  disabled={isLoadingModels}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  Connecter
                </button>
              </div>
              <p className="text-xs text-slate-500">Assurez-vous qu'Ollama tourne avec OLLAMA_ORIGINS="*"</p>
            </div>

            {models.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-cyan-500" /> Sélectionner un Modèle
                </label>
                <select
                  value={engine.selectedModel}
                  onChange={(e) => engine.setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono appearance-none"
                >
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        {engine.engineType === 'openai' && (
          <>
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-emerald-500" /> Endpoint URL
                </label>
                <input
                  type="text"
                  value={engine.openaiUrl}
                  onChange={(e) => engine.setOpenaiUrl(e.target.value)}
                  placeholder="https://api.openai.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                  <Key className="w-4 h-4 text-emerald-500" /> Clé API
                </label>
                <input
                  type="password"
                  value={engine.openaiKey}
                  onChange={(e) => engine.setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-emerald-500" /> Modèle
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={engine.openaiModel}
                    onChange={(e) => engine.setOpenaiModel(e.target.value)}
                    placeholder="gpt-4o"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  <button
                    onClick={handleFetchModels}
                    disabled={isLoadingModels || !engine.openaiKey}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    Liste
                  </button>
                </div>
              </div>

              {models.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modèles détectés</label>
                  <select
                    value={engine.openaiModel}
                    onChange={(e) => engine.setOpenaiModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono appearance-none"
                  >
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>
          </>
        )}

        {engine.engineType === 'webgpu' && (
          <div className="space-y-4 animate-in fade-in bg-slate-950 p-6 rounded-xl border border-cyan-900/50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-900/30 rounded-lg text-cyan-400">
                <MonitorPlay className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-200">Gemma-2-2B WebGPU</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Le modèle sera téléchargé et exécuté directement dans votre navigateur en utilisant la carte graphique de votre appareil.
                  Aucune installation locale n'est requise.
                </p>
                <p className="text-xs text-cyan-500 mt-2 font-mono">Modèle: gemma-2-2b-it-q4f32_1-MLC</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => engine.generateAgents(16)}
          disabled={
            (engine.engineType === 'ollama' && !engine.selectedModel) ||
            (engine.engineType === 'openai' && !engine.openaiModel)
          }
          className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-fuchsia-900/50"
        >
          <Play className="w-6 h-6" />
          Générer les Combattants
        </button>
      </div>
    </div>
  );
}

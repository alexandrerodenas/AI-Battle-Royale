import { useState } from 'react';
import { fetchModels } from '../services/ollama';
import { Server, Cpu, Play } from 'lucide-react';

export default function SetupScreen({ engine }: { engine: any }) {
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    engine.setError(null);
    try {
      const m = await fetchModels(engine.ollamaUrl);
      setModels(m);
      if (m.length > 0) engine.setSelectedModel(m[0]);
    } catch (e: any) {
      engine.setError(e.message);
    }
    setIsLoadingModels(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl shadow-fuchsia-900/20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">Configuration du Système</h2>
        <p className="text-slate-400">Connectez-vous à votre instance Ollama locale pour commencer.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
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

        <button
          onClick={() => engine.generateAgents(16)}
          disabled={!engine.selectedModel}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-fuchsia-900/50"
        >
          <Play className="w-6 h-6" />
          Générer les Combattants
        </button>
      </div>
    </div>
  );
}

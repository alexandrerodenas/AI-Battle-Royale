import { useState } from 'react';
import { Agent } from '../types';
import { Swords, UserPlus, Library, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function RosterScreen({ engine }: { engine: any }) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number | null>(null);

  const isGenerating = engine.gameState === 'generating_agents';
  const totalAgents = 16;
  const currentCount = engine.agents.length;

  const handleReplace = (fav: Agent) => {
    if (selectedAgentIndex !== null) {
      engine.replaceAgent(selectedAgentIndex, fav);
      setShowLibrary(false);
      setSelectedAgentIndex(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-fuchsia-400">
            {isGenerating ? 'Invocation des Combattants...' : 'Les Concurrents'}
          </h2>
          <p className="text-slate-400 mt-2">
            {isGenerating 
              ? `Génération de l'agent ${currentCount + 1} sur ${totalAgents}...` 
              : '16 Agents IA prêts à combattre. Survolez-les pour voir leur personnalité.'}
          </p>
        </div>
        
        {!isGenerating && (
          <div className="flex gap-4">
            <button
              onClick={() => setShowLibrary(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center gap-2"
            >
              <Library className="w-5 h-5" />
              Bibliothèque
            </button>
            <button
              onClick={engine.startTournament}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xl transition-all shadow-lg shadow-fuchsia-900/50 flex items-center gap-3"
            >
              <Swords className="w-6 h-6" />
              Lancer le Tournoi
            </button>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-800 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentCount / totalAgents) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {engine.agents.map((agent: Agent, index: number) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            key={agent.id}
            className={`bg-slate-900 border ${isGenerating ? 'border-slate-800' : 'border-slate-800 hover:border-cyan-500 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(217,70,239,0.3)] hover:z-50'} p-4 rounded-xl transition-all duration-300 group relative flex flex-col`}
          >
            {!isGenerating && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            )}
            
            {/* Swap Button */}
            {!isGenerating && (
              <button 
                onClick={() => {
                  setSelectedAgentIndex(index);
                  setShowLibrary(true);
                }}
                className="absolute top-2 right-2 p-2 bg-slate-800/80 hover:bg-cyan-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 text-slate-300 hover:text-white"
                title="Remplacer cet agent"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform duration-300 relative z-10">{agent.avatar}</div>
            <h3 className="font-bold text-center truncate relative z-10 text-lg">{agent.name}</h3>
            
            {agent.catchphrase && (
              <div className="mt-2 inline-block mx-auto bg-fuchsia-900/30 text-fuchsia-300 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border border-fuchsia-500/30 relative z-10 text-center line-clamp-1">
                "{agent.catchphrase}"
              </div>
            )}

            <div className="mt-auto pt-4 text-xs font-mono text-cyan-400 truncate relative z-10 text-center">
              Exp: {agent.expertise}
            </div>

            {/* Hover Tooltip for Personality */}
            {!isGenerating && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-72 p-4 bg-slate-950 text-slate-200 text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all border border-cyan-500/50 scale-95 group-hover:scale-100 origin-bottom text-left space-y-2">
                <div><span className="font-bold text-cyan-400">Identité :</span> {agent.identity || agent.personality}</div>
                {agent.languageStyle && <div><span className="font-bold text-cyan-400">Style :</span> {agent.languageStyle}</div>}
                {agent.constraints && <div><span className="font-bold text-cyan-400">Contraintes :</span> {agent.constraints}</div>}
                {agent.objective && <div><span className="font-bold text-cyan-400">Objectif :</span> {agent.objective}</div>}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 border-b border-r border-cyan-500/50 rotate-45"></div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Loading skeleton for the current agent being generated */}
        {isGenerating && currentCount < totalAgents && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
            className="bg-slate-900/50 border border-slate-800 border-dashed p-4 rounded-xl flex flex-col items-center justify-center min-h-[200px]"
          >
            <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mb-4" />
            <div className="h-4 w-24 bg-slate-800 rounded animate-pulse"></div>
            <div className="mt-4 space-y-2 w-full">
              <div className="h-2 w-full bg-slate-800 rounded animate-pulse"></div>
              <div className="h-2 w-2/3 bg-slate-800 rounded animate-pulse mx-auto"></div>
            </div>
          </motion.div>
        )}

        {/* Empty slots for remaining agents */}
        {isGenerating && Array.from({ length: Math.max(0, totalAgents - currentCount - 1) }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex items-center justify-center min-h-[200px] opacity-50">
            <div className="text-slate-800 font-black text-4xl">?</div>
          </div>
        ))}
      </div>

      {showLibrary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Library className="text-fuchsia-500" /> Bibliothèque d'Agents
              </h3>
              <button onClick={() => { setShowLibrary(false); setSelectedAgentIndex(null); }} className="text-slate-400 hover:text-white">Fermer</button>
            </div>
            
            {selectedAgentIndex !== null && (
              <div className="bg-cyan-900/20 border-b border-cyan-900/50 p-4 text-center text-cyan-300 text-sm">
                Sélectionnez un agent favori pour remplacer <strong>{engine.agents[selectedAgentIndex]?.name}</strong>.
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1">
              {engine.favorites.length === 0 ? (
                <div className="text-center text-slate-500 py-12">Aucun agent favori sauvegardé pour le moment.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {engine.favorites.map((fav: Agent) => (
                    <div key={fav.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-slate-600 transition-colors">
                      <div className="text-4xl">{fav.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{fav.name}</h4>
                        <div className="text-xs text-slate-400 truncate">V: {fav.wins} / D: {fav.losses}</div>
                      </div>
                      {selectedAgentIndex !== null && (
                        <button
                          onClick={() => handleReplace(fav)}
                          className="bg-cyan-600 hover:bg-cyan-500 p-2 rounded-lg text-white transition-colors"
                          title="Remplacer par cet agent"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

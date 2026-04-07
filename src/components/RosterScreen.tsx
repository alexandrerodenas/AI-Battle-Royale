import { useState } from 'react';
import { Agent } from '../types';
import { Swords, UserPlus, Library, Loader2 } from 'lucide-react';
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
              : '16 Agents IA prêts à combattre. Cliquez sur l\'un d\'eux pour l\'échanger avec un favori.'}
          </p>
        </div>
        
        {!isGenerating && (
          <button
            onClick={engine.startTournament}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xl transition-all shadow-lg shadow-fuchsia-900/50 flex items-center gap-3"
          >
            <Swords className="w-6 h-6" />
            Lancer le Tournoi
          </button>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {engine.agents.map((agent: Agent, index: number) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            key={agent.id}
            onClick={() => {
              if (!isGenerating) {
                setSelectedAgentIndex(index);
                setShowLibrary(true);
              }
            }}
            className={`bg-slate-900 border ${isGenerating ? 'border-slate-800' : 'border-slate-800 hover:border-cyan-500 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(217,70,239,0.3)] cursor-pointer'} p-4 rounded-xl transition-all duration-300 group relative overflow-hidden`}
          >
            {!isGenerating && <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            <div className="text-4xl mb-3 text-center group-hover:scale-125 transition-transform duration-300">{agent.avatar}</div>
            <h3 className="font-bold text-center truncate relative z-10">{agent.name}</h3>
            <div className="mt-2 text-xs text-slate-400 line-clamp-2 relative z-10">{agent.personality}</div>
            <div className="mt-2 text-xs font-mono text-cyan-400 truncate relative z-10">Expertise : {agent.expertise}</div>
          </motion.div>
        ))}

        {/* Loading skeleton for the current agent being generated */}
        {isGenerating && currentCount < totalAgents && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
            className="bg-slate-900/50 border border-slate-800 border-dashed p-4 rounded-xl flex flex-col items-center justify-center min-h-[160px]"
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
          <div key={`empty-${i}`} className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex items-center justify-center min-h-[160px] opacity-50">
            <div className="text-slate-800 font-black text-4xl">?</div>
          </div>
        ))}
      </div>

      {showLibrary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Library className="text-fuchsia-500" /> Bibliothèque d'Agents
              </h3>
              <button onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-white">Fermer</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {engine.favorites.length === 0 ? (
                <div className="text-center text-slate-500 py-12">Aucun agent favori sauvegardé pour le moment.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {engine.favorites.map((fav: Agent) => (
                    <div key={fav.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                      <div className="text-4xl">{fav.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{fav.name}</h4>
                        <div className="text-xs text-slate-400 truncate">V: {fav.wins} / D: {fav.losses}</div>
                      </div>
                      <button
                        onClick={() => handleReplace(fav)}
                        className="bg-cyan-600 hover:bg-cyan-500 p-2 rounded-lg text-white transition-colors"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
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

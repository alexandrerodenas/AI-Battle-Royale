import { useState } from 'react';
import { Agent } from '../types';
import { Swords, UserPlus, Library } from 'lucide-react';
import { motion } from 'motion/react';

export default function RosterScreen({ engine }: { engine: any }) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number | null>(null);

  const handleReplace = (fav: Agent) => {
    if (selectedAgentIndex !== null) {
      engine.replaceAgent(selectedAgentIndex, fav);
      setShowLibrary(false);
      setSelectedAgentIndex(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-fuchsia-400">The Contenders</h2>
          <p className="text-slate-400 mt-2">16 AI Agents ready to battle. Click one to swap with a favorite.</p>
        </div>
        <button
          onClick={engine.startTournament}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xl transition-all shadow-lg shadow-fuchsia-900/50 flex items-center gap-3"
        >
          <Swords className="w-6 h-6" />
          Start Tournament
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {engine.agents.map((agent: Agent, index: number) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={agent.id}
            onClick={() => {
              setSelectedAgentIndex(index);
              setShowLibrary(true);
            }}
            className="bg-slate-900 border border-slate-800 hover:border-cyan-500 p-4 rounded-xl cursor-pointer transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-4xl mb-3 text-center">{agent.avatar}</div>
            <h3 className="font-bold text-center truncate">{agent.name}</h3>
            <div className="mt-2 text-xs text-slate-400 line-clamp-2">{agent.personality}</div>
            <div className="mt-2 text-xs font-mono text-cyan-400 truncate">Expertise: {agent.expertise}</div>
          </motion.div>
        ))}
      </div>

      {showLibrary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Library className="text-fuchsia-500" /> Agent Library
              </h3>
              <button onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {engine.favorites.length === 0 ? (
                <div className="text-center text-slate-500 py-12">No favorite agents saved yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {engine.favorites.map((fav: Agent) => (
                    <div key={fav.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                      <div className="text-4xl">{fav.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{fav.name}</h4>
                        <div className="text-xs text-slate-400 truncate">W: {fav.wins} / L: {fav.losses}</div>
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

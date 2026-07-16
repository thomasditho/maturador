import React, { useState } from 'react';
import { Send, Play, Pause, CheckCircle, Sparkles, MessageCircle } from 'lucide-react';
import { Campaign, Instance, AgentConfig } from '../types';
import { generateMessageVariations } from '../services/geminiService';

interface CampaignsProps {
  campaigns: Campaign[];
  instances: Instance[];
  agents: AgentConfig[];
}

const Campaigns: React.FC<CampaignsProps> = ({ campaigns: initialCampaigns, instances, agents }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  // Creation State
  const [campaignName, setCampaignName] = useState('');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateVariations = async () => {
    if (!messageBody || !selectedInstance) return;
    
    setIsGenerating(true);
    
    // Find linked agent
    const instance = instances.find(i => i.id === selectedInstance);
    const agent = agents.find(a => a.id === instance?.agentId);
    
    // Fallback agent if none linked
    const agentToUse = agent || agents[0];

    const variations = await generateMessageVariations(messageBody, 5, agentToUse);
    setGeneratedVariations(variations);
    setIsGenerating(false);
  };

  const handleCreateCampaign = () => {
      const newCampaign: Campaign = {
          id: Date.now().toString(),
          name: campaignName,
          instanceId: selectedInstance,
          listId: '1', // Mock
          status: 'RUNNING',
          progress: 0,
          total: 1500, // Mock
          messageTemplate: messageBody
      };
      setCampaigns([newCampaign, ...campaigns]);
      setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Disparos em Massa</h2>
          <p className="text-slate-400 mt-1">Gerencie suas campanhas de marketing.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
             <button 
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
                Histórico
             </button>
             <button 
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
                Novo Disparo
             </button>
        </div>
      </div>

      {activeTab === 'list' ? (
          <div className="grid grid-cols-1 gap-4">
            {campaigns.map(camp => (
                <div key={camp.id} className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center justify-between group hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                            camp.status === 'RUNNING' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' :
                            camp.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                            <Send className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{camp.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    camp.status === 'RUNNING' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                                }`}>{camp.status}</span>
                                <span className="text-xs text-slate-500">
                                    Chip: {instances.find(i => i.id === camp.instanceId)?.name || 'Desconhecido'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 mx-8 max-w-sm">
                         <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progresso</span>
                            <span>{Math.round((camp.progress / camp.total) * 100)}%</span>
                         </div>
                         <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                             <div 
                                style={{ width: `${(camp.progress / camp.total) * 100}%` }}
                                className={`h-full rounded-full ${camp.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                             ></div>
                         </div>
                         <div className="text-xs text-slate-500 mt-1 text-right">{camp.progress}/{camp.total} envios</div>
                    </div>

                    <div className="flex gap-2">
                        {camp.status === 'RUNNING' ? (
                            <button className="p-2 bg-slate-900 rounded-lg hover:bg-amber-900/20 text-amber-500 border border-slate-700 hover:border-amber-500/50 transition-all">
                                <Pause className="w-4 h-4" />
                            </button>
                        ) : (
                             <button className="p-2 bg-slate-900 rounded-lg hover:bg-emerald-900/20 text-emerald-500 border border-slate-700 hover:border-emerald-500/50 transition-all">
                                <Play className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
          </div>
      ) : (
          <div className="grid grid-cols-12 gap-6 h-full">
             <div className="col-span-7 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Nome da Campanha</label>
                        <input 
                            type="text" 
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                            placeholder="Promoção Black Friday"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Selecionar Chip de Envio</label>
                        <select 
                             value={selectedInstance}
                             onChange={(e) => setSelectedInstance(e.target.value)}
                             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="">Selecione um chip...</option>
                            {instances.map(i => (
                                <option key={i.id} value={i.id}>{i.name} ({i.phoneNumber})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-400">Mensagem Base</label>
                            <button 
                                onClick={handleGenerateVariations}
                                disabled={isGenerating || !messageBody || !selectedInstance}
                                className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                            >
                                <Sparkles className="w-3 h-3" />
                                {isGenerating ? 'Gerando...' : 'Gerar Variações com IA'}
                            </button>
                        </div>
                        <textarea 
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            className="w-full h-40 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="Olá {nome}, tudo bem? Temos uma oferta..."
                        />
                    </div>

                    <button 
                        onClick={handleCreateCampaign}
                        disabled={!campaignName || !selectedInstance || !messageBody}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                    >
                        Iniciar Disparo
                    </button>
                </div>
             </div>

             <div className="col-span-5 space-y-4">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-full flex flex-col">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-indigo-400" />
                        Prévia & Variações (Anti-Spam)
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {generatedVariations.length > 0 ? (
                            generatedVariations.map((variant, idx) => (
                                <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-sm text-slate-300 relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    {variant}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-500 mt-10">
                                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>Escreva uma mensagem base e clique em "Gerar Variações" para criar múltiplas versões e evitar bloqueios.</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Campaigns;
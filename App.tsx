
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import Agents from './pages/Agents';
import SettingsPage from './pages/Settings';
import Checklist from './pages/Checklist';
import Documentation from './pages/Documentation';
import Warmup from './pages/Warmup'; 
import ExportLeads from './pages/ExportLeads'; 
import Tools from './pages/Tools';
import Library from './pages/Library';
import { MaturadorPro } from './pages/MaturadorPro';
import { Instance, AgentConfig, SafetyConfig, ManualOperation, SystemSettings, ActiveAgentState, Lead, LeadStatus, Message } from './types';
import { EvolutionService } from './services/evolutionService';
import { DatabaseService } from './services/databaseService';
import { generateAgentMessage } from './services/geminiService';
import { LayoutGrid, Command, Bell, Menu, X } from 'lucide-react';

// DADOS OFICIAIS DO PRINT DO USUÁRIO
const OFFICIAL_URL = 'https://evolution-api-production-aad3a.up.railway.app';
const OFFICIAL_KEY = 'Dithosolucoes324911@';

const defaultSettings: SystemSettings = {
    evolutionApiUrl: OFFICIAL_URL,
    evolutionApiKey: OFFICIAL_KEY,
    webhookUrl: '',
    rabbitmqEnabled: false,
    costPerChip: 0,
    costPerMsg: 0
};

const defaultSafety: SafetyConfig = {
    minDelay: 20,
    maxDelay: 60,
    warmupEnabled: false,
    warmupStartCount: 50,
    warmupIncrement: 20,
    jitterPattern: 'random'
};

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<'BDR' | 'LAUNCHER'>('BDR');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [instances, setInstances] = useState<Instance[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [safetyConfig, setSafetyConfig] = useState<SafetyConfig>(defaultSafety);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [activeOperations, setActiveOperations] = useState<ManualOperation[]>([]);
  const [loading, setLoading] = useState(true);

  const [runningAgents, setRunningAgents] = useState<Record<string, ActiveAgentState>>({});
  const agentStopFlags = useRef<Record<string, boolean>>({});
  const agentQueueCursors = useRef<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
          const dbData = await DatabaseService.loadSystemSettings();
          
          // LÓGICA DE LIMPEZA E PRIORIDADE TOTAL
          // Se não houver dados OU os dados forem do projeto antigo (quebrado), usamos o oficial
          const currentUrl = dbData?.settings?.evolutionApiUrl || '';
          const currentKey = dbData?.settings?.evolutionApiKey || '';
          
          // LÓGICA DE CORREÇÃO AGRESSIVA: Se não for exatamente o oficial, nós forçamos
          const isWrong = !dbData || 
              currentUrl !== OFFICIAL_URL || 
              currentUrl.includes('dithosolucoestech.up.railway.app') ||
              currentUrl.includes('dithosolucoess.up.railway.app') ||
              currentUrl.includes('nyrohtech.up.railway.app') ||
              currentUrl.includes('SUA_URL');

          if (isWrong) {
              console.log("⚠️ Forçando configuração oficial (Evolution Railway Production)...");
              const finalKey = currentKey && currentKey !== 'SUA_KEY_AQUI' ? currentKey : OFFICIAL_KEY;
              const newSettings = { ...defaultSettings, evolutionApiKey: finalKey };
              setSettings(newSettings);
              setSafetyConfig(defaultSafety);
              // Persiste a correção no banco imediatamente
              DatabaseService.saveSystemSettings(newSettings, defaultSafety).then(() => {
                  console.log("✅ Configuração oficial persistida no Supabase.");
              });
          } else {
              setSettings(dbData.settings);
              setSafetyConfig(dbData.safety);
          }
      } catch (e) {
          setSettings(defaultSettings);
      }

      try {
          const dbAgents = await DatabaseService.getAgents();
          setAgents(dbAgents);
      } catch (e) {}
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
      const fetchChips = async () => {
          // Só tenta se for a URL certa do print ou oficial
          if (settings.evolutionApiUrl.includes('nyrohtech.up.railway.app') || settings.evolutionApiUrl.includes('evolution-api-production-73b2.up.railway.app') || settings.evolutionApiUrl.includes('evolution-api-production-aad3a.up.railway.app')) {
              try {
                  const realInstances = await EvolutionService.fetchInstances(settings);
                  setInstances(realInstances);
              } catch (e) {
                  console.error("Erro ao buscar chips na API:", e);
              }
          }
      };
      if (!loading) fetchChips();
  }, [settings, loading]);

  const handleStartAgent = async (agentId: string, leadsToProcess: string[]) => {
      agentStopFlags.current[agentId] = false;
      agentQueueCursors.current[agentId] = 0;
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      const chipIds = agent.connectedInstanceIds || (agent.connectedInstanceId ? [agent.connectedInstanceId] : []);
      if (chipIds.length === 0) return alert("Nenhum chip configurado.");
      
      const targets = await DatabaseService.getLeadsByIds(leadsToProcess);
      
      setRunningAgents(prev => ({
          ...prev,
          [agentId]: {
              agentId,
              status: 'RUNNING',
              progress: { current: 0, total: leadsToProcess.length },
              activeWorkers: chipIds.length,
              logs: [`Iniciando com ${chipIds.length} chips...`]
          }
      }));

      chipIds.forEach(chipId => {
          const instance = instances.find(i => i.id === chipId);
          const limit = agent.instanceLimits?.[chipId];
          if (instance && instance.status === 'CONNECTED') runWorkerLoop(agent, instance, targets, limit);
      });
  };

  const handleStopAgent = (agentId: string) => {
      agentStopFlags.current[agentId] = true;
      setRunningAgents(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: 'PAUSED' }
      }));
  };

  const runWorkerLoop = async (agent: AgentConfig, instance: Instance, allTargets: Lead[], limit?: number) => {
      let sentByMe = 0;
      while (true) {
          if (agentStopFlags.current[agent.id]) break; 

          if (limit && sentByMe >= limit) {
              setRunningAgents(prev => ({
                  ...prev,
                  [agent.id]: { 
                      ...prev[agent.id], 
                      logs: [...(prev[agent.id]?.logs || []), `Chip ${instance.name} atingiu limite (${limit}) e parou.`]
                  }
              }));
              break; 
          }

          const currentIndex = agentQueueCursors.current[agent.id];
          if (currentIndex >= allTargets.length) break;
          agentQueueCursors.current[agent.id]++;
          sentByMe++;
          
          const lead = allTargets[currentIndex];
          
          setRunningAgents(prev => ({
              ...prev,
              [agent.id]: { 
                  ...prev[agent.id], 
                  currentLead: lead.name,
                  progress: { ...prev[agent.id].progress, current: Math.min((prev[agent.id]?.progress.current || 0) + 1, allTargets.length) }
              }
          }));

          try {
              const alreadyAborded = await DatabaseService.checkGlobalHistory(lead.phone).catch(() => false);
              if (alreadyAborded) continue;

              const messageText = await generateAgentMessage(agent, lead).catch(() => `Olá ${lead.name}, tudo bem?`);
              
              let success = false;
              if (lead.data?.print_base64) {
                  success = await EvolutionService.sendMedia(settings, instance.name, lead.phone, lead.data.print_base64, messageText);
              } else {
                  success = await EvolutionService.sendText(settings, instance.name, lead.phone, messageText);
              }

              if (success) {
                  DatabaseService.updateLeadStatus(lead.id, LeadStatus.SENT);
                  DatabaseService.getOrCreateSession(agent.id, lead, instance.id).then(sid => {
                      if (sid) DatabaseService.logMessage(sid, messageText, 'agent');
                  });
              } else {
                  DatabaseService.updateLeadStatus(lead.id, LeadStatus.FAILED);
              }
          } catch (e) {
              console.error("Worker Loop error:", e);
          }

          if (!agentStopFlags.current[agent.id]) {
              const delay = Math.floor(Math.random() * (safetyConfig.maxDelay - safetyConfig.minDelay + 1) + safetyConfig.minDelay) * 1000;
              await new Promise(r => setTimeout(r, delay));
          }
      }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard instances={instances} activeOperations={activeOperations} />;
      case 'export-leads': return <ExportLeads />;
      case 'instances': return <Instances instances={instances} setInstances={setInstances} settings={settings} safetyConfig={safetyConfig} setSafetyConfig={setSafetyConfig} />;
      case 'agents': return <Agents agents={agents} setAgents={setAgents} instances={instances} safetyConfig={safetyConfig} setSafetyConfig={setSafetyConfig} runningAgents={runningAgents} startAgent={handleStartAgent} stopAgent={handleStopAgent} settings={settings} />;
      case 'checklist': return <Checklist />;
      case 'settings': return <SettingsPage settings={settings} setSettings={setSettings} safetyConfig={safetyConfig} />;
      case 'warmup': return <Warmup instances={instances} settings={settings} />;
      case 'maturador-pro': return <MaturadorPro instances={instances} settings={settings} />;
      case 'documentation': return <Documentation />;
      case 'tools': return <Tools setCurrentView={setCurrentView} />;
      case 'library': return <Library />;
      default: return <Dashboard instances={instances} activeOperations={activeOperations} />;
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <header className="h-12 bg-[#09090b] text-zinc-400 flex items-center justify-between px-4 fixed top-0 w-full z-[60] border-b border-zinc-800 shadow-md">
         <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 lg:hidden text-zinc-100">
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2 text-zinc-100 font-bold tracking-tight">
                <Command className="w-4 h-4" />
                <span className="hidden sm:inline">Ditho OS</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
                <button onClick={() => setCurrentModule('BDR')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${currentModule === 'BDR' ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/50 hover:text-zinc-200'}`}>BDR System</button>
            </nav>
         </div>
         <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
                <span className={`w-2 h-2 rounded-full ${settings.evolutionApiUrl === OFFICIAL_URL ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                <span className="truncate max-w-[80px] lg:max-w-none">API: {settings.evolutionApiUrl === OFFICIAL_URL ? 'Online' : 'Erro'}</span>
            </div>
            <button className="hover:text-white"><Bell className="w-4 h-4" /></button>
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">D</div>
         </div>
      </header>
      
      <div className="flex-1 mt-12 relative flex h-[calc(100vh-3rem)]">
          <Sidebar 
            currentView={currentView} 
            setCurrentView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main className="flex-1 lg:ml-64 p-4 lg:p-10 h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto h-full animate-in fade-in duration-300">
              {renderContent()}
            </div>
          </main>
      </div>
    </div>
  );
};

export default App;

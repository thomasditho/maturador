


import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, Smartphone, Zap, Play, Pause, CheckCircle, 
    AlertCircle, MessageSquare, Briefcase, ChevronRight, 
    Calendar, Filter, RefreshCw, X, ArrowLeft, Loader2, Camera
} from 'lucide-react';
import { Instance, ManualOperation, SystemSettings, SafetyConfig, Lead, LeadStatus, GlobalPrompt } from '../types';
import { DatabaseService } from '../services/databaseService';
import { EvolutionService } from '../services/evolutionService';
import { generateManualMessage } from '../services/geminiService';

interface ManualOperationProps {
  instances: Instance[];
  addOperation: (op: ManualOperation) => void;
  settings: SystemSettings;
  safetyConfig: SafetyConfig;
}

// Worker Status for UI
type WorkerStatus = 'IDLE' | 'THINKING' | 'SENDING' | 'COOLDOWN' | 'ERROR' | 'DONE';

interface WorkerState {
    instanceId: string;
    status: WorkerStatus;
    currentLeadName?: string;
    logs: string[];
    cooldownRemaining?: number;
    processedCount: number;
}

const ManualOperationPage: React.FC<ManualOperationProps> = ({ instances, addOperation, settings, safetyConfig }) => {
  // --- WIZARD STATE ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // --- DATA STATE ---
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [prompts, setPrompts] = useState<GlobalPrompt[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // --- SELECTION STATE ---
  // Step 1: Leads
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [nicheFilter, setNicheFilter] = useState('ALL');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'PENDING' | 'ALL'>('PENDING'); // Default to PENDING to avoid re-sending
  
  // Step 2: Chips
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);

  // Step 3: Strategy
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<GlobalPrompt | null>(null);
  const [previewMessage, setPreviewMessage] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Step 4: Execution (War Room)
  const [workers, setWorkers] = useState<Record<string, WorkerState>>({});
  const [executionQueue, setExecutionQueue] = useState<Lead[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  
  // Refs for async loop control
  const stopRef = useRef(false);
  const queueRef = useRef<Lead[]>([]); // Mutable queue ref for workers
  
  // Load Initial Data
  useEffect(() => {
      loadInitialData();
  }, []);

  const loadInitialData = async () => {
      setIsLoadingData(true);
      // Load Leads
      const leads = await DatabaseService.getProspectingLeads('ditho_sites');
      setAvailableLeads(leads);
      
      // Load Prompts (Mocking generic structure loading by fetching all strategies)
      // Ideally we should have a generic fetcher, but we'll fetch 'Site' product for now or adjust logic
      // For this demo, we assume strategies are loaded or we fetch specific ones.
      // Let's fetch all prompts to build the tree.
      const allPrompts = await DatabaseService.getGlobalPrompts('Site'); // Assuming 'Site' is a default product
      setPrompts(allPrompts);
      
      setIsLoadingData(false);
  };

  // --- HELPER: FILTER LEADS ---
  const filteredLeads = availableLeads.filter(l => {
      if (leadStatusFilter === 'PENDING' && l.status === 'SENT') return false;
      if (nicheFilter !== 'ALL' && l.data?.nicho !== nicheFilter) return false;
      return true;
  });

  const uniqueNiches = Array.from(new Set(availableLeads.map(l => l.data?.nicho).filter(Boolean)));
  const availableStrategies = {
      niches: Array.from(new Set(prompts.map(p => p.niche))),
      getProfessions: (niche: string) => Array.from(new Set(prompts.filter(p => p.niche === niche).map(p => p.profession))),
      getPrompts: (niche: string, prof: string) => prompts.filter(p => p.niche === niche && p.profession === prof && p.isActive)
  };

  // --- ACTION HANDLERS ---

  const handleSelectAllLeads = () => {
      if (selectedLeadIds.length === filteredLeads.length) setSelectedLeadIds([]);
      else setSelectedLeadIds(filteredLeads.map(l => l.id));
  };

  const handlePreview = async () => {
      if (!selectedPrompt || selectedLeadIds.length === 0) return;
      setIsPreviewLoading(true);
      const randomLeadId = selectedLeadIds[0]; // Take first selected for preview
      const lead = availableLeads.find(l => l.id === randomLeadId);
      if (lead) {
          // Pass the image base64 if available to simulate real prompt AND the vision setting
          const msg = await generateManualMessage(selectedPrompt.content, lead, lead.data?.print_base64, selectedPrompt.useVision);
          setPreviewMessage(msg);
      }
      setIsPreviewLoading(false);
  };

  // --- EXECUTION ENGINE (THE WAR ROOM LOGIC) ---
  
  const initializeWarRoom = () => {
      // 1. Setup Queue
      const leadsToProcess = availableLeads.filter(l => selectedLeadIds.includes(l.id));
      setExecutionQueue(leadsToProcess);
      queueRef.current = [...leadsToProcess]; // Deep copy for mutable ref
      
      // 2. Setup Workers
      const initialWorkers: Record<string, WorkerState> = {};
      selectedInstanceIds.forEach(id => {
          initialWorkers[id] = {
              instanceId: id,
              status: 'IDLE',
              logs: ['Aguardando início...'],
              processedCount: 0
          };
      });
      setWorkers(initialWorkers);
      setStep(4);
  };

  const startOperation = () => {
      if (isRunning) return;
      setIsRunning(true);
      stopRef.current = false;
      
      // Trigger all selected workers
      selectedInstanceIds.forEach(id => {
          runWorkerLoop(id);
      });
  };

  const stopOperation = () => {
      stopRef.current = true;
      setIsRunning(false);
  };

  const updateWorker = (id: string, updates: Partial<WorkerState>) => {
      setWorkers(prev => ({
          ...prev,
          [id]: { ...prev[id], ...updates }
      }));
  };

  // THE CORE MULTI-THREAD LOOP
  const runWorkerLoop = async (instanceId: string) => {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) return;

      while (!stopRef.current && queueRef.current.length > 0) {
          // 1. Pop Lead
          const lead = queueRef.current.shift();
          if (!lead) break;

          const useVision = selectedPrompt?.useVision || false;
          const hasImage = !!lead.data?.print_base64;

          // Update UI: Thinking
          updateWorker(instanceId, { 
              status: 'THINKING', 
              currentLeadName: lead.name,
              logs: [`Gerando IA ${useVision ? (hasImage ? '+ Vision' : '(Sem Imagem)') : ''} para ${lead.name}...`] 
          });

          // 2. Generate AI Message
          let message = "";
          try {
             // Pass useVision configuration
             message = await generateManualMessage(selectedPrompt?.content || '', lead, lead.data?.print_base64, useVision);
          } catch (e) {
             updateWorker(instanceId, { status: 'ERROR', logs: ['Erro ao gerar IA.'] });
             continue;
          }

          // Update UI: Sending
          updateWorker(instanceId, { 
              status: 'SENDING', 
              logs: [`Enviando ${useVision && hasImage ? 'Mídia' : 'Texto'} para ${lead.phone}...`] 
          });

          // 3. Send Message (API)
          let success = false;
          
          if (useVision && hasImage && lead.data?.print_base64) {
              // Send Media (Base64) - Only if Vision is active AND image exists
              success = await EvolutionService.sendMedia(settings, instance.name, lead.phone, lead.data.print_base64, message);
          } else {
              // Send Text Only (Fallback or Standard)
              success = await EvolutionService.sendText(settings, instance.name, lead.phone, message);
          }
          
          if (success) {
              setTotalProcessed(prev => prev + 1);
              // Log to DB (Fire and Forget)
              DatabaseService.getOrCreateSession('MANUAL_OP', lead).then(sid => {
                  DatabaseService.logMessage(sid, message, 'agent');
              });
              // Update Lead Status in DB
              DatabaseService.updateLeadStatus(lead.id, LeadStatus.SENT);
          } else {
             DatabaseService.updateLeadStatus(lead.id, LeadStatus.FAILED);
          }

          // 4. Cooldown (Random Delay)
          const min = safetyConfig.minDelay || 20;
          const max = safetyConfig.maxDelay || 60;
          const delaySec = Math.floor(Math.random() * (max - min + 1) + min);
          
          updateWorker(instanceId, { 
              status: 'COOLDOWN', 
              cooldownRemaining: delaySec,
              processedCount: (workers[instanceId]?.processedCount || 0) + 1,
              logs: success ? ['Enviado com sucesso.'] : ['Falha no envio.']
          });

          // Visual Countdown
          for (let i = delaySec; i > 0; i--) {
              if (stopRef.current) break;
              updateWorker(instanceId, { cooldownRemaining: i });
              await new Promise(r => setTimeout(r, 1000));
          }
      }

      updateWorker(instanceId, { status: 'IDLE', currentLeadName: 'Aguardando...', logs: ['Fila finalizada ou pausada.'] });
      
      // Check if all done
      if (queueRef.current.length === 0) {
          setIsRunning(false);
          stopRef.current = true;
      }
  };


  // --- RENDER STEPS ---

  // STEP 1: LEADS
  const renderStep1 = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center">
              <div>
                  <h3 className="text-xl font-bold text-gray-900">1. Defina seus Alvos</h3>
                  <p className="text-gray-500 text-sm">Selecione leads da sua base de captação.</p>
              </div>
              <div className="flex gap-2">
                  <select 
                    value={nicheFilter} 
                    onChange={(e) => setNicheFilter(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2.5 focus:ring-black focus:border-black"
                  >
                      <option value="ALL">Todos os Nichos</option>
                      {uniqueNiches.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select 
                    value={leadStatusFilter} 
                    onChange={(e) => setLeadStatusFilter(e.target.value as any)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2.5 focus:ring-black focus:border-black"
                  >
                      <option value="PENDING">Apenas Pendentes</option>
                      <option value="ALL">Todos (Inclui já enviados)</option>
                  </select>
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-96 flex flex-col">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                  <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0} onChange={handleSelectAllLeads} className="rounded text-black focus:ring-black" />
                      <span>Selecionar Todos ({filteredLeads.length})</span>
                  </div>
                  <span>{selectedLeadIds.length} selecionados</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                  {filteredLeads.map(lead => (
                      <div key={lead.id} className="flex items-center gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedLeadIds.includes(lead.id)} 
                            onChange={() => {
                                if (selectedLeadIds.includes(lead.id)) setSelectedLeadIds(prev => prev.filter(id => id !== lead.id));
                                else setSelectedLeadIds(prev => [...prev, lead.id]);
                            }}
                            className="rounded text-black focus:ring-black"
                          />
                          <div className="flex-1 flex items-center gap-3">
                              {lead.data?.print_base64 && <Camera className="w-4 h-4 text-purple-500" title="Possui Print" />}
                              <div>
                                <p className="font-bold text-sm text-gray-900">{lead.name}</p>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <span>{lead.phone}</span>
                                    {lead.data?.nicho && <span className="bg-gray-100 px-1 rounded">{lead.data.nicho}</span>}
                                </div>
                              </div>
                          </div>
                          <div className={`text-xs font-bold px-2 py-1 rounded ${lead.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {lead.status}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="flex justify-end">
              <button 
                onClick={() => setStep(2)} 
                disabled={selectedLeadIds.length === 0}
                className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-gray-800 transition-all shadow-lg"
              >
                  Próximo: Selecionar Chips <ChevronRight className="w-4 h-4" />
              </button>
          </div>
      </div>
  );

  // STEP 2: CHIPS
  const renderStep2 = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div>
              <h3 className="text-xl font-bold text-gray-900">2. Escolha seu Exército</h3>
              <p className="text-gray-500 text-sm">Selecione quais chips farão o disparo simultâneo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instances.map(instance => {
                  const isSelected = selectedInstanceIds.includes(instance.id);
                  const isConnected = instance.status === 'CONNECTED';
                  return (
                      <div 
                        key={instance.id}
                        onClick={() => {
                            if (!isConnected) return;
                            if (isSelected) setSelectedInstanceIds(prev => prev.filter(id => id !== instance.id));
                            else setSelectedInstanceIds(prev => [...prev, instance.id]);
                        }}
                        className={`
                            relative border-2 rounded-xl p-4 cursor-pointer transition-all
                            ${isSelected ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-400'}
                            ${!isConnected ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                        `}
                      >
                          {isSelected && <div className="absolute top-2 right-2 text-black"><CheckCircle className="w-5 h-5 fill-black text-white" /></div>}
                          <div className="flex items-center gap-3 mb-2">
                              <Smartphone className={`w-6 h-6 ${isConnected ? 'text-gray-800' : 'text-gray-300'}`} />
                              <span className="font-bold text-gray-900">{instance.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono">{instance.phoneNumber}</p>
                          {!isConnected && <span className="text-xs text-red-500 font-bold mt-2 block">Desconectado</span>}
                      </div>
                  )
              })}
          </div>

          <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-black font-medium">Voltar</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={selectedInstanceIds.length === 0}
                className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-gray-800 transition-all shadow-lg"
              >
                  Próximo: Estratégia <ChevronRight className="w-4 h-4" />
              </button>
          </div>
      </div>
  );

  // STEP 3: STRATEGY
  const renderStep3 = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
           <div>
              <h3 className="text-xl font-bold text-gray-900">3. Defina a Estratégia</h3>
              <p className="text-gray-500 text-sm">Qual abordagem será usada para converter esses leads?</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
              <div className="space-y-6">
                  {/* NICHE SELECTOR */}
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">1. Nicho do Lead</label>
                      <div className="flex flex-wrap gap-2">
                          {availableStrategies.niches.map(n => (
                              <button 
                                key={n} 
                                onClick={() => { setSelectedNiche(n); setSelectedProfession(null); setSelectedPrompt(null); }}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedNiche === n ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                              >
                                  {n}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* PROFESSION SELECTOR */}
                  {selectedNiche && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">2. Profissional / Sub-nicho</label>
                          <div className="flex flex-wrap gap-2">
                              {availableStrategies.getProfessions(selectedNiche).map(p => (
                                  <button 
                                    key={p} 
                                    onClick={() => { setSelectedProfession(p); setSelectedPrompt(null); }}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedProfession === p ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                  >
                                      {p}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* PROMPT SELECTOR */}
                  {selectedNiche && selectedProfession && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">3. Abordagem (Prompt)</label>
                          <div className="space-y-2">
                              {availableStrategies.getPrompts(selectedNiche, selectedProfession).map(p => (
                                  <div 
                                    key={p.id}
                                    onClick={() => setSelectedPrompt(p)}
                                    className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-sm ${selectedPrompt?.id === p.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200'}`}
                                  >
                                      <div className="flex justify-between items-start mb-1">
                                          <div className="font-bold text-gray-900 text-sm">{p.title}</div>
                                          {p.useVision && <Camera className="w-4 h-4 text-purple-600" title="Vision Active"/>}
                                      </div>
                                      <div className="text-xs text-gray-500 line-clamp-2">{p.content}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              {/* PREVIEW BOX */}
              <div className="bg-gray-100 rounded-xl p-6 flex flex-col border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Preview da Mensagem
                  </h4>
                  {selectedPrompt ? (
                      <div className="flex-1 flex flex-col gap-4">
                          {/* Image Alert in Preview */}
                          <div className="flex flex-col gap-2">
                              {selectedPrompt.useVision ? (
                                  <div className="bg-purple-100 border border-purple-200 text-purple-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                                      <Camera className="w-4 h-4"/> 
                                      VISION MODE ATIVO: Robô vai analisar o print do site.
                                  </div>
                              ) : (
                                  <div className="bg-gray-200 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                                      Vision Desativado (Apenas Texto)
                                  </div>
                              )}
                              
                              {selectedLeadIds.length > 0 && !availableLeads.find(l => l.id === selectedLeadIds[0])?.data?.print_base64 && selectedPrompt.useVision && (
                                   <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4"/> 
                                      Aviso: O lead do preview NÃO tem imagem. O sistema enviará apenas texto.
                                  </div>
                              )}
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-gray-800 leading-relaxed border border-gray-200 flex-1 overflow-y-auto whitespace-pre-wrap font-sans">
                              {isPreviewLoading ? (
                                  <div className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin"/> Gerando exemplo com IA...</div>
                              ) : previewMessage || "Clique em 'Gerar Preview' para ver um exemplo real."}
                          </div>
                          <button 
                            onClick={handlePreview}
                            className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                          >
                              Gerar Exemplo Real (IA)
                          </button>
                      </div>
                  ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
                          Selecione um prompt ao lado para testar.
                      </div>
                  )}
              </div>
          </div>

          <div className="flex-between pt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:text-black font-medium">Voltar</button>
              <button 
                onClick={initializeWarRoom} 
                disabled={!selectedPrompt}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-red-200"
              >
                  <Zap className="w-4 h-4 fill-white" /> INICIAR OPERAÇÃO DE GUERRA
              </button>
          </div>
      </div>
  );

  // STEP 4: WAR ROOM
  const renderStep4 = () => (
      <div className="h-full flex flex-col space-y-4 animate-in zoom-in-95 duration-300">
          
          {/* HEADER DASHBOARD */}
          <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-800 rounded-lg animate-pulse">
                      <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div>
                      <h2 className="text-lg font-bold">Sala de Guerra</h2>
                      <div className="flex gap-4 text-xs text-gray-400">
                          <span>Alvos: {executionQueue.length} restantes</span>
                          <span>Processados: {totalProcessed}</span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  {!isRunning ? (
                       <button onClick={startOperation} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                           <Play className="w-4 h-4 fill-white" /> DISPARAR
                       </button>
                  ) : (
                       <button onClick={stopOperation} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                           <Pause className="w-4 h-4 fill-white" /> PAUSAR
                       </button>
                  )}
                  <button onClick={() => setStep(1)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
              </div>
          </div>

          <div className="flex-1 flex gap-6 min-h-0">
              
              {/* LEFT: WORKERS GRID */}
              <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Object.values(workers).map((worker: WorkerState) => {
                          const instance = instances.find(i => i.id === worker.instanceId);
                          
                          // STATUS COLORS
                          let statusColor = "border-gray-200 bg-white";
                          let statusIcon = <Smartphone className="w-5 h-5 text-gray-400" />;
                          let statusText = "Aguardando";
                          
                          if (worker.status === 'THINKING') {
                              statusColor = "border-blue-400 bg-blue-50 ring-2 ring-blue-100";
                              statusIcon = <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
                              statusText = "Gerando IA...";
                          } else if (worker.status === 'SENDING') {
                              statusColor = "border-purple-400 bg-purple-50 ring-2 ring-purple-100";
                              statusIcon = <Zap className="w-5 h-5 text-purple-600 animate-pulse" />;
                              statusText = "Enviando API...";
                          } else if (worker.status === 'COOLDOWN') {
                              statusColor = "border-yellow-400 bg-yellow-50";
                              statusIcon = <Calendar className="w-5 h-5 text-yellow-600" />;
                              statusText = `Aguardando ${worker.cooldownRemaining}s`;
                          } else if (worker.status === 'ERROR') {
                              statusColor = "border-red-400 bg-red-50";
                              statusIcon = <AlertCircle className="w-5 h-5 text-red-600" />;
                              statusText = "Erro";
                          }

                          return (
                              <div key={worker.instanceId} className={`border-2 rounded-xl p-4 transition-all duration-300 ${statusColor}`}>
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-2">
                                          {statusIcon}
                                          <div>
                                              <h4 className="font-bold text-gray-900 text-sm">{instance?.name}</h4>
                                              <span className="text-xs font-mono text-gray-500">{instance?.phoneNumber}</span>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-xs font-bold uppercase tracking-wider text-gray-600">{statusText}</div>
                                          <div className="text-[10px] text-gray-400">{worker.processedCount} enviados</div>
                                      </div>
                                  </div>
                                  
                                  {/* CURRENT TASK */}
                                  <div className="bg-white/50 rounded-lg p-2 mb-2 border border-black/5">
                                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Alvo Atual</span>
                                      <div className="font-medium text-sm text-gray-800 truncate">
                                          {worker.currentLeadName || '-'}
                                      </div>
                                  </div>

                                  {/* MINI LOG */}
                                  <div className="h-16 overflow-hidden relative text-xs font-mono text-gray-500">
                                      {worker.logs[0]}
                                  </div>
                                  
                                  {/* PROGRESS BAR (COOLDOWN) */}
                                  {worker.status === 'COOLDOWN' && (
                                      <div className="w-full bg-gray-200 h-1 mt-2 rounded-full overflow-hidden">
                                          <div 
                                            className="bg-yellow-500 h-full transition-all duration-1000 ease-linear"
                                            style={{ width: `${(worker.cooldownRemaining! / safetyConfig.maxDelay) * 100}%` }}
                                          ></div>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* RIGHT: CHAT / LOGS */}
              <div className="w-80 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
                      Log da Operação
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs font-mono">
                      {totalProcessed === 0 && <span className="text-gray-400 italic">Nenhuma atividade registrada ainda.</span>}
                      {/* Here we could map a global log, for now using workers status */}
                      {Object.values(workers).map((w: WorkerState) => (
                          <div key={w.instanceId} className="border-b border-gray-100 pb-1 mb-1">
                              <span className="font-bold text-gray-900">[{w.instanceId}]</span> {w.logs[0]}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
    </div>
  );
};

export default ManualOperationPage;
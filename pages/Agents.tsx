
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bot, Save, Upload, MessageSquare, Settings, Trash2, Send, Search, Plus, ArrowLeft, Smartphone, Edit2, ToggleLeft, ToggleRight, LayoutList, CheckSquare, Square, UserPlus, Play, Loader2, Filter, AlertCircle, RefreshCw, Pause, PlayCircle, Calendar, X, Camera, FlaskConical, Database, CheckCircle, ChevronLeft, ChevronRight, Globe, Link as LinkIcon, Image as ImageIcon, Zap, Shield, Rocket, Target, FileText, Activity, AlertTriangle, Download } from 'lucide-react';
import { AgentConfig, Instance, Lead, LeadStatus, ChatSession, Message, AgentPrompt, SafetyConfig, ActiveAgentState, SystemSettings } from '../types';
import { EvolutionService } from '../services/evolutionService';
import { DatabaseService } from '../services/databaseService';
import { generateAgentMessage } from '../services/geminiService';
import SafetyBrain from './SafetyBrain';
// @ts-ignore
import JSZip from 'jszip';

interface AgentsProps {
  agents: AgentConfig[];
  setAgents: React.Dispatch<React.SetStateAction<AgentConfig[]>>;
  instances: Instance[];
  safetyConfig: SafetyConfig;
  setSafetyConfig: React.Dispatch<React.SetStateAction<SafetyConfig>>;
  runningAgents: Record<string, ActiveAgentState>;
  startAgent: (agentId: string, leadIds: string[]) => void;
  stopAgent: (agentId: string) => void;
  settings: SystemSettings;
}

const ITEMS_PER_PAGE = 50; 

const getTestNumber = (instanceName: string): string => {
  if (!instanceName) return "5511988216073";
  const name = instanceName.toLowerCase();
  if (name.includes('comercial5') || name.includes('comercial 5')) {
    return "5531991081751";
  }
  if (name.includes('comercial6') || name.includes('comercial 6')) {
    return "5531975095544";
  }
  return "5511988216073";
}; 

const Agents: React.FC<AgentsProps> = ({ agents, setAgents, instances, safetyConfig, setSafetyConfig, runningAgents, startAgent, stopAgent, settings }) => {
  // Navigation
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  // DEFAULT TAB IS NOW 'LEADS' TO AVOID "MISSING DATA" PANIC
  const [activeTab, setActiveTab] = useState<'prompts' | 'chips' | 'leads' | 'chat'>('leads');
  
  // Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  
  // Prompt Edit
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  
  // Chat & Leads from DB
  const [dbLeads, setDbLeads] = useState<Lead[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLeadsFullObjects, setSelectedLeadsFullObjects] = useState<Lead[]>([]);
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);

  // DELETE MODAL STATE
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // TEST MODAL STATE
  const [showTestModal, setShowTestModal] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState<{ current: number, total: number }>({ current: 0, total: 0 });
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(null);
  const testStopFlagRef = useRef(false);

  // SYNC MODAL STATE
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // MARK SENT MODAL STATE
  const [showMarkSentModal, setShowMarkSentModal] = useState(false);
  
  // BATCH MODAL STATE (10, 20, 30 selector)
  const [showBatchModal, setShowBatchModal] = useState(false);

  // FLIGHT CHECK (QA & MONITORING) MODAL
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [flightMode, setFlightMode] = useState<'CHECK' | 'LIVE'>('CHECK');
  
  // IMAGE PREVIEW MODAL STATE
  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);

  // FILTERS
  const [leadStatusFilter, setLeadStatusFilter] = useState<'ALL' | 'PENDING' | 'SENT' | 'FAILED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Local Loading States
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(''); 
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [isUpdatingPrints, setIsUpdatingPrints] = useState(false);
  const [updatePrintsProgress, setUpdatePrintsProgress] = useState('');

  // Manual Add
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');

  // RESET LEAD MODAL STATE
  const [resetConfirmData, setResetConfirmData] = useState<{ isOpen: boolean, instanceId: string, instanceName: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const activeAgent = agents.find(a => a.id === selectedAgentId);
  
  // Helper to get running state for current agent
  const activeRunState = activeAgent ? runningAgents[activeAgent.id] : undefined;
  const isRunning = activeRunState?.status === 'RUNNING';

  // --- EFFECT: Load Leads & Chats when Agent Selected ---
  useEffect(() => {
      if (selectedAgentId) {
          // FORCE LEADS TAB ON SELECT to ensure visibility
          setActiveTab('leads');
          setSelectedLeads([]); // Clear selection when switching agents
          setLeadStatusFilter('ALL');
          setDateFilter('ALL');
          setCurrentPage(1);
          fullLoadAgentData(selectedAgentId, false, 1);
      }
  }, [selectedAgentId]);

  // --- EFFECT: Reload Leads on Filter/Page Change ---
  useEffect(() => {
      if (selectedAgentId) {
          fullLoadAgentData(selectedAgentId, true);
      }
  }, [leadStatusFilter, dateFilter, customStartDate, customEndDate, currentPage]);

  // --- EFFECT: Clear Selection on Filter Change (WYSIWYG Fix) ---
  useEffect(() => {
      setSelectedLeads([]);
  }, [leadStatusFilter, dateFilter]);

  // --- EFFECT: Keep selectedLeadsFullObjects in sync with selectedLeads length ---
  useEffect(() => {
      if (selectedLeads.length === 0) {
          setSelectedLeadsFullObjects([]);
      } else {
          setSelectedLeadsFullObjects(prev => prev.filter(obj => selectedLeads.includes(obj.id)));
      }
  }, [selectedLeads]);

  // --- EFFECT: Auto-Open Flight Monitor if Running ---
  useEffect(() => {
      if (showFlightModal && isRunning) {
          setFlightMode('LIVE');
      }
  }, [isRunning, showFlightModal]);

  // --- REAL-TIME POLLING (OPTIMIZED) ---
  useEffect(() => {
      let interval: any;
      if (isRunning && selectedAgentId) {
          interval = setInterval(() => {
              // Instead of reloading everything, we just sync statuses
              silentStatusSync(selectedAgentId);
          }, 3000); 
      }
      return () => clearInterval(interval);
  }, [isRunning, selectedAgentId]);

  // Heavy Load: Gets filtered/paginated leads and chats
  const fullLoadAgentData = (agentId: string, silent = false, page = currentPage) => {
      if (!silent) setIsLoadingData(true);
      Promise.all([
          DatabaseService.getLeads(agentId, {
              status: leadStatusFilter,
              dateFilter: dateFilter,
              startDate: customStartDate,
              endDate: customEndDate
          }, page, ITEMS_PER_PAGE, true).catch(e => { console.error("Leads Fetch Error", e); return null; }),
          DatabaseService.getChatSessions(agentId).catch(e => { console.error("Chat Fetch Error", e); return []; })
      ]).then(([res, sessions]) => {
          if (res !== null && res && 'leads' in res) {
              setDbLeads(res.leads);
              setTotalLeadsCount(res.totalCount);
          }
          if (Array.isArray(sessions)) setChats(sessions);
          if (!silent) setIsLoadingData(false);
      });
  };

  // Light Load: Gets only STATUS (runs on interval)
  const silentStatusSync = async (agentId: string) => {
      try {
          const statuses = await DatabaseService.getLeadsStatusOnly(agentId);
          const statusMap = new Map(statuses.map(s => [s.id, s.status]));
          
          // Merge updates into existing dbLeads without replacing the whole object (preserves base64 images)
          setDbLeads(prevLeads => {
              // Only update if something changed to avoid re-renders
              let hasChanges = false;
              const newLeads = prevLeads.map(lead => {
                  const newStatus = statusMap.get(lead.id);
                  if (newStatus && newStatus !== lead.status) {
                      hasChanges = true;
                      return { ...lead, status: newStatus as LeadStatus };
                  }
                  return lead;
              });
              
              return hasChanges ? newLeads : prevLeads;
          });

          // Also keep selectedLeadsFullObjects synced so that the Flight modal shows real-time status updates correctly
          setSelectedLeadsFullObjects(prevSelected => {
              let hasChanges = false;
              const newSelected = prevSelected.map(lead => {
                  const newStatus = statusMap.get(lead.id);
                  if (newStatus && newStatus !== lead.status) {
                      hasChanges = true;
                      return { ...lead, status: newStatus as LeadStatus };
                  }
                  return lead;
              });
              return hasChanges ? newSelected : prevSelected;
          });
      } catch (e) {
          console.error("Silent Sync Error", e);
      }
  };

  // --- DYNAMIC VARIABLES ---
  const availableVariables = useMemo(() => {
      const keys = new Set<string>();
      keys.add('{nome}');
      keys.add('{nota}');
      
      let hasImage = false;
      const allLeads = [...dbLeads];
      allLeads.slice(0, 150).forEach(lead => {
          if (lead.data) {
              if (lead.data.print_base64 || lead.data.has_print || lead.data.print_url) hasImage = true;
              Object.keys(lead.data).forEach(k => {
                  if (k !== 'print_base64' && k !== 'has_print' && k !== 'print_url') keys.add(`{${k}}`);
              });
          }
      });
      
      const vars = Array.from(keys);
      if (hasImage) vars.unshift('{📸 IMAGEM_DETECTADA}');
      return vars;
  }, [dbLeads]);

  // --- HELPER: HAS LINK/PRINT ---
  const checkLeadData = (lead: Lead) => {
      const hasPrint = !!(lead.data?.print_base64 || lead.data?.print_url || lead.data?.has_print);
      const hasLink = !!(lead.data?.link_site || lead.data?.website || lead.data?.dithoSitesMetadata?.publicUrl || lead.data?.url);
      return { hasPrint, hasLink };
  };

  // --- ACTIONS ---

  const handleCreateAgent = async () => {
      if (!newAgentName) return;
      try {
          const newAgent = await DatabaseService.createAgent({
              name: newAgentName,
              prompts: [{ title: 'Prompt Inicial', content: 'Você é um assistente.', isActive: true }]
          } as any);
          const allAgents = await DatabaseService.getAgents();
          setAgents(allAgents);
          setNewAgentName('');
          setShowCreateModal(false);
      } catch (e) {
          alert('Erro ao criar agente.');
      }
  };

  const handleUpdateAgent = async (field: keyof AgentConfig, value: any) => {
      if (!selectedAgentId) return;
      setAgents(prev => prev.map(a => a.id === selectedAgentId ? { ...a, [field]: value } : a));
      if (field === 'connectedInstanceId' || field === 'tone' || field === 'name') {
          await DatabaseService.updateAgent(selectedAgentId, { [field]: value });
      }
  };
  
  const toggleInstance = async (instanceId: string) => {
      if (!activeAgent) return;
      let currentIds = activeAgent.connectedInstanceIds || (activeAgent.connectedInstanceId ? [activeAgent.connectedInstanceId] : []);
      if (currentIds.includes(instanceId)) {
          currentIds = currentIds.filter(id => id !== instanceId);
      } else {
          currentIds = [...currentIds, instanceId];
      }
      setAgents(prev => prev.map(a => a.id === activeAgent.id ? { 
          ...a, connectedInstanceIds: currentIds, connectedInstanceId: currentIds[0] || '' 
      } : a));
      await DatabaseService.updateAgent(activeAgent.id, { 
          connectedInstanceId: currentIds[0] || '',
          connectedInstanceIds: currentIds 
      });
      localStorage.setItem(`agent_chips_${activeAgent.id}`, JSON.stringify(currentIds));
  };

  const updateInstanceLimit = async (instanceId: string, limit: number) => {
      if (!activeAgent) return;
      const currentLimits = { ...(activeAgent.instanceLimits || {}) };
      if (limit > 0) {
          currentLimits[instanceId] = limit;
      } else {
          delete currentLimits[instanceId];
      }
      setAgents(prev => prev.map(a => a.id === activeAgent.id ? { 
          ...a, instanceLimits: currentLimits 
      } : a));
      await DatabaseService.updateAgent(activeAgent.id, { instanceLimits: currentLimits });
      localStorage.setItem(`agent_chips_limits_${activeAgent.id}`, JSON.stringify(currentLimits));
  };
  
  const handleResetInstanceLeads = (instanceId: string, instanceName: string) => {
      setResetConfirmData({ isOpen: true, instanceId, instanceName });
  };

  const confirmResetLeads = async () => {
      if (!activeAgent || !resetConfirmData) return;
      
      setIsResetting(true);
      try {
          const count = await DatabaseService.resetLeadsByInstance(activeAgent.id, resetConfirmData.instanceId);
          alert(`${count} leads voltaram para o status PENDENTE.`);
          fullLoadAgentData(activeAgent.id, true);
          setResetConfirmData(null);
      } catch (e) {
          alert("Erro ao resetar leads.");
      } finally {
          setIsResetting(false);
      }
  };
  
  useEffect(() => {
      if (activeAgent) {
           const saved = localStorage.getItem(`agent_chips_${activeAgent.id}`);
           const savedLimits = localStorage.getItem(`agent_chips_limits_${activeAgent.id}`);
           
           if (saved || savedLimits) {
               setAgents(prev => prev.map(a => {
                   if (a.id === activeAgent.id) {
                       let updated = { ...a };
                       if (saved) {
                           try {
                               const parsed = JSON.parse(saved);
                               if (Array.isArray(parsed)) updated.connectedInstanceIds = parsed;
                           } catch(e) {}
                       }
                       if (savedLimits) {
                           try {
                               const parsed = JSON.parse(savedLimits);
                               if (typeof parsed === 'object') updated.instanceLimits = parsed;
                           } catch(e) {}
                       }
                       return updated;
                   }
                   return a;
               }));
           }
      }
  }, [selectedAgentId]);

  const handleAddPrompt = async () => {
      if (!selectedAgentId) return;
      const newP = await DatabaseService.addPrompt(selectedAgentId, { 
          title: 'Novo Prompt', 
          content: '', 
          isActive: true,
          type: 'AI'
      } as any);
      setAgents(prev => prev.map(a => {
          if (a.id === selectedAgentId) {
              return { ...a, prompts: [...a.prompts, { id: newP.id, title: newP.title, content: newP.content, isActive: newP.is_active, type: newP.type }] };
          }
          return a;
      }));
      setEditingPromptId(newP.id);
  };

  const handleUpdatePrompt = async (promptId: string, field: keyof AgentPrompt, value: any) => {
      if (!activeAgent) return;
      const updatedPrompts = activeAgent.prompts.map(p => p.id === promptId ? { ...p, [field]: value } : p);
      setAgents(prev => prev.map(a => a.id === selectedAgentId ? { ...a, prompts: updatedPrompts } : a));
      setIsSavingPrompt(true);
      try {
          await DatabaseService.updatePrompt(promptId, { [field]: value });
      } finally {
          setIsSavingPrompt(false);
      }
  };

  const handleDeletePrompt = async (promptId: string) => {
      if (!confirm("Excluir este prompt?")) return;
      await DatabaseService.deletePrompt(promptId);
      setAgents(prev => prev.map(a => a.id === selectedAgentId ? { ...a, prompts: a.prompts.filter(p => p.id !== promptId) } : a));
      setEditingPromptId(null);
  };

  const handleAddManualLead = async () => {
      if (!newLeadPhone || !selectedAgentId) return;
      const lead = { name: newLeadName, phone: newLeadPhone.replace(/\D/g, ''), status: LeadStatus.PENDING, data: {} };
      await DatabaseService.addLeads(selectedAgentId, [lead as any]);
      fullLoadAgentData(selectedAgentId);
      setShowAddLeadModal(false);
      setNewLeadName('');
      setNewLeadPhone('');
  };

  const handleDeleteLead = async (leadId: string) => {
      if (!confirm("Remover lead do banco de dados?")) return;
      await DatabaseService.deleteLead(leadId);
      setDbLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
  };

  const handleManualMarkSent = () => {
      if (selectedLeads.length === 0) return;
      setShowMarkSentModal(true);
  };

  const executeManualMarkSent = async () => {
      try {
          if (selectedLeads.length > 0) {
              await DatabaseService.bulkUpdateLeadStatus(selectedLeads, LeadStatus.SENT);
              setDbLeads(prev => prev.map(l => selectedLeads.includes(l.id) ? { ...l, status: LeadStatus.SENT } : l));
          }
          setSelectedLeads([]);
          setShowMarkSentModal(false);
      } catch (e) {
          alert("Erro ao atualizar status.");
      }
  };

  const handleSyncTrigger = () => {
      setSyncResult(null);
      setShowSyncModal(true);
  };

  const executeSync = async () => {
      setIsSyncing(true);
      try {
          const pendingLeads = dbLeads.filter(l => l.status === LeadStatus.PENDING);
          if (pendingLeads.length === 0) {
              setSyncResult("Nenhum lead pendente para verificar.");
              setIsSyncing(false);
              return;
          }
          const phones = pendingLeads.map(l => l.phone);
          const sentPhones = await DatabaseService.findSentPhones(phones);
          
          if (sentPhones.length === 0) {
              setSyncResult("Varredura completa. Nenhum duplicado encontrado no sistema.");
          } else {
              const dbLeadsToUpdate = dbLeads.filter(l => sentPhones.includes(l.phone));
              if (dbLeadsToUpdate.length > 0) {
                  const ids = dbLeadsToUpdate.map(l => l.id);
                  await DatabaseService.bulkUpdateLeadStatus(ids, LeadStatus.SENT);
                  setDbLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: LeadStatus.SENT } : l));
              }
              const totalUpdated = dbLeadsToUpdate.length;
              setSyncResult(`PROTEÇÃO ATIVA: ${totalUpdated} leads foram marcados como ENVIADO pois já constam no histórico.`);
          }
      } catch (e) {
          console.error(e);
          setSyncResult("Erro ao realizar a varredura.");
      } finally {
          setIsSyncing(false);
      }
  };

  const handleTestRun = async (lead: Lead) => {
      const chipIds = activeAgent?.connectedInstanceIds || (activeAgent?.connectedInstanceId ? [activeAgent.connectedInstanceId] : []);
      const primaryChipId = activeAgent?.connectedInstanceId || chipIds[0];
      if (!primaryChipId) {
          alert("Por favor, conecte pelo menos um chip na aba CHIPS antes de testar.");
          return;
      }
      setTestStatusMessage(null);
      setSelectedLeads([lead.id]);
      setSelectedLeadsFullObjects([lead]);
      setShowTestModal(true);
  };

  const handleBulkTestTrigger = () => {
      const chipIds = activeAgent?.connectedInstanceIds || (activeAgent?.connectedInstanceId ? [activeAgent.connectedInstanceId] : []);
      const primaryChipId = activeAgent?.connectedInstanceId || chipIds[0];
      if (!primaryChipId) {
          alert("Por favor, conecte pelo menos um chip na aba CHIPS antes de testar.");
          return;
      }
      if (selectedLeads.length === 0) {
          alert("Selecione leads para testar.");
          return;
      }
      setTestStatusMessage(null);
      setShowTestModal(true);
  };

  const executeBulkTest = async () => {
      const chipIds = activeAgent?.connectedInstanceIds || (activeAgent?.connectedInstanceId ? [activeAgent.connectedInstanceId] : []);
      const primaryChipId = activeAgent?.connectedInstanceId || chipIds[0];
      if (!primaryChipId) return;
      const instance = instances.find(i => i.id === primaryChipId);
      if (!instance) {
          alert("Erro: Chip principal offline ou desconectado.");
          return;
      }

      const testNum = getTestNumber(instance.name);
      setIsTesting(true);
      testStopFlagRef.current = false;
      setTestStatusMessage(null);
      setTestProgress({ current: 0, total: selectedLeads.length });
      
      let successCount = 0;
      const allLeads = [...dbLeads];
      
      for (let i = 0; i < selectedLeads.length; i++) {
          if (testStopFlagRef.current) {
              break;
          }
          
          const leadId = selectedLeads[i];
          setTestProgress({ current: i + 1, total: selectedLeads.length });
          
          const lead = allLeads.find(l => l.id === leadId);
          if (!lead) continue;
          
          try {
              const message = await generateAgentMessage(activeAgent, lead);
              let success = false;
              if (lead.data?.print_base64) {
                  success = await EvolutionService.sendMedia(settings, instance.name, testNum, lead.data.print_base64, message);
              } else {
                  success = await EvolutionService.sendText(settings, instance.name, testNum, message);
              }
              if (success) {
                  successCount++;
              }
          } catch (e) {
              console.error("Erro ao enviar mensagem de teste:", e);
          }
          
          if (i < selectedLeads.length - 1 && !testStopFlagRef.current) {
              // delay of 1.5s between test messages, with interruption check
              await new Promise(r => {
                  const checkInterval = setInterval(() => {
                      if (testStopFlagRef.current) {
                          clearInterval(checkInterval);
                          r(null);
                      }
                  }, 100);
                  setTimeout(() => {
                      clearInterval(checkInterval);
                      r(null);
                  }, 1500);
              });
          }
      }
      
      setIsTesting(false);
      if (testStopFlagRef.current) {
          setTestStatusMessage(`Teste pausado! ${successCount} mensagens enviadas.`);
      } else {
          setTestStatusMessage(`Teste concluído! ${successCount}/${selectedLeads.length} mensagens enviadas.`);
      }
  };

  const handleBulkDelete = async () => {
      if (selectedLeads.length === 0) return;
      setIsDeleting(true);
      try {
          await DatabaseService.deleteLeads(selectedLeads);
          setDbLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
          setSelectedLeads([]);
          setShowDeleteConfirm(false);
      } catch (e) {
          alert("Erro ao excluir leads.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handleBulkExport = async () => {
      if (selectedLeads.length === 0) {
          alert("Selecione os leads que deseja exportar.");
          return;
      }
      setIsExporting(true);
      setExportProgress('Obtendo dados completos...');
      try {
          const fullLeads = await DatabaseService.getLeadsByIds(selectedLeads);
          if (!fullLeads || fullLeads.length === 0) {
              alert("Não foi possível carregar os dados dos leads.");
              setIsExporting(false);
              return;
          }

          setExportProgress('Criando arquivo ZIP...');
          const zip = new JSZip();

          for (let i = 0; i < fullLeads.length; i++) {
              const lead = fullLeads[i];
              setExportProgress(`Processando ${i + 1}/${fullLeads.length}...`);
              
              const cleanName = lead.name.replace(/[\\/:*?"<>|]/g, '_');
              const folderName = `${cleanName}_${lead.phone}`;
              const leadFolder = zip.folder(folderName);

              if (!leadFolder) continue;

              const jsonOutput: Record<string, any> = {
                  name: lead.name,
                  phoneNumber: lead.phone,
              };

              if (lead.data) {
                  if (lead.data.nota || lead.data.rating) {
                      jsonOutput.rating = Number(lead.data.nota || lead.data.rating);
                  }
                  if (lead.data.resumo || lead.data.summary) {
                      jsonOutput.summary = lead.data.resumo || lead.data.summary;
                  }
                  if (lead.data.endereco || lead.data.address) {
                      jsonOutput.address = lead.data.endereco || lead.data.address;
                  }
                  if (lead.data.website) {
                      jsonOutput.website = lead.data.website;
                  }
                  if (lead.data.link_site || (lead.data.dithoSitesMetadata && lead.data.dithoSitesMetadata.publicUrl)) {
                      jsonOutput.dithoSitesMetadata = {
                          publicUrl: lead.data.link_site || lead.data.dithoSitesMetadata?.publicUrl
                      };
                  }

                  Object.keys(lead.data).forEach(key => {
                      if (!['print_base64', 'has_print', 'print_url', 'nota', 'resumo', 'endereco', 'website', 'link_site', 'dithoSitesMetadata'].includes(key)) {
                          jsonOutput[key] = lead.data[key];
                      }
                  });
              }

              leadFolder.file('data.json', JSON.stringify(jsonOutput, null, 2));

              const printBase64 = lead.data?.print_base64;
              if (printBase64 && typeof printBase64 === 'string') {
                  const match = printBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                  if (match) {
                      const mimeType = match[1];
                      const base64Data = match[2];
                      const extension = mimeType.split('/')[1] || 'png';
                      leadFolder.file(`print.${extension}`, base64Data, { base64: true });
                  }
              }
          }

          setExportProgress('Finalizando compactação...');
          const content = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(content);
          const link = document.createElement('a');
          const date = new Date().toISOString().split('T')[0];
          link.href = url;
          link.download = `EXPORTACAO_LEADS_DITHO_${date}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          alert("LOTE DE LEADS EXPORTADO EM ZIP COM SUCESSO!");
      } catch (err: any) {
          console.error(err);
          alert(`Falha ao exportar leads: ${err.message}`);
      } finally {
          setIsExporting(false);
          setExportProgress('');
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedAgentId) return;
      setIsImporting(true);
      setImportProgress('Lendo arquivo ZIP...');
      try {
          const newLeads: any[] = [];
          if (file.name.endsWith('.zip')) {
              const zip = new JSZip();
              await zip.loadAsync(file);
              const jsonFiles: any[] = [];
              const allImages: any[] = [];

              zip.forEach((relativePath: string, zipEntry: any) => {
                  if (zipEntry.dir) return;
                  
                  // Normalize Windows backslashes
                  const normalizedPath = relativePath.replace(/\\/g, '/');
                  
                  // Ignore macOS metadata and system files
                  if (normalizedPath.includes('__MACOSX') || normalizedPath.split('/').some(part => part.startsWith('._'))) {
                      return;
                  }

                  if (normalizedPath.endsWith('.json')) {
                      jsonFiles.push({ path: normalizedPath, entry: zipEntry });
                  } 
                  else if (normalizedPath.match(/\.(jpg|jpeg|png|webp)$/i)) {
                      const pathParts = normalizedPath.split('/');
                      const filename = pathParts.pop() || '';
                      const dir = pathParts.join('/');
                      const nameNoExt = filename.split('.')[0] || '';
                      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
                      
                      allImages.push({
                          path: normalizedPath,
                          filename,
                          nameNoExt,
                          dir,
                          ext,
                          entry: zipEntry
                      });
                  }
              });

              setImportProgress(`Encontrados ${jsonFiles.length} leads. Processando...`);
              let processedCount = 0;
              
              for (const fileObj of jsonFiles) {
                  try {
                      const content = await fileObj.entry.async("string");
                      const json = JSON.parse(content);
                      const rawPhone = json.phoneNumber || json.phone || "";
                      const phone = rawPhone.replace(/\D/g, '');
                      
                      if (phone.length >= 10) {
                          const name = json.name || json.nome || "Cliente";
                          const flattenedData: Record<string, any> = {};
                          
                          // Smart Image Matching Strategy
                          let imageEntry = null;
                          const pathParts = fileObj.path.split('/');
                          pathParts.pop();
                          const jsonDir = pathParts.join('/');
                          
                          // 1. Prioritize images in the exact same directory
                          const imagesInSameDir = allImages.filter(img => img.dir === jsonDir);
                          
                          if (imagesInSameDir.length > 0) {
                              const printImage = imagesInSameDir.find(img => 
                                  img.filename.toLowerCase().match(/(print|screenshot|screen|captura|site|img)/)
                              );
                              const nonLogoImage = imagesInSameDir.find(img => 
                                  !img.filename.toLowerCase().match(/(logo|icon|avatar)/)
                              );
                              imageEntry = printImage || nonLogoImage || imagesInSameDir[0];
                          }
                          
                          // 2. Search globally in zip for folder name matches (in case flat/different structures)
                          if (!imageEntry) {
                              const folderName = jsonDir.split('/').pop();
                              if (folderName) {
                                  imageEntry = allImages.find(img => 
                                      img.nameNoExt.toLowerCase() === folderName.toLowerCase() ||
                                      img.nameNoExt.toLowerCase().includes(folderName.toLowerCase())
                                  );
                              }
                          }
                          
                          // 3. Search globally for matching lead name
                          if (!imageEntry) {
                              const cleanLeadName = name.replace(/[\\/:*?"<>|]/g, '_').toLowerCase();
                              imageEntry = allImages.find(img => 
                                  img.nameNoExt.toLowerCase() === cleanLeadName ||
                                  img.nameNoExt.toLowerCase().includes(cleanLeadName) ||
                                  cleanLeadName.includes(img.nameNoExt.toLowerCase())
                              );
                          }

                          if (imageEntry) {
                              const base64Data = await imageEntry.entry.async("base64");
                              const ext = imageEntry.ext;
                              const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                              const fullBase64 = `data:${mime};base64,${base64Data}`;
                              flattenedData['print_base64'] = fullBase64;
                              flattenedData['has_print'] = true;
                          }
                          
                          if (json.rating) flattenedData['nota'] = json.rating.toString();
                          if (json.summary) flattenedData['resumo'] = json.summary;
                          if (json.address) flattenedData['endereco'] = json.address;
                          if (json.website) flattenedData['website'] = json.website;
                          if (json.dithoSitesMetadata?.publicUrl) flattenedData['link_site'] = json.dithoSitesMetadata.publicUrl;
                          
                          Object.keys(json).forEach(key => {
                              if (typeof json[key] === 'string' || typeof json[key] === 'number') {
                                  if (!['name', 'phoneNumber', 'id'].includes(key)) {
                                      if (!flattenedData[key]) flattenedData[key] = String(json[key]).substring(0, 500);
                                  }
                              }
                          });
                          
                          newLeads.push({ 
                              agent_id: selectedAgentId,
                              name, 
                              phone, 
                              status: LeadStatus.PENDING, 
                              data: flattenedData
                          });
                          processedCount++;
                          if (processedCount % 50 === 0) {
                              setImportProgress(`Processando ${processedCount}/${jsonFiles.length}...`);
                              await new Promise(r => setTimeout(r, 0));
                          }
                      }
                  } catch (err) {
                      console.error("Erro ao processar lead no zip:", err);
                  }
              }
              
              setImportProgress('Salvando no Banco (Lotes)...');
              if (newLeads.length > 0) {
                  const inserted = await DatabaseService.addLeads(selectedAgentId, newLeads);
                  
                  setLeadStatusFilter('ALL');
                  setDateFilter('ALL');
                  setCurrentPage(1);
                  fullLoadAgentData(selectedAgentId);
                  alert(`${inserted.length} leads importados com sucesso!`);
              } else {
                  alert("Nenhum lead válido encontrado ou todos já existem.");
              }
          }
      } catch (e: any) { 
        console.error(e);
        alert(`Erro na importação: ${e.message}`); 
      } finally { 
        setIsImporting(false); 
        setImportProgress('');
        e.target.value = ''; 
      }
  };

  const handleUpdatePrintsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedAgentId) return;
      setIsUpdatingPrints(true);
      setUpdatePrintsProgress('Buscando leads no banco de dados...');
      try {
          // 1. Fetch slim version of all existing leads for the current agent
          const allLeads = await DatabaseService.getAllLeadsSlim(selectedAgentId);
          if (allLeads.length === 0) {
              alert("Não há nenhum lead cadastrado para este agente.");
              setIsUpdatingPrints(false);
              return;
          }

          setUpdatePrintsProgress('Lendo arquivo ZIP...');
          const zip = new JSZip();
          await zip.loadAsync(file);

          const jsonFiles: any[] = [];
          const allImages: any[] = [];

          zip.forEach((relativePath: string, zipEntry: any) => {
              if (zipEntry.dir) return;
              
              const normalizedPath = relativePath.replace(/\\/g, '/');
              if (normalizedPath.includes('__MACOSX') || normalizedPath.split('/').some(part => part.startsWith('._'))) {
                  return;
              }

              if (normalizedPath.endsWith('.json')) {
                  jsonFiles.push({ path: normalizedPath, entry: zipEntry });
              } 
              else if (normalizedPath.match(/\.(jpg|jpeg|png|webp)$/i)) {
                  const pathParts = normalizedPath.split('/');
                  const filename = pathParts.pop() || '';
                  const dir = pathParts.join('/');
                  const nameNoExt = filename.split('.')[0] || '';
                  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
                  
                  allImages.push({
                      path: normalizedPath,
                      filename,
                      nameNoExt,
                      dir,
                      ext,
                      entry: zipEntry
                  });
              }
          });

          setUpdatePrintsProgress('Mapeando estrutura do ZIP...');
          // Map zip directory to phone numbers
          const dirToPhoneMap = new Map<string, string>();
          for (const fileObj of jsonFiles) {
              try {
                  const content = await fileObj.entry.async("string");
                  const json = JSON.parse(content);
                  const rawPhone = json.phoneNumber || json.phone || "";
                  const phone = rawPhone.replace(/\D/g, '');
                  if (phone.length >= 10) {
                      const pathParts = fileObj.path.split('/');
                      pathParts.pop();
                      const jsonDir = pathParts.join('/');
                      dirToPhoneMap.set(jsonDir, phone);
                  }
              } catch (err) {}
          }

          // Filter leads that don't have prints
          const leadsMissingPrint = allLeads.filter(l => !l.data?.print_base64 && !l.data?.has_print);
          if (leadsMissingPrint.length === 0) {
              alert("Excelente! Todos os leads cadastrados já possuem prints/imagens.");
              setIsUpdatingPrints(false);
              return;
          }

          setUpdatePrintsProgress(`Analisando ${leadsMissingPrint.length} leads pendentes...`);
          let matchedCount = 0;
          let updatedCount = 0;

          for (let i = 0; i < leadsMissingPrint.length; i++) {
              const lead = leadsMissingPrint[i];
              setUpdatePrintsProgress(`Processando ${i + 1}/${leadsMissingPrint.length}: ${lead.name}...`);

              const leadPhone = lead.phone.replace(/\D/g, '');
              const cleanLeadName = lead.name.replace(/[\\/:*?"<>|]/g, '_').toLowerCase();

              // Look for matching image in the zip
              let matchedImage = null;

              // Method 1: Match through JSON folder phone
              for (const [dir, phone] of dirToPhoneMap.entries()) {
                  if (phone === leadPhone) {
                      const imagesInDir = allImages.filter(img => img.dir === dir);
                      if (imagesInDir.length > 0) {
                          const printImg = imagesInDir.find(img => 
                              img.filename.toLowerCase().match(/(print|screenshot|screen|captura|site|img)/)
                          );
                          matchedImage = printImg || imagesInDir[0];
                          break;
                      }
                  }
              }

              // Method 2: Match by phone contained in path/filename
              if (!matchedImage) {
                  matchedImage = allImages.find(img => {
                      const match = img.path.match(/\d{10,14}/);
                      return match && match[0] === leadPhone;
                  });
              }

              // Method 3: Match by folder name or file name containing lead's name
              if (!matchedImage) {
                  matchedImage = allImages.find(img => 
                      img.nameNoExt.toLowerCase() === cleanLeadName ||
                      img.nameNoExt.toLowerCase().includes(cleanLeadName) ||
                      cleanLeadName.includes(img.nameNoExt.toLowerCase())
                  );
              }

              if (matchedImage) {
                  matchedCount++;
                  try {
                      const base64Data = await matchedImage.entry.async("base64");
                      const ext = matchedImage.ext;
                      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                      const fullBase64 = `data:${mime};base64,${base64Data}`;

                      // Merge existing lead data
                      const updatedData = {
                          ...(lead.data || {}),
                          print_base64: fullBase64,
                          has_print: true,
                          has_screenshot: true
                      };

                      // Update in Supabase
                      const success = await DatabaseService.updateLeadData(lead.id, updatedData);
                      if (success) {
                          updatedCount++;
                      }
                  } catch (err) {
                      console.error(`Erro ao atualizar base64 para ${lead.name}:`, err);
                  }
              }
          }

          fullLoadAgentData(selectedAgentId);
          alert(`Mapeamento Concluído!\n- Leads sem print analisados: ${leadsMissingPrint.length}\n- Imagens correspondentes encontradas no ZIP: ${matchedCount}\n- Leads atualizados com sucesso no banco: ${updatedCount}`);
      } catch (err: any) {
          console.error(err);
          alert(`Falha ao preencher prints: ${err.message}`);
      } finally {
          setIsUpdatingPrints(false);
          setUpdatePrintsProgress('');
          e.target.value = '';
      }
  };

  // --- TRIGGER PRE-FLIGHT CHECK (FLIGHT MODAL) ---
  const handleTriggerFlightCheck = () => {
      if (!activeAgent || selectedLeads.length === 0) {
          alert("Selecione leads para disparar.");
          return;
      }
      
      const chips = activeAgent.connectedInstanceIds || (activeAgent.connectedInstanceId ? [activeAgent.connectedInstanceId] : []);
      if (chips.length === 0) {
          alert("Selecione pelo menos um chip para disparo.");
          return;
      }
      
      // Open Modal instead of firing directly
      setFlightMode('CHECK');
      setShowFlightModal(true);
      setShowBatchModal(false); // Close batch if open
  };

  // --- CONFIRM START (FROM MODAL) ---
  const handleConfirmStart = () => {
      if (!activeAgent) return;
      setFlightMode('LIVE');
      startAgent(activeAgent.id, selectedLeads);
  };

  const handleStopRun = () => {
      if (!activeAgent) return;
      stopAgent(activeAgent.id);
  };

  const executeBatchRun = async (quantity: number) => {
      if (!activeAgent) return;
      setIsLoadingData(true);
      try {
          // Query the database directly for the next `quantity` PENDING leads that match current filters (date filter, custom dates, etc.)
          const res = await DatabaseService.getLeads(
              activeAgent.id,
              {
                  status: LeadStatus.PENDING,
                  dateFilter: dateFilter,
                  startDate: customStartDate,
                  endDate: customEndDate
              },
              1, // page 1
              quantity, // limit
              true // exclude print base64 for performance
          );

          if (!res || !res.leads || res.leads.length === 0) {
              alert("Não há leads pendentes suficientes para esse filtro.");
              return;
          }

          const leadsForBatch = res.leads;
          const idsToRun = leadsForBatch.map(l => l.id);
          setSelectedLeads(idsToRun);
          setSelectedLeadsFullObjects(leadsForBatch);

          // Trigger modal via timeout to allow state update
          setTimeout(() => {
              setShowBatchModal(false);
              setFlightMode('CHECK');
              setShowFlightModal(true);
          }, 100);
      } catch (err) {
          console.error("Erro ao carregar lote de leads:", err);
          alert("Ocorreu um erro ao carregar os leads do lote.");
      } finally {
          setIsLoadingData(false);
      }
  };

  const filteredLeads = dbLeads;

  const totalPages = Math.ceil(totalLeadsCount / ITEMS_PER_PAGE);
  const paginatedLeads = dbLeads;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const toggleSelectLead = (id: string) => {
      if (selectedLeads.includes(id)) {
          setSelectedLeads(selectedLeads.filter(l => l !== id));
          setSelectedLeadsFullObjects(selectedLeadsFullObjects.filter(l => l.id !== id));
      } else {
          setSelectedLeads([...selectedLeads, id]);
          const found = dbLeads.find(l => l.id === id);
          if (found && !selectedLeadsFullObjects.some(l => l.id === id)) {
              setSelectedLeadsFullObjects([...selectedLeadsFullObjects, found]);
          }
      }
  };

  const toggleSelectAll = () => {
      const visibleIds = paginatedLeads.map(l => l.id);
      const allSelected = visibleIds.every(id => selectedLeads.includes(id));
      if (allSelected) {
          setSelectedLeads(selectedLeads.filter(id => !visibleIds.includes(id)));
          setSelectedLeadsFullObjects(selectedLeadsFullObjects.filter(l => !visibleIds.includes(l.id)));
      } else {
          const newSelected = [...selectedLeads];
          const newObjects = [...selectedLeadsFullObjects];
          
          paginatedLeads.forEach(lead => {
              if (!newSelected.includes(lead.id)) {
                  newSelected.push(lead.id);
                  newObjects.push(lead);
              }
          });
          setSelectedLeads(newSelected);
          setSelectedLeadsFullObjects(newObjects);
      }
  };

  // --- VIEWS ---

  if (!selectedAgentId) {
      return (
          <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-gray-200 pb-6">
                <div><h2 className="text-2xl font-bold text-gray-900">Meus Agentes (SaaS)</h2><p className="text-gray-500 mt-1 text-sm">Gerencie seus agentes salvos na nuvem.</p></div>
                <button onClick={() => setShowCreateModal(true)} className="bg-black text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm shadow-lg"><Plus className="w-4 h-4" /> Novo Agente</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agents.map(agent => {
                      const runState = runningAgents[agent.id];
                      const agentIsActive = runState?.status === 'RUNNING';

                      return (
                          <div key={agent.id} onClick={() => setSelectedAgentId(agent.id)} className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-black transition-all group relative">
                              <div className="flex items-center gap-4 mb-4">
                                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors relative">
                                      <Bot className="w-8 h-8" />
                                      {agentIsActive && (
                                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                          </span>
                                      )}
                                  </div>
                                  <div><h3 className="font-bold text-lg text-gray-900">{agent.name}</h3><p className="text-xs text-gray-400">Gemini 2.5</p></div>
                              </div>
                              <div className="space-y-3 pt-4 border-t border-gray-100">
                                 <div className="flex justify-between text-sm"><span className="text-gray-500">Prompts</span><span className="font-bold text-indigo-600">{agent.prompts?.length || 0}</span></div>
                              </div>
                              {agentIsActive && (
                                  <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-2 flex items-center gap-2 text-xs font-bold text-green-700 animate-in fade-in">
                                      <RefreshCw className="w-3 h-3 animate-spin"/>
                                      Processando: {runState.progress.current}/{runState.progress.total}
                                  </div>
                              )}
                              {runState?.status === 'PAUSED' && (
                                   <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-2 flex items-center gap-2 text-xs font-bold text-yellow-700">
                                      <Pause className="w-3 h-3"/>
                                      Pausado: {runState.progress.current}/{runState.progress.total}
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
              {showCreateModal && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl"><h3 className="text-2xl font-bold mb-6">Novo Agente</h3><input value={newAgentName} onChange={e=>setNewAgentName(e.target.value)} className="w-full border p-3 rounded-lg mb-6" placeholder="Nome" /><div className="flex gap-3"><button onClick={()=>setShowCreateModal(false)} className="flex-1 border p-3 rounded-lg">Cancelar</button><button onClick={handleCreateAgent} className="flex-1 bg-black text-white p-3 rounded-lg">Criar</button></div></div></div>}
          </div>
      );
  }

  if (!activeAgent) return null;
  const currentChat = chats.find(c => c.id === selectedChatId);
  const activeInstanceIds = activeAgent.connectedInstanceIds || (activeAgent.connectedInstanceId ? [activeAgent.connectedInstanceId] : []);

  // Define tab items for rendering
  const tabs = [
    { id: 'prompts', label: 'PROMPTS', icon: Bot },
    { id: 'chips', label: 'CHIPS & SEGURANÇA', icon: Shield },
    { id: 'leads', label: 'LEADS', icon: LayoutList },
    { id: 'chat', label: 'CHAT', icon: MessageSquare }
  ];

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col relative">
      <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => setSelectedAgentId(null)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <input 
                        value={activeAgent.name} 
                        onChange={(e) => handleUpdateAgent('name', e.target.value)}
                        className="text-2xl font-bold bg-white border border-gray-300 rounded px-2 focus:border-black focus:outline-none transition-all w-64 text-gray-900"
                        placeholder="Nome do Agente"
                    />
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded">Multi-Thread</span>
                </div>
                {activeRunState && (
                    <div className="flex items-center gap-2 mt-1 animate-in slide-in-from-top-2">
                         {activeRunState.status === 'RUNNING' && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> {activeRunState.activeWorkers} CHIPS RODANDO: {activeRunState.progress.current}/{activeRunState.progress.total}</span>}
                         {activeRunState.status === 'PAUSED' && <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Pause className="w-3 h-3"/> PAUSADO: {activeRunState.progress.current}/{activeRunState.progress.total}</span>}
                         {activeRunState.status === 'COMPLETED' && <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><CheckSquare className="w-3 h-3"/> CONCLUÍDO</span>}
                    </div>
                )}
            </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
            {tabs.map(t => (
                <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id as any)} 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-white shadow text-black font-bold' : 'text-gray-500'}`}
                >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* PROMPTS TAB */}
        {activeTab === 'prompts' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-1/3 bg-gray-50 border-r p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold uppercase">Biblioteca de Prompts</h3><button onClick={handleAddPrompt} className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800">Add</button></div>
                    <div className="space-y-3">{activeAgent.prompts?.map(p => (
                        <div key={p.id} onClick={()=>setEditingPromptId(p.id)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:border-black transition-colors ${editingPromptId===p.id ? 'ring-2 ring-black border-transparent shadow-md':''}`}>
                            <div className="flex justify-between mb-1">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-gray-900">{p.title}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mt-1 ${p.type === 'STATIC' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {p.type === 'STATIC' ? 'ESTÁTICO' : 'IA'}
                                    </span>
                                </div>
                                <button onClick={(e)=>{e.stopPropagation();handleUpdatePrompt(p.id,'isActive',!p.isActive)}}>{p.isActive?<ToggleRight className="text-green-600 w-6 h-6"/>:<ToggleLeft className="text-gray-300 w-6 h-6"/>}</button>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2 mt-2">{p.content}</p>
                        </div>
                    ))}</div>
                    <div className="mt-8 border-t pt-4">
                        <h3 className="text-sm font-bold uppercase mb-2">Variáveis Inteligentes</h3>
                        <p className="text-xs text-gray-400 mb-2">Clique para copiar e usar no editor.</p>
                        <div className="flex flex-wrap gap-2">
                            {availableVariables.map(v => (
                                <span key={v} className={`px-2 py-1 text-xs rounded border font-mono select-all cursor-pointer ${v.includes('IMAGEM') ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold' : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'}`} title="Clique para copiar">{v}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-2/3 p-6 flex flex-col relative bg-white">
                     {editingPromptId ? (() => {
                         const prompt = activeAgent.prompts?.find(p => p.id === editingPromptId);
                         if (!prompt) return null;
                         return (
                             <>
                                <div className="flex justify-between mb-4 gap-4 items-center border-b pb-4">
                                    <div className="flex-1">
                                        <input 
                                            value={prompt.title} 
                                            onChange={(e)=>handleUpdatePrompt(prompt.id,'title',e.target.value)} 
                                            className="font-bold text-2xl w-full bg-white text-gray-900 outline-none placeholder-gray-300" 
                                            placeholder="Nome do Prompt"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button 
                                                onClick={() => handleUpdatePrompt(prompt.id, 'type', 'AI')}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 ${prompt.type !== 'STATIC' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                            >
                                                <Zap className="w-3 h-3" /> MODO IA
                                            </button>
                                            <button 
                                                onClick={() => handleUpdatePrompt(prompt.id, 'type', 'STATIC')}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 ${prompt.type === 'STATIC' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                            >
                                                <FileText className="w-3 h-3" /> MODO ESTÁTICO
                                            </button>
                                        </div>
                                    </div>
                                    {isSavingPrompt && <span className="text-xs text-gray-400 animate-pulse">Salvando...</span>}
                                    <button onClick={()=>handleDeletePrompt(prompt.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-5 h-5" /></button>
                                </div>
                                <div className="flex-1 relative">
                                    <textarea 
                                        value={prompt.content} 
                                        onChange={(e)=>handleUpdatePrompt(prompt.id,'content',e.target.value)} 
                                        className="w-full h-full bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10 text-gray-900 font-mono leading-relaxed" 
                                        placeholder={prompt.type === 'STATIC' ? "Escreva sua mensagem fixa aqui. Use {{variável}} para personalizar..." : "Escreva aqui as instruções do sistema para a IA..."} 
                                    />
                                    {prompt.type === 'STATIC' && (
                                        <div className="absolute bottom-4 right-4 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-100 shadow-sm flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-emerald-400" /> ECONOMIA ATIVA: 0 TOKENS
                                        </div>
                                    )}
                                </div>
                             </>
                         )
                     })() : <div className="flex-1 flex items-center justify-center text-gray-300 flex-col gap-2"><Settings className="w-10 h-10 opacity-20"/><span>Selecione um prompt para editar.</span></div>}
                </div>
            </div>
        )}

        {/* CHIPS TAB */}
        {activeTab === 'chips' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-1/3 bg-gray-50 border-r p-6 overflow-y-auto">
                     <div className="mb-6">
                         <h3 className="font-bold text-lg text-gray-900 mb-1">Exército de Disparo</h3>
                         <p className="text-xs text-gray-500 mb-4">Selecione quais chips este agente pode utilizar.</p>
                         <div className="bg-white border border-gray-200 rounded-xl p-2 max-h-[calc(100vh-300px)] overflow-y-auto shadow-sm space-y-1">
                             {instances.map(i => {
                                 const isSelected = activeInstanceIds.includes(i.id);
                                 const isConnected = i.status === 'CONNECTED';
                                 const canToggle = isConnected || isSelected;
                                 return (
                                     <div 
                                        key={i.id} 
                                        onClick={() => canToggle && toggleInstance(i.id)}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border ${isSelected && isConnected ? 'bg-blue-50 border-blue-200 shadow-sm' : ''} ${isSelected && !isConnected ? 'bg-red-50 border-red-300 shadow-sm' : ''} ${!isSelected && isConnected ? 'bg-white border-transparent hover:bg-gray-50' : ''} ${!isSelected && !isConnected ? 'bg-white border-transparent opacity-50 grayscale cursor-not-allowed' : ''}`}
                                     >
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected && isConnected ? 'bg-blue-600 border-blue-600' : ''} ${isSelected && !isConnected ? 'bg-red-500 border-red-500' : ''} ${!isSelected ? 'border-gray-300 bg-white' : ''}`}>
                                             {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                                         </div>
                                         <div className="flex-1">
                                             <div className={`text-sm font-bold ${isSelected && !isConnected ? 'text-red-700' : 'text-gray-800'}`}>
                                                {i.name}
                                             </div>
                                             <div className="text-xs text-gray-400 font-mono">{i.phoneNumber}</div>
                                         </div>
                                         {isSelected && isConnected && (
                                             <div className="flex items-center gap-2 mr-2" onClick={e => e.stopPropagation()}>
                                                 <button 
                                                     onClick={() => handleResetInstanceLeads(i.id, i.name)}
                                                     disabled={isResetting}
                                                     className={`p-1.5 rounded transition-colors ${isResetting ? 'text-gray-400 bg-gray-100' : 'text-amber-600 hover:bg-amber-50 stroke-[2.5]'}`}
                                                     title="Resetar Leads de Hoje"
                                                 >
                                                     <RefreshCw className={`w-4 h-4 ${isResetting && resetConfirmData?.instanceId === i.id ? 'animate-spin' : ''}`} />
                                                 </button>
                                                 <span className="text-[9px] font-bold text-gray-400 uppercase">Limite:</span>
                                                 <input 
                                                     type="number"
                                                     min="0"
                                                     placeholder="∞"
                                                     value={activeAgent.instanceLimits?.[i.id] || ''}
                                                     onChange={e => updateInstanceLimit(i.id, parseInt(e.target.value) || 0)}
                                                     className="w-12 bg-white border border-gray-200 rounded text-center text-xs p-1 focus:ring-1 focus:ring-black outline-none"
                                                 />
                                             </div>
                                         )}
                                         {!isConnected && <span className="text-[10px] text-white font-bold bg-red-500 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3"/> OFF</span>}
                                     </div>
                                 )
                             })}
                             {instances.length === 0 && <div className="text-xs text-center text-gray-400 p-8">Nenhum chip conectado.</div>}
                         </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-800">
                        <p className="font-bold mb-1">Nota sobre Multi-Thread:</p>
                        <p>O sistema irá distribuir os leads automaticamente entre os chips selecionados para aumentar a velocidade de disparo.</p>
                    </div>
                </div>
                <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-white">
                    <SafetyBrain config={safetyConfig} setConfig={setSafetyConfig} />
                </div>
            </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
            <div className="flex flex-col h-full p-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                {filteredLeads.length} Leads
                            </h3>
                            <button onClick={() => fullLoadAgentData(activeAgent.id)} className="text-gray-400 hover:text-black" title="Forçar Atualização">
                                <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin': ''}`}/>
                            </button>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {(['ALL', 'PENDING', 'SENT', 'FAILED'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => { setLeadStatusFilter(status); setCurrentPage(1); }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${leadStatusFilter === status ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        {status === 'ALL' ? 'Todos' : status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                <Calendar className="w-4 h-4 text-gray-400"/>
                                <span className="text-xs font-bold text-gray-500 uppercase">Data:</span>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {(['ALL', 'TODAY', 'YESTERDAY', 'CUSTOM'] as const).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => { setDateFilter(d); setCurrentPage(1); }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${dateFilter === d ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        {d === 'ALL' ? 'Tudo' : d === 'TODAY' ? 'Hoje' : d === 'YESTERDAY' ? 'Ontem' : 'Personalizado'}
                                    </button>
                                ))}
                            </div>

                            {dateFilter === 'CUSTOM' && (
                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-left-1 duration-200">
                                    <input 
                                        type="date" 
                                        value={customStartDate} 
                                        onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                                        className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-750 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-400 font-bold">até</span>
                                    <input 
                                        type="date" 
                                        value={customEndDate} 
                                        onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                                        className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-750 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap justify-end">
                        {!isRunning && (
                             <button 
                                onClick={() => setShowBatchModal(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2 rounded font-bold transition-all shadow-lg shadow-purple-200 text-sm animate-in fade-in"
                                title="Seleciona um lote personalizado de leads pendentes"
                            >
                                <Rocket className="w-4 h-4 fill-white text-white"/> DISPARO TÁTICO
                            </button>
                        )}

                        {selectedLeads.length > 0 && (
                            <button 
                                onClick={handleManualMarkSent}
                                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded font-bold transition-colors shadow-sm text-sm"
                            >
                                <CheckCircle className="w-4 h-4"/> Marcar Enviado
                            </button>
                        )}

                        {selectedLeads.length > 0 && (
                            <button 
                                onClick={handleBulkExport}
                                disabled={isExporting}
                                className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 px-4 py-2 rounded font-bold transition-colors shadow-sm text-sm"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin"/> {exportProgress || 'Exportando'}
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4"/> Exportar ZIP ({selectedLeads.length})
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={handleSyncTrigger}
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded font-bold transition-colors shadow-sm text-sm"
                        >
                            <RefreshCw className="w-4 h-4" /> Sincronizar
                        </button>

                         {selectedLeads.length > 0 && (
                            <button 
                                onClick={handleBulkTestTrigger}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-blue-200 text-sm"
                            >
                                <FlaskConical className="w-4 h-4"/> TESTAR
                            </button>
                        )}

                        {selectedLeads.length > 0 && (
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded font-bold transition-colors shadow-sm text-sm"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        )}

                        {/* DISPARAR / ANALISAR BUTTON */}
                        {selectedLeads.length > 0 && (
                            <>
                                {isRunning ? (
                                    <button 
                                        onClick={handleTriggerFlightCheck} 
                                        className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-gray-200 text-sm animate-pulse"
                                    >
                                        <Activity className="w-4 h-4"/> MONITORAR (AO VIVO)
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleTriggerFlightCheck} 
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-green-200 text-sm"
                                    >
                                        <Play className="w-4 h-4"/> PREPARAR DISPARO ({selectedLeads.length})
                                    </button>
                                )}
                            </>
                        )}
                        
                        <button onClick={() => setShowAddLeadModal(true)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 font-medium text-sm">Add Manual</button>
                        <div className="relative"><button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded font-bold flex gap-2 text-sm"><Upload className="w-4 h-4"/> {isImporting? importProgress || 'Processando' : 'Importar ZIP'}</button><input type="file" accept=".zip" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isImporting} /></div>
                        <div className="relative">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold flex gap-2 text-sm items-center">
                                <Camera className="w-4 h-4"/> 
                                {isUpdatingPrints ? updatePrintsProgress || 'Preenchendo...' : 'Preencher Prints (ZIP)'}
                            </button>
                            <input 
                                type="file" 
                                accept=".zip" 
                                onChange={handleUpdatePrintsUpload} 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                disabled={isUpdatingPrints} 
                            />
                        </div>
                    </div>
                </div>
                {isLoadingData ? <div className="text-center py-20 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2"/><span>Sincronizando com o Banco de Dados...</span></div> : (
                    <>
                    <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white relative">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                                <tr>
                                    <th className="p-3 w-10 text-center"><button onClick={toggleSelectAll}><Square className="w-4 h-4 mx-auto"/></button></th>
                                    <th className="p-3 text-left font-bold text-gray-700">Lead / Empresa</th>
                                    <th className="p-3 text-left font-bold text-gray-700">Checklist de Dados</th>
                                    <th className="p-3 text-left font-bold text-gray-700">Telefone</th>
                                    <th className="p-3 text-left font-bold text-gray-700">Status</th>
                                    <th className="p-3 text-left font-bold text-gray-700">Importado em</th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedLeads.map(l => {
                                    return (
                                        <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3 text-center"><button onClick={()=>toggleSelectLead(l.id)}>{selectedLeads.includes(l.id)?<CheckSquare className="w-4 h-4 mx-auto text-black"/>:<Square className="w-4 h-4 mx-auto text-gray-300"/>}</button></td>
                                            <td className="p-3 font-medium text-gray-900">
                                                <div className="flex flex-col">
                                                    <span className="font-bold flex items-center gap-2">
                                                        {l.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{l.data?.nicho || 'Geral'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (l.data?.print_url) {
                                                                setPreviewImage({ url: l.data.print_url, name: l.name });
                                                            } else if (l.data?.print_base64) {
                                                                setPreviewImage({ url: l.data.print_base64, name: l.name });
                                                            } else if (l.data?.has_print) {
                                                                setIsLoadingData(true);
                                                                try {
                                                                    const fullLeads = await DatabaseService.getLeadsByIds([l.id]);
                                                                    if (fullLeads && fullLeads[0]?.data?.print_base64) {
                                                                        setPreviewImage({ url: fullLeads[0].data.print_base64, name: l.name });
                                                                    } else {
                                                                        alert("Print não encontrado no banco.");
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Error loading print preview", err);
                                                                } finally {
                                                                    setIsLoadingData(false);
                                                                }
                                                            }
                                                        }}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-colors ${
                                                            l.data?.print_base64 || l.data?.has_print || l.data?.print_url
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' 
                                                            : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50 cursor-default'
                                                        }`} 
                                                        title={l.data?.print_base64 || l.data?.has_print || l.data?.print_url ? "Clique para ver o print" : "Sem Print"}
                                                    >
                                                        <ImageIcon className="w-3 h-3" />
                                                        <span className="font-bold">{l.data?.has_print ? 'Print (Nuvem)' : 'Print'}</span>
                                                    </div>

                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                                                        l.data?.link_site || l.data?.dithoSitesMetadata?.publicUrl
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                        : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50'
                                                    }`} title={l.data?.link_site ? "Link Ditho Encontrado" : "Sem Link Ditho"}>
                                                        <LinkIcon className="w-3 h-3" />
                                                        <span className="font-bold">Link</span>
                                                    </div>

                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                                                        l.data?.website
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50'
                                                    }`} title={l.data?.website ? "Possui Site Atual" : "Sem Site Atual"}>
                                                        <Globe className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-gray-600">{l.phone}</td>
                                            <td className="p-3">
                                                <span className={`text-xs font-bold border px-2 py-1 rounded-full flex w-fit items-center gap-1 ${
                                                    l.status==='SENT' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                    l.status==='FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                    {l.status === 'SENT' && <CheckSquare className="w-3 h-3"/>}
                                                    {l.status === 'FAILED' && <AlertCircle className="w-3 h-3"/>}
                                                    {l.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-3 text-right flex justify-end gap-2">
                                                <button onClick={() => handleTestRun(l)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Enviar Teste (Meu Número)">
                                                    <FlaskConical className="w-4 h-4" />
                                                </button>
                                                <button onClick={()=>handleDeleteLead(l.id)}><Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500 transition-colors"/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-10 text-center text-gray-400 italic">
                                            {dbLeads.length === 0 ? "O banco retornou 0 leads. Verifique a importação." : "Nenhum lead encontrado neste filtro."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* PAGINATION CONTROLS */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">
                            Mostrando {paginatedLeads.length} de {filteredLeads.length} leads
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-bold text-gray-700">
                                Página {currentPage} de {totalPages || 1}
                            </span>
                            <button 
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    </>
                )}
            </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
            <div className="flex h-full overflow-hidden">
                <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-200 font-bold text-sm bg-gray-50 flex justify-between items-center">
                        <span>Histórico de Conversas</span>
                        <button onClick={() => fullLoadAgentData(activeAgent.id)} className="text-gray-400 hover:text-black"><RefreshCw className="w-4 h-4"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {chats.length === 0 && <div className="p-4 text-xs text-gray-400 text-center">Nenhuma conversa iniciada.</div>}
                        {chats.map(c => (
                            <div key={c.id} onClick={()=>setSelectedChatId(c.id)} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group ${selectedChatId===c.id?'bg-gray-100 border-l-4 border-l-black':''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold text-sm text-gray-900">{c.name}</div>
                                    <div className="text-[10px] text-gray-400">{c.lastMsgTime ? new Date(c.lastMsgTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
                                </div>
                                <div className="text-xs text-gray-500 truncate group-hover:text-gray-700">{c.lastMsg}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 bg-[#e5ddd5]/30 relative flex flex-col">
                     {currentChat ? (
                         <>
                            <div className="p-3 bg-white border-b border-gray-200 font-bold flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{currentChat.name.charAt(0)}</div>
                                    <div>
                                        <div className="text-sm">{currentChat.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{currentChat.phone}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-green-600 font-medium">Conectado</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-10">
                                {currentChat.messages.map(m => (
                                    <div key={m.id} className={`flex ${m.sender==='agent'?'justify-end':'justify-start'}`}>
                                        <div className={`p-3 max-w-[70%] rounded-lg text-sm shadow-sm relative ${m.sender==='agent'?'bg-[#d9fdd3] text-gray-900 rounded-tr-none':'bg-white text-gray-900 rounded-tl-none'}`}>
                                            {m.text}
                                            <div className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                                                {new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                {m.sender === 'agent' && <CheckSquare className="w-3 h-3 text-blue-500"/>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </>
                     ) : <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2"><MessageSquare className="w-12 h-12 opacity-20"/><span>Selecione uma conversa para monitorar</span></div>}
                </div>
            </div>
        )}
      </div>
      
      {showAddLeadModal && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl"><h3 className="text-lg font-bold mb-6">Novo Lead</h3><div className="space-y-4"><input type="text" value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="Nome" className="w-full border rounded-lg px-4 py-2.5 focus:ring-black focus:border-black" /><input type="tel" value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="5511999998888" className="w-full border rounded-lg px-4 py-2.5 focus:ring-black focus:border-black" /><button onClick={handleAddManualLead} disabled={!newLeadPhone} className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800">Adicionar</button><button onClick={() => setShowAddLeadModal(false)} className="w-full text-gray-500 py-2 hover:bg-gray-50 rounded-lg">Cancelar</button></div></div></div>}

      {/* BATCH SELECTOR MODAL (NEW) */}
      {showBatchModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                      <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Defina o Tamanho do Lote</h3>
                  <p className="text-center text-gray-500 text-sm mb-6">
                      Escolha quantos leads deseja disparar agora.
                      <br/>Lotes menores são mais seguros para o chip.
                  </p>
                  
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      <button 
                          onClick={() => executeBatchRun(10)}
                          className="w-full p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 flex items-center justify-between group transition-all"
                      >
                          <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-lg text-green-700"><Shield className="w-4 h-4"/></div>
                              <div className="text-left">
                                  <div className="font-bold text-gray-900 group-hover:text-green-700">10 Leads</div>
                                  <div className="text-xs text-gray-500">Modo Seguro (Recomendado)</div>
                              </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500"/>
                      </button>

                      <button 
                          onClick={() => executeBatchRun(20)}
                          className="w-full p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 flex items-center justify-between group transition-all"
                      >
                          <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg text-blue-700"><Zap className="w-4 h-4"/></div>
                              <div className="text-left">
                                  <div className="font-bold text-gray-900 group-hover:text-blue-700">20 Leads</div>
                                  <div className="text-xs text-gray-500">Modo Padrão</div>
                              </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500"/>
                      </button>

                      <button 
                          onClick={() => executeBatchRun(30)}
                          className="w-full p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-between group transition-all border-b-2"
                      >
                          <div className="flex items-center gap-3">
                              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700"><Rocket className="w-4 h-4"/></div>
                              <div className="text-left">
                                  <div className="font-bold text-gray-900 group-hover:text-indigo-700">30 Leads</div>
                                  <div className="text-xs text-gray-500">Modo Agressivo</div>
                              </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500"/>
                      </button>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                          {[50, 80, 100].map(qty => (
                              <button 
                                  key={qty}
                                  onClick={() => executeBatchRun(qty)}
                                  className="p-3 border rounded-xl hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center transition-all group"
                              >
                                  <span className="font-bold text-gray-900 group-hover:scale-110 transition-transform">{qty}</span>
                                  <span className="text-[10px] text-gray-500 uppercase font-bold">Leads</span>
                              </button>
                          ))}
                          <button 
                              onClick={() => {
                                  const total = filteredLeads.filter(l => l.status === LeadStatus.PENDING).length;
                                  executeBatchRun(total);
                              }}
                              className="p-3 border border-dashed border-gray-300 rounded-xl hover:border-black hover:bg-black hover:text-white flex flex-col items-center justify-center transition-all group"
                          >
                              <span className="font-bold group-hover:scale-110 transition-transform">Tudo</span>
                              <span className="text-[10px] opacity-70 uppercase font-bold">Pendente</span>
                          </button>
                      </div>
                  </div>

                  <button 
                      onClick={() => setShowBatchModal(false)}
                      className="w-full mt-6 py-3 text-gray-500 font-medium hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                      Cancelar
                  </button>
              </div>
          </div>
      )}

      {/* FLIGHT CHECK / COMMAND CENTER MODAL (THE SOLUTION) */}
      {showFlightModal && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                  
                  {/* HEADER */}
                  <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${flightMode === 'LIVE' ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-3">
                              {flightMode === 'CHECK' ? <Shield className="w-8 h-8"/> : <Activity className="w-8 h-8 animate-pulse text-green-500"/>}
                              {flightMode === 'CHECK' ? 'Diagnóstico de Disparo' : 'Monitoramento em Tempo Real'}
                          </h2>
                          <p className={`text-sm mt-1 ${flightMode === 'LIVE' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {flightMode === 'CHECK' 
                                ? `Analisando qualidade de ${selectedLeads.length} leads antes do envio.` 
                                : `Disparando ${selectedLeads.length} mensagens. Não feche esta janela.`}
                          </p>
                      </div>
                      
                      {flightMode === 'CHECK' && (
                          <button onClick={() => setShowFlightModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                              <X className="w-6 h-6" />
                          </button>
                      )}
                      
                      {flightMode === 'LIVE' && !isRunning && (
                          <button onClick={() => setShowFlightModal(false)} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm">
                              Fechar Relatório
                          </button>
                      )}
                  </div>

                  {/* BODY: TABLE */}
                  <div className="flex-1 overflow-auto bg-gray-50 p-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <table className="w-full text-sm">
                              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs sticky top-0">
                                  <tr>
                                      <th className="p-4 text-left">Lead</th>
                                      <th className="p-4 text-left">Telefone</th>
                                      <th className="p-4 text-center">Print (Visual)</th>
                                      <th className="p-4 text-center">Link (Dados)</th>
                                      <th className="p-4 text-right">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {selectedLeads.map(leadId => {
                                      // Find updated lead data from DB list to support live updates, or from selectedLeadsFullObjects
                                      const lead = dbLeads.find(l => l.id === leadId) || selectedLeadsFullObjects.find(l => l.id === leadId);
                                      if (!lead) return null;
                                      
                                      const { hasPrint, hasLink } = checkLeadData(lead);
                                      const isProblem = !hasPrint || !hasLink;

                                      return (
                                          <tr key={lead.id} className={`transition-colors ${lead.status === 'SENT' ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                              <td className="p-4 font-bold text-gray-900">{lead.name}</td>
                                              <td className="p-4 font-mono text-gray-500">{lead.phone}</td>
                                              
                                              {/* PRINT CHECK */}
                                              <td className="p-4 text-center">
                                                  {hasPrint ? (
                                                      <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full"><ImageIcon className="w-3 h-3"/> OK</span>
                                                  ) : (
                                                      <span className="inline-flex items-center gap-1 text-gray-400 font-bold text-xs bg-gray-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3"/> Vazio</span>
                                                  )}
                                              </td>

                                              {/* LINK CHECK */}
                                              <td className="p-4 text-center">
                                                  {hasLink ? (
                                                      <span className="inline-flex items-center gap-1 text-blue-600 font-bold text-xs bg-blue-100 px-2 py-1 rounded-full"><LinkIcon className="w-3 h-3"/> OK</span>
                                                  ) : (
                                                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-100 px-2 py-1 rounded-full"><AlertTriangle className="w-3 h-3"/> Alerta</span>
                                                  )}
                                              </td>

                                              {/* LIVE STATUS */}
                                              <td className="p-4 text-right">
                                                  {lead.status === 'SENT' && (
                                                      <span className="text-green-600 font-bold flex items-center justify-end gap-2"><CheckCircle className="w-4 h-4"/> ENVIADO</span>
                                                  )}
                                                  {lead.status === 'FAILED' && (
                                                      <span className="text-red-600 font-bold flex items-center justify-end gap-2"><X className="w-4 h-4"/> ERRO</span>
                                                  )}
                                                  {lead.status === 'PENDING' && flightMode === 'LIVE' && (
                                                      <span className="text-gray-400 italic flex items-center justify-end gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Aguardando...</span>
                                                  )}
                                                  {lead.status === 'PENDING' && flightMode === 'CHECK' && (
                                                      <span className="text-gray-400 font-medium">Pronto</span>
                                                  )}
                                              </td>
                                          </tr>
                                      )
                                  })}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center">
                      {flightMode === 'CHECK' ? (
                          <>
                              <div className="text-sm text-gray-500">
                                  Verifique se todos os dados estão corretos antes de iniciar.
                              </div>
                              <div className="flex gap-4">
                                  <button 
                                      onClick={() => setShowFlightModal(false)}
                                      className="px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                                  >
                                      Cancelar
                                  </button>
                                  <button 
                                      onClick={handleConfirmStart}
                                      className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 flex items-center gap-2"
                                  >
                                      <Rocket className="w-5 h-5"/> CONFIRMAR DISPARO
                                  </button>
                              </div>
                          </>
                      ) : (
                          <>
                               <div className="flex items-center gap-3">
                                   {activeRunState ? (
                                       <div className="text-sm font-bold text-green-600 flex items-center gap-2">
                                           <Activity className="w-4 h-4 animate-bounce"/>
                                           Processando: {activeRunState.progress.current} / {activeRunState.progress.total}
                                       </div>
                                   ) : (
                                       <div className="text-sm font-bold text-gray-500">Operação finalizada.</div>
                                   )}
                               </div>
                               
                               {isRunning ? (
                                   <button 
                                       onClick={handleStopRun}
                                       className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 flex items-center gap-2"
                                   >
                                       <Pause className="w-5 h-5"/> PAUSAR EMERGÊNCIA
                                   </button>
                               ) : (
                                   <button 
                                       onClick={() => setShowFlightModal(false)}
                                       className="px-8 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg"
                                   >
                                       FECHAR
                                   </button>
                               )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                      <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Excluir {selectedLeads.length} leads?</h3>
                  <p className="text-center text-gray-500 text-sm mb-6">
                      Esta ação é irreversível. Os dados e histórico desses leads serão apagados permanentemente do agente.
                  </p>
                  
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleBulkDelete}
                          disabled={isDeleting}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                      >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirmar Exclusão'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MARK SENT MODAL */}
      {showMarkSentModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                      <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Marcar como Enviado?</h3>
                  <p className="text-center text-gray-500 text-sm mb-6">
                      Você selecionou <strong>{selectedLeads.length} leads</strong>. 
                      <br/><br/>
                      Isso forçará o status para <strong>ENVIADO</strong> no banco de dados.
                  </p>
                  
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowMarkSentModal(false)}
                          className="flex-1 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={executeManualMarkSent}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                      >
                          Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SYNC CONFIRMATION MODAL */}
      {showSyncModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                      <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Varredura de Histórico</h3>
                  
                  {!syncResult ? (
                      <>
                          <p className="text-center text-gray-500 text-sm mb-6">
                             O sistema irá verificar <strong>duas fontes</strong>:
                             <br/>1. Histórico de Conversas (CRM) - A verdade absoluta.
                             <br/>2. Registro de Envios Antigos.
                             <br/><br/>
                             Se houver conversa iniciada, o lead será marcado como <strong>ENVIADO</strong> automaticamente.
                          </p>
                          
                          <div className="flex gap-3">
                              <button 
                                  onClick={() => setShowSyncModal(false)}
                                  className="flex-1 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                                  disabled={isSyncing}
                              >
                                  Cancelar
                              </button>
                              <button 
                                  onClick={executeSync}
                                  disabled={isSyncing}
                                  className="flex-1 bg-black hover:bg-gray-800 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                              >
                                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Iniciar Varredura'}
                              </button>
                          </div>
                      </>
                  ) : (
                      <>
                          <div className={`p-4 rounded-lg text-sm text-center mb-6 font-medium ${syncResult.includes("0 leads") || syncResult.includes("Nenhum") ? 'bg-gray-100 text-gray-700' : 'bg-green-50 text-green-700'}`}>
                              {syncResult}
                          </div>
                          <button 
                              onClick={() => setShowSyncModal(false)}
                              className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-bold"
                          >
                              Fechar
                          </button>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* TEST CONFIRMATION MODAL */}
      {showTestModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  {isTesting ? (
                      // 1. RUNNING/SENDING PHASE
                      <div className="text-center py-4">
                          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                              <span className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></span>
                              <FlaskConical className="w-8 h-8 text-blue-600 animate-bounce" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Executando Teste</h3>
                          
                          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                              <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
                              ></div>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-6 font-medium">
                              Enviando {testProgress.current} de {testProgress.total} mensagens...
                          </p>
                          
                          <button 
                              onClick={() => {
                                  testStopFlagRef.current = true;
                              }}
                              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                          >
                              <Pause className="w-4 h-4" /> PAUSAR TESTE
                          </button>
                      </div>
                  ) : testStatusMessage ? (
                      // 2. COMPLETED / PAUSED SUMMARY PHASE
                      <div className="text-center py-4">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                              <CheckSquare className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Resultado do Teste</h3>
                          <p className="text-sm text-gray-600 mb-6 font-semibold bg-gray-50 p-4 rounded-xl border border-gray-100">
                              {testStatusMessage}
                          </p>
                          <button 
                              onClick={() => {
                                  setShowTestModal(false);
                                  setTestStatusMessage(null);
                              }}
                              className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-bold transition-all shadow-md"
                          >
                              Fechar
                          </button>
                      </div>
                  ) : (
                      // 3. PREPARATION/CONFIRMATION PHASE
                      <>
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                              <FlaskConical className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Envio de Teste</h3>
                          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                              <div className="flex justify-between mb-2">
                                  <span className="text-gray-500">Qtd. Leads:</span>
                                  <span className="font-bold">{selectedLeads.length}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-500">Destino:</span>
                                  <span className="font-bold text-blue-600">
                                      {(() => {
                                          const chipIds = activeAgent?.connectedInstanceIds || (activeAgent?.connectedInstanceId ? [activeAgent.connectedInstanceId] : []);
                                          const primaryChipId = activeAgent?.connectedInstanceId || chipIds[0];
                                          const inst = instances.find(i => i.id === primaryChipId);
                                          return inst ? getTestNumber(inst.name) : "Nenhum chip conectado";
                                      })()}
                                  </span>
                              </div>
                          </div>
                          <p className="text-center text-gray-500 text-xs mb-6">
                              As mensagens serão geradas pela IA (com imagem se houver) e enviadas para o seu número. Os leads <strong>não</strong> serão marcados como 'Enviado' no banco.
                          </p>
                          
                          <div className="flex gap-3">
                              <button 
                                  onClick={() => setShowTestModal(false)}
                                  className="flex-1 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                              >
                                  Cancelar
                              </button>
                              <button 
                                  onClick={executeBulkTest}
                                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                              >
                                  Confirmar Envio
                              </button>
                          </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
                  <button 
                    onClick={() => setPreviewImage(null)}
                    className="absolute -top-12 right-0 text-white/80 hover:text-white p-2"
                  >
                      <X className="w-8 h-8" />
                  </button>
                  <h3 className="text-white font-bold mb-4 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                      {previewImage.name}
                  </h3>
                  <img 
                      src={previewImage.url} 
                      alt="Print do Site" 
                      className="rounded-lg shadow-2xl max-h-[80vh] w-auto border border-white/20"
                  />
              </div>
          </div>
      )}

      {/* RESET INSTANCE LEADS MODAL */}
      {resetConfirmData?.isOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                      <RefreshCw className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Resetar Abordagens?</h3>
                  <p className="text-center text-gray-500 text-sm mb-6">
                      Deseja resetar para <strong>PENDENTE</strong> todos os leads abordados <strong>HOJE</strong> pelo chip <strong>{resetConfirmData.instanceName}</strong>?
                      <br/><br/>
                      Isso permitirá que o sistema tente re-enviar as mensagens para esses leads.
                  </p>
                  
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setResetConfirmData(null)}
                          className="flex-1 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                          disabled={isResetting}
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={confirmResetLeads}
                          disabled={isResetting}
                          className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                      >
                          {isResetting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirmar Reset'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Agents;

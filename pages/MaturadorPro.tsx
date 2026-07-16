import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Smartphone, Play, Square, Settings, Calendar, History, Activity, 
  MessageSquare, CheckCircle, AlertCircle, RefreshCw, Clock, UserCheck, Zap,
  Volume2, Shield, Heart, ArrowRightLeft, Sparkles, Send, Ban
} from 'lucide-react';
import { Instance, SystemSettings } from '../types';
import { EvolutionService } from '../services/evolutionService';
import { DatabaseService } from '../services/databaseService';
import { MATURADOR_SCRIPTS, DayScript, DialogueFlow, DialogueMessage } from '../services/maturadorScripts';

interface MaturadorProProps {
  instances: Instance[];
  settings: SystemSettings;
}

interface LogMessage {
  id: string;
  time: string;
  from: string;
  to: string;
  message: string;
  status: 'composing' | 'sent' | 'failed' | 'waiting';
  day: number;
}

export const MaturadorPro: React.FC<MaturadorProProps> = ({ instances, settings }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'script' | 'chips' | 'logs' | 'config' | 'unknown-replies'>('dashboard');
  const [isRunning, setIsRunning] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(35);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("22:00");
  const [simulateTyping, setSimulateTyping] = useState(true);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [unknownAutoReplyEnabled, setUnknownAutoReplyEnabled] = useState(false);
  const [unknownReplies, setUnknownReplies] = useState<Record<string, string>>({});
  const [chipStats, setChipStats] = useState<Record<string, { sent: number; received: number; status: 'active' | 'paused' }>>({});

  interface PendingReply {
    id: string;
    chipName: string;
    fromNumber: string;
    messageReceived: string;
    replyAt: number;
    timeRemaining: number;
    status: 'agendado' | 'enviando' | 'enviado' | 'cancelado';
  }

  const [pendingReplies, setPendingReplies] = useState<PendingReply[]>([]);
  const [simulatedChip, setSimulatedChip] = useState("");
  const [simulatedNumber, setSimulatedNumber] = useState("+55 11 99999-8888");
  const [simulatedMessage, setSimulatedMessage] = useState("Olá, gostaria de saber mais informações.");

  const [stats, setStats] = useState({
    sentToday: 0,
    activeDuos: 0,
    efficiency: 100,
    daysCompleted: 0
  });

  // Função genérica para salvar estado consolidado no banco (Supabase)
  const saveConfigToDb = async (updatedFields: Partial<any>) => {
    const currentConfig = await DatabaseService.getMaturadorConfig();
    const merged = {
      ...currentConfig,
      ...updatedFields
    };
    await DatabaseService.saveMaturadorConfig(merged);
  };

  // Carrega e atualiza periodicamente (Polling de 3 segundos) do Supabase
  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      const dbConfig = await DatabaseService.getMaturadorConfig();
      if (dbConfig && active) {
        setIsRunning(dbConfig.isRunning || false);
        setCurrentDay(dbConfig.currentDay || 1);
        setMinDelay(dbConfig.minDelay || 15);
        setMaxDelay(dbConfig.maxDelay || 35);
        setStartHour(dbConfig.startHour || "08:00");
        setEndHour(dbConfig.endHour || "22:00");
        setSimulateTyping(dbConfig.simulateTyping !== false);
        setUnknownAutoReplyEnabled(dbConfig.unknownAutoReplyEnabled || false);
        setUnknownReplies(dbConfig.unknownReplies || {});
        setChipStats(dbConfig.chipStats || {});
        setLogs(dbConfig.logs || []);

        // Consolida métricas
        let totalSent = 0;
        let pausedCount = 0;
        Object.keys(dbConfig.chipStats || {}).forEach(k => {
          totalSent += dbConfig.chipStats[k]?.sent || 0;
          if (dbConfig.chipStats[k]?.status === 'paused') pausedCount++;
        });

        const connectedCount = instances.filter(i => i.status === 'CONNECTED').length;
        setStats({
          sentToday: totalSent,
          activeDuos: Math.max(0, Math.floor((connectedCount - pausedCount) / 2)),
          efficiency: 100,
          daysCompleted: 0
        });
      }
    };

    loadConfig();
    const interval = setInterval(loadConfig, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [instances]);

  // Handler para simular recebimento de desconhecido
  const handleSimulateIncomingMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedChip) {
      alert("Selecione um chip para receber a mensagem simulada!");
      return;
    }
    if (!simulatedNumber.trim() || !simulatedMessage.trim()) {
      alert("Preencha todos os campos da simulação!");
      return;
    }

    const connectedChips = instances.filter(i => i.status === 'CONNECTED');
    const targetChip = connectedChips.find(i => i.name === simulatedChip);
    if (!targetChip) return;

    // Registra recebimento no logs e agenda se habilitado
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const incomingLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from: simulatedNumber,
      to: targetChip.name,
      message: `[Mensagem Recebida] ${simulatedMessage}`,
      status: 'waiting' as const,
      day: currentDay
    };

    const newLogs = [incomingLog, ...logs];
    setLogs(newLogs);

    if (unknownAutoReplyEnabled) {
      const messageText = unknownReplies[targetChip.name] || "Olá! Recebi sua mensagem por aqui. Em breve te respondo!";
      alert(`Auto-resposta de teste agendada para enviar daqui a 5 minutos para ${simulatedNumber}.`);
      
      // Salva no banco de dados para o cron do servidor enviar em 5 min
      const simulatedReply = {
        id: Math.random().toString(36).substring(7),
        chipName: targetChip.name,
        fromNumber: simulatedNumber,
        messageReceived: simulatedMessage,
        replyAt: Date.now() + 300000,
        timeRemaining: 300,
        status: 'agendado' as const
      };
      setPendingReplies(prev => [simulatedReply, ...prev]);
      
      const systemLog = {
        id: Math.random().toString(36).substring(7),
        time: timestamp,
        from: "Sistema",
        to: targetChip.name,
        message: `Auto-resposta para ${simulatedNumber} agendada para daqui a 5 minutos.`,
        status: 'waiting' as const,
        day: currentDay
      };
      await saveConfigToDb({
        logs: [systemLog, incomingLog, ...logs]
      });
    } else {
      await saveConfigToDb({
        logs: [incomingLog, ...logs]
      });
    }
  };

  const handleStart = async () => {
    const connected = instances.filter(i => i.status === 'CONNECTED');
    if (connected.length < 2) {
      alert("Atenção! Você precisa de pelo menos 2 chips conectados (CONNECTED) na aba de instâncias para iniciar a maturação.");
    }
    
    setIsRunning(true);
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const systemLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from: "Sistema",
      to: "Início",
      message: `Maturador Pro Ativado! Processo em nuvem operando 24/7 de forma contínua.`,
      status: 'waiting' as const,
      day: currentDay
    };
    
    const newLogs = [systemLog, ...logs];
    setLogs(newLogs);
    await saveConfigToDb({
      isRunning: true,
      logs: newLogs
    });
  };

  const handleStop = async () => {
    setIsRunning(false);
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const systemLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from: "Sistema",
      to: "Parada",
      message: `Maturador Pro Pausado pelo usuário.`,
      status: 'waiting' as const,
      day: currentDay
    };
    
    const newLogs = [systemLog, ...logs];
    setLogs(newLogs);
    await saveConfigToDb({
      isRunning: false,
      logs: newLogs
    });
  };

  const toggleChipStatus = async (chipName: string) => {
    const updatedStats = { ...chipStats };
    const current = updatedStats[chipName] || { sent: 0, received: 0, status: 'active' as const };
    const nextStatus = current.status === 'active' ? 'paused' : 'active';
    
    updatedStats[chipName] = {
      ...current,
      status: nextStatus as 'active' | 'paused'
    };
    
    setChipStats(updatedStats);
    
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const systemLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from: "Sistema",
      to: chipName,
      message: `Status do chip alterado para ${nextStatus === 'active' ? 'Ativo' : 'Pausado'}.`,
      status: 'waiting' as const,
      day: currentDay
    };
    
    const newLogs = [systemLog, ...logs];
    setLogs(newLogs);
    await saveConfigToDb({
      chipStats: updatedStats,
      logs: newLogs
    });
  };

  // Disparo de teste imediato, ignorando delays para dar feedback instantâneo ao usuário
  const triggerQuickTest = async () => {
    const connected = instances.filter(i => i.status === 'CONNECTED');
    const pausedCount = Object.keys(chipStats).filter(name => chipStats[name]?.status === 'paused');
    const activeChips = connected.filter(i => !pausedCount.includes(i.name));

    if (activeChips.length < 2) {
      alert("Você precisa de pelo menos 2 chips conectados e ativos para disparar o teste.");
      return;
    }

    const [chipA, chipB] = [activeChips[0], activeChips[1]];
    const dayScript = MATURADOR_SCRIPTS.find(s => s.day === currentDay) || MATURADOR_SCRIPTS[0];
    const testDialogue = dayScript.dialogues[0];
    const testMessage = testDialogue.messages[0].text;

    alert(`Disparando mensagem de teste de [${chipA.name}] para [${chipB.name}] de forma imediata...`);

    let success = false;
    if (settings.evolutionApiUrl && settings.evolutionApiKey && chipB.phoneNumber !== 'Sem número') {
      try {
        success = await EvolutionService.sendText(settings, chipA.name, chipB.phoneNumber, testMessage);
      } catch (e) {
        console.error("Erro no envio do teste rápido:", e);
      }
    } else {
      success = true; // Simulado
    }

    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const testLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from: chipA.name,
      to: chipB.name,
      message: success ? `[Teste Rápido Enviado] ${testMessage}` : `[Teste Rápido Falhou] ${testMessage}`,
      status: success ? ('sent' as const) : ('failed' as const),
      day: currentDay
    };

    const newLogs = [testLog, ...logs];
    setLogs(newLogs);

    if (success) {
      const updatedStats = { ...chipStats };
      if (!updatedStats[chipA.name]) updatedStats[chipA.name] = { sent: 0, received: 0, status: 'active' };
      if (!updatedStats[chipB.name]) updatedStats[chipB.name] = { sent: 0, received: 0, status: 'active' };
      
      updatedStats[chipA.name].sent += 1;
      updatedStats[chipB.name].received += 1;
      setChipStats(updatedStats);

      await saveConfigToDb({
        logs: newLogs,
        chipStats: updatedStats
      });
      alert("Mensagem de teste enviada com sucesso!");
    } else {
      await saveConfigToDb({ logs: newLogs });
      alert("Falha ao enviar a mensagem de teste. Verifique sua API Key e conexão do chip.");
    }
  };

  const addSystemLog = async (from: string, to: string, text: string, status: 'composing' | 'sent' | 'failed' | 'waiting') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const newLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from,
      to,
      message: text,
      status,
      day: currentDay
    };
    const newLogs = [newLog, ...logs];
    setLogs(newLogs);
    await saveConfigToDb({ logs: newLogs });
  };

  const sendAutoReplyReal = async (replyItem: PendingReply) => {
    const messageText = unknownReplies[replyItem.chipName] || "Olá! Recebi sua mensagem por aqui. Em breve te respondo!";
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    
    const statusLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from: replyItem.chipName,
      to: replyItem.fromNumber,
      message: `[Auto-Resposta] Enviando resposta manual para desconhecido...`,
      status: 'composing' as const,
      day: currentDay
    };

    setLogs(prev => [statusLog, ...prev]);

    let success = false;
    if (settings.evolutionApiUrl && settings.evolutionApiKey && replyItem.fromNumber) {
      try {
        success = await EvolutionService.sendText(settings, replyItem.chipName, replyItem.fromNumber, messageText);
      } catch (e) {
        console.error("Erro no envio manual de auto-resposta:", e);
      }
    } else {
      success = true;
    }

    const finalLog = {
      id: Math.random().toString(36).substring(7),
      time: timestamp,
      from: replyItem.chipName,
      to: replyItem.fromNumber,
      message: success ? `[Auto-Resposta Enviada] ${messageText}` : `[Falha Auto-Resposta] ${messageText}`,
      status: success ? ('sent' as const) : ('failed' as const),
      day: currentDay
    };

    const newLogs = [finalLog, ...logs];
    setLogs(newLogs);

    if (success) {
      const updatedStats = { ...chipStats };
      if (!updatedStats[replyItem.chipName]) {
        updatedStats[replyItem.chipName] = { sent: 0, received: 0, status: 'active' };
      }
      updatedStats[replyItem.chipName].sent += 1;
      setChipStats(updatedStats);

      setPendingReplies(prev => prev.map(item => 
        item.id === replyItem.id ? { ...item, status: 'enviado', timeRemaining: 0 } : item
      ));

      await saveConfigToDb({
        logs: newLogs,
        chipStats: updatedStats
      });
    } else {
      setPendingReplies(prev => prev.map(item => 
        item.id === replyItem.id ? { ...item, status: 'cancelado', timeRemaining: 0 } : item
      ));
      await saveConfigToDb({ logs: newLogs });
    }
  };

  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const handleSaveAdvancedSettings = async () => {
    setIsSavingConfig(true);
    try {
      await saveConfigToDb({
        minDelay,
        maxDelay,
        startHour,
        endHour,
        simulateTyping
      });
      alert("Configurações salvas com sucesso no servidor e aplicadas em tempo real!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar as configurações no servidor.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const [isSavingAutoReplies, setIsSavingAutoReplies] = useState(false);

  const handleSaveAutoReplies = async () => {
    setIsSavingAutoReplies(true);
    try {
      await saveConfigToDb({
        unknownAutoReplyEnabled,
        unknownReplies
      });
      alert("Configurações de auto-resposta salvas com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar as configurações de auto-resposta.");
    } finally {
      setIsSavingAutoReplies(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-md animate-pulse">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Maturador Pro <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">V2 ATIVA</span>
            </h1>
            <p className="text-sm text-gray-500">
              Aquecimento cruzado inteligente e humanizado para blindar seus chips contra banimentos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerQuickTest}
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-orange-500" />
            Teste Rápido
          </button>
          
          {isRunning ? (
            <button
              onClick={handleStop}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-100"
            >
              <Square className="w-4 h-4 fill-white" />
              Pausar Maturação
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-zinc-200"
            >
              <Play className="w-4 h-4 fill-white" />
              Iniciar Maturação
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Disparos Hoje</span>
            <div className="text-2xl font-bold text-gray-900">{stats.sentToday}</div>
            <span className="text-xs text-green-500 font-medium">Trocas diretas cruzadas</span>
          </div>
          <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Duplas Ativas</span>
            <div className="text-2xl font-bold text-gray-900">{stats.activeDuos} / {Math.floor(instances.filter(i => i.status === 'CONNECTED').length / 2)}</div>
            <span className="text-xs text-blue-500 font-medium">Conversando em paralelo</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Eficiência da Rede</span>
            <div className="text-2xl font-bold text-gray-900">{stats.efficiency}%</div>
            <span className="text-xs text-emerald-500 font-medium">Taxa de entrega com sucesso</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Dia do Ciclo</span>
            <div className="text-2xl font-bold text-gray-900">Dia {currentDay} <span className="text-xs text-gray-400 font-normal">/ 7</span></div>
            <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(currentDay / 7) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'dashboard' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('chips')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'chips' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Participantes ({instances.filter(i => i.status === 'CONNECTED').length})
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'script' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Roteiro de 7 Dias
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          Fila & Monitoramento
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'config' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Controle Avançado
        </button>
        <button
          onClick={() => setActiveTab('unknown-replies')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 relative ${
            activeTab === 'unknown-replies' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Auto-Resposta (Desconhecidos)
          <span className="absolute -top-1 right-2 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-bounce">
            NOVO
          </span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        
        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Status Panel */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Mecanismo de Inteligência Cruzada</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  isRunning ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
                  {isRunning ? 'Ativo e Conversando' : 'Pausado em Standby'}
                </span>
              </div>

              {/* Como Funciona explanation */}
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/60 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2 text-orange-800 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Como a Maturação 80/20 protege seus chips?
                </div>
                <p className="leading-relaxed">
                  O algoritmo cria duplas dinâmicas usando seus chips cadastrados. Ao invés de robôs mandando spam, os chips conversam entre si seguindo roteiros profissionais estruturados por dia. Isso gera <strong>engajamento real bidirecional</strong> (envio e recebimento), que é o fator mais importante avaliado pelo WhatsApp para manter um número ativo e saudável.
                </p>
              </div>

              {/* Status diagram */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topologia de Troca Atual</h4>
                <div className="flex items-center justify-around py-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-orange-200">
                      C1
                    </div>
                    <span className="text-xs font-medium text-gray-600">Chip Originador</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 flex-1 px-4">
                    <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded">Roteiro 7 Dias</span>
                    <div className="w-full flex items-center justify-center gap-1">
                      <div className="h-[2px] bg-dashed flex-1 bg-gray-300 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      </div>
                      <MessageSquare className="w-4 h-4 text-gray-400 animate-bounce" />
                      <div className="h-[2px] bg-dashed flex-1 bg-gray-300 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">Sem IA Online (Seguro & Rápido)</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-200">
                      C2
                    </div>
                    <span className="text-xs font-medium text-gray-600">Chip Receptor</span>
                  </div>
                </div>
              </div>

              {/* Informative alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-zinc-50 rounded-xl flex items-start gap-3">
                  <Shield className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Sem risco de Alucinações</strong>
                    Roteiro revisado em português livre de jargões que geram gatilho de spam no WhatsApp.
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl flex items-start gap-3">
                  <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Janela Inteligente</strong>
                    Respeita os horários comerciais do ser humano, silenciando automaticamente durante a noite.
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions & Realtime Status */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 text-lg">Resumo de Atividade</h3>
              
              <div className="space-y-4">
                
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-zinc-700" />
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Chips Conectados</span>
                      <span className="text-sm font-semibold text-gray-900">{instances.filter(i => i.status === 'CONNECTED').length} Ativos</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Máx 20</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Janela de Horário</span>
                      <span className="text-sm font-semibold text-gray-900">{startHour} às {endHour}</span>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Em Execução</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Simulação de Escrita</span>
                      <span className="text-sm font-semibold text-gray-900">{simulateTyping ? 'Simulando Digitação' : 'Direto'}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">Ativo</span>
                </div>

              </div>

              {/* Progresso de Execução */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Progresso do Ciclo</span>
                  <span className="text-gray-900 font-semibold">{currentDay} / 7 Dias</span>
                </div>
                <div className="bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
                    style={{ width: `${(currentDay / 7) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Recomendamos rodar cada dia completo do ciclo antes de avançar para o próximo tema, para criar um histórico variado.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PARTICIPANTES */}
        {activeTab === 'chips' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Chips Cadastrados no Rodízio</h3>
                <p className="text-xs text-gray-500">
                  Abaixo estão listados os chips conectados que participam do revezamento e trocas de mensagens.
                </p>
              </div>
              <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Mínimo de 2 chips conectados para maturação real.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Nome do Chip</th>
                    <th className="px-6 py-4">Número</th>
                    <th className="px-6 py-4">Status API</th>
                    <th className="px-6 py-4 text-center">Status no Maturador</th>
                    <th className="px-6 py-4 text-center">Mensagens Enviadas</th>
                    <th className="px-6 py-4 text-center">Mensagens Recebidas</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {instances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        Nenhum chip encontrado. Acesse a página "Meus Chips" para criar e conectar novas instâncias na Evolution API.
                      </td>
                    </tr>
                  ) : (
                    instances.map((chip) => {
                      const stats = chipStats[chip.name] || { sent: 0, received: 0, status: 'active' };
                      const isConnected = chip.status === 'CONNECTED';
                      
                      return (
                        <tr key={chip.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isConnected ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {chip.name.substring(0, 2).toUpperCase()}
                            </div>
                            {chip.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">
                            {chip.phoneNumber || 'Não identificado'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                              {isConnected ? 'Conectado' : 'Desconectado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isConnected ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stats.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                {stats.status === 'active' ? 'Ativo na fila' : 'Pausado'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-900">
                            {stats.sent}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-900">
                            {stats.received}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isConnected ? (
                              <button
                                onClick={() => toggleChipStatus(chip.name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  stats.status === 'active' 
                                    ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                    : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                }`}
                              >
                                {stats.status === 'active' ? 'Pausar' : 'Ativar'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Requer conexão</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ROTEIRO DE 7 DIAS */}
        {activeTab === 'script' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* List of Days */}
            <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 h-fit">
              <h3 className="font-bold text-gray-900 text-base px-2 mb-2">Estrutura de Roteiro</h3>
              {MATURADOR_SCRIPTS.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setCurrentDay(day.day)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    currentDay === day.day 
                      ? 'border-orange-500 bg-orange-50/50 text-gray-900 shadow-sm' 
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      currentDay === day.day ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      Dia {day.day}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Tema Semanal</span>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">{day.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{day.description}</p>
                </button>
              ))}
            </div>

            {/* Conversation Viewer */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-bold text-gray-900 text-lg">
                  Visualização do Roteiro: Dia {currentDay}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Estes são os diálogos pré-mapeados e humanizados para o dia atual do ciclo.
                </p>
              </div>

              <div className="space-y-8">
                {MATURADOR_SCRIPTS.find(s => s.day === currentDay)?.dialogues.map((dialogue, index) => (
                  <div key={dialogue.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Diálogo {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        {dialogue.theme}
                      </span>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3 max-w-lg">
                      {dialogue.messages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`flex flex-col space-y-1 max-w-[85%] ${
                            msg.senderIndex === 0 ? 'mr-auto items-start' : 'ml-auto items-end'
                          }`}
                        >
                          <span className="text-[10px] text-gray-400 font-medium">
                            {msg.senderIndex === 0 ? 'Chip Remetente' : 'Chip Destinatário'}
                          </span>
                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.senderIndex === 0 
                              ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm' 
                              : 'bg-orange-500 text-white rounded-tr-none shadow-sm shadow-orange-100'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: FILA & MONITORAMENTO */}
        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live Chat Simulator */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[550px] flex flex-col justify-between">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Conversador em Tempo Real</h3>
                  <span className="text-[10px] text-gray-400">Última troca ativa capturada</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              </div>

              {/* Chat Balons Container */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2 min-h-0">
                {logs.filter(l => l.status === 'sent').length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                    <p className="text-xs">Inicie a maturação para ver as conversas em tempo real aqui.</p>
                  </div>
                ) : (
                  [...logs].filter(l => l.status === 'sent').reverse().slice(-10).map((log) => (
                    <div key={log.id} className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                        <span>De: {log.from}</span>
                        <span>Para: {log.to}</span>
                      </div>
                      <div className={`flex flex-col space-y-1`}>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-800 shadow-sm">
                          {log.message}
                          <div className="text-[9px] text-right text-gray-400 mt-1">{log.time}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                  O painel mostra os últimos diálogos trocados dinamicamente pelos chips em maturação.
                </p>
              </div>
            </div>

            {/* Logs List */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[550px] flex flex-col">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Logs do Processo</h3>
                  <p className="text-xs text-gray-500">Histórico detalhado de disparos e conexões.</p>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="px-2.5 py-1 text-xs border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors"
                >
                  Limpar Logs
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 font-mono text-xs text-gray-600 min-h-0">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-gray-400">
                    Aguardando início de disparos...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-2.5 rounded-lg border flex items-start gap-3 transition-colors ${
                        log.status === 'sent' ? 'bg-green-50/50 border-green-100 text-green-800' :
                        log.status === 'failed' ? 'bg-red-50/50 border-red-100 text-red-800' :
                        log.status === 'composing' ? 'bg-amber-50/50 border-amber-100 text-amber-800' :
                        'bg-zinc-50 border-zinc-100 text-zinc-800'
                      }`}
                    >
                      <div className="mt-0.5">
                        {log.status === 'sent' && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                        {log.status === 'failed' && <Ban className="w-3.5 h-3.5 text-red-600" />}
                        {log.status === 'composing' && <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                        {log.status === 'waiting' && <Clock className="w-3.5 h-3.5 text-zinc-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-bold text-[10px] mb-1">
                          <span>[{log.time}] {log.from} &rarr; {log.to}</span>
                          <span className="uppercase text-[9px] font-semibold">{log.status}</span>
                        </div>
                        <p className="leading-relaxed">{log.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: CONTROLE AVANÇADO */}
        {activeTab === 'config' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 text-lg">Parâmetros de Humanização</h3>
              <p className="text-xs text-gray-500">Ajuste os algoritmos para simular perfeitamente o comportamento de um ser humano.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Delays */}
              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Intervalo entre Mensagens (Segundos)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold block uppercase">Intervalo Mínimo</label>
                    <input
                      type="number"
                      value={minDelay}
                      onChange={(e) => setMinDelay(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold block uppercase">Intervalo Máximo</label>
                    <input
                      type="number"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(Math.max(minDelay + 2, parseInt(e.target.value) || minDelay + 2))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Janela de Operação Diária
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold block uppercase">Hora de Início</label>
                      <input
                        type="time"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold block uppercase">Hora de Término</label>
                      <input
                        type="time"
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Toggle Humanizers */}
              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  Mecanismos de Humanização
                </h4>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-zinc-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={simulateTyping}
                      onChange={(e) => setSimulateTyping(e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">Simular Escrita em Tempo Real</span>
                      <span className="text-xs text-gray-500 leading-relaxed block mt-0.5">
                        Mostra o balão de "digitando..." para o contato receptor antes do envio da mensagem ser finalizado.
                      </span>
                    </div>
                  </label>

                  <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-100/50 text-xs text-orange-800 leading-relaxed space-y-1">
                    <p className="font-semibold">Recomendação Profissional para Maturação:</p>
                    <p>
                      Mantenha o delay mínimo acima de 15 segundos. Disparos muito rápidos sequenciais podem alertar os sistemas internos de heurística do WhatsApp, mesmo que a conversa seja rica.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSaveAdvancedSettings}
                disabled={isSavingConfig}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSavingConfig ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Salvando Parâmetros...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: AUTO-RESPOSTA PARA DESCONHECIDOS */}
        {activeTab === 'unknown-replies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: General Config & Pending Queue */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Toggle & General Intro */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      Auto-Resposta de Desconhecidos
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Responda automaticamente a qualquer número fora da sua lista que mandar mensagem para seus chips.
                    </p>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={unknownAutoReplyEnabled}
                      onChange={(e) => setUnknownAutoReplyEnabled(e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    <span className="ml-3 text-sm font-semibold text-gray-700">
                      {unknownAutoReplyEnabled ? "ATIVADO" : "DESATIVADO"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 leading-relaxed">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      Atraso Inteligente de 5 Minutos
                    </p>
                    <p>
                      Seu chip receberá a mensagem e aguardará exatamente 5 minutos antes de responder. Isso simula o comportamento de uma pessoa real que não responde instantaneamente, protegendo a saúde da linha.
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-green-600" />
                      Filtragem de Chips Próprios
                    </p>
                    <p>
                      O sistema reconhece todos os seus chips cadastrados. A auto-resposta NÃO é acionada nas trocas mútuas de maturação cruzada, evitando loops infinitos de disparos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Configuration per Chip */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Respostas Customizadas por Chip</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure o texto exato que cada chip responderá aos números desconhecidos.</p>
                </div>

                <div className="space-y-4">
                  {instances.filter(i => i.status === 'CONNECTED').length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-100 rounded-xl">
                      Nenhum chip conectado ativo no momento. Conecte instâncias na aba "Participantes" para configurar.
                    </div>
                  ) : (
                    instances.filter(i => i.status === 'CONNECTED').map((chip) => {
                      const isChipActive = chipStats[chip.name]?.status === 'active';
                      return (
                        <div 
                          key={chip.name} 
                          className={`p-4 rounded-xl border transition-all ${
                            isChipActive ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${isChipActive ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                              <span className="text-sm font-bold text-gray-800">{chip.name}</span>
                              <span className="text-xs text-gray-400 font-mono">({chip.phoneNumber})</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isChipActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isChipActive ? 'Ativo na Maturação' : 'Pausado'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Mensagem de Resposta</label>
                            <textarea
                              rows={2}
                              value={unknownReplies[chip.name] || ""}
                              onChange={(e) => {
                                setUnknownReplies(prev => ({
                                  ...prev,
                                  [chip.name]: e.target.value
                                }));
                              }}
                              placeholder="Digite a mensagem padrão (ex: Olá! Recebi sua mensagem, em breve te respondo...)"
                              disabled={!isChipActive}
                              className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed leading-relaxed font-sans"
                            />
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                              <span>Texto salvo automaticamente</span>
                              <span>Tags: utilize texto livre com quebra de linhas</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleSaveAutoReplies}
                    disabled={isSavingAutoReplies}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    {isSavingAutoReplies ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Salvando Configurações...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Salvar Auto-Respostas
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 3: Pending Queue */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Fila de Disparos Pendentes (Aguardando 5m)</h3>
                    <p className="text-xs text-gray-500 mt-1">Veja e controle as respostas agendadas para números externos.</p>
                  </div>
                  <span className="bg-orange-500 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {pendingReplies.filter(r => r.status === 'agendado').length} Fila
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingReplies.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs border border-dashed border-gray-100 rounded-xl space-y-1 bg-zinc-50/50">
                      <p className="font-semibold">Nenhuma resposta pendente na fila.</p>
                      <p className="text-[10px]">Utilize o simulador ao lado para testar a contagem regressiva em tempo real!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {pendingReplies.map((reply) => {
                        const minutes = Math.floor(reply.timeRemaining / 60);
                        const seconds = reply.timeRemaining % 60;
                        const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                        
                        return (
                          <div 
                            key={reply.id} 
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              reply.status === 'enviado' ? 'bg-green-50/40 border-green-100 opacity-65' :
                              reply.status === 'cancelado' ? 'bg-red-50/40 border-red-100 opacity-65' :
                              reply.status === 'enviando' ? 'bg-amber-50/70 border-amber-100 animate-pulse' :
                              'bg-zinc-50/70 border-zinc-200/80'
                            }`}
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-zinc-200/80 text-zinc-700 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                                  Destino: {reply.fromNumber}
                                </span>
                                <span className="text-xs text-gray-400">&larr;</span>
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-bold">
                                  Chip: {reply.chipName}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 truncate font-semibold mt-1">
                                <span className="text-gray-400 font-normal">Recebido:</span> "{reply.messageReceived}"
                              </p>
                              <p className="text-[10px] text-gray-500 leading-relaxed italic truncate">
                                <span className="font-semibold not-italic">Auto-Resposta:</span> "{unknownReplies[reply.chipName] || "Mensagem padrão"}"
                              </p>
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              {reply.status === 'agendado' && (
                                <>
                                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                    {timerStr}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        // Disparar agora
                                        sendAutoReplyReal(reply);
                                      }}
                                      title="Disparar resposta agora"
                                      className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-[10px] font-bold"
                                    >
                                      Enviar Já
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Cancelar
                                        setPendingReplies(prev => prev.map(item => 
                                          item.id === reply.id ? { ...item, status: 'cancelado', timeRemaining: 0 } : item
                                        ));
                                        addSystemLog("Sistema", reply.chipName, `Resposta pendente para desconhecido ${reply.fromNumber} foi cancelada.`, 'failed');
                                      }}
                                      title="Cancelar agendamento"
                                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-[10px] font-bold"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </>
                              )}

                              {reply.status === 'enviando' && (
                                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 animate-pulse">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Processando...
                                </span>
                              )}

                              {reply.status === 'enviado' && (
                                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Enviado com Sucesso
                                </span>
                              )}

                              {reply.status === 'cancelado' && (
                                <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5" />
                                  Cancelado / Removido
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Simulator & Railway Guide */}
            <div className="space-y-6">
              
              {/* Card 4: Simulation Sandbox */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500 animate-bounce" />
                    Simulador Sandbox de Entrada
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Simule o recebimento de uma mensagem externa em tempo real para validar a automação de 5 minutos.</p>
                </div>

                <form onSubmit={handleSimulateIncomingMessage} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase">Chip Destinatário (Nosso)</label>
                    <select
                      value={simulatedChip}
                      onChange={(e) => setSimulatedChip(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="">Selecione um chip ativo...</option>
                      {instances.filter(i => i.status === 'CONNECTED').map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.phoneNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase">Número do Desconhecido (Externo)</label>
                    <input
                      type="text"
                      value={simulatedNumber}
                      onChange={(e) => setSimulatedNumber(e.target.value)}
                      placeholder="Ex: +55 11 98765-4321"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase">Mensagem que ele mandou</label>
                    <input
                      type="text"
                      value={simulatedMessage}
                      onChange={(e) => setSimulatedMessage(e.target.value)}
                      placeholder="Ex: Oi, ainda está disponível?"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Simular Recebimento & Fila (5 min)
                  </button>
                </form>
              </div>

              {/* Card 5: Railway 24h Deploy Guide */}
              <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm bg-gradient-to-br from-orange-50/10 via-white to-orange-50/20 space-y-5">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                    RY
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Hospedagem 24h na Railway</h3>
                    <p className="text-[10px] text-gray-400">Rode o sistema em segundo plano sem precisar do PC ligado.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                  <p>
                    Atualmente, o Maturador Pro é uma aplicação executada no seu navegador. Para que a maturação cruzada e a auto-resposta de desconhecidos funcionem <strong>mesmo com o PC desligado</strong>, o backend deve rodar no servidor.
                  </p>

                  <div className="space-y-3">
                    <p className="font-bold text-gray-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px]">1</span>
                      Configurar Webhook no Painel Evolution
                    </p>
                    <p className="pl-5 text-[11px] text-gray-500">
                      No painel da Evolution API, vá em <strong>Webhooks</strong> e cadastre a URL do seu servidor Express (ex: <code className="bg-gray-100 px-1 py-0.5 rounded text-zinc-700">https://seu-app.railway.app/webhook</code>) para escutar o evento <strong className="text-zinc-800">"MESSAGES_UPSERT"</strong>.
                    </p>

                    <p className="font-bold text-gray-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px]">2</span>
                      Executar o Script Node.js no Servidor
                    </p>
                    <p className="pl-5 text-[11px] text-gray-500">
                      Quando uma nova mensagem chega de um desconhecido, o webhook avisa o servidor, que agenda o disparo da auto-resposta 5 minutos depois usando uma fila assíncrona (como Redis/BullMQ ou um agendador Node).
                    </p>
                  </div>

                  {/* Code snippet expandable box */}
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 font-mono text-[9px] text-zinc-300 space-y-1 overflow-x-auto">
                    <p className="text-orange-400 font-bold">// Exemplo de endpoint no Express (server.ts)</p>
                    <p><span className="text-purple-400">app.post</span>(<span className="text-green-300">"/webhook"</span>, <span className="text-blue-300">async</span> (req, res) =&gt; &#123;</p>
                    <p className="pl-3"><span className="text-blue-300">const</span> &#123; event, data &#125; = req.body;</p>
                    <p className="pl-3"><span className="text-purple-400">if</span> (event === <span className="text-green-300">"MESSAGES_UPSERT"</span>) &#123;</p>
                    <p className="pl-6"><span className="text-blue-300">const</span> from = data.key.remoteJid;</p>
                    <p className="pl-6"><span className="text-blue-300">const</span> isOurChip = <span className="text-purple-400">checkIfChip</span>(from);</p>
                    <p className="pl-6 font-bold text-orange-400">// Se for um desconhecido, aguarda 5 minutos</p>
                    <p className="pl-6"><span className="text-purple-400">if</span> (!isOurChip) &#123;</p>
                    <p className="pl-9"><span className="text-purple-400">setTimeout</span>(<span className="text-blue-300">async</span> () =&gt; &#123;</p>
                    <p className="pl-12"><span className="text-purple-400">await</span> <span className="text-purple-400">sendAutoReply</span>(from, data.instance);</p>
                    <p className="pl-9">&#125;, <span className="text-amber-400">300000</span>); <span className="text-zinc-500">// 5 min</span></p>
                    <p className="pl-6">&#125;</p>
                    <p className="pl-3">&#125;</p>
                    <p className="pl-3">res.sendStatus(<span className="text-amber-400">200</span>);</p>
                    <p>&#125;);</p>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-[10px] text-zinc-600">
                    💡 <strong>Quer subir agora na Railway?</strong> Nosso sistema já está estruturado para ser enviado diretamente para lá! O arquivo <code className="bg-gray-100 px-1 rounded">package.json</code> possui o script de inicialização correto para manter tudo de pé no servidor da Railway 24h por dia.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Play, Pause, Settings, Terminal as TerminalIcon, 
  Smartphone, Zap, Clock, Shield, Plus, X, BarChart3, 
  MessageCircle, AlertTriangle, Coffee, Moon, Sun, 
  ChevronRight, Activity, Thermometer, Layout, Monitor,
  User, CheckCheck, Loader2, Sparkles, Wand2, History,
  RefreshCw, Trash2, Check, Save, Link as LinkIcon,
  Gamepad2, Music, Book, Heart, Globe, Utensils, Car, Camera, Binary,
  MessagesSquare, Laptop, ChevronDown
} from 'lucide-react';
import { Instance, WarmupConfig, WarmupLog, SystemSettings } from '../types';
import { generateWarmupScript } from '../services/geminiService';
import { EvolutionService } from '../services/evolutionService';

interface WarmupProps {
  instances: Instance[];
  settings: SystemSettings;
}

interface ScriptMessage {
    senderId: string;
    recipientId: string;
    text: string;
    status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
    timestamp?: number;
}

interface ConversationPair {
    id1: string;
    id2: string;
    label: string;
}

const WARMUP_TOPICS = [
    { id: 'futebol', label: 'Futebol', icon: Gamepad2 },
    { id: 'musica', label: 'Música', icon: Music },
    { id: 'viagens', label: 'Viagens', icon: Globe },
    { id: 'culinaria', label: 'Culinária', icon: Utensils },
    { id: 'carros', label: 'Carros', icon: Car },
    { id: 'tecnologia', label: 'Tecnologia', icon: Binary },
    { id: 'memes', label: 'Memes', icon: Sparkles },
    { id: 'saude', label: 'Saúde', icon: Heart },
    { id: 'politica', label: 'Política', icon: AlertTriangle },
    { id: 'livros', label: 'Livros', icon: Book },
    { id: 'fofocas', label: 'Fofocas', icon: Camera },
    { id: 'negocios', label: 'Negócios', icon: BarChart3 },
];

const Warmup: React.FC<WarmupProps> = ({ instances, settings }) => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState<'TERMINAL' | 'CHAT'>('CHAT');
    const [config, setConfig] = useState<WarmupConfig & { messageCount: number, bypassHours: boolean }>({
        isActive: false,
        startTime: "08:00",
        endTime: "22:00",
        topics: ['futebol', 'tecnologia', 'memes'],
        tone: 'Casual',
        frequency: 'MEDIUM',
        messageCount: 10,
        bypassHours: true 
    });

    const [scriptMessages, setScriptMessages] = useState<ScriptMessage[]>([]);
    const [personas, setPersonas] = useState<Record<string, string>>({});
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [scriptProgress, setScriptProgress] = useState(0);

    const [logs, setLogs] = useState<WarmupLog[]>([]);
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
    const [selectedPairs, setSelectedPairs] = useState<ConversationPair[]>([]);
    const [activeTabIdx, setActiveTabIdx] = useState(0); 
    const [showSettings, setShowSettings] = useState(false);
    
    const logsEndRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const executionRef = useRef<boolean>(false);
    const timeoutRef = useRef<any>(null);

    // --- PERSISTENCE: LOAD ---
    useEffect(() => {
        const savedData = localStorage.getItem('ditho_warmup_session');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.config) setConfig({ ...parsed.config, isActive: false }); // Sempre inicia pausado no reload
                if (parsed.scriptMessages) setScriptMessages(parsed.scriptMessages);
                if (parsed.personas) setPersonas(parsed.personas);
                if (parsed.logs) setLogs(parsed.logs);
                if (parsed.selectedInstanceIds) setSelectedInstanceIds(parsed.selectedInstanceIds);
                if (parsed.selectedPairs) setSelectedPairs(parsed.selectedPairs);
                if (parsed.activeTabIdx) setActiveTabIdx(parsed.activeTabIdx);
                if (parsed.scriptProgress) setScriptProgress(parsed.scriptProgress);
                
                // Add system log about restored session
                setLogs(prev => [...prev, {
                    id: 'restore-' + Date.now(),
                    timestamp: Date.now(),
                    chipName: 'SISTEMA',
                    message: 'Sessão de maturação restaurada com sucesso.',
                    type: 'INFO'
                }]);
            } catch (e) {
                console.error("Erro ao restaurar sessão de warmup", e);
            }
        }
    }, []);

    // --- PERSISTENCE: SAVE ---
    useEffect(() => {
        const dataToSave = {
            config,
            scriptMessages,
            personas,
            logs: logs.slice(-50), // Salva apenas os últimos 50 logs para não pesar o storage
            selectedInstanceIds,
            selectedPairs,
            activeTabIdx,
            scriptProgress
        };
        localStorage.setItem('ditho_warmup_session', JSON.stringify(dataToSave));
    }, [config, scriptMessages, personas, logs, selectedInstanceIds, selectedPairs, activeTabIdx, scriptProgress]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [scriptMessages, activeTabIdx]);

    const possiblePairs = React.useMemo(() => {
        if (selectedInstanceIds.length < 2) return [];
        const pairs: ConversationPair[] = [];
        for (let i = 0; i < selectedInstanceIds.length; i++) {
            for (let j = i + 1; j < selectedInstanceIds.length; j++) {
                const id1 = selectedInstanceIds[i];
                const id2 = selectedInstanceIds[j];
                const name1 = instances.find(c => c.id === id1)?.name || id1;
                const name2 = instances.find(c => c.id === id2)?.name || id2;
                pairs.push({ id1, id2, label: `${name1} ↔ ${name2}` });
            }
        }
        return pairs;
    }, [selectedInstanceIds, instances]);

    useEffect(() => {
        setSelectedPairs(prev => {
            const filtered = prev.filter(p => selectedInstanceIds.includes(p.id1) && selectedInstanceIds.includes(p.id2));
            if (activeTabIdx >= filtered.length) setActiveTabIdx(0);
            return filtered;
        });
    }, [selectedInstanceIds]);

    // --- HELPERS ---
    const isWithinWorkHours = () => {
        if (config.bypassHours) return true;
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return currentTime >= config.startTime && currentTime <= config.endTime;
    };

    const addLog = (chipName: string, message: string, type: WarmupLog['type']) => {
        setLogs(prev => [...prev.slice(-99), {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            chipName,
            message,
            type
        }]);
    };

    // --- LOGIC: EXECUTION ---
    const handleGenerateScript = async () => {
        if (selectedInstanceIds.length < 2) return alert("Selecione chips primeiro.");
        if (selectedPairs.length === 0) return alert("Escolha pelo menos 1 dupla.");

        setIsGeneratingScript(true);
        addLog("SISTEMA", "IA criando roteiro multi-dupla...", "INFO");

        try {
            const chips = selectedInstanceIds.map(id => ({ id, name: instances.find(i => i.id === id)?.name || id }));
            const topicLabels = config.topics.map(tid => WARMUP_TOPICS.find(t => t.id === tid)?.label || tid);

            const result = await generateWarmupScript(
                chips,
                selectedPairs.map(p => ({ id1: p.id1, id2: p.id2 })),
                topicLabels,
                config.tone,
                config.messageCount
            );

            setPersonas(result.personas);
            setScriptMessages(result.messages.map(m => ({ ...m, status: 'PENDING' })));
            addLog("SISTEMA", `${result.messages.length} mensagens geradas. Pronto para iniciar.`, "INFO");
            setScriptProgress(0);
            setActiveTabIdx(0);
        } catch (e: any) {
            addLog("SISTEMA", `Erro IA: ${e.message}`, "INFO");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const toggleWarmup = () => {
        if (!config.isActive) {
            if (scriptMessages.length === 0) return alert("Gere o roteiro antes.");
            setConfig(prev => ({ ...prev, isActive: true }));
            executionRef.current = true;
            addLog("SISTEMA", "Iniciando disparos sequenciais...", "INFO");
            runScriptLoop();
        } else {
            setConfig(prev => ({ ...prev, isActive: false }));
            executionRef.current = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            addLog("SISTEMA", "Pausado.", "INFO");
        }
    };

    const runScriptLoop = async () => {
        if (!executionRef.current) return;

        setScriptMessages(prevMessages => {
            const nextIdx = prevMessages.findIndex(m => m.status === 'PENDING');
            
            if (nextIdx === -1) {
                setTimeout(() => {
                    addLog("SISTEMA", "Fluxo concluído com sucesso.", "INFO");
                    setConfig(conf => ({ ...conf, isActive: false }));
                    executionRef.current = false;
                }, 100);
                return prevMessages;
            }

            if (!isWithinWorkHours()) {
                addLog("SISTEMA", `Aguardando horário de turno...`, "INFO");
                timeoutRef.current = setTimeout(runScriptLoop, 60000);
                return prevMessages;
            }

            const msg = prevMessages[nextIdx];
            const sender = instances.find(i => i.id === msg.senderId);
            const recipient = instances.find(i => i.id === msg.recipientId);

            if (!sender || !recipient) {
                timeoutRef.current = setTimeout(runScriptLoop, 1000);
                return prevMessages.map((m, i) => i === nextIdx ? { ...m, status: 'FAILED' as const } : m);
            }

            (async () => {
                try {
                    addLog(sender.name, `Simulando digitação para ${recipient.name}...`, "THINKING");
                    const typingDelay = Math.max(3000, msg.text.length * 40);
                    await new Promise(r => setTimeout(r, typingDelay));

                    const success = await EvolutionService.sendText(settings, sender.name, recipient.phoneNumber.replace(/\D/g, ''), msg.text);

                    setScriptMessages(current => {
                        const updated = current.map((m, i) => i === nextIdx ? { 
                            ...m, 
                            status: success ? 'SENT' as const : 'FAILED' as const, 
                            timestamp: Date.now() 
                        } : m);
                        
                        const sentCount = updated.filter(m => m.status === 'SENT').length;
                        setScriptProgress(Math.round((sentCount / updated.length) * 100));
                        
                        return updated;
                    });

                    if (success) {
                        addLog(sender.name, `Mensagem entregue.`, "SENT");
                        const baseDelay = config.frequency === 'LOW' ? 120000 : config.frequency === 'MEDIUM' ? 45000 : 15000;
                        const jitter = Math.random() * (baseDelay * 0.5);
                        timeoutRef.current = setTimeout(runScriptLoop, baseDelay + jitter);
                    } else {
                        throw new Error("Erro API");
                    }
                } catch (e) {
                    addLog(sender.name, `Falha. Pulando para o próximo ciclo.`, "INFO");
                    timeoutRef.current = setTimeout(runScriptLoop, 10000);
                }
            })();

            return prevMessages.map((m, i) => i === nextIdx ? { ...m, status: 'SENDING' as const } : m);
        });
    };

    const toggleTopic = (topicId: string) => {
        setConfig(prev => ({
            ...prev,
            topics: prev.topics.includes(topicId) ? prev.topics.filter(t => t !== topicId) : [...prev.topics, topicId]
        }));
    };

    const clearScript = () => {
        if (config.isActive) return;
        if (!confirm("Isso apagará o roteiro atual e os logs. Continuar?")) return;
        setScriptMessages([]);
        setPersonas({});
        setScriptProgress(0);
        localStorage.removeItem('ditho_warmup_session');
        addLog("SISTEMA", "Roteiro resetado.", "INFO");
    };

    const activePair = selectedPairs[activeTabIdx];
    const pairMessages = activePair ? scriptMessages.filter(m => 
        (m.senderId === activePair.id1 && m.recipientId === activePair.id2) || 
        (m.senderId === activePair.id2 && m.recipientId === activePair.id1)
    ) : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10 h-full">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl border transition-all ${config.isActive ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>
                        <Flame className={`w-6 h-6 ${config.isActive ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Maturador IA</h1>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest opacity-60">Sessão persistente e resiliente</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                    <button onClick={() => setViewMode('CHAT')} className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === 'CHAT' ? 'bg-white text-black shadow-md' : 'text-gray-500'}`}><Layout className="w-3.5 h-3.5 inline mr-2"/> VISUAL</button>
                    <button onClick={() => setViewMode('TERMINAL')} className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === 'TERMINAL' ? 'bg-white text-black shadow-md' : 'text-zinc-500'}`}><Monitor className="w-3.5 h-3.5 inline mr-2"/> LOGS</button>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => setShowSettings(true)} className="p-3 bg-white border border-gray-200 text-gray-500 hover:text-black rounded-2xl shadow-sm hover:shadow-md transition-all"><Settings className="w-5 h-5" /></button>
                    {scriptMessages.length > 0 ? (
                        <button onClick={toggleWarmup} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-black text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all ${config.isActive ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-black text-white hover:bg-gray-800'}`}>
                            {config.isActive ? <><Pause className="w-4 h-4" /> PARAR</> : <><Play className="w-4 h-4" /> INICIAR</>}
                        </button>
                    ) : (
                        <button onClick={handleGenerateScript} disabled={isGeneratingScript || selectedInstanceIds.length < 2 || selectedPairs.length === 0} className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all">
                            {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                            GERAR ROTEIRO
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SIDEBAR */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest">1. Chips ({selectedInstanceIds.length})</h3>
                        </div>
                        <div className="p-3 space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {instances.map(inst => (
                                <div key={inst.id} onClick={() => !config.isActive && !isGeneratingScript && setSelectedInstanceIds(prev => prev.includes(inst.id) ? prev.filter(i => i !== inst.id) : [...prev, inst.id])} className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${selectedInstanceIds.includes(inst.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${selectedInstanceIds.includes(inst.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{inst.name.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-[11px] text-gray-900 truncate uppercase">{inst.name}</div>
                                        <div className="text-[9px] text-gray-400 font-mono">{inst.phoneNumber}</div>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest">2. Duplas Ativas ({selectedPairs.length})</h3>
                        </div>
                        <div className="p-3 space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {possiblePairs.map((pair, idx) => {
                                const isSelected = selectedPairs.find(p => p.id1 === pair.id1 && p.id2 === pair.id2);
                                return (
                                    <div key={idx} onClick={() => !config.isActive && !isGeneratingScript && (isSelected ? setSelectedPairs(prev => prev.filter(p => !(p.id1 === pair.id1 && p.id2 === pair.id2))) : setSelectedPairs(prev => [...prev, pair]))} className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:border-emerald-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}><MessagesSquare className="w-3.5 h-3.5" /></div>
                                            <span className="text-[10px] font-black text-gray-700 uppercase">{pair.label}</span>
                                        </div>
                                        {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="lg:col-span-9 flex flex-col space-y-4">
                    {scriptMessages.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-[2rem] p-5 shadow-sm flex items-center justify-between">
                            <div className="flex-1 mr-10">
                                <div className="flex justify-between text-[10px] font-black mb-2">
                                    <span className="text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3 text-amber-500 fill-amber-500"/> Progresso do Roteiro</span>
                                    <span className="text-indigo-600">{scriptProgress}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                    <div className="bg-indigo-600 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${scriptProgress}%` }} />
                                </div>
                            </div>
                            {!config.isActive && <button onClick={clearScript} className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 bg-red-50 rounded-xl">Resetar</button>}
                        </div>
                    )}

                    <div className="flex-1 h-[650px] overflow-hidden flex flex-col">
                        {viewMode === 'TERMINAL' ? (
                            <div className="flex-1 bg-[#09090b] p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl font-mono text-[10px] space-y-2 overflow-y-auto custom-scrollbar">
                                {logs.map(log => (
                                    <div key={log.id} className="flex gap-4 border-b border-zinc-900/50 pb-2">
                                        <span className="text-zinc-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className={`font-black shrink-0 uppercase ${log.type==='SENT'?'text-indigo-400':log.type==='THINKING'?'text-zinc-500':'text-zinc-300'}`}>{log.chipName}:</span>
                                        <span className="text-zinc-400 break-words leading-relaxed">{log.message}</span>
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-[2.5rem] shadow-xl overflow-hidden">
                                {/* TABS BAR (STYLE ABAS PC) */}
                                {selectedPairs.length > 0 && (
                                    <div className="flex items-center gap-1 bg-gray-100/80 p-2 border-b border-gray-200 overflow-x-auto no-scrollbar shrink-0">
                                        {selectedPairs.map((pair, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setActiveTabIdx(idx)}
                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTabIdx === idx ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${activeTabIdx === idx && config.isActive ? 'bg-indigo-600 animate-pulse' : 'bg-gray-300'}`}></div>
                                                {pair.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* CHAT VIEW */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#efeae2] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-20 custom-scrollbar">
                                    {scriptMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-40">
                                            <History className="w-16 h-16 mb-4"/>
                                            <p className="font-black uppercase tracking-widest">Nenhuma conversa ativa</p>
                                        </div>
                                    ) : (
                                        <>
                                            {pairMessages.map((msg, idx) => {
                                                const isRight = msg.senderId === activePair.id1;
                                                return (
                                                    <div key={idx} className={`flex ${isRight ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                                        <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm border ${msg.status==='SENT' ? (isRight ? 'bg-[#d9fdd3] border-green-200' : 'bg-white border-gray-100') : 'bg-gray-100/90 border-gray-200 opacity-60'} ${isRight ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                                                            <div className="flex items-center gap-2 mb-1.5 border-b border-black/5 pb-1 text-[8px] font-black uppercase tracking-tighter opacity-40">
                                                                {instances.find(i=>i.id===msg.senderId)?.name}
                                                            </div>
                                                            <p className="text-[13px] text-gray-800 leading-snug font-medium break-words">{msg.text}</p>
                                                            <div className="flex justify-end gap-1 mt-1 opacity-50">
                                                                {msg.status === 'SENT' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                                                                {msg.status === 'SENDING' && <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />}
                                                                {msg.status === 'FAILED' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                                                {msg.timestamp && <span className="text-[8px] font-bold text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={chatEndRef} />
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* POPUP DE CONFIGURAÇÕES */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-10 border-b pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Ajustes Técnicos</h3>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Controle de motor da IA</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X className="w-7 h-7 text-gray-300 hover:text-black" /></button>
                        </div>
                        
                        <div className="space-y-10">
                            <section>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-5 block tracking-[0.2em] border-l-4 border-indigo-600 pl-3">Turno e Volume</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                        <span className="text-[9px] font-black text-gray-400 block mb-1.5 uppercase tracking-widest">Início</span>
                                        <div className="flex items-center gap-2"><Moon className="w-4 h-4 text-gray-300"/><input type="time" value={config.startTime} onChange={e=>setConfig(prev=>({...prev, startTime: e.target.value}))} className="bg-transparent font-black text-xl w-full outline-none text-gray-800" /></div>
                                    </div>
                                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                        <span className="text-[9px] font-black text-gray-400 block mb-1.5 uppercase tracking-widest">Fim</span>
                                        <div className="flex items-center gap-2"><Sun className="w-4 h-4 text-amber-400"/><input type="time" value={config.endTime} onChange={e=>setConfig(prev=>({...prev, endTime: e.target.value}))} className="bg-transparent font-black text-xl w-full outline-none text-gray-800" /></div>
                                    </div>
                                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                        <span className="text-[9px] font-black text-gray-400 block mb-1.5 uppercase tracking-widest">Msgs/Dupla</span>
                                        <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-indigo-400"/><input type="number" value={config.messageCount} onChange={e=>setConfig(prev=>({...prev, messageCount: parseInt(e.target.value)}))} className="bg-transparent font-black text-xl w-full outline-none text-gray-800" /></div>
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between p-5 bg-orange-50/50 rounded-3xl border border-orange-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-100 rounded-2xl text-orange-600"><AlertTriangle className="w-5 h-5" /></div>
                                        <div><span className="font-black text-xs text-orange-900 block uppercase tracking-widest">Modo 24 Horas</span><span className="text-[10px] text-orange-600 font-bold uppercase">Ignorar turnos de horário</span></div>
                                    </div>
                                    <button onClick={()=>setConfig(prev=>({...prev, bypassHours: !prev.bypassHours}))} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${config.bypassHours ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${config.bypassHours ? 'left-8' : 'left-1'}`} />
                                    </button>
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-5 block tracking-[0.2em] border-l-4 border-emerald-500 pl-3">Tópicos Narrativos</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {WARMUP_TOPICS.map(topic => {
                                        const isSelected = config.topics.includes(topic.id);
                                        return (
                                            <button key={topic.id} onClick={() => toggleTopic(topic.id)} className={`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                                                <topic.icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{topic.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-5 block tracking-[0.2em] border-l-4 border-amber-500 pl-3">Frequência</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(freq => (
                                        <button key={freq} onClick={() => setConfig(prev => ({ ...prev, frequency: freq }))} className={`py-5 rounded-3xl text-[10px] font-black transition-all border uppercase tracking-[0.2em] ${config.frequency === freq ? 'bg-black text-white border-black shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>
                                            {freq === 'LOW' ? 'CONSERVADOR' : freq === 'MEDIUM' ? 'HUMANO' : 'ACELERADO'}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-5 block tracking-[0.2em] border-l-4 border-purple-500 pl-3">Tom de Voz</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(['Casual', 'Formal', 'Gírias', 'Trabalho'] as const).map(t => (
                                        <button key={t} onClick={() => setConfig(prev => ({ ...prev, tone: t }))} className={`py-4 rounded-[1.5rem] text-[10px] font-black transition-all border uppercase tracking-[0.1em] ${config.tone === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="pt-6 border-t border-gray-100">
                                <button onClick={() => { setShowSettings(false); handleGenerateScript(); }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-sm shadow-2xl hover:bg-gray-900 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em]">
                                    <Save className="w-5 h-5" /> Salvar & Regerar Roteiro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Warmup;


import React, { useState, useEffect } from 'react';
import { Download, FileJson, Users, Loader2, CheckCircle, AlertTriangle, ShieldAlert, Upload, History, Database, ArrowRight, X, AlertCircle } from 'lucide-react';
import { DatabaseService } from '../services/databaseService';

const ExportLeads: React.FC = () => {
    const [stats, setStats] = useState({ total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreLog, setRestoreLog] = useState<string[]>([]);
    
    // Estados para o Modal de Confirmação
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingBackup, setPendingBackup] = useState<any>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const data = await DatabaseService.getDailyStats();
            setStats({ total: data.totalLeads || 0 });
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMasterBackup = async () => {
        setIsExporting(true);
        try {
            const fullData = await DatabaseService.generateMasterBackup();
            const jsonStr = JSON.stringify(fullData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `BACKUP_MESTRE_DITHO_OS_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert("BACKUP REALIZADO COM SUCESSO!");
        } catch (e) {
            alert("Erro ao gerar backup.");
        } finally {
            setIsExporting(false);
        }
    };

    // 1. SELEÇÃO DO ARQUIVO
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target?.result as string);
                if (!backup.version || !backup.data) throw new Error("Arquivo não reconhecido como Backup Ditho.");
                
                // Armazena o backup e abre o modal de confirmação
                setPendingBackup(backup);
                setShowConfirmModal(true);
            } catch (err: any) {
                alert(`Erro ao ler arquivo: ${err.message}`);
            }
            e.target.value = ''; // Limpa o input para permitir selecionar o mesmo arquivo
        };
        reader.readAsText(file);
    };

    // 2. EXECUÇÃO DA RESTAURAÇÃO (PÓS-CONFIRMAÇÃO)
    const executeRestore = async () => {
        if (!pendingBackup) return;
        
        setShowConfirmModal(false);
        setIsRestoring(true);
        setRestoreLog(["Iniciando motor de migração..."]);

        try {
            await DatabaseService.restoreMasterBackup(pendingBackup, (msg) => {
                setRestoreLog(prev => [msg, ...prev]);
            });
            alert("SISTEMA RESTAURADO COM SUCESSO!");
            loadStats();
        } catch (err: any) {
            setRestoreLog(prev => [`ERRO FATAL: ${err.message}`, ...prev]);
            alert(`Falha na restauração: ${err.message}`);
        } finally {
            setIsRestoring(false);
            setPendingBackup(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="border-b border-gray-200 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-black" />
                        Centro de Resgate & Migração
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Ferramentas avançadas para salvar e mover seus dados entre projetos Supabase.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Leads Totais no Banco</p>
                        <h2 className="text-3xl font-black text-gray-900">{isLoading ? "..." : stats.total.toLocaleString()}</h2>
                    </div>
                </div>

                <div className="md:col-span-2 bg-indigo-600 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <History className="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-8 -mt-8" />
                    <div>
                        <h3 className="text-lg font-bold mb-1">Exportação Total</h3>
                        <p className="text-indigo-100 text-xs">Gera um arquivo JSON com Leads, Mensagens, Agentes e Prompts.</p>
                    </div>
                    <button 
                        onClick={handleMasterBackup}
                        disabled={isExporting || isRestoring}
                        className="mt-6 w-fit py-3 px-6 bg-white text-indigo-700 font-black rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 text-sm"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Gerar Backup Mestre
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Restaurar / Migrar Sistema</h3>
                        <p className="text-sm text-gray-500">Suba o seu Backup Mestre para repovoar um novo banco de dados vazio.</p>
                    </div>
                </div>

                {isRestoring ? (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="flex items-center gap-3 text-emerald-600 font-bold">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Injetando dados... Não feche esta página.</span>
                        </div>
                        <div className="bg-gray-900 text-emerald-400 p-6 rounded-xl font-mono text-[11px] h-64 overflow-y-auto flex flex-col-reverse shadow-inner">
                            {restoreLog.map((log, i) => (
                                <div key={i} className="mb-1 border-l border-emerald-900/50 pl-2">
                                    <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString()}]</span> {log}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="relative group">
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 group-hover:border-indigo-300 group-hover:bg-indigo-50/30 transition-all">
                            <Database className="w-12 h-12 text-gray-300 group-hover:text-indigo-400" />
                            <div className="text-center">
                                <p className="font-bold text-gray-600 group-hover:text-indigo-600">Clique para selecionar o Backup Mestre</p>
                                <p className="text-xs text-gray-400 mt-1">Apenas arquivos .json gerados por este sistema.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE CONFIRMAÇÃO CUSTOMIZADO */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">RESTORE TOTAL?</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                Você está prestes a injetar <b>{pendingBackup?.data?.leads?.length || 0} leads</b> e <b>{pendingBackup?.data?.messages?.length || 0} mensagens</b> no seu novo banco. <br/><br/>
                                Certifique-se de que rodou o SQL para <b>desativar o RLS</b> no Supabase novo.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={executeRestore}
                                    className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-800 shadow-xl transition-all uppercase tracking-widest"
                                >
                                    SIM, INICIAR RESTAURAÇÃO
                                </button>
                                <button 
                                    onClick={() => { setShowConfirmModal(false); setPendingBackup(null); }}
                                    className="w-full py-4 text-gray-400 font-bold text-sm hover:text-black transition-colors"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Processo irreversível após o início</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportLeads;

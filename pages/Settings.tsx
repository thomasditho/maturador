
import React, { useState } from 'react';
import { Server, Key, Save, CheckCircle, Globe, Calculator } from 'lucide-react';
import { SystemSettings, SafetyConfig } from '../types';
import { EvolutionService } from '../services/evolutionService';
import { DatabaseService } from '../services/databaseService';

interface SettingsProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  safetyConfig: SafetyConfig;
}

const SettingsPage: React.FC<SettingsProps> = ({ settings, setSettings, safetyConfig }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setConnectionStatus('idle');
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
        await DatabaseService.saveSystemSettings(settings, safetyConfig);
    } catch (e) {
        console.error("DB Save Failed", e);
        alert("Erro ao salvar no banco de dados.");
        setIsSaving(false);
        return;
    }

    try {
        await EvolutionService.fetchInstances(settings);
        setConnectionStatus('success');
    } catch (e) {
        setConnectionStatus('error');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        <p className="text-gray-500 mt-1 text-sm">Parâmetros globais do sistema.</p>
      </div>

      {/* API CONNECTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
         <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 mb-4">
             <Server className="w-5 h-5" /> Evolution API (Infraestrutura)
         </h3>
         
         <div className="grid grid-cols-1 gap-6">
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">URL da API</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-1 focus-within:ring-black">
                    <Globe className="w-4 h-4 text-gray-400 mr-2" />
                    <input 
                        type="text" 
                        value={settings.evolutionApiUrl}
                        onChange={(e) => handleChange('evolutionApiUrl', e.target.value)}
                        placeholder="https://api.seudominio.com"
                        className="w-full text-sm outline-none text-gray-900 font-mono"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Global API Key</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-1 focus-within:ring-black">
                    <Key className="w-4 h-4 text-gray-400 mr-2" />
                    <input 
                        type="password" 
                        value={settings.evolutionApiKey}
                        onChange={(e) => handleChange('evolutionApiKey', e.target.value)}
                        className="w-full text-sm outline-none text-gray-900 font-mono"
                    />
                </div>
            </div>
         </div>
      </div>

      {/* FINANCIAL SETTINGS (CLEAN) */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
         <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 mb-4">
             <Calculator className="w-5 h-5" /> Custos Operacionais
         </h3>
         
         <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Custo Médio por Chip</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-1 focus-within:ring-black">
                    <span className="text-gray-400 text-sm font-bold mr-2">R$</span>
                    <input 
                        type="number" 
                        step="0.01"
                        value={settings.costPerChip || 0}
                        onChange={(e) => handleChange('costPerChip', parseFloat(e.target.value))}
                        className="w-full text-sm outline-none text-gray-900 font-mono"
                        placeholder="0.00"
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Usado para calcular prejuízo de banimentos.</p>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Custo por Disparo (API/Proxy)</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-1 focus-within:ring-black">
                    <span className="text-gray-400 text-sm font-bold mr-2">R$</span>
                    <input 
                        type="number" 
                        step="0.001"
                        value={settings.costPerMsg || 0}
                        onChange={(e) => handleChange('costPerMsg', parseFloat(e.target.value))}
                        className="w-full text-sm outline-none text-gray-900 font-mono"
                        placeholder="0.00"
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Custo unitário de infraestrutura.</p>
            </div>
         </div>
      </div>

      {/* SAVE ACTIONS */}
      <div className="flex flex-col gap-4 pt-4">
        {connectionStatus === 'success' && (
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 flex items-center gap-3 text-gray-800 text-xs font-bold">
                <CheckCircle className="w-4 h-4 text-black" />
                Conectado com sucesso.
            </div>
        )}
        
        {connectionStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3 text-red-800 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                Erro de conexão. Verifique URL e Key.
            </div>
        )}

        <div className="flex justify-end">
            <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm w-full md:w-auto justify-center text-sm"
            >
                {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Alterações</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

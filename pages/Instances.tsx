
import React, { useState } from 'react';
import { Plus, RefreshCw, QrCode, Smartphone, Trash2, AlertTriangle, X, Shield, Edit2, Check, XCircle } from 'lucide-react';
import { Instance, InstanceStatus, SystemSettings, SafetyConfig } from '../types';
import { EvolutionService } from '../services/evolutionService';
import SafetyBrain from './SafetyBrain';

interface InstancesProps {
  instances: Instance[];
  setInstances: React.Dispatch<React.SetStateAction<Instance[]>>;
  settings: SystemSettings;
  safetyConfig: SafetyConfig;
  setSafetyConfig: React.Dispatch<React.SetStateAction<SafetyConfig>>;
}

const Instances: React.FC<InstancesProps> = ({ instances, setInstances, settings, safetyConfig, setSafetyConfig }) => {
  const [activeTab, setActiveTab] = useState<'chips' | 'rules'>('chips');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<string | null>(null); 
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para edição manual de número
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState('');

  const isConfigured = settings?.evolutionApiUrl && settings?.evolutionApiKey;

  const handleRefresh = async () => {
      setIsLoading(true);
      const data = await EvolutionService.fetchInstances(settings);
      setInstances(data);
      setIsLoading(false);
  };

  const handleAddInstance = async () => {
    if (!newInstanceName) return;
    setIsLoading(true);

    try {
        await EvolutionService.createInstance(settings, newInstanceName);
        await new Promise(r => setTimeout(r, 1000));
        const qrCodeBase64 = await EvolutionService.connectInstance(settings, newInstanceName);
        
        if (qrCodeBase64) {
            setShowQRModal(qrCodeBase64);
        } else {
             alert("Instância criada, mas não foi possível gerar o QR Code imediatamente. Tente clicar em 'Ler QR Code' na lista.");
        }

        await handleRefresh();
        setShowAddModal(false);
        setNewInstanceName('');
    } catch (e: any) {
        alert(`Erro ao criar: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleShowQR = async (instanceName: string) => {
      const qr = await EvolutionService.connectInstance(settings, instanceName);
      if (qr) setShowQRModal(qr);
      else alert("Não foi possível gerar o QR Code. Verifique se o chip já está conectado ou se a API está online.");
  };

  const deleteInstance = async (id: string) => {
    if(window.confirm(`Tem certeza que deseja deletar o chip ${id}?`)) {
        await EvolutionService.deleteInstance(settings, id);
        await handleRefresh();
    }
  };

  const startEditing = (inst: Instance) => {
      setEditingId(inst.id);
      setTempPhone(inst.phoneNumber === 'Sem número' ? '' : inst.phoneNumber);
  };

  const saveManualPhone = (instanceName: string) => {
      const clean = tempPhone.replace(/\D/g, '');
      if (clean.length < 10) {
          alert("Número inválido. Use o formato: 5511999998888");
          return;
      }
      EvolutionService.savePhoneOverride(instanceName, clean);
      setEditingId(null);
      handleRefresh(); // Recarrega para aplicar o override
  };

  return (
    <div className="space-y-8">
      
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Chips & Regras</h2>
          <p className="text-gray-500 mt-1 text-sm">Gerencie sua frota de números e a segurança da operação.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('chips')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'chips' ? 'bg-white shadow text-black font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            >
                <Smartphone className="w-4 h-4"/> Chips
            </button>
            <button 
                onClick={() => setActiveTab('rules')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'rules' ? 'bg-white shadow text-black font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            >
                <Shield className="w-4 h-4"/> Regras (Anti-bloqueio)
            </button>
        </div>
      </div>

      {activeTab === 'chips' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-end gap-2 mb-6">
                <button 
                onClick={handleRefresh}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-medium text-sm"
                >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
                </button>
                <button 
                onClick={() => setShowAddModal(true)}
                className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-all shadow-lg shadow-gray-200 font-medium text-sm"
                >
                <Plus className="w-4 h-4" />
                <span>Novo Chip</span>
                </button>
             </div>

            {!isConfigured && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3 text-yellow-800 mb-6">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-medium">Configure a URL da API e Key nas Configurações para usar.</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.length === 0 && !isLoading && (
                    <div className="col-span-3 text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <Smartphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Nenhum chip encontrado na Evolution.</p>
                        <p className="text-xs text-gray-400 mt-2">Verifique se sua API Key está correta.</p>
                    </div>
                )}

                {instances.map((instance) => (
                <div key={instance.id} className="bg-white border border-gray-200 rounded-xl p-6 relative group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <Smartphone className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex space-x-1">
                        <button onClick={() => deleteInstance(instance.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{instance.name}</h3>
                        
                        {editingId === instance.id ? (
                            <div className="flex items-center gap-1 mt-1">
                                <input 
                                    autoFocus
                                    type="text"
                                    value={tempPhone}
                                    onChange={e => setTempPhone(e.target.value)}
                                    className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-black w-full"
                                    placeholder="5511999998888"
                                />
                                <button onClick={() => saveManualPhone(instance.name)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                                <button onClick={() => setEditingId(null)} className="p-1 text-red-500 hover:bg-red-50 rounded"><XCircle className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group/phone">
                                <p className={`text-sm font-mono mt-0.5 ${instance.phoneNumber.length > 15 ? 'text-amber-500 text-[10px] break-all' : 'text-gray-500'}`}>
                                    {instance.phoneNumber}
                                </p>
                                <button 
                                    onClick={() => startEditing(instance)}
                                    className="opacity-0 group-hover/phone:opacity-100 p-1 text-gray-400 hover:text-black transition-all"
                                    title="Corrigir número manualmente"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        {instance.phoneNumber.length > 15 && editingId !== instance.id && (
                            <p className="text-[9px] text-amber-600 font-bold uppercase mt-1">⚠️ A API retornou um ID. Clique no lápis para corrigir.</p>
                        )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Status</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        instance.status === InstanceStatus.CONNECTED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {instance.status === InstanceStatus.CONNECTED ? 'CONECTADO' : 'DESCONECTADO'}
                        </span>
                    </div>
                    </div>

                    {instance.status !== InstanceStatus.CONNECTED && (
                    <div className="mt-6">
                        <button 
                            onClick={() => handleShowQR(instance.id)}
                            className="w-full py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-2"
                        >
                            <QrCode className="w-4 h-4" /> Ler QR Code
                        </button>
                    </div>
                    )}
                </div>
                ))}
            </div>
          </div>
      )}

      {activeTab === 'rules' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SafetyBrain config={safetyConfig} setConfig={setSafetyConfig} />
          </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Criar Nova Instância</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome (Sem espaços)</label>
                <input 
                  type="text" 
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value.replace(/\s/g, ''))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Ex: Comercial1"
                />
              </div>
              <div className="flex space-x-3 mt-8">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddInstance}
                  disabled={isLoading || !newInstanceName}
                  className="flex-1 bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-bold flex items-center justify-center"
                >
                  {isLoading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white p-6 rounded-2xl w-full max-w-sm flex flex-col items-center relative">
                 <button onClick={() => { setShowQRModal(null); handleRefresh(); }} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <X className="w-4 h-4" />
                 </button>
                 <h3 className="text-xl font-bold text-gray-900 mb-4">Escaneie o QR Code</h3>
                 <div className="p-2 border border-gray-200 rounded-lg bg-white shadow-inner">
                    <img src={showQRModal} alt="QR Code" className="w-64 h-64 object-contain" />
                 </div>
                 <p className="text-center text-sm text-gray-500 mt-4">
                    Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar Aparelho
                 </p>
                 <button onClick={() => { setShowQRModal(null); handleRefresh(); }} className="mt-6 w-full bg-black text-white py-3 rounded-lg font-bold">
                    Já escaneiei
                 </button>
             </div>
        </div>
      )}
    </div>
  );
};

export default Instances;

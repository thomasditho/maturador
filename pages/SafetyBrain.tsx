import React from 'react';
import { Shield, Clock, Shuffle, Thermometer, Info } from 'lucide-react';
import { SafetyConfig } from '../types';

interface SafetyBrainProps {
  config: SafetyConfig;
  setConfig: React.Dispatch<React.SetStateAction<SafetyConfig>>;
}

const SafetyBrain: React.FC<SafetyBrainProps> = ({ config, setConfig }) => {
  
  const handleChange = (field: keyof SafetyConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuração Global Anti-Bloqueio</h2>
          <p className="text-gray-500 mt-1 text-sm">Regras de segurança aplicadas a TODAS as operações.</p>
        </div>
        <div className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2 shadow-lg">
            <Shield className="w-5 h-5" />
            <span className="font-bold text-sm">Guardian Ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Interval Rules */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gray-100 rounded-lg text-gray-900">
                <Clock className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900">Intervalos & Jitter</h3>
                <p className="text-xs text-gray-500">Imitação de comportamento humano</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
               <div className="flex justify-between text-sm mb-2 font-medium">
                 <span className="text-gray-600">Delay Mínimo</span>
                 <span className="text-gray-900 font-bold bg-gray-100 px-2 rounded">{config.minDelay}s</span>
               </div>
               <input 
                 type="range" min="5" max="60" value={config.minDelay} 
                 onChange={(e) => handleChange('minDelay', parseInt(e.target.value))}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
               />
            </div>
            
            <div>
               <div className="flex justify-between text-sm mb-2 font-medium">
                 <span className="text-gray-600">Delay Máximo</span>
                 <span className="text-gray-900 font-bold bg-gray-100 px-2 rounded">{config.maxDelay}s</span>
               </div>
               <input 
                 type="range" min="10" max="180" value={config.maxDelay} 
                 onChange={(e) => handleChange('maxDelay', parseInt(e.target.value))}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
               />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <Shuffle className="w-4 h-4" /> Padrão de Aleatoriedade
                </label>
                <select 
                    value={config.jitterPattern}
                    onChange={(e) => handleChange('jitterPattern', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-black focus:border-black"
                >
                    <option value="random">Totalmente Aleatório (Recomendado)</option>
                    <option value="linear">Linear Progressivo</option>
                </select>
            </div>
          </div>
        </div>

        {/* Warm-up Config */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm relative overflow-hidden">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-50 rounded-lg text-red-600">
                    <Thermometer className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Aquecimento (Warm-up)</h3>
                    <p className="text-xs text-gray-500">Para chips novos ou frios</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Ativar Aquecimento Automático</span>
                    <button 
                        onClick={() => handleChange('warmupEnabled', !config.warmupEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.warmupEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${config.warmupEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                <div className={`space-y-6 transition-opacity ${config.warmupEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Início (Msgs/dia)</label>
                        <input 
                            type="number" 
                            value={config.warmupStartCount}
                            onChange={(e) => handleChange('warmupStartCount', parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Incremento Diário</label>
                        <input 
                            type="number" 
                            value={config.warmupIncrement}
                            onChange={(e) => handleChange('warmupIncrement', parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>

                <div className="bg-blue-50 text-blue-800 text-xs p-4 rounded-lg flex gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <p>O aquecimento aumenta gradualmente o volume de disparos para evitar flags imediatas em números novos.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SafetyBrain;
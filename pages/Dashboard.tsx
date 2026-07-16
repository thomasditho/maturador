
import React, { useEffect, useState } from 'react';
import { Activity, Zap, Shield, Smartphone, Clock, BarChart3, AlertTriangle, DollarSign, Wallet, ArrowRight } from 'lucide-react';
import { Instance, ManualOperation, SystemSettings } from '../types';
import { DatabaseService } from '../services/databaseService';

interface DashboardProps {
  instances: Instance[];
  activeOperations: ManualOperation[];
}

const Dashboard: React.FC<DashboardProps> = ({ instances, activeOperations }) => {
  const [stats, setStats] = useState({
      msgsToday: [] as any[],
      sessionsToday: [] as any[],
      totalHistorySent: 0,
      totalConversations: 0
  });
  const [finSettings, setFinSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      loadData();
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
      try {
          const data = await DatabaseService.getDailyStats();
          const settingsData = await DatabaseService.loadSystemSettings();
          setStats(data);
          if (settingsData) setFinSettings(settingsData.settings);
      } catch (e) {} finally {
          setIsLoading(false);
      }
  };

  const todaySentCount = stats.msgsToday?.length || 0;
  const activeChips = instances.filter(i => i.status === 'CONNECTED').length;
  const totalChips = instances.length;
  const bannedChips = instances.filter(i => i.status === 'BANNED' || i.status === 'DISCONNECTED').length;
  const fleetHealth = totalChips > 0 ? Math.round((activeChips / totalChips) * 100) : 0;

  const hourlyData = Array(24).fill(0);
  (stats.msgsToday || []).forEach(msg => {
      const hour = new Date(msg.created_at).getHours();
      hourlyData[hour]++;
  });

  const chipStats = instances.map(inst => {
      const instanceSessions = (stats.sessionsToday || []).filter(s => s.instance_id === inst.id);
      const count = instanceSessions.length;
      let loadStatus: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
      if (count > 300) loadStatus = 'WARNING';
      if (count > 500) loadStatus = 'DANGER';
      return { ...inst, todayVolume: count, loadStatus };
  }).sort((a, b) => b.todayVolume - a.todayVolume);

  const costPerChip = finSettings?.costPerChip || 0;
  const costPerMsg = finSettings?.costPerMsg || 0;
  const totalInvestment = (stats.totalHistorySent * costPerMsg) + (bannedChips * costPerChip);
  const cpl = stats.totalConversations > 0 ? (totalInvestment / stats.totalConversations) : 0;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Activity className="w-6 h-6 lg:w-8 h-8 text-black" />
              Torre de Controle
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Monitoramento tático da operação.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 w-fit">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-700">SISTEMA ATIVO</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Disparos Hoje</p>
                    <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">{todaySentCount}</h3>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <Zap className="w-5 h-5" />
                </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                <div className="bg-black h-1 rounded-full" style={{ width: `${Math.min((todaySentCount / 1000) * 100, 100)}%` }}></div>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Chips Ativos</p>
                    <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight flex items-baseline gap-1">
                        {activeChips}<span className="text-lg text-gray-400 font-normal">/{totalChips}</span>
                    </h3>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <Smartphone className="w-5 h-5" />
                </div>
            </div>
            <div className="text-xs font-medium text-gray-500">{fleetHealth}% da frota online</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Enviado</p>
                    <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">{stats.totalHistorySent.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <BarChart3 className="w-5 h-5" />
                </div>
            </div>
            <div className="text-xs font-medium text-gray-500">Histórico vitalício</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Investimento</p>
                    <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">R$ {totalInvestment.toFixed(2)}</h3>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <Wallet className="w-5 h-5" />
                </div>
            </div>
            <div className="text-xs font-medium text-gray-500">Custo Chips + API</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    Eficiência
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Custo por Lead</p>
                            <p className="text-[10px] text-gray-500">Média por conversa</p>
                        </div>
                        <div className="text-xl lg:text-2xl font-bold text-gray-900 font-mono">R$ {cpl.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Banimentos</p>
                            <p className="text-[10px] text-gray-500">Custo de perda</p>
                        </div>
                        <div className="text-xl lg:text-2xl font-bold text-gray-900 font-mono flex items-center gap-2">
                            R$ {(bannedChips * costPerChip).toFixed(2)}
                            {bannedChips > 0 && <AlertTriangle className="w-4 h-4 text-gray-400" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden">
          <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    Ritmo de Disparo
                </h3>
                <p className="text-gray-400 text-xs mt-1">Volume por hora (Últimas 24h).</p>
          </div>
          <div className="h-48 flex items-end space-x-1 lg:space-x-2 px-1 overflow-x-auto pb-2">
             {hourlyData.map((count, hour) => {
                 const heightPercent = count > 0 ? Math.max((count / Math.max(...hourlyData, 1)) * 100, 5) : 0;
                 return (
                   <div key={hour} className="flex-1 flex flex-col justify-end group min-w-[12px] h-full">
                     <div style={{ height: `${heightPercent}%` }} className={`w-full rounded-sm transition-all duration-500 ${count > 0 ? 'bg-black' : 'bg-gray-100'}`} />
                     <span className="text-[8px] lg:text-[9px] text-gray-400 mt-2 text-center font-mono">{hour}h</span>
                   </div>
                 )
             })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-400" />
                  Carga da Frota
              </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                        <th className="px-6 py-3">Chip</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Hoje</th>
                        <th className="px-6 py-3">Carga</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {chipStats.map(inst => (
                        <tr key={inst.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-bold text-gray-900">{inst.name}</td>
                            <td className="px-6 py-4">
                                <span className={`w-2 h-2 rounded-full inline-block mr-2 ${inst.status === 'CONNECTED' ? 'bg-black' : 'bg-gray-300'}`}></span>
                                <span className="text-[10px] font-mono text-gray-500">{inst.status === 'CONNECTED' ? 'ON' : 'OFF'}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-700">{inst.todayVolume}</td>
                            <td className="px-6 py-4">
                                <div className="w-16 lg:w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full ${inst.loadStatus === 'DANGER' ? 'bg-black' : 'bg-gray-400'}`} style={{ width: `${Math.min((inst.todayVolume / 500) * 100, 100)}%` }} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;

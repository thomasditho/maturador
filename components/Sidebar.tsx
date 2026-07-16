
import React from 'react';
import { LayoutDashboard, Smartphone, Bot, Settings, LogOut, Inbox, CheckSquare, BookOpen, Database, Package, X, Flame, Factory, Download } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, onClose }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agents', label: 'Meus Agentes', icon: Bot },
    { id: 'instances', label: 'Meus Chips', icon: Smartphone },
    { id: 'maturador-pro', label: 'Maturador Pro', icon: Flame },
    { id: 'library', label: 'Biblioteca', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-12 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-[55] transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Ditho BDR
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-6 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Principal
          </div>
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-500 group-hover:text-gray-700'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <button 
            onClick={() => setCurrentView('settings')}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full ${currentView === 'settings' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Configurações</span>
          </button>

          <button 
            onClick={() => setCurrentView('tools')}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full ${currentView === 'tools' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium text-sm">Recursos</span>
          </button>
          
          <button className="flex items-center space-x-3 text-red-600 hover:text-red-700 transition-colors w-full px-3 py-2 mt-1 rounded-lg hover:bg-red-50">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

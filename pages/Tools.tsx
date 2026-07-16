
import React from 'react';
import { Download, Flame, BookOpen, CheckSquare, ArrowRight } from 'lucide-react';

interface ToolsProps {
  setCurrentView: (view: string) => void;
}

const Tools: React.FC<ToolsProps> = ({ setCurrentView }) => {
  const tools = [
    {
      id: 'export-leads',
      title: 'Exportar Base',
      description: 'Exporte seus leads e contatos em formatos compatíveis.',
      icon: Download,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'warmup',
      title: 'Maturador IA',
      description: 'Aqueça seus chips automaticamente para evitar banimentos.',
      icon: Flame,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      id: 'documentation',
      title: 'Documentação',
      description: 'Acesse manuais e guias de uso do sistema.',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'checklist',
      title: 'Checklist',
      description: 'Verifique se tudo está pronto para sua operação.',
      icon: CheckSquare,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recursos e Ferramentas</h1>
        <p className="text-gray-500 mt-2">Acesse utilitários complementares para sua operação.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setCurrentView(tool.id)}
            className="flex items-start p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left group"
          >
            <div className={`p-4 rounded-xl ${tool.color} mr-5 group-hover:scale-110 transition-transform`}>
              <tool.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                {tool.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tools;

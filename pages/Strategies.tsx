


import React, { useState, useEffect } from 'react';
import { Folder, User, Plus, ChevronRight, ArrowLeft, Trash2, Briefcase, MessageSquare, ToggleLeft, ToggleRight, Edit2, X, Save, Copy, Camera } from 'lucide-react';

// --- TYPES ---
interface StrategyPrompt {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  useVision?: boolean; // New field
  stats?: { sent: number, replied: number, converted: number };
}

interface StrategyData {
  niches: string[];
  professions: Record<string, string[]>; // Key: Niche Name
  prompts: Record<string, StrategyPrompt[]>; // Key: "Niche::Profession"
}

const GLOBAL_VARIABLES = [
    { label: '{nome}', desc: 'Nome do Cliente/Empresa' },
    { label: '{primeiro_nome}', desc: 'Primeiro nome apenas' },
    { label: '{nicho}', desc: 'Nicho da empresa' },
    { label: '{telefone}', desc: 'Telefone formatado' },
    { label: '{endereco}', desc: 'Endereço completo' },
    { label: '{cidade}', desc: 'Cidade' },
    { label: '{nota}', desc: 'Avaliação Google (ex: 4.8)' },
    { label: '{reviews}', desc: 'Qtd. Avaliações' },
    { label: '{site_atual}', desc: 'Site que ele já tem' },
    { label: '{link_site_novo}', desc: 'Link do Ditho Sites' },
];

const Strategies: React.FC = () => {
  // --- NAVIGATION STATE ---
  const [currentLevel, setCurrentLevel] = useState<'NICHES' | 'PROFESSIONS' | 'PROMPTS'>('NICHES');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);

  // --- DATA STATE (Local Mock) ---
  const [data, setData] = useState<StrategyData>({
    niches: [],
    professions: {},
    prompts: {}
  });

  // --- CREATION STATE ---
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // --- PROMPT EDITOR STATE ---
  // Agora, ao invés de um modal, selecionamos um prompt da lista
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  
  // Estado local para edição (buffer)
  const [editBuffer, setEditBuffer] = useState<StrategyPrompt | null>(null);

  // --- HELPERS ---
  const getPromptKey = () => `${selectedNiche}::${selectedProfession}`;
  
  // Quando seleciona um prompt na lista, carrega no buffer
  useEffect(() => {
      if (selectedPromptId && selectedPromptId !== 'new') {
          const key = getPromptKey();
          const list = data.prompts[key] || [];
          const found = list.find(p => p.id === selectedPromptId);
          if (found) setEditBuffer({ ...found });
      } else if (selectedPromptId === 'new') {
          setEditBuffer({
              id: Date.now().toString(),
              title: 'Nova Abordagem',
              content: '',
              isActive: true,
              useVision: false,
              stats: { sent: 0, replied: 0, converted: 0 }
          });
      } else {
          setEditBuffer(null);
      }
  }, [selectedPromptId]);

  // --- ACTIONS: NAVIGATION ---
  const handleEnterNiche = (niche: string) => {
    setSelectedNiche(niche);
    setCurrentLevel('PROFESSIONS');
    setIsCreating(false);
  };

  const handleEnterProfession = (prof: string) => {
    setSelectedProfession(prof);
    setCurrentLevel('PROMPTS');
    setIsCreating(false);
    setSelectedPromptId(null); // Reset selection
  };

  const handleBack = () => {
    if (currentLevel === 'PROMPTS') {
      setCurrentLevel('PROFESSIONS');
      setSelectedProfession(null);
    } else if (currentLevel === 'PROFESSIONS') {
      setCurrentLevel('NICHES');
      setSelectedNiche(null);
    }
    setIsCreating(false);
    setSelectedPromptId(null);
  };

  // --- ACTIONS: STRUCTURE (Niche/Profession) ---
  const handleCreateStructure = () => {
    if (!newItemName.trim()) return;

    if (currentLevel === 'NICHES') {
      setData(prev => ({
        ...prev,
        niches: [...prev.niches, newItemName],
        professions: { ...prev.professions, [newItemName]: [] }
      }));
    } else if (currentLevel === 'PROFESSIONS' && selectedNiche) {
      const existing = data.professions[selectedNiche] || [];
      setData(prev => ({
        ...prev,
        professions: { ...prev.professions, [selectedNiche]: [...existing, newItemName] }
      }));
    }

    setNewItemName('');
    setIsCreating(false);
  };

  const handleDeleteStructure = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    if (!confirm(`Excluir "${item}" e todo seu conteúdo?`)) return;

    if (currentLevel === 'NICHES') {
        const newNiches = data.niches.filter(n => n !== item);
        const newProfs = { ...data.professions };
        delete newProfs[item];
        setData(prev => ({ ...prev, niches: newNiches, professions: newProfs }));
    } else if (currentLevel === 'PROFESSIONS' && selectedNiche) {
        const newProfsList = data.professions[selectedNiche].filter(p => p !== item);
        setData(prev => ({
            ...prev,
            professions: { ...prev.professions, [selectedNiche]: newProfsList }
        }));
    }
  };

  // --- ACTIONS: PROMPTS ---
  
  const handleSaveBuffer = () => {
      if (!editBuffer) return;
      
      const key = getPromptKey();
      const list = data.prompts[key] || [];
      
      // Check if updating or creating
      const isNew = selectedPromptId === 'new';
      
      let newList;
      if (isNew) {
          newList = [...list, editBuffer];
      } else {
          newList = list.map(p => p.id === editBuffer.id ? editBuffer : p);
      }
      
      setData(prev => ({
          ...prev,
          prompts: { ...prev.prompts, [key]: newList }
      }));
      
      // If was new, now select it properly
      if (isNew) {
          setSelectedPromptId(editBuffer.id);
      }
      
      // Visual feedback optional here
  };

  const handleDeletePrompt = (id: string) => {
      if (!confirm("Tem certeza que deseja excluir?")) return;
      const key = getPromptKey();
      const list = data.prompts[key] || [];
      setData(prev => ({
          ...prev,
          prompts: { ...prev.prompts, [key]: list.filter(p => p.id !== id) }
      }));
      if (selectedPromptId === id) setSelectedPromptId(null);
  };

  const handleTogglePromptStatus = (id: string, currentStatus: boolean) => {
      const key = getPromptKey();
      const list = data.prompts[key] || [];
      const updatedList = list.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p);
      
      setData(prev => ({
          ...prev,
          prompts: { ...prev.prompts, [key]: updatedList }
      }));
      
      // Update buffer if open
      if (editBuffer && editBuffer.id === id) {
          setEditBuffer({ ...editBuffer, isActive: !currentStatus });
      }
  };

  const copyVariable = (v: string) => {
      if (editBuffer) {
          setEditBuffer({ ...editBuffer, content: editBuffer.content + " " + v });
      }
  };

  const toggleVisionMode = () => {
      if (editBuffer) {
          setEditBuffer({ ...editBuffer, useVision: !editBuffer.useVision });
      }
  }

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      
      {/* HEADER & BREADCRUMBS */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4 shrink-0">
        {currentLevel !== 'NICHES' && (
            <button 
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-black" />
            </button>
        )}
        
        <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-6 h-6" />
                Abordagens & Estratégias
            </h2>
            <div className="flex items-center gap-2 text-sm mt-1">
                <span className={`font-medium ${currentLevel === 'NICHES' ? 'text-black' : 'text-gray-500'}`}>
                    Nichos
                </span>
                {selectedNiche && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className={`font-medium ${currentLevel === 'PROFESSIONS' ? 'text-black' : 'text-gray-500'}`}>
                            {selectedNiche}
                        </span>
                    </>
                )}
                {selectedProfession && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-black px-2 py-0.5 bg-gray-100 rounded">
                            {selectedProfession}
                        </span>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0">
          
          {/* LEVEL 1 & 2: GRID VIEW (NICHES & PROFESSIONS) */}
          {(currentLevel === 'NICHES' || currentLevel === 'PROFESSIONS') && (
            <div className="h-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                        {currentLevel === 'NICHES' && 'Seus Nichos de Atuação'}
                        {currentLevel === 'PROFESSIONS' && `Profissionais em ${selectedNiche}`}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(currentLevel === 'NICHES' ? data.niches : (selectedNiche ? data.professions[selectedNiche] : [])).map((item) => (
                            <div 
                                key={item}
                                onClick={() => currentLevel === 'NICHES' ? handleEnterNiche(item) : handleEnterProfession(item)}
                                className={`
                                    group relative bg-white border border-gray-200 rounded-xl p-6 
                                    flex flex-col items-center justify-center gap-4 text-center
                                    hover:shadow-lg hover:border-black transition-all cursor-pointer
                                    h-40 animate-in fade-in zoom-in-95 duration-200
                                `}
                            >
                                <div className="p-3 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                                    {currentLevel === 'NICHES' ? <Folder className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                </div>
                                <span className="font-bold text-gray-900 text-lg truncate w-full px-2">{item}</span>
                                
                                {currentLevel === 'NICHES' && (
                                    <span className="text-xs text-gray-400">
                                        {data.professions[item]?.length || 0} profissionais
                                    </span>
                                )}

                                <button 
                                    onClick={(e) => handleDeleteStructure(e, item)}
                                    className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* NEW ITEM CARD */}
                        {isCreating ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-4 h-40">
                                <input 
                                    autoFocus
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder={currentLevel === 'NICHES' ? "Nome do Nicho" : "Nome do Profissional"}
                                    className="w-full text-center bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2 focus:ring-2 focus:ring-black focus:outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateStructure()}
                                />
                                <div className="flex gap-2 w-full">
                                    <button onClick={() => setIsCreating(false)} className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded">
                                        Cancelar
                                    </button>
                                    <button onClick={handleCreateStructure} className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-gray-800 rounded">
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 h-40 hover:border-black hover:bg-gray-50 transition-all group text-gray-400 hover:text-black"
                            >
                                <div className="p-2 border-2 border-dashed border-current rounded-full">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-bold text-sm">
                                    {currentLevel === 'NICHES' ? 'Criar Nicho' : 'Criar Profissional'}
                                </span>
                            </button>
                        )}
                </div>
            </div>
          )}

          {/* LEVEL 3: SPLIT VIEW (LIST & EDITOR) */}
          {currentLevel === 'PROMPTS' && (
              <div className="flex h-full gap-6">
                  
                  {/* LEFT COLUMN: LIST */}
                  <div className="w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-900">Abordagens ({data.prompts[getPromptKey()]?.length || 0})</h3>
                          <button 
                            onClick={() => setSelectedPromptId('new')}
                            className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-1"
                          >
                              <Plus className="w-3 h-3" /> Nova
                          </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto">
                          {(data.prompts[getPromptKey()] || []).length === 0 && (
                              <div className="p-8 text-center text-gray-400 text-sm">
                                  Nenhum prompt criado para este profissional.
                              </div>
                          )}

                          {(data.prompts[getPromptKey()] || []).map(prompt => (
                              <div 
                                key={prompt.id}
                                onClick={() => setSelectedPromptId(prompt.id)}
                                className={`
                                    p-4 border-b border-gray-100 cursor-pointer transition-all group
                                    ${selectedPromptId === prompt.id ? 'bg-gray-100 border-l-4 border-l-black' : 'hover:bg-gray-50'}
                                `}
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <div className="flex items-center gap-2">
                                          <h4 className={`font-bold text-sm ${selectedPromptId === prompt.id ? 'text-black' : 'text-gray-700'}`}>
                                              {prompt.title}
                                          </h4>
                                          {prompt.useVision && <Camera className="w-3 h-3 text-purple-500" />}
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleTogglePromptStatus(prompt.id, prompt.isActive); }}
                                      >
                                          {prompt.isActive 
                                            ? <ToggleRight className="w-5 h-5 text-green-600" />
                                            : <ToggleLeft className="w-5 h-5 text-gray-300" />
                                          }
                                      </button>
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-2">{prompt.content}</p>
                                  <div className="mt-2 flex gap-2 text-[10px] text-gray-400 font-mono">
                                      <span>{prompt.stats?.sent || 0} envios</span>
                                      <span>•</span>
                                      <span>{prompt.stats?.converted || 0} vendas</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* RIGHT COLUMN: EDITOR */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
                      {editBuffer ? (
                          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
                                {/* Editor Header */}
                                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                    <input 
                                        type="text"
                                        value={editBuffer.title}
                                        onChange={(e) => setEditBuffer({ ...editBuffer, title: e.target.value })}
                                        placeholder="Nome da Estratégia (ex: Abordagem Formal)"
                                        className="bg-transparent font-bold text-lg text-gray-900 placeholder-gray-400 focus:outline-none w-full"
                                    />
                                    <div className="flex items-center gap-2">
                                        {selectedPromptId !== 'new' && (
                                            <button 
                                                onClick={() => handleDeletePrompt(editBuffer.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleSaveBuffer}
                                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800"
                                        >
                                            <Save className="w-4 h-4" /> Salvar
                                        </button>
                                    </div>
                                </div>

                                {/* Vision Mode Toggle (Config) */}
                                <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
                                    <button 
                                        onClick={toggleVisionMode}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                            editBuffer.useVision 
                                            ? 'bg-purple-50 text-purple-700 border-purple-200 ring-2 ring-purple-100' 
                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Camera className="w-4 h-4" />
                                        {editBuffer.useVision ? 'Vision Mode ATIVO' : 'Habilitar Vision Mode'}
                                        {editBuffer.useVision ? <ToggleRight className="w-4 h-4 ml-1"/> : <ToggleLeft className="w-4 h-4 ml-1"/>}
                                    </button>
                                    <span className="text-[10px] text-gray-400">
                                        {editBuffer.useVision 
                                            ? 'O robô irá "olhar" o print do site e personalizar o texto.' 
                                            : 'Envio apenas de texto.'}
                                    </span>
                                </div>

                                {/* Editor Body */}
                                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                                        Prompt de Sistema (Instruções para o Agente)
                                    </label>
                                    <textarea 
                                        value={editBuffer.content}
                                        onChange={(e) => setEditBuffer({ ...editBuffer, content: e.target.value })}
                                        className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-black focus:border-transparent outline-none mb-4"
                                        placeholder="Escreva aqui como o agente deve se comportar... Ex: Analise a imagem em anexo e faça uma crítica sobre o design."
                                    />

                                    {/* Smart Variables Helper */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2 text-blue-800">
                                            <Briefcase className="w-4 h-4" />
                                            <span className="font-bold text-xs uppercase">Variáveis Inteligentes</span>
                                        </div>
                                        <p className="text-xs text-blue-600 mb-3">
                                            Clique nas variáveis abaixo para adicioná-las ao prompt.
                                        </p>
                                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                            {/* Pseudo-Variable for Vision */}
                                            <button
                                                onClick={toggleVisionMode}
                                                className={`px-2 py-1 border rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                                                    editBuffer.useVision 
                                                    ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' 
                                                    : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                                                }`}
                                                title="Clique para ativar/desativar o envio de imagem"
                                            >
                                                <Camera className="w-3 h-3" />
                                                {'{📸 VISION_MODE}'}
                                            </button>

                                            {GLOBAL_VARIABLES.map(v => (
                                                <button
                                                    key={v.label}
                                                    onClick={() => copyVariable(v.label)}
                                                    className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-mono text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center gap-1 group"
                                                    title={v.desc}
                                                >
                                                    {v.label}
                                                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                          </div>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                              <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
                              <p className="font-medium">Selecione uma abordagem ao lado para editar</p>
                              <p className="text-sm">ou crie uma nova</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>

    </div>
  );
};

export default Strategies;
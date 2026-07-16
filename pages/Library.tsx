import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, MessageSquare, Plus, Search, Filter, 
  MoreVertical, Copy, Trash2, Edit3, Sparkles, 
  Send, Bot, User, X, Check, AlertCircle, Loader2,
  Type, Mic, Image as ImageIcon, Video, Clock, 
  Split, Shuffle, Sun, Link as LinkIcon, Zap, MessageCircle,
  Layers, Box, Workflow
} from 'lucide-react';
import { DatabaseService } from '../services/databaseService';
import { generateBlockFromDescription } from '../services/geminiService';
import { Block, BlockType, MessageTemplate, Flow } from '../types';

type Tab = 'flows' | 'messages' | 'pieces';
type PieceCategory = 'all' | 'text' | 'audio' | 'media' | 'interactive' | 'info';
type ViewMode = 'list' | 'editor';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('flows');
  const [activePieceCategory, setActivePieceCategory] = useState<PieceCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingBlock, setEditingBlock] = useState<Partial<Block> | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Assistant State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai', content: string, block?: any }[]>([
    { role: 'ai', content: 'Olá! Eu sou seu arquiteto de automação. Posso te ajudar a criar Peças (blocos), Mensagens (balões) ou Fluxos (sequências) completos. O que vamos construir hoje?' }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, t, f] = await Promise.all([
        DatabaseService.getBlocks(),
        DatabaseService.getMessageTemplates(),
        DatabaseService.getFlows()
      ]);
      setBlocks(b);
      setTemplates(t);
      setFlows(f);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiThinking) return;

    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiThinking(true);

    try {
      const generatedBlock = await generateBlockFromDescription(userMsg);
      setAiMessages(prev => [...prev, { 
        role: 'ai', 
        content: `Entendido! Gere a estrutura para "${generatedBlock.name}". O que acha dessa configuração?`,
        block: generatedBlock
      }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', content: 'Desculpe, tive um erro ao processar sua ideia. Pode tentar de novo?' }]);
    }
    setIsAiThinking(false);
  };

  const saveGeneratedBlock = async (blockData: any) => {
    // Determine type based on generated data
    if (blockData.steps) {
        // It's a flow
        const newFlow: Flow = {
            id: crypto.randomUUID(),
            name: blockData.name || 'Novo Fluxo',
            description: blockData.description,
            steps: blockData.steps,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await DatabaseService.saveFlow(newFlow);
        setFlows(prev => [newFlow, ...prev]);
        setAiMessages(prev => [...prev, { role: 'ai', content: `Fluxo "${newFlow.name}" salvo com sucesso!` }]);
    } else if (blockData.blockIds) {
        // It's a message template
        const newTemplate: MessageTemplate = {
            id: crypto.randomUUID(),
            name: blockData.name || 'Nova Mensagem',
            description: blockData.description,
            blockIds: blockData.blockIds,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await DatabaseService.saveMessageTemplate(newTemplate);
        setTemplates(prev => [newTemplate, ...prev]);
        setAiMessages(prev => [...prev, { role: 'ai', content: `Mensagem "${newTemplate.name}" salva com sucesso!` }]);
    } else {
        // It's a piece (block)
        const newBlock: Block = {
          id: crypto.randomUUID(),
          name: blockData.name || 'Nova Peça',
          type: blockData.type as BlockType,
          content: blockData.content || {},
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await DatabaseService.saveBlock(newBlock);
        setBlocks(prev => [newBlock, ...prev]);
        setAiMessages(prev => [...prev, { role: 'ai', content: `Peça "${newBlock.name}" salva com sucesso!` }]);
    }
  };

  const deleteItem = async (id: string, type: Tab) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    if (type === 'pieces') {
        await DatabaseService.deleteBlock(id);
        setBlocks(prev => prev.filter(b => b.id !== id));
    } else if (type === 'messages') {
        await DatabaseService.deleteMessageTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
        await DatabaseService.deleteFlow(id);
        setFlows(prev => prev.filter(f => f.id !== id));
    }
  };

  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case BlockType.TEXT_LITERAL: return <Type className="w-4 h-4" />;
      case BlockType.AUDIO_UPLOAD: return <Mic className="w-4 h-4" />;
      case BlockType.IMAGE_UPLOAD: return <ImageIcon className="w-4 h-4" />;
      case BlockType.VIDEO_UPLOAD: return <Video className="w-4 h-4" />;
      case BlockType.DELAY: return <Clock className="w-4 h-4" />;
      case BlockType.CONDITIONAL: return <Split className="w-4 h-4" />;
      case BlockType.RANDOMIZER: return <Shuffle className="w-4 h-4" />;
      case BlockType.GREETING: return <Sun className="w-4 h-4" />;
      case BlockType.TRACKABLE_LINK: return <LinkIcon className="w-4 h-4" />;
      case BlockType.TEXT_IA:
      case BlockType.TEXT_IA_CONTEXT: return <Sparkles className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const renderEditor = () => {
    if (!editingBlock) return null;

    const categories = [
      { id: 'text', label: 'Texto', types: [BlockType.TEXT_LITERAL, BlockType.TEXT_VARIABLE, BlockType.TEXT_IA, BlockType.TEXT_IA_CONTEXT], icon: <Type /> },
      { id: 'audio', label: 'Áudio', types: [BlockType.AUDIO_UPLOAD, BlockType.AUDIO_IA_TTS, BlockType.AUDIO_IA_CLONE], icon: <Mic /> },
      { id: 'media', label: 'Mídia', types: [BlockType.IMAGE_UPLOAD, BlockType.IMAGE_IA, BlockType.VIDEO_UPLOAD, BlockType.DOCUMENT_UPLOAD, BlockType.STICKER_UPLOAD], icon: <ImageIcon /> },
      { id: 'behavior', label: 'Comportamento', types: [BlockType.DELAY, BlockType.TYPING_SIMULATION, BlockType.RECORDING_SIMULATION, BlockType.GREETING], icon: <Clock /> },
      { id: 'interactive', label: 'Interativo', types: [BlockType.BUTTONS, BlockType.LIST, BlockType.POLL, BlockType.CATALOG], icon: <Zap /> },
      { id: 'logic', label: 'Lógica', types: [BlockType.CONDITIONAL, BlockType.RANDOMIZER, BlockType.RESPONSE_CAPTURE], icon: <Split /> },
    ];

    const handleSave = async () => {
      if (!editingBlock.name) {
        alert('Por favor, dê um nome para a peça.');
        return;
      }
      
      const blockToSave: Block = {
        id: editingBlock.id || crypto.randomUUID(),
        name: editingBlock.name!,
        type: editingBlock.type || BlockType.TEXT_LITERAL,
        content: editingBlock.content || {},
        createdAt: editingBlock.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await DatabaseService.saveBlock(blockToSave);
      await loadData();
      setViewMode('list');
      setEditingBlock(null);
    };

    return (
      <div className="h-full flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-300">
        {/* Editor Header */}
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('list')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="h-8 w-px bg-gray-100" />
            <input 
              type="text" 
              value={editingBlock.name}
              onChange={(e) => setEditingBlock(prev => ({ ...prev!, name: e.target.value }))}
              placeholder="Nome da Peça (ex: Saudação Inicial)"
              className="text-lg font-bold text-gray-900 focus:outline-none bg-transparent placeholder:text-gray-300"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setViewMode('list')}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Peça</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Type Selector */}
          <div className="w-64 bg-white border-r border-gray-100 overflow-y-auto p-4 space-y-6">
            {categories.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center space-x-2 px-3 mb-3">
                  <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg">
                    {React.cloneElement(cat.icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{cat.label}</span>
                </div>
                <div className="space-y-1">
                  {cat.types.map(type => (
                    <button
                      key={type}
                      onClick={() => setEditingBlock(prev => ({ ...prev!, type }))}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        editingBlock.type === type 
                          ? 'bg-black text-white shadow-md shadow-black/10' 
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${editingBlock.type === type ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {React.cloneElement(getBlockIcon(type) as React.ReactElement, { className: 'w-3.5 h-3.5' })}
                      </div>
                      <span className="font-medium truncate">{type.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Center: Configuration Form */}
          <div className="flex-1 overflow-y-auto p-12 bg-white">
            <div className="max-w-2xl mx-auto">
              <div className="mb-10">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-gray-100 text-gray-900 rounded-2xl">
                    {getBlockIcon(editingBlock.type || BlockType.TEXT_LITERAL)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{editingBlock.type?.replace('_', ' ')}</h3>
                    <p className="text-gray-500">Configure os detalhes desta peça de conteúdo.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Dynamic Form Fields based on Type */}
                {(editingBlock.type === BlockType.TEXT_LITERAL || editingBlock.type === BlockType.TEXT_VARIABLE) && (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Conteúdo do Texto</label>
                    <textarea 
                      value={editingBlock.content?.text || ''}
                      onChange={(e) => setEditingBlock(prev => ({ ...prev!, content: { ...prev!.content, text: e.target.value } }))}
                      placeholder="Escreva sua mensagem aqui... Use {{nome}} para personalizar."
                      className="w-full h-48 p-6 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-black/5 text-lg leading-relaxed resize-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['nome', 'empresa', 'cargo', 'site'].map(tag => (
                        <button 
                          key={tag}
                          onClick={() => {
                            const text = editingBlock.content?.text || '';
                            setEditingBlock(prev => ({ ...prev!, content: { ...prev!.content, text: text + ` {{${tag}}}` } }));
                          }}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(editingBlock.type === BlockType.AUDIO_UPLOAD || editingBlock.type === BlockType.IMAGE_UPLOAD || editingBlock.type === BlockType.VIDEO_UPLOAD) && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Origem do Arquivo</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 border-2 border-black rounded-2xl bg-black text-white flex flex-col items-center space-y-2">
                          <Plus className="w-6 h-6" />
                          <span className="font-bold">Fazer Upload</span>
                        </button>
                        <button className="p-4 border-2 border-gray-100 rounded-2xl text-gray-400 flex flex-col items-center space-y-2 hover:border-gray-200">
                          <LinkIcon className="w-6 h-6" />
                          <span className="font-bold">URL Externa</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <Plus className="w-8 h-8 text-gray-300" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Arraste seu arquivo aqui</p>
                        <p className="text-sm text-gray-400">Ou clique para selecionar do seu computador</p>
                      </div>
                    </div>

                    {editingBlock.type === BlockType.AUDIO_UPLOAD && (
                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center space-x-3">
                          <Mic className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-bold text-emerald-900">Simular Gravação</p>
                            <p className="text-xs text-emerald-600">Mostra "gravando áudio..." no WhatsApp</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={editingBlock.content?.simulateRecording}
                          onChange={(e) => setEditingBlock(prev => ({ ...prev!, content: { ...prev!.content, simulateRecording: e.target.checked } }))}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </div>
                    )}
                  </div>
                )}

                {editingBlock.type === BlockType.DELAY && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Tempo de Espera</label>
                      <div className="flex items-center space-x-4">
                        <input 
                          type="number" 
                          value={editingBlock.content?.seconds || 5}
                          onChange={(e) => setEditingBlock(prev => ({ ...prev!, content: { ...prev!.content, seconds: parseInt(e.target.value) } }))}
                          className="w-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                        <span className="text-xl font-bold text-gray-400 uppercase">Segundos</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <Type className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">Simular Digitando</p>
                          <p className="text-xs text-gray-500">Mostra "digitando..." durante a espera</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={editingBlock.content?.simulateTyping}
                        onChange={(e) => setEditingBlock(prev => ({ ...prev!, content: { ...prev!.content, simulateTyping: e.target.checked } }))}
                        className="w-5 h-5 accent-black"
                      />
                    </div>
                  </div>
                )}

                {(editingBlock.type === BlockType.TEXT_IA || editingBlock.type === BlockType.TEXT_IA_CONTEXT) && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Comando para a IA (Prompt)</label>
                      <textarea 
                        value={editingBlock.content?.prompt || ''}
                        onChange={(e) => setEditingBlock(prev => ({ ...prev!, content: { ...prev!.content, prompt: e.target.value } }))}
                        placeholder="Ex: Escreva uma abordagem curta e curiosa para um dono de clínica odontológica..."
                        className="w-full h-48 p-6 bg-indigo-50/30 border border-indigo-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-lg leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="text-sm font-bold text-indigo-900">Injetar Dossiê do Lead</p>
                          <p className="text-xs text-indigo-600">A IA lerá os dados do lead antes de escrever</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={editingBlock.content?.injectDossier}
                        onChange={(e) => setEditingBlock(prev => ({ ...prev!, content: { ...prev!.content, injectDossier: e.target.checked } }))}
                        className="w-5 h-5 accent-indigo-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Mobile Preview */}
          <div className="w-80 bg-gray-50/50 border-l border-gray-100 p-8 flex flex-col items-center">
            <div className="sticky top-8 w-full">
              <div className="flex items-center justify-center mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Preview WhatsApp</span>
              </div>
              
              {/* iPhone Frame Mockup */}
              <div className="w-full aspect-[9/19] bg-white rounded-[3rem] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10" />
                
                {/* WhatsApp Header */}
                <div className="h-16 bg-[#075E54] pt-6 px-4 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full" />
                  <div className="flex-1">
                    <p className="text-white text-[10px] font-bold">Lead Teste</p>
                    <p className="text-white/70 text-[8px]">online</p>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-[#E5DDD5] p-3 space-y-2 overflow-y-auto">
                  <div className="max-w-[85%] bg-white p-2 rounded-lg rounded-tl-none shadow-sm relative">
                    {editingBlock.type === BlockType.TEXT_LITERAL || editingBlock.type === BlockType.TEXT_VARIABLE ? (
                      <p className="text-[10px] text-gray-800 whitespace-pre-wrap">
                        {(editingBlock.content?.text || 'Sua mensagem aparecerá aqui...').replace('{{nome}}', 'João')}
                      </p>
                    ) : editingBlock.type === BlockType.AUDIO_UPLOAD ? (
                      <div className="flex items-center space-x-2">
                        <Mic className="w-4 h-4 text-emerald-500" />
                        <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[8px] text-gray-400">0:15</span>
                      </div>
                    ) : editingBlock.type === BlockType.IMAGE_UPLOAD ? (
                      <div className="w-full aspect-video bg-gray-100 rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 italic text-gray-400 text-[10px]">
                        <Sparkles className="w-3 h-3" />
                        <span>Conteúdo dinâmico...</span>
                      </div>
                    )}
                    <span className="block text-[6px] text-gray-400 text-right mt-1">12:45</span>
                  </div>
                </div>

                {/* Input Area */}
                <div className="h-12 bg-gray-50 border-t border-gray-200 px-3 flex items-center space-x-2">
                  <div className="flex-1 h-8 bg-white rounded-full border border-gray-200" />
                  <div className="w-8 h-8 bg-[#128C7E] rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 relative">
      {viewMode === 'editor' ? renderEditor() : (
        <>
          {/* Header & Horizontal Submenu */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Biblioteca</h1>
          <p className="text-gray-500 mt-1">Gerencie suas Peças, Mensagens e Fluxos estratégicos.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('flows')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'flows' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <Workflow className="w-4 h-4" />
              <span>Fluxos</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'messages' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Mensagens</span>
            </button>
            <button
              onClick={() => setActiveTab('pieces')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pieces' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Peças</span>
            </button>
          </div>

          <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isAiOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Assistente IA</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* Grid Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={`Buscar ${activeTab === 'flows' ? 'fluxos' : activeTab === 'messages' ? 'mensagens' : 'peças'}...`}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
              </button>
              <button 
                onClick={() => {
                  if (activeTab === 'pieces') {
                    setEditingBlock({
                      id: crypto.randomUUID(),
                      name: '',
                      type: BlockType.TEXT_LITERAL,
                      content: { text: '' }
                    });
                    setViewMode('editor');
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">
                    {activeTab === 'flows' ? 'Criar Fluxo' : activeTab === 'messages' ? 'Nova Mensagem' : 'Nova Peça'}
                </span>
              </button>
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'pieces' && (
              <div className="flex items-center space-x-6 mb-8 border-b border-gray-50 pb-4">
                {[
                  { id: 'all', label: 'Todas as Peças', icon: <Box className="w-4 h-4" /> },
                  { id: 'text', label: 'Texto', icon: <Type className="w-4 h-4" /> },
                  { id: 'audio', label: 'Áudio', icon: <Mic className="w-4 h-4" /> },
                  { id: 'media', label: 'Mídia', icon: <ImageIcon className="w-4 h-4" /> },
                  { id: 'interactive', label: 'Interativo', icon: <Zap className="w-4 h-4" /> },
                  { id: 'info', label: 'Informação', icon: <AlertCircle className="w-4 h-4" /> },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActivePieceCategory(cat.id as PieceCategory)}
                    className={`flex items-center space-x-2 pb-2 px-1 border-b-2 transition-all text-sm font-medium ${
                      activePieceCategory === cat.id 
                        ? 'border-black text-black' 
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-200 animate-spin" />
              </div>
            ) : (activeTab === 'pieces' 
                  ? blocks.filter(b => {
                      if (activePieceCategory === 'all') return true;
                      if (activePieceCategory === 'text') return b.type.startsWith('TEXT');
                      if (activePieceCategory === 'audio') return b.type.startsWith('AUDIO');
                      if (activePieceCategory === 'media') return b.type.includes('IMAGE') || b.type.includes('VIDEO') || b.type.includes('DOCUMENT') || b.type.includes('STICKER');
                      if (activePieceCategory === 'interactive') return b.type === BlockType.BUTTONS || b.type === BlockType.LIST || b.type === BlockType.POLL || b.type === BlockType.CATALOG;
                      if (activePieceCategory === 'info') return b.type === BlockType.VCARD || b.type === BlockType.LOCATION || b.type === BlockType.REACTION;
                      return true;
                    }) 
                  : activeTab === 'messages' ? templates : flows).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                  {activeTab === 'pieces' ? (
                    <Box className="w-8 h-8 text-gray-300" />
                  ) : activeTab === 'messages' ? (
                    <MessageCircle className="w-8 h-8 text-gray-300" />
                  ) : (
                    <Workflow className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Nenhum {activeTab === 'pieces' ? 'item' : activeTab === 'messages' ? 'modelo' : 'fluxo'} encontrado
                </h3>
                <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                  Use o Assistente IA ou o botão de criação para começar a popular sua biblioteca.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === 'pieces' ? (
                  blocks.filter(b => {
                    if (activePieceCategory === 'all') return true;
                    if (activePieceCategory === 'text') return b.type.startsWith('TEXT');
                    if (activePieceCategory === 'audio') return b.type.startsWith('AUDIO');
                    if (activePieceCategory === 'media') return b.type.includes('IMAGE') || b.type.includes('VIDEO') || b.type.includes('DOCUMENT') || b.type.includes('STICKER');
                    if (activePieceCategory === 'interactive') return b.type === BlockType.BUTTONS || b.type === BlockType.LIST || b.type === BlockType.POLL || b.type === BlockType.CATALOG;
                    if (activePieceCategory === 'info') return b.type === BlockType.VCARD || b.type === BlockType.LOCATION || b.type === BlockType.REACTION;
                    return true;
                  }).map(block => (
                    <div key={block.id} className="group p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-md transition-all relative cursor-pointer" onClick={() => {
                      setEditingBlock(block);
                      setViewMode('editor');
                    }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${block.type.includes('IA') ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-600'}`}>
                          {getBlockIcon(block.type)}
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-md"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteItem(block.id, 'pieces')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 truncate">{block.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">{block.type.replace('_', ' ')}</p>
                    </div>
                  ))
                ) : activeTab === 'messages' ? (
                  templates.map(template => (
                    <div key={template.id} className="group p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-md transition-all relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteItem(template.id, 'messages')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{template.blockIds.length} Peças (Balão Único)</p>
                    </div>
                  ))
                ) : (
                  flows.map(flow => (
                    <div key={flow.id} className="group p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-md transition-all relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Workflow className="w-4 h-4" />
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteItem(flow.id, 'flows')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900">{flow.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{flow.steps.length} Passos (Sequência)</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Piece Modal - Removed in favor of Studio Editor */}

      {/* AI Assistant Sidebar */}
        {isAiOpen && (
          <div className="w-80 bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Arquiteto IA</span>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="p-1 text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                    
                    {msg.block && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-xs uppercase text-gray-400">Estrutura Gerada</span>
                        </div>
                        <pre className="text-[10px] bg-gray-50 p-2 rounded overflow-x-auto font-mono mb-3">
                          {JSON.stringify(msg.block, null, 2)}
                        </pre>
                        <button 
                          onClick={() => saveGeneratedBlock(msg.block)}
                          className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Check className="w-3 h-3" />
                          <span>Salvar na Biblioteca</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAiSubmit} className="p-4 border-t border-gray-100">
              <div className="relative">
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Descreva o que quer criar..."
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!aiInput.trim() || isAiThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                Ex: "Cria um fluxo de boas-vindas com áudio e delay"
              </p>
            </form>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default Library;

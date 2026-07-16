
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square, ListTodo, AlertCircle, Loader2 } from 'lucide-react';
import { DatabaseService } from '../services/databaseService';

interface Task {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

const Checklist: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load from DB on mount
    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const data = await DatabaseService.getChecklistItems();
            setTasks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTask = async () => {
        if (!inputValue.trim()) return;
        
        const text = inputValue;
        setInputValue(''); // Clear immediate input for UX
        
        try {
            const newTask = await DatabaseService.addChecklistItem(text);
            setTasks([newTask, ...tasks]);
        } catch (e) {
            alert("Erro ao salvar tarefa.");
            setInputValue(text); // Restore if failed
        }
    };

    const toggleTask = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
        
        try {
            await DatabaseService.updateChecklistItem(id, !currentStatus);
        } catch (e) {
            // Revert on error
            setTasks(tasks.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
            console.error("Failed to toggle task", e);
        }
    };

    const deleteTask = async (id: string) => {
        // Optimistic update
        const backup = [...tasks];
        setTasks(tasks.filter(t => t.id !== id));
        
        try {
            await DatabaseService.deleteChecklistItem(id);
        } catch (e) {
            setTasks(backup); // Revert
            alert("Erro ao deletar tarefa.");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddTask();
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="border-b border-gray-200 pb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ListTodo className="w-6 h-6" /> Checklist de Ideias
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">Organize suas ideias e tarefas (Sincronizado na Nuvem).</p>
                </div>
                <div className="text-right">
                     <span className="text-3xl font-bold text-gray-900">{progress}%</span>
                     <p className="text-xs text-gray-500 font-medium">Concluído</p>
                </div>
            </header>

            {/* PROGRESS BAR */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                    className="bg-black h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* INPUT AREA */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 focus-within:ring-2 focus-within:ring-black/10 transition-all">
                <div className="pl-3 text-gray-400">
                    <Plus className="w-5 h-5" />
                </div>
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva uma nova ideia e aperte Enter..." 
                    className="flex-1 py-3 px-2 outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                    autoFocus
                />
                <button 
                    onClick={handleAddTask}
                    disabled={!inputValue.trim()}
                    className="bg-black text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                    Adicionar
                </button>
            </div>

            {/* TASKS LIST */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>
                        Carregando...
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                        <ListTodo className="w-12 h-12 opacity-20 mb-3" />
                        <p>Sua lista está vazia. Adicione uma ideia acima!</p>
                    </div>
                ) : (
                    <>
                        {/* PENDING TASKS */}
                        <div className="space-y-2">
                            {tasks.filter(t => !t.completed).map(task => (
                                <div key={task.id} className="group flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-top-1">
                                    <button onClick={() => toggleTask(task.id, task.completed)} className="text-gray-300 hover:text-black transition-colors">
                                        <Square className="w-5 h-5" />
                                    </button>
                                    <span className="flex-1 text-gray-900 font-medium">{task.text}</span>
                                    <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* COMPLETED TASKS */}
                        {completedCount > 0 && (
                            <div className="pt-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Concluídos ({completedCount})</h3>
                                <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                                    {tasks.filter(t => t.completed).map(task => (
                                        <div key={task.id} className="group flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                            <button onClick={() => toggleTask(task.id, task.completed)} className="text-green-500">
                                                <CheckSquare className="w-5 h-5" />
                                            </button>
                                            <span className="flex-1 text-gray-500 line-through decoration-gray-300">{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Checklist;

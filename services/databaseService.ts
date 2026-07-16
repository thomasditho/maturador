
import { supabase } from './supabase';
import { AgentConfig, AgentPrompt, Lead, SafetyConfig, SystemSettings, ChatSession, Message, GlobalPrompt, Product, KnowledgeItem, LeadStatus } from '../types';

export const DatabaseService = {
    
    // --- SETTINGS ---
    async loadSystemSettings(): Promise<{ settings: SystemSettings, safety: SafetyConfig } | null> {
        try {
            const { data, error } = await supabase.from('system_settings').select('*').single();
            if (error || !data) return null;

            return {
                settings: {
                    evolutionApiUrl: data.evolution_api_url,
                    evolutionApiKey: data.evolution_api_key,
                    webhookUrl: data.webhook_url,
                    rabbitmqEnabled: false,
                    costPerChip: data.financial_chip_cost || 0,
                    costPerMsg: data.financial_msg_cost || 0
                },
                safety: {
                    minDelay: data.safety_min_delay,
                    maxDelay: data.safety_max_delay,
                    warmupEnabled: data.safety_warmup_enabled,
                    warmupStartCount: data.safety_warmup_start,
                    warmupIncrement: data.safety_warmup_inc,
                    jitterPattern: 'random'
                }
            };
        } catch (e) {
            console.error("Critical DB Error: loadSystemSettings", e);
            return null;
        }
    },

    async saveSystemSettings(settings: SystemSettings, safety: SafetyConfig) {
        try {
            return await supabase.from('system_settings').upsert({
                id: 1,
                evolution_api_url: settings.evolutionApiUrl,
                evolution_api_key: settings.evolutionApiKey,
                webhook_url: settings.webhookUrl,
                safety_min_delay: safety.minDelay,
                safety_max_delay: safety.maxDelay,
                safety_warmup_enabled: safety.warmupEnabled,
                safety_warmup_start: safety.warmupStartCount,
                safety_warmup_inc: safety.warmupIncrement,
                financial_chip_cost: settings.costPerChip,
                financial_msg_cost: settings.costPerMsg
            });
        } catch (e) {
            console.error("Critical DB Error: saveSystemSettings", e);
        }
    },

    // --- DASHBOARD STATS ---
    async getDailyStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const { data: msgsToday } = await supabase
                .from('chat_messages')
                .select('created_at, sender')
                .eq('sender', 'agent')
                .gte('created_at', todayISO);

            const { data: sessionsToday } = await supabase
                .from('chat_sessions')
                .select('instance_id, last_message_at, unread_count')
                .gte('last_message_at', todayISO);

            const { count: totalLeadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            const { count: sentLeadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'SENT');

            const { count: totalSessions } = await supabase
                .from('chat_sessions')
                .select('*', { count: 'exact', head: true });

            return {
                msgsToday: msgsToday || [],
                sessionsToday: sessionsToday || [],
                totalHistorySent: sentLeadsCount || 0,
                totalLeads: totalLeadsCount || 0,
                totalConversations: totalSessions || 0
            };
        } catch (e) {
            return { msgsToday: [], sessionsToday: [], totalHistorySent: 0, totalLeads: 0, totalConversations: 0 };
        }
    },

    async getAllLeadsGlobal(): Promise<{name: string, phone: string}[]> {
        try {
            const { data } = await supabase.from('leads').select('name, phone').limit(10000);
            return data || [];
        } catch (e) {
            return [];
        }
    },

    // --- RESCUE & MIGRATION (MASTER BACKUP) ---
    async generateMasterBackup(): Promise<any> {
        try {
            const [
                { data: settings },
                { data: agents },
                { data: prompts },
                { data: leads },
                { data: sessions },
                { data: messages },
                { data: checklist }
            ] = await Promise.all([
                supabase.from('system_settings').select('*'),
                supabase.from('agents').select('*'),
                supabase.from('agent_prompts').select('*'),
                supabase.from('leads').select('*'),
                supabase.from('chat_sessions').select('*'),
                supabase.from('chat_messages').select('*'),
                supabase.from('checklist_items').select('*')
            ]);

            return {
                version: "2.0-RESCUE",
                timestamp: new Date().toISOString(),
                data: {
                    settings: settings || [],
                    agents: agents || [],
                    prompts: prompts || [],
                    leads: leads || [],
                    sessions: sessions || [],
                    messages: messages || [],
                    checklist: checklist || []
                }
            };
        } catch (e) {
            console.error("Master Backup Failed", e);
            throw e;
        }
    },

    async restoreMasterBackup(backup: any, onProgress?: (msg: string) => void): Promise<void> {
        const { data } = backup;
        if (!data) throw new Error("Backup inválido: campo 'data' não encontrado.");

        try {
            if (data.settings?.length > 0) {
                onProgress?.("Restaurando configurações globais...");
                const { error } = await supabase.from('system_settings').upsert(data.settings);
                if (error) throw new Error(`Falha em system_settings: ${error.message}`);
            }

            if (data.agents?.length > 0) {
                onProgress?.(`Injetando ${data.agents.length} agentes...`);
                const { error } = await supabase.from('agents').upsert(data.agents);
                if (error) throw new Error(`Falha em agents: ${error.message}`);
            }

            if (data.prompts?.length > 0) {
                onProgress?.(`Injetando ${data.prompts.length} prompts de agentes...`);
                const { error } = await supabase.from('agent_prompts').upsert(data.prompts);
                if (error) throw new Error(`Falha em agent_prompts: ${error.message}`);
            }

            if (data.leads && data.leads.length > 0) {
                const total = data.leads.length;
                onProgress?.(`Iniciando injeção de ${total} leads em lotes...`);
                for (let i = 0; i < total; i += 100) {
                    const batch = data.leads.slice(i, i + 100);
                    onProgress?.(`Leads: ${i}/${total}...`);
                    const { error } = await supabase.from('leads').upsert(batch);
                    if (error) throw new Error(`Falha no lote de Leads em ${i}: ${error.message}`);
                }
            } else {
                onProgress?.("AVISO: Lista de leads vazia no backup. Sessões ficarão órfãs.");
            }

            if (data.sessions?.length > 0) {
                onProgress?.(`Injetando ${data.sessions.length} sessões de chat...`);
                const { error } = await supabase.from('chat_sessions').upsert(data.sessions);
                if (error) {
                    console.error("Erro detalhado nas sessões:", error);
                    throw new Error(`Falha em chat_sessions: ${error.message}. Isso geralmente ocorre por falta de leads correspondentes.`);
                }
            }

            if (data.messages?.length > 0) {
                const total = data.messages.length;
                onProgress?.(`Injetando ${total} mensagens históricas...`);
                for (let i = 0; i < total; i += 200) {
                    const batch = data.messages.slice(i, i + 200);
                    onProgress?.(`Mensagens: ${i}/${total}...`);
                    const { error } = await supabase.from('chat_messages').upsert(batch);
                    if (error) throw new Error(`Falha no lote de Mensagens em ${i}: ${error.message}`);
                }
            }

            if (data.checklist?.length > 0) {
                onProgress?.("Restaurando checklist de tarefas...");
                await supabase.from('checklist_items').upsert(data.checklist);
            }

            onProgress?.("SISTEMA RESTAURADO COM SUCESSO!");
        } catch (e: any) {
            console.error("ERRO CRÍTICO NA RESTAURAÇÃO:", e);
            throw new Error(e.message || "Erro desconhecido na injeção.");
        }
    },

    // --- AGENTS ---
    async getAgents(): Promise<AgentConfig[]> {
        try {
            const { data: agents, error } = await supabase.from('agents').select('*, agent_prompts (*)');
            if (error) throw error;
            return agents.map((a: any) => ({
                id: a.id,
                name: a.name,
                model: a.model,
                temperature: a.temperature,
                tone: a.tone,
                connectedInstanceId: a.connected_instance_id,
                connectedInstanceIds: a.connected_instance_ids || [],
                instanceLimits: a.instance_limits || {},
                prompts: (a.agent_prompts || []).map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    content: p.content,
                    isActive: p.is_active,
                    type: p.type || 'AI'
                })),
                leads: [],
                knowledgeBase: []
            }));
        } catch (e) {
            console.error("DB Error: getAgents", e);
            return [];
        }
    },

    async createAgent(agent: any): Promise<AgentConfig> {
        const { data, error } = await supabase.from('agents').insert({
            name: agent.name,
            model: 'gemini-3-flash-preview',
            temperature: 0.7
        }).select().single();
        if (error) throw error;
        
        if (agent.prompts && agent.prompts.length > 0) {
            await supabase.from('agent_prompts').insert(
                agent.prompts.map((p: any) => ({
                    agent_id: data.id,
                    title: p.title,
                    content: p.content,
                    is_active: p.isActive,
                    type: p.type || 'AI'
                }))
            );
        }
        
        return {
            id: data.id,
            name: data.name,
            model: data.model,
            temperature: data.temperature,
            connectedInstanceId: data.connected_instance_id,
            connectedInstanceIds: [],
            instanceLimits: {},
            prompts: agent.prompts || [],
            leads: [],
            knowledgeBase: []
        };
    },

    async updateAgent(agentId: string, updates: Partial<AgentConfig>) {
        try {
            const payload: any = {};
            if (updates.name !== undefined) payload.name = updates.name;
            if (updates.connectedInstanceId !== undefined) payload.connected_instance_id = updates.connectedInstanceId;
            if (updates.connectedInstanceIds !== undefined) payload.connected_instance_ids = updates.connectedInstanceIds;
            if (updates.instanceLimits !== undefined) payload.instance_limits = updates.instanceLimits;
            if (updates.tone !== undefined) payload.tone = updates.tone;
            if (updates.model !== undefined) payload.model = updates.model;
            if (updates.temperature !== undefined) payload.temperature = updates.temperature;

            await supabase.from('agents').update(payload).eq('id', agentId);
        } catch (e) {}
    },

    // --- AGENT PROMPTS ---
    async addPrompt(agentId: string, prompt: any): Promise<any> {
        const { data, error } = await supabase.from('agent_prompts').insert({
            agent_id: agentId,
            title: prompt.title,
            content: prompt.content,
            is_active: prompt.isActive,
            type: prompt.type || 'AI'
        }).select().single();
        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            content: data.content,
            is_active: data.is_active,
            type: data.type
        };
    },

    async updatePrompt(promptId: string, updates: any) {
        await supabase.from('agent_prompts').update({
            title: updates.title,
            content: updates.content,
            is_active: updates.isActive,
            type: updates.type
        }).eq('id', promptId);
    },

    async deletePrompt(promptId: string) {
        await supabase.from('agent_prompts').delete().eq('id', promptId);
    },

    // --- LEADS ---
    async getLeads(
        agentId: string,
        filters?: {
            status?: string;
            dateFilter?: string;
            startDate?: string;
            endDate?: string;
        },
        page?: number,
        limit?: number,
        excludePrintBase64 = true
    ): Promise<{ leads: Lead[]; totalCount: number } | null> {
        try {
            let query = supabase
                .from('leads')
                .select('id, name, phone, status, data, created_at', { count: 'exact' })
                .eq('agent_id', agentId);

            if (filters?.status && filters.status !== 'ALL') {
                query = query.eq('status', filters.status);
            }

            if (filters?.dateFilter && filters.dateFilter !== 'ALL') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (filters.dateFilter === 'TODAY') {
                    query = query.gte('created_at', today.toISOString());
                } else if (filters.dateFilter === 'YESTERDAY') {
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const endOfYesterday = new Date(today);
                    endOfYesterday.setMilliseconds(-1);
                    query = query
                        .gte('created_at', yesterday.toISOString())
                        .lte('created_at', endOfYesterday.toISOString());
                } else if (filters.dateFilter === 'CUSTOM') {
                    if (filters.startDate) {
                        const start = new Date(filters.startDate);
                        start.setHours(0, 0, 0, 0);
                        query = query.gte('created_at', start.toISOString());
                    }
                    if (filters.endDate) {
                        const end = new Date(filters.endDate);
                        end.setHours(23, 59, 59, 999);
                        query = query.lte('created_at', end.toISOString());
                    }
                }
            }

            query = query.order('created_at', { ascending: false });

            // Pagination at the database layer
            if (page && limit) {
                const start = (page - 1) * limit;
                const end = start + limit - 1;
                query = query.range(start, end);
            }

            const { data, count, error } = await query;
            if (error) throw error;

            const leadsMapped: Lead[] = (data || []).map((l: any) => {
                const mappedData = { ...l.data };
                if (excludePrintBase64) {
                    // Strip the heavy base64 string during normal listing
                    if (mappedData.print_base64) {
                        mappedData.print_base64 = undefined;
                    }
                }
                return {
                    id: l.id,
                    name: l.name,
                    phone: l.phone,
                    status: l.status,
                    data: mappedData,
                    createdAt: l.created_at
                };
            });

            return {
                leads: leadsMapped,
                totalCount: count || 0
            };
        } catch (error) {
            console.error("DB Error: getLeads", error);
            return { leads: [], totalCount: 0 };
        }
    },

    async getLeadsStatusOnly(agentId: string): Promise<{id: string, status: string}[]> {
        try {
            const { data } = await supabase.from('leads').select('id, status').eq('agent_id', agentId);
            return (data || []) as {id: string, status: string}[];
        } catch (e) { return []; }
    },
    
    async getLeadsByIds(leadIds: string[]): Promise<Lead[]> {
        try {
            const { data } = await supabase.from('leads').select('*').in('id', leadIds);
            return (data || []).map((l: any) => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                status: l.status,
                data: l.data || {},
                createdAt: l.created_at
            }));
        } catch (e) { return []; }
    },

    async checkGlobalHistory(phone: string): Promise<boolean> {
        try {
            const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('phone', phone.replace(/\D/g, '')).eq('status', 'SENT');
            return (count || 0) > 0;
        } catch (e) { return false; }
    },
    
    async updateLeadStatus(leadId: string, status: string) {
        try {
            supabase.from('leads').update({ status }).eq('id', leadId).then();
        } catch (e) {}
    },

    async updateLeadData(leadId: string, data: Record<string, any>): Promise<boolean> {
        try {
            const { error } = await supabase.from('leads').update({ data }).eq('id', leadId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Error in updateLeadData:", e);
            return false;
        }
    },

    async getAllLeadsSlim(agentId: string): Promise<Lead[]> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('id, name, phone, status, data, created_at')
                .eq('agent_id', agentId);
            if (error) throw error;
            return (data || []).map((l: any) => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                status: l.status as LeadStatus,
                data: l.data || {},
                createdAt: l.created_at
            }));
        } catch (e) {
            console.error("Error in getAllLeadsSlim:", e);
            return [];
        }
    },

    async deleteLead(leadId: string) {
        await supabase.from('leads').delete().eq('id', leadId);
    },

    async deleteLeads(leadIds: string[]) {
        try { await supabase.from('leads').delete().in('id', leadIds); } catch (e) {}
    },

    async bulkUpdateLeadStatus(leadIds: string[], status: string) {
        await supabase.from('leads').update({ status }).in('id', leadIds);
    },

    async findSentPhones(phones: string[]): Promise<string[]> {
        const { data } = await supabase.from('leads')
            .select('phone')
            .in('phone', phones)
            .eq('status', 'SENT');
        return (data || []).map(d => d.phone);
    },

    async findExistingPhones(phones: string[]): Promise<string[]> {
        try {
            // Dividir em lotes de 1000 para evitar limites de query
            const existingPhones: string[] = [];
            for (let i = 0; i < phones.length; i += 1000) {
                const batch = phones.slice(i, i + 1000);
                const { data } = await supabase.from('leads')
                    .select('phone')
                    .in('phone', batch);
                if (data) {
                    existingPhones.push(...data.map(d => d.phone));
                }
            }
            return existingPhones;
        } catch (e) {
            console.error("Error finding existing phones:", e);
            return [];
        }
    },

    // --- PROSPECTING ---
    async getProspectingLeads(source: string): Promise<Lead[]> {
        try {
            const { data } = await supabase.from('leads')
                .select('*')
                .eq('data->>source', source)
                .order('created_at', { ascending: false });
            return (data || []).map((l: any) => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                status: l.status as LeadStatus,
                data: l.data || {},
                createdAt: l.created_at
            }));
        } catch (e) { return []; }
    },

    async addProspectingLeads(leads: any[]): Promise<Lead[]> {
        try {
            const { data, error } = await supabase.from('leads').insert(leads).select();
            if (error) throw error;
            return (data || []).map((l: any) => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                status: l.status as LeadStatus,
                data: l.data || {},
                createdAt: l.created_at
            }));
        } catch (e) { return []; }
    },

    // --- GLOBAL PROMPTS ---
    async getGlobalPrompts(product: string): Promise<GlobalPrompt[]> {
        try {
            const { data } = await supabase.from('global_prompts')
                .select('*')
                .eq('product', product);
            return (data || []).map((p: any) => ({
                id: p.id,
                product: p.product,
                niche: p.niche,
                profession: p.profession,
                title: p.title,
                content: p.content,
                isActive: p.is_active,
                useVision: p.use_vision,
                stats: p.stats || { sent: 0, replied: 0, converted: 0 }
            }));
        } catch (e) { return []; }
    },

    // --- CHAT HISTORY ---
    async getChatSessions(agentId: string): Promise<ChatSession[]> {
        try {
            const { data } = await supabase.from('chat_sessions')
                .select('*, chat_messages(*)')
                .eq('agent_id', agentId)
                .order('last_message_at', { ascending: false })
                .limit(100);
            return (data || []).map((s: any) => ({
                id: s.id,
                leadId: s.lead_id,
                name: s.contact_name,
                phone: s.phone,
                lastMsg: s.last_message,
                lastMsgTime: s.last_message_at,
                unread: s.unread_count,
                messages: (s.chat_messages || []).map((m: any) => ({
                    id: m.id,
                    text: m.text,
                    sender: m.sender,
                    status: m.status,
                    timestamp: new Date(m.created_at).getTime()
                })).sort((a: any, b: any) => a.timestamp - b.timestamp)
            }));
        } catch (e) { return []; }
    },

    async getOrCreateSession(agentId: string, lead: Lead, instanceId?: string): Promise<string | null> {
        try {
            const { data: existing } = await supabase.from('chat_sessions').select('id').eq('agent_id', agentId).eq('lead_id', lead.id).single();
            if (existing) return existing.id;

            const { data: newSession, error } = await supabase.from('chat_sessions').insert({
                agent_id: agentId,
                lead_id: lead.id,
                instance_id: instanceId,
                phone: lead.phone,
                contact_name: lead.name,
                last_message: 'Iniciando...',
                unread_count: 0
            }).select().single();

            return newSession?.id || null;
        } catch (e) { return null; }
    },

    async logMessage(sessionId: string, text: string, sender: 'agent' | 'user') {
        if (!sessionId) return;
        try {
            supabase.from('chat_messages').insert({ session_id: sessionId, sender, text, status: 'sent' }).then();
            supabase.from('chat_sessions').update({ last_message: text, last_message_at: new Date().toISOString() }).eq('id', sessionId).then();
        } catch (e) {}
    },

    async getGlobalChatSessions(): Promise<(ChatSession & { instanceId?: string, agentName?: string })[]> {
        try {
            const { data } = await supabase.from('chat_sessions').select('*, agents(id, name, connected_instance_id), chat_messages(*)').order('last_message_at', { ascending: false });
            return (data || []).map((s: any) => ({
                id: s.id,
                leadId: s.lead_id,
                name: s.contact_name,
                phone: s.phone,
                lastMsg: s.last_message,
                lastMsgTime: s.last_message_at,
                unread: s.unread_count,
                instanceId: s.instance_id || s.agents?.connected_instance_id,
                agentName: s.agents?.name,
                messages: (s.chat_messages || []).map((m: any) => ({
                    id: m.id,
                    text: m.text,
                    sender: m.sender,
                    status: m.status,
                    timestamp: new Date(m.created_at).getTime()
                })).sort((a: any, b: any) => a.timestamp - b.timestamp)
            }));
        } catch (e) { return []; }
    },

    // --- CHECKLIST ---
    async getChecklistItems() {
        try {
            const { data } = await supabase.from('checklist_items').select('*').order('created_at', { ascending: false });
            return (data || []).map((item: any) => ({
                id: item.id,
                text: item.text,
                completed: item.completed,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (e) { return []; }
    },

    async addChecklistItem(text: string): Promise<any> {
        const { data, error } = await supabase.from('checklist_items').insert({
            text,
            completed: false
        }).select().single();
        if (error) throw error;
        return {
            id: data.id,
            text: data.text,
            completed: data.completed,
            createdAt: new Date(data.created_at).getTime()
        };
    },

    async updateChecklistItem(id: string, completed: boolean) {
        await supabase.from('checklist_items').update({ completed }).eq('id', id);
    },

    async deleteChecklistItem(id: string) {
        await supabase.from('checklist_items').delete().eq('id', id);
    },

    // --- PRODUCTS / KNOWLEDGE BASE ---
    async getProducts(): Promise<Product[]> {
        try {
            const stored = localStorage.getItem('ditho_products');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    },

    async saveProduct(product: Product) {
        try {
            const stored = localStorage.getItem('ditho_products');
            let products: Product[] = stored ? JSON.parse(stored) : [];
            const index = products.findIndex(p => p.id === product.id);
            if (index > -1) {
                products[index] = product;
            } else {
                products.push(product);
            }
            localStorage.setItem('ditho_products', JSON.stringify(products));
        } catch (e) {}
    },

    async deleteProduct(id: string) {
        try {
            const stored = localStorage.getItem('ditho_products');
            if (!stored) return;
            let products: Product[] = JSON.parse(stored);
            products = products.filter(p => p.id !== id);
            localStorage.setItem('ditho_products', JSON.stringify(products));
        } catch (e) {}
    },
    
    async addLeads(agentId: string, leads: Lead[]): Promise<Lead[]> {
        if (!leads || leads.length === 0) return [];
        
        const results: Lead[] = [];
        const batchSize = 25; // Lotes menores para evitar erro de payload por causa de imagens Base64
        
        try {
            for (let i = 0; i < leads.length; i += batchSize) {
                const batch = leads.slice(i, i + batchSize).map(l => ({
                    agent_id: agentId,
                    name: l.name,
                    phone: l.phone,
                    status: l.status || LeadStatus.PENDING,
                    data: l.data || {}
                }));

                const { data, error } = await supabase
                    .from('leads')
                    .insert(batch)
                    .select('id');

                if (error) {
                    console.error(`Erro ao inserir lote de leads (${i}-${i + batchSize}):`, error);
                    // Continuamos para o próximo lote mesmo se um falhar
                    continue;
                }

                if (data) {
                    const mapped = data.map((l: any) => ({
                        id: l.id,
                        name: l.name,
                        phone: l.phone,
                        status: l.status as LeadStatus,
                        data: l.data || {},
                        createdAt: l.created_at
                    }));
                    results.push(...mapped);
                }
            }
            return results;
        } catch (e) {
            console.error("Critical Error in addLeads:", e);
            return results;
        }
    },

    async resetLeadsByInstance(agentId: string, instanceId: string): Promise<number> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const { data: sessions, error: sError } = await supabase
                .from('chat_sessions')
                .select('lead_id')
                .eq('agent_id', agentId)
                .eq('instance_id', instanceId)
                .gte('last_message_at', todayISO);

            if (sError || !sessions || sessions.length === 0) return 0;

            const leadIds = sessions.map(s => s.lead_id);

            const { error: uError } = await supabase
                .from('leads')
                .update({ status: LeadStatus.PENDING })
                .in('id', leadIds);

            if (uError) throw uError;
            return leadIds.length;
        } catch (e) {
            console.error("Reset Error", e);
            return 0;
        }
    },

    // --- LIBRARY (BLOCKS & MESSAGES) ---
    async getBlocks(): Promise<any[]> {
        try {
            const stored = localStorage.getItem('ditho_blocks');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    },

    async saveBlock(block: any) {
        try {
            const stored = localStorage.getItem('ditho_blocks');
            let blocks: any[] = stored ? JSON.parse(stored) : [];
            const index = blocks.findIndex(b => b.id === block.id);
            if (index > -1) {
                blocks[index] = { ...block, updatedAt: Date.now() };
            } else {
                blocks.push({ ...block, createdAt: Date.now(), updatedAt: Date.now() });
            }
            localStorage.setItem('ditho_blocks', JSON.stringify(blocks));
        } catch (e) {}
    },

    async deleteBlock(id: string) {
        try {
            const stored = localStorage.getItem('ditho_blocks');
            if (!stored) return;
            let blocks: any[] = JSON.parse(stored);
            blocks = blocks.filter(b => b.id !== id);
            localStorage.setItem('ditho_blocks', JSON.stringify(blocks));
        } catch (e) {}
    },

    async getMessageTemplates(): Promise<any[]> {
        try {
            const stored = localStorage.getItem('ditho_templates');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    },

    async saveMessageTemplate(template: any) {
        try {
            const stored = localStorage.getItem('ditho_templates');
            let templates: any[] = stored ? JSON.parse(stored) : [];
            const index = templates.findIndex(t => t.id === template.id);
            if (index > -1) {
                templates[index] = { ...template, updatedAt: Date.now() };
            } else {
                templates.push({ ...template, createdAt: Date.now(), updatedAt: Date.now() });
            }
            localStorage.setItem('ditho_templates', JSON.stringify(templates));
        } catch (e) {}
    },

    async deleteMessageTemplate(id: string) {
        try {
            const stored = localStorage.getItem('ditho_templates');
            if (!stored) return;
            let templates: any[] = JSON.parse(stored);
            templates = templates.filter(t => t.id !== id);
            localStorage.setItem('ditho_templates', JSON.stringify(templates));
        } catch (e) {}
    },

    async getFlows(): Promise<any[]> {
        try {
            const stored = localStorage.getItem('ditho_flows');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    },

    async saveFlow(flow: any) {
        try {
            const stored = localStorage.getItem('ditho_flows');
            let flows: any[] = stored ? JSON.parse(stored) : [];
            const index = flows.findIndex(f => f.id === flow.id);
            if (index > -1) {
                flows[index] = { ...flow, updatedAt: Date.now() };
            } else {
                flows.push({ ...flow, createdAt: Date.now(), updatedAt: Date.now() });
            }
            localStorage.setItem('ditho_flows', JSON.stringify(flows));
        } catch (e) {}
    },

    async deleteFlow(id: string) {
        try {
            const stored = localStorage.getItem('ditho_flows');
            if (!stored) return;
            let flows: any[] = JSON.parse(stored);
            flows = flows.filter(f => f.id !== id);
            localStorage.setItem('ditho_flows', JSON.stringify(flows));
        } catch (e) {}
    }
};

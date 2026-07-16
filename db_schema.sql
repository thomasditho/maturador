
-- ==========================================
-- SCRIPT DE CRIAÇÃO - DITHO BDR OS
-- Cole no SQL Editor do seu novo Supabase e clique em RUN
-- ==========================================

-- 1. TABELA DE CONFIGURAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY,
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    webhook_url TEXT,
    rabbitmq_enabled BOOLEAN DEFAULT FALSE,
    safety_min_delay INTEGER DEFAULT 20,
    safety_max_delay INTEGER DEFAULT 60,
    safety_warmup_enabled BOOLEAN DEFAULT FALSE,
    safety_warmup_start INTEGER DEFAULT 50,
    safety_warmup_inc INTEGER DEFAULT 20,
    financial_chip_cost DECIMAL(10,2) DEFAULT 0,
    financial_msg_cost DECIMAL(10,5) DEFAULT 0
);

-- 2. TABELA DE AGENTES
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT DEFAULT 'gemini-3-flash-preview',
    temperature FLOAT DEFAULT 0.7,
    tone TEXT,
    connected_instance_id TEXT,
    connected_instance_ids TEXT[] DEFAULT '{}',
    instance_limits JSONB DEFAULT '{}'
);

-- 3. TABELA DE PROMPTS DOS AGENTES
CREATE TABLE IF NOT EXISTS agent_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    type TEXT DEFAULT 'AI' -- 'AI' ou 'STATIC'
);

-- 4. TABELA DE LEADS
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABELA DE SESSÕES DE CHAT (CRM)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    instance_id TEXT,
    phone TEXT,
    contact_name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    unread_count INTEGER DEFAULT 0
);

-- 6. TABELA DE MENSAGENS DO CHAT
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender TEXT, -- 'agent' ou 'user'
    text TEXT,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. TABELA DE CHECKLIST / IDEIAS
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. TABELA DE ESTRATÉGIAS GLOBAIS
CREATE TABLE IF NOT EXISTS global_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product TEXT,
    niche TEXT,
    profession TEXT,
    title TEXT,
    content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    use_vision BOOLEAN DEFAULT FALSE,
    stats JSONB DEFAULT '{"sent": 0, "replied": 0, "converted": 0}'::jsonb
);

-- 9. ÍNDICES DE PERFORMANCE (CRÍTICO PARA TIMEOUTS)
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- 10. INSERIR REGISTRO DE CONFIGURAÇÃO INICIAL
INSERT INTO system_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 11. DESABILITAR RLS (Para permitir que o app funcione sem configurações extras no painel)
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_prompts DISABLE ROW LEVEL SECURITY;

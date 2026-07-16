
export enum InstanceStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  QRCODE = 'QRCODE',
  BANNED = 'BANNED'
}

export enum LeadStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  data: Record<string, any>; // Mapped from JSONB in Supabase
  createdAt?: string; // Data de importação/criação
}

export interface AgentFile {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'TXT' | 'CSV';
  size: string;
  uploadDate: number;
  url?: string;
}

export interface AgentPrompt {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  type?: 'AI' | 'STATIC';
}

export interface GlobalPrompt {
  id: string;
  product: string; // ex: 'Site'
  niche: string;   // ex: 'Saúde'
  profession: string; // ex: 'Dentista' (NOVO NÍVEL HIERÁRQUICO)
  title: string;
  content: string;
  isActive: boolean;
  useVision?: boolean; // CONTROLAR O ENVIO DE IMAGEM
  stats: {
    sent: number;
    replied: number;
    converted: number;
  };
}

export interface AgentConfig {
  id: string;
  name: string;
  prompts: AgentPrompt[];
  model: string;
  temperature: number;
  leads: Lead[];
  connectedInstanceId?: string; // Mantido para legado
  connectedInstanceIds?: string[]; // NOVO: Suporte Multi-Chip
  instanceLimits?: Record<string, number>; // NOVO: Limite de disparos por chip
  tone?: string;
  knowledgeBase: AgentFile[];
}

export interface SafetyConfig {
  minDelay: number;
  maxDelay: number;
  warmupEnabled: boolean;
  warmupStartCount: number;
  warmupIncrement: number;
  jitterPattern: 'random' | 'linear';
}

export interface Instance {
  id: string;
  name: string;
  phoneNumber: string;
  status: InstanceStatus;
  agentId?: string;
  totalSent: number;
  batteryLevel?: number;
}

export interface ManualOperation {
  id: string;
  name: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  totalLeads: number;
  processedLeads: number;
  selectedInstanceIds: string[];
  messageTemplate: string;
}

export interface Campaign {
  id: string;
  name: string;
  instanceId: string;
  listId: string;
  status: 'RUNNING' | 'COMPLETED' | 'PAUSED';
  progress: number;
  total: number;
  messageTemplate: string;
}

export interface SystemSettings {
  evolutionApiUrl: string;
  evolutionApiKey: string;
  webhookUrl: string;
  rabbitmqEnabled: boolean;
  // --- NOVOS CAMPOS FINANCEIROS ---
  costPerChip: number; // Ex: 15.00 (Reais)
  costPerMsg: number;  // Ex: 0.05 (Custo de API/Proxy)
}

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: number;
    status: 'sent' | 'delivered' | 'read';
}

export interface ChatSession {
    id: string;
    leadId: string;
    name: string;
    phone: string;
    messages: Message[];
    lastMsg: string;
    lastMsgTime: string;
    unread: number;
}

// --- NEW TYPES FOR MULTI-AGENT BACKGROUND EXECUTION ---
export interface ActiveAgentState {
    agentId: string;
    status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'STOPPED';
    progress: {
        current: number;
        total: number;
    };
    currentLead?: string; // Name of lead being processed
    activeWorkers?: number; // NOVO: Quantos chips estão rodando
    logs: string[];
}

// --- NEW TYPES FOR PRODUCT BRAIN (RAG) ---
export interface KnowledgeItem {
    id: string;
    type: 'PDF' | 'JSON' | 'TEXT' | 'URL';
    title: string;
    content: string; // Raw text or JSON string content
    fileName?: string;
    addedAt: number;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    knowledgeBase: KnowledgeItem[]; // O "Cérebro" do produto
    active: boolean;
    createdAt: string;
}

// --- NEW TYPES FOR WARMUP MODULE ---
// --- NEW TYPES FOR LIBRARY (BLOCKS & MESSAGES) ---
export enum BlockType {
    TEXT_LITERAL = 'TEXT_LITERAL',
    TEXT_VARIABLE = 'TEXT_VARIABLE',
    TEXT_IA = 'TEXT_IA',
    TEXT_IA_CONTEXT = 'TEXT_IA_CONTEXT',
    AUDIO_UPLOAD = 'AUDIO_UPLOAD',
    AUDIO_IA_TTS = 'AUDIO_IA_TTS',
    AUDIO_IA_CLONE = 'AUDIO_IA_CLONE',
    IMAGE_UPLOAD = 'IMAGE_UPLOAD',
    IMAGE_IA = 'IMAGE_IA',
    VIDEO_UPLOAD = 'VIDEO_UPLOAD',
    DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
    STICKER_UPLOAD = 'STICKER_UPLOAD',
    VCARD = 'VCARD',
    LOCATION = 'LOCATION',
    POLL = 'POLL',
    BUTTONS = 'BUTTONS',
    LIST = 'LIST',
    CATALOG = 'CATALOG',
    TYPING_SIMULATION = 'TYPING_SIMULATION',
    RECORDING_SIMULATION = 'RECORDING_SIMULATION',
    DELAY = 'DELAY',
    BALLOON_BREAK = 'BALLOON_BREAK',
    CONDITIONAL = 'CONDITIONAL',
    RANDOMIZER = 'RANDOMIZER',
    GREETING = 'GREETING',
    TRACKABLE_LINK = 'TRACKABLE_LINK',
    WEBHOOK = 'WEBHOOK',
    RESPONSE_CAPTURE = 'RESPONSE_CAPTURE',
    REACTION = 'REACTION'
}

export interface Block {
    id: string;
    name: string;
    type: BlockType;
    content: any; // JSON structure specific to each type
    createdAt: number;
    updatedAt: number;
}

export interface MessageTemplate {
    id: string;
    name: string;
    description?: string;
    blockIds: string[]; // Sequence of blocks (Peças) that form one bubble
    createdAt: number;
    updatedAt: number;
}

export interface Flow {
    id: string;
    name: string;
    description?: string;
    steps: {
        id: string;
        type: 'MESSAGE' | 'DELAY' | 'CONDITION' | 'WEBHOOK';
        referenceId?: string; // ID of MessageTemplate
        config?: any; // Delay time, condition logic, etc.
    }[];
    createdAt: number;
    updatedAt: number;
}

export interface WarmupConfig {
    isActive: boolean;
    startTime: string; // "08:00"
    endTime: string;   // "22:00"
    topics: string[];
    tone: 'Casual' | 'Formal' | 'Gírias' | 'Trabalho';
    frequency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface WarmupLog {
    id: string;
    timestamp: number;
    chipName: string;
    message: string;
    type: 'SENT' | 'RECEIVED' | 'THINKING' | 'INFO';
}

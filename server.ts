import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { DatabaseService } from './services/databaseService';
import { EvolutionService } from './services/evolutionService';
import { generateAgentMessage } from './services/geminiService';
import { ActiveAgentState, Lead, LeadStatus, Instance, AgentConfig, SafetyConfig, SystemSettings } from './types';

// Ensure process.env.API_KEY is defined for geminiService if GEMINI_API_KEY is set
if (!process.env.API_KEY && process.env.GEMINI_API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

// Safely resolve __filename and __dirname regardless of ESM (tsx) or CommonJS (compiled bundle) context
const hasGlobalFilename = typeof __filename !== 'undefined';
const hasGlobalDirname = typeof __dirname !== 'undefined';

const currentFilename = hasGlobalFilename 
  ? __filename 
  : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');

const currentDirname = hasGlobalDirname 
  ? __dirname 
  : (currentFilename ? path.dirname(currentFilename) : process.cwd());

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory active agent runs
interface ServerActiveAgentState extends ActiveAgentState {
  stopFlag: boolean;
  cursor: number;
  leadsList: string[];
}

const runningAgents: Record<string, ServerActiveAgentState> = {};

// Helper to run background loops
const runServerWorkerLoop = async (
  agent: AgentConfig,
  instance: Instance,
  allTargets: Lead[],
  safetyConfig: SafetyConfig,
  settings: SystemSettings,
  limit?: number
) => {
  let sentByMe = 0;
  const state = runningAgents[agent.id];
  if (!state) return;

  state.activeWorkers = (state.activeWorkers || 0) + 1;
  state.logs.push(`[${instance.name}] Worker de disparo iniciado.`);

  while (true) {
    if (state.stopFlag) {
      state.logs.push(`[${instance.name}] Pausado pelo usuário.`);
      break;
    }

    if (limit && sentByMe >= limit) {
      state.logs.push(`[${instance.name}] Atingiu o limite configurado (${limit}) e parou.`);
      break;
    }

    // Capture the current lead to process from the shared state cursor
    const currentIndex = state.cursor;
    if (currentIndex >= allTargets.length) {
      break;
    }

    // Increment shared cursor
    state.cursor++;
    sentByMe++;

    const lead = allTargets[currentIndex];
    state.currentLead = lead.name;
    state.progress.current = Math.min(state.cursor, allTargets.length);

    try {
      state.logs.push(`[${instance.name}] Enviando para: ${lead.name} (${lead.phone})`);
      
      const alreadyAborted = await DatabaseService.checkGlobalHistory(lead.phone).catch(() => false);
      if (alreadyAborted) {
        state.logs.push(`[${instance.name}] Lead ${lead.name} (${lead.phone}) já abordado anteriormente. Pulando.`);
        continue;
      }

      // Generate the personalized agent message
      const messageText = await generateAgentMessage(agent, lead).catch((e) => {
        console.error("Gemini Generation Error:", e);
        return `Olá ${lead.name}, tudo bem?`;
      });

      let success = false;
      if (lead.data?.print_base64) {
        success = await EvolutionService.sendMedia(settings, instance.name, lead.phone, lead.data.print_base64, messageText);
      } else {
        success = await EvolutionService.sendText(settings, instance.name, lead.phone, messageText);
      }

      if (success) {
        state.logs.push(`[${instance.name}] Sucesso ao enviar para ${lead.name}.`);
        await DatabaseService.updateLeadStatus(lead.id, LeadStatus.SENT);
        
        const sid = await DatabaseService.getOrCreateSession(agent.id, lead, instance.id).catch(() => null);
        if (sid) {
          await DatabaseService.logMessage(sid, messageText, 'agent').catch(() => null);
        }
      } else {
        state.logs.push(`[${instance.name}] Falha no envio para ${lead.name}.`);
        await DatabaseService.updateLeadStatus(lead.id, LeadStatus.FAILED);
      }
    } catch (e: any) {
      console.error("Server Worker error on lead:", e);
      state.logs.push(`[${instance.name}] Erro: ${e.message || e}`);
    }

    if (!state.stopFlag && state.cursor < allTargets.length) {
      const minD = safetyConfig.minDelay || 20;
      const maxD = safetyConfig.maxDelay || 60;
      const delay = Math.floor(Math.random() * (maxD - minD + 1) + minD) * 1000;
      state.logs.push(`[${instance.name}] Dormindo por ${delay / 1000}s para segurança.`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  state.activeWorkers = Math.max(0, (state.activeWorkers || 1) - 1);
  if (state.activeWorkers === 0) {
    if (state.cursor >= allTargets.length) {
      state.status = 'COMPLETED';
      state.logs.push(`Disparo finalizado. Todos os leads foram processados.`);
    } else {
      state.status = 'PAUSED';
      state.logs.push(`Disparos pausados.`);
    }
  }
};

// API: Start Agent
app.post('/api/agents/start', async (req, res) => {
  try {
    const { agentId, leadIds, safetyConfig, settings } = req.body;
    if (!agentId || !Array.isArray(leadIds) || !safetyConfig || !settings) {
      res.status(400).json({ error: 'Parâmetros incompletos.' });
      return;
    }

    // Fetch up-to-date agent details from database
    const allAgents = await DatabaseService.getAgents();
    const agent = allAgents.find(a => a.id === agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agente não encontrado.' });
      return;
    }

    const chipIds = agent.connectedInstanceIds || (agent.connectedInstanceId ? [agent.connectedInstanceId] : []);
    if (chipIds.length === 0) {
      res.status(400).json({ error: 'Nenhum chip configurado.' });
      return;
    }

    const allTargets = await DatabaseService.getLeadsByIds(leadIds);
    const instances = await EvolutionService.fetchInstances(settings);

    // If already running, mark stopFlag false, or clean/reset state
    const existing = runningAgents[agentId];
    if (existing && existing.status === 'RUNNING') {
      existing.stopFlag = false;
      res.json({ message: 'Agente já está em execução no servidor.', status: existing });
      return;
    }

    // Initialize/Reset State
    const currentCursor = existing && existing.status === 'PAUSED' ? existing.cursor : 0;
    runningAgents[agentId] = {
      agentId,
      status: 'RUNNING',
      progress: { current: currentCursor, total: allTargets.length },
      activeWorkers: 0,
      logs: [`Iniciando com ${chipIds.length} chips de disparo...`],
      stopFlag: false,
      cursor: currentCursor,
      leadsList: leadIds
    };

    // Spin up workers
    chipIds.forEach(chipId => {
      const instance = instances.find(i => i.id === chipId);
      const limit = agent.instanceLimits?.[chipId];
      if (instance && instance.status === 'CONNECTED') {
        runServerWorkerLoop(agent, instance, allTargets, safetyConfig, settings, limit);
      } else {
        runningAgents[agentId].logs.push(`Aviso: Chip ${chipId} desconectado ou indisponível.`);
      }
    });

    res.json({ message: 'Agente iniciado no servidor.', status: runningAgents[agentId] });
  } catch (e: any) {
    console.error("API start error:", e);
    res.status(500).json({ error: e.message || e });
  }
});

// API: Stop Agent
app.post('/api/agents/stop', (req, res) => {
  const { agentId } = req.body;
  if (!agentId) {
    res.status(400).json({ error: 'agentId ausente.' });
    return;
  }

  const state = runningAgents[agentId];
  if (state) {
    state.stopFlag = true;
    state.status = 'PAUSED';
    state.logs.push("Comando para parar recebido.");
    res.json({ message: 'Comando de parada enviado para o agente.', status: state });
  } else {
    res.status(404).json({ error: 'Agente não está em execução no servidor.' });
  }
});

// API: Get status of running agents
app.get('/api/agents/status', (req, res) => {
  // Convert map to object
  res.json(runningAgents);
});

// Setup Vite Dev Server / Production Serving
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((e) => {
  console.error("Failed to start server:", e);
});

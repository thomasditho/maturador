import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { supabase } from "./services/supabase";
import { MATURADOR_SCRIPTS } from "./services/maturadorScripts";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper para obter credenciais oficiais do banco de dados
async function getSystemCredentials() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('evolution_api_url, evolution_api_key')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return {
        url: 'https://evolution-api-production-aad3a.up.railway.app',
        key: 'Dithosolucoes324911@'
      };
    }

    return {
      url: data.evolution_api_url || 'https://evolution-api-production-aad3a.up.railway.app',
      key: data.evolution_api_key || 'Dithosolucoes324911@'
    };
  } catch (e) {
    return {
      url: 'https://evolution-api-production-aad3a.up.railway.app',
      key: 'Dithosolucoes324911@'
    };
  }
}

// Fetch all instances from Evolution API
async function fetchInstances(url: string, key: string) {
  const cleanUrl = url.trim().replace(/\/$/, '');
  try {
    const response = await fetch(`${cleanUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key.trim()
      }
    });

    if (!response.ok) return [];
    const data = await response.json();
    const instancesRaw = Array.isArray(data) ? data : (data.instances || []);
    if (!Array.isArray(instancesRaw)) return [];

    return instancesRaw.map((inst: any) => {
      const actualInstance = inst.instance || inst;
      const name = actualInstance?.instanceName || actualInstance?.name || 'Desconhecido';
      const owner = actualInstance?.owner || actualInstance?.phoneNumber || actualInstance?.token || 'Sem número';
      const statusRaw = (actualInstance?.status || actualInstance?.connectionStatus || '').toLowerCase();
      const isConnected = ['open', 'connected', 'connecting'].includes(statusRaw);

      return {
        id: name,
        name: name,
        phoneNumber: owner,
        status: isConnected ? 'CONNECTED' : 'DISCONNECTED'
      };
    });
  } catch (e) {
    return [];
  }
}

// Enviar mensagem de texto pela Evolution API
async function sendText(url: string, key: string, instanceName: string, number: string, text: string) {
  const cleanUrl = url.trim().replace(/\/$/, '');
  try {
    let cleanNumber = number.replace(/\D/g, '');
    if (!cleanNumber.startsWith('55') && (cleanNumber.length === 10 || cleanNumber.length === 11)) {
      cleanNumber = '55' + cleanNumber;
    }

    const bodyPayload = {
      number: cleanNumber,
      options: {
        delay: 1200,
        presence: "composing",
        linkPreview: false
      },
      text: text,
      textMessage: { text: text }
    };

    const response = await fetch(`${cleanUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key.trim()
      },
      body: JSON.stringify(bodyPayload)
    });

    return response.ok;
  } catch (e) {
    console.error(`[Maturador Server] Erro ao enviar mensagem de ${instanceName} para ${number}:`, e);
    return false;
  }
}

// Buscar configuração de maturação do banco
async function getMaturadorConfig() {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('name', '__MATURADOR_SYSTEM_CONFIG__')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const defaultConfig = {
        isRunning: false,
        currentDay: 1,
        minDelay: 15,
        maxDelay: 35,
        startHour: "08:00",
        endHour: "22:00",
        simulateTyping: true,
        unknownAutoReplyEnabled: false,
        unknownReplies: {},
        chipStats: {},
        logs: [],
        lastRunTimestamp: 0,
        nextScheduledDelay: 0
      };

      const { data: created } = await supabase
        .from('agents')
        .insert({
          name: '__MATURADOR_SYSTEM_CONFIG__',
          model: 'maturador-config',
          instance_limits: defaultConfig
        })
        .select()
        .single();

      return created ? created.instance_limits : defaultConfig;
    }

    return data.instance_limits;
  } catch (e) {
    console.error("[Maturador Server] Erro ao obter maturador config:", e);
    return null;
  }
}

// Salvar configuração de maturação no banco
async function saveMaturadorConfig(config: any) {
  try {
    await supabase
      .from('agents')
      .update({ instance_limits: config })
      .eq('name', '__MATURADOR_SYSTEM_CONFIG__');
  } catch (e) {
    console.error("[Maturador Server] Erro ao salvar maturador config:", e);
  }
}

// Função para registrar log
function appendLog(logs: any[], from: string, to: string, message: string, status: string, day: number) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const newLog = {
    id: Math.random().toString(36).substring(7),
    time: timestamp,
    from,
    to,
    message,
    status,
    day
  };
  const updatedLogs = [newLog, ...logs];
  return updatedLogs.slice(0, 100); // Manter os últimos 100 logs
}

// Resolver Spintax de forma recursiva
function resolveSpintax(text: string): string {
  const matches = text.match(/\{[^{}]+\}/g);
  if (!matches) return text;
  
  let resolved = text;
  for (const match of matches) {
    const options = match.slice(1, -1).split('|');
    const chosen = options[Math.floor(Math.random() * options.length)];
    resolved = resolved.replace(match, chosen);
  }
  return resolveSpintax(resolved);
}

// Deixa a mensagem ultra-humana e única para evitar banimento do WhatsApp
function humanizeMessage(text: string): string {
  // 1. Resolve o Spintax
  let output = resolveSpintax(text);

  // 2. Variação aleatória de risadas brasileiras
  const laughterList = ["kkkk", "kkkkk", "kkk", "rsrs", "rs", "😂", "haha", "hahaha"];
  output = output.replace(/\b(kkkk|kkk|rs|rsrs)\b/gi, () => {
    return laughterList[Math.floor(Math.random() * laughterList.length)];
  });

  // 3. Variação de abreviações e gírias humanas de forma orgânica
  if (Math.random() < 0.4) {
    output = output.replace(/\bvc\b/gi, Math.random() < 0.5 ? "você" : "vc");
    output = output.replace(/\btb\b/gi, Math.random() < 0.5 ? "também" : "tbm");
    output = output.replace(/\bmto\b/gi, Math.random() < 0.5 ? "muito" : "mto");
  }

  // 4. Injetar Emojis adicionais amigáveis aleatoriamente no final de algumas frases (30% de chance)
  const emojis = [" 🚀", " 👍", " 🙏", " ☕", " 😉", " 🎯", " ✌️", " 👊", ""];
  if (Math.random() < 0.3) {
    output += emojis[Math.floor(Math.random() * emojis.length)];
  }

  return output;
}

// Executa o fluxo de diálogo de forma assíncrona sem travar o loop principal
async function runServerDialogueFlow(
  url: string,
  key: string,
  chipA: any,
  chipB: any,
  dialogue: any,
  day: number,
  simulateTyping: boolean
) {
  try {
    for (const msg of dialogue.messages) {
      // Recarrega configuração para ver se ainda está ativo
      const freshConfig = await getMaturadorConfig();
      if (!freshConfig || !freshConfig.isRunning) break;

      const sender = msg.senderIndex === 0 ? chipA : chipB;
      const receiver = msg.senderIndex === 0 ? chipB : chipA;

      // Se o chip estiver pausado individualmente, cancela o diálogo
      if (freshConfig.chipStats[sender.name]?.status === 'paused' || freshConfig.chipStats[receiver.name]?.status === 'paused') {
        break;
      }

      // Gera a mensagem humanizada e exclusiva para esse envio
      const finalMessage = humanizeMessage(msg.text);

      // 1. Simulação de escrita baseada no tamanho do texto final
      if (simulateTyping) {
        freshConfig.logs = appendLog(freshConfig.logs, sender.name, receiver.name, "Digitando...", "composing", day);
        await saveMaturadorConfig(freshConfig);
        const typingDelay = Math.min(finalMessage.length * 60, 4000);
        await new Promise(r => setTimeout(r, typingDelay));
      }

      // 2. Envio real pela API
      const success = await sendText(url, key, sender.name, receiver.phoneNumber, finalMessage);

      // 3. Atualizar estatísticas e logs
      const updatedConfig = await getMaturadorConfig();
      if (!updatedConfig) break;

      if (success) {
        updatedConfig.logs = appendLog(updatedConfig.logs, sender.name, receiver.name, finalMessage, "sent", day);
        
        // Inicializa estatísticas se vazias
        if (!updatedConfig.chipStats[sender.name]) {
          updatedConfig.chipStats[sender.name] = { sent: 0, received: 0, status: 'active' };
        }
        if (!updatedConfig.chipStats[receiver.name]) {
          updatedConfig.chipStats[receiver.name] = { sent: 0, received: 0, status: 'active' };
        }

        updatedConfig.chipStats[sender.name].sent = (updatedConfig.chipStats[sender.name].sent || 0) + 1;
        updatedConfig.chipStats[receiver.name].received = (updatedConfig.chipStats[receiver.name].received || 0) + 1;
      } else {
        updatedConfig.logs = appendLog(updatedConfig.logs, sender.name, receiver.name, `Falha no envio de: "${finalMessage}"`, "failed", day);
      }

      await saveMaturadorConfig(updatedConfig);

      // Esperar um delay pequeno entre as mensagens da conversa
      await new Promise(r => setTimeout(r, 5000));
    }
  } catch (e) {
    console.error("[Maturador Server] Erro ao executar fluxo de diálogo:", e);
  }
}

// LOOP DO MATURADOR SERVER-SIDE (Executado a cada 15 segundos)
async function checkMaturadorLoop() {
  try {
    const config = await getMaturadorConfig();
    if (!config || !config.isRunning) return;

    // 1. Validar horário de funcionamento (GMT-3 / Horário de Brasília)
    const now = new Date();
    const utcOffset = -3; // Brasil UTC-3
    const brazilTime = new Date(now.getTime() + (utcOffset * 3600 * 1000));
    const hr = brazilTime.getUTCHours().toString().padStart(2, '0');
    const mn = brazilTime.getUTCMinutes().toString().padStart(2, '0');
    const currentHourStr = `${hr}:${mn}`;

    if (currentHourStr < config.startHour || currentHourStr > config.endHour) {
      console.log(`[Maturador Server] Em standby fora do horário comercial: ${currentHourStr} (Permitido: ${config.startHour} às ${config.endHour})`);
      return;
    }

    // 2. Verificar se o timer de agendamento do próximo diálogo estourou
    const timePassed = Date.now() - (config.lastRunTimestamp || 0);
    const requiredDelay = config.nextScheduledDelay || 0;

    if (timePassed < requiredDelay) {
      return; // Ainda não deu o tempo
    }

    // 3. Atualizar lastRunTimestamp imediatamente para evitar concorrência
    config.lastRunTimestamp = Date.now();
    
    // Obter credenciais de API ativas
    const creds = await getSystemCredentials();
    
    // Buscar todos os chips na API
    const instancesList = await fetchInstances(creds.url, creds.key);
    
    // Filtrar os chips conectados e que estão ativos nas estatísticas do maturador
    const connected = instancesList.filter(i => i.status === 'CONNECTED');
    const activeNames = Object.keys(config.chipStats).filter(name => config.chipStats[name]?.status === 'active');
    const activeChips = connected.filter(i => activeNames.includes(i.name));

    if (activeChips.length < 2) {
      config.logs = appendLog(
        config.logs,
        "Sistema",
        "Aviso",
        "Sem chips suficientes conectados e ativos (mínimo de 2). Maturação em pausa operacional.",
        "failed",
        config.currentDay
      );
      config.nextScheduledDelay = 60000; // Tenta de novo em 1 minuto
      await saveMaturadorConfig(config);
      return;
    }

    // Embaralhar e criar pares únicos de chips
    const shuffled = [...activeChips].sort(() => Math.random() - 0.5);
    const pairs: [any, any][] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push([shuffled[i], shuffled[i+1]]);
    }

    // Escolhe roteiro de diálogos correspondente ao dia
    const dayScript = MATURADOR_SCRIPTS.find(s => s.day === config.currentDay) || MATURADOR_SCRIPTS[0];

    // Salvar próximo delay agendado antes de rodar os diálogos
    const delaySeconds = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1) + config.minDelay);
    config.nextScheduledDelay = delaySeconds * 1000 * 2; // Fator dispersão
    
    config.logs = appendLog(
      config.logs,
      "Maturador",
      "Fila",
      `Iniciando ciclo de maturação com ${pairs.length} duplas. Próximo ciclo em ${delaySeconds}s.`,
      "waiting",
      config.currentDay
    );
    await saveMaturadorConfig(config);

    // Disparar o diálogo para cada dupla paralelamente
    for (const [chipA, chipB] of pairs) {
      const randomDialogue = dayScript.dialogues[Math.floor(Math.random() * dayScript.dialogues.length)];
      runServerDialogueFlow(creds.url, creds.key, chipA, chipB, randomDialogue, config.currentDay, config.simulateTyping);
    }

  } catch (e) {
    console.error("[Maturador Server] Erro no loop principal:", e);
  }
}

// Inicia o loop de verificação do maturador (a cada 15 segundos)
setInterval(checkMaturadorLoop, 15000);


// --- API ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server-side Maturador running 24/7!" });
});

// Endpoint para puxar logs e status consolidado do maturador no server-side
app.get("/api/maturador/status", async (req, res) => {
  const config = await getMaturadorConfig();
  res.json(config);
});

// Endpoint para receber webhooks da Evolution API
app.post("/api/webhook/evolution", async (req, res) => {
  try {
    const event = req.body;
    // Opcional: Se recebermos webhooks, podemos processar respostas de desconhecidos automaticamente!
    // No entanto, para garantir compatibilidade sem precisar que o usuário configure o webhook obrigatoriamente,
    // o simulador da aba "Auto-Resposta de Desconhecidos" continuará funcionando de forma híbrida.
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: "Internal error" });
  }
});


// --- VITE MIDDLEWARE SETUP FOR DEV VS PRODUCTION ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BDR OS] Server is running 24/7 on port ${PORT}`);
  });
}

startServer();

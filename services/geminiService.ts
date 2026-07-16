
import { GoogleGenAI } from "@google/genai";
import { AgentConfig, Lead } from '../types';

// Helper to fetch image from URL and convert to Base64 for Gemini
const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (typeof window === 'undefined') {
            // Node.js/Server-side
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return buffer.toString('base64');
        } else {
            // Browser-side
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    const clean = base64.split(',')[1];
                    resolve(clean);
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        }
    } catch (e) {
        console.error("Error fetching image for Gemini:", e);
        return null;
    }
}

const findBestLink = (data: Record<string, any>): string | undefined => {
    if (!data) return undefined;
    if (data.link_site) return data.link_site;
    if (data.website) return data.website;
    if (data.dithoSitesMetadata?.publicUrl) return data.dithoSitesMetadata.publicUrl;
    if (data.url) return data.url;
    if (data.site) return data.site;
    if (data.instagram) return data.instagram;
    if (data.facebook) return data.facebook;
    if (data.linkedin) return data.linkedin;

    for (const value of Object.values(data)) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.match(/^(https?:\/\/|www\.)/i)) {
                return trimmed;
            }
        }
    }
    return undefined;
};

export const generateMessageVariations = async (
  baseMessage: string, 
  count: number,
  agent: AgentConfig
): Promise<string[]> => {
  if (!process.env.API_KEY) return [baseMessage];
  const systemContext = agent.prompts?.find(p => p.isActive)?.content || "Seja profissional.";
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Você é um especialista em Copywriting para WhatsApp.
      Aja com o tom: ${agent.tone || 'Profissional'}.
      Instruções do Agente: ${systemContext}
      Tarefa: Reescreva a mensagem abaixo de ${count} formas diferentes.
      Mensagem Original: "${baseMessage}"
      Retorne APENAS um array JSON de strings.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const variations = JSON.parse(response.text || "[]");
    return Array.isArray(variations) ? variations : [baseMessage];
  } catch (error) {
    return [baseMessage];
  }
};

export const refineSystemPrompt = async (currentPrompt: string): Promise<string> => {
    if (!process.env.API_KEY) return currentPrompt;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Melhore o seguinte prompt de sistema para um agente de IA de atendimento ao cliente no WhatsApp:\n\n${currentPrompt}`
        });
        return response.text || currentPrompt;
    } catch (e) {
        return currentPrompt;
    }
}

export const generateAgentMessage = async (agent: AgentConfig, lead: Lead): Promise<string> => {
    const activePrompts = agent.prompts?.filter(p => p.isActive) || [];
    if (activePrompts.length === 0) return `Olá ${lead.name}, tudo bem?`;
    
    const selectedPrompt = activePrompts[Math.floor(Math.random() * activePrompts.length)];

    // MODO ESTÁTICO: Substituição simples sem IA
    if (selectedPrompt.type === 'STATIC') {
        let text = selectedPrompt.content;
        
        // Substitui variáveis do lead (ex: {{nome}} ou {nome})
        if (lead.data) {
            Object.entries(lead.data).forEach(([key, value]) => {
                // Suporta {{chave}} e {chave}
                const regexDouble = new RegExp(`{{${key}}}`, 'gi');
                const regexSingle = new RegExp(`{${key}}`, 'gi');
                text = text.replace(regexDouble, String(value || '')).replace(regexSingle, String(value || ''));
            });
        }
        
        // Fallback para nome
        text = text.replace(/{{nome}}/gi, lead.name).replace(/{nome}/gi, lead.name);
        
        return text;
    }

    // MODO IA: Chama o Gemini
    if (!process.env.API_KEY) return `Olá ${lead.name}, tudo bem?`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const targetLink = findBestLink(lead.data);
        let dossierContext = lead.data ? Object.entries(lead.data).map(([k,v]) => `- ${k.toUpperCase()}: ${v}`).join("\n") : "";
        
        const prompt = `
            Abordagem comercial WhatsApp.
            Prompt: ${selectedPrompt.content}
            Tom: ${agent.tone || 'Humano'}
            Lead: ${lead.name} | ${lead.phone}
            Dossiê: ${dossierContext}
            Regra Link: ${targetLink ? `USE O LINK ${targetLink}` : 'Sem link.'}
            Escreva a PRIMEIRA mensagem. Curta e humana.
            Retorne APENAS o texto.
        `;

        let parts: any[] = [{ text: prompt }];
        let imageBase64 = lead.data?.print_base64 || (lead.data?.print_url ? await fetchImageAsBase64(lead.data.print_url) : null);

        if (imageBase64) {
             parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "") } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts }
        });
        return response.text?.trim() || `Olá ${lead.name}!`;
    } catch (error) {
        return `Olá ${lead.name}, tudo bem?`;
    }
}

export const generateManualMessage = async (promptContent: string, lead: Lead, imageBase64?: string, useVision: boolean = false): Promise<string> => {
    if (!process.env.API_KEY) return `Olá ${lead.name}, tudo bem?`;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const targetLink = findBestLink(lead.data);
        const dossierContext = lead.data ? Object.entries(lead.data).map(([k,v]) => `- ${k}: ${v}`).join("\n") : "";
        
        const prompt = `
            Cold Call WhatsApp. Strategy: ${promptContent}
            Lead: ${lead.name} | ${lead.phone}
            Data: ${dossierContext}
            Link: ${targetLink || "N/A"}
            Gere a mensagem. Breve.
        `;

        let parts: any[] = [{ text: prompt }];
        if (useVision && imageBase64) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, "") } });
        }
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts }
        });
        return response.text?.trim() || `Olá ${lead.name}`;
    } catch (error) {
        return `Olá ${lead.name}`;
    }
};

export const generateWarmupTurn = async (topic: string, tone: string, history: string[]): Promise<string> => {
    if (!process.env.API_KEY) return "Beleza?";
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Pessoa real WhatsApp. Topico: ${topic}. Tom: ${tone}. Historico: ${history.join('|')}. Responda curto e natural.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        return response.text?.trim() || "Show!";
    } catch (e) {
        return "Beleza!";
    }
};

export const generateWarmupScript = async (
    chips: { id: string, name: string }[],
    pairs: { id1: string, id2: string }[],
    topics: string[],
    tone: string,
    messageCountPerPair: number
): Promise<{ 
    personas: Record<string, string>, 
    messages: { senderId: string, recipientId: string, text: string }[] 
}> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
            Você é um mestre em simulação social para WhatsApp.
            
            === OBJETIVO CRÍTICO ===
            Gerar um roteiro de conversas humanas para maturar chips.
            Você deve gerar conversas PARA CADA DUPLA selecionada. 
            Não ignore nenhuma dupla.
            
            === CONFIGURAÇÃO ===
            Chips: ${JSON.stringify(chips)}
            Duplas Ativas: ${JSON.stringify(pairs)}
            Tópicos: ${topics.join(', ')}
            Tom de voz: ${tone}
            Msgs por Dupla: EXATAMENTE ${messageCountPerPair} mensagens.

            === REGRAS DE OURO ===
            1. CADA MENSAGEM DEVE SER ÚNICA. Proibido repetir textos.
            2. Use gírias brasileiras, erros propositais de digitação (ex: "vose", "blz", "tbm", "eh nois").
            3. Para CADA DUPLA no array 'Duplas Ativas', crie um bloco de ${messageCountPerPair} mensagens.
            4. Se existirem 3 duplas e você deve gerar 10 msgs cada, o total final no array 'messages' DEVE ser 30.
            5. Alterne os remetentes dentro da mesma dupla para parecer um chat real.

            === FORMATO DE RETORNO (JSON APENAS) ===
            {
                "personas": { "ID_DO_CHIP": "Personalidade Curta" },
                "messages": [
                    { "senderId": "ID", "recipientId": "ID", "text": "Texto humano" }
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgrade para o Pro para melhor orquestração de lógica
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                temperature: 0.9
            }
        });

        const data = JSON.parse(response.text || '{"personas":{}, "messages":[]}');
        
        // Não fazemos shuffle aqui para manter a ordem lógica da conversa
        return data;

    } catch (e) {
        console.error("Error generating warmup script:", e);
        throw e;
    }
};

export const generateBlockFromDescription = async (description: string): Promise<any> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Você é um arquiteto de sistemas de automação de WhatsApp.
            Sua tarefa é transformar uma descrição em linguagem natural em um objeto JSON para o sistema Ditho BDR.
            
            O sistema possui 3 camadas:
            1. PEÇA (Block): O componente individual (Texto, Áudio, Imagem, Delay, etc).
            2. MENSAGEM (MessageTemplate): Um balão do WhatsApp, que pode conter uma ou mais Peças (ex: Imagem + Legenda).
            3. FLUXO (Flow): Uma sequência de Mensagens e Delays (ex: Msg 1 -> Espera 10s -> Msg 2).

            === FORMATOS DE RETORNO (JSON) ===

            Se o usuário pedir uma PEÇA:
            {
                "name": "Nome da Peça",
                "type": "TEXT_LITERAL" | "AUDIO_UPLOAD" | "IMAGE_UPLOAD" | "DELAY" | "CONDITIONAL" | "GREETING" | "TEXT_IA",
                "content": { ... }
            }

            Se o usuário pedir uma MENSAGEM (balão):
            {
                "name": "Nome da Mensagem",
                "description": "...",
                "blockIds": ["temp_id_1", "temp_id_2"] 
            }

            Se o usuário pedir um FLUXO (sequência):
            {
                "name": "Nome do Fluxo",
                "description": "...",
                "steps": [
                    { "id": "1", "type": "MESSAGE", "referenceId": "temp_msg_1" },
                    { "id": "2", "type": "DELAY", "config": { "seconds": 30 } },
                    { "id": "3", "type": "MESSAGE", "referenceId": "temp_msg_2" }
                ]
            }

            Descrição do Usuário: "${description}"
            Analise o que o usuário quer e retorne o JSON correspondente.
            Retorne APENAS o JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Error generating block:", e);
        throw e;
    }
};

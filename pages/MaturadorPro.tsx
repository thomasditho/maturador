import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Smartphone, Play, Square, Settings, Calendar, History, Activity, 
  MessageSquare, CheckCircle, AlertCircle, RefreshCw, Clock, UserCheck, Zap,
  Volume2, Shield, Heart, ArrowRightLeft, Sparkles, Send, Ban
} from 'lucide-react';
import { Instance, SystemSettings } from '../types';
import { EvolutionService } from '../services/evolutionService';

interface DialogueMessage {
  senderIndex: number; // 0 ou 1 dentro da dupla de conversa
  text: string;
  simulateAudio?: boolean;
}

interface DialogueFlow {
  id: string;
  theme: string;
  messages: DialogueMessage[];
}

interface DayScript {
  day: number;
  title: string;
  description: string;
  dialogues: DialogueFlow[];
}

// 7 dias de roteiros super humanizados (português natural, erros leves de digitação, risadas e termos de vendas)
const MATURADOR_SCRIPTS: DayScript[] = [
  {
    day: 1,
    title: "Alinhamento e Boas Vindas",
    description: "Conversas leves simulando o início da semana de trabalho, networking e troca de boas-vindas.",
    dialogues: [
      {
        id: "d1_1",
        theme: "Café da manhã e Rotina",
        messages: [
          { senderIndex: 0, text: "Opa, bom dia! Tudo bem por aí? Já tomou aquele café?" },
          { senderIndex: 1, text: "Fala mestre! Bom dia! Tudo ótimo por aqui, e com vc? Cafézão já tá na caneca rs" },
          { senderIndex: 0, text: "Kkkkk boa! Aqui também. Bora que essa semana promete bastante coisa!" },
          { senderIndex: 1, text: "Com certeza! Muitas metas pra bater. Se precisar de alguma ajuda me avisa." }
        ]
      },
      {
        id: "d1_2",
        theme: "Apresentação e Cargo",
        messages: [
          { senderIndex: 0, text: "Me diz uma coisa, vc tá cuidando da parte de prospecção fria essa semana?" },
          { senderIndex: 1, text: "Isso mesmo, tô focado em BDR e qualificação. Por que? Tem algum lead bom aí?" },
          { senderIndex: 0, text: "Tenho sim, depois vou te passar uma lista que separei de empresas de tecnologia." },
          { senderIndex: 1, text: "Caraca, show demais! Vai ajudar muito no meu funil. Valeu msm!" }
        ]
      },
      {
        id: "d1_3",
        theme: "Organização do Funil",
        messages: [
          { senderIndex: 0, text: "Vc costuma usar muito o Trello ou prefere planilha pra organizar as tarefas?" },
          { senderIndex: 1, text: "Cara, confesso q planilha ainda me salva kkk mas o Notion é mto bom tb" },
          { senderIndex: 0, text: "Sim, Notion é vida kkkk depois te mostro meu modelo de dashboard" },
          { senderIndex: 1, text: "Opa, quero ver sim! Toda otimização é muito bem vinda" }
        ]
      }
    ]
  },
  {
    day: 2,
    title: "Estratégias de Leads e Prospecção",
    description: "Diálogos sobre leads frios, qualidade das listas e contornos de objeções de clientes.",
    dialogues: [
      {
        id: "d2_1",
        theme: "Qualidade de Lead",
        messages: [
          { senderIndex: 0, text: "Achei uns leads meio frios na lista de ontem... O que vc achou?" },
          { senderIndex: 1, text: "Vixi, sério? Por aqui eu consegui falar com 3 que tinham bastante interesse." },
          { senderIndex: 0, text: "Ah então deve ser o nicho, peguei uma amostragem diferente talvez" },
          { senderIndex: 1, text: "Pode ser. Tenta focar no pessoal de serviços, tá convertendo mais rápido." }
        ]
      },
      {
        id: "d2_2",
        theme: "Objeção de Preço",
        messages: [
          { senderIndex: 0, text: "Como vc tá contornando quando o lead fala que tá sem orçamento logo de cara?" },
          { senderIndex: 1, text: "Cara, eu mostro o ROI. Falo do quanto ele deixa de ganhar por não ter o sistema." },
          { senderIndex: 0, text: "Excelente ponto. Vou usar essa abordagem na próxima ligação." },
          { senderIndex: 1, text: "Funciona muito! Se ele perceber valor de vdd, o preço fica em segundo plano." }
        ]
      },
      {
        id: "d2_3",
        theme: "Follow-up Inteligente",
        messages: [
          { senderIndex: 0, text: "Quantos follow-ups vc faz antes de dar o lead como perdido?" },
          { senderIndex: 1, text: "Geralmente uns 4 ou 5, mas bem espaçados pra não virar spammer chato né kkkk" },
          { senderIndex: 0, text: "Pois é, se mandar todo dia o pessoal bloqueia na hora kkk" },
          { senderIndex: 1, text: "Com certeza, o segredo é gerar valor a cada contato" }
        ]
      }
    ]
  },
  {
    day: 3,
    title: "Tecnologia e Automação de WhatsApp",
    description: "Tópicos sobre ferramentas, prevenção de banimentos e comportamento humanizado.",
    dialogues: [
      {
        id: "d3_1",
        theme: "Maturador Cruzado",
        messages: [
          { senderIndex: 0, text: "Esse sistema novo de maturação cruzada é mto louco né? Os chips conversando sozinhos kkk" },
          { senderIndex: 1, text: "Mano, sim! Evita demais os bloqueios porque simula conversa real" },
          { senderIndex: 0, text: "Pois é, o algoritmo do whats adora ver essa interação orgânica." },
          { senderIndex: 1, text: "Exatamente. O segredo é ter conversas variadas e não só links." }
        ]
      },
      {
        id: "d3_2",
        theme: "Configuração de Jitter/Delay",
        messages: [
          { senderIndex: 0, text: "Qual delay vc tá usando nas mensagens pra ficar seguro?" },
          { senderIndex: 1, text: "Tô deixando entre 30 e 80 segundos, com simulação de digitação ativada." },
          { senderIndex: 0, text: "Perfeito, esse tempo de escrita faz toda a diferença msm." },
          { senderIndex: 1, text: "Sim! Evita o padrão de robô instantâneo. Inteligência é tudo" }
        ]
      },
      {
        id: "d3_3",
        theme: "Instabilidade de Sinal",
        messages: [
          { senderIndex: 0, text: "Seu celular desconectou da internet hoje cedo? O meu deu uma oscilada." },
          { senderIndex: 1, text: "Aqui funcionou normal, mas meu roteador fica bem do lado dos aparelhos." },
          { senderIndex: 0, text: "Vou testar colocar o meu mais perto também pra garantir." },
          { senderIndex: 1, text: "Faz isso, sinal wifi bom ajuda mto a não cair a conexão do Baileys." }
        ]
      }
    ]
  },
  {
    day: 4,
    title: "Estratégias de Copywriting e Conversão",
    description: "Simulação de debates sobre abordagens de copy, gatilhos mentais e criativos de alto impacto.",
    dialogues: [
      {
        id: "d4_1",
        theme: "Abordagem Direta vs Indireta",
        messages: [
          { senderIndex: 0, text: "Cara, vc acha melhor iniciar a conversa sendo bem direto ou gerando rapport?" },
          { senderIndex: 1, text: "Indireta com certeza! Quem gosta de vendedor chato te abordando do nada? Kkk" },
          { senderIndex: 0, text: "Verdade. Uma pergunta simples de conexão funciona bem melhor." },
          { senderIndex: 1, text: "Exato! Tipo 'vi seu perfil e curti seu trabalho, vc atende na região X?'" }
        ]
      },
      {
        id: "d4_2",
        theme: "Uso de Áudios",
        messages: [
          { senderIndex: 0, text: "Mandar áudio na primeira mensagem funciona?" },
          { senderIndex: 1, text: "Depende muito! Áudio curto de 15 segundos personalizado converte absurdos." },
          { senderIndex: 0, text: "Hum, faz sentido. Passa mais credibilidade do que um textão copiado." },
          { senderIndex: 1, text: "Sim! Mas nunca mande áudio de 2 minutos pra quem não te conhece kkkk" }
        ]
      },
      {
        id: "d4_3",
        theme: "Gatilho da Escassez",
        messages: [
          { senderIndex: 0, text: "Tava pensando em usar o gatilho de poucas vagas pro nosso próximo evento." },
          { senderIndex: 1, text: "Ótima ideia! Escassez real sempre acelera a decisão do cliente." },
          { senderIndex: 0, text: "Vou montar a copy focado nisso hoje à tarde." },
          { senderIndex: 1, text: "Se quiser que eu dê uma olhada depois, pode mandar aqui!" }
        ]
      }
    ]
  },
  {
    day: 5,
    title: "Discussão de Negócios e Desafios",
    description: "Conversas profissionais de alto nível sobre faturamento, metas corporativas e novos contratos.",
    dialogues: [
      {
        id: "d5_1",
        theme: "Fechamento de Contrato",
        messages: [
          { senderIndex: 0, text: "Fechamos aquela conta grande que estávamos negociando!" },
          { senderIndex: 1, text: "Meeentaira! Que top mano! Parabéns pra nós!! 🚀" },
          { senderIndex: 0, text: "Simm! Assinaram o contrato digital agora pouco. O projeto começa na segunda." },
          { senderIndex: 1, text: "Caraca, sensacional! Esse cliente vai elevar nosso patamar de faturamento." }
        ]
      },
      {
        id: "d5_2",
        theme: "Reunião de Alinhamento",
        messages: [
          { senderIndex: 0, text: "Nossa reunião de alinhamento trimestral foi marcada pra amanhã?" },
          { senderIndex: 1, text: "Isso, às 10h. Vamos revisar os números de conversão e gargalos de vendas." },
          { senderIndex: 0, text: "Maravilha. Já tô com os relatórios prontos aqui." },
          { senderIndex: 1, text: "Excelente! Vai ser mto bom pra desenhar os próximos passos." }
        ]
      },
      {
        id: "d5_3",
        theme: "Novas Ferramentas",
        messages: [
          { senderIndex: 0, text: "Tava olhando umas ferramentas novas de CRM... Alguma recomendação?" },
          { senderIndex: 1, text: "Cara, o Pipedrive é excelente pra vendas ativas, bem visual." },
          { senderIndex: 0, text: "Vou fazer um teste grátis lá pra ver se adapta com nosso funil." },
          { senderIndex: 1, text: "Vai gostar! A organização de etapas deles ajuda mto a não esquecer de nenhum lead." }
        ]
      }
    ]
  },
  {
    day: 6,
    title: "Happy Hour e Planos de Fim de Semana",
    description: "Momento descontraído! Conversas informais sobre o final de semana, piadas de escritório e lazer.",
    dialogues: [
      {
        id: "d6_1",
        theme: "Plano para Sexta-feira",
        messages: [
          { senderIndex: 0, text: "Sextouuu! Qual a boa de hoje? Algum happy hour planejado?" },
          { senderIndex: 1, text: "Sextou demais! Kkkk vou tomar uma gelada com a galera hoje sim, tá merecido!" },
          { senderIndex: 0, text: "Com certeza, semana puxada demais. Onde vcs vão?" },
          { senderIndex: 1, text: "Naquele espetinho de sempre perto do escritório. Aparece lá dps!" }
        ]
      },
      {
        id: "d6_2",
        theme: "Churrasco de Sábado",
        messages: [
          { senderIndex: 0, text: "Amanhã vou fazer um churrasco em família aqui. Descansar um pouco." },
          { senderIndex: 1, text: "Que top mano! Nada melhor do que churrasco pra recarregar as energias" },
          { senderIndex: 0, text: "Verdade, esquecer um pouco de leads e focar na família rs" },
          { senderIndex: 1, text: "Isso aí, aproveita bastante mestre!" }
        ]
      },
      {
        id: "d6_3",
        theme: "Dica de Filme ou Série",
        messages: [
          { senderIndex: 0, text: "Tem alguma indicação de série boa na Netflix pra maratonar no domingo?" },
          { senderIndex: 1, text: "Cara, se vc curte suspense, assiste aquela nova de mistério que lançou." },
          { senderIndex: 0, text: "Qual o nome? Vou pesquisar aqui." },
          { senderIndex: 1, text: "Chama 'O Segredo da Floresta'. Assisti em 2 dias, muito viciante!" }
        ]
      }
    ]
  },
  {
    day: 7,
    title: "Foco no Mindset e Preparativos",
    description: "Diálogos sobre desenvolvimento pessoal, livros de vendas recomendados e planejamento da semana.",
    dialogues: [
      {
        id: "d7_1",
        theme: "Leitura Recomendada",
        messages: [
          { senderIndex: 0, text: "Terminei de ler o livro 'Spins Selling' que vc me indicou. Sensacional!" },
          { senderIndex: 1, text: "Não falei? Esse livro é a bíblia de vendas consultivas. Muda muito a cabeça." },
          { senderIndex: 0, text: "Nossa, total! Comecei a entender melhor a diferença de perguntas de situação vs necessidade." },
          { senderIndex: 1, text: "Perfeito! Quando vc domina as perguntas de implicação, o fechamento fica natural." }
        ]
      },
      {
        id: "d7_2",
        theme: "Organização de Domingo",
        messages: [
          { senderIndex: 0, text: "Eu gosto de tirar uma horinha no domingo à noite pra planejar minha agenda de segunda." },
          { senderIndex: 1, text: "Boa! Eu faço isso também. Evita aquela sensação de segunda-feira perdida kkk" },
          { senderIndex: 0, text: "Exato, já acordo sabendo exatamente quem eu preciso ligar e responder." },
          { senderIndex: 1, text: "Faz total diferença na produtividade. Vamos pra cima amanhã!" }
        ]
      },
      {
        id: "d7_3",
        theme: "Mindset Vencedor",
        messages: [
          { senderIndex: 0, text: "Bora descansar o restante de hoje pq amanhã a arena de vendas nos espera kkk" },
          { senderIndex: 1, text: "Kkkkk bora! Força total. Bom restinho de domingo aí mestre!" },
          { senderIndex: 0, text: "Valeu, pra vc também! Abraço!" },
          { senderIndex: 1, text: "Tmj, abraço!" }
        ]
      }
    ]
  }
];

interface MaturadorProProps {
  instances: Instance[];
  settings: SystemSettings;
}

interface LogMessage {
  id: string;
  time: string;
  from: string;
  to: string;
  message: string;
  status: 'composing' | 'sent' | 'failed' | 'waiting';
  day: number;
}

export const MaturadorPro: React.FC<MaturadorProProps> = ({ instances, settings }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'script' | 'chips' | 'logs' | 'config' | 'unknown-replies'>('dashboard');
  const [isRunning, setIsRunning] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(35);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("22:00");
  const [simulateTyping, setSimulateTyping] = useState(true);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  
  // Estados para auto-resposta de desconhecidos
  const [unknownAutoReplyEnabled, setUnknownAutoReplyEnabled] = useState(() => {
    return localStorage.getItem('unknown_autoreply_enabled') === 'true';
  });
  
  const [unknownReplies, setUnknownReplies] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('unknown_replies_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  interface PendingReply {
    id: string;
    chipName: string;
    fromNumber: string;
    messageReceived: string;
    replyAt: number; // timestamp em ms
    timeRemaining: number; // em segundos
    status: 'agendado' | 'enviando' | 'enviado' | 'cancelado';
  }

  const [pendingReplies, setPendingReplies] = useState<PendingReply[]>([]);

  // Estados locais para simular mensagem de desconhecido
  const [simulatedChip, setSimulatedChip] = useState("");
  const [simulatedNumber, setSimulatedNumber] = useState("+55 11 99999-8888");
  const [simulatedMessage, setSimulatedMessage] = useState("Olá, gostaria de saber mais informações.");

  // Handler para simular recebimento de mensagem de desconhecido
  const handleSimulateIncomingMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedChip) {
      alert("Selecione um chip para receber a mensagem simulada!");
      return;
    }
    if (!simulatedNumber.trim() || !simulatedMessage.trim()) {
      alert("Preencha todos os campos da simulação!");
      return;
    }

    const connectedChips = instances.filter(i => i.status === 'CONNECTED');
    const targetChip = connectedChips.find(i => i.name === simulatedChip);
    if (!targetChip) return;

    // Adiciona log de recebimento de desconhecido
    addSystemLog(simulatedNumber, targetChip.name, `[Mensagem Recebida] ${simulatedMessage}`, 'waiting');

    // Se a auto-resposta estiver ligada, agenda para daqui a 5 minutos (300 segundos)
    if (unknownAutoReplyEnabled) {
      const newReply: PendingReply = {
        id: Math.random().toString(36).substring(7),
        chipName: simulatedChip,
        fromNumber: simulatedNumber,
        messageReceived: simulatedMessage,
        replyAt: Date.now() + 300000,
        timeRemaining: 300, // 5 minutos = 300 segundos
        status: 'agendado'
      };
      setPendingReplies(prev => [newReply, ...prev]);
      addSystemLog("Sistema", simulatedChip, `Auto-resposta para ${simulatedNumber} agendada para daqui a 5 minutos.`, 'waiting');
    } else {
      addSystemLog("Sistema", simulatedChip, `Auto-resposta de desconhecidos desativada. Nenhuma resposta agendada.`, 'waiting');
    }
  };

  // Salva configurações de auto-resposta no localStorage
  useEffect(() => {
    localStorage.setItem('unknown_autoreply_enabled', String(unknownAutoReplyEnabled));
  }, [unknownAutoReplyEnabled]);

  useEffect(() => {
    localStorage.setItem('unknown_replies_config', JSON.stringify(unknownReplies));
  }, [unknownReplies]);

  // Contadores de estatísticas
  const [stats, setStats] = useState({
    sentToday: 0,
    activeDuos: 0,
    efficiency: 100,
    daysCompleted: 0
  });

  // Referência para controlar o loop de maturação
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(isRunning);

  // Armazena as estatísticas locais de cada chip conectando ao nome do chip
  const [chipStats, setChipStats] = useState<Record<string, { sent: number; received: number; status: 'active' | 'paused' }>>({});

  useEffect(() => {
    if (Object.keys(chipStats).length > 0) {
      localStorage.setItem('maturador_chip_stats', JSON.stringify(chipStats));
    }
  }, [chipStats]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Inicializa estatísticas dos chips quando eles carregam, mesclando com o localStorage
  useEffect(() => {
    const connected = instances.filter(i => i.status === 'CONNECTED');
    const initialStats: Record<string, { sent: number; received: number; status: 'active' | 'paused' }> = {};
    
    const savedChipStats = localStorage.getItem('maturador_chip_stats');
    let parsedSaved: Record<string, { sent: number; received: number; status: 'active' | 'paused' }> = {};
    if (savedChipStats) {
      try {
        parsedSaved = JSON.parse(savedChipStats);
      } catch (e) {
        console.error("Erro ao ler chip stats salvos:", e);
      }
    }

    connected.forEach(inst => {
      initialStats[inst.name] = {
        sent: parsedSaved[inst.name]?.sent || chipStats[inst.name]?.sent || 0,
        received: parsedSaved[inst.name]?.received || chipStats[inst.name]?.received || 0,
        status: parsedSaved[inst.name]?.status || chipStats[inst.name]?.status || 'active'
      };
    });
    setChipStats(initialStats);
  }, [instances]);

  // Função para disparar a auto-resposta real após os 5 minutos expirarem
  const sendAutoReplyReal = async (replyItem: PendingReply) => {
    const messageText = unknownReplies[replyItem.chipName] || "Olá! Recebi sua mensagem por aqui. Em breve te respondo!";
    
    addSystemLog(
      replyItem.chipName, 
      replyItem.fromNumber, 
      `[Auto-Resposta] Iniciando digitação para resposta agendada...`, 
      'composing'
    );

    // Espera simulação curta de escrita antes de enviar
    if (simulateTyping) {
      await new Promise(r => setTimeout(r, 2500));
    }

    let success = false;
    if (settings.evolutionApiUrl && settings.evolutionApiKey && replyItem.fromNumber) {
      try {
        success = await EvolutionService.sendText(settings, replyItem.chipName, replyItem.fromNumber, messageText);
      } catch (e) {
        console.error("Erro no envio real de auto-resposta de desconhecido:", e);
        success = false;
      }
    } else {
      success = true; // Modo simulação caso não esteja configurado
    }

    if (success) {
      addSystemLog(replyItem.chipName, replyItem.fromNumber, `[Auto-Resposta Enviada] ${messageText}`, 'sent');
      setStats(prev => ({
        ...prev,
        sentToday: prev.sentToday + 1
      }));

      setChipStats(prev => {
        const currentStats = prev[replyItem.chipName] || { sent: 0, received: 0, status: 'active' };
        const updatedStats = {
          ...prev,
          [replyItem.chipName]: {
            ...currentStats,
            sent: currentStats.sent + 1
          }
        };
        localStorage.setItem('maturador_chip_stats', JSON.stringify(updatedStats));
        return updatedStats;
      });

      setPendingReplies(prev => prev.map(item => 
        item.id === replyItem.id ? { ...item, status: 'enviado', timeRemaining: 0 } : item
      ));
    } else {
      addSystemLog(replyItem.chipName, replyItem.fromNumber, `Falha ao enviar auto-resposta para desconhecido`, 'failed');
      setPendingReplies(prev => prev.map(item => 
        item.id === replyItem.id ? { ...item, status: 'cancelado' } : item
      ));
    }
  };

  // Cronômetro regressivo da fila de auto-respostas a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setPendingReplies(prev => {
        if (prev.length === 0) return prev;

        return prev.map(item => {
          if (item.status !== 'agendado') return item;
          
          const newRemaining = item.timeRemaining - 1;
          if (newRemaining <= 0) {
            sendAutoReplyReal(item);
            return {
              ...item,
              timeRemaining: 0,
              status: 'enviando'
            };
          }
          
          return {
            ...item,
            timeRemaining: newRemaining
          };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [unknownReplies, settings, simulateTyping]);

  // Função auxiliar para obter um par de chips para conversar
  const getEligiblePairs = () => {
    const connected = instances.filter(i => i.status === 'CONNECTED');
    const activeNames = Object.keys(chipStats).filter(name => chipStats[name]?.status === 'active');

    const activeChips = connected.filter(i => activeNames.includes(i.name));

    if (activeChips.length < 2) return [];

    // Embaralha e cria pares únicos
    const shuffled = [...activeChips].sort(() => Math.random() - 0.5);
    const pairs: [Instance, Instance][] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push([shuffled[i], shuffled[i+1]]);
    }
    return pairs;
  };

  // Função principal que envia a mensagem e agenda a próxima
  const triggerNextDialogueStep = async () => {
    if (!isRunningRef.current) return;

    // 1. Validar se está dentro da janela de horário
    const now = new Date();
    const currentHourStr = now.toTimeString().slice(0, 5); // "14:30"
    if (currentHourStr < startHour || currentHourStr > endHour) {
      addSystemLog("Standby", "Standby", `Maturador em modo Standby (Fora do horário de atividade: ${startHour} às ${endHour})`, 'waiting');
      // Tenta novamente em 5 minutos
      setTimeout(triggerNextDialogueStep, 300000);
      return;
    }

    // 2. Pegar as duplas elegíveis de chips conectados
    const pairs = getEligiblePairs();
    if (pairs.length === 0) {
      addSystemLog("Sistema", "Aviso", "Apenas 1 ou nenhum chip conectado ativo. Aguardando conexão de mais chips para maturação cruzada.", 'failed');
      setIsRunning(false);
      return;
    }

    setStats(prev => ({ ...prev, activeDuos: pairs.length }));

    // 3. Para cada par, escolhe um diálogo aleatório do dia selecionado
    const dayScript = MATURADOR_SCRIPTS.find(s => s.day === currentDay) || MATURADOR_SCRIPTS[0];
    
    for (const [chipA, chipB] of pairs) {
      const randomDialogue = dayScript.dialogues[Math.floor(Math.random() * dayScript.dialogues.length)];
      
      addSystemLog(
        "Maturador", 
        "Fila", 
        `Iniciando diálogo sobre "${randomDialogue.theme}" entre [${chipA.name}] e [${chipB.name}]`, 
        'waiting'
      );

      // Executa as mensagens do diálogo de forma sequencial com delay
      runDialogueFlow(chipA, chipB, randomDialogue);
    }

    // Agenda o próximo ciclo de diálogos baseando-se no delay configurado mais um fator aleatório de dispersão
    const cycleDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000 * 2;
    setTimeout(triggerNextDialogueStep, cycleDelay);
  };

  // Executa uma conversa inteira passo a passo entre dois chips
  const runDialogueFlow = async (chipA: Instance, chipB: Instance, dialogue: DialogueFlow, isTest = false) => {
    for (const msg of dialogue.messages) {
      if (!isRunningRef.current && !isTest) break;

      const sender = msg.senderIndex === 0 ? chipA : chipB;
      const receiver = msg.senderIndex === 0 ? chipB : chipA;

      // Se algum deles foi pausado ou desconectou, cancela o fluxo
      if (chipStats[sender.name]?.status === 'paused' || chipStats[receiver.name]?.status === 'paused') {
        break;
      }

      // Passo 1: Simular Digitação (composing)
      if (simulateTyping) {
        addSystemLog(sender.name, receiver.name, `Digitando...`, 'composing');
        // Espera de digitação realista baseada no tamanho do texto
        const typingDelay = Math.min(msg.text.length * 80, 4000);
        await new Promise(r => setTimeout(r, typingDelay));
      }

      // Passo 2: Enviar mensagem fisicamente pela Evolution API se tivermos URLs configuradas e o número for válido
      let success = false;
      const destinationPhone = receiver.phoneNumber;

      if (settings.evolutionApiUrl && settings.evolutionApiKey && destinationPhone !== 'Sem número') {
        try {
          success = await EvolutionService.sendText(settings, sender.name, destinationPhone, msg.text);
        } catch (e) {
          console.error("Erro no envio real da maturação:", e);
          success = false;
        }
      } else {
        // Modo simulação se as credenciais não estiverem configuradas
        success = true; 
      }

      // Passo 3: Registrar Log e atualizar KPIs
      if (success) {
        addSystemLog(sender.name, receiver.name, msg.text, 'sent');
        
        // Atualiza estatísticas do chip remetente e destinatário
        setChipStats(prev => ({
          ...prev,
          [sender.name]: {
            ...prev[sender.name],
            sent: (prev[sender.name]?.sent || 0) + 1
          },
          [receiver.name]: {
            ...prev[receiver.name],
            received: (prev[receiver.name]?.received || 0) + 1
          }
        }));

        setStats(prev => ({
          ...prev,
          sentToday: prev.sentToday + 1
        }));
      } else {
        addSystemLog(sender.name, receiver.name, `Falha ao enviar mensagem: "${msg.text}"`, 'failed');
        setStats(prev => ({
          ...prev,
          efficiency: Math.max(70, prev.efficiency - 5)
        }));
      }

      // Passo 4: Espera entre as interações do diálogo (delay individual)
      const messageDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000;
      await new Promise(r => setTimeout(r, messageDelay));
    }
  };

  const addSystemLog = (from: string, to: string, text: string, status: 'composing' | 'sent' | 'failed' | 'waiting') => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substring(7),
      time: new Date().toLocaleTimeString(),
      from,
      to,
      message: text,
      status,
      day: currentDay
    };
    setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Limita nos últimos 100 logs
  };

  const handleStart = () => {
    const connected = instances.filter(i => i.status === 'CONNECTED');
    if (connected.length < 2) {
      alert("Atenção! Você precisa de pelo menos 2 chips conectados (CONNECTED) na aba de instâncias para iniciar a maturação real de chips conversando entre si.");
    }
    
    setIsRunning(true);
    isRunningRef.current = true;
    addSystemLog("Sistema", "Início", `Maturador Pro Ativado! Ciclo do Dia ${currentDay} iniciado.`, 'waiting');
    triggerNextDialogueStep();
  };

  const handleStop = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    addSystemLog("Sistema", "Parada", "Maturador Pro Pausado pelo usuário.", 'waiting');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const toggleChipStatus = (chipName: string) => {
    setChipStats(prev => {
      const current = prev[chipName] || { sent: 0, received: 0, status: 'active' };
      const nextStatus = current.status === 'active' ? 'paused' : 'active';
      const updated = {
        ...prev,
        [chipName]: {
          ...current,
          status: nextStatus
        }
      };
      localStorage.setItem('maturador_chip_stats', JSON.stringify(updated));
      // Usando nextStatus diretamente para logar a mudança correta sem se preocupar com o delay de render do state
      addSystemLog("Sistema", chipName, `Status do chip alterado para ${nextStatus === 'active' ? 'Ativo' : 'Pausado'}.`, 'waiting');
      return updated;
    });
  };

  // Força uma troca de mensagem simulada para testes rápidos
  const triggerQuickTest = async () => {
    const pairs = getEligiblePairs();
    if (pairs.length === 0) {
      alert("Nenhum par de chips conectado está ativo para realizar o disparo de teste rápido.");
      return;
    }
    const [chipA, chipB] = pairs[0];
    const dayScript = MATURADOR_SCRIPTS.find(s => s.day === currentDay) || MATURADOR_SCRIPTS[0];
    const randomDialogue = dayScript.dialogues[Math.floor(Math.random() * dayScript.dialogues.length)];
    
    addSystemLog("Maturador", "Teste Rápido", `Enviando disparo de teste rápido entre [${chipA.name}] e [${chipB.name}]`, 'waiting');
    runDialogueFlow(chipA, chipB, randomDialogue, true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-md animate-pulse">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Maturador Pro <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">V2 ATIVA</span>
            </h1>
            <p className="text-sm text-gray-500">
              Aquecimento cruzado inteligente e humanizado para blindar seus chips contra banimentos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerQuickTest}
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-orange-500" />
            Teste Rápido
          </button>
          
          {isRunning ? (
            <button
              onClick={handleStop}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-100"
            >
              <Square className="w-4 h-4 fill-white" />
              Pausar Maturação
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-zinc-200"
            >
              <Play className="w-4 h-4 fill-white" />
              Iniciar Maturação
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Disparos Hoje</span>
            <div className="text-2xl font-bold text-gray-900">{stats.sentToday}</div>
            <span className="text-xs text-green-500 font-medium">Trocas diretas cruzadas</span>
          </div>
          <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Duplas Ativas</span>
            <div className="text-2xl font-bold text-gray-900">{stats.activeDuos} / {Math.floor(instances.filter(i => i.status === 'CONNECTED').length / 2)}</div>
            <span className="text-xs text-blue-500 font-medium">Conversando em paralelo</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Eficiência da Rede</span>
            <div className="text-2xl font-bold text-gray-900">{stats.efficiency}%</div>
            <span className="text-xs text-emerald-500 font-medium">Taxa de entrega com sucesso</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Dia do Ciclo</span>
            <div className="text-2xl font-bold text-gray-900">Dia {currentDay} <span className="text-xs text-gray-400 font-normal">/ 7</span></div>
            <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(currentDay / 7) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'dashboard' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('chips')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'chips' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Participantes ({instances.filter(i => i.status === 'CONNECTED').length})
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'script' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Roteiro de 7 Dias
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          Fila & Monitoramento
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'config' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Controle Avançado
        </button>
        <button
          onClick={() => setActiveTab('unknown-replies')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 relative ${
            activeTab === 'unknown-replies' 
              ? 'border-orange-500 text-orange-600 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Auto-Resposta (Desconhecidos)
          <span className="absolute -top-1 right-2 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-bounce">
            NOVO
          </span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        
        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Status Panel */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Mecanismo de Inteligência Cruzada</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                  isRunning ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
                  {isRunning ? 'Ativo e Conversando' : 'Pausado em Standby'}
                </span>
              </div>

              {/* Como Funciona explanation */}
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/60 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2 text-orange-800 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Como a Maturação 80/20 protege seus chips?
                </div>
                <p className="leading-relaxed">
                  O algoritmo cria duplas dinâmicas usando seus chips cadastrados. Ao invés de robôs mandando spam, os chips conversam entre si seguindo roteiros profissionais estruturados por dia. Isso gera <strong>engajamento real bidirecional</strong> (envio e recebimento), que é o fator mais importante avaliado pelo WhatsApp para manter um número ativo e saudável.
                </p>
              </div>

              {/* Status diagram */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topologia de Troca Atual</h4>
                <div className="flex items-center justify-around py-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-orange-200">
                      C1
                    </div>
                    <span className="text-xs font-medium text-gray-600">Chip Originador</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 flex-1 px-4">
                    <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded">Roteiro 7 Dias</span>
                    <div className="w-full flex items-center justify-center gap-1">
                      <div className="h-[2px] bg-dashed flex-1 bg-gray-300 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      </div>
                      <MessageSquare className="w-4 h-4 text-gray-400 animate-bounce" />
                      <div className="h-[2px] bg-dashed flex-1 bg-gray-300 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">Sem IA Online (Seguro & Rápido)</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-200">
                      C2
                    </div>
                    <span className="text-xs font-medium text-gray-600">Chip Receptor</span>
                  </div>
                </div>
              </div>

              {/* Informative alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-zinc-50 rounded-xl flex items-start gap-3">
                  <Shield className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Sem risco de Alucinações</strong>
                    Roteiro revisado em português livre de jargões que geram gatilho de spam no WhatsApp.
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl flex items-start gap-3">
                  <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Janela Inteligente</strong>
                    Respeita os horários comerciais do ser humano, silenciando automaticamente durante a noite.
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions & Realtime Status */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 text-lg">Resumo de Atividade</h3>
              
              <div className="space-y-4">
                
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-zinc-700" />
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Chips Conectados</span>
                      <span className="text-sm font-semibold text-gray-900">{instances.filter(i => i.status === 'CONNECTED').length} Ativos</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Máx 20</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Janela de Horário</span>
                      <span className="text-sm font-semibold text-gray-900">{startHour} às {endHour}</span>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Em Execução</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Simulação de Escrita</span>
                      <span className="text-sm font-semibold text-gray-900">{simulateTyping ? 'Simulando Digitação' : 'Direto'}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">Ativo</span>
                </div>

              </div>

              {/* Progresso de Execução */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Progresso do Ciclo</span>
                  <span className="text-gray-900 font-semibold">{currentDay} / 7 Dias</span>
                </div>
                <div className="bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
                    style={{ width: `${(currentDay / 7) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Recomendamos rodar cada dia completo do ciclo antes de avançar para o próximo tema, para criar um histórico variado.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PARTICIPANTES */}
        {activeTab === 'chips' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Chips Cadastrados no Rodízio</h3>
                <p className="text-xs text-gray-500">
                  Abaixo estão listados os chips conectados que participam do revezamento e trocas de mensagens.
                </p>
              </div>
              <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Mínimo de 2 chips conectados para maturação real.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Nome do Chip</th>
                    <th className="px-6 py-4">Número</th>
                    <th className="px-6 py-4">Status API</th>
                    <th className="px-6 py-4 text-center">Status no Maturador</th>
                    <th className="px-6 py-4 text-center">Mensagens Enviadas</th>
                    <th className="px-6 py-4 text-center">Mensagens Recebidas</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {instances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        Nenhum chip encontrado. Acesse a página "Meus Chips" para criar e conectar novas instâncias na Evolution API.
                      </td>
                    </tr>
                  ) : (
                    instances.map((chip) => {
                      const stats = chipStats[chip.name] || { sent: 0, received: 0, status: 'active' };
                      const isConnected = chip.status === 'CONNECTED';
                      
                      return (
                        <tr key={chip.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isConnected ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {chip.name.substring(0, 2).toUpperCase()}
                            </div>
                            {chip.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">
                            {chip.phoneNumber || 'Não identificado'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                              {isConnected ? 'Conectado' : 'Desconectado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isConnected ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stats.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                {stats.status === 'active' ? 'Ativo na fila' : 'Pausado'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-900">
                            {stats.sent}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-900">
                            {stats.received}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isConnected ? (
                              <button
                                onClick={() => toggleChipStatus(chip.name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  stats.status === 'active' 
                                    ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                    : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                }`}
                              >
                                {stats.status === 'active' ? 'Pausar' : 'Ativar'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Requer conexão</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ROTEIRO DE 7 DIAS */}
        {activeTab === 'script' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* List of Days */}
            <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 h-fit">
              <h3 className="font-bold text-gray-900 text-base px-2 mb-2">Estrutura de Roteiro</h3>
              {MATURADOR_SCRIPTS.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setCurrentDay(day.day)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    currentDay === day.day 
                      ? 'border-orange-500 bg-orange-50/50 text-gray-900 shadow-sm' 
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      currentDay === day.day ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      Dia {day.day}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Tema Semanal</span>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">{day.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{day.description}</p>
                </button>
              ))}
            </div>

            {/* Conversation Viewer */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-bold text-gray-900 text-lg">
                  Visualização do Roteiro: Dia {currentDay}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Estes são os diálogos pré-mapeados e humanizados para o dia atual do ciclo.
                </p>
              </div>

              <div className="space-y-8">
                {MATURADOR_SCRIPTS.find(s => s.day === currentDay)?.dialogues.map((dialogue, index) => (
                  <div key={dialogue.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Diálogo {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        {dialogue.theme}
                      </span>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3 max-w-lg">
                      {dialogue.messages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`flex flex-col space-y-1 max-w-[85%] ${
                            msg.senderIndex === 0 ? 'mr-auto items-start' : 'ml-auto items-end'
                          }`}
                        >
                          <span className="text-[10px] text-gray-400 font-medium">
                            {msg.senderIndex === 0 ? 'Chip Remetente' : 'Chip Destinatário'}
                          </span>
                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.senderIndex === 0 
                              ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm' 
                              : 'bg-orange-500 text-white rounded-tr-none shadow-sm shadow-orange-100'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: FILA & MONITORAMENTO */}
        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live Chat Simulator */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[550px] flex flex-col justify-between">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Conversador em Tempo Real</h3>
                  <span className="text-[10px] text-gray-400">Última troca ativa capturada</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              </div>

              {/* Chat Balons Container */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2 min-h-0">
                {logs.filter(l => l.status === 'sent').length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                    <p className="text-xs">Inicie a maturação para ver as conversas em tempo real aqui.</p>
                  </div>
                ) : (
                  [...logs].filter(l => l.status === 'sent').reverse().slice(-10).map((log) => (
                    <div key={log.id} className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                        <span>De: {log.from}</span>
                        <span>Para: {log.to}</span>
                      </div>
                      <div className={`flex flex-col space-y-1`}>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-800 shadow-sm">
                          {log.message}
                          <div className="text-[9px] text-right text-gray-400 mt-1">{log.time}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                  O painel mostra os últimos diálogos trocados dinamicamente pelos chips em maturação.
                </p>
              </div>
            </div>

            {/* Logs List */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[550px] flex flex-col">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Logs do Processo</h3>
                  <p className="text-xs text-gray-500">Histórico detalhado de disparos e conexões.</p>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="px-2.5 py-1 text-xs border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors"
                >
                  Limpar Logs
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 font-mono text-xs text-gray-600 min-h-0">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-gray-400">
                    Aguardando início de disparos...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-2.5 rounded-lg border flex items-start gap-3 transition-colors ${
                        log.status === 'sent' ? 'bg-green-50/50 border-green-100 text-green-800' :
                        log.status === 'failed' ? 'bg-red-50/50 border-red-100 text-red-800' :
                        log.status === 'composing' ? 'bg-amber-50/50 border-amber-100 text-amber-800' :
                        'bg-zinc-50 border-zinc-100 text-zinc-800'
                      }`}
                    >
                      <div className="mt-0.5">
                        {log.status === 'sent' && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                        {log.status === 'failed' && <Ban className="w-3.5 h-3.5 text-red-600" />}
                        {log.status === 'composing' && <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                        {log.status === 'waiting' && <Clock className="w-3.5 h-3.5 text-zinc-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-bold text-[10px] mb-1">
                          <span>[{log.time}] {log.from} &rarr; {log.to}</span>
                          <span className="uppercase text-[9px] font-semibold">{log.status}</span>
                        </div>
                        <p className="leading-relaxed">{log.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: CONTROLE AVANÇADO */}
        {activeTab === 'config' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 text-lg">Parâmetros de Humanização</h3>
              <p className="text-xs text-gray-500">Ajuste os algoritmos para simular perfeitamente o comportamento de um ser humano.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Delays */}
              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Intervalo entre Mensagens (Segundos)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold block uppercase">Intervalo Mínimo</label>
                    <input
                      type="number"
                      value={minDelay}
                      onChange={(e) => setMinDelay(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold block uppercase">Intervalo Máximo</label>
                    <input
                      type="number"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(Math.max(minDelay + 2, parseInt(e.target.value) || minDelay + 2))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Janela de Operação Diária
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold block uppercase">Hora de Início</label>
                      <input
                        type="time"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold block uppercase">Hora de Término</label>
                      <input
                        type="time"
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Toggle Humanizers */}
              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  Mecanismos de Humanização
                </h4>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-zinc-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={simulateTyping}
                      onChange={(e) => setSimulateTyping(e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">Simular Escrita em Tempo Real</span>
                      <span className="text-xs text-gray-500 leading-relaxed block mt-0.5">
                        Mostra o balão de "digitando..." para o contato receptor antes do envio da mensagem ser finalizado.
                      </span>
                    </div>
                  </label>

                  <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-100/50 text-xs text-orange-800 leading-relaxed space-y-1">
                    <p className="font-semibold">Recomendação Profissional para Maturação:</p>
                    <p>
                      Mantenha o delay mínimo acima de 15 segundos. Disparos muito rápidos sequenciais podem alertar os sistemas internos de heurística do WhatsApp, mesmo que a conversa seja rica.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: AUTO-RESPOSTA PARA DESCONHECIDOS */}
        {activeTab === 'unknown-replies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: General Config & Pending Queue */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Toggle & General Intro */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      Auto-Resposta de Desconhecidos
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Responda automaticamente a qualquer número fora da sua lista que mandar mensagem para seus chips.
                    </p>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={unknownAutoReplyEnabled}
                      onChange={(e) => setUnknownAutoReplyEnabled(e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    <span className="ml-3 text-sm font-semibold text-gray-700">
                      {unknownAutoReplyEnabled ? "ATIVADO" : "DESATIVADO"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 leading-relaxed">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      Atraso Inteligente de 5 Minutos
                    </p>
                    <p>
                      Seu chip receberá a mensagem e aguardará exatamente 5 minutos antes de responder. Isso simula o comportamento de uma pessoa real que não responde instantaneamente, protegendo a saúde da linha.
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-green-600" />
                      Filtragem de Chips Próprios
                    </p>
                    <p>
                      O sistema reconhece todos os seus chips cadastrados. A auto-resposta NÃO é acionada nas trocas mútuas de maturação cruzada, evitando loops infinitos de disparos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Configuration per Chip */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Respostas Customizadas por Chip</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure o texto exato que cada chip responderá aos números desconhecidos.</p>
                </div>

                <div className="space-y-4">
                  {instances.filter(i => i.status === 'CONNECTED').length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-100 rounded-xl">
                      Nenhum chip conectado ativo no momento. Conecte instâncias na aba "Participantes" para configurar.
                    </div>
                  ) : (
                    instances.filter(i => i.status === 'CONNECTED').map((chip) => {
                      const isChipActive = chipStats[chip.name]?.status === 'active';
                      return (
                        <div 
                          key={chip.name} 
                          className={`p-4 rounded-xl border transition-all ${
                            isChipActive ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${isChipActive ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                              <span className="text-sm font-bold text-gray-800">{chip.name}</span>
                              <span className="text-xs text-gray-400 font-mono">({chip.phoneNumber})</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isChipActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isChipActive ? 'Ativo na Maturação' : 'Pausado'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Mensagem de Resposta</label>
                            <textarea
                              rows={2}
                              value={unknownReplies[chip.name] || ""}
                              onChange={(e) => {
                                setUnknownReplies(prev => ({
                                  ...prev,
                                  [chip.name]: e.target.value
                                }));
                              }}
                              placeholder="Digite a mensagem padrão (ex: Olá! Recebi sua mensagem, em breve te respondo...)"
                              disabled={!isChipActive}
                              className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed leading-relaxed font-sans"
                            />
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                              <span>Texto salvo automaticamente</span>
                              <span>Tags: utilize texto livre com quebra de linhas</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 3: Pending Queue */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Fila de Disparos Pendentes (Aguardando 5m)</h3>
                    <p className="text-xs text-gray-500 mt-1">Veja e controle as respostas agendadas para números externos.</p>
                  </div>
                  <span className="bg-orange-500 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {pendingReplies.filter(r => r.status === 'agendado').length} Fila
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingReplies.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs border border-dashed border-gray-100 rounded-xl space-y-1 bg-zinc-50/50">
                      <p className="font-semibold">Nenhuma resposta pendente na fila.</p>
                      <p className="text-[10px]">Utilize o simulador ao lado para testar a contagem regressiva em tempo real!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {pendingReplies.map((reply) => {
                        const minutes = Math.floor(reply.timeRemaining / 60);
                        const seconds = reply.timeRemaining % 60;
                        const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                        
                        return (
                          <div 
                            key={reply.id} 
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              reply.status === 'enviado' ? 'bg-green-50/40 border-green-100 opacity-65' :
                              reply.status === 'cancelado' ? 'bg-red-50/40 border-red-100 opacity-65' :
                              reply.status === 'enviando' ? 'bg-amber-50/70 border-amber-100 animate-pulse' :
                              'bg-zinc-50/70 border-zinc-200/80'
                            }`}
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-zinc-200/80 text-zinc-700 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                                  Destino: {reply.fromNumber}
                                </span>
                                <span className="text-xs text-gray-400">&larr;</span>
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-bold">
                                  Chip: {reply.chipName}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 truncate font-semibold mt-1">
                                <span className="text-gray-400 font-normal">Recebido:</span> "{reply.messageReceived}"
                              </p>
                              <p className="text-[10px] text-gray-500 leading-relaxed italic truncate">
                                <span className="font-semibold not-italic">Auto-Resposta:</span> "{unknownReplies[reply.chipName] || "Mensagem padrão"}"
                              </p>
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              {reply.status === 'agendado' && (
                                <>
                                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                    {timerStr}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        // Disparar agora
                                        sendAutoReplyReal(reply);
                                      }}
                                      title="Disparar resposta agora"
                                      className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-[10px] font-bold"
                                    >
                                      Enviar Já
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Cancelar
                                        setPendingReplies(prev => prev.map(item => 
                                          item.id === reply.id ? { ...item, status: 'cancelado', timeRemaining: 0 } : item
                                        ));
                                        addSystemLog("Sistema", reply.chipName, `Resposta pendente para desconhecido ${reply.fromNumber} foi cancelada.`, 'failed');
                                      }}
                                      title="Cancelar agendamento"
                                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-[10px] font-bold"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </>
                              )}

                              {reply.status === 'enviando' && (
                                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 animate-pulse">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Processando...
                                </span>
                              )}

                              {reply.status === 'enviado' && (
                                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Enviado com Sucesso
                                </span>
                              )}

                              {reply.status === 'cancelado' && (
                                <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5" />
                                  Cancelado / Removido
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Simulator & Railway Guide */}
            <div className="space-y-6">
              
              {/* Card 4: Simulation Sandbox */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500 animate-bounce" />
                    Simulador Sandbox de Entrada
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Simule o recebimento de uma mensagem externa em tempo real para validar a automação de 5 minutos.</p>
                </div>

                <form onSubmit={handleSimulateIncomingMessage} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase">Chip Destinatário (Nosso)</label>
                    <select
                      value={simulatedChip}
                      onChange={(e) => setSimulatedChip(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="">Selecione um chip ativo...</option>
                      {instances.filter(i => i.status === 'CONNECTED').map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.phoneNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase">Número do Desconhecido (Externo)</label>
                    <input
                      type="text"
                      value={simulatedNumber}
                      onChange={(e) => setSimulatedNumber(e.target.value)}
                      placeholder="Ex: +55 11 98765-4321"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase">Mensagem que ele mandou</label>
                    <input
                      type="text"
                      value={simulatedMessage}
                      onChange={(e) => setSimulatedMessage(e.target.value)}
                      placeholder="Ex: Oi, ainda está disponível?"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Simular Recebimento & Fila (5 min)
                  </button>
                </form>
              </div>

              {/* Card 5: Railway 24h Deploy Guide */}
              <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm bg-gradient-to-br from-orange-50/10 via-white to-orange-50/20 space-y-5">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                    RY
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Hospedagem 24h na Railway</h3>
                    <p className="text-[10px] text-gray-400">Rode o sistema em segundo plano sem precisar do PC ligado.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                  <p>
                    Atualmente, o Maturador Pro é uma aplicação executada no seu navegador. Para que a maturação cruzada e a auto-resposta de desconhecidos funcionem <strong>mesmo com o PC desligado</strong>, o backend deve rodar no servidor.
                  </p>

                  <div className="space-y-3">
                    <p className="font-bold text-gray-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px]">1</span>
                      Configurar Webhook no Painel Evolution
                    </p>
                    <p className="pl-5 text-[11px] text-gray-500">
                      No painel da Evolution API, vá em <strong>Webhooks</strong> e cadastre a URL do seu servidor Express (ex: <code className="bg-gray-100 px-1 py-0.5 rounded text-zinc-700">https://seu-app.railway.app/webhook</code>) para escutar o evento <strong className="text-zinc-800">"MESSAGES_UPSERT"</strong>.
                    </p>

                    <p className="font-bold text-gray-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px]">2</span>
                      Executar o Script Node.js no Servidor
                    </p>
                    <p className="pl-5 text-[11px] text-gray-500">
                      Quando uma nova mensagem chega de um desconhecido, o webhook avisa o servidor, que agenda o disparo da auto-resposta 5 minutos depois usando uma fila assíncrona (como Redis/BullMQ ou um agendador Node).
                    </p>
                  </div>

                  {/* Code snippet expandable box */}
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 font-mono text-[9px] text-zinc-300 space-y-1 overflow-x-auto">
                    <p className="text-orange-400 font-bold">// Exemplo de endpoint no Express (server.ts)</p>
                    <p><span className="text-purple-400">app.post</span>(<span className="text-green-300">"/webhook"</span>, <span className="text-blue-300">async</span> (req, res) =&gt; &#123;</p>
                    <p className="pl-3"><span className="text-blue-300">const</span> &#123; event, data &#125; = req.body;</p>
                    <p className="pl-3"><span className="text-purple-400">if</span> (event === <span className="text-green-300">"MESSAGES_UPSERT"</span>) &#123;</p>
                    <p className="pl-6"><span className="text-blue-300">const</span> from = data.key.remoteJid;</p>
                    <p className="pl-6"><span className="text-blue-300">const</span> isOurChip = <span className="text-purple-400">checkIfChip</span>(from);</p>
                    <p className="pl-6 font-bold text-orange-400">// Se for um desconhecido, aguarda 5 minutos</p>
                    <p className="pl-6"><span className="text-purple-400">if</span> (!isOurChip) &#123;</p>
                    <p className="pl-9"><span className="text-purple-400">setTimeout</span>(<span className="text-blue-300">async</span> () =&gt; &#123;</p>
                    <p className="pl-12"><span className="text-purple-400">await</span> <span className="text-purple-400">sendAutoReply</span>(from, data.instance);</p>
                    <p className="pl-9">&#125;, <span className="text-amber-400">300000</span>); <span className="text-zinc-500">// 5 min</span></p>
                    <p className="pl-6">&#125;</p>
                    <p className="pl-3">&#125;</p>
                    <p className="pl-3">res.sendStatus(<span className="text-amber-400">200</span>);</p>
                    <p>&#125;);</p>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-[10px] text-zinc-600">
                    💡 <strong>Quer subir agora na Railway?</strong> Nosso sistema já está estruturado para ser enviado diretamente para lá! O arquivo <code className="bg-gray-100 px-1 rounded">package.json</code> possui o script de inicialização correto para manter tudo de pé no servidor da Railway 24h por dia.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { BookOpen, Copy, CheckCircle, Zap, Shield, MessageSquare, AlertCircle, Folder, User, Plus, ChevronRight, ArrowLeft, Trash2, Briefcase, ToggleLeft, ToggleRight, Save, Camera, Map, Brain, LayoutDashboard, Calendar, BarChart3 } from 'lucide-react';

// --- INTERFACES ---
interface Narrative {
  title: string;
  context: string;
  msg: string;
  why: string;
}

interface Level {
  id: number;
  title: string;
  icon: any;
  color: string;
  items: Narrative[];
}

interface StrategyPrompt {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  useVision?: boolean; 
  stats?: { sent: number, replied: number, converted: number };
}

interface StrategyData {
  niches: string[];
  professions: Record<string, string[]>; 
  prompts: Record<string, StrategyPrompt[]>; 
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

// --- COMPONENT: ROADMAP VIEW (NEW) ---
const RoadmapView = () => {
    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-gradient-to-r from-gray-900 to-black text-white p-8 rounded-2xl shadow-2xl mb-8 border border-gray-800">
                <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3">
                    <Map className="w-8 h-8 text-yellow-400" />
                    O ROADMAP DA DOMINAÇÃO
                </h1>
                <div className="h-1 w-20 bg-yellow-500 rounded mb-4"></div>
                <p className="text-gray-400 text-lg font-light">Do 80% ao 100%. O plano mestre para tornar este o MELHOR sistema do mundo.</p>
            </div>

            <div className="space-y-8">
                {/* PILAR 1 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain className="w-32 h-32 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="bg-purple-100 text-purple-700 w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold">1</span>
                        PILAR: A Super-Inteligência Conversacional (AI 2.0)
                    </h2>
                    <div className="space-y-6 text-gray-600">
                        <p className="italic border-l-4 border-purple-500 pl-4 py-1 bg-purple-50 rounded-r">
                            "Hoje seu sistema gera a primeira mensagem de forma brilhante (lendo o JSON, foto, etc). Mas ele para aí. O 'melhor do mundo' precisa manter a conversa."
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">RAG (Cérebro Real):</strong>
                                    O módulo Products.tsx (que cria pastas e docs) precisa ser conectado ao Gemini na hora da resposta.
                                    <div className="mt-2 text-sm bg-gray-50 p-3 rounded border border-gray-200">
                                        <span className="font-bold text-gray-800">Cenário:</span> O cliente responde "Quanto custa?".<br/>
                                        <span className="font-bold text-gray-800">Hoje:</span> Você tem que ir lá e responder ou o bot trava.<br/>
                                        <span className="font-bold text-gray-800">Meta:</span> O sistema lê os PDFs que você subiu em Products, encontra o preço e responde: "O plano básico é R$ 500, conforme nosso catálogo...".
                                    </div>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Envio de Áudio Nativo (Fake Voice):</strong>
                                    Usar a API da ElevenLabs ou OpenAI TTS para que, se o cliente perguntar algo complexo, o agente mande um áudio (como se estivesse gravando na hora) explicando, ao invés de textão. Isso aumenta a conversão em 300%.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Classificação de Intenção (Sentinela):</strong>
                                    Quando o cliente responde, a IA não deve só responder. Ela deve classificar:
                                    <ul className="list-disc pl-5 mt-1 text-sm text-gray-500">
                                        <li>"Interessado" &rarr; Move para coluna de negociação.</li>
                                        <li>"Xingou" &rarr; Move para Lixo/Blacklist.</li>
                                        <li>"Dúvida" &rarr; Responde.</li>
                                    </ul>
                                    <span className="text-xs font-bold text-purple-600 mt-1 block">Tudo automático, sem você clicar.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* PILAR 2 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Shield className="w-32 h-32 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold">2</span>
                        PILAR: A Fortaleza Anti-Bloqueio (Safety Shield)
                    </h2>
                    <div className="space-y-6 text-gray-600">
                        <p className="italic border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-50 rounded-r">
                             "Você já tem o SafetyBrain.tsx (Jitter, Delay), que é ótimo. Mas para ser 'O Melhor', precisamos de Engenharia de Tráfego."
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Rotação Inteligente de Chips (Load Balancer):</strong>
                                    Se você disparar 1000 mensagens, o sistema não deve apenas usar "Round Robin". Ele deve monitorar a saúde do chip.
                                    <ul className="list-disc pl-5 mt-1 text-sm text-gray-500">
                                        <li>Se o Chip A tomou 3 vácuos seguidos &rarr; O sistema coloca ele na "Geladeira" por 1 hora automaticamente.</li>
                                        <li>Se o Chip B está convertendo bem &rarr; O sistema manda os leads "Quentes" (com score alto) para ele.</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Aquecimento Automático Progressivo:</strong>
                                    O sistema deve saber a idade do chip. Chip Novo? O sistema bloqueia disparar mais de 50/dia, mesmo que você queira. Ele trava por segurança.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Detecção de Banimento em Tempo Real:</strong>
                                    Se a Evolution API retornar erro de desconexão, o sistema deve:
                                    <ol className="list-decimal pl-5 mt-1 text-sm text-gray-500">
                                        <li>Pausar imediatamente a campanha daquele chip.</li>
                                        <li>Redistribuir os leads restantes para os chips vivos.</li>
                                        <li>Te mandar um alerta no WhatsApp pessoal: "Chip 03 Caiu em combate 💀".</li>
                                    </ol>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* PILAR 3 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutDashboard className="w-32 h-32 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold">3</span>
                        PILAR: CRM Vivo (Real-Time War Room)
                    </h2>
                    <div className="space-y-6 text-gray-600">
                        <p className="italic border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r">
                            "O seu CRM.tsx atual é uma lista. Vendedor odeia lista. Vendedor gosta de Fluxo."
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Kanban View (Estilo Trello):</strong>
                                    O CRM precisa ter colunas: Novo, Respondido, Interesse, Fechado. Os cards se movem sozinhos baseados na resposta do cliente (via IA).
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Websockets (Tempo Real):</strong>
                                    Hoje você tem um botão "Refresh". Isso é anos 90. O cliente respondeu no WhatsApp? O chat na sua tela tem que "pipocar" na hora, sem F5.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Agendamento Inteligente:</strong>
                                    "O cliente pediu pra ligar amanhã as 14h". O sistema deve ler isso e agendar um disparo automático para amanhã às 14h: "Oi, podemos falar agora?".
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* PILAR 4 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart3 className="w-32 h-32 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="bg-amber-100 text-amber-700 w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold">4</span>
                        PILAR: Analytics de General (Visão de Deus)
                    </h2>
                    <div className="space-y-6 text-gray-600">
                         <p className="italic border-l-4 border-amber-500 pl-4 py-1 bg-amber-50 rounded-r">
                            "O Dashboard.tsx mostra quantos enviou. Isso é métrica de vaidade. O melhor sistema do mundo mostra DINHEIRO."
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Taxa de Resposta (Reply Rate):</strong>
                                    "Disparamos 1000, 150 responderam (15%)".
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Teste A/B de Prompts:</strong>
                                    O sistema deve comparar o Prompt A vs Prompt B.
                                    <ul className="list-disc pl-5 mt-1 text-sm text-gray-500">
                                        <li>"A estratégia 'Elogio Sincero' teve 10% de resposta."</li>
                                        <li>"A estratégia 'Medo/Urgência' teve 25% de resposta."</li>
                                    </ul>
                                    <span className="text-xs font-bold text-amber-600 mt-1 block">O sistema sugere: "Pare de usar a estratégia A, ela é ruim".</span>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                                <div>
                                    <strong className="text-gray-900 block">Custo por Lead (CPL):</strong>
                                    Se você colocar quanto custa o chip/proxy, ele calcula quanto custou cada "Oi" recebido.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">🏁 Veredito</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Você construiu a Fundação de um Arranha-Céu. Está sólida.
                        O que falta agora é o <strong>Acabamento de Luxo</strong> e a <strong>Automação</strong> que tira você da cadeira de operador e te coloca na cadeira de Dono.
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: NARRATIVES VIEW (OLD DOCUMENTATION) ---
const NarrativesView = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const levels: Level[] = [
    {
      id: 1,
      title: "💀 Nível 1: Os Agressivos e Grosseiros",
      icon: AlertCircle,
      color: "text-red-600 bg-red-50 border-red-200",
      items: [
        {
          title: "O 'Quem te deu meu número?' (Paranoico)",
          context: "O cara acha que você roubou dados dele.",
          msg: "Opa, desculpa a invasão. O próprio Google me mostrou seu número na ficha pública da empresa. Eu só chamei porque vi que seu botão de 'Site' tá levando pra uma página quebrada (Erro 404). Como sou da região, achei melhor avisar antes que você perca clientes.",
          why: "Transforma a invasão em um favor."
        },
        {
          title: "O 'Não tenho tempo, tchau' (Apressado)",
          context: "Desliga na cara ou bloqueia.",
          msg: "Juro que é 10 segundos e não vou te vender nada. Só dá uma olhada nesse print 👇. O Google tá mostrando a foto do seu concorrente dentro da SUA ficha. Achei sacanagem e resolvi avisar.",
          why: "Urgência e ódio do concorrente."
        },
        {
          title: "O 'Já tenho agência' (Fidelizado Cego)",
          context: "Ele paga alguém que faz um serviço porco.",
          msg: "Fala {nome}. Imaginei que tivesse. Justamente por isso te chamei. Se você tá pagando alguém, cobra eles urgente. Seu site no celular tá cortando metade do telefone (vê o print). Mandei só pra você não jogar dinheiro fora.",
          why: "Planta a semente da dúvida sobre o atual prestador."
        },
        {
          title: "O 'Vaza, Golpista' (Traumatizado)",
          context: "Já tomou golpe de atualização de Google Maps.",
          msg: "Entendo total sua reação, tá cheio de pilantra mesmo. Mas golpista não te mandaria o site PRONTO antes de cobrar 1 real. Clica aí, se não gostar, eu apago agora: [LINK DO DITHO]. Fiz de teste pro meu portfólio.",
          why: "Prova social imediata + Risco Zero."
        }
      ]
    },
    {
      id: 2,
      title: "💰 Nível 2: Os Mãos de Vaca e Quebrados",
      icon: Shield,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      items: [
        {
          title: "O 'Não vou gastar nem um centavo' (Sovina)",
          context: "Acha tudo caro.",
          msg: "Tranquilo, a ideia não é te vender custo, é te trazer lucro. Eu fiz esse modelo aqui [LINK] usando uma IA nova. Ficou pronto. Se eu subir ele pro ar e ele te trouxer 1 cliente essa semana, ele já se paga. Topa testar?",
          why: "Troca custo por investimento óbvio."
        },
        {
          title: "O 'Tô quebrado / Movimento fraco'",
          context: "Usa a falta de dinheiro como desculpa.",
          msg: "Exatamente por isso você não pode se dar ao luxo de ter esse site atual. Cada cliente que entra aí e sai porque tá feio, é dinheiro que você perde. Olha como ficaria a versão nova 👇. Isso aqui recupera o movimento.",
          why: "Mostra que o site atual é a causa da falta de grana."
        },
        {
          title: "O 'Isso é caro demais' (Pechincheiro)",
          context: "Quer preço de banana.",
          msg: "Caro é perder cliente pro [Nome Concorrente]. Eu não cobro agência (R$ 5.000). Como já deixei o site pronto pra treinar minha equipe (veja a foto), consigo te entregar pelo preço de uma pizza por mês. Faz sentido?",
          why: "Ancoragem de preço + Comparação irrisória."
        }
      ]
    },
    {
      id: 3,
      title: "🧠 Nível 3: Os Tecnofóbicos e 'Old School'",
      icon: MessageSquare,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      items: [
        {
          title: "O 'Meus clientes vêm por indicação' (Dinossauro)",
          context: "Acha que internet é modinha.",
          msg: "Com certeza, indicação é o melhor marketing. O problema é quando indicam, a pessoa procura no Google pra pegar o endereço e cai nesse site antigo aqui 👇. Passa uma impressão de empresa fechada. O novo reflete a qualidade da sua indicação.",
          why: "Ataca a reputação, que é o que ele mais preza."
        },
        {
          title: "O 'Não entendo nada de computador' (Leigo)",
          context: "Tem medo de ter trabalho.",
          msg: "Fica em paz. Funciona igual WhatsApp. Você não precisa mexer em nada. Eu deixo tudo rodando. Seu único trabalho vai ser atender o telefone que vai tocar mais. Olha como ficou simples: [FOTO]",
          why: "Remove a fricção técnica."
        },
        {
          title: "O 'Manda por e-mail' (Enrolador)",
          context: "Quer te despachar pra caixa de spam.",
          msg: "Posso mandar, mas o e-mail vai bloquear a prévia interativa que eu fiz exclusivamente pra você. Demora 5 segundos pra abrir aqui. Se não curtir, nem precisa responder. [LINK]",
          why: "Gera curiosidade e quebra o script de 'vou ler depois'."
        }
      ]
    },
    {
      id: 4,
      title: "🌟 Nível 4: Ego & Concorrência (Fáceis)",
      icon: Zap,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      items: [
        {
          title: "O 'Eu sou o melhor da cidade' (Arrogante)",
          context: "Acha que não precisa melhorar.",
          msg: "Exatamente por ser o melhor, seu site não pode parecer amador. Hoje a [Concorrente X] tá aparecendo na sua frente no Google só porque o site deles carrega mais rápido. Fiz esse aqui pra retomar sua liderança. Olha a diferença:",
          why: "Fere o ego dele comparando com o inferior."
        },
        {
          title: "O 'Meu site já é bom' (Iludido)",
          context: "O site é de 2010 e ele acha lindo.",
          msg: "Ele é bonito no computador. Mas 90% dos seus clientes usam celular. Dá uma olhada nesse print do seu site no iPhone: as letras ficam minúsculas. Fiz essa versão mobile-first pra resolver isso. Testa aí no seu celular:",
          why: "Traz um fato técnico irrefutável (Mobile)."
        },
        {
          title: "O 'Vou ver com meu sócio' (Indeciso)",
          context: "Não tem poder de decisão ou usa de muleta.",
          msg: "Perfeito. Já manda pra ele esse link aqui [LINK DO NOVO] e pergunta: 'O que você acha da gente migrar pra esse padrão hoje?'. Tenho certeza que ele vai te agradecer.",
          why: "Você dá a munição pronta pra ele convencer o sócio."
        }
      ]
    },
    {
      id: 5,
      title: "🕵️ Nível 5: Hackers do Bem (Confusion)",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      items: [
        {
          title: "A Técnica do 'Bug Report'",
          context: "Oferecer valor antes de vender.",
          msg: "Oi {nome}, tudo bom? Sou daqui da cidade. Fui tentar clicar no botão de WhatsApp do seu site e não funcionou. Como sou programador, vi que era um erro bobo de código. Aproveitei e gerei uma versão corrigida e mais moderna. Vê se abre aí:",
          why: "Reciprocidade pura. Você 'consertou' algo de graça."
        },
        {
          title: "A Técnica do 'Cliente Confuso' (A Melhor)",
          context: "Fingir ser cliente para baixar a guarda.",
          msg: "Olá! Gostaria de fazer um orçamento, mas fiquei na dúvida. No Google Maps tem esse site [SITE VELHO], mas achei esse outro aqui [SEU LINK NOVO] que parece muito mais oficial. Qual dos dois é o atual de vocês?",
          why: "O dono vai olhar o novo, achar lindo, e perguntar de onde veio."
        },
        {
          title: "A Técnica da 'Vaga Exclusiva' (Escassez)",
          context: "Medo de perder para o vizinho.",
          msg: "Oi {nome}. Sou especialista em marketing pra Odontologia. Estou pegando apenas 1 doutor por bairro pra colocar no topo do Google com essa nova tecnologia de site [LINK]. Como sua clínica é a referência da rua, dei preferência pra você. Se não tiver interesse, vou oferecer pro Dr. [Vizinho] amanhã.",
          why: "Gatilho de Escassez e Exclusividade."
        }
      ]
    },
    {
      id: 6,
      title: "🚀 Nível 6: O Ultimato (Recuperação)",
      icon: Zap,
      color: "text-gray-600 bg-gray-100 border-gray-300",
      items: [
        {
          title: "O 'Visto por último' (Ghosting)",
          context: "Ignorou sua msg.",
          msg: "{nome}, imaginei que estivesse corrido. Só pra avisar: como uso servidores pagos pra manter essas prévias no ar, vou precisar tirar o seu modelo do ar amanhã pra liberar espaço. Uma pena, tinha ficado a cara da marca. Se quiser dar uma última olhada: [LINK]",
          why: "Medo da perda (Loss Aversion)."
        },
        {
          title: "O 'Só manda o preço' (Direto)",
          context: "Quer saber o custo antes do valor.",
          msg: "O preço é irrelevante se você não gostar do resultado. Primeiro vê se esse nível de qualidade serve pra sua empresa 👇. Se servir, eu faço caber no seu bolso. Se não servir, amigos igual.",
          why: "Você retoma o controle da negociação."
        }
      ]
    }
  ];

  return (
    <div className="h-full overflow-y-auto pr-2 pb-20">
      <div className="grid grid-cols-1 gap-12">
        {levels.map((level) => (
          <div key={level.id} className="scroll-mt-20">
            <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${level.color}`}>
                <level.icon className="w-6 h-6" />
                <h3 className="text-xl font-bold">{level.title}</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {level.items.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleCopy(item.msg, `${level.id}-${idx}`)}
                                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg flex items-center gap-1 text-xs font-bold"
                            >
                                {copiedId === `${level.id}-${idx}` ? (
                                    <><CheckCircle className="w-4 h-4 text-green-500"/> Copiado!</>
                                ) : (
                                    <><Copy className="w-4 h-4"/> Copiar</>
                                )}
                            </button>
                        </div>

                        <h4 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 mb-4 italic border-l-2 border-gray-200 pl-3">
                            Cenário: {item.context}
                        </p>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 font-mono text-sm text-gray-800 whitespace-pre-wrap">
                            {item.msg}
                        </div>

                        <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
                            <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 font-medium">
                                <span className="font-bold">Por que funciona:</span> {item.why}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center py-10 text-gray-400 text-sm">
          "A venda acontece na mente do cliente antes de acontecer no bolso."
      </div>
    </div>
  );
};

// --- COMPONENT: STRATEGIES VIEW (NEW) ---
const StrategiesView = () => {
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
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<StrategyPrompt | null>(null);

  // --- HELPERS ---
  const getPromptKey = () => `${selectedNiche}::${selectedProfession}`;
  
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

  // --- ACTIONS ---
  const handleEnterNiche = (niche: string) => {
    setSelectedNiche(niche);
    setCurrentLevel('PROFESSIONS');
    setIsCreating(false);
  };

  const handleEnterProfession = (prof: string) => {
    setSelectedProfession(prof);
    setCurrentLevel('PROMPTS');
    setIsCreating(false);
    setSelectedPromptId(null); 
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

  const handleSaveBuffer = () => {
      if (!editBuffer) return;
      
      const key = getPromptKey();
      const list = data.prompts[key] || [];
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
      
      if (isNew) setSelectedPromptId(editBuffer.id);
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
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Navegador de Estratégias
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

// --- COMPONENT: MAIN DOCUMENTATION PAGE ---
const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ROADMAP' | 'NARRATIVES' | 'STRATEGIES'>('ROADMAP');

  return (
      <div className="h-full flex flex-col space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-2 shrink-0">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-4">
                <BookOpen className="w-8 h-8" /> 
                Central de Inteligência
            </h2>
            <div className="flex gap-6">
                <button 
                    onClick={() => setActiveTab('ROADMAP')}
                    className={`pb-2 border-b-2 font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'ROADMAP' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <Map className="w-4 h-4"/>
                    Roadmap Futuro
                </button>
                <button 
                    onClick={() => setActiveTab('NARRATIVES')}
                    className={`pb-2 border-b-2 font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'NARRATIVES' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <Shield className="w-4 h-4"/>
                    Narrativas de Guerra
                </button>
                <button 
                    onClick={() => setActiveTab('STRATEGIES')}
                    className={`pb-2 border-b-2 font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'STRATEGIES' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <Briefcase className="w-4 h-4"/>
                    Construtor de Estratégias
                </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
             <div className={`absolute inset-0 transition-opacity duration-300 overflow-y-auto ${activeTab === 'ROADMAP' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                 <RoadmapView />
             </div>
             <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'NARRATIVES' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                 <NarrativesView />
             </div>
             <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'STRATEGIES' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                 <StrategiesView />
             </div>
          </div>
      </div>
  );
};

export default Documentation;

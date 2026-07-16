export interface DialogueMessage {
  senderIndex: number; // 0 ou 1 dentro da dupla de conversa
  text: string;
  simulateAudio?: boolean;
}

export interface DialogueFlow {
  id: string;
  theme: string;
  messages: DialogueMessage[];
}

export interface DayScript {
  day: number;
  title: string;
  description: string;
  dialogues: DialogueFlow[];
}

export const MATURADOR_SCRIPTS: DayScript[] = [
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

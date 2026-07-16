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
          { senderIndex: 0, text: "{Opa, bom dia! Tudo bem por aí?|Eae, bom dia! Tudo certo?|Fala mestre! Bom dia!|Opa, tudo bem?}" },
          { senderIndex: 1, text: "{Fala mestre! Bom dia! Tudo ótimo por aqui, e com vc?|Opa, bom dia! Por aqui tudo certinho, e com vc?|Eae, tudo tranquilo e contigo?|Opa! Tudo bem por aqui, como estão as coisas?}" },
          { senderIndex: 0, text: "{Kkkkk boa! Bora pra cima que essa semana promete!|Haha show de bola! Bora que a semana tá corrida!|Rsrs muito bom! Vamo que vamo que hoje o dia promete!}" },
          { senderIndex: 1, text: "{Com certeza! Se precisar de alguma ajuda me avisa.|Com certeza, mto trabalho pela frente! Qualquer coisa dá um grito.|Tmj, bora produzir! Se precisar de algo, só chamar!}" }
        ]
      },
      {
        id: "d1_2",
        theme: "Apresentação e Cargo",
        messages: [
          { senderIndex: 0, text: "{Me diz uma coisa, vc tá cuidando da parte de prospecção essa semana?|Cara, vc tá focado em qualificação de leads hoje?|Dúvida rápida, vc tá tocando as ligações ativas essa semana?}" },
          { senderIndex: 1, text: "{Isso mesmo, tô focado em BDR e qualificação. Por que? Tem algum lead bom aí?|Sim, sim! Cuidando da triagem e contatos iniciais. Apareceu algo interessante por aí?|Isso, tô na linha de frente prospectando. Tem alguma conta boa na agulha?}" },
          { senderIndex: 0, text: "{Tenho sim, depois vou te passar uma lista que separei.|Tenho sim, separei uns contatos bem quentes aqui.|Com certeza, achei uma lista excelente de empresas de tecnologia. Te passo já já.}" },
          { senderIndex: 1, text: "{Caraca, show demais! Vai ajudar muito no meu funil. Valeu msm!|Nossa, sensacional! Vai agilizar muito meu lado. Valeu!|Massa demais, mestre! Vai salvar minha meta do dia kkkk!}" }
        ]
      },
      {
        id: "d1_3",
        theme: "Organização do Funil",
        messages: [
          { senderIndex: 0, text: "{Vc costuma usar muito o Trello ou prefere planilha pra organizar as tarefas?|Cara, vc organiza suas tarefas no Notion ou usa planilha clássica?|Me tira uma dúvida, qual ferramenta vc usa mais no dia a dia pra organizar as coisas?}" },
          { senderIndex: 1, text: "{Cara, confesso q planilha ainda me salva kkk mas o Notion é mto bom tb|Olha, ainda sou fã das planilhas kkk mas tô migrando pro Notion devagar|Planilha clássica kkkk sou meio das antigas pra isso, mas adoro o Notion tb}" },
          { senderIndex: 0, text: "{Sim, Notion é vida kkkk depois te mostro meu modelo de dashboard|Pois é, Notion organiza tudo perfeitamente. Te passo meu template depois|Concordo totalmente kkk dps te mando um print da minha tela de controle pra vc ver}" },
          { senderIndex: 1, text: "{Opa, quero ver sim! Toda otimização é muito bem vinda|Nossa, quero muito ver! Compartilha aí depois|Show, manda sim! Toda dica de produtividade vale ouro}" }
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
          { senderIndex: 0, text: "{Achei uns leads meio frios na lista de ontem... O que vc achou?|Cara, a lista de leads de ontem tava meio devagar pra vc também?|Achei os contatos da última planilha meio frios, o que achou de lá?}" },
          { senderIndex: 1, text: "{Vixi, sério? Por aqui eu consegui falar com 3 que tinham bastante interesse.|Eita, sério? Por aqui até que rendeu, fechei duas conversas boas.|Putz, por aqui consegui achar uns 2 ou 3 interessados, mas tive que garimpar bastante.}" },
          { senderIndex: 0, text: "{Ah então deve ser o nicho, peguei uma amostragem diferente talvez|Entendi, deve ser o lote que peguei então, azar o meu kkk|Faz sentido, vou mudar a segmentação do meu lado pra testar.}" },
          { senderIndex: 1, text: "{Pode ser. Tenta focar no pessoal de serviços, tá convertendo mais rápido.|Pode crer, foca no setor de serviços ou varejo que tá dando mais jogo essa semana.|Exatamente, qualquer coisa me avisa que cruzamos os dados dps.}" }
        ]
      },
      {
        id: "d2_2",
        theme: "Objeção de Preço",
        messages: [
          { senderIndex: 0, text: "{Como vc tá contornando quando o lead fala que tá sem orçamento logo de cara?|O que vc fala quando o cliente diz que o preço tá alto antes de ver a demo?|Qual o seu script padrão pra contornar objeção de orçamento no início?}" },
          { senderIndex: 1, text: "{Cara, eu mostro o ROI. Falo do quanto ele deixa de ganhar por não ter o sistema.|Eu foco no valor agregado. Mostro quanto dinheiro ele perde por dia sem nossa solução.|Eu reverto pro custo de oportunidade. Pergunto quanto custa pra ele continuar com o problema atual.}" },
          { senderIndex: 0, text: "{Excelente ponto. Vou usar essa abordagem na próxima ligação.|Gostei muito dessa linha de raciocínio. Vou testar na minha próxima abordagem.|Verdade, tocar na dor do bolso do cliente é o melhor caminho kkk.}" },
          { senderIndex: 1, text: "{Funciona muito! Se ele perceber valor de vdd, o preço fica em segundo plano.|Dá muito certo! Se o cliente vê valor real, ele acha verba de onde não tem kkk.|Com certeza, mestre! Vai na fé que essa abordagem não falha.}" }
        ]
      },
      {
        id: "d2_3",
        theme: "Follow-up Inteligente",
        messages: [
          { senderIndex: 0, text: "{Quantos follow-ups vc faz antes de dar o lead como perdido?|Vc costuma tentar contato quantas vezes antes de arquivar o lead?|Qual é a sua cadência ideal de follow-ups hoje?}" },
          { senderIndex: 1, text: "{Geralmente uns 4 ou 5, mas bem espaçados pra não virar spammer chato né kkkk|Faço uns 4 contatos em canais diferentes, mas sem forçar a barra pra não bloquear kkk|Geralmente 5 tentativas em 2 semanas, mantendo sempre o tom consultivo e amigável.}" },
          { senderIndex: 0, text: "{Pois é, se mandar todo dia o pessoal bloqueia na hora kkk|Verdade, se for chato o block vem em segundos kkkk|Concordo, o limite entre persistência e chatice é bem tênue.}" },
          { senderIndex: 1, text: "{Com certeza, o segredo é gerar valor a cada contato|Exato! Mandar sempre um insight novo ou dica pro negócio dele.|Isso aí! Foco na utilidade e não só na cobrança comercial.}" }
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
          { senderIndex: 0, text: "{Esse sistema novo de maturação cruzada é mto louco né? Os chips conversando sozinhos kkk|Mano, essa parada de maturação cruzada em nuvem é genial né?|Olha que loucura esse robô simulando conversação entre nossos chips kkk}" },
          { senderIndex: 1, text: "{Mano, sim! Evita demais os bloqueios porque simula conversa real|Sim! É outro nível, o WhatsApp entende como interação legítima.|Total! Ajuda demais a aquecer o chip novo sem risco de denúncia.}" },
          { senderIndex: 0, text: "{Pois é, o algoritmo do whats adora ver essa interação orgânica.|Exato, como tem ida e volta de mensagem, a pontuação do chip sobe mto.|Verdade, a inteligência do sistema em variar os tempos é perfeita.}" },
          { senderIndex: 1, text: "{Exatamente. O segredo é ter conversas variadas e não só links.|Pois é, nada de mandar link direto, conversa leve e fluida é a chave.|Com certeza, é o que garante a durabilidade dos chips de disparo.}" }
        ]
      },
      {
        id: "d3_2",
        theme: "Configuração de Jitter/Delay",
        messages: [
          { senderIndex: 0, text: "{Qual delay vc tá usando nas mensagens pra ficar seguro?|Quantos segundos de intervalo vc deixa entre cada disparo por segurança?|Qual a sua configuração de delay favorita pras automações?}" },
          { senderIndex: 1, text: "{Tô deixando entre 30 e 80 segundos, com simulação de digitação ativada.|Uso de 15 a 45 segundos, sempre variando o tempo para não virar padrão repetitivo.|Cara, deixo de 20 a 50 segundos. E sempre com simulação de digitação ligada kkk.}" },
          { senderIndex: 0, text: "{Perfeito, esse tempo de escrita faz toda a diferença msm.|Show, a escrita artificial antes do envio deixa super humano.|Muito bom, esse Jitter randômico é o calcanhar de aquiles do filtro de spam deles.}" },
          { senderIndex: 1, text: "{Sim! Evita o padrão de robô instantâneo. Inteligência é tudo|Exatamente, o robô do WhatsApp fica perdido com o tempo variável kkk.|Sem dúvidas, segurança em primeiro lugar sempre.}" }
        ]
      },
      {
        id: "d3_3",
        theme: "Instabilidade de Sinal",
        messages: [
          { senderIndex: 0, text: "{Seu celular desconectou da internet hoje cedo? O meu deu uma oscilada.|Teve alguma queda de conexão por aí hoje cedo? Meu sinal wifi deu ruim.|Seu sinal de rede deu alguma instabilidade de manhã?}" },
          { senderIndex: 1, text: "{Aqui funcionou normal, mas meu roteador fica bem do lado dos aparelhos.|Por aqui tudo normal, mas meu celular fica fixo no carregador e bem perto do sinal.|Ih, por aqui deu uma piscada mas voltou rápido. Deixei o 4G ativo por garantia.}" },
          { senderIndex: 0, text: "{Vou testar colocar o meu mais perto também pra garantir.|Vou fazer o mesmo aqui pra evitar desconexões bobas.|Boa ideia, vou revezar a rede pra ver se melhora também.}" },
          { senderIndex: 1, text: "{Faz isso, sinal wifi bom ajuda mto a não cair a conexão do Baileys.|Isso aí, estabilidade é tudo pra manter as sessões ativas 24h.|Faz sim, vai poupar mta dor de cabeça com chip desconectando.}" }
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
          { senderIndex: 0, text: "{Cara, vc acha melhor iniciar a conversa sendo bem direto ou gerando rapport?|Vc prefere abordar o cliente direto no ponto ou iniciar com uma conversa amigável?|Qual tipo de abordagem fria tem te dado mais retorno ultimamente?}" },
          { senderIndex: 1, text: "{Indireta com certeza! Quem gosta de vendedor chato te abordando do nada? Kkk|Rapport sem dúvidas! Conectar primeiro gera muito mais confiança e reduz o block.|Abordagem de conexão leve! 'Vi seu perfil e gostei do trabalho'. Funciona demais kkk.}" },
          { senderIndex: 0, text: "{Verdade. Uma pergunta simples de conexão funciona bem melhor.|Sim, quebrar o gelo de forma natural faz o cliente responder com boa vontade.|Pois é, se chega vendendo o cara já ignora na hora kkk.}" },
          { senderIndex: 1, text: "{Exato! Tipo 'vi seu perfil e curti seu trabalho, vc atende na região X?'|Isso mesmo, desperta curiosidade sem parecer oferta agressiva.|Com certeza! Foco no relacionamento primeiro, venda depois.}" }
        ]
      },
      {
        id: "d4_2",
        theme: "Uso de Áudios",
        messages: [
          { senderIndex: 0, text: "{Mandar áudio na primeira mensagem funciona?|Vc acha que compensa enviar áudio curto no primeiro contato com o lead?|Mandar gravação de áudio logo de cara converte mais?}" },
          { senderIndex: 1, text: "{Depende muito! Áudio curto de 15 segundos personalizado converte absurdos.|Cara, se for curto (tipo 10s) e parecer espontâneo, converte muito bem!|Converte demais! Mas tem que ser natural, nada de áudio gravado em estúdio ou robótico.}" },
          { senderIndex: 0, text: "{Hum, faz sentido. Passa mais credibilidade do que um textão copiado.|Verdade, a voz gera uma proximidade imediata que o texto não consegue.|Legal, vou criar uns scripts de áudio curto de teste para os meus BDRs.}" },
          { senderIndex: 1, text: "{Sim! Mas nunca mande áudio de 2 minutos pra quem não te conhece kkkk|Kkkkk sim, áudio longo pra desconhecido é pedir pra ser bloqueado!|Isso aí! Coisa rápida, direta e simpática. Sucesso garantido.}" }
        ]
      },
      {
        id: "d4_3",
        theme: "Gatilho da Escassez",
        messages: [
          { senderIndex: 0, text: "{Tava pensando em usar o gatilho de poucas vagas pro nosso próximo evento.|Tô desenhando uma copy nova usando escassez de tempo, acha que vira?|O que vc acha de aplicar gatilho de vagas limitadas no fechamento?}" },
          { senderIndex: 1, text: "{Ótima ideia! Escassez real sempre acelera a decisão do cliente.|Funciona demais! O medo de perder a oportunidade move as pessoas rapidamente.|Melhor gatilho comercial que existe, gera urgência imediata.}" },
          { senderIndex: 0, text: "{Vou montar a copy focado nisso hoje à tarde.|Perfeito, vou estruturar o texto com esse foco hoje.|Vou ajustar meus disparos de teste com esse argumento de escassez.}" },
          { senderIndex: 1, text: "{Se quiser que eu dê uma olhada depois, pode mandar aqui!|Massa! Depois me passa pra eu ler, te dou um feedback.|Manda bala! Se quiser ajuda na revisão da copy, tamo junto.}" }
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
          { senderIndex: 0, text: "{Fechamos aquela conta grande que estávamos negociando!|Mano, fechou o contrato daquela empresa que tava enrolando!|Acabou de pingar a assinatura do maior contrato do mês!}" },
          { senderIndex: 1, text: "{Meeentaira! Que top mano! Parabéns pra nós!! 🚀|Nossa, sensacional! Parabéns pelo fechamento, mestre!|Caraca! Que notícia maravilhosa! Vamos comemorar kkk!}" },
          { senderIndex: 0, text: "{Simm! Assinaram o contrato digital agora pouco. O projeto começa na segunda.|Assinaram eletronicamente agorinha. Segunda já começamos o onboarding!|Sim! O sinal de pagamento já foi confirmado. Bora iniciar o projeto!}" },
          { senderIndex: 1, text: "{Caraca, sensacional! Esse cliente vai elevar nosso patamar de faturamento.|Maravilhoso! Nossa meta trimestral já tá praticamente batida com essa conta.|Parabéns demais, colhendo os frutos de semanas de negociação. Tmj!}" }
        ]
      },
      {
        id: "d5_2",
        theme: "Reunião de Alinhamento",
        messages: [
          { senderIndex: 0, text: "{Nossa reunião de alinhamento trimestral foi marcada pra amanhã?|Cara, o alinhamento de metas ficou agendado pra essa semana?|Nossa call de resultados vai ser amanhã mesmo?}" },
          { senderIndex: 1, text: "{Isso, às 10h. Vamos revisar os números de conversão e gargalos de vendas.|Sim, confirmada para as 14h. Vamos analisar as métricas de conversão e gargalos.|Isso aí, amanhã de manhã. O foco vai ser otimizar os custos de aquisição.}" },
          { senderIndex: 0, text: "{Maravilha. Já tô com os relatórios prontos aqui.|Excelente. Já levantei todos os números por aqui também.|Ótimo, montei os slides com os principais insights pra compartilhar.}" },
          { senderIndex: 1, text: "{Excelente! Vai ser mto bom pra desenhar os próximos passos.|Perfeito! Vamos com tudo desenhar as metas pro próximo semestre.|Maravilha, ansioso pra ver os dados e ajustar as estratégias. Tmj!}" }
        ]
      },
      {
        id: "d5_3",
        theme: "Novas Ferramentas",
        messages: [
          { senderIndex: 0, text: "{Tava olhando umas ferramentas novas de CRM... Alguma recomendação?|Vc conhece algum CRM bom pra equipe de vendas ativas?|Tô precisando organizar meu funil, me indica algum CRM legal?}" },
          { senderIndex: 1, text: "{Cara, o Pipedrive é excelente pra vendas ativas, bem visual.|Olha, eu gosto muito do Pipedrive, bem prático e intuitivo.|Cara, o Kommo é ótimo pra quem vende muito pelo WhatsApp. Dá uma olhada!}" },
          { senderIndex: 0, text: "{Vou fazer um teste grátis lá pra ver se adapta com nosso funil.|Boa, vou me cadastrar na versão de teste deles hoje.|Massa, vou abrir uma conta de teste pra conhecer a interface.}" },
          { senderIndex: 1, text: "{Vai gostar! A organização de etapas deles ajuda mto a não esquecer de nenhum lead.|Com certeza! Vai te dar uma visão muito clara de onde estão os gargalos do funil.|Vai na fé, vai mudar seu jogo de organização comercial kkk.}" }
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
          { senderIndex: 0, text: "{Sextouuu! Qual a boa de hoje? Algum happy hour planejado?|Sextou! Bora tomar uma gelada mais tarde pra descontrair?|Sextou mestre, qual a programação para o fim de expediente de hoje?}" },
          { senderIndex: 1, text: "{Sextou demais! Kkkk vou tomar uma gelada com a galera hoje sim, tá merecido!|Sextou! Com certeza vou relaxar um pouco hoje mais tarde, cerveja trincando kkk!|Sextouuu! Sem dúvidas, tomar uma gelada pra comemorar o fechamento da semana!}" },
          { senderIndex: 0, text: "{Com certeza, semana puxada demais. Onde vcs vão?|Semana foi intensa mesmo, vcs vão no bar de costume?|Merecido demais, qual o ponto de encontro de hoje?}" },
          { senderIndex: 1, text: "{Naquele espetinho de sempre perto do escritório. Aparece lá dps!|No barzinho da esquina, se conseguir cola lá mais tarde!|Vamos naquele de sempre perto da agência. Te espero lá, mestre!}" }
        ]
      },
      {
        id: "d6_2",
        theme: "Churrasco de Sábado",
        messages: [
          { senderIndex: 0, text: "{Amanhã vou fazer um churrasco em família aqui. Descansar um pouco.|Amanhã o plano é acender a churrasqueira aqui em casa e desligar o celular kkk.|Sábado vai rolar um churrasquinho leve aqui pra repor as energias kkk.}" },
          { senderIndex: 1, text: "{Que top mano! Nada melhor do que churrasco pra recarregar as energias|Coisa boa! Um churrasco e uma cerveja gelada curam qualquer cansaço kkk|Massa demais, mestre! Aproveita muito pra descansar que vc merece!}" },
          { senderIndex: 0, text: "{Verdade, esquecer um pouco de leads e focar na família rs|Pois é, se desligar um pouco da empresa faz bem pra mente.|Verdade, recarregar as baterias porque segunda o bicho pega de novo kkk.}" },
          { senderIndex: 1, text: "{Isso aí, aproveita bastante mestre!|Com certeza! Ótimo proveito aí pra vcs!|Isso aí, tmj! Bom final de semana por aí!}" }
        ]
      },
      {
        id: "d6_3",
        theme: "Dica de Filme ou Série",
        messages: [
          { senderIndex: 0, text: "{Tem alguma indicação de série boa na Netflix pra maratonar no domingo?|Sabe de algum filme ou documentário legal pra assistir hoje à noite?|Alguma recomendação de série imperdível pra maratona de domingo?}" },
          { senderIndex: 1, text: "{Cara, se vc curte suspense, assiste aquela nova de mistério que lançou.|Olha, assisti um suspense muito bom essa semana, super tenso kkk.|Tem uma série policial excelente baseada em fatos reais, mto viciante!}" },
          { senderIndex: 0, text: "{Qual o nome? Vou pesquisar aqui.|Me passa o nome que vou colocar na minha lista agora.|Opa, qual é? Adoro esse gênero!}" },
          { senderIndex: 1, text: "{Chama 'O Segredo da Floresta'. Assisti em 2 dias, muito viciante!|Procura por 'Lupin' na Netflix, se não viu ainda, vai pirar!|Chama 'Mindhunter', produção impecável, recomendo de olhos fechados.}" }
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
          { senderIndex: 0, text: "{Terminei de ler o livro 'Spin Selling' que vc me indicou. Sensacional!|Cara, acabei de ler aquele livro de vendas que vc me recomendou. Que aula!|Terminei a leitura da indicação que vc fez. Mudou meu jogo comercial.}" },
          { senderIndex: 1, text: "{Não falei? Esse livro é a bíblia de vendas consultivas. Muda muito a cabeça.|Eu te disse! Esse conteúdo abre muito a mente pra negócios de alto valor.|Muito bom né? Ensina que vender não é empurrar produto, é solucionar dor.}" },
          { senderIndex: 0, text: "{Nossa, total! Comecei a entender melhor a diferença de perguntas de situação vs necessidade.|Com certeza, o capítulo sobre perguntas de implicação é genial.|Total, passei a estruturar minhas abordagens de forma mto mais estratégica.}" },
          { senderIndex: 1, text: "{Perfeito! Quando vc domina as perguntas de implicação, o fechamento fica natural.|Exato! Venda consultiva é outro nível de conversão. Fico feliz que curtiu!|Isso aí! Agora é aplicar na prática com o time e colher os frutos. Tmj!}" }
        ]
      },
      {
        id: "d7_2",
        theme: "Organização de Domingo",
        messages: [
          { senderIndex: 0, text: "{Eu gosto de tirar uma horinha no domingo à noite pra planejar minha agenda de segunda.|Vc também tem o hábito de planejar as tarefas da semana no domingo?|Gosto de usar o final de domingo pra clarear os objetivos da semana.}" },
          { senderIndex: 1, text: "{Boa! Eu faço isso também. Evita aquela sensação de segunda-feira perdida kkk|Faço o mesmo! Segunda-feira já começa a milhão, então planejamento é vital kkk|Super importante! Começar a semana sabendo exatamente o foco economiza mto tempo.}" },
          { senderIndex: 0, text: "{Exato, já acordo sabendo exatamente quem eu preciso ligar e responder.|Pois é, evita aquela ansiedade de iniciar a semana sem rumo.|Com certeza, clareza mental no início do dia é produtividade pura.}" },
          { senderIndex: 1, text: "{Faz total diferença na produtividade. Vamos pra cima amanhã!|Sem dúvidas, mestre! Excelente semana pra nós e bora bater metas!|Isso aí, foco total! Descansa o restante de hoje e bora pra cima amanhã!}" }
        ]
      },
      {
        id: "d7_3",
        theme: "Mindset Vencedor",
        messages: [
          { senderIndex: 0, text: "{Bora descansar o restante de hoje pq amanhã a arena de vendas nos espera kkk|Bora relaxar o que resta de hoje pra amanhã entrar com faca nos dentes kkk|Aproveitar as últimas horas do domingo pra recarregar 100%.}" },
          { senderIndex: 1, text: "{Kkkkk bora! Força total. Bom restinho de domingo aí mestre!|Bora! Amanhã o dia vai ser produtivo demais. Bom descanso pra vcs!|Isso aí! Amanhã o jogo começa cedo. Excelente noite pra vc e sua família!}" },
          { senderIndex: 0, text: "{Valeu, pra vc também! Abraço!|Obrigado mestre, bom descanso por aí! Abraço!|Valeu irmão, tmj! Forte abraço!}" },
          { senderIndex: 1, text: "{Tmj, abraço!|Abraço, mestre! Tmj!|Tmj mestre, abraço!}" }
        ]
      }
    ]
  }
];

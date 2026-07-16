# Planejamento: Arquitetura Multi-Chip IA (High Performance)

## 1. O Problema Atual
Atualmente, o módulo "Meus Agentes" vincula 1 Agente a 1 único Chip (`connectedInstanceId`).
A execução é linear (Single Thread logic):
1. Pega Lead
2. Gera IA
3. Envia
4. Espera Delay Global
5. Repete

Isso cria um gargalo. Se o delay é 30s e temos 1000 leads, demora 8 horas, mesmo que o usuário tenha 10 chips disponíveis.

## 2. A Solução (Multi-Thread / Round Robin)
O novo fluxo deve permitir que o Agente utilize um **Pool de Chips**.

### Mudanças na Interface (UI)
- Na aba `Configurações` do Agente (`Agents.tsx`), substituir o `<select>` simples de chip por um componente de **Multi-Seleção** (Checkboxes), similar ao da Operação Manual.
- O objeto `AgentConfig` deve deixar de usar `connectedInstanceId` (string) e passar a usar `connectedInstanceIds` (array de strings).

### Mudanças na Lógica de Disparo (`handleRunAgentOperation`)
O algoritmo de envio deve ser refatorado para operar em **Lotes Concorrentes** baseados no número de chips selecionados.

**Algoritmo Proposto:**

1. **Setup:**
   - Carregar lista de Leads Pendentes.
   - Carregar lista de Chips Selecionados (ex: [ChipA, ChipB, ChipC]).
   
2. **Distribuição (Round Robin):**
   - Não faremos um loop `for` simples com `await` bloqueante.
   - Criaremos "Trilhos de Execução" para cada Chip.

3. **O Fluxo de Cada Trilho (Chip Worker):**
   Imagine que temos 3 Chips. O sistema vai pegar os 3 primeiros leads e disparar "ao mesmo tempo":
   
   *   **Worker 1 (Chip A) pega Lead 1:**
       *   Chama Gemini API (Contexto Lead 1).
       *   Envia via Evolution API (Chip A -> Lead 1).
       *   Atualiza Status no Banco.
       *   **Dorme** (Delay de Segurança individual do Chip A).
       *   *Acordou?* Pega o próximo Lead disponível na fila (ex: Lead 4).

   *   **Worker 2 (Chip B) pega Lead 2:**
       *   Chama Gemini API (Contexto Lead 2).
       *   Envia via Evolution API (Chip B -> Lead 2).
       *   Atualiza Status no Banco.
       *   **Dorme** (Delay de Segurança individual do Chip B).
       *   *Acordou?* Pega o próximo Lead disponível na fila (ex: Lead 5).

## 3. Segurança (Safety Brain)
- Cada chip deve respeitar seu próprio `Delay` aleatório definido nas configurações globais.
- O Gemini deve ser chamado individualmente para cada envio para garantir personalização única (evitar spam de texto repetido).
- Se um envio falhar, o chip não deve travar a fila inteira.

## 4. Próximos Passos de Código
1. Atualizar `types.ts` (`AgentConfig`).
2. Atualizar UI de Seleção em `Agents.tsx`.
3. Reescrever função `handleRunAgentOperation` para usar `Promise.all` ou um gerenciador de fila assíncrono.

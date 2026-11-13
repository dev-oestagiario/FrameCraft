---
name: react-ui-quality
description: Qualidade da interface React: performance, foco, interação, acessibilidade e consistência visual.
---
# React UI quality
Aplicar em alterações `.tsx` e `.css`:
1. Formulários devem manter foco durante digitação. Valores numéricos editáveis devem permitir edição parcial e confirmar com blur/Enter.
2. Preserve elementos controlados, evite estados derivados redundantes e waterfalls HTTP.
3. Botões precisam ter ação, sem estados decorativos; estados loading/error/success devem ser identificáveis.
4. Acesso por teclado: foco visível, Escape para fechar, rótulos acessíveis e contraste suficiente.
5. Containers flex/grid usam min-width:0 e minmax(0,1fr) para impedir cortes; testados em telas estreitas.
6. Não use cores aleatórias nem modais que ultrapassam viewport.
7. Para React e acessibilidade, consultar as skills oficiais quando o agente tiver acesso:
   - `npx skills add vercel-labs/agent-skills --skill react-best-practices`
   - `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`
8. Verifique compatibilidade com movimento reduzido e navegação apenas por teclado.

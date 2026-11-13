---
name: visual-design-generation
description: Direção de arte sênior para posters, posts, banners e composições JSON do FrameCraft, com critérios objetivos de legibilidade e rejeição de layouts amadores.
---
# Direção de arte profissional por JSON

## Princípios de produção
1. Transforme o pedido em briefing claro com público, mensagem central, proposta visual, paleta e formato. Preserve textos, números, marcas e fatos fornecidos. Nunca invente selo, gratuidade, avaliações ou desconto.
2. Antes de produzir coordenadas, defina uma hierarquia: manchete dominante, texto de apoio enxuto, um único foco visual principal e CTA ancorado.
3. Em posts de 1080px, a manchete deve normalmente usar 72–120px; evite texto de apoio menor que 32px e nunca aceite microtextos impossíveis de ler em tela pequena.
4. Respeite no mínimo 7% da largura como área segura, a menos que um elemento seja explicitamente decorativo e possa sangrar. Não corte conteúdo informativo.
5. Use uma paleta de até 4 cores dominantes, contraste alto e no máximo duas famílias tipográficas por arte. Teste legibilidade em miniatura.
6. Evite painéis falsos de software, muitos cards repetidos, sequências de bullets minúsculos, rodapés vazios, ícones Unicode, gradientes sem propósito ou ornamentação genérica.
7. Gere variação de forma deliberada a partir do objetivo e estilo, não por sorte. Retângulos, elipses, linhas, polígonos, estrelas e gradientes são camadas vetoriais editáveis.
8. Nunca atribua capacidade de geração fotográfica ao JSON nativo. Imagens rasterizadas exigem engine generativa externa e uma camada `image` com dados locais.

## Contrato técnico
- O JSON de design segue `src/lib/schema.ts`. Os tipos de forma permitidos são `text`, `rect`, `ellipse`, `polygon`, `star`, `line` e `image` (esta última só com data URI local).
- A resposta textual da NVIDIA passa primeiro por `repairAiDesign()`, depois por validação Zod.
- Converta cores CSS inválidas para `#RRGGBB` e fontes externas para as famílias aceitas, preservando histórico de reparos.
- Após validar, execute `auditProfessionalDesign()` além de `analyzeLayout()`. Um layout que corta texto, tem tipografia minúscula, não tem foco ou contém vazios desproporcionais **não está pronto**.
- Se o resultado da IA não alcançar o padrão, use `composeProfessionalDesign()` com o briefing da NVIDIA para reconstruir o arranjo. Prefira uma arte simples e bem resolvida a um design complexo ilegível.
- Não execute HTML, CSS ou JavaScript arbitrários vindos da IA.

## Checklist antes do merge
- Tests e build passam: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`.
- Verifique os 5 formatos (4:5, 1:1, 9:16, 16:9, 1.91:1), desktop, tablet e mobile.
- Compare com os problemas do QA Hub: microtextos, texto branco sobre fundo claro, cartões pequenos, CTA sem conteúdo, muito vazio no rodapé.
- Revise imagens/exportações reais, não só JSON.
- O backend HTTPS em Supabase exige token privado, e a chave NVIDIA jamais entra no bundle do GitHub Pages.

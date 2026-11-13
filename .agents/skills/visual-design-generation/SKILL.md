---
name: visual-design-generation
description: Criação de composições JSON legíveis e profissionais para banners, redes sociais e apresentações.
---
# Direção de arte por JSON
Para mudanças em `directionSystem`, `designSystem`, templates ou renderização:
1. Extraia objetivo, público, marca, tom, textos obrigatórios e formato do pedido. Não invente métricas, selos, preços ou conquistas.
2. Planeje composição antes dos elementos: hierarquia, safe margins, escala tipográfica, contraste e espaço negativo.
3. Use paletas enxutas, ritmo de espaçamento, alinhamento e no máximo 2 mensagens grandes por arte.
4. JSON deve respeitar `src/lib/schema.ts`, IDs únicos e caixa dos textos dentro dos limites.
5. Evite blocos sobrepostos e caixas de texto curtas; revise em 4:5, 1:1, 9:16, 16:9 e OG.
6. Para fotos e ilustrações, a IA textual só cria `imagePrompt`; não prometa pixels que o motor atual não gera.
7. Rode `analyzeLayout` e revise alertas visuais antes de exportar.
8. Inspire-se na lógica de composição de Poster Maker e estilos de cookbook; não copie artes ou marcas.

## Validação de respostas de LLM
- Nunca use `designSchema.parse()` diretamente na resposta textual de um modelo: passe primeiro por `repairAiDesign()` e preserve a validação Zod final.
- Retornos de IA podem conter `rgba()`, `rgb()`, `hsl()`, `#RGB`, hex com alpha, CSS gradients e nomes de cores: adapte para `#RRGGBB` e opacidade.
- Fontes externas como Poppins, Montserrat e Roboto precisam de fallback para as quatro fontes de `textElement`.
- Mantenha esses ajustes rastreáveis no campo `repairs` sem bloquear a renderização. Nunca execute HTML ou JavaScript entregue pelo modelo.
- Teste sempre respostas parcialmente corretas com vários elementos e campos inválidos, sem reduzir a validação para importação de arquivos de usuário.

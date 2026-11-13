---
name: framecraft-hyperframes-composition
description: Adapta princípios de composição e design spec das skills oficiais Hyperframes a posts estáticos no FrameCraft.
---
# Composição estática inspirada no Hyperframes

Referências de estudo:
- https://github.com/heygen-com/hyperframes
- https://github.com/heygen-com/hyperframes/blob/main/AGENTS.md
- https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-creative/references/design-spec.md

Não use a CLI Hyperframes como gerador de PNG: ela foi projetada para vídeo. Adapte apenas suas boas práticas.
1. `frame.md` contém tokens de marca, escalas tipográficas e limites. Esse arquivo é a fonte de verdade para estilo, não para geometria.
2. Um compositor de imagens usa frame fixo (1080x1350 etc.) e unidades baseadas no próprio frame; nunca em `vw` do navegador.
3. Cenas diferentes exigem blueprints visuais diferentes; estilo não define a mesma estrutura espacial.
4. Faça render determinístico e reproduzível, sem dependência de rede ou animação temporal ao exportar.
5. Componentes vetoriais são editáveis e seguros. Adote formas, gradientes e paths com contrato restrito.
6. Revisão: *planejar → gerar → auditar → renderizar → comparar → corrigir*.
7. Ícones, grades ou textos decorativos não substituem o objeto principal.
8. Não reutilize o mesmo padrão de card ou artboard quando o pedido é campanha high-impact.

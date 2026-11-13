---
name: framecraft-visual-qa
description: Use para inspecionar fidelidade ao sujeito, contraste, clipping e variedade da composição antes de publicar imagens.
---
# Quality gate visual para FrameCraft

- Valide a sintaxe com Zod e a semântica com `auditProfessionalDesign(design, intent)`.
- Exija assunto explícito via `subjectPresent`; não aceite peça sobre PS5 se não mencionar PlayStation/PS5 no canvas.
- Teste formato 4:5, 1:1, 9:16, 16:9 e OG; não corte informações essenciais.
- Nunca executar HTML arbitrário retornado pela IA. SVG paths devem ser dados numéricos sanitizados, não tags.
- Inspecione título em miniatura, contraste, espaço negativo e legibilidade dos CTA.
- Diferencie (a) imagem ilustrativa editorial, (b) produto visual estilizado e (c) foto. Não rotule um vetor geométrico como foto real.
- Rejeite o velho template "bolas/cantos/cartão central" quando o pedido for publicitário.
- Preserve design determinístico, sem `Math.random` e sem imagens remotas carregadas durante renderização.
- Exporte a mesma composição para PNG, WebP e JSON editável; conserve nome e elementos originais.
- Faça `npm run typecheck`, `npm test`, `npm run build` e verifique o workflow do GitHub Pages.

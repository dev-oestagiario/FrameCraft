---
name: framecraft-campaign-director
description: Use para campanhas, banners e posts premium com foco em assunto real, hero expressivo e finalização de alto impacto.
---
# Direção de arte para campanhas FrameCraft

1. Leia o pedido original ANTES de qualquer prompt aprimorado. Identifique sujeito, marca, público, mensagem, estilo, cor e formato.
2. Produza a hierarquia da cena antes dos elementos: assinatura/identificação, headline, texto de apoio, hero, CTA.
3. Marca ou produto nomeados são obrigatórios na peça. PS5 exige "PS5"/"PlayStation 5" e uma silhueta de console, controles ou outro signo visual claramente reconhecível. Não invente logotipos oficiais ou fotos inexistentes.
4. "Sem foto" significa ilustração/vetor estilizado; NÃO significa "sem produto".
5. Para `professional-ad`, o hero deve ocupar ao menos cerca de 35% da área visual. Trabalhe perspectiva, sobreposição, linhas de energia, volumes, cortes, contraste e tensão visual sem usar dashboards de mentira.
6. Paletas e escolhas de brand são *tokens*, não layouts. O motor pode variar a composição livremente dentro desses tokens, como `frame.md` no Hyperframes.
7. Foco forte, 1 assunto por arte, textos curtos, tipografia proporcional a 1080px, CTA legível, margem segura de 7–10%.
8. Critique a arte renderizada em tamanho de feed e revise, não aceite apenas JSON que passa no schema.
9. Evite o anti-padrão de sempre gerar `título → retângulo colorido → elipse → botão`.
10. Use `src/lib/subjectFidelity.ts` e `src/lib/proComposer.ts`; mantenha as respectivas cópias da Edge Function sincronizadas.
11. A promessa de fotos fotorrealistas depende de um modelo próprio de imagem. O motor vetorial não é equivalente a geração raster do GPT.

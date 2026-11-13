---
name: FrameCraft Art Direction System
version: 2
frame_dimensions:
  portrait: [1080, 1350]
  square: [1080, 1080]
  story: [1080, 1920]
  landscape: [1920, 1080]
  banner: [1200, 630]
safe_area_percent: 8
type:
  headline_min_px: 54
  body_min_px: 26
palette_policy: preserve_user_colors
hero:
  minimum_relative_area_campaign: 0.35
  named_subject_required: true
composition:
  deterministic: true
  layouts: [gaming, software, learning, product, editorial, abstract]
quality:
  subject_fidelity: mandatory
  no_generic_subject_substitution: true
  clipping_check: true
  legibility_check: true
---

# FrameCraft frame.md

Os tokens de brand devem ser fiéis ao pedido. A geometria da composição permanece livre para variar conforme o assunto. Não assumir verde como identidade universal.

## Regra principal
Preservar PS5 / PlayStation 5, QA Hub, nome próprio, produto, objeto e outras entidades que o usuário citar. Se não for possível ilustrar o produto por imagem gerada, elaborar um vetor estilizado reconhecível e rotulado, sem fingir que é fotografia de produto.

## Campanhas
O usuário espera uma peça com hero, ritmo, camadas, perspectiva e CTA. Nunca usar um template único de bolinha, quadrado e botão para qualquer campanha.

## Exportação
O JSON é fonte de verdade. O Konva renderiza e exporta PNG/WebP a partir de coordenadas em pixels do canvas. Sem execução de HTML/CSS arbitrário do modelo e sem imagens de rede em tempo de renderização.

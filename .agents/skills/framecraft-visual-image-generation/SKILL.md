---
name: framecraft-visual-image-generation
description: Criação de campanhas profissionais com imagens raster, referências enviadas e camadas editáveis.
---
# FrameCraft · Hero de campanha gerado por imagem

1. **Imagem de verdade primeiro:** um modelo de linguagem gera o briefing, não pixels. Um modelo específico de imagem gera o hero.
2. A camada de imagem real é independente da headline, da descrição e do CTA. Edite os textos no canvas; nunca dependa de o modelo desenhar letras.
3. Se o usuário enviar uma foto do produto, use-a preferencialmente. Não substitua sem autorização; não envie a foto a provedores remotos quando não for necessário.
4. Produtos com textura (comida, cosméticos, roupas, eletrônicos) exigem imagem ou 3D convincente como assunto principal, nunca elipses, quadrados ou polígonos aleatórios.
5. Se o pedido proibir fotografia, gere ilustração 3D estilizada ou use referência enviada respeitando as restrições. Não ignore instruções negativas.
6. Composição: área visual forte entre 31–88% da altura no formato retrato; fundo escuro para copiar sobre o terço superior; CTA visível no terço inferior.
7. Não inventar promoções, marcas, preços, características de produto ou alegações. originalPrompt é a fonte de verdade.
8. Fluxo recomendado: análise → geração de brief → geração de hero visual → composição editorial → Zod → teste em canvas → exportação PNG/WebP/JSON.
9. NVIDIA FLUX.1 Schnell: endpoint de imagem /v1/genai/black-forest-labs/flux.1-schnell. A disponibilidade de preview e a cota variam por chave. Consulte os termos antes de usar em campanhas reais.
10. Suporte a foto do usuário fica local no navegador; somente textos e briefings vão para a API nesse modo. Nunca exponha NVIDIA_API_KEY.
11. Em caso de erro do provedor de imagem, exponha a mensagem e ofereça usar foto enviada ou modo vetorial. **Não** alegue geração visual premium ao voltar para formas simples.
12. O compositor híbrido é src/lib/premiumCampaign.ts, usado pelo frontend. A integração de pixels fica em supabase/functions/framecraft-api/visualImage.ts.

---
name: nvidia-model-routing
description: Resiliência da geração JSON usando endpoints de teste gratuitos NVIDIA com descoberta e fallback seguro.
---
# NVIDIA model routing
Quando alterar `server/nvidia.ts`:
1. Verifique modelos atuais no NVIDIA Build, confirme "Free Endpoint". Não adicione modelos pagos como fallback.
2. Descubra os IDs via `GET /v1/models` quando suportado; lista não comprova gratuidade, cota ou acesso individual.
3. Execute teste de chat real somente no backend, sem expor tokens ao navegador.
4. Para Nemotron com JSON, teste `chat_template_kwargs.enable_thinking=false`, `response_format=json_object`, e compatibilidade quando resposta JSON mode der 400.
5. Leia `choices[].message.content`; não substitua por texto de raciocínio.
6. Trate HTTP 401/403/404/429/5xx, respostas vazias e `finish_reason=length`. Nunca finja sucesso com uma arte local em lugar de IA.
7. Limite tentativas para evitar consumir a cota e preserve o erro de diagnóstico.
8. Teste com mocks de resposta vazia, formato inválido, ausência de models, 400 JSON mode, 401 e 429.
Fontes: https://build.nvidia.com/models e https://docs.nvidia.com/nim/large-language-models/

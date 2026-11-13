# Backend HTTPS — FrameCraft

Projeto Supabase Dev: `kbezscxuhqculdvraqun`.

Função pública de transporte: `https://kbezscxuhqculdvraqun.supabase.co/functions/v1/framecraft-api`. Ela **não é um proxy aberto**: a geração exige login Supabase Auth por e-mail confirmado e passa por controle de cota transacional no banco antes de consumir a NVIDIA.

## Credenciais

- `NVIDIA_API_KEY` — necessária e **privada** (Supabase Edge Function Secrets).
- `SUPABASE_SERVICE_ROLE_KEY` — provisionada pelo Supabase, privada e usada apenas no servidor para controle de cotas.
- `SUPABASE_ANON_KEY` — usada pelo backend para validar o JWT junto a `/auth/v1/user`.
- `FRAMECRAFT_ACCESS_TOKEN` — **legado, não utilizado**. Não é necessário informá-lo no site. Pode ser revogado caso não seja usado por outros serviços.

O frontend contém apenas a chave **publishable** pública, apropriada para aplicações web.

## Autenticação

O site oferece **Entrar com e-mail**, enviando um magic link por Supabase Auth. Configure em **Auth → URL Configuration → Redirect URLs**:

```text
https://dev-oestagiario.github.io/FrameCraft/
```

Autenticação por e-mail e envio de links devem estar habilitados; se o serviço SMTP padrão não puder enviar ao destinatário, configure um provedor SMTP.

Nenhuma rota de IA aceita token privado compartilhado; ela verifica o Bearer JWT da sessão autenticada e e-mail confirmado.

## Rotas

- `GET /api/health` — status da API (não requer login).
- `GET /api/models` — configuração pública e flag `requiresAuth`.
- `POST /api/enhance` — descrição simples → prompt detalhado e briefing NVIDIA.
- `POST /api/generate` — descrição e, opcionalmente, prompt revisado → composição JSON e novo briefing.

As rotas de escrita exigem sessão autenticada, validam tamanho do JSON e respeitam um limite persistente no PostgreSQL. O secret NVIDIA permanece fora do GitHub.

## Rate limiting

A migração `framecraft_authenticated_ai_rate_limits` criou a tabela `private.framecraft_ai_requests` e a RPC `public.framecraft_consume_ai_quota` acessível apenas à `service_role`.

Há limites por usuário e globais, por minuto e nas últimas 24 horas, para proteger a cota gratuita da NVIDIA. Usuários anônimos não têm permissão de chamar a RPC. Clientes `anon` e `authenticated` também não recebem acesso à tabela.

## Deploy

O backend é implantado pelo Supabase MCP na função `framecraft-api`, com autenticação JWT validada no próprio handler (`verify_jwt=false` no gateway, pois a função chama `auth/v1/user` explicitamente). Não remover essa verificação sem substituí-la por uma checagem equivalente.

O frontend é publicado separadamente via GitHub Pages Actions. Editar o código nesta pasta não faz deploy do backend automaticamente.

A produção visual atual gera **JSON editável e arte vetorial**, não fotos geradas por modelos de difusão.

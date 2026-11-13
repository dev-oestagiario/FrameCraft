# FrameCraft HTTPS API (Supabase Edge Function)

Implantado em **Supabase Dev** na função `framecraft-api`.

Endpoint: `https://kbezscxuhqculdvraqun.supabase.co/functions/v1/framecraft-api`

## Credenciais privadas necessárias

No Supabase Dashboard, abra **Project Settings / Edge Functions → Secrets** e cadastre:

- `NVIDIA_API_KEY`: sua chave NVIDIA Build, mantida exclusivamente no Supabase.
- `FRAMECRAFT_ACCESS_TOKEN`: um token privado com no mínimo 24 caracteres para proteger o endpoint público.
- `NVIDIA_MODEL`: opcional, `auto` por padrão.

Para gerar um token aleatório em PowerShell:

```powershell
$b = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
([BitConverter]::ToString($b)).Replace('-', '')
```

Copie o token gerado para `FRAMECRAFT_ACCESS_TOKEN` no Supabase. No site GitHub Pages, abra **Conexão**, informe o **mesmo token** (não a chave NVIDIA), e salve.

O frontend envia `Authorization: Bearer <token>` para o endpoint de geração. O token é guardado apenas no `sessionStorage` da aba. A chave NVIDIA nunca é exposta ao navegador.

## Segurança

A função possui `verify_jwt=false` porque valida explicitamente `FRAMECRAFT_ACCESS_TOKEN` no próprio código. **Sem o token nos Secrets, ela retorna HTTP 503 para toda geração**. Nunca remova essa verificação ou publique credenciais no repositório.

CORS aceita `https://dev-oestagiario.github.io`, localhost:5173 e 127.0.0.1:5173. O rate limit em memória por instância é uma proteção complementar, **não global**. Para operação multiusuário pública, use autenticação de usuário e rate limit persistente/externo.

## Rotas

- `GET /api/health` — disponibilidade HTTPS, indica apenas se secrets estão configurados
- `GET /api/models` — status da conexão, sem revelar credenciais
- `POST /api/generate` — descrição → briefing NVIDIA → JSON profissional; requer token
- `OPTIONS` — CORS preflight

Os layouts são vetoriais/editáveis. A função não cria imagens fotográficas diretamente. PNG e WebP são exportados pelo canvas do frontend.

## Deploy

Os arquivos da função foram publicados pela conexão Supabase Dev. Para deploy futuro via CLI:

```bash
npx supabase functions deploy framecraft-api --project-ref kbezscxuhqculdvraqun
```

O GitHub Pages é publicado em workflow próprio; alterações no código da Edge Function devem ser implantadas no Supabase separadamente, salvo se um deploy automatizado protegido for configurado.

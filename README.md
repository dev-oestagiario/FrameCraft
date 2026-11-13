# Framecraft — AI Image Studio

Editor de artes por IA feito com **React, TypeScript, Vite, Tailwind CSS 4, Zustand, Zod, React Konva, Express e NVIDIA NIM**.

O projeto é um MVP funcional de **geração de composição gráfica por JSON**. Ele **não gera fotos realisticamente** sem um motor de difusão externo. Em vez disso, produz e edita texto, formas, composição e imagens inseridas pelo usuário com precisão.

## Iniciar

Requisitos: Node.js >= 22.12, npm, navegador moderno.

```bash
npm install
cp .env.example .env
npm run dev
```

No Windows, copie `.env.example` para `.env` manualmente ou com `copy .env.example .env`.

Acesse http://localhost:5173. O frontend pode ser usado **sem chave**, com os templates de exemplo. Para geração de layouts com IA, obtenha uma chave em https://build.nvidia.com/ e configure:

```env
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL=auto
```

**Seleção automática (v1.1):** agora o backend tenta descobrir os modelos via `GET /v1/models`, cruza essa lista com uma seleção conservadora de modelos marcados como **Free Endpoint** no NVIDIA Build e confirma o acesso por uma chamada real. Se o catálogo não responder, tenta modelos conhecidos de avaliação gratuita. `NVIDIA_MODEL=auto` é o padrão; a configuração manual continua opcional e tem fallback. Isso **não garante saldo de créditos gratuito**, nem produção comercial gratuita.

A integração desativa `enable_thinking` para Nemotron em tarefas JSON para evitar que a resposta termine antes do conteúdo útil. Se `response_format` for rejeitado, repete sem o parâmetro; se o modelo estiver indisponível ou retornar vazio, alterna para outro modelo. Os erros 401 (chave) e 429 (limite/cota) mostram um diagnóstico claro.

No Windows/PowerShell, se `npm` estiver bloqueado pela política de execução, use:

```powershell
npm.cmd install
npm.cmd run dev
```

**Importante:** ao substituir a versão antiga, preserve o seu arquivo `.env` local (com sua chave). O ZIP não inclui o `.env` por segurança. Reinicie o backend depois de atualizar.

## Funcionalidades entregues (incluindo versão 1.3)

- Prompt em linguagem natural e 5 estilos artísticos
- Cinco proporções comuns (post, story, paisagem, OG)
- Duas chamadas de IA: **briefing detalhado** e **JSON de design**, com playbooks de estilo e formato aplicados aos prompts
- Validação Zod e uma tentativa de reparo do JSON da NVIDIA; descoberta automática e fallback entre modelos de teste gratuitos
- Editor Konva de camadas: seleção, arrastar, redimensionar, girar
- Inspector de posição, dimensões, textos, cores, fundo e opacidade
- Criação manual de elementos e importação de imagens locais (PNG/JPEG/WebP até 3 MB)
- Refinamento de composições por linguagem natural
- Exportação PNG / WebP em resolução original e importação/exportação JSON
- Desfazer/refazer e salvamento automático local quando couber no localStorage
- Dois templates e modo em branco
- Interface responsiva para desktop e celular, com melhoria de overflow do canvas, inputs numéricos e verificações básicas de layout
- API key acessada **apenas no servidor**

## Sobre as bibliotecas pesquisadas

| Projeto | Aplicação |
|---|---|
| [Poster Maker](https://github.com/dabodamjan/poster-maker) | Inspiração para arte codificada e exportação precisa (não foi copiado para o MVP) |
| [React Konva](https://konvajs.org/docs/react/) | Renderizador e editor visual implementado |
| [Satori](https://github.com/vercel/satori) + [Sharp](https://github.com/lovell/sharp) | Caminho para renderização SVG no servidor como implementação posterior |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Motor opcional futuro de geração de imagens a partir de prompts |
| [Reve SDK](https://github.com/reve-ai/reve-sdk/tree/main/examples/nodes) | Referência para transformações incrementais de layouts |
| [Polotno](https://github.com/polotno-project/polotno-studio-app) | Editor opcional, exige considerar licença do SDK |
| [Ideogram](https://github.com/ideogram-oss/ideogram4) | Referência para prompting estruturado, com restrições de licença/acesso |
| [AI Visual Prompt Cookbook](https://github.com/VigoZhao/AI-Visual-Prompt-Cookbook) | Referência de biblioteca de estilos JSON |

**Importante:** A API da NVIDIA utilizada aqui é **de texto**: cria um projeto JSON contendo formas e textos. O renderizador local produz PNG/WebP a partir desse JSON. Para transformar `imagePrompt` do briefing em pixels fotográficos, é preciso conectar um serviço adicional ou gerar o asset em ComfyUI e importá-lo no editor.

## Segurança e limites

- Nunca adicione `.env` ao Git e nunca configure `VITE_NVIDIA_API_KEY`.
- O backend limita chamadas a 6 gerações/minuto por IP (proteção simples para uso local). Para publicação pública, implemente autenticação, limites distribuídos, logs e um banco de dados.
- A variável `ALLOWED_ORIGIN` permite configurar as origens de CORS separadas por vírgulas.
- O endpoint NVIDIA pode ser alterado pelo servidor somente para domínios NVIDIA aprovados ou localhost.
- A chave não pode ser inferida do navegador: a API de desenvolvimento precisa permanecer num servidor seguro; GitHub Pages sozinho hospeda apenas o frontend estático.
- Dados e prompts são transmitidos à NVIDIA apenas quando você aciona a geração.
- Não publique a API aberta na internet sem autenticação e políticas de controle de uso.

## Scripts

```bash
npm run dev        # Frontend + backend
npm run build      # Typecheck e build frontend
npm run test       # Testes
npm run typecheck  # Verifica TypeScript
```

## Estrutura

```
src/
  components/CanvasEditor.tsx # Renderizador Konva
  data/templates.ts            # Artes demonstrativas
  lib/schema.ts                # Contrato JSON único, Zod
  lib/file.ts                  # Upload e downloads
  store/useStudio.ts           # Estado + histórico Zustand
  App.tsx                      # UI do estúdio
  styles.css                   # Design responsivo
server/index.ts                # API e validação
server/nvidia.ts               # Descoberta de modelos gratuitos, fallback e diagnósticos
server/designSkills.ts         # Playbooks efetivamente usados pela geração
src/lib/designQuality.ts       # Diagnóstico de limites e texto
.agents/skills/                # Skills locais para IA, React, UI e QA visual
AGENTS.md                      # Como usar as skills em agentes de código
```

## Próximas evoluções recomendadas

1. Gerador de assets nativo via ComfyUI/FLUX, com consentimento e exibição do custo/filas.
2. Layout engine mais sofisticado: alinhamento, smart guides, auto-fit de textos e detecção de colisões.
3. Camadas agrupadas, máscaras e recorte de imagens.
4. Histórico de projetos com banco de dados e autenticação.
5. Exportação SVG/PDF com Satori/Sharp/Playwright e testes visuais.
6. Biblioteca de presets de estilo inspirada no AI Visual Prompt Cookbook, guardados como JSON.

## Licença do código próprio

MIT. As bibliotecas e os modelos externos têm suas próprias licenças; verifique antes de redistribuir ou usar comercialmente.

## Atualização 1.1: correções e skills

**Erros tratados:** resposta NVIDIA vazia, saturação do orçamento de tokens com raciocínio, `response_format` incompatível, endpoint indisponível, 401/429, falta da lista de modelos, exceções de JSON.

**Interface:** estado do modelo ativo, botão para atualizar diagnóstico, largura de painel adaptável, scrolling do canvas ao dar zoom, campo numérico que confirma no Enter/blur, melhorias de foco, modais, texto overflow e redução de movimento.

**Skills locais instaladas no projeto:**
- `.agents/skills/nvidia-model-routing/SKILL.md`
- `.agents/skills/visual-design-generation/SKILL.md`
- `.agents/skills/react-ui-quality/SKILL.md`
- `.agents/skills/responsive-visual-testing/SKILL.md`

Essas skills são instruções para **agentes de programação**, não plugins que o navegador executa sozinho. Os playbooks de arte visual usados **em runtime** estão em `server/designSkills.ts`.

Skills externas opcionais para Codex/Claude (necessita npm e acesso à internet):

```bash
npx skills add vercel-labs/agent-skills --skill react-best-practices
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
```

### Diagnóstico da API

- `GET /api/health`: chave configurada, modelo confirmado previamente e modo automático.
- `GET /api/models`: tenta atualizar lista e informa modelos candidatos. Não expõe sua chave.
- `POST /api/generate`: retorna o ID do modelo **somente após resposta válida**.

### Limitações de validação nesta entrega

Os testes lógicos do roteador foram executados com respostas simuladas (resposta vazia, alternância e modo JSON incompatível). Nenhuma chave NVIDIA foi fornecida para verificar permissões reais. O registro npm não pôde ser alcançado neste ambiente, então build de Vite, testes Vitest e screenshots automatizados ainda precisam ser executados na máquina do usuário.

## Correção 1.2 — cores e fontes fora do esquema

A NVIDIA pode produzir cores CSS (`rgba()`, `rgb()`, `hsl()`, `#RGB`, `#RGBA`, `#RRGGBBAA`, nomes de cores, `linear-gradient()`) e famílias de fontes diferentes de `Inter`, `Arial`, `Georgia` e `Verdana`. A versão 1.2 introduz `server/aiRepair.ts`: converte os valores gerados para o contrato `#RRGGBB`, converte fontes incompatíveis para uma alternativa suportada, preserva opacidade de cores transparentes, normaliza propriedades numéricas, IDs duplicados e tipos comuns de formas, e **só então** executa a validação Zod estrita. O frontend apresenta ajustes automáticos em um painel discreto. Não é preciso alterar a chave NVIDIA nem o `.env`. A importação de documentos JSON continua estrita para evitar arquivos malformados. Gradientes em elementos ainda são aproximados pela primeira cor; gradiente de fundo do canvas permanece disponível como duas cores.

Para testar a correção: `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`. Esses comandos são para execução local caso o ambiente de geração não disponibilize as dependências.


## FrameCraft 1.3 — direção de arte profissional e backend Supabase

O editor diferencia **layout vetorial** de **imagens fotográficas**. Uma IA de linguagem cria o briefing; o motor de composição monta e exporta uma peça editável de texto e formas. Esta versão não integra um modelo de difusão de imagens. Não existe promessa de gerar fotografias a partir deste JSON.

### Motor visual aprimorado

- Novos elementos: linhas, polígonos regulares (triângulo a 12 lados), estrelas, contornos e gradientes em retângulos/elipses.
- Direção de arte: headline dominante, hierarquia tipográfica, cores legíveis, uma área visual focal, CTA ancorado e margens verificáveis.
- Regras de qualidade: caixas com texto muito pequeno, cortes de conteúdo, sobreposições e falta de foco gráfico são sinalizadas. O backend Node local reconstrói composições problemáticas em formato profissional com o briefing da NVIDIA.
- No Supabase Edge, a NVIDIA produz um briefing detalhado e o motor monta o JSON profissional sem depender de coordenadas arbitrárias do modelo.
- Templates de exemplo atualizados para demonstrar o motor visual.
- A fonte Inter é aplicada com fallback e redraw após carregamento das fontes.

### GitHub Pages

Frontend publicado automaticamente em **https://dev-oestagiario.github.io/FrameCraft/** por `.github/workflows/pages.yml` (testes, TypeScript, build e deploy).

A URL pública HTTPS do backend já está configurada como fallback no workflow:

```text
https://kbezscxuhqculdvraqun.supabase.co/functions/v1/framecraft-api
```

A variável opcional `FRAMECRAFT_API_URL` do repositório GitHub pode substituir essa URL (deve conter **somente a URL pública**, nunca a chave da NVIDIA).

### Habilitar geração NVIDIA (etapa de configuração privada)

A Edge Function `framecraft-api` está ativa no projeto Supabase **Dev**. A chamada `GET /api/health` confirmou HTTP 200. Entretanto, nenhuma chave secreta foi adicionada automaticamente porque a conexão Supabase permite publicar Edge Functions, mas **não oferece gerenciamento de secrets**.

1. Abra [Supabase Dashboard – Edge Functions Secrets](https://supabase.com/dashboard/project/kbezscxuhqculdvraqun/functions/secrets).
2. Cadastre `NVIDIA_API_KEY` com sua chave privada da NVIDIA Build (a mesma que usa no `.env` local).
3. Cadastre `FRAMECRAFT_ACCESS_TOKEN` com uma senha longa aleatória de **pelo menos 24 caracteres** (diferente da chave NVIDIA). Para gerar no PowerShell:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
([BitConverter]::ToString($bytes)).Replace('-', '')
```

4. No site do FrameCraft, clique em **Conexão**, confira a URL do backend, cole **apenas o token de acesso** e clique em **Salvar conexão**.
5. Clique em **Gerar minha imagem**. O navegador envia o token de acesso, e o Supabase Edge usa `NVIDIA_API_KEY` apenas no servidor.

**Segurança:** sem `FRAMECRAFT_ACCESS_TOKEN` configurado no Supabase, a função **bloqueia a geração com HTTP 503**, evitando uma API aberta para consumir créditos. Não coloque segredos em `VITE_*`, GitHub Actions variables, código-fonte ou mensagens públicas. O token digitado na UI é armazenado somente no `sessionStorage` desta aba.

Rotas:
- `GET /api/health`
- `GET /api/models`
- `POST /api/generate` com header `Authorization: Bearer <token>`

O backend realiza uma limitação simples de cinco gerações por minuto por instância. Para acesso público multiusuário, autenticação individual e rate limiting distribuído são recomendados.

A função Supabase é implantada separadamente do GitHub Pages. Consulte `supabase/functions/framecraft-api/README.md` e `supabase/config.toml`.

### Verificação

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Antes de atualizar o GitHub, valide nos principais viewports e na prévia ampliada do canvas.

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


## FrameCraft 1.4 — prompt profissional e login por e-mail

Escreva qualquer descrição, escolha estilo e proporção, depois pressione **Aprimorar meu prompt com IA**. A NVIDIA produz uma direção de arte detalhada com público, objetivo, copy, hierarquia, paleta, tipografia, margens, composição e critérios de qualidade. Você pode **editar ou copiar** o prompt antes de gerar a imagem JSON editável. O botão de gerar também funciona diretamente, retornando a composição e o prompt detalhado.

### Acesso seguro (sem token no frontend)

A geração utiliza sessões do **Supabase Auth por e-mail**, não o antigo token `FRAMECRAFT_ACCESS_TOKEN`. A chave NVIDIA continua apenas em Secrets da Edge Function, sem exposição no GitHub Pages.

1. Em [Supabase Auth → URL Configuration](https://supabase.com/dashboard/project/dtvbphnoqkbxlwdiivvv/auth/url-configuration), adicione `https://dev-oestagiario.github.io/FrameCraft/` às **Redirect URLs**.
2. Confirme que a autenticação por e-mail está ativa. O serviço SMTP padrão da Supabase pode ter limite de destinatários e envios; para acesso público maior, configure um provedor SMTP.
3. Abra o [FrameCraft](https://dev-oestagiario.github.io/FrameCraft/) e clique **Entrar**. Informe seu e-mail, receba um link e clique nele para voltar ao editor.
4. Aprimore o prompt, ajuste o texto e gere a composição.

O secret `FRAMECRAFT_ACCESS_TOKEN` antigo pode permanecer salvo no Supabase, mas **não é mais utilizado** pelo backend. Nunca o copie para código público.

### Backend e cotas

Edge Function: `https://dtvbphnoqkbxlwdiivvv.supabase.co/functions/v1/framecraft-api`

- `GET /api/health` — status do backend e NVIDIA
- `GET /api/models` — disponibilidade sem divulgar credenciais
- `POST /api/enhance` — descrição livre → prompt detalhado pela NVIDIA
- `POST /api/generate` — direção de arte → JSON visual editável

Os endpoints de escrita exigem acesso autenticado e e-mail confirmado. O backend verifica a sessão junto ao Supabase Auth e usa uma função SQL de controle de cota atômico em uma tabela no schema `private`, inacessível a clientes públicos. O usuário não precisa saber nenhuma chave de API.

### Limitações e publicação

A geração produz **composições vetoriais editáveis**, não fotografias geradas por difusão. Imagens fotográficas podem ser importadas como camadas; motor de geração fotográfica ainda não integrado.

O frontend é publicado automaticamente no GitHub Pages em cada commit na `main`. As Edge Functions são implantadas separadamente pelo conector do Supabase.

## Interface minimalista — FrameCraft 1.5

O estúdio agora utiliza uma interface em dois temas neutros (claro e escuro), com alternância na barra superior. A escolha é guardada somente no navegador (`framecraft:theme`) e não modifica as cores do design que você está editando.

A tela inicial prioriza apenas **descrição, estilo, formato e geração**, deixando o canvas ocupar o restante do espaço. O prompt começa vazio, pronto para receber sua ideia.

- Clique em **Editar** para abrir ou fechar o painel de ferramentas/propriedades. Ao selecionar um elemento, o editor de propriedades abre automaticamente.
- **Adicionar elemento** e **Camadas** são seções recolhíveis dentro do painel de edição.
- **Modelos** abre uma lista de templates somente quando solicitado; **Nova** abre um canvas em branco mediante confirmação.
- O botão **⋯** reúne Importar JSON, Modo foco, Conexão da IA e Ajuda.
- A barra de ferramentas do canvas mantém somente desfazer/refazer e controles de zoom.
- A janela de login por e-mail respeita os temas, mesmo sendo montada como portal.
- Em telas pequenas, **Criar** e **Editar** alternam entre os painéis sem cortar o canvas.

O arquivo `src/neutral.css` concentra os tokens de tema e os ajustes de layout, carregado por último em `src/main.tsx` para não interferir no motor gráfico Konva. O contrato de geração da NVIDIA e o backend Supabase continuam inalterados nesta revisão.

### Checklist de validação visual

Testar preferencialmente em 1440, 1024, 768, 390 e 320 px:
navegação por teclado, foco dos campos, dropdown de exportação, alternância de temas, telas de login e configuração, canvas, zoom e exportação PNG/WebP/JSON. Antes de liberar o deploy, executar `npm run typecheck`, `npm test` e `npm run build`.

## FrameCraft 2.0 — campanhas com fidelidade ao assunto

O motor anterior usava praticamente a mesma composição geométrica para qualquer pedido. Esta versão introduz intenção visual (`professional-ad`, `editorial` e `simple-post`), extração de entidades e blueprints diferentes para consoles/games, SaaS, educação, produtos e composições abstratas.

### Funcionalidades

- `src/lib/subjectFidelity.ts`: guarda a identidade original (PS5/PlayStation 5, QA Hub e outros produtos), mesmo quando o prompt refinado propõe só geometria/cores.
- Aprimorar com IA **substitui o texto do campo principal**; a descrição original é preservada em `originalPrompt` e enviada ao backend ao gerar.
- `src/lib/proComposer.ts`: compõe formas a partir do assunto, formato, estilo e paleta reais. Não usa `Math.random`, não renderiza código arbitrário e gera o mesmo JSON para as mesmas entradas.
- Ilustrações `path` com sintaxe SVG estritamente limitada a comandos geométricos; passam por Zod e são renderizadas pelo React Konva.
- PS5: assinatura PlayStation 5 e silhueta vetorial estilizada com perspectiva e linhas de energia. **Não** é fotografia nem ativo oficial da Sony.
- `auditProfessionalDesign(design, intent)`: alerta quando marca ou produto obrigatório não aparece, há texto cortado, hierarquia ausente ou composição genérica.
- Backend local e Edge Function Supabase compartilham o mesmo compositor e a mesma política de fidelidade.
- Skills locais: `framecraft-campaign-director`, `framecraft-visual-qa`, `framecraft-hyperframes-composition`. Leia `frame.md` para tokens de brand independentes do layout.

### Limitação consciente do motor

O Hyperframes inspira a arquitetura de autoria, preview e render determinísticos, mas sua API/CLI é voltada a **vídeos**. O FrameCraft continua com React Konva para artes estáticas e JSON editável. Esta versão amplia fortemente a qualidade de ilustrações vetoriais, porém **não equivale à geração de pixels por um modelo de imagens como GPT Image**. Os antigos endpoints gratuitos SDXL e Stable Diffusion 3 no NVIDIA Build aparecem como descontinuados. Um provedor raster compatível pode ser conectado futuramente sem prometer acesso gratuito ilimitado.

### Como validar

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Os testes reproduzem o caso reportado de um banner PS5 cuja direção de arte retém preto/ciano, mas perde a marca. A composição deve sempre identificar o PS5 e ser diferente da gerada para QA Hub.

## GitHub Pages — erro 404 em main.tsx / favicon.ico

O site é React/Vite e deve servir os arquivos de `dist/`, nunca a entrada de desenvolvimento `/src/main.tsx`.

### Configuração obrigatória do Pages

Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**, em vez de `Deploy from a branch / main / (root)`. Vite requer build antes de publicar; o workflow `.github/workflows/pages.yml` envia `dist/`.

Endereço publicado: https://dev-oestagiario.github.io/FrameCraft/

### Diagnóstico automático

- O build executa `node scripts/verify-pages-build.mjs` e rejeita `dist/index.html` se ainda contiver `/src/main.tsx`, paths absolutos incorretos, JS inexistente ou ícones ausentes.
- Depois do deploy, `scripts/verify-pages-live.mjs` consulta o site público e confere `/FrameCraft/assets/*.js` e `/FrameCraft/favicon.svg`, repetindo algumas vezes para tolerar propagação da CDN. Se o Pages ainda servir o código-fonte, exibe a instrução para trocar a origem.
- Ícones SVG e ICO estão em `public/` e são copiados automaticamente pelo Vite para `dist/`, com URLs relativas ao subdiretório do projeto.

### Testes locais

```bash
npm ci
GITHUB_PAGES=true npm run build
node scripts/verify-pages-build.mjs
```

## Migração do backend para o projeto FrameCraft

Projeto Supabase de destino: `dtvbphnoqkbxlwdiivvv` (`https://dtvbphnoqkbxlwdiivvv.supabase.co`). A aplicação React utiliza sua chave **publishable** pública para login e a Edge Function `framecraft-api` para gerar prompts e layouts. Sessões do projeto anterior não são transferidas: cada usuário deve entrar por e-mail novamente.

A função foi publicada no projeto novo e a tabela de cotas foi criada em `private.framecraft_ai_requests`, com acesso somente ao servidor. O antigo projeto não é excluído.

A chave `NVIDIA_API_KEY` é um segredo configurado **por projeto** e deve ser adicionada em https://supabase.com/dashboard/project/dtvbphnoqkbxlwdiivvv/functions/secrets. Configure também a URL de redirecionamento da autenticação em https://supabase.com/dashboard/project/dtvbphnoqkbxlwdiivvv/auth/url-configuration. O GitHub Pages aponta diretamente à nova função HTTPS; a variável legada `FRAMECRAFT_API_URL` não pode mais substituir automaticamente o endereço.

## FrameCraft 2.1 — geração visual real e anúncios híbridos

Anteriormente, a NVIDIA apenas produzia texto/JSON e o sistema improvisava o hero com formas geométricas. Nesta revisão há um endpoint de geração de **pixels reais** usando FLUX.1 Schnell, quando disponível para a chave NVIDIA.

- Na criação, selecione **Imagem profissional (IA)** (padrão), descreva o produto e clique em **Gerar minha imagem**. A Edge Function gera o briefing, chama o modelo visual e retorna imagem JPEG/PNG; o frontend monta a campanha, mantendo headline e CTA editáveis no canvas.
- Como alternativa, selecione **Usar minha foto** para importar uma imagem PNG/JPEG/WebP até 3 MB. A foto permanece no navegador e não é enviada ao provedor de imagem; apenas o briefing textual é usado na API NVIDIA.
- O **modo vetorial** continua disponível para layouts inteiramente editáveis.
- Em modo híbrido, a imagem é posicionada com recorte `cover` sem distorção; os textos ficam em camadas separadas e são exportados junto com a imagem para PNG, WebP ou JSON.
- Em caso de falta de acesso ou cota, a aplicação mostra erro e oferece importação de foto. Não afirma ter gerado uma foto quando criou apenas polígonos.

### NVIDIA visual: requisitos

No projeto Supabase `dtvbphnoqkbxlwdiivvv`, configure o secret `NVIDIA_API_KEY`.
A API visual chama `https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell`.
O acesso de preview não é garantido para todas as contas; respeite os termos de avaliação e uso comercial da NVIDIA/Black Forest Labs. O modelo FLUX.1 Schnell suporta geração de imagens e tem documentação de uso comercial do modelo, mas as condições do serviço de trial NVIDIA continuam aplicáveis.
A imagem visual gerada é quadrada (1024 px) no endpoint utilizado e recortada para o formato da arte sem distorcer. Não equivale automaticamente à qualidade do GPT Image para todos os estilos.

Rota protegida por e-mail confirmado e controle de quota: `POST /api/generate-visual` com `prompt`, `originalPrompt`, `style`, `format`.
O segredo NVIDIA fica apenas na Edge Function. Consulte `.agents/skills/framecraft-visual-image-generation/SKILL.md`.

Teste local: `npm run typecheck`, `npm test`, `npm run build`. O CI não testa uma geração real sem credenciais autorizadas; a disponibilidade da geração visual deverá ser verificada em uma conta autenticada.

## Diagnóstico e fallback NVIDIA (correção de timeout)

O endpoint de geração visual distingue falhas por códigos `VISUAL_TIMEOUT`, `VISUAL_NETWORK`, `VISUAL_UNAUTHORIZED`, `VISUAL_FORBIDDEN`, `VISUAL_NOT_FOUND`, `VISUAL_RATE_LIMIT`, `VISUAL_INVALID_REQUEST`, `VISUAL_UPSTREAM` e `VISUAL_INVALID_RESPONSE`. Nenhum segredo é retornado ao navegador.

Modelos de imagem consultados nesta ordem (ambos documentados pela NVIDIA):
1. `black-forest-labs/flux.2-klein-4b` (rápido; `mode: "Image Generation"`).
2. `black-forest-labs/flux.1-schnell` (`mode: "base"`).

Não repetir uma solicitação que possa ter sido faturada; a tentativa alternativa usa outro modelo apenas uma vez quando o primeiro não produziu imagem. Timeout por modelo limitado para impedir que o sistema fique preso em 95 segundos em cada tentativa. Se os dois falharem, retorna erro estruturado sem inventar imagem ou fazer fallback para círculos.

A rota `GET /api/visual-health` exige sessão Supabase, faz **HEAD não-generativo** e guarda o resultado por 60 segundos por usuário no worker. Resposta de HEAD pode comprovar conectividade, **nunca comprova acesso à inferência**, que apenas uma geração real valida. O botão **Conexão → Diagnosticar gerador de imagens** exibe o resultado; não exige token privado no browser.

Após falha, o editor oferece **Enviar foto**, **Usar vetor** ou **Tentar novamente**. Se a API rejeitar a chave/acesso a ambos os modelos, a opção visual fica desabilitada até ação explícita do usuário; não muda automaticamente para vetor.

As credenciais NVIDIA permanecem exclusivamente no projeto Supabase `dtvbphnoqkbxlwdiivvv`. A execução real ainda depende da disponibilidade e da permissão da conta NVIDIA. Testes simulados não devem ser apresentados como inferência real validada.

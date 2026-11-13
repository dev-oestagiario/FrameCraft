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

## Funcionalidades entregues

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


## Publicar no GitHub Pages

O deploy do **frontend React** é automático pelo GitHub Actions em cada push na `main`. Pull requests executam os mesmos testes e build, mas não publicam.

1. Abra **Settings → Pages → Build and deployment → Source** e selecione **GitHub Actions**. Essa ativação é feita uma única vez pelo administrador do repositório.
2. O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) instala as dependências, executa os testes e publica `dist/`.
3. Depois de uma execução bem-sucedida, abra **https://dev-oestagiario.github.io/FrameCraft/**.

O Vite usa automaticamente o caminho base `/FrameCraft/` apenas na compilação de Pages. O desenvolvimento local continua em `http://localhost:5173/`.

### Gerar layouts com NVIDIA no Pages

**GitHub Pages hospeda somente arquivos estáticos.** Não é possível executar `server/index.ts` nele ou colocar `NVIDIA_API_KEY` no frontend ou nas variáveis `VITE_*`.

Para gerar designs com IA na versão publicada, hospede o backend Express separadamente em um serviço HTTPS confiável:

- Configure `NVIDIA_API_KEY` e `NVIDIA_MODEL=auto` **somente no serviço backend**.
- Configure `ALLOWED_ORIGIN=https://dev-oestagiario.github.io` no backend, para permitir requisições CORS do site.
- No site, clique **Conexão → URL pública da API**, informe apenas a origem HTTPS (por exemplo, `https://api.meudominio.com`), clique **Testar conexão** e depois **Salvar conexão**.
- Opcionalmente, crie a variável pública de repositório `FRAMECRAFT_API_URL` em **Settings → Secrets and variables → Actions → Variables** para definir a URL automaticamente no build. Ela deve conter **somente a URL pública**, nunca a chave NVIDIA.

A conexão pode ser alterada pelo usuário; a URL é armazenada no navegador. Sem backend configurado, o editor continua funcionando para criar, editar, importar e exportar composições locais, mas o botão de gerar com IA informa que a API precisa ser conectada.

### Novidades de interface

- Modo **Foco** na barra superior amplia a área de desenho e esconde os dois painéis laterais.
- Atalhos de prompts para posts, banners e capas.
- Lista de modelos recolhível para priorizar a arte.
- Indicadores de conexão mais claros, estados offline e um painel de configuração HTTPS.
- Ajustes responsivos de espaçamento, controles, painel lateral, canvas e foco por teclado.

Foram consultadas e aplicadas as skills de `find-skills`: [Anthropic Frontend Design](https://skills.sh/anthropics/skills/frontend-design), [Vercel React Best Practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) e [Impeccable](https://skills.sh/pbakaus/impeccable/impeccable).

# AI Image Studio — instruções para agentes

Use as skills locais de `.agents/skills/` durante tarefas de geração, interface e depuração:
- `nvidia-model-routing` para modelos, quotas, respostas vazias e JSON
- `visual-design-generation` para layouts e prompts profissionais
- `react-ui-quality` para React, acessibilidade e edição
- `responsive-visual-testing` para regressões visuais, responsividade e exportação

Referências externas recomendadas: `vercel-labs/agent-skills` (React Best Practices, Web Design Guidelines). Consulte as skills externas em suas fontes oficiais; não adicione dependências pagas para corrigir problemas básicos.

Sempre execute `npm run typecheck`, `npm test`, `npm run build` quando dependências estiverem disponíveis. Se os testes não puderem rodar, reporte a limitação.
Nunca comite `.env` ou chaves NVIDIA.

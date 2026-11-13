# FrameCraft — instruções para agentes de desenvolvimento

Antes de qualquer edição no motor de imagens, leia `frame.md` e as skills locais:
- `.agents/skills/framecraft-campaign-director/SKILL.md`: direção de arte, campanhas premium e hero.
- `.agents/skills/framecraft-visual-qa/SKILL.md`: auditoria de cortes, legibilidade, fidelidade e regressão.
- `.agents/skills/framecraft-hyperframes-composition/SKILL.md`: padrões inspirados no Hyperframes (identidade separada do layout, frame fixo, determinismo).
- `.agents/skills/visual-design-generation/SKILL.md`: JSON e regras do motor.
- `.agents/skills/nvidia-model-routing/SKILL.md`: tentativas de modelos e quota.
- `.agents/skills/react-ui-quality/SKILL.md`: interface e componentes.
- `.agents/skills/responsive-visual-testing/SKILL.md`: testes em múltiplos viewports.

Fidelidade: a descrição original é fonte de verdade. PS5 não pode virar "um banner gamer abstrato sem referência ao console". Proibir alegações inventadas e preservação de nomes de marca, produto e informações obrigatórias.

Fonte de verdade: `src/lib/proComposer.ts` e `src/lib/subjectFidelity.ts`. Ao mudar o motor, sincronize `supabase/functions/framecraft-api/` e publique a Edge Function. Não acople o frontend ao secret NVIDIA.

Qualidade: design estruturado deve passar em Zod + auditoria semântica; redesenhar um template não substitui renderizar e revisar. Os paths SVG são dados restritos, nunca HTML executável.
O Hyperframes é um framework de vídeo: adaptar técnicas de composição e frame.md, NÃO alegar que o app usa seu renderizador de vídeo para criar PNGs.
Execute `npm run typecheck`, `npm test`, `npm run build`; validar o workflow do Pages. Se não conseguir verificar, informe a limitação. Nunca versionar `.env` ou tokens privados.

## Geração visual premium
Leia .agents/skills/framecraft-visual-image-generation/SKILL.md. Nunca confunda LLM que escreve JSON com modelo que gera imagem. O endpoint visual NVIDIA usa FLUX.1 Schnell e depende de autorização/cota. A UI deve reportar falhas explicitamente e permitir usar foto enviada sem enviá-la ao modelo de imagem. Compositor híbrido preserva camadas editáveis e Zod. Mantenha arquivos no GitHub sincronizados com o Supabase.

import type {GenerateRequest} from '../src/lib/schema';

/** Curated design playbooks, adapted into model instructions at runtime. */
const stylePlaybooks:Record<GenerateRequest['style'],string>={
 studio: 'Identidade SaaS contemporânea: grid disciplinado, tipografia limpa, acabamento elegante, gradiente discreto, contraste alto, uma área dominante e CTA legível.',
 bold: 'Campanha de alto impacto: escala tipográfica expressiva, contraste dramático, geometria decisiva, 1 foco principal, textos curtos e composição memorável.',
 editorial: 'Design editorial premium: ritmo assimétrico, margem generosa, contraste entre serifada e sans serifada, leitura em colunas sem excesso de ornamentação.',
 minimal: 'Minimalismo funcional: poucos elementos, muito espaço negativo, paleta reduzida, hierarquia impecável e alinhamento intencional, sem cartões desnecessários.',
 playful: 'Criatividade didática: formas amigáveis, cores coordenadas, diagonais suaves, padrões contidos, títulos legíveis, dinâmica e acessibilidade sem poluição visual.',
};

const outputGuides:Record<GenerateRequest['format'],string>={
 portrait:'Post vertical 4:5: manchete no terço superior, principal benefício no centro, CTA e assinatura próximos ao rodapé. Evitar elementos encostados nas laterais.',
 square:'Post quadrado: equilíbrio entre título, assunto e CTA, sem esticar textos longos em linhas únicas.',
 story:'Story 9:16: preservar área de respiro superior/inferior para interface do aplicativo, foco legível à distância.',
 landscape:'Paisagem 16:9: alinhar conteúdos em seções, preservar foco e legibilidade horizontal; evitar centralizar tudo indiscriminadamente.',
 banner:'Banner 1.91:1: headline concisa com forte contraste, poucos elementos e composição clara em largura reduzida.',
};

export function buildDesignGuidance(style:GenerateRequest['style'],format:GenerateRequest['format']):string {
  return [
    'ASSUNTO ORIGINAL É OBRIGATÓRIO: extraia marcas, produtos e entidades nomeadas; PS5 deve ser identificável como PS5 e não apenas como "gaming". Preserve a copy real e nunca invente funcionalidades.',
    'ARTE DE CAMPANHA: usar elemento hero reconhecível, perspectiva, camadas de profundidade, silhuetas estilizadas e composição específica por assunto, não template genérico.',
    'FONTE DE VERDADE: frame.md define tokens, não o desenho. Adapte o fluxo determinístico do Hyperframes para quadros estáticos, não use suas ferramentas de vídeo para PNG.',
    'PLAYBOOK DE DIREÇÃO DE ARTE:',stylePlaybooks[style],
    'PLAYBOOK DE FORMATO:',outputGuides[format],
    'CHECKLIST DE QUALIDADE: preserve exatamente nomes próprios e textos fornecidos; não fabrique dados; use contraste legível; mantenha áreas seguras; nunca posicione duas caixas de texto na mesma área; dimensões exatas; espaçamento consistente; foco claro; não use mais de dois estilos de fonte; prefira precisão a ornamentação; evite identidade genérica de inteligência artificial.',
    'MOTOR VISUAL: permite textos, retângulos com gradiente, elipses, polígonos regulares (3 a 12 lados), estrelas (4 a 12 pontas) e linhas. Fotos exigem um motor de imagem separado; nunca simule fotos através de caixas.',
    'REGRAS PROFISSIONAIS OBRIGATÓRIAS: título principal com contraste e escala dominante (ideal 72–120px em posts de 1080px); textos auxiliares >=32px; máximo 3 blocos principais de texto; CTA visível no último terço; não use miniaturas de interface, microtextos, pequenos cartões repetidos ou listas de funcionalidades em fonte reduzida; mantenha equilíbrio visual, ritmo de espaçamento e ao menos um elemento gráfico focal.',
    'COPYS: preserve as informações solicitadas e nomes próprios, mas resuma sem inventar funcionalidades, preços, gratuidade, métricas ou promessas. Use linguagem editorial concisa. Evite texto genérico e variações vazias. O resultado deve funcionar como peça publicitária profissional quando visto em miniatura.',
  ].join('\n');
}

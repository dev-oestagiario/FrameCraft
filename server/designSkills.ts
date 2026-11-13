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
    'PLAYBOOK DE DIREÇÃO DE ARTE:',stylePlaybooks[style],
    'PLAYBOOK DE FORMATO:',outputGuides[format],
    'CHECKLIST DE QUALIDADE: preserve exatamente nomes próprios e textos fornecidos; não fabrique dados; use contraste legível; mantenha áreas seguras; nunca posicione duas caixas de texto na mesma área; dimensões exatas; espaçamento consistente; foco claro; não use mais de dois estilos de fonte; prefira precisão a ornamentação; evite identidade genérica de inteligência artificial.',
    'LIMITE TÉCNICO: o renderizador nativo aceita apenas textos, retângulos e elipses. Não descreva fotografias como se pudessem ser desenhadas em JSON; fotos pertencem ao campo imagePrompt do briefing.',
  ].join('\n');
}

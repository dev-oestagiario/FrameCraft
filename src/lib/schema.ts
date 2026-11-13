import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use cor hexadecimal #RRGGBB');
export const baseShape = z.object({
  id: z.string().min(1).max(80),
  x: z.number().finite().min(-4000).max(6000),
  y: z.number().finite().min(-4000).max(6000),
  width: z.number().finite().min(1).max(6000),
  height: z.number().finite().min(1).max(6000),
  rotation: z.number().finite().min(-360).max(360).default(0),
  opacity: z.number().finite().min(0).max(1).default(1),
});

export const textElement = baseShape.extend({
  type: z.literal('text'), content: z.string().max(400),
  fontSize: z.number().min(10).max(260).default(48),
  fontWeight: z.enum(['normal','bold']).default('bold'),
  color: hex.default('#ffffff'),
  align: z.enum(['left','center','right']).default('left'),
  fontFamily: z.enum(['Inter', 'Arial', 'Georgia', 'Verdana']).default('Inter'),
});
export const rectElement = baseShape.extend({
  type: z.literal('rect'), fill: hex.default('#2fcaa5'),
  radius: z.number().min(0).max(300).default(20), fillEnd: hex.optional(),
  stroke: hex.optional(), strokeWidth: z.number().min(0).max(30).default(0),
});
export const ellipseElement = baseShape.extend({
  type: z.literal('ellipse'), fill: hex.default('#2fcaa5'), fillEnd: hex.optional(),
  stroke: hex.optional(), strokeWidth: z.number().min(0).max(30).optional(),
});
export const polygonElement = baseShape.extend({
  type: z.literal('polygon'), fill: hex.default('#2fcaa5'),
  sides: z.number().int().min(3).max(12).default(4),
  stroke: hex.optional(), strokeWidth: z.number().min(0).max(30).default(0),
});
export const starElement = baseShape.extend({
  type: z.literal('star'), fill: hex.default('#2fcaa5'),
  points: z.number().int().min(4).max(12).default(5),
  innerRatio: z.number().min(0.1).max(0.85).default(0.46),
  stroke: hex.optional(), strokeWidth: z.number().min(0).max(30).default(0),
});
export const lineElement = baseShape.extend({
  type: z.literal('line'), fill: hex.default('#2fcaa5'),
  strokeWidth: z.number().min(1).max(30).default(5),
});
export const pathElement = baseShape.extend({
  type: z.literal('path'),
  // Only SVG path instructions, never markup, URLs, scripts or event handlers.
  data: z.string().min(8).max(4000).regex(/^[MmLlHhVvCcSsQqTtZz0-9eE.,+\-\s]+$/,
    'Apenas comandos SVG de path são aceitos'),
  fill: hex.default('#00AEEF'),
  stroke: hex.optional(),
  strokeWidth: z.number().min(0).max(30).default(0),
});
export const imageElement = baseShape.extend({
  type: z.literal('image'),
  fit: z.enum(['cover','stretch']).default('stretch'),
  src: z.string().max(4_800_000).refine(v => v.startsWith('data:image/png;base64,') || v.startsWith('data:image/jpeg;base64,') || v.startsWith('data:image/webp;base64,'), 'Imagem precisa ser data URI local'),
});
export const designElement = z.discriminatedUnion('type', [textElement, rectElement, ellipseElement, polygonElement, starElement, lineElement, pathElement, imageElement]);
export type DesignElement = z.infer<typeof designElement>;
export type TextElement = z.infer<typeof textElement>;
export type RectElement = z.infer<typeof rectElement>;
export type EllipseElement = z.infer<typeof ellipseElement>;
export type ImageElement = z.infer<typeof imageElement>;
export const designSchema = z.object({
  version: z.literal(1).default(1),
  title: z.string().min(1).max(90).default('Sem título'),
  description: z.string().max(500).default(''),
  canvas: z.object({ width: z.number().int().min(320).max(2400), height: z.number().int().min(320).max(2400), background: hex, backgroundEnd: hex.optional() }),
  elements: z.array(designElement).max(48),
});
export type Design = z.infer<typeof designSchema>;
export const briefSchema = z.object({
  concept: z.string().min(4).max(600),
  audience: z.string().min(2).max(250),
  headline: z.string().min(2).max(140),
  subheadline: z.string().max(180),
  visualDirection: z.string().min(8).max(1000),
  typography: z.string().max(400),
  palette: z.array(hex).min(2).max(6),
  hierarchy: z.string().max(500),
  imagePrompt: z.string().max(900).optional(),
  callToAction: z.string().max(120),
  brand: z.string().max(140).optional(),
  subject: z.string().max(170).optional(),
  mustInclude: z.array(z.string().min(1).max(170)).max(12).optional(),
  heroElement: z.string().max(400).optional(),
  renderIntent: z.enum(['professional-ad','editorial','simple-post']).optional(),
});
export type CreativeBrief = z.infer<typeof briefSchema>;
export const generateRequestSchema = z.object({
  prompt: z.string().trim().min(2).max(8500),
  style: z.enum(['studio','bold','editorial','minimal','playful']),
  format: z.enum(['portrait','square','story','landscape','banner']),
  previous: designSchema.optional(),
  instruction: z.string().trim().max(1200).optional(),
  enhancedPrompt: z.string().trim().max(8500).optional(),
  originalPrompt: z.string().trim().max(3000).optional(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export const formats = {
  portrait: { width: 1080, height: 1350, label: 'Post 4:5' },
  square: { width: 1080, height: 1080, label: 'Quadrado 1:1' },
  story: { width: 1080, height: 1920, label: 'Story 9:16' },
  landscape: { width: 1920, height: 1080, label: 'Paisagem 16:9' },
  banner: { width: 1200, height: 630, label: 'Banner 1.91:1' },
} as const;
export function normalizeDesign(design: Design): Design {
  const ids = new Set<string>();
  return {...design, elements: design.elements.map((e, i) => {
    let id = e.id;
    if (ids.has(id)) {
      let suffix = i;
      let tail = `-${suffix}`;
      let candidate = e.id.slice(0, 80 - tail.length) + tail;
      while (ids.has(candidate)) {
        suffix++; tail = `-${suffix}`;
        candidate = e.id.slice(0, 80 - tail.length) + tail;
      }
      id = candidate;
    }
    ids.add(id);
    return {...e, id, x: Math.round(e.x), y: Math.round(e.y), width: Math.round(e.width), height: Math.round(e.height)};
  })};
}

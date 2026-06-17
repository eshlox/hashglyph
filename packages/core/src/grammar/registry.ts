import { UnknownAlgorithmError } from '../errors.js';
import { cellularAutomataV1 } from './cellular-automata-v1.js';
import { coreAccentsV1 } from './core-accents-v1.js';
import { mirrorIdenticonV1 } from './mirror-identicon-v1.js';
import { quadFoldV1 } from './quad-fold-v1.js';
import { symmetricMaskV1 } from './symmetric-mask-v1.js';
import type { GlyphGrammar, GrammarId } from './types.js';

/** The grammar that produces the canonical `eshlox` mark. */
export const DEFAULT_GRAMMAR: GrammarId = 'core-accents-v1';

const GRAMMARS_BY_ID: Record<GrammarId, GlyphGrammar> = {
  'core-accents-v1': coreAccentsV1,
  'mirror-identicon-v1': mirrorIdenticonV1,
  'symmetric-mask-v1': symmetricMaskV1,
  'quad-fold-v1': quadFoldV1,
  'cellular-automata-v1': cellularAutomataV1,
};

/** All grammar ids in display order (canonical first). */
export const GRAMMAR_IDS: readonly GrammarId[] = [
  'core-accents-v1',
  'mirror-identicon-v1',
  'symmetric-mask-v1',
  'quad-fold-v1',
  'cellular-automata-v1',
];

/** All grammars in display order. */
export const GRAMMARS: readonly GlyphGrammar[] = GRAMMAR_IDS.map((id) => GRAMMARS_BY_ID[id]);

/** True when `id` is a known grammar id. */
export function isGrammarId(id: string): id is GrammarId {
  return Object.hasOwn(GRAMMARS_BY_ID, id);
}

/** Look up a grammar. @throws {UnknownAlgorithmError} for unknown ids. */
export function getGrammar(id: GrammarId): GlyphGrammar {
  const grammar = GRAMMARS_BY_ID[id];
  if (!grammar) {
    throw new UnknownAlgorithmError('grammar', id, GRAMMAR_IDS);
  }
  return grammar;
}

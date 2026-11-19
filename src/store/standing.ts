// What a player keeps through Start over (C129): the standing part of every product they own (the Founder awning, Plus), never the
// spent part (diamonds, the 24 h boost). Pure, so a test can prove it without the store.
import { GRANTS, restoredPart, type Grant } from '../services/grants';
import type { ProductId } from '../services/types';

/** One grant per owned one-time product, holding only its entitlements. */
export function standingGrants(owned: readonly ProductId[]): Grant[] {
  return owned
    .filter((id) => GRANTS[id])
    .map((id) => restoredPart(GRANTS[id]))
    .filter((g) => g.cosmetic || g.plus);
}

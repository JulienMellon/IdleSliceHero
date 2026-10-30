// Everything the static furniture layer reads, as one typed object of primitives. The storefront builds the
// furniture from these alone and memoises on their values, so a field the builder needs can't be forgotten
// from the memo's dependencies (the v3.5 `prep` bug: a managed shop's prep bench never updated).
import type { NeighborhoodId } from '../../content/types';

export interface FurnitureInputs {
  id: NeighborhoodId;
  name: string;
  fp: number;
  plants: number;
  tableTier: number;
  signageTier: number;
  prep: number;
  dough: number;
  boxes: number;
  idleShop: boolean;
  vehicle: number;
}

export interface FurnitureSource {
  id: NeighborhoodId;
  name: string;
  shop: { footprint: number; prep: number; managed: boolean; queued: number; decor: { plants: number; tables: number; signage: number } };
  running: boolean;
  rate: number;
  vehicle: number;
}

export function furnitureInputs({ id, name, shop, running, rate, vehicle }: FurnitureSource): FurnitureInputs {
  return {
    id,
    name,
    fp: shop.footprint,
    plants: shop.decor.plants,
    tableTier: shop.decor.tables,
    signageTier: shop.decor.signage,
    prep: shop.prep,
    // dough on the bench follows the tap queue in an unmanaged shop
    dough: shop.managed ? 3 : Math.max(2, Math.min(8, Math.ceil(shop.queued / 1.5))),
    boxes: running ? Math.min(5, 1 + Math.round(Math.log2(1 + rate))) : 0,
    // an unmanaged shop's chip strip covers the kerb, so its sidewalk props move up and the vehicle stays home
    idleShop: !shop.managed && id !== 'downtown',
    vehicle,
  };
}

/** The memo dependencies: every input's value. Derived from the object (key order is fixed by `furnitureInputs`), so a new field can't be left out. */
export const furnitureDeps = (f: FurnitureInputs): (string | number | boolean)[] => Object.values(f);

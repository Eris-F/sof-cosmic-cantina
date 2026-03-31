/**
 * Zone registry — barrel export for all scene touch zones.
 *
 * @module zones
 */
export { zone, zoneHit, zoneCenter, zoneTestPoints } from './Zone';
export type { Zone } from './Zone';

export { ZoneNames, shopCategoryTab, shopItemCard, shopBuyButton, skillBranch, skillUpgrade } from './names';
export type { ZoneName } from './names';

export * as MenuZones from './menu';
export * as ShopZones from './shop';
export * as SkillTreeZones from './skilltree';
export * as TutorialZones from './tutorial';
export * as GameplayZones from './gameplay';

// How the layers talk in a city other than home (v5.18, card T2, step 6; card R5c). The lookup moved to content/copy/index.ts (`dressed`, `isDressed`
// are wrappers over `t`'s pack-then-home lookup) and a city's own table to its pack (`CityDef.copy`); this path keeps the
// layer screens' imports working.
export { dressed, isDressed } from '../../content/copy';

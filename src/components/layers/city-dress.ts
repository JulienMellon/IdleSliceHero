// How the layers talk in a city other than home (v5.18, card T2, step 6; card R5c). The lookup moved to content/copy/index.ts (`dressed`, `isDressed`
// are wrappers over `t`'s pack-then-home lookup) and Boston's table to its own pack (content/cities/boston/copy.ts, `CityDef.copy`); this path keeps the
// layer screens' imports working.
export { dressed, isDressed } from '../../content/copy';
export { BOSTON_ASKS } from '../../content/cities/boston/copy';

// The key-value store on the web and in tests (the iOS one is store.native.ts).
import { webKV } from './kv';

export const store = webKV();

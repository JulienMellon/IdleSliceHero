// The singletons the platform files share.
import { createGrantBus } from './grant-bus';
import { createPrivacy } from './privacy';
import { store } from './store';

export const privacy = createPrivacy(store);
export const grantBus = createGrantBus();

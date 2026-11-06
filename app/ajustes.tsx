import Constants from 'expo-constants';

import { AjustesScreen } from '../src/features/ajustes/AjustesScreen';
import { devToolsEnabled } from '../src/features/errorCenter';

export { ErrorBoundary } from '../src/features/errorCenter';

export default function Ajustes() {
  return (
    <AjustesScreen version={Constants.expoConfig?.version ?? '?'} devTools={devToolsEnabled} />
  );
}

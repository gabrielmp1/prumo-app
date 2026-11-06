import { devToolsEnabled } from '../src/features/errorCenter';
import { HomeScreen } from '../src/features/home/HomeScreen';

export { ErrorBoundary } from '../src/features/errorCenter';

export default function Index() {
  return <HomeScreen devTools={devToolsEnabled} />;
}

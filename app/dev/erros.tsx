import { ErrorCenterScreen } from '../../src/features/errorCenter';

// Só existe em modo dev: a rota está dentro de Stack.Protected (src/features/navigation/AppStack).
export { ErrorBoundary } from '../../src/features/errorCenter';

export default function CentralDeErros() {
  return <ErrorCenterScreen />;
}

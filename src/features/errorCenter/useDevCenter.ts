import { useSyncExternalStore } from 'react';

import { errorCenter } from '../../observability';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';

/** O transporte da Central na instância padrão (existe só em modo dev). */
export function defaultDevCenter(): DevCenterTransport | undefined {
  return errorCenter.transports.find((t) => t instanceof DevCenterTransport);
}

const noop = () => () => undefined;
const zero = () => 0;

/** Redesenha o componente sempre que a Central muda (erro novo, resolvido, limpeza...). */
export function useDevCenterVersion(transport: DevCenterTransport | undefined): number {
  return useSyncExternalStore(
    transport ? (l) => transport.subscribe(l) : noop,
    transport ? () => transport.version() : zero,
  );
}

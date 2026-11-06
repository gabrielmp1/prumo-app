import {
  SEVERITY_RANK,
  type ErrorEvent,
  type ErrorGroup,
  type ErrorLogStore,
  type ErrorTransport,
} from '../types';

export type { ErrorGroup } from '../types';

const DEFAULT_MAX_GROUPS = 500;

/**
 * Alimenta a tela "Central de Erros" (só em dev), agrupando repetições pela impressão digital.
 * Mantém os grupos em memória (leitura imediata pela tela) e grava no banco em segundo plano,
 * numa fila, para os erros sobreviverem ao fechar o app.
 */
export class DevCenterTransport implements ErrorTransport {
  readonly name = 'devCenter';
  /** Quantas gravações no banco falharam (mostrado na Central; não dá para reportar sem laço). */
  persistFailures = 0;
  lastPersistError: string | undefined;

  private readonly byFingerprint = new Map<string, ErrorGroup>();
  private store: ErrorLogStore | undefined;
  private pending: ErrorEvent[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly maxGroups = DEFAULT_MAX_GROUPS) {}

  send(event: ErrorEvent): void {
    this.addToMemory(event);
    if (this.store) {
      const store = this.store;
      this.enqueue(() => store.record(event));
    } else {
      // Banco ainda não abriu (início do app): guarda para gravar quando abrir.
      this.pending.push(event);
    }
  }

  /** Liga o banco. Eventos que chegaram antes são gravados agora, na ordem. */
  attachStore(store: ErrorLogStore): void {
    this.store = store;
    const early = this.pending;
    this.pending = [];
    for (const event of early) this.enqueue(() => store.record(event));
  }

  /** Troca a memória pelo que está no banco (erros de aberturas anteriores incluídos). */
  async load(): Promise<void> {
    const store = this.store;
    if (!store) return;
    let groups: ErrorGroup[];
    // Se chegar evento durante a leitura, ele ainda não estava no banco: grava e lê de novo.
    for (;;) {
      const before = this.enqueued;
      await this.flush();
      groups = await store.list();
      if (this.enqueued === before) break;
    }
    this.byFingerprint.clear();
    for (const group of groups.slice(0, this.maxGroups)) {
      this.byFingerprint.set(group.fingerprint, group);
    }
  }

  /** Espera as gravações pendentes terminarem. */
  flush(): Promise<void> {
    return this.queue;
  }

  /** Grupos do mais recente para o mais antigo. */
  groups(): ErrorGroup[] {
    return [...this.byFingerprint.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }

  async clear(): Promise<void> {
    this.byFingerprint.clear();
    this.pending = [];
    const store = this.store;
    if (store) this.enqueue(() => store.clear());
    await this.flush();
  }

  private enqueued = 0;

  private enqueue(task: () => Promise<void>): void {
    this.enqueued += 1;
    this.queue = this.queue.then(task).catch((error: unknown) => {
      this.persistFailures += 1;
      this.lastPersistError = error instanceof Error ? error.message : String(error);
    });
  }

  private addToMemory(event: ErrorEvent): void {
    const group = this.byFingerprint.get(event.fingerprint);
    if (group) {
      group.count += 1;
      group.lastAt = event.occurredAt;
      group.lastEvent = event;
      if (SEVERITY_RANK[event.severity] > SEVERITY_RANK[group.severity]) {
        group.severity = event.severity;
      }
      return;
    }
    this.byFingerprint.set(event.fingerprint, {
      fingerprint: event.fingerprint,
      code: event.code,
      module: event.module,
      severity: event.severity,
      count: 1,
      firstAt: event.occurredAt,
      lastAt: event.occurredAt,
      lastEvent: event,
    });
    if (this.byFingerprint.size > this.maxGroups) this.dropOldest();
  }

  private dropOldest(): void {
    let oldest: ErrorGroup | undefined;
    for (const g of this.byFingerprint.values()) {
      if (!oldest || g.lastAt < oldest.lastAt) oldest = g;
    }
    if (oldest) this.byFingerprint.delete(oldest.fingerprint);
  }
}

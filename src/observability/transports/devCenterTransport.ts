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
  private lastSeen: string | null = null;
  private readonly listeners = new Set<() => void>();
  private changes = 0;

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
    this.notify();
  }

  /** Avisa a tela a cada mudança. Devolve a função que cancela o aviso. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Muda a cada alteração: a tela usa para saber quando redesenhar. */
  version(): number {
    return this.changes;
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
    this.lastSeen = await store.getLastSeen();
    this.notify();
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
    this.notify();
    await this.flush();
  }

  /** "Marcar como resolvido": some da lista; se o erro voltar, aparece de novo como novo. */
  async resolve(fingerprint: string): Promise<void> {
    this.byFingerprint.delete(fingerprint);
    this.pending = this.pending.filter((e) => e.fingerprint !== fingerprint);
    const store = this.store;
    if (store) this.enqueue(() => store.remove(fingerprint));
    this.notify();
    await this.flush();
  }

  /** Registra que a Central foi aberta agora: o que veio antes deixa de ser "novo". */
  async markSeen(at: string): Promise<void> {
    this.lastSeen = at;
    const store = this.store;
    if (store) this.enqueue(() => store.setLastSeen(at));
    this.notify();
    await this.flush();
  }

  lastSeenAt(): string | null {
    return this.lastSeen;
  }

  /** Grupos com ocorrência depois da última abertura da Central (todos, se nunca abriu). */
  newGroups(): ErrorGroup[] {
    const since = this.lastSeen;
    return this.groups().filter((g) => since === null || g.lastAt > since);
  }

  private notify(): void {
    this.changes += 1;
    for (const listener of this.listeners) listener();
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

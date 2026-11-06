import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { createErrorCenter } from '../../observability/center';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import { ErrorCenterScreen } from './ErrorCenterScreen';

// Relógio fixo: horários exibidos no fuso de São Paulo (TZ fixado em test/globalSetup.js).
function montar() {
  const transporte = new DevCenterTransport();
  let minuto = 0;
  const center = createErrorCenter({
    mode: 'dev',
    transports: [transporte],
    appVersion: '0.0.1',
    now: () => new Date(Date.parse('2026-11-06T13:00:00.000Z') + minuto * 60_000),
  });
  const copiados: string[] = [];
  const copy = jest.fn(async (texto: string) => {
    copiados.push(texto);
  });
  return {
    transporte,
    center,
    copy,
    copiados,
    aos: (m: number) => {
      minuto = m;
    },
    abrir: () =>
      render(
        <ErrorCenterScreen
          transport={transporte}
          copy={copy}
          now={() => new Date('2026-11-06T15:00:00.000Z')}
        />,
      ),
  };
}

describe('P0-S0-07 · tela da Central de Erros', () => {
  it('estado vazio: "Nenhum erro registrado"', async () => {
    await montar().abrir();
    expect(screen.getByRole('header', { name: 'Central de Erros' })).toBeOnTheScreen();
    expect(screen.getByText('Nenhum erro registrado')).toBeOnTheScreen();
  });

  it('lista agrupada por código: contagem, severidade em texto e última ocorrência', async () => {
    const m = montar();
    m.center.reportError('DAT-003', new Error('Falha ao salvar item 1'));
    m.aos(5);
    m.center.reportError('DAT-003', new Error('Falha ao salvar item 2'));
    m.center.reportWarning('PLN-003', 'Tarefa não cabe');
    await m.abrir();

    const item = screen.getByRole('button', { name: /^DAT-003/ });
    expect(within(item).getByText('DAT-003')).toBeOnTheScreen();
    expect(within(item).getByText('x2')).toBeOnTheScreen();
    expect(within(item).getByText('Erro')).toBeOnTheScreen();
    expect(within(item).getByText('06/11 10:05')).toBeOnTheScreen();
    expect(within(item).getByText('Falha ao salvar item 2')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^PLN-003, Aviso, 1 vez/ })).toBeOnTheScreen();
  });

  it('filtro por severidade e por módulo', async () => {
    const m = montar();
    m.center.reportError('DAT-003', new Error('a'));
    m.center.reportWarning('PLN-003', 'b');
    m.center.reportFatal('UI-001', new Error('c'));
    await m.abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Aviso' }));
    expect(screen.queryByRole('button', { name: /^DAT-003/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^PLN-003/ })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Todas' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Módulo ui' }));
    expect(screen.getByRole('button', { name: /^UI-001/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^PLN-003/ })).toBeNull();
  });

  it('"Só novos" mostra o que aconteceu depois da última abertura e diz quando não há nada', async () => {
    const m = montar();
    m.center.reportWarning('PLN-003', 'antigo');
    await m.transporte.markSeen('2026-11-06T13:30:00.000Z');
    m.aos(60);
    m.center.reportError('DAT-003', new Error('novo'));
    await m.abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Só novos' }));
    expect(screen.getByRole('button', { name: /^DAT-003/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^PLN-003/ })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Fatal' }));
    expect(screen.getByText('Nenhum erro com esses filtros')).toBeOnTheScreen();
  });

  it('abrir a Central marca tudo como visto (o selo zera)', async () => {
    const m = montar();
    m.center.reportWarning('PLN-003', 'a');
    expect(m.transporte.newGroups()).toHaveLength(1);
    await m.abrir();
    expect(m.transporte.lastSeenAt()).toBe('2026-11-06T15:00:00.000Z');
    expect(m.transporte.newGroups()).toHaveLength(0);
  });

  it('detalhe: mensagem, contexto, pilha, trilha, tela e versão; "Voltar" retorna à lista', async () => {
    const m = montar();
    m.center.setScreen('/dia');
    m.center.breadcrumb('ui', 'toque no bloco');
    m.center.reportError('DAT-003', new Error('Falha ao salvar item 7'), { itemId: 'abc' });
    await m.abrir();

    await fireEvent.press(screen.getByRole('button', { name: /^DAT-003/ }));
    expect(screen.getByRole('header', { name: 'DAT-003 · data' })).toBeOnTheScreen();
    expect(screen.getByText('Falha ao salvar item 7')).toBeOnTheScreen();
    expect(screen.getByText('{"itemId":"abc"}')).toBeOnTheScreen();
    expect(screen.getByText(/Error: Falha ao salvar item 7/)).toBeOnTheScreen();
    expect(screen.getByText('ui:toque no bloco')).toBeOnTheScreen();
    expect(screen.getByText('/dia')).toBeOnTheScreen();
    expect(screen.getByText('0.0.1')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByRole('header', { name: 'Central de Erros' })).toBeOnTheScreen();
  });

  it('"Copiar relatório" de um erro e "Copiar tudo" mandam o Markdown e avisam', async () => {
    const m = montar();
    m.center.reportError('DAT-003', new Error('a'));
    m.center.reportWarning('PLN-003', 'b');
    await m.abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Copiar tudo' }));
    expect(m.copiados[0]).toMatch(/^# Relatório da Central de Erros \(2 grupos\)/);
    expect(await screen.findByText('Relatório copiado')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /^PLN-003/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Copiar relatório' }));
    expect(m.copiados[1]).toMatch(/^## Erro PLN-003 \(x1\) — planner/);
  });

  it('falha ao copiar: avisa na tela e reporta (sem quebrar)', async () => {
    expectReportedError('UI-002');
    const m = montar();
    m.center.reportError('DAT-003', new Error('a'));
    m.copy.mockRejectedValueOnce(new Error('sem área de transferência'));
    await m.abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Copiar tudo' }));
    expect(await screen.findByText('Não foi possível copiar')).toBeOnTheScreen();
  });

  it('"Marcar como resolvido" tira o erro da lista', async () => {
    const m = montar();
    m.center.reportError('DAT-003', new Error('a'));
    m.center.reportWarning('PLN-003', 'b');
    await m.abrir();

    await fireEvent.press(screen.getByRole('button', { name: /^DAT-003/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar como resolvido' }));
    expect(await screen.findByRole('header', { name: 'Central de Erros' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^DAT-003/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^PLN-003/ })).toBeOnTheScreen();
  });

  it('"Limpar tudo" esvazia a lista', async () => {
    const m = montar();
    m.center.reportError('DAT-003', new Error('a'));
    await m.abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Limpar tudo' }));
    expect(await screen.findByText('Nenhum erro registrado')).toBeOnTheScreen();
  });

  it('erro novo aparece na lista sem precisar reabrir a tela', async () => {
    const m = montar();
    await m.abrir();
    m.center.reportWarning('PLN-003', 'chegou agora');
    expect(await screen.findByRole('button', { name: /^PLN-003/ })).toBeOnTheScreen();
  });

  it('tem "Simular erro" e "Rodar autodiagnóstico" (este desativado até a P0-S0-08)', async () => {
    await montar().abrir();
    expect(screen.getByRole('button', { name: 'Simular erro' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Rodar autodiagnóstico' })).toBeDisabled();
  });

  it('fora do modo dev (sem Central ligada): explica em vez de quebrar', async () => {
    await render(<ErrorCenterScreen />);
    expect(
      screen.getByText('A Central de Erros só existe no modo de desenvolvimento.'),
    ).toBeOnTheScreen();
  });

  it('avisa quando gravações no aparelho falharam', async () => {
    const m = montar();
    m.transporte.persistFailures = 2;
    m.transporte.lastPersistError = 'disco cheio';
    await m.abrir();
    expect(
      screen.getByText('2 erros não foram gravados no aparelho (disco cheio).'),
    ).toBeOnTheScreen();
  });
});

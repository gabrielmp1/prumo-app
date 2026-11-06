// Arquivo de exemplo rodado por test/setup.behavior.test.ts num Jest separado.
// Não roda na suíte normal (o nome não termina em .test.ts). O primeiro e o terceiro
// testes DEVEM falhar: é isso que prova que o test/setup.ts funciona.
import { reportError, reportWarning } from '../../src/observability';

it('sem expectativa: erro reportado faz o teste falhar', () => {
  reportError('DAT-003', new Error('Falha ao salvar item 42'));
});

it('com expectativa: erro reportado não faz o teste falhar', () => {
  expectReportedError('PLN-003');
  reportWarning('PLN-003', 'Tarefa não cabe até o prazo');
});

it('a expectativa vale só para o teste em que foi marcada', () => {
  reportWarning('PLN-003', 'Tarefa não cabe até o prazo');
});

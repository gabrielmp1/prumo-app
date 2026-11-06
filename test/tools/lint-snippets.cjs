// Roda o ESLint do projeto sobre trechos de código recebidos pela entrada padrão.
// Fica fora do Jest porque o ESLint carrega a configuração com import() dinâmico,
// que o ambiente de testes do Jest não suporta.
// Entrada: JSON [{ filePath, code }]. Saída: JSON [[ruleId, ...], ...] na mesma ordem.
const { Buffer } = require('node:buffer');
const process = require('node:process');

const { ESLint } = require('eslint');

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const snippets = JSON.parse(Buffer.concat(chunks).toString('utf8'));

  const eslint = new ESLint({ cwd: process.cwd() });
  const out = [];
  for (const { filePath, code } of snippets) {
    const [result] = await eslint.lintText(code, { filePath });
    out.push((result ? result.messages : []).map((m) => m.ruleId || 'parse-error'));
  }
  process.stdout.write(JSON.stringify(out));
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error));
  process.exit(1);
});

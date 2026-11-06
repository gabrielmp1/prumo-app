// Filtro de privacidade de relatórios de erro. Hoje: "Copiar relatório" da Central.
// Obrigatório em tudo que for enviado a servidor (Sentry, "Relatar um problema": P3-S13-03).

// URL do bundle do Metro seguida de :linha:coluna (pilhas do Hermes em dev).
const BUNDLE_URL = /\b[a-z][a-z0-9+.-]*:\/\/[^\s()]*?\.bundle[^\s()]*?:(\d+):(\d+)/gi;
const URL = /\b(?:https?|exp|exps|wss?|file|ftp):\/\/[^\s()<>"']+/gi;
const WINDOWS_USER = /\b[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s]+/g;
// Sem "lookbehind" na expressão: o caractere anterior é capturado e devolvido ($1).
const UNIX_USER = /(^|[^\w.])\/(?:home|Users)\/[^/\s]+/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

/** Troca a URL enorme do bundle por "bundle:linha:coluna". Não remove mais nada. */
export function shortenBundleUrls(text: string): string {
  return text.replace(BUNDLE_URL, 'bundle:$1:$2');
}

/** Remove URLs de servidor, pastas do usuário (com o nome dele) e e-mails. */
export function sanitizeReport(text: string): string {
  return shortenBundleUrls(text)
    .replace(URL, '<url>')
    .replace(WINDOWS_USER, '<usuário>')
    .replace(UNIX_USER, '$1<usuário>')
    .replace(EMAIL, '<e-mail>');
}

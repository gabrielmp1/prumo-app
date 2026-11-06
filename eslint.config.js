// Configuração mínima da Expo; regras do projeto entram na P0-S0-02.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'docs/*'],
  },
]);

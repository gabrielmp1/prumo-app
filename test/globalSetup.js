// Fuso fixo para os testes: horários exibidos nas telas não dependem do computador nem da CI.
// (O "agora" dos testes já é controlado; isto fixa o fuso, como o do usuário.)
module.exports = async () => {
  process.env.TZ = 'America/Sao_Paulo';
};

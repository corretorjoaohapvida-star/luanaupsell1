/* Configure apenas links HTTPS verificados. Não use o checkout do produto principal no upsell. */
window.FUNIL_CONFIG = {
  materialUrl: '',
  checkoutUrl: 'https://pay.cakto.com.br/uuzxa7q_1318634',
  atendimentoUrl: '',
  giftUrl: 'presente.html',
  price: 27,
  // Contratação liberada pelo usuário após configurar a entrega na Cakto.
  offerEnabled: true,
  deliveryText: 'Após a confirmação do pagamento, a equipe da Luana Araújo entrará em contato pelo e-mail e WhatsApp informados na compra para dar continuidade ao atendimento. O plano será elaborado após a avaliação profissional. O prazo de entrega será informado no atendimento.',
  supportText: 'Confira também as pastas de spam e promoções. Para corrigir seus contatos ou pedir ajuda, escreva para joaodavidmkt2025@gmail.com e informe o número do pedido.',
  testimonials: [
    { src: 'videos/depoimento-01.mp4', poster: 'videos/depoimento-01.jpg', title: 'Depoimento 1' },
    { src: 'videos/depoimento-02.mp4', poster: 'videos/depoimento-02.jpg', title: 'Depoimento 2' }
  ],
  // Arquivos reais gravados/autorizados pela Luana. Sem arquivo, aparece somente o texto.
  audios: { welcome: 'audios/01-boas-vindas.mp3', routine: 'audios/02-rotina.mp3', obstacle: 'audios/03-dificuldade.mp3', household: 'audios/04-sua-casa.mp3', priority: 'audios/05-prioridade.mp3', bridge: 'audios/06-convite.mp3', offer: 'audios/07-seu-plano.mp3', closing: 'audios/08-presente.mp3' }
};

/* Configure apenas links HTTPS verificados. Não use o checkout do produto principal no upsell. */
window.FUNIL_CONFIG = {
  materialUrl: '',
  checkoutUrl: '',
  atendimentoUrl: '',
  giftUrl: 'presente.html',
  price: 27,
  // Ative a contratação somente depois de definir profissional responsável, entrega,
  // prazo, suporte, privacidade e checkout correto.
  offerEnabled: false,
  deliveryText: '',
  supportText: '',
  testimonials: [
    { src: 'videos/depoimento-01.mp4', poster: 'videos/depoimento-01.jpg', title: 'Depoimento 1' },
    { src: 'videos/depoimento-02.mp4', poster: 'videos/depoimento-02.jpg', title: 'Depoimento 2' }
  ],
  // Arquivos reais gravados/autorizados pela Luana. Sem arquivo, aparece somente o texto.
  audios: { welcome: 'audios/01-boas-vindas.mp3', routine: 'audios/02-rotina.mp3', obstacle: 'audios/03-dificuldade.mp3', household: 'audios/04-sua-casa.mp3', priority: 'audios/05-prioridade.mp3', bridge: 'audios/06-convite.mp3', offer: 'audios/07-seu-plano.mp3', closing: 'audios/08-presente.mp3' }
};

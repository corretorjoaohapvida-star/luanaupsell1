(() => {
  'use strict';
  const config = window.FUNIL_CONFIG || {};
  const KEY = 'luana-conversa-v1';
  const $ = id => document.getElementById(id);
  const choices = $('choices');
  const questions = [
    { id: 'meal', text: 'Qual refeição você mais acaba improvisando?', audio: 'routine', lead: 'Primeiro, vamos olhar para o seu dia a dia. Em qual momento você mais fica sem saber o que preparar?', options: ['Café da manhã', 'Almoço', 'Jantar'], replies: ['Café da manhã registrado.', 'Almoço registrado.', 'Jantar registrado.'] },
    { id: 'obstacle', text: 'O que mais dificulta sua alimentação hoje?', audio: 'obstacle', lead: 'Você até pensa em preparar alguma coisa, mas o dia aperta? Os ingredientes parecem caros? Ou falta decidir o que combinar?', options: ['Falta tempo para preparar', 'Tenho receio de gastar muito', 'Não sei organizar as refeições'], replies: ['Certo. Praticidade vai ser importante nessa organização.', 'Certo. O orçamento precisa fazer parte dessa organização.', 'Certo. Você quer facilitar as decisões sobre as refeições.'] },
    { id: 'habit', text: 'Quando você não consegue se organizar, o que costuma acontecer?', options: ['Repito a mesma comida', 'Improviso com o que encontro', 'Compro algo pronto ou peço comida'], replies: ['Entendi. Você quer alternativas sem precisar inventar um preparo novo toda hora.', 'Entendi. Decidir tudo com fome é uma parte da rotina que você quer mudar.', 'Entendi. Você quer ter uma opção definida antes desse momento.'] },
    { id: 'home', text: 'Você costuma preparar comida para quem?', audio: 'household', lead: 'Essa organização precisa caber na sua casa. Vamos considerar também para quem você cozinha.', options: ['Só para mim', 'Para mim e mais uma pessoa', 'Para a família'], replies: ['Registrado: preparos para uma pessoa.', 'Registrado: você costuma cozinhar para duas pessoas.', 'Registrado: sua organização precisa considerar a comida da família.'] },
    { id: 'time', text: 'Qual opção combina mais com sua rotina?', options: ['Preciso de preparos rápidos', 'Consigo cozinhar um pouco por dia', 'Prefiro adiantar comida de uma vez'], replies: ['Certo. Você prefere resolver a refeição com poucos preparos.', 'Certo. Você consegue reservar um momento do dia para cozinhar.', 'Certo. Você prefere concentrar parte do trabalho e deixar comida encaminhada.'] },
    { id: 'priority', text: 'O que você mais quer facilitar agora?', audio: 'priority', lead: 'Estamos chegando ao final. Escolha a mudança que realmente faria diferença no seu dia.', options: ['Comer melhor sem complicar o dia', 'Organizar a alimentação sem estourar o orçamento', 'Parar de decidir cada refeição na última hora'], replies: [] }
  ];
  const profiles = {
    praticidade: { name: 'Praticidade primeiro', text: 'Pelas suas respostas, a praticidade precisa vir primeiro. Você já tem opções no material. O próximo passo é escolher quais entram na sua rotina e como deixar o preparo viável.', items: '• Considerar o tempo disponível para cozinhar.\n• Escolher preparos compatíveis com sua rotina.\n• Organizar alternativas para a refeição que você costuma improvisar.' },
    economia: { name: 'Orçamento em primeiro lugar', text: 'Pelas suas respostas, o orçamento precisa entrar nessa organização desde o começo. As escolhas precisam considerar os alimentos que você costuma comprar e o que cabe no seu bolso.', items: '• Considerar os alimentos que você já compra.\n• Organizar substituições possíveis.\n• Planejar o uso dos ingredientes entre os preparos.' },
    organizacao: { name: 'Menos decisões na hora de comer', text: 'Pelas suas respostas, você quer chegar à hora de comer com menos decisões pendentes. Organizar quais receitas usar e como adiantar os preparos é o próximo passo.', items: '• Definir alternativas para cada refeição.\n• Considerar para quantas pessoas você cozinha.\n• Organizar o que pode ser preparado com antecedência.' }
  };
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(config.price || 27);
  const fresh = () => ({ version: 2, stage: 'welcome', answers: [], history: [], giftDelivered: false });
  let state = fresh();
  let visibleCount = 0;
  let deliveryTimer = null;
  let renderedItems = [];
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && (saved.version === 1 || saved.version === 2) && Array.isArray(saved.answers) && saved.answers.length <= 6 && saved.answers.every(v => Number.isInteger(v) && v >= 0 && v < 3) && Array.isArray(saved.history) && saved.history.length < 180 && ['welcome','questions','bridge','testimonials','offer','faq','checkout','gift','paused'].includes(saved.stage)) {
        state = saved;
        state.history.forEach(item => {
          if (typeof item.text === 'string' && /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(item.text)) {
            item.text = item.text.includes('Após a confirmação do pagamento') ? config.deliveryText + '\n\n' + config.supportText : config.supportText;
          }
        });
        if (config.offerEnabled) {
          state.history = state.history.filter(item => item.text !== 'O atendimento ainda não está disponível para contratação. Seu material comprado e seu presente continuam acessíveis.');
          state.history.forEach(item => {
            if (item.kind === 'offer' && typeof item.text === 'string') item.text = item.text.replace('EU MONTO SEU PLANO\nCom a nutricionista Luana Araújo', 'SEU PLANO ALIMENTAR PERSONALIZADO\nPor Luana Araújo');
          });
        }
        if (saved.version === 1 && ['welcome','paused'].includes(saved.stage)) state = fresh();
      }
    } catch (_) { /* A conversa também funciona sem armazenamento. */ }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
  function msg(text, options = {}) { state.history.push({ text, at: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), ...options }); }
  function audio(text, id) { msg(text, { kind: 'audio', audio: id }); }
  function safeHttps(url) { try { return new URL(url).protocol === 'https:' ? url : ''; } catch (_) { return ''; } }
  function profile(answers = state.answers) {
    const score = { praticidade: 0, economia: 0, organizacao: 0 };
    const keys = Object.keys(score);
    if (answers[1] !== undefined) score[keys[answers[1]]] += 3;
    if (answers[2] !== undefined) score[answers[2] === 0 ? 'organizacao' : 'praticidade']++;
    if (answers[4] !== undefined) score[answers[4] === 2 ? 'organizacao' : 'praticidade']++;
    if (answers[5] !== undefined) score[keys[answers[5]]] += 3;
    return keys.sort((a, b) => score[b] - score[a])[0];
  }
  function start() {
    state = fresh();
    msg('Sua compra foi confirmada! 💚\n\nPode ficar tranquila: o acesso ao seu material é enviado pela plataforma para o e-mail da compra. Confira também a caixa de spam. Se precisar, você encontra a orientação de acesso no menu aqui em cima.\n\nEnquanto isso, a Luana Araújo quer falar com você. Escute a mensagem abaixo. 👇');
    audio('Oi! Aqui é a Luana Araújo. Obrigada pela confiança.\n\nAntes de escolher sua primeira receita, quero te ajudar a dar o primeiro passo. Com tantas opções, pode surgir aquela dúvida: por onde eu começo?\n\nVamos conversar rapidinho sobre a sua rotina? São seis perguntas simples. E, no final, tem um presente para você: três ideias para começar aproveitando os ingredientes entre os preparos.\n\nQuando quiser começar, é só escolher a opção aqui embaixo.', 'welcome');
    update();
  }
  function question() {
    const q = questions[state.answers.length];
    if (q.lead) audio(q.lead, q.audio);
    msg(q.text, { kind: 'question', number: state.answers.length + 1 });
  }
  function summary() {
    const label = i => questions[i].options[state.answers[i]];
    msg(`Respostas registradas ✅\n\nRefeição que mais improvisa: ${label(0)}.\nPrincipal dificuldade: ${label(1)}.\nPara quem cozinha: ${label(3)}.\nPreferência de preparo: ${label(4)}.`);
    const p = profiles[profile()];
    msg(p.name, { kind: 'question' });
    msg(p.text + '\n\n' + p.items);
    audio('Você pode seguir com suas receitas e escolher os preparos por conta própria.\n\nMas, se quiser ajuda profissional para organizar sua alimentação, quero te apresentar a opção de avaliação individual com elaboração de plano alimentar.\n\nEstas perguntas iniciais organizam sua rotina. A avaliação profissional é uma etapa própria, com as demais informações necessárias ao atendimento. Quer conhecer?', 'bridge');
    state.stage = 'bridge';
  }
  function testimonials() {
    const videos = config.testimonials || [];
    if (!videos.length) { offer(); return; }
    state.stage = 'testimonials';
    msg('Antes dos detalhes, veja os relatos em vídeo. Toque no play para assistir com som.');
    videos.forEach((video, index) => msg(video.title || `Depoimento ${index + 1}`, { kind: 'testimonial', video: index }));
    msg('Você já deu o primeiro passo escolhendo suas receitas. Agora imagine chegar à hora de comer sem precisar decidir tudo de novo, com um plano que considere sua rotina e o que cabe no seu bolso.\n\nVeja como a Luana pode te ajudar a colocar isso em prática.');
  }
  function offer() {
    state.stage = 'offer';
    audio('A proposta é sair do “tenho várias receitas” para uma orientação sobre como organizar sua alimentação.\n\nDepois da contratação, você completa as informações do atendimento. A Luana avalia o seu caso, esclarece o que for necessário e elabora o plano considerando sua realidade.', 'offer');
    msg('SEU PLANO ALIMENTAR PERSONALIZADO\nPor Luana Araújo\n\nVocê tenta se organizar, o dia aperta e, quando vê, está escolhendo qualquer coisa com fome. Ter receitas ajuda. Ter um plano que considere a sua rotina é o próximo passo.\n\n• Avaliação individual com a Luana.\n• Plano alimentar elaborado após a avaliação, considerando seus gostos, sua rotina e seu orçamento.\n• Orientações e substituições para saber como seguir o plano no dia a dia.', { kind: 'offer', price: money });
    if (config.deliveryText) msg(config.deliveryText + (config.supportText ? '\n\n' + config.supportText : ''));
    if (!config.offerEnabled) msg('O atendimento ainda não está disponível para contratação. Seu material comprado e seu presente continuam acessíveis.');
  }
  function gift() {
    state.stage = 'gift';
    if (!state.giftDelivered) {
      msg('🎁 Seu presente: Primeira Compra Sem Sobras\n\nTrês ideias de preparo com ingredientes que se repetem e uma lista de compras para começar. Confira o que você já tem em casa antes de comprar.', { kind: 'gift' });
      audio('Aqui está o presente que prometi. Escolha por qual preparo quer começar e confira os ingredientes. Obrigada por estar aqui. Agora você já tem um primeiro passo definido.', 'closing');
      state.giftDelivered = true;
    }
  }
  function dialog(title, text, link) {
    $('dialog-title').textContent = title;
    $('dialog-body').replaceChildren();
    const p = document.createElement('p'); p.textContent = text; $('dialog-body').append(p);
    if (link) { const a = document.createElement('a'); a.href = link; a.textContent = 'Abrir acesso'; a.target = '_blank'; a.rel = 'noopener noreferrer'; $('dialog-body').append(a); }
    $('info-dialog').showModal();
  }
  function access() {
    const url = safeHttps(config.materialUrl);
    dialog('Suas receitas', url ? 'Seu acesso ao material comprado está disponível abaixo.' : 'Use o acesso enviado na confirmação da sua compra. Se precisar de ajuda, procure o contato de suporte informado no comprovante.', url);
  }
  function checkout() {
    if (!config.offerEnabled || !safeHttps(config.checkoutUrl) || !config.deliveryText || !config.supportText) {
      dialog('Atendimento', 'Este atendimento ainda não está disponível para contratação. Você pode continuar usando seu material e receber seu presente.'); return;
    }
    state.stage = 'checkout';
    msg(`Seu plano personalizado custa ${money}, em pagamento único.\n\nDê esse próximo passo: uma avaliação com a Luana para organizar sua alimentação considerando a vida que você tem hoje. Toque abaixo para conferir os dados e confirmar sua contratação com segurança pela Cakto.\n\nApós a confirmação do pagamento, a equipe entrará em contato para continuar seu atendimento.`);
    update();
  }
  function goCheckout() {
    const url = new URL(config.checkoutUrl);
    url.searchParams.set('perfil', profile());
    window.open(url.href, '_blank', 'noopener,noreferrer');
  }
  function faq(which) {
    const texts = {
      difference: 'O material comprado oferece receitas para escolher e preparar. Neste serviço adicional, você contrata uma avaliação individual e a elaboração de um plano alimentar. Seu acesso às receitas não depende dessa contratação.',
      cost: 'Seu orçamento e os alimentos que costuma comprar entram nas informações do atendimento. A proposta é considerar essa realidade. O custo dos alimentos depende das escolhas e dos preços que você encontra.',
      delivery: config.deliveryText ? config.deliveryText + '\n\n' + config.supportText : 'As condições e o prazo do atendimento serão apresentados antes da abertura das contratações.',
      professional: 'A avaliação individual e a elaboração do plano são de responsabilidade da nutricionista Luana Araújo. Esta conversa reúne preferências de rotina; ela não faz diagnóstico nem gera uma prescrição alimentar.'
    };
    msg(texts[which]); state.stage = 'offer';
  }
  function respond(text, callback) {
    document.querySelectorAll('audio, video').forEach(media => { if (!media.paused) media.pause(); });
    msg(text, { kind: 'outgoing' }); callback(); update();
  }
  function choice(text, action, style = '') {
    const button = document.createElement('button'); button.className = 'choice ' + style; button.textContent = text;
    button.addEventListener('click', action); choices.append(button);
  }
  function voiceMessage(item) {
    const root = document.createElement('div'); root.className = 'voice-message';
    const src = config.audios && config.audios[item.audio];
    const metadata = (window.FUNIL_AUDIO_DATA || {})[item.audio] || {};
    const media = document.createElement('audio'); media.preload = 'none';
    if (src && (safeHttps(src) || /^audios\/[a-z0-9._-]+$/i.test(src))) media.src = src;
    const format = value => { const s = Math.max(0, Math.floor(Number(value) || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const row = document.createElement('div'); row.className = 'voice-row';
    const play = document.createElement('button'); play.type = 'button'; play.className = 'voice-play'; play.textContent = '▶'; play.setAttribute('aria-label', 'Reproduzir áudio');
    const center = document.createElement('div'); center.className = 'voice-center';
    const track = document.createElement('div'); track.className = 'voice-track';
    const waves = document.createElement('div'); waves.className = 'voice-wave'; waves.setAttribute('aria-hidden', 'true');
    const bars = [];
    (metadata.waveform || Array(48).fill(20)).forEach(height => { const bar = document.createElement('i'); bar.style.height = Math.max(10, Math.min(100, height)) + '%'; waves.append(bar); bars.push(bar); });
    const seek = document.createElement('input'); seek.type = 'range'; seek.min = '0'; seek.max = String(metadata.duration || 1); seek.step = '.1'; seek.value = '0'; seek.className = 'voice-seek'; seek.setAttribute('aria-label', 'Posição do áudio em segundos');
    track.append(waves, seek);
    const metaRow = document.createElement('div'); metaRow.className = 'voice-meta';
    const clock = document.createElement('span'); clock.textContent = format(metadata.duration); clock.setAttribute('aria-label', 'Duração do áudio');
    const speed = document.createElement('button'); speed.type = 'button'; speed.className = 'voice-speed'; speed.textContent = '1×'; speed.setAttribute('aria-label', 'Velocidade do áudio: 1 vez');
    metaRow.append(clock, speed); center.append(track, metaRow);
    const portrait = document.createElement('div'); portrait.className = 'voice-portrait';
    const photo = document.createElement('img'); photo.src = 'assets/luana.webp'; photo.alt = ''; photo.width = 44; photo.height = 44;
    const mic = document.createElement('span'); mic.className = 'voice-mic'; mic.textContent = '♩'; mic.setAttribute('aria-hidden', 'true'); portrait.append(photo, mic);
    row.append(play, center, portrait);
    const error = document.createElement('p'); error.className = 'voice-error'; error.hidden = true; error.setAttribute('role', 'status');
    const sync = () => {
      const duration = Number.isFinite(media.duration) ? media.duration : (metadata.duration || 0);
      const current = media.currentTime || 0;
      seek.max = String(duration || 1); seek.value = String(current);
      seek.setAttribute('aria-valuetext', `${format(current)} de ${format(duration)}`);
      clock.textContent = current > 0 ? format(current) : format(duration);
      const ratio = duration ? current / duration : 0;
      bars.forEach((bar, i) => { bar.style.backgroundColor = i < ratio * bars.length ? '#31a694' : '#bcc8c1'; });
      seek.style.setProperty('--position', (ratio * 100) + '%');
    };
    play.disabled = !media.src;
    play.addEventListener('click', () => {
      if (!media.paused) { media.pause(); return; }
      document.querySelectorAll('audio, video').forEach(other => { if (other !== media) other.pause(); });
      if (media.ended) media.currentTime = 0;
      media.play().catch(() => { error.textContent = 'Não foi possível reproduzir. Tente novamente.'; error.hidden = false; });
    });
    media.addEventListener('play', () => { play.textContent = 'Ⅱ'; play.setAttribute('aria-label', 'Pausar áudio'); error.hidden = true; });
    media.addEventListener('pause', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Reproduzir áudio'); });
    media.addEventListener('ended', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Reproduzir áudio'); sync(); });
    media.addEventListener('timeupdate', sync); media.addEventListener('loadedmetadata', sync);
    media.addEventListener('error', () => { error.textContent = 'O áudio não carregou. Você pode tentar novamente ou ler o texto da mensagem.'; error.hidden = false; });
    seek.addEventListener('input', () => { if (Number.isFinite(media.duration)) { media.currentTime = Number(seek.value); sync(); } });
    speed.addEventListener('click', () => { const rates = [1, 1.5, 2]; media.playbackRate = rates[(rates.indexOf(media.playbackRate) + 1) % rates.length]; speed.textContent = String(media.playbackRate).replace('.', ',') + '×'; speed.setAttribute('aria-label', 'Velocidade do áudio: ' + speed.textContent); });
    const transcript = document.createElement('div'); transcript.className = 'voice-transcript'; transcript.hidden = true;
    const note = document.createElement('small'); note.textContent = 'Texto de apoio da mensagem';
    const text = document.createElement('p'); text.textContent = item.text; transcript.append(note, text);
    const transcribe = document.createElement('button'); transcribe.type = 'button'; transcribe.className = 'voice-transcribe'; transcribe.textContent = 'Transcrever áudio'; transcribe.setAttribute('aria-expanded', 'false');
    transcribe.addEventListener('click', () => { transcript.hidden = !transcript.hidden; transcribe.textContent = transcript.hidden ? 'Transcrever áudio' : 'Ocultar texto'; transcribe.setAttribute('aria-expanded', String(!transcript.hidden)); });
    root.append(media, row, error, transcribe, transcript); return root;
  }
  function videoPlayer(item) {
    const asset = (config.testimonials || [])[item.video];
    if (!asset || !/^videos\/[a-z0-9._-]+\.mp4$/i.test(asset.src)) return null;
    const wrap = document.createElement('div'); wrap.className = 'testimonial-player';
    const video = document.createElement('video');
    video.src = asset.src; video.preload = 'none'; video.playsInline = true;
    video.setAttribute('playsinline', ''); video.setAttribute('aria-label', asset.title || 'Depoimento');
    if (/^videos\/[a-z0-9._-]+\.jpg$/i.test(asset.poster || '')) video.poster = asset.poster;
    const overlay = document.createElement('button'); overlay.type = 'button'; overlay.className = 'video-cover';
    overlay.setAttribute('aria-label', `Assistir ${asset.title || 'depoimento'} com som`);
    const icon = document.createElement('span'); icon.className = 'video-play-icon'; icon.textContent = '▶'; icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('strong'); text.textContent = 'Clique para assistir';
    const sub = document.createElement('span'); sub.textContent = 'com som';
    overlay.append(icon, text, sub);
    const status = document.createElement('p'); status.className = 'video-status'; status.hidden = true; status.setAttribute('role', 'status');
    overlay.addEventListener('click', () => {
      document.querySelectorAll('video, audio').forEach(media => { if (media !== video) media.pause(); });
      video.muted = false; video.controls = true;
      video.play().catch(() => { overlay.hidden = false; status.hidden = false; status.textContent = 'Não foi possível iniciar o vídeo. Tente novamente.'; });
    });
    video.addEventListener('play', () => { overlay.hidden = true; status.hidden = true; });
    video.addEventListener('ended', () => { overlay.hidden = false; text.textContent = 'Assistir novamente'; });
    video.addEventListener('error', () => { status.hidden = false; status.textContent = 'O vídeo não carregou. Você pode tentar novamente ou continuar a conversa.'; });
    wrap.append(video, overlay, status); return wrap;
  }
  function update() {
    clearTimeout(deliveryTimer);
    if (renderedItems.length && state.history[0] !== renderedItems[0]) visibleCount = 0;
    while (state.history[visibleCount] && state.history[visibleCount].kind === 'outgoing') visibleCount++;
    if (!visibleCount && state.history.length) visibleCount = 1;
    save(); render(); scheduleDelivery();
  }
  function scheduleDelivery() {
    if (visibleCount >= state.history.length) return;
    const next = state.history[visibleCount];
    const delay = next.kind === 'audio' ? 2800 : next.kind === 'testimonial' ? 2200 : Math.min(4200, 1800 + (next.text || '').length * 9);
    deliveryTimer = setTimeout(() => { visibleCount++; render(); scheduleDelivery(); }, delay);
  }
  function render() {
    const log = $('messages');
    if (!renderedItems.length || state.history[0] !== renderedItems[0]) {
      document.querySelectorAll('audio, video').forEach(media => { if (!media.paused) media.pause(); });
      log.replaceChildren(); renderedItems = [];
      const date = document.createElement('div'); date.className = 'date-separator'; date.textContent = 'Sua conversa de boas-vindas'; log.append(date);
    }
    choices.remove();
    log.querySelector('.pending-message')?.remove();
    state.history.slice(renderedItems.length, visibleCount).forEach(item => {
      const article = document.createElement('article'); article.className = 'message ' + (item.kind || '');
      const bubble = document.createElement('div'); bubble.className = 'bubble';
      if (item.kind === 'audio') {
        bubble.append(voiceMessage(item));
      }
      if (item.number) { const label = document.createElement('span'); label.className = 'sender'; label.textContent = `PERGUNTA ${item.number} DE 6`; bubble.append(label); }
      if (item.kind !== 'audio') { const content = document.createElement('div'); content.textContent = item.text; bubble.append(content); }
      if (item.kind === 'testimonial') { const player = videoPlayer(item); if (player) bubble.append(player); }
      if (item.price) { const price = document.createElement('strong'); price.className = 'price'; price.textContent = item.price; bubble.append(price); const caption = document.createElement('small'); caption.textContent = 'Pagamento único • Serviço adicional'; bubble.append(caption); }
      const stamp = document.createElement('span'); stamp.className = 'stamp'; stamp.textContent = item.at; bubble.append(stamp);
      article.append(bubble); log.append(article);
      renderedItems.push(item);
    });
    choices.replaceChildren();
    const lastBubble = log.children[log.children.length - 1].children[0];
    lastBubble.append(choices);
    const waiting = visibleCount < state.history.length;
    choices.hidden = waiting;
    if (waiting) {
      const next = state.history[visibleCount];
      const pending = document.createElement('div'); pending.className = 'message pending-message'; pending.setAttribute('role', 'status');
      const dots = document.createElement('span'); dots.className = 'delivery-dots'; dots.setAttribute('aria-hidden', 'true');
      for (let n = 0; n < 3; n++) dots.append(document.createElement('i'));
      const label = document.createElement('span'); label.textContent = next.kind === 'audio' ? 'Enviando áudio…' : next.kind === 'testimonial' ? 'Enviando vídeo…' : 'Enviando mensagem…';
      pending.append(dots, label); log.append(pending);
    }
    const choose = (t, f, style) => choice(t, () => respond(t, f), style);
    switch (state.stage) {
      case 'welcome':
        choose('Vamos começar 💚', () => { state.stage = 'questions'; msg('Suas respostas sobre a rotina ficam salvas somente neste navegador para permitir que você continue depois. Não envie informações de saúde nesta conversa.'); question(); }, 'primary');
        choose('Vou deixar para depois', () => { state.stage = 'paused'; msg('Combinado! Seu material está disponível pelo menu. Você pode continuar quando quiser.'); }, 'secondary'); break;
      case 'paused':
        choose('Continuar a conversa', () => { state.stage = 'questions'; question(); }, 'primary'); choice('Acessar minhas receitas', access); break;
      case 'questions':
        questions[state.answers.length].options.forEach((text, index) => choose(text, () => {
          const q = questions[state.answers.length]; state.answers.push(index);
          if (q.replies[index]) msg(q.replies[index]);
          if (state.answers.length < questions.length) question(); else summary();
        }));
        choose('Continuar depois', () => { state.stage = 'paused'; msg('Tudo bem. Suas respostas ficaram registradas neste navegador. Quando quiser, continue de onde parou.'); }, 'secondary'); break;
      case 'bridge':
        choose('Quero conhecer meu plano', testimonials, 'primary'); choose('Quero seguir só com as receitas', () => { msg('Combinado! Seu acesso às receitas continua disponível. E aqui vai o presente que prometi.'); gift(); }); break;
      case 'testimonials':
        choose('Quero ver como ter meu plano', offer, 'primary');
        choose('Vou ficar só com as receitas', gift, 'secondary'); break;
      case 'offer':
        choice(`Quero meu plano personalizado • ${money}`, checkout, 'primary');
        choose('Tenho uma dúvida', () => { state.stage = 'faq'; msg('Qual é sua dúvida?'); }); choose('Vou ficar só com as receitas', gift, 'secondary'); break;
      case 'faq':
        [['Qual a diferença para as receitas?', 'difference'], ['Vou precisar comprar comida cara?', 'cost'], ['Como recebo meu plano?', 'delivery'], ['Quem avalia minhas respostas?', 'professional']].forEach(([label, key]) => choose(label, () => faq(key)));
        choose('Seguir sem contratar', gift, 'secondary'); break;
      case 'checkout':
        choice('Quero meu plano personalizado', goCheckout, 'primary');
        choose('Concluir a conversa', gift); break;
      case 'gift':
        choice('Abrir meu presente 🎁', () => window.open(config.giftUrl === 'presente.html' ? 'presente.html' : safeHttps(config.giftUrl) || 'presente.html', '_blank', 'noopener,noreferrer'), 'primary');
        choice('Acessar minhas receitas', access);
        if (state.answers.length === 6) choose('Rever o atendimento individual', offer, 'secondary');
        break;
    }
    const done = state.answers.length;
    $('progress').style.width = (done / 6 * 100) + '%';
    $('journey-label').textContent = state.stage === 'questions' ? 'SUA ROTINA' : state.stage === 'welcome' || state.stage === 'paused' ? 'BOAS-VINDAS' : state.stage === 'gift' ? 'SEU PRESENTE' : 'SEU PRÓXIMO PASSO';
    $('progress-label').textContent = done ? `${done} de 6 respostas` : 'Seu primeiro passo';
    $('composer-note').textContent = 'Responda pelos botões da mensagem';
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
  }
  $('menu-btn').addEventListener('click', () => { $('menu').hidden = !$('menu').hidden; $('menu-btn').setAttribute('aria-expanded', String(!$('menu').hidden)); });
  $('menu').addEventListener('click', event => {
    const action = event.target.dataset.action;
    if (!action) return;
    $('menu').hidden = true; $('menu-btn').setAttribute('aria-expanded', 'false');
    if (action === 'access') access();
    if (action === 'restart') start();
    if (action === 'privacy') dialog('Sobre esta conversa', 'Esta é uma conversa guiada de boas-vindas. As respostas sobre hábitos ficam apenas neste navegador para permitir a retomada; não são enviadas a uma nutricionista por esta página. Você pode apagá-las escolhendo Recomeçar. Não informe dados de saúde aqui. A avaliação profissional, se contratada, acontece em uma etapa própria. Esta página não é o aplicativo WhatsApp.');
  });
  $('close-dialog').addEventListener('click', () => $('info-dialog').close());
  window.Funil = Object.freeze({ profile, questions, profiles });
  load(); if (!state.history.length) start(); else { save(); visibleCount = state.history.length; render(); }
})();

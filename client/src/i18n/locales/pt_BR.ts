import type { Translations } from './en';

export const ptBR: Translations = {
  // Name Entry
  nameEntry: {
    subtitle: 'Jogo de cartas para 4 jogadores em 2 duplas',
    label: 'Seu nome:',
    placeholder: 'Digite seu nome...',
    error: 'Nome deve ter entre 2 e 20 caracteres',
    next: 'Próximo →',
  },

  // Loading
  loading: 'Carregando...',

  // Room Select
  roomSelect: {
    greeting: 'Olá, {playerName}! Escolha uma sala:',
    createRoom: '🆕 Criar Sala',
    joinWithCode: '🔑 Entrar com Código',
    publicRooms: 'Salas Públicas',
    refresh: '↻ Atualizar',
    loadingRooms: 'Carregando salas...',
    noPublicRooms: 'Nenhuma sala pública disponível',
    back: '← Voltar',
    createTitle: 'Criar Sala',
    chooseVisibility: 'Escolha a visibilidade:',
    privateRoom: '🔒 Privada',
    privateRoomDesc: 'Acessível apenas com código',
    publicRoom: '🌐 Pública',
    publicRoomDesc: 'Aparece na lista de salas públicas',
    creating: 'Criando sala...',
    roomCreated: '✅ Sala Criada!',
    shareCode: 'Compartilhe este código com os outros jogadores:',
    copied: '✅ Copiado!',
    copy: '📋 Copiar',
    waitingInRoom: '⏳ Aguardando na sala...',
    connected: '✅ Conectado!',
    joinTitle: 'Entrar com Código',
    codePlaceholder: 'Ex: ABC123',
    codeTooShort: 'Código muito curto',
    connecting: '⏳ Conectando...',
    join: 'Entrar',
  },

  // Lobby
  lobby: {
    waiting: 'Aguardando jogadores... ({count}/4)',
    roomCode: 'Código da sala:',
    youAreLeader: '👑 Você é o líder',
    vs: 'VS',
    leaderHint: '👑 Líder: arraste entre times para mover • arraste dentro do time para reordenar • clique no nome do time para renomear • ✕ para remover',
    ready: '✅ Pronto',
    cancelReady: '↩ Cancelar Pronto',
    allReady: '🚀 Todos prontos! Iniciando jogo...',
    playersStatus: 'Status dos Jogadores',
    you: '(você)',
    readyStatus: '✅ Pronto',
    waitingStatus: '⏳ Aguardando',
    emptySlot: '— Vazia —',
    joinTeam: 'Entrar neste time',
    clickToRename: 'Clique para renomear',
    kickPlayer: 'Remover jogador',
    defaultTeamA: 'Time A',
    defaultTeamB: 'Time B',
  },

  // Paused overlay
  paused: {
    title: '⏸ Jogo Pausado',
    message: 'Um jogador se desconectou. Aguardando reconexão...',
    roomCode: 'Código da sala:',
  },

  // Game Board
  game: {
    inHole: '🕳 No Buraco',
    yourTurn: '✨ Sua vez!',
    theirTurn: 'Vez de: {name}',
    phaseMustDraw: '— Comprar',
    phaseCanAct: '— Agir/Descartar',
    phaseMustDiscard: '— Descartar',
    cards: 'cartas',
    offline: 'offline',
    playing: '▶ jogando',
    drawFromStockTitle: 'Comprar do monte',
    stock: 'Monte',
    takeDiscardTitle: 'Pegar descarte',
    viewDiscardTitle: 'Ver descarte',
    emptyDiscardTitle: 'Descarte vazio',
    discardPile: 'Descarte ({count})',
    discardPileHeader: 'Pilha de descarte ({count} cartas)',
    yourTeam: ' (seu)',
    noMelds: 'Nenhuma combinação ainda',
    yourHand: 'Sua mão ({count} cartas)',
    selected: '{count} selecionada(s)',
    sortTitle: 'Ordenar cartas',
    sort: '⇅ Ordenar',
    drawFromStockBtn: '📥 Comprar do Monte',
    takeDiscardBtn: '🗑 Pegar Descarte ({count})',
    layDownGroup: '🃏 Baixar Grupo',
    layDownSequence: '🔗 Baixar Sequência',
    layDown: '🃏 Baixar',
    invalidSelection: 'Seleção inválida para grupo ou sequência',
    discardSelected: '↩ Descartar carta selecionada',
    selectHint: 'Selecione cartas para baixar, ou 1 para descartar',
    defaultTeamA: 'Time A',
    defaultTeamB: 'Time B',
  },

  // Meld
  meld: {
    cleanCanasta: '✨ Canastra Limpa',
    dirtyCanasta: '⭐ Canastra Suja',
    group: 'Grupo',
    sequence: 'Sequência',
    cards: 'cartas',
    addCards: '+ Adicionar',
  },

  // Round End / Game Over
  roundEnd: {
    title: 'Fim da Rodada {round}',
    roundPoints: 'Pontos da rodada:',
    totalScore: 'Placar total:',
    inHole: '🕳 No Buraco',
    nextRound: '▶ Próxima Rodada',
    gameWon: '🎉 Você Ganhou!',
    gameLost: '😞 Você Perdeu!',
    gameOver: 'Fim de Jogo!',
    winnerMsg: '{team} venceu com {score} pontos!',
    pts: 'pts',
    newGame: '🔄 Novo Jogo',
    defaultTeamA: 'Time A',
    defaultTeamB: 'Time B',
  },

  // Language switcher
  lang: {
    switchTo: 'Trocar idioma',
  },

  // Erros de validação de combinações (chaves enviadas pelo servidor)
  validation: {
    groupMinCards: 'Um grupo precisa de pelo menos 3 cartas',
    groupSameRank: 'Grupo deve ter cartas do mesmo valor',
    groupMaxOneWildcard: 'No máximo um curinga (2) é permitido em um grupo',
    seqMinCards: 'Uma sequência precisa de pelo menos 3 cartas',
    seqNeedNatural: 'Precisa de pelo menos uma carta natural',
    seqSameSuit: 'Sequência deve ser do mesmo naipe',
    seqDuplicateRanks: 'Cartas naturais duplicadas na sequência',
    seqMaxOneWildcard: 'No máximo um curinga (2) é permitido em uma sequência',
    seqNotEnoughWildcards: 'Curingas insuficientes para preencher as lacunas na sequência',
    seqWildcardMajority: 'Curingas não podem ser maioria em uma sequência',
    seqInvalid: 'Combinação de sequência inválida',
  },
};

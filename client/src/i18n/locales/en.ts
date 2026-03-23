export interface Translations {
  nameEntry: {
    subtitle: string;
    label: string;
    placeholder: string;
    error: string;
    next: string;
  };
  loading: string;
  roomSelect: {
    greeting: string;
    createRoom: string;
    joinWithCode: string;
    publicRooms: string;
    refresh: string;
    loadingRooms: string;
    noPublicRooms: string;
    back: string;
    createTitle: string;
    chooseVisibility: string;
    privateRoom: string;
    privateRoomDesc: string;
    publicRoom: string;
    publicRoomDesc: string;
    creating: string;
    roomCreated: string;
    shareCode: string;
    copied: string;
    copy: string;
    waitingInRoom: string;
    connected: string;
    joinTitle: string;
    codePlaceholder: string;
    codeTooShort: string;
    connecting: string;
    join: string;
  };
  lobby: {
    waiting: string;
    roomCode: string;
    youAreLeader: string;
    vs: string;
    leaderHint: string;
    ready: string;
    cancelReady: string;
    allReady: string;
    playersStatus: string;
    you: string;
    readyStatus: string;
    waitingStatus: string;
    emptySlot: string;
    joinTeam: string;
    clickToRename: string;
    kickPlayer: string;
    defaultTeamA: string;
    defaultTeamB: string;
  };
  paused: {
    title: string;
    message: string;
    roomCode: string;
  };
  game: {
    inHole: string;
    yourTurn: string;
    theirTurn: string;
    phaseMustDraw: string;
    phaseCanAct: string;
    phaseMustDiscard: string;
    cards: string;
    offline: string;
    playing: string;
    drawFromStockTitle: string;
    stock: string;
    takeDiscardTitle: string;
    viewDiscardTitle: string;
    emptyDiscardTitle: string;
    discardPile: string;
    discardPileHeader: string;
    yourTeam: string;
    noMelds: string;
    yourHand: string;
    selected: string;
    sortTitle: string;
    sort: string;
    drawFromStockBtn: string;
    takeDiscardBtn: string;
    layDownGroup: string;
    layDownSequence: string;
    layDown: string;
    invalidSelection: string;
    discardSelected: string;
    selectHint: string;
    defaultTeamA: string;
    defaultTeamB: string;
  };
  meld: {
    cleanCanasta: string;
    dirtyCanasta: string;
    group: string;
    sequence: string;
    cards: string;
    addCards: string;
  };
  roundEnd: {
    title: string;
    roundPoints: string;
    totalScore: string;
    inHole: string;
    nextRound: string;
    gameWon: string;
    gameLost: string;
    gameOver: string;
    winnerMsg: string;
    pts: string;
    newGame: string;
    defaultTeamA: string;
    defaultTeamB: string;
  };
  lang: {
    switchTo: string;
  };
  validation: {
    groupMinCards: string;
    groupSameRank: string;
    groupMaxOneWildcard: string;
    seqMinCards: string;
    seqNeedNatural: string;
    seqSameSuit: string;
    seqDuplicateRanks: string;
    seqMaxOneWildcard: string;
    seqNotEnoughWildcards: string;
    seqWildcardMajority: string;
    seqInvalid: string;
  };
}

export const en: Translations = {
  // Name Entry
  nameEntry: {
    subtitle: 'Card game for 4 players in 2 pairs',
    label: 'Your name:',
    placeholder: 'Enter your name...',
    error: 'Name must be between 2 and 20 characters',
    next: 'Next →',
  },

  // Loading
  loading: 'Loading...',

  // Room Select
  roomSelect: {
    greeting: 'Hello, {playerName}! Choose a room:',
    createRoom: '🆕 Create Room',
    joinWithCode: '🔑 Join with Code',
    publicRooms: 'Public Rooms',
    refresh: '↻ Refresh',
    loadingRooms: 'Loading rooms...',
    noPublicRooms: 'No public rooms available',
    back: '← Back',
    createTitle: 'Create Room',
    chooseVisibility: 'Choose visibility:',
    privateRoom: '🔒 Private',
    privateRoomDesc: 'Accessible only with a code',
    publicRoom: '🌐 Public',
    publicRoomDesc: 'Appears in the public rooms list',
    creating: 'Creating room...',
    roomCreated: '✅ Room Created!',
    shareCode: 'Share this code with the other players:',
    copied: '✅ Copied!',
    copy: '📋 Copy',
    waitingInRoom: '⏳ Waiting in room...',
    connected: '✅ Connected!',
    joinTitle: 'Join with Code',
    codePlaceholder: 'e.g. ABC123',
    codeTooShort: 'Code is too short',
    connecting: '⏳ Connecting...',
    join: 'Join',
  },

  // Lobby
  lobby: {
    waiting: 'Waiting for players... ({count}/4)',
    roomCode: 'Room code:',
    youAreLeader: '👑 You are the leader',
    vs: 'VS',
    leaderHint: '👑 Leader: drag between teams to move • drag within a team to reorder • click team name to rename • ✕ to remove',
    ready: '✅ Ready',
    cancelReady: '↩ Cancel Ready',
    allReady: '🚀 Everyone ready! Starting game...',
    playersStatus: 'Players Status',
    you: '(you)',
    readyStatus: '✅ Ready',
    waitingStatus: '⏳ Waiting',
    emptySlot: '— Empty —',
    joinTeam: 'Join this team',
    clickToRename: 'Click to rename',
    kickPlayer: 'Remove player',
    defaultTeamA: 'Team A',
    defaultTeamB: 'Team B',
  },

  // Paused overlay
  paused: {
    title: '⏸ Game Paused',
    message: 'A player disconnected. Waiting for reconnection...',
    roomCode: 'Room code:',
  },

  // Game Board
  game: {
    inHole: '🕳 In the Hole',
    yourTurn: '✨ Your turn!',
    theirTurn: 'Turn: {name}',
    phaseMustDraw: '— Draw',
    phaseCanAct: '— Act/Discard',
    phaseMustDiscard: '— Discard',
    cards: 'cards',
    offline: 'offline',
    playing: '▶ playing',
    drawFromStockTitle: 'Draw from stock',
    stock: 'Stock',
    takeDiscardTitle: 'Take discard',
    viewDiscardTitle: 'View discard',
    emptyDiscardTitle: 'Empty discard',
    discardPile: 'Discard ({count})',
    discardPileHeader: 'Discard pile ({count} cards)',
    yourTeam: ' (yours)',
    noMelds: 'No melds yet',
    yourHand: 'Your hand ({count} cards)',
    selected: '{count} selected',
    sortTitle: 'Sort cards',
    sort: '⇅ Sort',
    drawFromStockBtn: '📥 Draw from Stock',
    takeDiscardBtn: '🗑 Take Discard ({count})',
    layDownGroup: '🃏 Lay Down Group',
    layDownSequence: '🔗 Lay Down Sequence',
    layDown: '🃏 Lay Down',
    invalidSelection: 'Invalid selection for group or sequence',
    discardSelected: '↩ Discard selected card',
    selectHint: 'Select cards to lay down, or 1 to discard',
    defaultTeamA: 'Team A',
    defaultTeamB: 'Team B',
  },

  // Meld
  meld: {
    cleanCanasta: '✨ Clean Canasta',
    dirtyCanasta: '⭐ Dirty Canasta',
    group: 'Group',
    sequence: 'Sequence',
    cards: 'cards',
    addCards: '+ Add',
  },

  // Round End / Game Over
  roundEnd: {
    title: 'End of Round {round}',
    roundPoints: 'Round points:',
    totalScore: 'Total score:',
    inHole: '🕳 In the Hole',
    nextRound: '▶ Next Round',
    gameWon: '🎉 You Won!',
    gameLost: '😞 You Lost!',
    gameOver: 'Game Over!',
    winnerMsg: '{team} won with {score} points!',
    pts: 'pts',
    newGame: '🔄 New Game',
    defaultTeamA: 'Team A',
    defaultTeamB: 'Team B',
  },

  // Language switcher
  lang: {
    switchTo: 'Switch language',
  },

  // Meld validation errors (keyed by server reason strings)
  validation: {
    groupMinCards: 'A group needs at least 3 cards',
    groupSameRank: 'Group must have same rank',
    groupMaxOneWildcard: 'At most one wildcard (2) is allowed in a group',
    seqMinCards: 'A sequence needs at least 3 cards',
    seqNeedNatural: 'Need at least one natural card',
    seqSameSuit: 'Sequence must be same suit',
    seqDuplicateRanks: 'Duplicate natural cards in sequence',
    seqMaxOneWildcard: 'At most one wildcard (2) is allowed in a sequence',
    seqNotEnoughWildcards: 'Not enough wildcards to fill gaps in sequence',
    seqWildcardMajority: 'Wildcards cannot be majority in a sequence',
    seqInvalid: 'Invalid sequence combination',
  },
};

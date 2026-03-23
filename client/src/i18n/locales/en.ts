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
    joiningIn: string;
    joinNow: string;
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
    leaderHint: string[];
    selectedPlayerHint: string;
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
    forceStart: string;
  };
  paused: {
    title: string;
    message: string;
    roomCode: string;
    countdown: string;
    cancelledTitle: string;
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
    waitingForLeader: string;
    showDetails: string;
    hideDetails: string;
    melds: string;
    wentOut: string;
    goOutBonus: string;
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
  action: {
    roundStarted: string;
    drewLastCard: string;
    drewFromStock: string;
    tookDiscard: string;
    laidDownAndWentOut: string;
    laidDown: string;
    addedToMeldAndWentOut: string;
    addedToMeld: string;
    discardedAndWentOut: string;
    discardedDeckEmpty: string;
    discarded: string;
    wentOut: string;
    meldGroup: string;
    meldSequence: string;
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
  errors: {
    // Connection / room
    invalidMessageFormat: string;
    playerAlreadyConnected: string;
    nameLength: string;
    nameInUse: string;
    mustJoinFirst: string;
    unknownMessageType: string;
    // Leader-only actions
    leaderOnlyMove: string;
    leaderOnlyKick: string;
    leaderOnlyRename: string;
    leaderOnlyReorder: string;
    leaderOnlyNextRound: string;
    notInRoundEnd: string;
    // Player management
    playerNotFound: string;
    // Game / lobby state
    gameAlreadyStarted: string;
    gameFull: string;
    nameTaken: string;
    notInLobby: string;
    teamFull: string;
    playersSameTeam: string;
    kickOnlyInLobby: string;
    // Gameplay
    notYourTurn: string;
    alreadyDrew: string;
    deckEmpty: string;
    discardEmpty: string;
    mustDrawFromStock: string;
    mustDrawFirst: string;
    cardsNotInHand: string;
    cardNotInHand: string;
    noCanastaNeedCard: string;
    meldNotFound: string;
    cannotDiscardTakenCard: string;
    needCanastaToGoOut: string;
    mustPlayAllCards: string;
    firstLayDownMinScore: string;
    leaderOnlyForceStart: string;
    cannotForceStart: string;
    // Room dissolution / kick
    leaderLeft: string;
    reconnectTimeout: string;
    kickedByLeader: string;
    roomNotFound: string;
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
    joiningIn: '⏱️ Joining in {seconds}s...',
    joinNow: 'Join Now',

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
    leaderHint: ['🖱️ Desktop: drag player slots to move or reorder', '📱 Mobile: tap a slot then tap another to swap or move', '✏️ Tap the team name to rename it', '✕ Use the ✕ button to kick a player'],
    selectedPlayerHint: 'Moving {name} — tap another slot or team panel to place',
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
    forceStart: '⚡ Force Start (1v1)',
  },

  // Paused overlay
  paused: {
    title: '⏸ Game Paused',
    message: 'A player disconnected. Waiting for reconnection...',
    roomCode: 'Room code:',
    countdown: 'Match cancels in {time}',
    cancelledTitle: '🚨 Session ended',
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
    waitingForLeader: '⏳ Waiting for the leader to start the next round...',
    showDetails: '📊 Show Details',
    hideDetails: '▲ Hide Details',
    melds: 'Melds',
    wentOut: 'went out (no cards)',
    goOutBonus: 'going out bonus',
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

  // Game action log
  action: {
    roundStarted: 'Round started!',
    drewLastCard: '{name} drew the last card! Last play before round end.',
    drewFromStock: '{name} drew from stock',
    tookDiscard: '{name} took the discard pile ({count} cards)',
    laidDownAndWentOut: '{name} laid down and went out! Round over.',
    laidDown: '{name} laid down a {type}',
    addedToMeldAndWentOut: '{name} added to a meld and went out! Round over.',
    addedToMeld: '{name} added to a {type}',
    discardedAndWentOut: '{name} discarded and went out! Round over.',
    discardedDeckEmpty: '{name} discarded. Deck empty — round over!',
    discarded: '{name} discarded {rank}{suit}',
    wentOut: '{name} went out! Round over.',
    meldGroup: 'group',
    meldSequence: 'sequence',
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

  // Server error codes
  errors: {
    invalidMessageFormat: 'Invalid message format',
    playerAlreadyConnected: 'Player is already connected',
    nameLength: 'Name must be between 2 and 20 characters',
    nameInUse: 'Name already in use in this room',
    mustJoinFirst: 'Must join the room first',
    unknownMessageType: 'Unknown message type',
    leaderOnlyMove: 'Only the leader can move players',
    leaderOnlyKick: 'Only the leader can kick players',
    leaderOnlyRename: 'Only the leader can rename teams',
    leaderOnlyReorder: 'Only the leader can reorder players',
    leaderOnlyNextRound: 'Only the leader can start the next round',
    notInRoundEnd: 'This action is only available at round end',
    playerNotFound: 'Player not found',
    gameAlreadyStarted: 'Game has already started',
    gameFull: 'The room is full',
    nameTaken: 'Name already taken',
    notInLobby: 'This action is only available in the lobby',
    teamFull: 'Team is full',
    playersSameTeam: 'Players must be on the same team',
    kickOnlyInLobby: 'Players can only be kicked in the lobby',
    notYourTurn: 'It is not your turn',
    alreadyDrew: 'You have already drawn this turn',
    deckEmpty: 'The deck is empty',
    discardEmpty: 'The discard pile is empty',
    mustDrawFromStock: 'Must draw from stock (1 card in hand and 1 in discard)',
    mustDrawFirst: 'You must draw a card first',
    cardsNotInHand: 'Some of the selected cards are not in your hand',
    cardNotInHand: 'That card is not in your hand',
    noCanastaNeedCard: 'No canasta: must keep at least 1 card in hand after discarding',
    meldNotFound: 'Meld not found',
    cannotDiscardTakenCard: 'Cannot discard the card just taken from the discard pile',
    needCanastaToGoOut: 'Your team needs at least one canasta to go out',
    mustPlayAllCards: 'Must play all cards to go out (or discard the last one)',
    firstLayDownMinScore: "First lay-down in 'Buraco' must score at least 100 points",
    leaderOnlyForceStart: 'Only the leader can force start the game',
    cannotForceStart: 'Force start requires 1 player per team with the other player ready',
    leaderLeft: 'The leader left the room. The room has been closed.',
    reconnectTimeout: 'A player did not reconnect in time. The match has been cancelled.',
    kickedByLeader: 'You were removed by the room leader.',
    roomNotFound: 'Room not found or inaccessible.',
  },
};

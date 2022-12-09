const pokerGameReducer = (state = {}, action) => {
    switch (action.type) {
      case 'SET_GAME_STATE':
        return {
          ...state,
          gameState: action.gameState
        };
      case 'ADD_PLAYER':
        return {
          ...state,
          players: [...state.players, action.player]
        };
      case 'REMOVE_PLAYER':
        return {
          ...state,
          players: state.players.filter(player => player.id !== action.playerId)
        };
      case 'SET_DEALER':
        return {
          ...state,
          dealer: action.playerId
        };
      case 'DEAL_CARDS':
        return {
          ...state,
          cards: action.cards
        };
      case 'PLACE_BET':
        return {
          ...state,
          bets: {
            ...state.bets,
            [action.playerId]: action.bet
          }
        };
      case 'SET_WINNER':
        return {
          ...state,
          winner: action.playerId
        };
      default:
        return state;
    }
  }
  
class PokerEngine {
    constructor(table, smallBlind, bigBlind) {
        this.table = table;
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.evaluator = new Evaluator();
        this.state = PokerGameState.newHand(this.table);
        this.winsAndLosses = [];
    }

    playOneRound() {
        this.roundSetup();
        this._allDealingAndBettingRounds();
        this.computeWinners();
        this._roundCleanup();
    }

    roundSetup() {
        this.table.pot.reset();
        this._assignOrderToPlayers();
        this._assignBlinds();
    }

    _allDealingAndBettingRounds() {
        this.table.dealer.dealPrivateCards(this.table.players);
        this._bettingRound(true);
        this.table.dealer.dealFlop(this.table);
        this._bettingRound();
        this.table.dealer.dealTurn(this.table);
        this._bettingRound();
        this.table.dealer.dealRiver(this.table);
        this._bettingRound();
    }

    computeWinners() {
        const rankedPlayerGroups = this._rankPlayersByBestHand();
        const payouts = this._computePayouts(rankedPlayerGroups);
        this._payoutPlayers(payouts);
        console.log("Winnings computation complete. Players:");
        for (const player of this.table.players) {
            console.log(`${player}`);
        }
    }

    _roundCleanup() {
        this._moveBlinds();
    }

    _getPlayersInPot(playerGroup, pot) {
        return playerGroup
            .filter((player) => player in pot)
            .sort((a, b) => a.order - b.order);
    }

    _processSidePot(playerGroup, pot) {
        // Check if this list of players contributed to this side pot.
        const payouts = new Map();
        const playersInPot = this._getPlayersInPot(playerGroup, pot);
        const nPlayers = playersInPot.length;
        if (!nPlayers) {
            return {};
        }
        const nTotal = Object.values(pot).reduce((a, b) => a + b);
        const nPerPlayer = Math.floor(nTotal / nPlayers);
        const nRemainder = nTotal - nPlayers * nPerPlayer;

        for (const player of playersInPot) {
            payouts.set(player, nPerPlayer);
        }

        for (let i = 0; i < nRemainder; i++) {
            payouts.set(playersInPot[i], payouts.get(playersInPot[i]) + 1);
        }

        return payouts;
    }

    _computePayouts(rankedPlayerGroups) {
        // Compute the payouts for each player based on their ranking.
        const payouts = new Map();
        for (const [rank, playerGroup] of rankedPlayerGroups.entries()) {
            const pots = this.table.pot.pots;
            let nPlayers = playerGroup.length;

            // Compute the side pots.
            for (const pot of pots) {
                const sidePotPayouts = this._processSidePot(playerGroup, pot);
                nPlayers -= sidePotPayouts.size;
                for (const [player, payout] of sidePotPayouts.entries()) {
                    payouts.set(player, payouts.get(player) + payout);
                }
            }

            // Compute the main pot.
            const mainPot = pots[pots.length - 1];
            if (nPlayers) {
                const nTotal = Object.values(mainPot).reduce((a, b) => a + b);
                const nPerPlayer = Math.floor(nTotal / nPlayers);
                const nRemainder = nTotal - nPlayers * nPerPlayer;
                for (const player of playerGroup) {
                    payouts.set(player, payouts.get(player) + nPerPlayer);
                }
                for (let i = 0; i < nRemainder; i++) {
                    payouts.set(playerGroup[i], payouts.get(playerGroup[i]) + 1);
                }
            }
        }
        return payouts;
    }

    _payout_players(payouts) {
        this.table.pot.reset();
        for (const [player, winnings] of Object.entries(payouts)) {
            player.add_chips(winnings);
        }
    }

    _rank_players_by_best_hand() {
        const table_cards = this.table.community_cards.map(card => card.eval_card);
        const grouped_players = {};
        for (const player of this.table.players) {
            if (player.is_active) {
                const hand_cards = player.cards.map(card => card.eval_card);
                const rank = this.evaluator.evaluate(table_cards, hand_cards);
                const hand_class = this.evaluator.get_rank_class(rank);
                const hand_desc = this.evaluator.class_to_string(hand_class).toLowerCase();
                logger.debug(`Rank #${rank} ${player} ${hand_desc}`);
                if (!grouped_players[rank]) {
                    grouped_players[rank] = [];
                }
                grouped_players[rank].push(player);
            }
        }
        const ranked_player_groups = [];
        const sorted_ranks = Object.keys(grouped_players).sort((a, b) => a - b);
        for (const rank of sorted_ranks) {
            ranked_player_groups.push(grouped_players[rank]);
        }
        return ranked_player_groups;
    }

    _assign_order_to_players() {
        for (let player_i = 0; player_i < this.table.players.length; player_i++) {
            this.table.players[player_i].order = player_i;
        }
    }

    _assign_blinds() {
        this.table.players[0].add_to_pot(this.small_blind);
        this.table.players[1].add_to_pot(this.big_blind);
        logger.debug(`Assigned blinds to players ${this.table.players.slice(0, 2)}`);
    }

    _move_blinds() {
        // Move the dealer button.
        const currentDealerIndex = this.table.players.indexOf(this.table.dealer);
        this.table.dealer = this.table.players[(currentDealerIndex + 1) % this.table.players.length];

        // Move the small and big blinds.
        const currentSmallBlindIndex = this.table.players.indexOf(this.table.small_blind);
        this.table.small_blind = this.table.players[(currentSmallBlindIndex + 1) % this.table.players.length];
        const currentBigBlindIndex = this.table.players.indexOf(this.table.big_blind);
        this.table.big_blind = this.table.players[(currentBigBlindIndex + 1) % this.table.players.length];
    }

    playersInOrderOfBetting() {
        // Assign order to players based on their position at the table
        this.table.players.forEach((player, index) => {
            player.order = index;
        });

        // Sort players based on their order in the current betting round
        return this.table.players.sort((a, b) => a.order - b.order);
    }

    allActivePlayersTakeAction() {
        const playersInBettingOrder = this._players_in_order_of_betting();

        // Loop through players in betting order and have them take action
        playersInBettingOrder.forEach((player) => {
            // Skip player if they are not active
            if (!player.is_active) return;

            // Ask player for action
            const action = player.get_action();

            // Process player's action
            switch (action.type) {
                case "fold":
                    player.is_active = false;
                    break;
                case "check":
                    // Do nothing, player remains active
                    break;
                case "call":
                    player.chips -= action.amount;
                    this.table.pot += action.amount;
                    break;
                case "bet":
                    player.chips -= action.amount;
                    this.table.pot += action.amount;
                    this.current_bet = action.amount;
                    break;
                default:
                    throw new Error(`Invalid action type: ${action.type}`);
            }
        });
    }

    bettingRound(firstRound = false) {
        // Set current bet to 0
        this.current_bet = 0;

        // If this is the first betting round, have the player to the left of the
        // big blind take action first
        if (firstRound) {
            const playersInBettingOrder = this._players_in_order_of_betting();
            const index = playersInBettingOrder.findIndex(
                (player) => player.is_big_blind
            );
            const player = playersInBettingOrder[(index + 1) % playersInBettingOrder.length];
            player.take_action();
        }

        // Loop until all active players have called the current bet or folded
        while (true) {
            // Have all active players take action
            this._all_active_players_take_action();

            // Check if all active players have called the current bet or folded
            const activePlayers = this.table.players.filter((player) => player.is_active);
            if (
                activePlayers.every(
                    (player) => player.current_bet >= this.current_bet || !player.is_active
                )
            ) {
                break;
            }
        }
    }

    postBettingAnalysis() {
        // Check if only one player is active (i.e. everyone else has folded)
        const activePlayers = this.table.players.filter((player) => player.is_active);
        if (activePlayers.length === 1) {
            // Only one player is active, they win the pot
            const player = activePlayers[0];
            player.chips += this.table.pot;
            this.table.pot = 0;

            // Return the winning player
            return player;
        }

        // Multiple players are active, no winners yet
        return null;
    }

    nPlayersWithMoves(players) {
        return players.filter((player) => player.has_moves()).length;
    }

    nActivePlayers() {
        return this.table.players.filter((player) => player.is_active).length;
    }

    nAllInPlayers() {
        return this.table.players.filter((player) => player.is_all_in()).length;
    }

    allBets() {
        return this.table.players.map((player) => player.current_bet);
    }

    moreBettingNeeded() {
        // Check if there are any active players who have not called the current bet
        const activePlayers = this.table.players.filter((player) => player.is_active);
        if (activePlayers.some((player) => player.current_bet < this.current_bet)) {
            return true;
        }

        // Check if there are any players who are not all-in and have moves
        const playersWithMoves = this.table.players.filter((player) =>
            player.has_moves()
        );
        if (
            playersWithMoves.length > this.n_all_in_players() &&
            playersWithMoves.some((player) => !player.is_all_in())
        ) {
            return true;
        }

        // No more betting needed
        return false;
    }

}

import logging
from typing import List
from urllib import request
import asyncio
import aiohttp
import numpy as np

from poker.player import Player
from poker.pot import Pot
from poker.state import PokerGameState

logger = logging.getLogger(__name__)


class AsyncPlayer(Player):
    """Complete a dummy agent largely for development purposes.
    Extends the `poker_ai.game.player.Player` class so inherits all of that
    functionality.
    The agent will make a move based on the probabilities set in the
    constructor, so you can weight the chances of it taking various actions for
    a given turn.
    """

    def __init__(
            self,
            name: str,
            initial_chips: int,
            pot: Pot,
            fold_probability: float = 0.1,
            raise_probability: float = 0.1,
            call_probability: float = 0.8):
        """Construct the random player."""
        super().__init__(name=name, initial_chips=initial_chips, pot=pot)
        self.fold_probability = fold_probability
        self.raise_probability = raise_probability
        self.call_probability = call_probability
        prob_sum = fold_probability + raise_probability + call_probability
        if not np.isclose(prob_sum, 1.0):
            raise ValueError(f'Probabilities passed must sum to one.')

    async def take_action(self, game_state: PokerGameState) -> PokerGameState:

        # post self.name to localhost:3000 await response and catch error timeout after 61 seconds
        session_timeout = aiohttp.ClientTimeout(total=61)
        async with aiohttp.ClientSession(timeout=session_timeout) as session:
            async with session.post('http://localhost:3000/action', data=self.name) as resp:
                print(resp.status)
                print(await resp.text())
                action = await resp.text()
                if action == 'fold':
                    self.fold()
        logger.debug(f'{self.name} {action}')
        return PokerGameState(game_state, game_state.table, self, 'call', False)

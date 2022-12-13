from poker.random_player import RandomPlayer
from poker.pot import Pot
from poker.engine import PokerEngine
from poker.table import PokerTable

pot = Pot()
ben = RandomPlayer('Ben',  1000, pot)
austin = RandomPlayer('Austin', 1000, pot)
players = [ben, austin]
initial_chips_amount = 10000
small_blind_amount = 50
big_blind_amount = 100

table = PokerTable(players=players, pot=pot)
engine = PokerEngine(
    table=table,
    small_blind=small_blind_amount,
    big_blind=big_blind_amount)

print(austin.name)

engine.play_one_round()

print(engine.state)


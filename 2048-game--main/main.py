import random
import copy
import eel

GRID_SIZE = 4

# IMPORTANT: Ensure these paths match your 'web/assets' folder structure

POKEMON_IMAGES = {
    2: "assets/optimized/1.png",
    4: "assets/optimized/2.png",
    8: "assets/optimized/3.png",
    16: "assets/optimized/4.png",
    32: "assets/optimized/5.png",
    64: "assets/optimized/6.png",
    128: "assets/optimized/7.png",
    256: "assets/optimized/8.png",
}

class Pokemon2048Game:
    def __init__(self):
        self.reset_game()

    def reset_game(self):
        self.matrix = [[0] * GRID_SIZE for _ in range(GRID_SIZE)]
        self.score = 0
        self.add_new_tile()
        self.add_new_tile()

    def merge_one_row_left(self, row):
        # 1. Slide non-zero tiles to the left
        non_zeros = [i for i in row if i != 0]
        
        # 2. Merge identical adjacent tiles
        new_row = []
        skip = False
        for i in range(len(non_zeros)):
            if skip:
                skip = False
                continue
            if i + 1 < len(non_zeros) and non_zeros[i] == non_zeros[i+1]:
                combined = non_zeros[i] * 2
                new_row.append(combined)
                self.score += combined
                skip = True
            else:
                new_row.append(non_zeros[i])
        
        # 3. Fill the rest with zeros
        return new_row + [0] * (GRID_SIZE - len(new_row))

    def transpose(self, matrix):
        return [list(row) for row in zip(*matrix)]

    def invert(self, matrix):
        return [row[::-1] for row in matrix]

    def move(self, direction):
        old_matrix = copy.deepcopy(self.matrix)
        
        if direction == "ArrowLeft":
            self.matrix = [self.merge_one_row_left(row) for row in self.matrix]
        elif direction == "ArrowRight":
            self.matrix = self.invert([self.merge_one_row_left(row) for row in self.invert(self.matrix)])
        elif direction == "ArrowUp":
            self.matrix = self.transpose([self.merge_one_row_left(row) for row in self.transpose(self.matrix)])
        elif direction == "ArrowDown":
            # Transpose, Invert, Merge, Invert, Transpose
            transformed = self.invert(self.transpose(self.matrix))
            merged = [self.merge_one_row_left(row) for row in transformed]
            self.matrix = self.transpose(self.invert(merged))

        changed = (old_matrix != self.matrix)
        if changed:
            self.add_new_tile()
        return changed

    def add_new_tile(self):
        empty_cells = [(r, c) for r in range(GRID_SIZE) for c in range(GRID_SIZE) if self.matrix[r][c] == 0]
        if empty_cells:
            r, c = random.choice(empty_cells)
            self.matrix[r][c] = 4 if random.random() < 0.1 else 2

    def is_game_over(self):
        # Check for empty cells
        if any(0 in row for row in self.matrix): return False
        # Check for possible horizontal or vertical merges
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE - 1):
                if self.matrix[r][c] == self.matrix[r][c+1]: return False
                if self.matrix[c][r] == self.matrix[c+1][r]: return False
        return True

game = Pokemon2048Game()

@eel.expose
def get_game_state():
    ui_matrix = [[POKEMON_IMAGES.get(val, "") for val in row] for row in game.matrix]
    return {
        "matrix": ui_matrix, 
        "score": game.score,
        "gameOver": game.is_game_over()
    }

@eel.expose
def handle_move(direction):
    game.move(direction)
    return get_game_state()

@eel.expose
def restart():
    game.reset_game()
    return get_game_state()

if __name__ == "__main__":
    eel.init("web")

    # Change mode to None to prevent Eel from looking for a local Chrome install
    # Use host '0.0.0.0' to allow the cloud environment to map the port
    eel.start(
        "index.html",
        host="0.0.0.0",
        port=8080,
        mode=None  # This is the magic fix!
    )
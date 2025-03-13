import pygame
import copy
import asyncio
from settings import *
from player import Player
from blocks import Block
from sidewalk import Sidewalk

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Escape the Labyrinth")
clock = pygame.time.Clock()

"""
Create and place sprites according to current level

NOTE: To create a limited pushable block with a higher push 
limit you must define it here
"""
def make_level(levels, all_sprites, walls, blocks, current_level, sidewalks, player, player_start_pos):
    for row_index, row in enumerate(levels[current_level]):
        for col_index, char in enumerate(row):
            if char == "W":
                block = Block(col_index * TILE_SIZE, row_index * TILE_SIZE, 0, GRAY, False)
                all_sprites.add(block)
                walls.add(block)
            elif char == "O":
                block = Block(col_index * TILE_SIZE, row_index * TILE_SIZE, None, GREEN, True)
                all_sprites.add(block)
                blocks.add(block)
            elif char == "1":
                block = Block(col_index * TILE_SIZE, row_index * TILE_SIZE, 1, RED, True)
                all_sprites.add(block)
                blocks.add(block)
            elif char == "2":
                block = Block(col_index * TILE_SIZE, row_index * TILE_SIZE, 2, RED, True)
                all_sprites.add(block)
                blocks.add(block)
            elif char == "P":
                player = Player(col_index * TILE_SIZE, row_index * TILE_SIZE)
                player_start_pos = (player.x, player.y)
                player.rect.topleft = (player.x, player.y)
                all_sprites.add(player)
            elif char in ["L", "R", "U", "D"]:
                sidewalk = Sidewalk(col_index * TILE_SIZE, row_index * TILE_SIZE, char, 2)
                sidewalks.add(sidewalk)
    return player, player_start_pos

"""
Create the goal. Seperate from make_level because it returns a value

return: Rect object representing goal and location
"""
def make_goal(levels, current_level):
    for row_index, row in enumerate(levels[current_level]):
        for col_index, char in enumerate(row):
            if char == "G":
                goal_rect = pygame.Rect(col_index * TILE_SIZE, row_index * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                return goal_rect

"""
Basic direcitonal control, also keeps player within bounds of screen
"""
def handle_player_movement(event, player):
    if event.type == pygame.KEYDOWN:
        if event.key == pygame.K_LEFT:
            player.dx = -1
        if event.key == pygame.K_RIGHT:
            player.dx = 1
        if event.key == pygame.K_UP:
            player.dy = -1
        if event.key == pygame.K_DOWN:
            player.dy = 1
    
    player.x = max(0, min(player.x, SCREEN_WIDTH - TILE_SIZE))
    player.y = max(0, min(player.y, SCREEN_HEIGHT - TILE_SIZE))

"""
Axis-Aligned Bounding Box collision
"""
def aabb_collision(rect1, rect2):
    return(
        rect1.left < rect2.right and
        rect1.right > rect2.left and
        rect1.top < rect2.bottom and
        rect1.bottom > rect2.top
    )

"""
Find the overlap of player and blocks, useful for avoiding clipping
"""
def find_overlap_distance(player_rect, block_rect):
    overlap_x = min(player_rect.right, block_rect.right) - max(player_rect.left, block_rect.left)
    overlap_y = min(player_rect.bottom, block_rect.bottom) - max(player_rect.top, block_rect.top)
    return overlap_x, overlap_y

"""
Everytime anything moves this updates the copy of the level.
Necessary for allowing blocks to move in places where blocks start out
"""
def update_level_data(level_data, all_sprites):
    updated_level_data = [
        ["." for _ in range(len(level_data[0]))] for _ in range(len(level_data))
    ]

    for y, row in enumerate(level_data):
        for x, char in enumerate(row):
            if char in ("W", "G"):
                updated_level_data[y][x] = char

    for sprite in all_sprites:
        if isinstance(sprite, Block) and sprite.pushable:
            x = int(sprite.x // TILE_SIZE)
            y = int(sprite.y // TILE_SIZE)

            if sprite.push_limit is None:
                updated_level_data[y][x] = "O"
            else:
                updated_level_data[y][x] = str(sprite.push_limit)

        if isinstance(sprite, Player):
            x = int(sprite.x // TILE_SIZE)
            y = int(sprite.y // TILE_SIZE)
            updated_level_data[y][x] = "P"

    return updated_level_data

"""
Handle when the player collides with a wall. Allows the player to move
against a wall, finds the overlap distance and moves player outside of wall
"""
def resovle_wall_collisions(walls, player):
    wall_collisions = [wall for wall in walls if aabb_collision(player.rect, wall.rect)]
    if wall_collisions:
        player.is_overlapped = True
        for wall in wall_collisions:
            dx = wall.rect.centerx - player.rect.centerx
            dy = wall.rect.centery - player.rect.centery

            collision_horizontal = abs(dx) > abs(dy)

            if collision_horizontal:
                if player.x > wall.x:
                    player.x += find_overlap_distance(player.rect, wall.rect)[0]
                elif player.x < wall.x:
                    player.x -= find_overlap_distance(player.rect, wall.rect)[0]
            else:
                if player.y > wall.y:
                    player.y += find_overlap_distance(player.rect, wall.rect)[1]
                elif player.y < wall.y:
                    player.y -= find_overlap_distance(player.rect, wall.rect)[1]

"""
Display victory message and grab player input for restarting the level
or moving to the next one
"""
def show_win_screen(win_font):
    translucent = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    translucent.set_alpha(128)
    translucent.fill((0,0,0))
    screen.blit(translucent, (0,0))
    
    win_text = win_font.render("Level Complete!", True, WHITE)
    restart_text = win_font.render("Press R To Restart", True, WHITE)
    next_level_text = win_font.render("Press N For Next Level", True, WHITE)
    
    win_text_rect = win_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50))
    restart_text_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
    next_level_text_rect = next_level_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 100))
    
    screen.blit(win_text, win_text_rect)
    screen.blit(restart_text, restart_text_rect)
    screen.blit(next_level_text, next_level_text_rect)
    pygame.display.flip()
    
    waiting = True
    while waiting:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:
                    return "restart"
                elif event.key == pygame.K_n:
                    return "next_level"

"""
Reset everything to the beginning of the current level
"""
def reset_level(all_sprites, goal, blocks, walls, sidewalks, is_pushing, push_timer, level_complete, levels, current_level, player, player_start_pos):

    # Reset the blocks and walls
    all_sprites.empty()
    blocks.empty()
    walls.empty()
    sidewalks.empty()

    player, player_start_pos = make_level(levels, all_sprites, walls, blocks, current_level, sidewalks, player, player_start_pos)
    goal = make_goal(levels, current_level)

    is_pushing = False
    push_timer = 0
    
    level_complete = False
    
    return goal, is_pushing, push_timer, level_complete, player, player_start_pos

async def main():
    # Create sprite groups
    all_sprites = pygame.sprite.Group()
    blocks = pygame.sprite.Group()
    walls = pygame.sprite.Group()
    sidewalks = pygame.sprite.Group()

    # Player Variables
    player = None
    player_start_pos = None

    # Push control
    push_time = 30
    push_timer = 0
    is_pushing = False

    # Fonts
    font = pygame.font.Font(None, int(TILE_SIZE * 0.8))
    win_font = pygame.font.Font(None, 48)

    # Levels are defined as follows:
    # W = Walls
    # P = Player
    # G = Goal
    # O = Object (pushable)
    # 1, 2, 3, etc. = Pushable block with push limit
    # L, R, U, D = Moving sidewalk, char determines direction
    levels = [
        # Level 0
        [
            "WWWWWWWWWWWWWWWWWWWW",
            "W.........P........W",
            "WWWWWWWWWW2WWWWWWWWW",
            "W..................W",
            "WW.W.W.W.W.W.W.W.W.W",
            "W..................W",
            "W.W.G...W.W.W.W.W.WW",
            "W..................W",
            "WW.W.1.2.W.W.W.W.W.W",
            "W..................W",
            "W.W.W.W.1.W.W.W.W.WW",
            "W..................W",
            "W........G.....O...W",
            "W..................W",
            "WWWWWWWWWWWWWWWWWWWW",
        ],
        # Level 1
        [
            "WWWWWWWWWWWWWWWWWWWW",
            "WP.......G.........W",
            "W........ULLLLLL...W",
            "WWWWWWWWWWWWWW111WWW",
            "W......RDRDRD......W",
            "W.RRRRDUDUDURRR....W",
            "W.....RURURU.......W",
            "W111WWWWWWWWWWWWWWWW",
            "W..................W",
            "W..LLLLLLL.........W",
            "W........11W.......W",
            "WWWWWWWWW...WWWWWWWW",
            "W...........O......W",
            "W..................W",
            "WWWWWWWWWWWWWWWWWWWW",
        ],
        # Level 2
        [
            "WWWWWWWWWWWWWWWWWWWW",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W..................W",
            "W......POG.........W",
            "WWWWWWWWWWWWWWWWWWWW",
        ],
        # Level 3
        [
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWW.1...1..WWWWWW",
            "WWWWWW.1.W.1..WWWWWW",
            "WWWWWW.O...1..WWWWWW",
            "WWWWWW.1.W.1..WWWWWW",
            "WWWWWW..P11G..WWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
        ],
        # Level 4
        [
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWW......DWWWWWWW",
            "WWWWWW.1.1.WDWWWWWWW",
            "WWWWWW.O1.GPLWWWWWWW",
            "WWWWWW.1.1.WUWWWWWWW",
            "WWWWWWR.....UWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWWWWWW",
        ],
    ]

    # Set starting level
    current_level = 2
    # Copy current level to maintain form
    level_data = copy.deepcopy(levels[current_level])

    # Initial level creation
    player, player_start_pos = make_level(levels, all_sprites, walls, blocks, current_level, sidewalks, player, player_start_pos)
    # Initial goal creation
    goal = make_goal(levels, current_level)
    # Game Loop
    level_complete = False
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            else:
                handle_player_movement(event, player)
        
        keys = pygame.key.get_pressed()
        # Stop the player after player lets go of buttons
        if not (keys[pygame.K_LEFT] or keys[pygame.K_RIGHT]):
            player.dx = 0
        if not (keys[pygame.K_UP] or keys[pygame.K_DOWN]):
            player.dy = 0
        # Reset the level, used in case of softlock
        if keys[pygame.K_t]:
            goal, is_pushing, push_timer, level_complete, player, player_start_pos = reset_level(all_sprites, goal, blocks, walls, sidewalks, is_pushing, push_timer, level_complete, levels, current_level, player, player_start_pos)
        
        all_sprites.update()
        for sidewalk in sidewalks:
            for block in blocks:
                if block.push_limit == None:
                    if sidewalk.x == block.x and sidewalk.y == block.y:
                        sidewalk.update(block)
        
        resovle_wall_collisions(walls, player)
        
        pushable_collisions = [block for block in blocks if aabb_collision(player.rect, block.rect)]
        if pushable_collisions:
            # If the player is colliding they're overlapping
            player.is_overlapped = True
            player.speed = 0
            for block in pushable_collisions:
                dx = block.rect.centerx - player.rect.centerx
                dy = block.rect.centery - player.rect.centery
                
                # Check if the player is more on the left/right than up/down of a block
                collision_horizontal = abs(dx) > abs(dy)
                
                # Set the direction the player is pushing
                if collision_horizontal:
                    if player.dx > 0:
                        push_direction = (1, 0)
                    elif player.dx < 0:
                        push_direction = (-1, 0)
                    else:
                        push_direction = (1, 0) if dx > 0 else (-1, 0)
                else:
                    if player.dy > 0:
                        push_direction = (0, 1)
                    elif player.dy < 0:
                        push_direction = (0, -1)
                    else:
                        push_direction = (0, 1) if dy > 0 else (0, -1)
                
                # Check if the player is actively pushing against the block instead of
                # just colliding with it.
                overlap_x, overlap_y = find_overlap_distance(player.rect, block.rect)
                if (collision_horizontal and player.dx != 0 and (player.dx > 0) == (dx > 0) and overlap_y >= TILE_SIZE // 2) or \
                (not collision_horizontal and player.dy != 0 and (player.dy > 0) == (dy > 0) and overlap_x >= TILE_SIZE // 2):
                    # Only allow the block to be pushed if it's not actively moving, can be pushed, and is pushable
                    if not block.is_sliding and block.can_be_pushed(level_data, push_direction) and block.pushable:
                        if is_pushing:
                            # Visual for pushing
                            player.image.fill(YELLOW)
                            push_timer += 1
                            player.speed = 0
                            if push_timer >= push_time:
                                overlap_x, overlap_y = find_overlap_distance(player.rect, block.rect)
                                # Only push the block if the player is more than halfway on the block,
                                # prevents accidental pushes from partial collision
                                if (collision_horizontal and overlap_y >= TILE_SIZE // 2) or \
                                (not collision_horizontal and overlap_x >= TILE_SIZE // 2):
                                    push_success = block.push(push_direction[0], push_direction[1])
                                    if not push_success:
                                        if collision_horizontal:
                                            player.dx = 0
                                        else:
                                            player.dy = 0
                                    push_timer = 0
                                    is_pushing = False
                                    player.image.fill(BLUE)
                                    player.speed = 2
                        else:
                            is_pushing  = True
                            push_timer = 0
                    else:
                        is_pushing = False
                        player.image.fill(BLUE)
                else:
                    is_pushing = False
                    player.image.fill(BLUE)
                    player.speed = 2
                # Push the player outside of the block if not pushing
                if player.is_overlapped and not is_pushing:
                    if collision_horizontal:
                        if player.x > block.x:
                            player.x += find_overlap_distance(player.rect, block.rect)[0]
                        elif player.x < block.x:
                            player.x -= find_overlap_distance(player.rect, block.rect)[0]
                    else:
                        if player.y > block.y:
                            player.y += find_overlap_distance(player.rect, block.rect)[1]
                        elif player.y < block.y:
                            player.y -= find_overlap_distance(player.rect, block.rect)[1]
        else:
            is_pushing = False
            player.image.fill(BLUE)
            player.speed = 2
            player.is_overlapped = False
        
        # Check if any blocks are overlapping with the goal, end the level if so
        if not level_complete:
            for block in blocks:
                if block.rect.x == goal.x and block.rect.y == goal.y:
                    level_complete = True
                    break
        
        if not level_complete:
            # After everything, update the deep copy with the current game state
            level_data = update_level_data(level_data, all_sprites)
            
            screen.fill(BLACK)
            # Draw the goal outline and indicator
            pygame.draw.rect(screen, WHITE, goal, 2)
            pygame.draw.line(screen, 
                            WHITE, 
                            (goal.centerx + TILE_SIZE, goal.centery), 
                            (goal.centerx + TILE_SIZE * 2, goal.centery), 
                            2)
            pygame.draw.polygon(screen, 
                                WHITE, 
                                ((goal.centerx + TILE_SIZE, goal.centery), 
                                (goal.centerx + TILE_SIZE + TILE_SIZE // 4, goal.centery - TILE_SIZE // 4), 
                                (goal.centerx + TILE_SIZE + TILE_SIZE // 4, goal.centery + TILE_SIZE // 4))
                                )
            
            sidewalks.draw(screen)
            for sidewalk in sidewalks:
                # Left Arrow
                if sidewalk.direction.x == -1 and sidewalk.direction.y == 0:
                    pygame.draw.polygon(screen, 
                                    BLACK, 
                                    ((sidewalk.rect.centerx - TILE_SIZE // 4, sidewalk.rect.centery), 
                                    (sidewalk.rect.centerx + TILE_SIZE // 4, sidewalk.rect.centery - TILE_SIZE // 4), 
                                    (sidewalk.rect.centerx + TILE_SIZE // 4, sidewalk.rect.centery + TILE_SIZE // 4))
                                    )
                # Right Arrow
                if sidewalk.direction.x == 1 and sidewalk.direction.y == 0:
                    pygame.draw.polygon(screen, 
                                    BLACK, 
                                    ((sidewalk.rect.centerx + TILE_SIZE // 4, sidewalk.rect.centery), 
                                    (sidewalk.rect.centerx - TILE_SIZE // 4, sidewalk.rect.centery - TILE_SIZE // 4), 
                                    (sidewalk.rect.centerx - TILE_SIZE // 4, sidewalk.rect.centery + TILE_SIZE // 4))
                                    )
                # Up Arrow
                if sidewalk.direction.x == 0 and sidewalk.direction.y == -1:
                    pygame.draw.polygon(screen, 
                                    BLACK, 
                                    ((sidewalk.rect.centerx, sidewalk.rect.centery - TILE_SIZE // 4), 
                                    (sidewalk.rect.centerx + TILE_SIZE // 4, sidewalk.rect.centery + TILE_SIZE // 4), 
                                    (sidewalk.rect.centerx - TILE_SIZE // 4, sidewalk.rect.centery + TILE_SIZE // 4))
                                    )
                # Down Arrow
                if sidewalk.direction.x == 0 and sidewalk.direction.y == 1:
                    pygame.draw.polygon(screen, 
                                    BLACK, 
                                    ((sidewalk.rect.centerx, sidewalk.rect.centery + TILE_SIZE // 4), 
                                    (sidewalk.rect.centerx + TILE_SIZE // 4, sidewalk.rect.centery - TILE_SIZE // 4), 
                                    (sidewalk.rect.centerx - TILE_SIZE // 4, sidewalk.rect.centery - TILE_SIZE // 4))
                                    )
                    
            
            all_sprites.draw(screen)
            
            # Draw the current number of pushes left on each block
            # Also treat blocks with 0 pushes as walls
            for block in blocks:
                if block.push_limit != None and block.push_limit > 0:
                    push_text = font.render(str(block.push_text), True, WHITE)
                    text_rect = push_text.get_rect(center=block.rect.center)  
                    screen.blit(push_text, text_rect)
                if block.push_limit == None:
                    push_text = font.render("inf", True, WHITE)
                    text_rect = push_text.get_rect(center=block.rect.center)  
                    screen.blit(push_text, text_rect)
                if block.push_limit == 0:
                    walls.add(block)
                    blocks.remove(block)
        # Handle user choice
        else:
            choice = show_win_screen(win_font)
            if choice == "restart":
                goal, is_pushing, push_timer, level_complete, player, player_start_pos = reset_level(all_sprites, goal, blocks, walls, sidewalks, is_pushing, push_timer, level_complete, levels, current_level, player, player_start_pos)
            elif choice == "next_level":
                current_level = (current_level + 1) % len(levels)
                level_data = copy.deepcopy(levels[current_level])
                goal, is_pushing, push_timer, level_complete, player, player_start_pos = reset_level(all_sprites, goal, blocks, walls, sidewalks, is_pushing, push_timer, level_complete, levels, current_level, player, player_start_pos)
                
        pygame.display.flip()
        
        clock.tick(60)
        await asyncio.sleep(0)

    pygame.quit()

asyncio.run(main())
import pygame
from settings import *
from Camera import Camera
from level_loader import load_single_level, load_all_levels

pygame.init()

screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
clock = pygame.time.Clock()
pygame.display.set_caption("Platformer")

levels = load_all_levels("levels.json")
current_level_index = levels[0]["index"]
walls, enemies, tokens, hazards, player, total_level_width, total_level_height = load_single_level(current_level_index)

camera = Camera(total_level_width, total_level_height)
projectiles = pygame.sprite.Group()

score_font = pygame.font.Font(None, 48)

def reset():
    global enemies, tokens, hazards, player, projectiles
    _, enemies, tokens, hazards, player, _, _ = load_single_level(levels[current_level_index]["index"])
    projectiles = pygame.sprite.Group()

def draw_game_over():
    dead_font = pygame.font.Font(None, 128)
    dead_text = dead_font.render("YOU DIED", True, RED)
    screen.blit(dead_text, (SCREEN_WIDTH // 2 - dead_text.get_size()[0] // 2, SCREEN_HEIGHT // 2 - dead_text.get_size()[1] // 2))

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False
            if event.key == pygame.K_SPACE and not player.is_wall_sliding:
                if not player.is_jumping:
                    player.y_vel = -player.jump_height
                    player.is_jumping = True
                    player.on_platform = False
                elif player.is_jumping and not player.has_double_jumped:
                    player.y_vel = -player.jump_height
                    player.has_double_jumped = True
                    player.on_platform = False
            if event.key == pygame.K_r:
                reset()
    
    if player.dead:
        draw_game_over()
    else:
        enemies.update(walls, tokens, hazards, projectiles)
        player.update(walls, enemies, tokens, hazards, projectiles, total_level_width, total_level_height)
        projectiles.update(walls, enemies, projectiles)
        camera.update(player)
        
        screen.fill(BLACK)
        for wall in walls:
            screen.blit(wall.image, camera.apply(wall))
        for hazard in hazards:
            screen.blit(hazard.image, camera.apply(hazard))
        for enemy in enemies:
            screen.blit(enemy.image, camera.apply(enemy))
        for token in tokens:
            screen.blit(token.image, camera.apply(token))
        for projectile in projectiles:
            screen.blit(projectile.image, camera.apply(projectile))
        
        screen.blit(player.image, camera.apply(player))
        player.draw()
        
        score_text = score_font.render("Score: " + str(player.score), True, WHITE)
        screen.blit(score_text, (10,10))
        
        health_text = score_font.render("Health: " + str(player.health), True, WHITE)
        screen.blit(health_text, (SCREEN_WIDTH - health_text.get_size()[0] - 10, 10))
        
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
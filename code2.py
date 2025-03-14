import pygame
import random
import os

pygame.init()
pygame.mixer.init()

WIDTH , HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Top-Down Shooter")

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)

# Load images
try:
    origingal_player_img = pygame.image.load(os.path.join("Space Invaders Assets", "player.png")).convert_alpha()
    player_img = pygame.transform.scale(origingal_player_img, (30, 30))
    
    enemy_sheet = pygame.image.load(os.path.join("Space Invaders Assets", "enemies.png")).convert_alpha()
    enemy_width = 15
    enemy_height = 15
    
    enemy1_rect = pygame.Rect(0, 0, enemy_width, enemy_height)
    cropped_enemy = pygame.Surface((enemy_width, enemy_height), pygame.SRCALPHA)
    cropped_enemy.blit(enemy_sheet, (0, 0), enemy1_rect)
    enemy_img = pygame.transform.scale(cropped_enemy, (30, 30))
    
    original_bullet_img = pygame.image.load(os.path.join("Space Invaders Assets", "player bullet.png")).convert_alpha()
    bullet_img = pygame.transform.scale(original_bullet_img, (15, 20))
except pygame.error as e:
    print(f"Error loading image: {e}")
    pygame.quit()
    quit()

# Load bg
try:
    background1 = pygame.image.load("spr_stars01.png").convert()
    background1 = pygame.transform.scale(background1, (WIDTH, HEIGHT))
    background2 = pygame.image.load("spr_stars02.png").convert()
    background2 = pygame.transform.scale(background2, (WIDTH, HEIGHT))
except pygame.error as e:
    print(f"Error loading background: {e}")
    pygame.quit()
    quit()

# Load sound effects
try:
    shoot_sound = pygame.mixer.Sound(os.path.join("audio", "player_shoot.ogg"))
    explosion_sound = pygame.mixer.Sound(os.path.join("audio", "player_explotion.ogg"))
    game_over_sound = pygame.mixer.Sound(os.path.join("audio", "SoundGameOver.wav"))
except pygame.error as e:
    print(f"Error loading sound: {e}")
    pygame.quit()
    quit()

# Load bg music
try:
    pygame.mixer.music.load(os.path.join("audio", "Raining Bits.ogg"))
    pygame.mixer.music.play(-1)
    pygame.mixer.music.set_volume(0.7)
except pygame.error as e:
    print(f"Error loading music: {e}")
    pygame.quit()
    quit()

background1_y = 0
background2_y = 0

player_x = WIDTH / 2
player_y = HEIGHT - 50
player_speed = 5

bullets = []

enemies = []
enemy_speed = 2
enemy_tracking_speed = 1
enemy_movement_type = ['tracking', 'random', 'straight']
enemy_bullets = []
enemy_bullet_img = bullet_img
enemies_escaped = 0

game_over = False
clock = pygame.time.Clock()
score = 0
font = pygame.font.Font(None, 36)

def create_enemy():
    enemy_x = random.randint(0, WIDTH - enemy_img.get_width())
    enemy_y = -enemy_img.get_height()
    movement = random.choice(enemy_movement_type)
    enemies.append([enemy_x, enemy_y, movement])

def handle_events():
    global player_x, player_y, bullets, game_over
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            quit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                bullets.append([player_x + player_img.get_width() // 2 - bullet_img.get_width() // 2, player_y])
                shoot_sound.play()

def handle_player_movement():
    global player_x, player_y
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        player_x -= player_speed
    if keys[pygame.K_RIGHT]:
        player_x += player_speed
    if keys[pygame.K_UP]:
        player_y -= player_speed
    if keys[pygame.K_DOWN]:
        player_y += player_speed
    player_x = max(0, min(player_x, WIDTH - player_img.get_width()))
    player_y = max(0, min(player_y, HEIGHT - player_img.get_height()))
    
def handle_bullets():
    for bullet in bullets[:]:
        bullet[1] -= 10
        if bullet[1] < 0:
            bullets.remove(bullet)

def handle_enemies():
    global enemies, enemy_bullets, game_over, enemies_escaped
    if random.randint(1, 100) < 3:
        create_enemy()

    for enemy in enemies[:]:
        if enemy[2] == "straight":
            enemy[1] += enemy_speed
        elif enemy[2] == "tracking":
            if enemy[0] < player_x:
                enemy[0] = min(enemy[0] + enemy_speed, WIDTH - enemy_img.get_width())
            elif enemy[0] > player_x:
                enemy[0] = max(enemy[0] - enemy_speed, 0)
            enemy[1] += enemy_speed
        elif enemy[2] == "random":
            enemy[0] += random.randint(-2, 2)
            enemy[1] += enemy_speed
            enemy[0] = max(0, min(enemy[0], WIDTH - enemy_img.get_width()))

        if enemy[1] > HEIGHT:
            enemies.remove(enemy)
            enemies_escaped += 1
            if enemies_escaped == 5:
                game_over = True
                game_over_sound.play()

        if random.randint(1, 200) == 1:
            enemy_bullets.append([enemy[0] + enemy_img.get_width() // 2 - bullet_img.get_width()//2, enemy[1] + enemy_img.get_height()])

def handle_enemy_bullets():
    global enemy_bullets, game_over
    for bullet in enemy_bullets[:]:
        bullet[1] += 5
        if bullet[1] > HEIGHT:
            enemy_bullets.remove(bullet)

def handle_collisions():
    global score, game_over, bullets, enemies, enemy_bullets
    for bullet in bullets[:]:
        bullet_rect = bullet_img.get_rect(topleft=(bullet[0], bullet[1]))
        for enemy in enemies[:]:
            enemy_rect = enemy_img.get_rect(topleft=(enemy[0], enemy[1]))
            if bullet_rect.colliderect(enemy_rect):
                bullets.remove(bullet)
                enemies.remove(enemy)
                score += 1
                explosion_sound.play()
                break #prevent checking the same enemy twice

    player_rect = player_img.get_rect(topleft=(player_x, player_y))
    for bullet in enemy_bullets[:]:
        bullet_rect = bullet_img.get_rect(topleft=(bullet[0], bullet[1]))
        if player_rect.colliderect(bullet_rect):
            game_over = True
            game_over_sound.play()
            enemy_bullets.remove(bullet)
            break

    for enemy in enemies[:]:
        enemy_rect = enemy_img.get_rect(topleft=(enemy[0], enemy[1]))
        if player_rect.colliderect(enemy_rect):
            game_over = True
            game_over_sound.play()
            break

def handle_background():
    global background1_y, background2_y
    background1_y += 1
    background2_y += 3
    
    if background1_y > HEIGHT:
        background1_y = 0
    if background2_y > HEIGHT:
        background2_y = 0

def draw():
    screen.fill((0, 0, 0))
    screen.blit(background2, (0, background2_y))
    screen.blit(background2, (0, background2_y - HEIGHT))
    screen.blit(background1, (0, background1_y))
    screen.blit(background1, (0, background1_y - HEIGHT))

    screen.blit(player_img, (player_x, player_y))
    for bullet in bullets:
        screen.blit(bullet_img, (bullet[0], bullet[1]))
    for enemy in enemies:
        screen.blit(enemy_img, (enemy[0], enemy[1]))
    for bullet in enemy_bullets:
        screen.blit(bullet_img, (bullet[0], bullet[1]))

    score_text = font.render("Score: " + str(score), True, WHITE)
    screen.blit(score_text, (10, 10))
    
    enemies_escaped_text = font.render("Enemies Escaped: " + str(enemies_escaped) + "/5", True, WHITE)
    screen.blit(enemies_escaped_text, (WIDTH // 2 + 130, 10))

    pygame.display.flip()
    
while True:
    if not game_over:
        handle_events()
        handle_player_movement()
        handle_bullets()
        handle_enemies()
        handle_enemy_bullets()
        handle_collisions()
        handle_background()
        draw()
        clock.tick(60)
    else:
        game_over_text = font.render("YOU DIED Score: " + str(score), True, WHITE)
        text_rect = game_over_text.get_rect(center=(WIDTH // 2, HEIGHT // 2))
        screen.blit(game_over_text, text_rect)
        pygame.display.flip()
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                quit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    game_over = False
                    player_x = WIDTH // 2
                    player_y = HEIGHT - 50
                    bullets = []
                    enemies = []
                    enemy_bullets = []
                    score = 0
import curses
import math
import time

# Peta 2D (1 = Dinding, 0 = Ruang Kosong)
MAP = [
    "1111111111111111",
    "1000000000000001",
    "1011110011111001",
    "1010000000001001",
    "1010111111001001",
    "1010100001001001",
    "1000100001000001",
    "1111111111111111",
]
MAP_WIDTH = len(MAP[0])
MAP_HEIGHT = len(MAP)

def main(stdscr):
    # Konfigurasi curses
    curses.curs_set(0)        # Sembunyikan kursor
    stdscr.nodelay(True)      # Input non-blocking
    stdscr.timeout(30)        # Limit frame rate (~30 FPS)

    # Posisi awal & sudut pandang pemain
    px, py = 2.0, 2.0
    pa = 0.0                  # Sudut rotasi (radiants)
    fov = math.pi / 3.0       # Field of View (60 derajat)

    while True:
        # Deteksi ukuran terminal aktif secara dinamis
        max_y, max_x = stdscr.getmaxyx()
        
        if max_y < 10 or max_x < 20:
            stdscr.erase()
            stdscr.addstr(0, 0, "Terminal terlalu kecil! Lebarkan panel terminal Anda.")
            stdscr.refresh()
            time.sleep(0.1)
            continue

        # Baca Kontrol Keyboard
        try:
            key = stdscr.getch()
        except:
            key = -1

        if key in (ord('q'), ord('Q')):
            break

        move_speed = 0.12
        rot_speed = 0.08

        # Vektor arah pergerakan
        dx = math.cos(pa) * move_speed
        dy = math.sin(pa) * move_speed

        if key in (ord('w'), ord('W')):
            if MAP[int(py)][int(px + dx * 1.5)] == '0': px += dx
            if MAP[int(py + dy * 1.5)][int(px)] == '0': py += dy
        if key in (ord('s'), ord('S')):
            if MAP[int(py)][int(px - dx * 1.5)] == '0': px -= dx
            if MAP[int(py + dy * 1.5)][int(px)] == '0': py -= dy
        if key in (ord('a'), ord('A')):
            pa -= rot_speed
        if key in (ord('d'), ord('D')):
            pa += rot_speed

        # Render Layar 3D
        stdscr.erase()
        
        # Iterasi raycasting untuk setiap kolom layar yang tersedia
        for x in range(max_x):
            ray_angle = (pa - fov / 2.0) + (x / float(max_x)) * fov
            distance_to_wall = 0.0
            hit_wall = False
            
            eye_x = math.cos(ray_angle)
            eye_y = math.sin(ray_angle)

            while not hit_wall and distance_to_wall < 16.0:
                distance_to_wall += 0.1
                test_x = int(px + eye_x * distance_to_wall)
                test_y = int(py + eye_y * distance_to_wall)

                if test_x < 0 or test_x >= MAP_WIDTH or test_y < 0 or test_y >= MAP_HEIGHT:
                    hit_wall = True
                    distance_to_wall = 16.0
                elif MAP[test_y][test_x] == '1':
                    hit_wall = True

            # Koreksi distorsi fish-eye
            corrected_dist = distance_to_wall * math.cos(ray_angle - pa)
            if corrected_dist < 0.1: 
                corrected_dist = 0.1

            # Hitung tinggi dinding berdasarkan proyeksi perspektif
            ceiling = int((max_y / 2.0) - max_y / corrected_dist)
            floor = max_y - ceiling

            # Pilih karakter shading berdasarkan jarak
            if distance_to_wall <= 2.0:    wall_char = '█'
            elif distance_to_wall <= 4.0:  wall_char = '▓'
            elif distance_to_wall <= 6.0:  wall_char = '▒'
            elif distance_to_wall <= 8.0:  wall_char = '░'
            elif distance_to_wall <= 10.0: wall_char = '#'
            else:                          wall_char = '.'

            # Gambarkan kolom ke buffer terminal
            for y in range(max_y):
                if y < ceiling:
                    char = ' ' # Atap/Langit
                elif ceiling <= y <= floor:
                    char = wall_char # Dinding
                else:
                    char = '.' if (y % 2 == 0) else ' ' # Lantai

                try:
                    stdscr.addch(y, x, char)
                except curses.error:
                    pass

        # Tampilkan Status HUD di bagian atas
        hud_text = f" Pos: ({px:.1f}, {py:.1f}) | Kontrol: WASD = Jalan, Q = Keluar "
        try:
            stdscr.addstr(0, 0, hud_text[:max_x-1], curses.A_REVERSE)
        except curses.error:
            pass

        stdscr.refresh()

if __name__ == "__main__":
    curses.wrapper(main)
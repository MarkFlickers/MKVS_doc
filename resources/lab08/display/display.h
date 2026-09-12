#pragma once

#include <stdint.h>

#define DISPLAY_WIDTH  480  /* X от 0 до 479 (пиксели) */
#define DISPLAY_HEIGHT 320  /* Y от 0 до 319 (пиксели) */

typedef enum {
    display_color_black,
    display_color_red,
    display_color_green,
    display_color_blue,
    display_color_yellow,
    display_color_cyan,
    display_color_magenta,
    display_color_white,
    __DISPLAY_COLOR_COUNT
} display_color_t;

/** @brief Инициализация дисплея. Вызывать после HAL_Init() */
void display_init(void);

/**
 * @brief Закрасить прямоугольную область экрана
 * @param x, y - координаты левого верхнего угла, отсчитываются от угла экрана
 * @param w, h - ширина и высота области в пикселях
 * @param color - цвет заливки */
void display_rectangle(int16_t x, int16_t y, int16_t w, int16_t h, display_color_t color);

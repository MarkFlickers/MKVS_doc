#include "display.h"
#include <assert.h>
#include "ili9488.h"

static const uint8_t COLORS[__DISPLAY_COLOR_COUNT][3] = {
    [display_color_black] = {0xFF, 0xFF, 0xFF},   [display_color_red] = {0x00, 0xFF, 0xFF},
    [display_color_green] = {0xFF, 0x00, 0xFF},   [display_color_blue] = {0xFF, 0xFF, 0x00},
    [display_color_yellow] = {0x00, 0x00, 0xFF},  [display_color_cyan] = {0xFF, 0x00, 0x00},
    [display_color_magenta] = {0x00, 0xFF, 0x00}, [display_color_white] = {0x00, 0x00, 0x00}};

static int lib_inited = 0;

void display_init(void) {
    ILI9488_Init();
    lib_inited = 1;
}

void display_rectangle(int16_t x, int16_t y, int16_t w, int16_t h, display_color_t color) {
    assert(lib_inited && "Необходимо вызвать display_init()");
    if (!lib_inited)
        return;

    assert(color < __DISPLAY_COLOR_COUNT);
    if (color >= __DISPLAY_COLOR_COUNT)
        return;

    const uint8_t* pixelValue = COLORS[color];
    int16_t x2 = x + w - 1, y2 = y + h - 1;
    if (x2 > DISPLAY_WIDTH - 1)
        x2 = DISPLAY_WIDTH - 1;
    if (y2 > DISPLAY_HEIGHT - 1)
        y2 = DISPLAY_HEIGHT - 1;
    if (x < 0)
        x = 0;
    if (y < 0)
        y = 0;
    w = x2 - x + 1;
    h = y2 - y + 1;
    if (w <= 0 || h <= 0)
        return;
    ILI9488_SetAddressWindow(x, y, x2, y2);
    ILI9488_WriteChunks(pixelValue, 3, (uint32_t)w * (uint32_t)h);
}

#pragma once

#include <stdint.h>
#include <stm32h7xx_hal.h>

/* Выводы дисплейного модуля MSP3520: обмен по SPI5 (PF7 - SCK, PF8 - MISO,
   PF9 - MOSI), выбор кристалла дисплея и тачскрина, линия "команда/данные"
   и аппаратный сброс. */
#define LCD_CS_Pin GPIO_PIN_2
#define LCD_CS_GPIO_Port GPIOA
#define LCD_DC_Pin GPIO_PIN_8
#define LCD_DC_GPIO_Port GPIOC
#define LCD_RST_Pin GPIO_PIN_9
#define LCD_RST_GPIO_Port GPIOC
#define T_CS_Pin GPIO_PIN_10
#define T_CS_GPIO_Port GPIOF

void ILI9488_Init(void);
void ILI9488_SetAddressWindow(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2);
void ILI9488_WriteDataByte(uint8_t data);
void ILI9488_WriteCommand(uint8_t cmd);
void ILI9488_WriteChunks(const uint8_t* pchunk, uint32_t chunk_size, uint32_t chunk_count);

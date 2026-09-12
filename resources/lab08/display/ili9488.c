#include "ili9488.h"
#include <stddef.h>
#include "error_state.h"
#include "stm32h7xx_hal_spi.h"

static SPI_HandleTypeDef hspi5;

static void ILI9488_MSP_Init(void) {
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOC_CLK_ENABLE();
    __HAL_RCC_GPIOF_CLK_ENABLE();

    /* Исходные уровни на линиях выбора кристалла и управления дисплеем */
    HAL_GPIO_WritePin(T_CS_GPIO_Port, T_CS_Pin, GPIO_PIN_SET);
    HAL_GPIO_WritePin(LCD_CS_GPIO_Port, LCD_CS_Pin, GPIO_PIN_SET);
    HAL_GPIO_WritePin(GPIOC, LCD_DC_Pin | LCD_RST_Pin, GPIO_PIN_RESET);

    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;

    /* Выбор кристалла тачскрина - не используется, держим неактивным */
    GPIO_InitStruct.Pin = T_CS_Pin;
    HAL_GPIO_Init(T_CS_GPIO_Port, &GPIO_InitStruct);

    /* Выбор кристалла дисплея */
    GPIO_InitStruct.Pin = LCD_CS_Pin;
    HAL_GPIO_Init(LCD_CS_GPIO_Port, &GPIO_InitStruct);

    /* Линия "команда/данные" и аппаратный сброс дисплея */
    GPIO_InitStruct.Pin = LCD_DC_Pin | LCD_RST_Pin;
    HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

    hspi5.Instance = SPI5;
    hspi5.Init.Mode = SPI_MODE_MASTER;
    hspi5.Init.Direction = SPI_DIRECTION_2LINES;
    hspi5.Init.DataSize = SPI_DATASIZE_8BIT;
    hspi5.Init.CLKPolarity = SPI_POLARITY_LOW;
    hspi5.Init.CLKPhase = SPI_PHASE_1EDGE;
    hspi5.Init.NSS = SPI_NSS_SOFT;
    hspi5.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_4;
    hspi5.Init.FirstBit = SPI_FIRSTBIT_MSB;
    hspi5.Init.TIMode = SPI_TIMODE_DISABLE;
    hspi5.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
    hspi5.Init.CRCPolynomial = 0x0;
    hspi5.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
    hspi5.Init.NSSPolarity = SPI_NSS_POLARITY_LOW;
    hspi5.Init.FifoThreshold = SPI_FIFO_THRESHOLD_01DATA;
    hspi5.Init.TxCRCInitializationPattern = SPI_CRC_INITIALIZATION_ALL_ZERO_PATTERN;
    hspi5.Init.RxCRCInitializationPattern = SPI_CRC_INITIALIZATION_ALL_ZERO_PATTERN;
    hspi5.Init.MasterSSIdleness = SPI_MASTER_SS_IDLENESS_00CYCLE;
    hspi5.Init.MasterInterDataIdleness = SPI_MASTER_INTERDATA_IDLENESS_00CYCLE;
    hspi5.Init.MasterReceiverAutoSusp = SPI_MASTER_RX_AUTOSUSP_DISABLE;
    hspi5.Init.MasterKeepIOState = SPI_MASTER_KEEP_IO_STATE_DISABLE;
    hspi5.Init.IOSwap = SPI_IO_SWAP_DISABLE;
    if (HAL_SPI_Init(&hspi5) != HAL_OK) {
        error_state(NULL);
    }
}

void HAL_SPI_MspInit(SPI_HandleTypeDef* spiHandle) {
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    RCC_PeriphCLKInitTypeDef PeriphClkInitStruct = {0};
    if (spiHandle->Instance == SPI5) {
        PeriphClkInitStruct.PeriphClockSelection = RCC_PERIPHCLK_SPI5;
        PeriphClkInitStruct.Spi45ClockSelection = RCC_SPI45CLKSOURCE_HSI;
        if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInitStruct) != HAL_OK) {
            error_state(NULL);
        }

        __HAL_RCC_SPI5_CLK_ENABLE();
        __HAL_RCC_GPIOF_CLK_ENABLE();
        /**SPI5 GPIO Configuration
        PF7     ------> SPI5_SCK
        PF8     ------> SPI5_MISO
        PF9     ------> SPI5_MOSI
        */
        GPIO_InitStruct.Pin = GPIO_PIN_7 | GPIO_PIN_8 | GPIO_PIN_9;
        GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
        GPIO_InitStruct.Pull = GPIO_NOPULL;
        GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
        GPIO_InitStruct.Alternate = GPIO_AF5_SPI5;
        HAL_GPIO_Init(GPIOF, &GPIO_InitStruct);
    }
}

void HAL_SPI_MspDeInit(SPI_HandleTypeDef* spiHandle) {
    if (spiHandle->Instance == SPI5) {
        __HAL_RCC_SPI5_CLK_DISABLE();
        /**SPI5 GPIO Configuration
        PF7     ------> SPI5_SCK
        PF8     ------> SPI5_MISO
        PF9     ------> SPI5_MOSI
        */
        HAL_GPIO_DeInit(GPIOF, GPIO_PIN_7 | GPIO_PIN_8 | GPIO_PIN_9);
    }
}

void ILI9488_WriteCommand(uint8_t cmd) {
    HAL_GPIO_WritePin(LCD_DC_GPIO_Port, LCD_DC_Pin, GPIO_PIN_RESET);  // DC = 0 (Команда)
    HAL_GPIO_WritePin(LCD_CS_GPIO_Port, LCD_CS_Pin, GPIO_PIN_RESET);  // CS = 0
    HAL_SPI_Transmit(&hspi5, &cmd, 1, HAL_MAX_DELAY);
    HAL_GPIO_WritePin(LCD_CS_GPIO_Port, LCD_CS_Pin, GPIO_PIN_SET);  // CS = 1
}

void ILI9488_WriteDataByte(uint8_t data) {
    HAL_GPIO_WritePin(LCD_DC_GPIO_Port, LCD_DC_Pin, GPIO_PIN_SET);    // DC = 1 (Данные)
    HAL_GPIO_WritePin(LCD_CS_GPIO_Port, LCD_CS_Pin, GPIO_PIN_RESET);  // CS = 0
    HAL_SPI_Transmit(&hspi5, &data, 1, HAL_MAX_DELAY);
    HAL_GPIO_WritePin(LCD_CS_GPIO_Port, LCD_CS_Pin, GPIO_PIN_SET);  // CS = 1
}

void ILI9488_WriteChunks(const uint8_t* pchunk, uint32_t chunk_size, uint32_t chunk_count) {
    HAL_GPIO_WritePin(LCD_DC_GPIO_Port, LCD_DC_Pin, GPIO_PIN_SET);
    HAL_GPIO_WritePin(LCD_CS_GPIO_Port, LCD_CS_Pin, GPIO_PIN_RESET);
    for (uint32_t i = 0; i < chunk_count; i++) {
        // HAL_SPI_Transmit() принимает буфер без const, данные он только читает
        HAL_SPI_Transmit(&hspi5, (uint8_t*)pchunk, (uint16_t)chunk_size, HAL_MAX_DELAY);
    }
    HAL_GPIO_WritePin(LCD_CS_GPIO_Port, LCD_CS_Pin, GPIO_PIN_SET);
}

void ILI9488_Init(void) {
    ILI9488_MSP_Init();
    // 1. Аппаратный сброс
    HAL_GPIO_WritePin(LCD_RST_GPIO_Port, LCD_RST_Pin, GPIO_PIN_RESET);
    HAL_Delay(120);
    HAL_GPIO_WritePin(LCD_RST_GPIO_Port, LCD_RST_Pin, GPIO_PIN_SET);
    HAL_Delay(120);

    // 2. Выход из спящего режима
    ILI9488_WriteCommand(0x11);  // Sleep Out
    HAL_Delay(120);

    // 3. Настройка формата пикселя (Interface Pixel Format)
    ILI9488_WriteCommand(0x3A);
    ILI9488_WriteDataByte(0x66);  // 18-bit/24-bit mode (для SPI это 3 байта на пиксель)

    // 4. Настройка ориентации (Memory Access Control)
    ILI9488_WriteCommand(0x36);
    ILI9488_WriteDataByte(0xE8);  // Ландшафтная ориентация (зависит от подключения)

    // 5. Настройка яркости и инверсии (опционально)
    ILI9488_WriteCommand(0x21);  // Display Inversion ON (часто нужно для IPS матриц)

    // 6. Power Control и Gamma (стандартные значения для ILI9488)
    ILI9488_WriteCommand(0xC0);
    ILI9488_WriteDataByte(0x17);
    ILI9488_WriteDataByte(0x15);
    ILI9488_WriteCommand(0xC1);
    ILI9488_WriteDataByte(0x41);
    ILI9488_WriteCommand(0xC5);
    ILI9488_WriteDataByte(0x00);
    ILI9488_WriteDataByte(0x12);
    ILI9488_WriteDataByte(0x80);

    // 7. Включение дисплея
    ILI9488_WriteCommand(0x29);  // Display ON
}

void ILI9488_SetAddressWindow(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2) {
    uint8_t dataX[4] = {x1 >> 8, x1 & 0xFF, x2 >> 8, x2 & 0xFF};
    uint8_t dataY[4] = {y1 >> 8, y1 & 0xFF, y2 >> 8, y2 & 0xFF};
    ILI9488_WriteCommand(0x2A);  // Column Address Set
    ILI9488_WriteChunks(dataX, 4, 1);
    ILI9488_WriteCommand(0x2B);  // Page Address Set
    ILI9488_WriteChunks(dataY, 4, 1);
    ILI9488_WriteCommand(0x2C);  // Memory Write
}

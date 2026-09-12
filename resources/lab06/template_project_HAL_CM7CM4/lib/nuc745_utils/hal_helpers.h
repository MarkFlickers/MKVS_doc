#pragma once

#include <stm32h7xx_hal.h>

#define ASSERT_HAL_STATUS(STATUS) assert_hal_status((STATUS), __FILE__, __LINE__)

/** Проверка статуса HAL с аварийным завершением в случае ошибки */
void assert_hal_status(HAL_StatusTypeDef status, const char* file, int line);

/** Преобразование кодов HAL в строку */

const char* hal_status_to_string(HAL_StatusTypeDef status);

const char* hal_uart_state_to_string(HAL_UART_StateTypeDef state);

const char* hal_uart_error_to_string(uint32_t error);

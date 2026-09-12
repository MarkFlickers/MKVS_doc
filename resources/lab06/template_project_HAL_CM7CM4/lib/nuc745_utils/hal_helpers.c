#include "hal_helpers.h"
#include <stdio.h>
#include "error_state.h"

void assert_hal_status(HAL_StatusTypeDef status, const char* file, int line) {
    if (status != HAL_OK) {
        printf("\n\rHAL STATUS ERROR ON %s:%d: %s", file, line, hal_status_to_string(status));
        error_state(NULL);
    }
}

#define CASE(VAL) \
    case VAL:     \
        return #VAL
#define DEFAULT() \
    default:      \
        return "UNKNOWN"

const char* hal_status_to_string(HAL_StatusTypeDef status) {
    switch (status) {
        CASE(HAL_OK);
        CASE(HAL_TIMEOUT);
        CASE(HAL_BUSY);
        CASE(HAL_ERROR);
        DEFAULT();
    }
}

const char* hal_uart_state_to_string(HAL_UART_StateTypeDef state) {
    switch (state) {
        CASE(HAL_UART_STATE_RESET);
        CASE(HAL_UART_STATE_READY);
        CASE(HAL_UART_STATE_BUSY);
        CASE(HAL_UART_STATE_BUSY_TX);
        CASE(HAL_UART_STATE_BUSY_RX);
        CASE(HAL_UART_STATE_BUSY_TX_RX);
        CASE(HAL_UART_STATE_TIMEOUT);
        CASE(HAL_UART_STATE_ERROR);
        DEFAULT();
    }
}

const char* hal_uart_error_to_string(uint32_t error) {
    switch (error) {
        CASE(HAL_UART_ERROR_NONE);
        CASE(HAL_UART_ERROR_PE);
        CASE(HAL_UART_ERROR_NE);
        CASE(HAL_UART_ERROR_FE);
        CASE(HAL_UART_ERROR_ORE);
        CASE(HAL_UART_ERROR_DMA);
        CASE(HAL_UART_ERROR_RTO);
        DEFAULT();
    }
}

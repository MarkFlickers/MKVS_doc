#pragma once

#pragma GCC push_options
#pragma GCC optimize("O3")

#include <stm32h7xx.h>

static inline void dwt_enable(void) {
    SET_BIT(CoreDebug->DEMCR, CoreDebug_DEMCR_TRCENA_Msk);
    SET_BIT(DWT->CTRL, DWT_CTRL_CYCCNTENA_Msk);
    DWT->CYCCNT = 0;
}

static inline void dwt_disable(void) {
    CLEAR_BIT(DWT->CTRL, DWT_CTRL_CYCCNTENA_Msk);
}

static inline void dwt_start(void) {
    DWT->CYCCNT = 0;
}

static inline uint32_t dwt_get_mcs(void) {
    return DWT->CYCCNT / (SystemCoreClock / 1000000);
}

static inline void dwt_delay_mcs(int mcs) {
    uint32_t cycles = SystemCoreClock / 1000000 * (uint32_t)mcs;
    DWT->CYCCNT = 0;
    while (DWT->CYCCNT < cycles) {
        __asm("nop");
    }
}

#pragma GCC pop_options

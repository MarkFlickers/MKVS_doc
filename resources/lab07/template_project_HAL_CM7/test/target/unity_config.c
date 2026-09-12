#include "unity_config.h"
#include <stdio.h>
#include <stm32h7xx.h>
#include <vterm.h>

// Блокирующая задержка с помощью счётчика DWT (Data Watchpoint and Trace unit)
static void delay(uint32_t ms) {
    uint32_t cycles = SystemCoreClock / 1000U * ms;
    // Счётчик тактов работает, только когда разрешён модуль трассировки
    CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
    DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
    DWT->CYCCNT = 0;
    while (DWT->CYCCNT < cycles) {
        __asm("nop");
    }
}

void unity_output_start(void) {
    vterm_init(115200);
    delay(1000);  // задержка для подготовки к приёму данных хост-компьютером
}

void unity_output_char(char ch) {
    putchar(ch);
}

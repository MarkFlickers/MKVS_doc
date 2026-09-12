#include "main.h"

void HardFault_Handler(void) {
    error_state(__func__);
}

void SysTick_Handler(void) {
    HAL_IncTick();
}

#pragma once

#include <stm32h7xx_hal.h>

/** Аварийное завершение: остановка программы в цикле мигания красным светодиодом */
void error_state(const char* msg) __attribute__((__noreturn__));

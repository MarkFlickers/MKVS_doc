#include <assert.h>
#include <stdio.h>
#include "error_state.h"

/** Обработка нарушения проверки assert() из стандартной библиотеки */
void __assert_func(const char* file, int line, const char* func, const char* failedexpr) {
    printf("\r\nAssertion \"%s\" failed in %s at %s:%d", failedexpr, func, file, line);
    error_state(NULL);
}

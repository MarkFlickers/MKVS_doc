---
title: "8. Приложение 2. Вспомогательные функции для HAL"
lab: 6
tags:
  - лабораторная-работа
  - cortex-m
  - stm32
  - hal
  - uart
  - dma
  - прерывания
  - platformio
---

Библиотека `nuc745_utils` собирает то, что нужно почти любой программе на базе [[glossary/hal-ll\|HAL]], но самой библиотекой HAL не предоставляется:

- `error_state()` — аварийное завершение программы: остановка в цикле мигания красным светодиодом с предварительным сообщением в терминал;
- `__assert_func()` — обработчик нарушения проверки `assert()` из стандартной библиотеки; на него же выведен и макрос `assert_param` библиотек HAL и LL;
- функции преобразования кодов возврата HAL в строки — с ними сообщение об ошибке читается глазами, а не расшифровывается по таблице;
- макрос `ASSERT_HAL_SATUS()` — проверка кода возврата функции HAL с аварийным завершением, если код отличен от `HAL_OK`.

Файлы библиотеки лежат в архиве с [[lab06/index#Файлы к работе\|файлами работы]]; здесь они приведены целиком. Там же, в `lib/nuc745_utils`, лежит и функция `boot_guard()` из [[lab05/index\|ЛР5]] — её листинги приведены в [[lab05/02-main\|основной части ЛР5]].

**Листинг 9: lib/nuc745_utils/error_state.h**

```c title="lib/nuc745_utils/error_state.h" showLineNumbers
#pragma once

#include <stm32h7xx_hal.h>

/** Аварийное завершение: остановка программы в цикле мигания красным светодиодом */
void error_state(const char* msg) __attribute__((__noreturn__));
```

**Листинг 10: lib/nuc745_utils/error_state.c**

```c title="lib/nuc745_utils/error_state.c" showLineNumbers
#include "error_state.h"
#include <led.h>
#include <stdio.h>
#include "stm32h7xx_ll_utils.h"

void error_state(const char* msg) {
    if (CoreDebug->DHCSR & CoreDebug_DHCSR_C_DEBUGEN_Msk) {
        __BKPT();  // если выполняется отладка, прерываемся здесь
    }
    if (msg) {
        puts(msg);
    }
    led_enable(led_red);
    LL_Init1msTick(SystemCoreClock);
    while (1) {
        led_toggle(led_red);
        LL_mDelay(250);
    }
}
```

**Листинг 11: lib/nuc745_utils/gcc_assert.c**

```c title="lib/nuc745_utils/gcc_assert.c" showLineNumbers
#include <assert.h>
#include <stdio.h>
#include "error_state.h"

/** Обработка нарушения проверки assert() из стандартной библиотеки */
void __assert_func(const char* file, int line, const char* func, const char* failedexpr) {
    printf("\r\nAssertion \"%s\" failed in %s at %s:%d", failedexpr, func, file, line);
    error_state(NULL);
}
```

**Листинг 12: lib/nuc745_utils/hal_helpers.h**

```c title="lib/nuc745_utils/hal_helpers.h" showLineNumbers
#pragma once

#include <stm32h7xx_hal.h>

#define ASSERT_HAL_SATUS(STATUS) assert_hal_status((STATUS), __FILE__, __LINE__)

/** Проверка статуса HAL с аварийным завершением в случае ошибки */
void assert_hal_status(HAL_StatusTypeDef status, const char* file, int line);

/** Преобразование кодов HAL в строку */

const char* hal_status_to_string(HAL_StatusTypeDef status);

const char* hal_uart_state_to_string(HAL_UART_StateTypeDef state);

const char* hal_uart_error_to_string(uint32_t error);
```

**Листинг 13: lib/nuc745_utils/hal_helpers.c**

```c title="lib/nuc745_utils/hal_helpers.c" showLineNumbers
#include "hal_helpers.h"
#include <stdio.h>
#include "error_state.h"

void assert_hal_status(HAL_StatusTypeDef status, const char* file, int line) {
    if (status != HAL_OK) {
        printf("\n\rHAL SATUS ERROR ON %s:%d: %s", file, line, hal_status_to_string(status));
        error_state(NULL);
    }
}

#define CASE(VAL) \
    case VAL:     \
        return #VAL
#define DEFUALT() \
    default:      \
        return "UNKNOWN"

const char* hal_status_to_string(HAL_StatusTypeDef status) {
    switch (status) {
        CASE(HAL_OK);
        CASE(HAL_TIMEOUT);
        CASE(HAL_BUSY);
        CASE(HAL_ERROR);
        DEFUALT();
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
        DEFUALT();
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
        DEFUALT();
    }
}
```

> [!note] Об именах в этой библиотеке
> Макрос называется `ASSERT_HAL_SATUS`, а не `ASSERT_HAL_STATUS` — это опечатка автора библиотеки. Здесь имя приведено ровно таким, какое оно в архиве с файлами работы: иначе код из пособия не собрался бы с библиотекой из шаблона проекта.

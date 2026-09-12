---
title: "7. Приложение 1. Загрузчик"
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

Это тот же [[glossary/bootloader\|загрузчик]], который разрабатывался в [[lab03/index\|ЛР3]], дополненный командой запуска второго ядра — **2 (Run CM4)**. Она понадобится в настоящей работе, чтобы вывести ядро Cortex-M4 из состояния ожидания и запустить хоккугенератор.

Загрузчик собирается отдельным окружением `bootloader` с фреймворком `cmsis` — библиотеки HAL и LL ему не нужны. Файлы лежат в архиве с [[lab06/index#Файлы к работе\|файлами работы]]; здесь они приведены целиком.

**Листинг 7: src/bootloader/dwt.h**

```c title="src/bootloader/dwt.h" showLineNumbers
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
```

**Листинг 8: src/bootloader/bootloader.c**

```c title="src/bootloader/bootloader.c" showLineNumbers
/**
 * @file bootloader.c
 * @author S.B. Simonov
 * @date 22.05.2026
 * Автозагрузчик приложения из AXI-SRAM с перехватом HardFault
 * и командой запуска ядра Cortex-M4
 */

#include <stdbool.h>
#include <stdio.h>
#include <stm32h7xx.h>
#include <led.h>
#include <vterm.h>
#include "dwt.h"

#define AXI_SRAM_BEGIN_ADDR 0x24000000
#define AXI_SRAM_END_ADDR 0x24080000
#define APP_BEGIN_ADDR 0x24000000
#define APP_STACK_ADDR 0x24080000
#define AUTOSTART_TIMEOUT_COUNTER 2500000
#define NO_KEYPRESSED UINT8_MAX
#define NUM_COMMANDS 3
#define IN_BOUNDS(BOTTOM, VAL, TOP) ((VAL) >= (BOTTOM) && (VAL) <= (TOP))

volatile uint32_t bootloader_SP = 0;

void HardFault_Handler(void);
bool check_app_is_valid(uint32_t iv_address, uint32_t sp_address, uint32_t ram_begin, uint32_t ram_end);
void do_BootSRAM(void);
void do_RunCM4(void);

/***************************** Boot Menu ************************************/

const char* menu_title =
    u8"\r\n\r\n Мини загрузчик"
    u8"\n\r┌──────────────────┬────────────┬──────────┐"
    u8"\n\r│ 1: Boot AXI-SRAM │ 2: Run CM4 │ 3: Reset │"
    u8"\n\r└──────────────────┴────────────┴──────────┘"
    u8"\n\r Выбор [1-3] > ";

void (*handlers[NUM_COMMANDS])(void) = {do_BootSRAM, do_RunCM4, NVIC_SystemReset};

uint8_t read_index(void) {
    uint8_t ch = vterm_keypressed();
    if (ch > 0) {
        putchar(ch);  // echo
        return ch - '1';
    }
    return NO_KEYPRESSED;
}

/***************************** Main Loop ************************************/

int main(void) {
    vterm_init(115200);
    dwt_enable();
    int led_index = 0;
    led_enable(led_all);
    bool ready_for_autoboot =
        check_app_is_valid(APP_BEGIN_ADDR, APP_STACK_ADDR, AXI_SRAM_BEGIN_ADDR, AXI_SRAM_END_ADDR);
    int autoboot_counter = 0;
    int autoboot_div5_counter = 0;
    puts(menu_title);
    for (uint8_t menu_index = NO_KEYPRESSED; true; menu_index = read_index()) {
        if (menu_index == NO_KEYPRESSED) {
            if (ready_for_autoboot) {
                // Обработка до первого нажатия клавиши
                if (++autoboot_counter == AUTOSTART_TIMEOUT_COUNTER) {
                    do_BootSRAM();
                } else if (autoboot_counter > AUTOSTART_TIMEOUT_COUNTER / 5 * autoboot_div5_counter) {
                    autoboot_div5_counter += 1;
                    printf(u8"\r Автозапуск AXI-SRAM: %d", 5 - autoboot_div5_counter);
                }
            }
        } else {
            // Обработка нажатия клавиши
            ready_for_autoboot = false;  // остановить автозагрузку
            if (menu_index < NUM_COMMANDS && handlers[menu_index]) {
                handlers[menu_index]();
            }
            puts(menu_title);
        }

        // Бегущий огонь: признак того, что загрузчик жив
        if (dwt_get_mcs() > 50000) {
            dwt_start();
            led_off(1 << led_index);
            led_index = (led_index + 1) % 3;
            led_on(1 << led_index);
        }
    }  // for
    return 0;
}

/****************************************************************************/

bool check_app_is_valid(uint32_t iv_address, uint32_t sp_address, uint32_t ram_begin, uint32_t ram_end) {
    const uint32_t* app_IV = (uint32_t*)(iv_address);
    return (app_IV[0] == sp_address) && IN_BOUNDS(ram_begin, sp_address, ram_end) &&
           IN_BOUNDS(ram_begin, app_IV[1], ram_end);
}

void do_RunCM4(void) {
    SET_BIT(RCC->GCR, RCC_GCR_BOOT_C2);
}

void do_BootSRAM(void) {
    if (!check_app_is_valid(APP_BEGIN_ADDR, APP_STACK_ADDR, AXI_SRAM_BEGIN_ADDR, AXI_SRAM_END_ADDR)) {
        printf(u8"\n Приложение AXI-SRAM не найдено по адресу 0x%08x\n", (unsigned int)APP_BEGIN_ADDR);
        NVIC_SystemReset();
    }
    led_off(led_all);
    led_disable(led_all);
    const uint32_t* app_IV = (uint32_t*)APP_BEGIN_ADDR;
    uint32_t app_end_stack = app_IV[0];
    void* app_entry = (void*)app_IV[1];
    printf(u8"\r\n Запуск приложения по адресу %p...\n\n", app_entry);
    bootloader_SP = __get_MSP();
    __disable_irq();
    __set_MSP(app_end_stack);
    SCB->VTOR = (uint32_t)app_IV;
    NVIC_SetVector(HardFault_IRQn, (uint32_t)HardFault_Handler);
    __DSB();
    __ISB();
    __ASM volatile("bx %0" ::"r"(app_entry));
    while (1) {
    }
}

/***************************** HardFault_Handler() **************************/

static void error_state(void) {
    led_enable(led_all);
    led_off(led_all);
    dwt_enable();
    while (1) {
        led_toggle(led_red);
        dwt_delay_mcs(100000);
    }
}

void HardFault_Handler(void) {
    if (bootloader_SP) {
        __set_MSP(bootloader_SP);
        vterm_init(115200);
        printf("\r\nApplication HardFault exception; SCB->VTOR=%p\r\n", (void*)SCB->VTOR);
    } else {
        puts("\r\nBootloader HardFault exception\r\n");
    }
    error_state();
}
```

/**
 * @file bootloader.c
 * Автозагрузчик приложений из AXI-SRAM с перехватом HardFault.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stm32h7xx.h>
#include <vterm.h>

#define APP_SRAM_OFFSET 0x24000000
#define APP_SRAM_ESTACK 0x24080000
#define AUTOSTART_TIMEOUT_COUNTER 5000000
#define NO_KEYPRESSED UINT8_MAX
#define NUM_COMMANDS 6

uint32_t bootloader_SP = 0;
void HardFault_Handler(void);
bool check_app_in_ram_is_valid(void);
void do_BootSRAM(void);

/***************************** Boot Menu ************************************/

static const char* gc_help_msg =
    u8"\n\r┌────────────┬────────────┬───────────┬────────────┬────────────┬──────────┐"
    u8"\n\r│ 1:BootSRAM │ 2:         │ 3:        │ 4:         │ 5:         │ 6: Reset │"
    u8"\n\r└────────────┴────────────┴───────────┴────────────┴────────────┴──────────┘"
    u8"\n\r Выбор [1-6] > ";

typedef void (*handler_func_t)(void);
handler_func_t handlers[NUM_COMMANDS] = {do_BootSRAM, NULL, NULL, NULL, NULL, NVIC_SystemReset};

uint8_t read_index(void) {
    uint8_t ch = vterm_keypressed();
    if (ch > 0) {
        putchar(ch);  // echo
        uint8_t idx = ch - '1';
        return idx;
    }
    return NO_KEYPRESSED;
}

/***************************** Main Loop ************************************/

int main(void) {
    vterm_init(115200);
    bool valid_app = check_app_in_ram_is_valid();
    int autostart_counter = 0;
    int autostart_div10_counter = 0;
    printf("\n\n\r\n Welcome to bootloader! %s", gc_help_msg);
    for (uint8_t menu_index = NO_KEYPRESSED;; menu_index = read_index()) {
        if (menu_index == NO_KEYPRESSED) {
            if (!valid_app) {
                continue;
            }
            // Обработка до первого нажатия клавиши
            if (++autostart_counter == AUTOSTART_TIMEOUT_COUNTER) {
                do_BootSRAM();
            } else if (autostart_counter > AUTOSTART_TIMEOUT_COUNTER / 10 * autostart_div10_counter) {
                autostart_div10_counter += 1;
                printf(u8"\rНажмите любую клавишу чтобы прервать автозагрузку AXI-SRAM  %d",
                       10 - autostart_div10_counter);
            }
        } else {
            // Обработка нажатия клавиши
            valid_app = false;  // stop auto boot
            if (menu_index < NUM_COMMANDS && handlers[menu_index]) {
                handlers[menu_index]();
            }
            printf("\r\n Welcome to bootloader! %s", gc_help_msg);
        }
    }  // for
    return 0;
}

/*****************************************************************************/

bool check_app_in_ram_is_valid(void) {
    const uint32_t* app_IV = (uint32_t*)(APP_SRAM_OFFSET);
    return (app_IV[0] == APP_SRAM_ESTACK && app_IV[1] < APP_SRAM_ESTACK && app_IV[1] > APP_SRAM_OFFSET);
}

void do_BootSRAM(void) {
    if (!check_app_in_ram_is_valid()) {
        printf("\n No valid application in AXI-SRAM at 0x%08x found!\n", (unsigned int)APP_SRAM_OFFSET);
        return;
    }
    printf("\r\n Jumping to AXI-SRAM application at 0x%08x....\n", (unsigned int)APP_SRAM_OFFSET);
    const uint32_t* app_IV = (uint32_t*)(APP_SRAM_OFFSET);
    uint32_t app_end_stack = (*((uint32_t*)(app_IV)));
    void* app_entry = (void*)(*((uint32_t*)(APP_SRAM_OFFSET + 4)));
    bootloader_SP = __get_MSP();
    __disable_irq();
    __set_MSP(app_end_stack);
    SCB->VTOR = (uint32_t)app_IV;
    NVIC_SetVector(HardFault_IRQn, (uint32_t)HardFault_Handler);
    SCB_CleanDCache();
    SCB_InvalidateICache();
    __ASM volatile("bx %0" ::"r"(app_entry));
    while (1) {
    }
}

/***************************** HardFault_Handler() ************************************/

void HardFault_Handler(void) {
    if (bootloader_SP) {
        __set_MSP(bootloader_SP);
        bootloader_SP = 0;
        vterm_init(115200);
        printf("\r\nApplication HardFault exception; SCB->VTOR=%p\r\n", (void*)SCB->VTOR);
    } else {
        puts("\r\nBootloader HardFault exception\r\n");
    }
    NVIC_SystemReset();
}

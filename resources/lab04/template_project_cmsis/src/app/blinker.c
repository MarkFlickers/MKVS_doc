#include <stm32h7xx.h>  // основной заголовочный файл CMSIS для МК серии H7
#include <led.h>
#include <vterm.h>
#include <stdio.h>

__attribute__((optimize("-O0")))  // директива отключает оптимизацию кода компилятором для этой функции
static void delay(int ms) {
    volatile int counter = SystemCoreClock / 1000 / 6 * ms;
    while (counter > 0) {
        counter -= 1;
    }
}

void HardFault_Handler(void) {
    puts("Hard fault in blinker!");
    while (1) {
    }
}

int main(void) {
    vterm_init(115200);
    printf("\n App PRIMASK %lu", __get_PRIMASK());
    printf("\n App BASEPRI %lu", __get_BASEPRI());
    SystemCoreClockUpdate();
    printf("\nClock %lu", SystemCoreClock);

    led_enable(led_all);
    while (1) {
        led_toggle(led_green);
        delay(500);
    }
}

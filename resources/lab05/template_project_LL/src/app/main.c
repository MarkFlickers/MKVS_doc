#include <led.h>
#include <stm32h7xx.h>
#include <stm32h7xx_ll_utils.h>

int main(void) {
    __enable_irq();
    led_enable(led_green);
    SystemCoreClockUpdate();
    LL_Init1msTick(SystemCoreClock);
    while (1) {
        led_toggle(led_green);
        LL_mDelay(500);
    }
    return 0;
}

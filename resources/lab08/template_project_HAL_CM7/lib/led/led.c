/**
 * @file led.c
 * @author S.B. Simonov
 * @brief Управление светодиодами на NucleoH745
 * @note LD1 (зелёный) - PB0, LD2 (жёлтый) - PE1, LD3 (красный) - PB14
 */

#include <led.h>
#include <stm32h7xx.h>

#define TOGGLE_BIT(REG, MASK) ((REG) ^= (MASK))

#define led_gnpn_enable(GN, PN)                                                          \
    do {                                                                                 \
        SET_BIT(RCC->AHB4ENR, RCC_AHB4ENR_GPIO##GN##EN);                                 \
        MODIFY_REG(GPIO##GN->MODER, GPIO_MODER_MODE##PN##_Msk, GPIO_MODER_MODE##PN##_0); \
    } while (0)

#define led_gnpn_on(GN, PN) SET_BIT(GPIO##GN->BSRR, GPIO_BSRR_BS##PN)
#define led_gnpn_off(GN, PN) SET_BIT(GPIO##GN->BSRR, GPIO_BSRR_BR##PN)
#define led_gnpn_toggle(GN, PN) TOGGLE_BIT(GPIO##GN->ODR, GPIO_ODR_OD##PN)
#define led_gnpn_disable(GN, PN)                              \
    MODIFY_REG(GPIO##GN->MODER, GPIO_MODER_MODE##PN##_Msk,    \
               GPIO_MODER_MODE##PN##_0 | GPIO_MODER_MODE##PN##_1)

// Макросы для автоматической генерации функций led_suffix
#define GNPN_CALL(SUFFIX, GN, PN) led_gnpn_##SUFFIX(GN, PN)
#define LED_FUNC(SUFFIX)              \
    void led_##SUFFIX(led_t led) {    \
        if (led & led_red) {          \
            GNPN_CALL(SUFFIX, B, 14); \
        }                             \
        if (led & led_yellow) {       \
            GNPN_CALL(SUFFIX, E, 1);  \
        }                             \
        if (led & led_green) {        \
            GNPN_CALL(SUFFIX, B, 0);  \
        }                             \
    }

// Определение функций led_suffix
LED_FUNC(enable)
LED_FUNC(toggle)
LED_FUNC(on)
LED_FUNC(off)
LED_FUNC(disable)

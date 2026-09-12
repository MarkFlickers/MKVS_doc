#include <stm32h7xx.h>
#include <systim.h>
#include <unity.h>

#define CYCLES_PER_MCS 64  // тактов в микросекунде при Core Clock 64 МГц

#pragma GCC push_options
#pragma GCC optimize("O3")

static inline void dwt_enable(void) {
    SET_BIT(CoreDebug->DEMCR, CoreDebug_DEMCR_TRCENA_Msk);
    SET_BIT(DWT->CTRL, DWT_CTRL_CYCCNTENA_Msk);
}
static inline void dwt_disable(void) {
    CLEAR_BIT(DWT->CTRL, DWT_CTRL_CYCCNTENA_Msk);
}
static inline void dwt_start(void) {
    DWT->CYCCNT = 0;
}
static inline uint32_t dwt_get_mcs(void) {
    return DWT->CYCCNT / CYCLES_PER_MCS;
}

static inline void dwt_delay_mcs(uint32_t mcs) {
    uint32_t cycles = CYCLES_PER_MCS * mcs;
    DWT->CYCCNT = 0;
    while (DWT->CYCCNT < cycles)
        __asm("nop");
}
#pragma GCC pop_options

void SysTick_Handler(void) {
    systim_isr();
}

void setUp(void) {
    dwt_enable();
    systim_init(SystemCoreClock);
}

void tearDown(void) {
    dwt_disable();
}

void test_systim_current_ms(void) {
    uint32_t t1 = systim_current_ms();
    dwt_delay_mcs(1000);
    uint32_t t2 = systim_current_ms();
    uint32_t diff = t2 - t1;
    // за 1 мс счётчик пересекает одну границу тика, с учётом накладных расходов - две
    TEST_ASSERT_GREATER_OR_EQUAL_UINT32_MESSAGE(1, diff, " on 1 ms increment test");
    TEST_ASSERT_LESS_OR_EQUAL_UINT32_MESSAGE(2, diff, " on 1 ms increment test");
}

void test_systim_elapsed_ms_at_once(void) {
    uint32_t from = systim_current_ms();
    uint32_t t2 = systim_elapsed_ms(from);
    TEST_ASSERT_EQUAL(0, t2);
}

void test_systim_elapsed_ms_some_time(void) {
    const uint32_t target_time = 93;
    uint32_t from = systim_current_ms();
    dwt_delay_mcs(target_time * 1000);
    uint32_t t2 = systim_elapsed_ms(from);
    // измерение не должно быть меньше выдержанного времени, ошибка - не больше 1 мс
    TEST_ASSERT_GREATER_OR_EQUAL_UINT32(target_time, t2);
    TEST_ASSERT_LESS_OR_EQUAL_UINT32(target_time + 1, t2);
}


void test_systim_delay_ms_some_time(void) {
    const uint32_t target_time = 13;
    uint32_t t1 = dwt_get_mcs();
    systim_delay_ms(target_time);
    uint32_t t2 = dwt_get_mcs();
    uint32_t diff = (t2 - t1) / 1000;
    // задержка не должна быть меньше, чем требовалось
    TEST_ASSERT_GREATER_OR_EQUAL(target_time, diff);
    //  ошибка должна быть меньше 2 мс
    TEST_ASSERT_LESS_THAN_UINT32(target_time + 2, diff);
}


void test_systim_delay_ms_zero_time(void) {
    uint32_t t1 = dwt_get_mcs();
    systim_delay_ms(0);
    uint32_t t2 = dwt_get_mcs();
    uint32_t diff = t2 - t1;
    // ожидаем, что функция вернётся мгновенно - быстрее чем за 10 мкс
    TEST_ASSERT_LESS_THAN_UINT32(10, diff);
}

void test_systim_delay_mcs_some_time(void) {
    const uint32_t target_time = 49;
    for (int i = 0; i < 5; i++) {
        uint32_t t1 = dwt_get_mcs();
        systim_delay_mcs(target_time);
        uint32_t t2 = dwt_get_mcs();
        uint32_t diff = (t2 - t1);
        // задержка не должна быть меньше, чем требовалось
        TEST_ASSERT_GREATER_OR_EQUAL(target_time, diff);
        //  погрешность не должна быть выше 50 мкс (с учётом вызовов функций тестирования)
        TEST_ASSERT_LESS_THAN_UINT32(target_time + 10 + 50, diff);
    }
}

void test_systim_delay_mcs_zero_time(void) {
    uint32_t t1 = dwt_get_mcs();
    systim_delay_mcs(0);
    uint32_t t2 = dwt_get_mcs();
    uint32_t diff = t2 - t1;
    // ожидаем, что функция вернётся мгновенно - быстрее чем за 10 мкс
    TEST_ASSERT_LESS_THAN_UINT32(10, diff);
}

void test_systim_delay_ms_huge_time(void) {
    dwt_delay_mcs(20000);
    systim_delay_ms(0xFFFFFFF0);
    TEST_FAIL_MESSAGE("Huge time waiting - we must not be there");
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_systim_current_ms);

    RUN_TEST(test_systim_elapsed_ms_at_once);
    RUN_TEST(test_systim_elapsed_ms_some_time);

    RUN_TEST(test_systim_delay_ms_some_time);
    RUN_TEST(test_systim_delay_ms_zero_time);

    RUN_TEST(test_systim_delay_mcs_some_time);
    RUN_TEST(test_systim_delay_mcs_zero_time);

    RUN_TEST(test_systim_delay_ms_huge_time);

    return UNITY_END();
}

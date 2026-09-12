#ifndef __STM32_ASSERT_H
#define __STM32_ASSERT_H

#ifdef __cplusplus
extern "C" {
#endif

#ifdef USE_FULL_ASSERT
#include <assert.h>
#define assert_param(expr) \
  ((expr) ? (void)0U : __assert_func(__FILE__, __LINE__, __ASSERT_FUNC, #expr))
#else
#define assert_param(expr) ((void)0U)
#endif /* USE_FULL_ASSERT */

#ifdef __cplusplus
}
#endif

#endif /* __STM32_ASSERT_H */

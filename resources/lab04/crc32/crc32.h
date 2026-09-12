#pragma once
#include <stdint.h>

uint32_t calculate_CRC32_SW(const uint8_t *pData, uint32_t DataLength);
uint32_t calculate_CRC32_HW_8bit(const uint8_t *pData, uint32_t DataLength);
uint32_t calculate_CRC32_HW_32bit(const uint8_t *pData, uint32_t DataLength);

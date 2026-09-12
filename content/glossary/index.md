---
title: Глоссарий
cssclasses:
  - glossary-list
tags:
  - глоссарий
---

Термины, инструменты и сокращения, которые встречаются в лабораторных работах.

Ниже они сгруппированы по темам, а расшифровки сокращений собраны отдельным списком в разделе [Аббревиатуры](#аббревиатуры).

В текстах работ такие термины подчёркнуты пунктиром: <span class="glossary-demo">CMSIS</span>. Наведите на них указатель мыши — появится пояснение. Если пояснение умещается в одно-два предложения, оно показывается строкой; если термину посвящена целая статья, открывается листаемое мини-окошко с её содержимым. Щелчок по термину открывает статью целиком.

> [!note] Как устроен глоссарий
> Каждый термин — отдельная страница. Её первый абзац является определением и служит короткой подсказкой; всё, что идёт после первого абзаца, попадает в листаемое мини-окошко.
>
> В тексте лабораторной работы термин отмечается ссылкой при первом упоминании в разделе. Повторные упоминания не подчёркиваются, чтобы не мешать чтению.


## Среда разработки

- [[glossary/platformio\|PlatformIO]]
- [[glossary/vscode\|Visual Studio Code]]
- [[glossary/command-palette\|Палитра команд]]
- [[glossary/verbose\|Режим подробного вывода]]
- [[glossary/static-library\|Статическая библиотека]]
- [[glossary/status-bar\|Строка состояния]]
- [[glossary/framework\|Фреймворк]]


## Сборка программы

- [[glossary/elf\|ELF]]
- [[glossary/gcc\|GCC]]
- [[glossary/newlib\|Newlib]]
- [[glossary/startup-file\|Startup-файл]]
- [[glossary/system-file\|System-файл]]
- [[glossary/linker\|Компоновщик]]
- [[glossary/sections\|Секции программы]]
- [[glossary/linker-script\|Скрипт компоновщика]]
- [[glossary/weak-symbol\|Слабый символ]]
- [[glossary/isr-vector\|Таблица векторов прерываний]]


## Тестирование и качество кода

- [[glossary/clang-tidy\|Clang-Tidy]]
- [[glossary/cppcheck\|Cppcheck]]
- [[glossary/doxygen\|Doxygen]]
- [[glossary/misra-c\|MISRA C]]
- [[glossary/pvs-studio\|PVS-Studio]]
- [[glossary/unity\|Unity]]
- [[glossary/gost-56939\|ГОСТ Р 56939]]
- [[glossary/gost-71207\|ГОСТ Р 71207–2024]]
- [[glossary/unit-testing\|Модульное тестирование]]
- [[glossary/ub\|Неопределённое поведение (UB)]]
- [[glossary/static-analysis\|Статический анализ кода]]
- [[glossary/host-target\|Хост-компьютер и целевое устройство]]


## Отладка

- [[glossary/gdb\|GDB]]
- [[glossary/endianness\|Порядок байтов]]
- [[glossary/breakpoint\|Точка останова]]


## Микроконтроллер и отладочная плата

- [[glossary/axi-sram\|AXI-SRAM]]
- [[glossary/cmsis\|CMSIS]]
- [[glossary/cortex-m\|Cortex-M]]
- [[glossary/dma\|DMA]]
- [[glossary/dwt\|DWT]]
- [[glossary/fpu\|FPU]]
- [[glossary/gpio\|GPIO]]
- [[glossary/hse\|HSE, HSI, CSI]]
- [[glossary/msp\|MSP]]
- [[glossary/hal-msp\|MSP в библиотеке HAL]]
- [[glossary/nucleo-h745\|NUCLEO-H745ZI-Q]]
- [[glossary/push-pull\|Push-Pull и Open Drain]]
- [[glossary/rcc\|RCC]]
- [[glossary/spi\|SPI]]
- [[glossary/st-link\|ST-Link V3]]
- [[glossary/stm32h745\|STM32H745ZI-Q]]
- [[glossary/system-core-clock\|SystemCoreClock]]
- [[glossary/usart\|USART]]
- [[glossary/hal-ll\|Библиотеки HAL и LL]]


## Внешние устройства и сигналы

- [[glossary/hc-sr04\|HC-SR04]]
- [[glossary/ili9488\|ILI9488]]
- [[glossary/pwm\|ШИМ]]
- [[glossary/debounce\|Дребезг контактов]]
- [[glossary/rotary-encoder\|Поворотный энкодер]]


## Таймеры и многозадачность

- [[glossary/hardware-timer\|Аппаратный таймер]]
- [[glossary/cooperative-scheduler\|Кооперативный планировщик]]
- [[glossary/software-timer\|Программный таймер]]
- [[glossary/profiling\|Профилирование]]
- [[glossary/input-capture\|Режим захвата]]
- [[glossary/output-compare\|Режим сравнения-вывода]]
- [[glossary/sleep-mode\|Режимы сна и инструкции WFI, WFE]]
- [[glossary/systick\|Системный таймер SysTick]]
- [[glossary/iwdg\|Сторожевой таймер IWDG]]
- [[glossary/superloop\|Суперцикл]]


## Операционные системы реального времени

- [[glossary/cmsis-rtos\|CMSIS-RTOS]]
- [[glossary/freertos\|FreeRTOS]]
- [[glossary/tcb\|Блок управления потоком (TCB)]]
- [[glossary/preemptive-scheduler\|Вытесняющий планировщик]]
- [[glossary/critical-section\|Критическая секция]]
- [[glossary/heap\|Куча]]
- [[glossary/mutex\|Мьютекс]]
- [[glossary/rtos\|ОСРВ]]
- [[glossary/deferred-interrupt\|Отложенная обработка прерываний]]
- [[glossary/message-queue\|Очередь сообщений]]
- [[glossary/context-switch\|Переключение контекста]]
- [[glossary/semaphore\|Семафор]]
- [[glossary/race-condition\|Состояние гонки]]


## Исключения, прерывания и загрузка

- [[glossary/exti\|EXTI]]
- [[glossary/isr\|ISR]]
- [[glossary/nvic\|NVIC]]
- [[glossary/scb\|SCB]]
- [[glossary/priority-grouping\|Группировка приоритетов]]
- [[glossary/bootloader\|Загрузчик]]
- [[glossary/exception\|Исключение]]
- [[glossary/fault\|Исключения ошибок]]
- [[glossary/exception-frame\|Кадр исключения]]
- [[glossary/interrupt-masking\|Маскирование прерываний]]
- [[glossary/interrupt\|Прерывание]]
- [[glossary/reentrancy\|Реентерабельность]]


## Семихостинг и ввод-вывод

- [[glossary/rtt\|Real Time Transfer (RTT)]]
- [[glossary/serial-monitor\|Serial Monitor]]
- [[glossary/swv\|Serial Wire View (SWV)]]
- [[glossary/vterm\|Библиотека vterm]]
- [[glossary/semihosting\|Семихостинг]]


## Аббревиатуры

Сокращения, которые встречаются в текстах работ. Те, которым посвящена
отдельная статья, — ссылки; для остальных здесь дана только расшифровка.

| Сокращение | Расшифровка | Перевод |
| --- | --- | --- |
| AHB | Advanced High-performance Bus | высокопроизводительная шина семейства AMBA |
| API | Application Programming Interface | программный интерфейс |
| AXI | Advanced eXtensible Interface | высокопроизводительная шина семейства AMBA |
| CDC | Communication Device Class | класс коммуникационных устройств (USB) |
| CLI | Command Line Interface | интерфейс командной строки |
| [[glossary/cmsis\|CMSIS]] | Cortex Microcontroller Software Interface Standard | стандарт программного интерфейса микроконтроллеров Cortex-M |
| CRC | Cyclic Redundancy Check | циклический избыточный код (контрольная сумма) |
| DRY | Don't Repeat Yourself | «не повторяйся» — принцип разработки |
| [[glossary/dma\|DMA]] | Direct Memory Access | прямой доступ к памяти |
| DSP | Digital Signal Processing | цифровая обработка сигналов |
| [[glossary/dwt\|DWT]] | Data Watchpoint and Trace | блок точек останова по данным и трассировки |
| EABI | Embedded Application Binary Interface | двоичный интерфейс приложений для встраиваемых систем |
| [[glossary/elf\|ELF]] | Executable and Linkable Format | формат исполняемых и объектных файлов |
| [[glossary/exti\|EXTI]] | Extended Interrupt and Event Controller | контроллер внешних прерываний и событий |
| [[glossary/fpu\|FPU]] | Floating Point Unit | блок операций с плавающей точкой |
| [[glossary/gcc\|GCC]] | GNU Compiler Collection | набор компиляторов GNU |
| [[glossary/gdb\|GDB]] | GNU Debugger | отладчик GNU |
| [[glossary/gpio\|GPIO]] | General-Purpose Input/Output | порты ввода-вывода общего назначения |
| [[glossary/hal-ll\|HAL]] | Hardware Abstraction Layer | библиотека аппаратной абстракции STM32Cube |
| HCLK | AHB Clock | тактовый сигнал шины AHB и процессорного ядра |
| [[glossary/hse\|HSE]] | High Speed External | внешний высокочастотный генератор тактовых импульсов |
| [[glossary/hse\|HSI]] | High Speed Internal | внутренний высокочастотный генератор тактовых импульсов |
| IDE | Integrated Development Environment | интегрированная среда разработки |
| [[glossary/isr\|ISR]] | Interrupt Service Routine | функция-обработчик прерывания |
| [[glossary/iwdg\|IWDG]] | Independent Watchdog | независимый сторожевой таймер |
| KISS | Keep It Simple, Stupid | «делай проще» — принцип разработки |
| [[glossary/hal-ll\|LL]] | Low-Layer | низкоуровневая библиотека STM32Cube |
| LR | Link Register | регистр связи (хранит адрес возврата) |
| LSI | Low Speed Internal | внутренний низкочастотный генератор тактовых импульсов |
| [[glossary/misra-c\|MISRA]] | Motor Industry Software Reliability Association | объединение, выпустившее стандарт MISRA C |
| MPU | Memory Protection Unit | блок защиты памяти |
| [[glossary/msp\|MSP]] | Main Stack Pointer | основной указатель стека |
| [[glossary/hal-msp\|MSP]] | MCU Support Package | слой низкоуровневой инициализации ресурсов в HAL |
| NMI | Non-Maskable Interrupt | немаскируемое прерывание |
| NN | Neural Network | нейронная сеть |
| [[glossary/nvic\|NVIC]] | Nested Vectored Interrupt Controller | контроллер вложенных векторных прерываний |
| PC | Program Counter | счётчик команд |
| PSR | Program Status Register | регистр состояния программы |
| [[glossary/pwm\|PWM]] | Pulse-Width Modulation | широтно-импульсная модуляция (ШИМ) |
| RAM | Random Access Memory | оперативная память |
| [[glossary/rcc\|RCC]] | Reset and Clock Control | блок сброса и тактирования |
| [[glossary/rtos\|RTOS]] | Real-Time Operating System | операционная система реального времени (ОСРВ) |
| [[glossary/rtt\|RTT]] | Real Time Transfer | обмен данными с хост-компьютером через буферы в ОЗУ |
| [[glossary/scb\|SCB]] | System Control Block | блок управления системой |
| SDK | Software Development Kit | комплект средств разработки |
| SIMD | Single Instruction, Multiple Data | «одна инструкция — много данных» |
| SP | Stack Pointer | указатель стека |
| [[glossary/spi\|SPI]] | Serial Peripheral Interface | последовательный периферийный интерфейс |
| SRAM | Static Random Access Memory | статическая оперативная память |
| SVD | System View Description | машиночитаемое описание периферии |
| SWD | Serial Wire Debug | двухпроводной интерфейс отладки |
| SWO | Serial Wire Output | линия вывода трассировки интерфейса SWD |
| [[glossary/swv\|SWV]] | Serial Wire View | трассировка по линии SWO |
| SYSCFG | System Configuration Controller | блок системной конфигурации |
| [[glossary/tcb\|TCB]] | Thread Control Block | блок управления потоком |
| UART | Universal Asynchronous Receiver-Transmitter | универсальный асинхронный приёмопередатчик |
| [[glossary/ub\|UB]] | Undefined Behavior | неопределённое поведение |
| [[glossary/usart\|USART]] | Universal Synchronous/Asynchronous Receiver-Transmitter | универсальный синхронно-асинхронный приёмопередатчик |
| USB | Universal Serial Bus | универсальная последовательная шина |
| VTOR | Vector Table Offset Register | регистр адреса таблицы векторов прерываний |

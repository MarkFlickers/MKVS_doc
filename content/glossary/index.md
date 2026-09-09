---
title: Глоссарий
date: 2026-09-09
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

- [[glossary/cmsis\|CMSIS]]
- [[glossary/cortex-m\|Cortex-M]]
- [[glossary/dwt\|DWT]]
- [[glossary/gpio\|GPIO]]
- [[glossary/hse\|HSE, HSI, CSI]]
- [[glossary/nucleo-h745\|NUCLEO-H745ZI-Q]]
- [[glossary/push-pull\|Push-Pull и Open Drain]]
- [[glossary/rcc\|RCC]]
- [[glossary/st-link\|ST-Link V3]]
- [[glossary/stm32h745\|STM32H745ZI-Q]]
- [[glossary/system-core-clock\|SystemCoreClock]]
- [[glossary/usart\|USART]]
- [[glossary/superloop\|Суперцикл]]


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
| API | Application Programming Interface | программный интерфейс |
| CDC | Communication Device Class | класс коммуникационных устройств (USB) |
| CLI | Command Line Interface | интерфейс командной строки |
| [[glossary/cmsis\|CMSIS]] | Cortex Microcontroller Software Interface Standard | стандарт программного интерфейса микроконтроллеров Cortex-M |
| DRY | Don't Repeat Yourself | «не повторяйся» — принцип разработки |
| DSP | Digital Signal Processing | цифровая обработка сигналов |
| [[glossary/dwt\|DWT]] | Data Watchpoint and Trace | блок точек останова по данным и трассировки |
| [[glossary/elf\|ELF]] | Executable and Linkable Format | формат исполняемых и объектных файлов |
| [[glossary/gcc\|GCC]] | GNU Compiler Collection | набор компиляторов GNU |
| [[glossary/gdb\|GDB]] | GNU Debugger | отладчик GNU |
| [[glossary/gpio\|GPIO]] | General-Purpose Input/Output | порты ввода-вывода общего назначения |
| [[glossary/hse\|HSE]] | High Speed External | внешний высокочастотный генератор тактовых импульсов |
| [[glossary/hse\|HSI]] | High Speed Internal | внутренний высокочастотный генератор тактовых импульсов |
| IDE | Integrated Development Environment | интегрированная среда разработки |
| KISS | Keep It Simple, Stupid | «делай проще» — принцип разработки |
| [[glossary/misra-c\|MISRA]] | Motor Industry Software Reliability Association | объединение, выпустившее стандарт MISRA C |
| NN | Neural Network | нейронная сеть |
| RAM | Random Access Memory | оперативная память |
| [[glossary/rcc\|RCC]] | Reset and Clock Control | блок сброса и тактирования |
| RTOS | Real-Time Operating System | операционная система реального времени (ОСРВ) |
| [[glossary/rtt\|RTT]] | Real Time Transfer | обмен данными с хост-компьютером через буферы в ОЗУ |
| SIMD | Single Instruction, Multiple Data | «одна инструкция — много данных» |
| SP | Stack Pointer | указатель стека |
| SRAM | Static Random Access Memory | статическая оперативная память |
| SVD | System View Description | машиночитаемое описание периферии |
| SWD | Serial Wire Debug | двухпроводной интерфейс отладки |
| SWO | Serial Wire Output | линия вывода трассировки интерфейса SWD |
| [[glossary/swv\|SWV]] | Serial Wire View | трассировка по линии SWO |
| UART | Universal Asynchronous Receiver-Transmitter | универсальный асинхронный приёмопередатчик |
| [[glossary/ub\|UB]] | Undefined Behavior | неопределённое поведение |
| [[glossary/usart\|USART]] | Universal Synchronous/Asynchronous Receiver-Transmitter | универсальный синхронно-асинхронный приёмопередатчик |
| USB | Universal Serial Bus | универсальная последовательная шина |

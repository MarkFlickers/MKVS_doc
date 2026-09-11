---
title: Документация
tags:
  - документация
  - stm32
---

Техническая документация, с которой ведётся работа в лабораторных работах: reference manuals, даташиты, программные модели ядер, руководства на отладочную плату и модули расширения, а также руководства по инструментам разработки и стандартам качества кода.

Все документы хранятся в репозитории и открываются прямо в браузере — скачивать их и искать нужный раздел вручную не требуется.

> [!note] Ссылки ведут на конкретную страницу
> Рядом с каждым документом собраны быстрые переходы вида «12 GPIO». Такая ссылка открывает PDF сразу на нужной странице, а не в начале.

## Микроконтроллер STM32H745

### RM0399 — Reference Manual

[Открыть PDF](docs/rm0399-stm32h745.pdf) · Rev 4 · 3556 с. · 67,4 МБ

Архитектура микроконтроллера, карта памяти, описание всех периферийных блоков и их регистров. Основной документ при программировании периферии: именно здесь смотрят назначение битовых полей.

Быстрый переход: [2 Memory and bus architecture](docs/rm0399-stm32h745.pdf#page=108) · [2.3 Memory organization](docs/rm0399-stm32h745.pdf#page=134) · [2.4 Embedded SRAM](docs/rm0399-stm32h745.pdf#page=142) · [4 Embedded flash memory](docs/rm0399-stm32h745.pdf#page=154) · [7 Power control (PWR)](docs/rm0399-stm32h745.pdf#page=268) · [9 Reset and Clock Control (RCC)](docs/rm0399-stm32h745.pdf#page=351) · [9.7 RCC registers](docs/rm0399-stm32h745.pdf#page=414) · [12 General-purpose I/Os (GPIO)](docs/rm0399-stm32h745.pdf#page=568) · [12.4 GPIO registers](docs/rm0399-stm32h745.pdf#page=578) · [13 System configuration controller (SYSCFG)](docs/rm0399-stm32h745.pdf#page=586) · [13.3.2 SYSCFG_EXTICR1](docs/rm0399-stm32h745.pdf#page=589) · [21 Extended interrupt and event controller (EXTI)](docs/rm0399-stm32h745.pdf#page=797) · [48 Independent watchdog (IWDG)](docs/rm0399-stm32h745.pdf#page=2047)

Применяется в: [[lab02/index\|ЛР2]] · [[lab03/index\|ЛР3]] · [[lab04/index\|ЛР4]] · [[lab05/index\|ЛР5]]

> [!warning] Документ имеет большой размер
> Его веб-версия может долго открываться.<br>
> Рекомендуется скачать документ и открывать локальную копию.

### DS12923 — Datasheet

[Открыть PDF](docs/ds12923-stm32h745zi.pdf) · Rev 2 · 249 с. · 15,0 МБ

Общие сведения о микроконтроллере STM32H745xI/G: состав периферии, назначение выводов, корпуса, электрические и временные характеристики. Документ, с которого начинают выбор и подключение МК.

Быстрый переход: [2 Description](docs/ds12923-stm32h745zi.pdf#page=14) · [3 Functional overview](docs/ds12923-stm32h745zi.pdf#page=21) · [4 Memory mapping](docs/ds12923-stm32h745zi.pdf#page=53) · [5 Pin descriptions](docs/ds12923-stm32h745zi.pdf#page=54) · [6 Electrical characteristics](docs/ds12923-stm32h745zi.pdf#page=103)

### ES0445 — Errata Sheet

[Открыть PDF](docs/es0445-stm32h757xi.pdf) · Rev 6 · 57 с. · 2,5 МБ

Аппаратные ошибки микроконтроллера и рекомендации по их обходу. Сюда стоит заглянуть, когда периферия ведёт себя не так, как описано в RM0399.

Быстрый переход: [1 Summary of device errata](docs/es0445-stm32h757xi.pdf#page=2) · [2 Description of device errata](docs/es0445-stm32h757xi.pdf#page=6)

### PM0253 — Programming Manual, Cortex-M7

[Открыть PDF](docs/pm0253-cortex-m7.pdf) · Rev 5 · 254 с. · 4,0 МБ

Программная модель ядра Cortex-M7: регистры, система команд, режимы работы, системные периферийные блоки ядра (NVIC, SysTick, MPU).

Быстрый переход: [2 The Cortex-M7 processor](docs/pm0253-cortex-m7.pdf#page=19) · [2.4 Exception model](docs/pm0253-cortex-m7.pdf#page=39) · [2.5 Fault handling](docs/pm0253-cortex-m7.pdf#page=47) · [2.6 Power management](docs/pm0253-cortex-m7.pdf#page=50) · [3 The Cortex-M7 instruction set](docs/pm0253-cortex-m7.pdf#page=52) · [3.2 CMSIS functions](docs/pm0253-cortex-m7.pdf#page=62) · [4 Cortex-M7 peripherals](docs/pm0253-cortex-m7.pdf#page=183) · [4.2 NVIC](docs/pm0253-cortex-m7.pdf#page=184) · [4.3 System control block](docs/pm0253-cortex-m7.pdf#page=192) · [4.4 System timer, SysTick](docs/pm0253-cortex-m7.pdf#page=212)

Применяется в: [[lab03/index\|ЛР3]] · [[lab04/index\|ЛР4]] · [[lab05/index\|ЛР5]]

### PM0214 — Programming Manual, Cortex-M4

[Открыть PDF](docs/pm0214-cortex-m4.pdf) · Rev 10 · 262 с. · 2,1 МБ

То же самое для второго ядра STM32H745 — Cortex-M4.

Быстрый переход: [2 The Cortex-M4 processor](docs/pm0214-cortex-m4.pdf#page=17) · [3 The STM32 Cortex-M4 instruction set](docs/pm0214-cortex-m4.pdf#page=50) · [4 Core peripherals](docs/pm0214-cortex-m4.pdf#page=193)

### Cortex-M Exception Handling — статья в двух частях

[Часть 1](docs/cortex-m-exception-handling-part1.pdf) · 9 с. · 0,2 МБ · [часть 2](docs/cortex-m-exception-handling-part2.pdf) · 7 с. · 0,1 МБ

Статья Ivan Cibrario Bertolotti с сайта EmbeddedRelated.com: как ядро [[glossary/cortex-m\|Cortex-M]] принимает запрос [[glossary/exception\|исключения]] (часть 1) и что происходит после его принятия — сохранение [[glossary/exception-frame\|кадра исключения]], вытеснение, возврат из обработчика (часть 2). Читается как связное дополнение к сухим формулировкам PM0253.

Применяется в: [[lab03/index\|ЛР3]]

## Отладочная плата NUCLEO-H745ZI-Q

### UM2408 — Board User Manual

[Открыть PDF](docs/um2408-nucleo-h745.pdf) · Rev 5 · 56 с. · 7,8 МБ

Описание отладочной платы: разъёмы, перемычки, светодиоды, кнопки, схемы питания и тактирования. Отвечает на вопросы «какой вывод к чему подключён» и «в каком положении должна стоять перемычка».

Быстрый переход: [1 Features](docs/um2408-nucleo-h745.pdf#page=7) · [5 Quick start](docs/um2408-nucleo-h745.pdf#page=11) · [6 Hardware layout and configuration](docs/um2408-nucleo-h745.pdf#page=12) · [6.4.8 Internal SMPS / LDO Configuration](docs/um2408-nucleo-h745.pdf#page=23) · [6.6 LEDs](docs/um2408-nucleo-h745.pdf#page=27) · [6.7 Push-buttons](docs/um2408-nucleo-h745.pdf#page=28) · [6.9 OSC clock](docs/um2408-nucleo-h745.pdf#page=28) · [6.10 USART communication](docs/um2408-nucleo-h745.pdf#page=29)

Применяется в: [[lab02/index\|ЛР2]] · [[lab04/index\|ЛР4]]

### MB1363 — электрическая схема платы

[Открыть PDF](docs/mb1363-nucleo-h745zi-schematic.pdf) · ревизия C от 14.02.2019 · 11 с. · 5,1 МБ

Принципиальная схема эталонной платы MB1363, на которой построена NUCLEO-H745ZI-Q. Нужна, когда описания в UM2408 не хватает и требуется проследить цепь.

### standos_sch — схема стенда

[Открыть PDF](docs/standos-sch.pdf) · от 12.11.2022 · 12 с. · 2,7 МБ

Электрическая схема лабораторного стенда: разводка подключённой к плате периферии (светодиоды, кнопки, интерфейсы I2C, SPI, UART).

## Библиотеки и примеры

### Understanding CMSIS — обзор библиотеки

[Открыть PDF](docs/understanding-cmsis.pdf) · 23 с. · 0,3 МБ

Обзорная презентация ARM: из чего состоит [[glossary/cmsis\|CMSIS]], за что отвечает каждый её слой (CMSIS-CORE, DSP, RTOS, SVD) и как устроены заголовочные файлы устройства.

Применяется в: [[lab02/index\|ЛР2]]

### UM2217 — описание HAL и LL-драйверов STM32H7

[Открыть PDF](docs/um2217-stm32h7-ll-drivers.pdf) · Rev 6 · 4020 с. · 12,4 МБ

Справочник по функциям библиотек HAL и Low-Layer из пакета STM32CubeH7: назначение, параметры и возвращаемые значения каждой функции.

Быстрый переход: [3 Support of dual-core architectures](docs/um2217-stm32h7-ll-drivers.pdf#page=7) · [4 Overview of HAL drivers](docs/um2217-stm32h7-ll-drivers.pdf#page=10) · [4.3 API classification](docs/um2217-stm32h7-ll-drivers.pdf#page=15) · [5 Overview of low-layer drivers](docs/um2217-stm32h7-ll-drivers.pdf#page=45) · [110 LL GPIO](docs/um2217-stm32h7-ll-drivers.pdf#page=2712) · [114 LL IWDG](docs/um2217-stm32h7-ll-drivers.pdf#page=3046)

Применяется в: [[lab04/index\|ЛР4]] · [[lab05/index\|ЛР5]]

### AN5033 — примеры STM32Cube для STM32H7

[Открыть PDF](docs/an5033-stm32cube-examples-stm32h7.pdf) · Rev 7 · 35 с. · 0,7 МБ

Указатель по примерам из пакета STM32CubeH7: какой пример какую задачу решает и на какой плате запускается.

### AN4899 — GPIO и энергопотребление

[Открыть PDF](docs/an4899-gpio-low-power.pdf) · Rev 3 · 31 с. · 0,6 МБ

Подробный разбор аппаратных настроек GPIO и их влияния на потребление: типы выходов, подтяжки, скорости фронтов, рекомендации по неиспользуемым выводам.

Быстрый переход: [4 GPIO functional description](docs/an4899-gpio-low-power.pdf#page=8) · [6 GPIO hardware guideline](docs/an4899-gpio-low-power.pdf#page=23) · [8 GPIO selection guide and configuration](docs/an4899-gpio-low-power.pdf#page=28)

## Модули расширения

### MSP3520 — TFT-дисплей 3,5" с интерфейсом SPI

[Открыть PDF](docs/msp3520-display-user-manual.pdf) · Rev 1.0 · 23 с. · 1,8 МБ

Руководство LCDWIKI на дисплейный модуль MSP3520: назначение выводов, схема подключения по SPI, работа с контроллером дисплея и тачскрином.

## Инструменты разработки и качество кода

Документы этого раздела не относятся к конкретному микроконтроллеру: это руководства по инструментам сборки, тестирования и анализа кода, которые применяются во всех работах.

### GCC 7.5 — Using the GNU Compiler Collection

[Открыть PDF](docs/gcc-7.5-manual.pdf) · GCC 7.5.0 · 906 с. · 3,8 МБ

Полное руководство по компилятору [[glossary/gcc\|GCC]]: ключи командной строки, стандарты языка, расширения, атрибуты и оптимизации. Справочник для случаев, когда нужно понять, что делает конкретный флаг сборки.

Применяется в: [[lab01/index\|ЛР1]] · [[lab02/index\|ЛР2]]

### Cppcheck — руководство пользователя

[Открыть PDF](docs/cppcheck-manual.pdf) · Version 2.16.0 · 37 с. · 0,2 МБ

Руководство статического анализатора [[glossary/cppcheck\|Cppcheck]]: запуск, выбор проверок, подавление сообщений, подключение аддонов — в том числе аддона MISRA.

Применяется в: [[lab01/index\|ЛР1]]

### Unity — таблица макросов проверок

[Открыть PDF](docs/unity-assertion-table.pdf) · 2 с. · 0,1 МБ

Все макросы проверок фреймворка [[glossary/unity\|Unity]] на двух страницах: сравнение чисел, строк, массивов, работа с плавающей точкой. Основная шпаргалка при написании модульных тестов.

Применяется в: [[lab01/index\|ЛР1]] · [[lab02/index\|ЛР2]]

### MISRA C:2012 — Guidelines

[Открыть PDF](docs/misra-c-2012-guidelines.pdf) · March 2013 · 236 с. · 1,2 МБ

Сам стандарт [[glossary/misra-c\|MISRA C]]:2012 — формулировки всех директив и правил с пояснениями и примерами. Сюда обращаются, когда анализатор сообщил о нарушении и нужно понять его причину.

Применяется в: [[lab01/index\|ЛР1]]

### On the MISRA C Coding Standard — статья

[Открыть PDF](docs/on-the-misra-c-coding-standard.pdf) · 11 с. · 0,4 МБ

Статья Roberto Bagnara и соавторов о том, зачем нужен MISRA C и какое место он занимает в разработке ответственных встраиваемых систем. Вводное чтение перед знакомством с самим стандартом.

Применяется в: [[lab01/index\|ЛР1]]

## Типы документов ST

Обозначения в кодах документов ST устроены единообразно — по префиксу видно, что за документ перед вами.

| Код | Тип                | Что содержит                                                |
| --- | ------------------ | ----------------------------------------------------------- |
| DS  | Datasheet          | Общие сведения об изделии, характеристики, выводы, корпуса. |
| RM  | Reference Manual   | Архитектура МК, память, периферия и её регистры.            |
| PM  | Programming Manual | Программная модель и периферия процессорного ядра.          |
| UM  | User Manual        | Описание изделия (платы, библиотеки) и работа с ним.        |
| AN  | Application Note   | Рекомендации по решению отдельных прикладных задач.         |
| ES  | Errata Sheet       | Аппаратные ошибки и способы их обхода.                      |
| MB  | Board Schematic    | Электрическая схема изделия.                                |

> [!note] Актуальность версий
> В репозитории лежат те редакции документов, по которым составлены лабораторные работы, — номера разделов и страниц в текстах работ соответствуют именно им. Свежие редакции всегда доступны на сайте [STMicroelectronics](https://www.st.com), но нумерация разделов там может отличаться.

---
title: "3. Практическое задание №2*"
lab: 1
tags:
  - лабораторная-работа
  - platformio
  - vscode
  - unity
  - misra
  - cppcheck
---

1. Настройте [[glossary/static-analysis\|статический анализатор]] [[glossary/cppcheck\|cppcheck]] для проверки правил стандарта MISRA C:2012.

   - Скопируйте папку `misra` из [[lab01/index#Файлы к работе\|архива файлов работы]] в папку проекта и добавьте флаг запуска утилиты cppcheck: `--addon=misra/misra.json`.

2. Проведите анализ кода библиотеки dynlist на соответствие правилам [[glossary/misra-c\|MISRA C:2012]].

   Изучите документацию стандарта MISRA для правил, которые были нарушены: формулировки приведены в [MISRA C:2012 Guidelines](docs/misra-c-2012-guidelines.pdf).

3. Доработайте код, чтобы устранить нарушения как минимум одного правила.

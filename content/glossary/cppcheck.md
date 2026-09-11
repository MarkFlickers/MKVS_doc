---
title: Cppcheck
tags:
  - глоссарий
---

**Cppcheck** — свободный [[glossary/static-analysis\|статический анализатор]] кода на C и C++, используемый в лабораторных работах по умолчанию.

Cppcheck не требует лицензии и подключается к проекту параметрами
окружения:

```ini
check_tool = cppcheck
check_flags = cppcheck:--enable=all
  --suppress=missingIncludeSystem
check_severity = low, medium, high
```

Через `check_flags` анализатору передаются его собственные ключи, а
`check_src_filters` задаёт список проверяемых файлов.

Проверку на соответствие стандарту [[glossary/misra-c\|MISRA C]] выполняет отдельный дополнительный
модуль (addon), который подключается ключом `--addon=misra/misra.json`.

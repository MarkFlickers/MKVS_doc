---
title: "2. Практическое задание №1 (обязательное)"
lab: 1
source: "МКВС.26 ЛР1 - r3.pdf"
revision: r3
author: "Симонов Сергей Борисович, доцент МПСУ МИЭТ, к.т.н."
year: 2026
---

## Вариант №1

Доработайте библиотеку dynlist, добавив в неё функцию поиска узла списка по значению хранимого элемента.

<div class="mkvs-retype">

```c
/**
 * Поиск узла в списке с заданным значением элемента
 * @param list список
 * @param val указатель на заданное значение
 * @return DynlistNode* - указатель на заданный узел или NULL, если узел не найден
 */
DynlistNode* dynlist_find(Dynlist list, void* val);
```

</div>

Для сравнения значений используйте пользовательскую функцию, указатель на которую следует передавать в качестве параметра при создании списка:

<div class="mkvs-retype">

```c
/**
 * @brief Сравнить значения элементов
 * @param pval1 - указатель на первый элемент
 * @param pval2 - указатель на второй элемент
 * @return 0 - элементы равны
 *    1 - val1 > val2
 *   -1 - val1 < val2 */
int compare(void *pval1, void* pval2);
```

</div>

Напишите тесты для проверки работы созданной функции. Проверьте решение тестами и [[glossary/static-analysis\|статическим анализатором]].

## Вариант №2

Доработайте библиотеку dynlist, добавив в неё функцию реверса, переставляющую элементы списка в обратном порядке: первый элемент становится последним, второй — предпоследним и т. д.

<div class="mkvs-retype">

```c
/**
 * Перестановка узлов в обратном порядке
 * @param list список
 */
DynlistNode* dynlist_reverse(Dynlist list);
```

</div>

Напишите тесты для проверки работы созданной функции. Проверьте решение тестами и [[glossary/static-analysis\|статическим анализатором]].

## Вариант №3

Доработайте библиотеку dynlist, добавив в неё функции для удаления узла из списка и вставки нового узла. Проверьте решение тестами, а код программы — статическим анализатором.

<div class="mkvs-retype">

```c
/**
 * @brief Удалить узел из списка
 * @param list список
 * @param node узел, который необходимо удалить
 */
void dynlist_remove(Dynlist list, DynlistNode* node);

/* Вставить узел со значением *value после узла pos */
void dynlist_insert(Dynlist list, DynlistNode* pos, void* value);
```

</div>

Напишите тесты для проверки работы созданных функций. Проверьте решение тестами и статическим анализатором.

## Вариант №4

Доработайте библиотеку dynlist, добавив в неё функции для определения числа хранимых узлов и получения узла по индексу.

<div class="mkvs-retype">

```c
int dynlist_size(Dynlist list);
DynlistNode *dynlist_get(Dynlist list, int index);

/* Вставить узел со значением после узла c индексом pos */
void dynlist_insert(Dynlist list, int pos, void* value);
```

</div>

Напишите тесты для проверки работы созданных функций. Проверьте решение тестами и статическим анализатором.

## Вариант №5

Доработайте библиотеку dynlist, добавив в неё функции для организации очереди.

<div class="mkvs-retype">

```c
/* Возвращает указатель на первый элемент
     и удаляет его узел из списка */
void* dynlist_popfirst(DynlistNode* node);

typedef DynlistDescriptor* iqueue_handle;
iqueue_handle iqueue_new(); // создать новую очередь
void iqueue_push(iqueue_handle handle, int value); // поместить число в очередь
int iqueue_pop(iqueue_handle handle); // извлечь число из очереди
```

</div>

Напишите тест для проверки работы очереди. Проверьте решение тестами и статическим анализатором.

## Вариант №6

Доработайте библиотеку dynlist, добавив в неё функции для организации стека.

<div class="mkvs-retype">

```c
/* Возвращает указатель на последний элемент
     и удаляет его узел из списка */
void* dynlist_poplast(DynlistNode* node);

typedef DynlistDescriptor* istack_handle;
istack_handle istack_new(); // создать новый стек
void istack_push(istack_handle handle, int value); // поместить число в стек
int istack_pop(istack_handle handle); // извлечь число из стека
```

</div>

Напишите тест для проверки работы стека. Проверьте решение тестами и статическим анализатором.

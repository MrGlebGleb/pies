// --- UTILITY FUNCTIONS ---

/**
 * Генерирует случайное целое число в заданном диапазоне (включительно).
 * @param {number} min - Минимальное значение.
 * @param {number} max - Максимальное значение.
 * @returns {number} Случайное целое число.
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Рассчитывает расстояние между двумя объектами с координатами x и y.
 * @param {object} obj1 - Первый объект (должен иметь свойства x, y).
 * @param {object} obj2 - Второй объект (должен иметь свойства x, y).
 * @returns {number} Расстояние между объектами.
 */
function getDistance(obj1, obj2) {
    if (typeof obj1?.x !== 'number' || typeof obj1?.y !== 'number' ||
        typeof obj2?.x !== 'number' || typeof obj2?.y !== 'number') {
        // console.warn("getDistance: invalid object coordinates", obj1, obj2);
        return Infinity; // Возвращаем бесконечность, если координаты некорректны
    }
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Рассчитывает суммарный интеллект бойца.
 * Работает как с инстансом бойца (currentFighters), так и с данными сессии (fightersSessionData).
 * @param {object} fighterObject - Объект бойца (инстанс или данные сессии).
 * @returns {number} Суммарный интеллект или 0, если данные некорректны.
 */
function getTotalIntellect(fighterObject) {
    if (!fighterObject || !fighterObject.combatStats || !fighterObject.combatStats.intellect) {
        // console.warn("getTotalIntellect: Missing combatStats or intellect object for", fighterObject?.name);
        return 0;
    }
    const { tactical, defense, resource, spatial } = fighterObject.combatStats.intellect;
    return (tactical || 0) + (defense || 0) + (resource || 0) + (spatial || 0);
}

/**
 * Рассчитывает необходимое количество опыта для следующего уровня интеллекта.
 * @param {number} currentLevel - Текущий уровень интеллекта (начиная с 1).
 * @returns {number} Количество опыта для следующего уровня.
 */
function getExpToLevelUp(currentLevel) {
    // Уровень 1 требует EXP_TO_LEVEL_UP_BASE, уровень 2 требует EXP_TO_LEVEL_UP_BASE * FACTOR, и т.д.
    // currentLevel 0 (если вдруг такое будет) -> Math.pow(factor, -1) -> не очень хорошо.
    // Поэтому currentLevel должен быть >= 1.
    if (currentLevel < 1) currentLevel = 1;
    return Math.floor(EXP_TO_LEVEL_UP_BASE * Math.pow(EXP_TO_LEVEL_UP_FACTOR, currentLevel - 1));
}

/**
 * Создает глубокую копию объекта или массива.
 * @param {any} obj - Объект или массив для копирования.
 * @returns {any} Глубокая копия.
 */
function deepCopy(obj) {
    // Проверка на примитивы и null (они копируются по значению или являются неизменяемыми)
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Обработка дат
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    // Обработка массивов
    if (Array.isArray(obj)) {
        const copy = [];
        for (let i = 0; i < obj.length; i++) {
            copy[i] = deepCopy(obj[i]);
        }
        return copy;
    }

    // Обработка объектов
    if (typeof obj === 'object') {
        const copy = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                copy[key] = deepCopy(obj[key]);
            }
        }
        return copy;
    }

    // На случай, если попадется что-то экзотическое, что не является ни null, ни объектом, ни массивом, ни Date
    // (хотя typeof obj !== 'object' должен это покрывать)
    return obj;
}

/**
 * Форматирует число, добавляя разделители тысяч.
 * @param {number} number - Число для форматирования.
 * @returns {string} Отформатированная строка.
 */
function formatNumberWithCommas(number) {
    if (number === null || number === undefined) return "0";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
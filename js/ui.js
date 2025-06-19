// --- UI FUNCTIONS ---

/**
 * Логирует сообщение в боевой лог.
 * @param {string} message - Текст сообщения (может содержать HTML).
 * @param {string} [className=""] - Класс для стилизации сообщения.
 */
function logMessage(message, className = "") {
    if (!battleLogEl) return;
    const p = document.createElement('p');
    p.innerHTML = message; // Используем innerHTML для поддержки HTML тегов в сообщениях
    if (className) p.classList.add(className);
    battleLogEl.appendChild(p);

    // Автоматическая прокрутка вниз, если пользователь не скроллил вручную
    if (!userScrolledLog) {
        battleLogEl.scrollTop = battleLogEl.scrollHeight;
    } else if (scrollLogDownButtonEl) {
        // Показываем кнопку "прокрутить вниз", если есть новый контент и пользователь наверху
        scrollLogDownButtonEl.style.opacity = (battleLogEl.scrollTop + battleLogEl.clientHeight < battleLogEl.scrollHeight - 20) ? '0.8' : '0';
    }
}

/**
 * Создает DOM-элемент для бойца на арене.
 * @param {object} fighterInstance - Инстанс бойца из currentFighters.
 */
function createFighterElementOnArena(fighterInstance) {
    if (!arenaEl || !fighterInstance) return;

    const el = document.createElement('div');
    el.classList.add('fighter-on-arena');
    if (fighterInstance.alive) el.classList.add('breathing');
    el.id = fighterInstance.id; // Используем ID инстанса
    el.style.left = `${fighterInstance.x - (FIGHTER_WIDTH / 2)}px`;
    el.style.top = `${fighterInstance.y - (FIGHTER_HEIGHT / 2)}px`;

    // Контейнер для полоски здоровья
    const healthBarContainer = document.createElement('div');
    healthBarContainer.classList.add('health-bar-container');
    const healthBar = document.createElement('div');
    healthBar.classList.add('health-bar');
    healthBarContainer.appendChild(healthBar);

    // Контейнер для полоски брони
    const armorBarContainer = document.createElement('div');
    armorBarContainer.classList.add('armor-bar-container'); // Изначально скрыт CSS, если нет 'has-armor'
    const armorBar = document.createElement('div');
    armorBar.classList.add('armor-bar');
    armorBarContainer.appendChild(armorBar);

    // Аватар
    const img = document.createElement('img');
    img.src = fighterInstance.image;
    img.alt = fighterInstance.name;
    img.onerror = () => { img.src = 'images/default.png'; };

    // Имя
    const nameDisplay = document.createElement('span');
    nameDisplay.classList.add('fighter-name-display');
    nameDisplay.textContent = fighterInstance.name;

    // Эмодзи оружия
    const weaponEmoji = document.createElement('span');
    weaponEmoji.classList.add('weapon-emoji');
    weaponEmoji.textContent = fighterInstance.weapon?.emoji || '?';

    // Подсказка интеллекта/действия
    const intActionHint = document.createElement('div');
    intActionHint.classList.add('int-action-hint');
    intActionHint.textContent = "..."; // Начальное значение

    el.appendChild(healthBarContainer);
    el.appendChild(armorBarContainer);
    el.appendChild(img);
    el.appendChild(nameDisplay);
    el.appendChild(weaponEmoji);
    el.appendChild(intActionHint);

    arenaEl.appendChild(el);
    fighterInstance.element = el; // Сохраняем ссылку на DOM-элемент в объекте бойца

    updateFighterIntellectVisuals(fighterInstance); // Применить рамку интеллекта
    updateFighterElementOnArena(fighterInstance);   // Первичное обновление полосок и т.д.
}

/**
 * Обновляет DOM-элемент бойца на арене (здоровье, броня, позиция, статусы).
 * @param {object} fighterInstance - Инстанс бойца из currentFighters.
 */
function updateFighterElementOnArena(fighterInstance) {
    if (!fighterInstance?.element) return;
    const el = fighterInstance.element;

    if (fighterInstance.alive) {
        el.style.left = `${fighterInstance.x - (FIGHTER_WIDTH / 2)}px`;
        el.style.top = `${fighterInstance.y - (FIGHTER_HEIGHT / 2)}px`;
    }

    // Здоровье
    const healthBar = el.querySelector('.health-bar');
    if (healthBar) {
        const healthPercent = Math.max(0, Math.min(100, (fighterInstance.health / fighterInstance.maxHealth) * 100));
        healthBar.style.width = `${healthPercent}%`;
        let healthGradient = `linear-gradient(to bottom, var(--bonus-health-color), var(--bonus-health-dark-color))`;
        if (healthPercent < 30) healthGradient = `linear-gradient(to bottom, var(--danger-color), var(--danger-dark-color))`;
        else if (healthPercent < 60) healthGradient = `linear-gradient(to bottom, var(--warning-color), var(--warning-dark-color))`;
        healthBar.style.backgroundImage = healthGradient;
        healthBar.classList.toggle('poisoned', !!fighterInstance.statusEffects?.poison || !!fighterInstance.statusEffects?.burn);
    }

    // Броня
    const armorBarContainer = el.querySelector('.armor-bar-container');
    const armorBar = el.querySelector('.armor-bar');
    if (fighterInstance.hasArmor && fighterInstance.maxArmorHits > 0 && armorBar && armorBarContainer) {
        armorBarContainer.style.display = 'block';
        const armorPercent = Math.max(0, Math.min(100, (fighterInstance.armorHits / fighterInstance.maxArmorHits) * 100));
        armorBar.style.width = `${armorPercent}%`;
    } else if (armorBarContainer) {
        armorBarContainer.style.display = 'none';
    }
    el.classList.toggle('has-armor', fighterInstance.hasArmor && fighterInstance.armorHits > 0);


    // Статусы
    el.classList.toggle('is-stunned', !!fighterInstance.statusEffects?.stun);
    el.classList.toggle('is-rooted', !!fighterInstance.statusEffects?.root);
    el.classList.toggle('is-slowed', !!fighterInstance.statusEffects?.slow || !!fighterInstance.statusEffects?.oe_slow_aura_effect);
    el.classList.toggle('enraged', !!fighterInstance.statusEffects?.enrage || !!fighterInstance.statusEffects?.oe_damage_boost_effect);


    // Подсказка действия
    const hintEl = el.querySelector('.int-action-hint');
    if (hintEl) {
        if (fighterInstance.alive && intelliActionLog && intelliActionLog[fighterInstance.id]?.message) {
            const logEntry = intelliActionLog[fighterInstance.id];
            hintEl.textContent = `${INTELLECT_SYMBOLS[logEntry.type] || '?'} ${logEntry.message}`;
            hintEl.style.color = `var(--${logEntry.type}-int-color, white)`;
        } else {
            hintEl.textContent = "";
            hintEl.style.color = "white";
        }
    }

    // Эмодзи оружия
    const weaponEmojiEl = el.querySelector('.weapon-emoji');
    if (weaponEmojiEl && fighterInstance.weapon && weaponEmojiEl.textContent !== fighterInstance.weapon.emoji) {
        weaponEmojiEl.textContent = fighterInstance.weapon.emoji;
    }

    // Анимация дыхания и класс "defeated"
    if (!fighterInstance.alive) {
        el.classList.remove('breathing');
        el.classList.add('defeated');
    } else if (!el.classList.contains('breathing')) {
        el.classList.add('breathing');
        el.classList.remove('defeated');
    }
    updateFighterIntellectVisuals(fighterInstance); // Обновление рамки от интеллекта/баффов
}


/**
 * Обновляет визуальное отображение рамки аватара бойца в зависимости от интеллекта/статусов.
 * @param {object} fighterInstance - Инстанс бойца.
 */
function updateFighterIntellectVisuals(fighterInstance) {
    if (!fighterInstance?.element) return;
    const imgEl = fighterInstance.element.querySelector('img');
    if (!imgEl) return;

    const totalInt = getTotalIntellect(fighterInstance);
    const hasSpecialFrame = fighterInstance.element.classList.contains('orbital-buff-active') ||
                            fighterInstance.element.classList.contains('orbital-debuff-active');

    // Сбрасываем предыдущие классы интеллекта перед применением новых
    imgEl.classList.remove('has-intellect', 'int-level-high');

    if (!hasSpecialFrame) { // Применяем рамку интеллекта только если нет рамки от орбитального эффекта
        if (fighterInstance.hasArmor) {
            // Рамка брони уже применяется через класс .has-armor на fighter-on-arena
        } else if (totalInt >= 8) {
            imgEl.classList.add('int-level-high');
        } else if (totalInt > 4) {
            imgEl.classList.add('has-intellect');
        }
    }
}


function removeFighterElementFromArena(fighterInstance) {
    if (fighterInstance?.element?.parentElement) {
        fighterInstance.element.remove();
        fighterInstance.element = null; // Очищаем ссылку
    }
}

// --- Визуальные эффекты (вспышки, искры, снаряды и т.д.) ---
// Эти функции в основном остаются без изменений, но убедимся, что они корректно работают с fighterInstance.

function showDamageFlash(targetFighterInstance, isCrit, isBlocked) {
    if (targetFighterInstance?.element) {
        const flash = document.createElement('div');
        flash.classList.add('damage-flash');
        if (isBlocked) flash.classList.add('blocked');
        else flash.classList.add(isCrit ? 'critical' : 'normal');

        const imgEl = targetFighterInstance.element.querySelector('img');
        if (imgEl?.parentNode) { // Вставляем после img, чтобы быть над ним
            imgEl.parentNode.insertBefore(flash, imgEl.nextSibling);
            setTimeout(() => { if (flash.parentElement) flash.remove(); }, 200);
        }
    }
}

function showHitSpark(targetFighterInstance, isCrit, isBlocked) {
    if (!arenaEl || !targetFighterInstance) return;
    const spark = document.createElement('div');
    spark.classList.add('hit-spark');
    if (isBlocked) spark.classList.add('blocked');
    else if (isCrit) spark.classList.add('critical');

    spark.style.left = `${targetFighterInstance.x + getRandomInt(-10, 10) - spark.offsetWidth / 2}px`;
    spark.style.top = `${targetFighterInstance.y - (FIGHTER_HEIGHT / 2) + getRandomInt(-5, 5) - spark.offsetHeight / 2}px`;
    arenaEl.appendChild(spark);
    setTimeout(() => { if (spark.parentElement) spark.remove(); }, isCrit ? 180 : (isBlocked ? 200 : 150));
}

function createProjectileElement(attackerInstance, weapon) {
    if (!attackerInstance || !weapon || !arenaEl) return null;
    const projectileEl = document.createElement('div');
    projectileEl.classList.add('projectile');
    projectileEl.textContent = weapon.projectile || '?';
    // Начальная позиция снаряда относительно центра бойца
    const projectileSize = projectileEl.offsetWidth || 24; // Примерный размер, если offsetWidth еще 0
    projectileEl.style.left = `${attackerInstance.x - projectileSize / 2}px`;
    projectileEl.style.top = `${attackerInstance.y - (FIGHTER_HEIGHT / 4) - projectileSize / 2}px`; // Чуть выше центра
    arenaEl.appendChild(projectileEl);
    return projectileEl;
}

function createAoeIndicator(centerX, centerY, radius) {
    if (!arenaEl || typeof centerX !== 'number' || typeof centerY !== 'number' || typeof radius !== 'number' || radius <= 0) return;
    const indicator = document.createElement('div');
    indicator.classList.add('aoe-indicator');
    indicator.style.width = `${radius * 2}px`;
    indicator.style.height = `${radius * 2}px`;
    indicator.style.left = `${centerX - radius}px`;
    indicator.style.top = `${centerY - radius}px`;
    arenaEl.appendChild(indicator);
    setTimeout(() => { if (indicator.parentElement) indicator.remove(); }, 250);
}

function showPickupAura(fighterInstance, bonusType) {
    if (!fighterInstance?.element) return;
    const aura = document.createElement('div');
    aura.classList.add('pickup-aura');
    if (bonusType === 'health_pack') aura.classList.add('health');
    else if (bonusType === 'elite_weapon') aura.classList.add('weapon');
    else if (bonusType.includes('armor')) aura.classList.add('armor');

    // Добавляем ауру внутрь элемента бойца, чтобы она двигалась вместе с ним, если он подберет бонус на ходу
    fighterInstance.element.appendChild(aura);
    setTimeout(() => { if (aura.parentElement) aura.remove(); }, 500);
}

function showIntellectLevelUpSparkle(fighterInstance) {
    if (!arenaEl || !fighterInstance) return;
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('intellect-levelup-sparkle');
        const sparkleSize = 8;
        sparkle.style.left = `${fighterInstance.x + getRandomInt(-15, 15) - sparkleSize / 2}px`;
        sparkle.style.top = `${fighterInstance.y - (FIGHTER_HEIGHT / 2) + getRandomInt(-10, 0) - sparkleSize / 2}px`;
        sparkle.style.animationDelay = `${i * 0.05}s`;
        arenaEl.appendChild(sparkle);
        setTimeout(() => { if (sparkle.parentElement) sparkle.remove(); }, 600 + i * 50);
    }
}

/**
 * Логирует интеллектуальное действие бойца для отображения подсказки на арене.
 * @param {object} fighterInstance - Инстанс бойца.
 * @param {string} intellectType - Тип интеллекта ('tactical', 'defense', 'resource', 'spatial').
 * @param {string} message - Сообщение о действии.
 */
function logIntellectAction(fighterInstance, intellectType, message) {
    if (!fighterInstance || !intellectType || !message) return;
    intelliActionLog[fighterInstance.id] = { type: intellectType, message: message };

    if (fighterInstance.element) { // Анимация "мышления"
        fighterInstance.element.classList.add('intellect-action');
        setTimeout(() => {
            if (fighterInstance.element) fighterInstance.element.classList.remove('intellect-action');
        }, 600);
    }
}

// --- Функции для Орбитальных Эффектов (в основном остаются, но передаем effectInstance) ---

function createOrbitalEffectElement(effectInstance) {
    if (!orbitalEffectsContainerEl || !effectInstance?.definition) return null;
    const el = document.createElement('div');
    el.classList.add('orbital-effect');
    el.dataset.id = effectInstance.id; // Сохраняем ID инстанса
    const effectColor = effectInstance.definition.color || 'purple';
    // Более простой градиент для лучшей производительности, если их много
    el.style.background = `radial-gradient(circle, white 2px, ${effectColor} 6px, rgba(40,40,40,0.7) 60%)`;
    el.style.boxShadow = `0 0 6px 2px ${effectColor}`; // Немного уменьшил тень

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('orbital-effect-icon');
    iconSpan.textContent = effectInstance.definition.icon || '?';
    el.appendChild(iconSpan);

    const tooltip = document.createElement('span');
    tooltip.classList.add('tooltip');
    tooltip.textContent = `${effectInstance.definition.name || 'Эффект'}: ${effectInstance.definition.description || 'Нет описания'}`;
    el.appendChild(tooltip);

    el.addEventListener('click', handleOrbitalEffectClick); // Обработчик будет в orbitalEffectsLogic.js
    orbitalEffectsContainerEl.appendChild(el);
    return el;
}

/**
 * Добавляет визуальную подсветку бойцу от орбитального эффекта.
 * @param {object} fighterInstance - Инстанс бойца.
 * @param {'buff'|'debuff'} effectType - Тип эффекта.
 * @param {number} durationMs - Длительность подсветки в миллисекундах.
 */
function addOrbitalEffectHighlight(fighterInstance, effectType, durationMs) {
    if (!fighterInstance?.element) return;
    const buffClass = 'orbital-buff-active';
    const debuffClass = 'orbital-debuff-active';
    const targetClass = effectType === 'buff' ? buffClass : debuffClass;
    const otherClass = effectType === 'buff' ? debuffClass : buffClass;

    // Если есть противоположный класс, сначала его удаляем
    if (fighterInstance.element.classList.contains(otherClass)) {
        removeOrbitalEffectHighlight(fighterInstance, otherClass);
    }

    // Управление таймаутами для каждого типа подсветки
    if (!fighterInstance.orbitalHighlightTimeouts) {
        fighterInstance.orbitalHighlightTimeouts = {};
    }
    if (fighterInstance.orbitalHighlightTimeouts[targetClass]) {
        clearTimeout(fighterInstance.orbitalHighlightTimeouts[targetClass]);
    }

    fighterInstance.element.classList.add(targetClass);

    if (durationMs > 0) {
        fighterInstance.orbitalHighlightTimeouts[targetClass] = setTimeout(() => {
            removeOrbitalEffectHighlight(fighterInstance, targetClass);
        }, durationMs);
    } else { // Если длительность 0, показываем и сразу убираем (для мгновенных эффектов)
        setTimeout(() => removeOrbitalEffectHighlight(fighterInstance, targetClass), 150);
    }
    updateFighterIntellectVisuals(fighterInstance); // Обновить рамку с учетом новой подсветки
}

function removeOrbitalEffectHighlight(fighterInstance, className) {
    if (!fighterInstance?.element) return;
    fighterInstance.element.classList.remove(className);
    updateFighterIntellectVisuals(fighterInstance); // Обновить рамку

    if (fighterInstance.orbitalHighlightTimeouts && fighterInstance.orbitalHighlightTimeouts[className]) {
        clearTimeout(fighterInstance.orbitalHighlightTimeouts[className]);
        delete fighterInstance.orbitalHighlightTimeouts[className];
    }
}
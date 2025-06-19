// --- ARENA BONUSES LOGIC ---

/**
 * Спавнит начальное количество случайных бонусов в начале раунда.
 */
function spawnInitialArenaBonuses() {
    if (!arenaEl) return;
    const numberOfBonuses = getRandomInt(MIN_INITIAL_BONUSES_PER_ROUND, MAX_INITIAL_BONUSES_PER_ROUND);
    logMessage(`✨ В начале раунда на арене появляется ${numberOfBonuses} бонусов!`, "log-effect");

    for (let i = 0; i < numberOfBonuses; i++) {
        if (arenaBonuses.length < MAX_ARENA_BONUSES) {
            // Выбираем тип бонуса случайным образом, но с весами (можно улучшить)
            const bonusTypes = ['health_pack', 'elite_weapon', 'armor_light', 'armor_heavy'];
            // Простой случайный выбор типа
            const randomType = bonusTypes[getRandomInt(0, bonusTypes.length - 1)];
            spawnArenaBonus(randomType, true); // true - initialSpawn, чтобы не было конфликта с лимитом в manageArenaBonuses сразу
        }
    }
}


/**
 * Управляет появлением бонусов на арене в течение раунда.
 * Вызывается в каждом игровом тике.
 */
function manageArenaBonuses() {
    if (arenaBonuses.length >= MAX_ARENA_BONUSES || !roundInProgress) return; // Не спавним, если лимит или раунд не идет

    const randomChance = Math.random();
    const tickRateFactor = 1000 / GAME_SPEED; // Коэффициент для нормализации шансов от скорости игры

    // Используем шансы из constants.js
    if (randomChance < (ELITE_WEAPON_BONUS_CHANCE / tickRateFactor) ) {
        spawnArenaBonus('elite_weapon');
    } else if (randomChance < ((ELITE_WEAPON_BONUS_CHANCE + HEALTH_PACK_BONUS_CHANCE) / tickRateFactor) ) {
        spawnArenaBonus('health_pack');
    } else if (randomChance < ((ELITE_WEAPON_BONUS_CHANCE + HEALTH_PACK_BONUS_CHANCE + ARMOR_PACK_LIGHT_CHANCE) / tickRateFactor) ) {
        spawnArenaBonus('armor_light');
    } else if (randomChance < ((ELITE_WEAPON_BONUS_CHANCE + HEALTH_PACK_BONUS_CHANCE + ARMOR_PACK_LIGHT_CHANCE + ARMOR_PACK_HEAVY_CHANCE) / tickRateFactor) ) {
        spawnArenaBonus('armor_heavy');
    }
}

/**
 * Создает и размещает бонус на арене.
 * @param {string} type - Тип бонуса ('elite_weapon', 'health_pack', 'armor_light', 'armor_heavy').
 * @param {boolean} [isInitialSpawn=false] - Флаг, указывающий, является ли это начальным спавном (для обхода проверки лимита в manageArenaBonuses).
 */
function spawnArenaBonus(type, isInitialSpawn = false) {
    if (!isInitialSpawn && arenaBonuses.length >= MAX_ARENA_BONUSES) return; // Проверка лимита для тикового спавна
    if (!arenaEl) return;

    const bonus = {
        id: `bonus-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: type,
        x: getRandomInt(30 + FIGHTER_WIDTH, ARENA_WIDTH - 30 - FIGHTER_WIDTH), // Подальше от краев и от начальных позиций бойцов
        y: getRandomInt(30 + FIGHTER_HEIGHT, ARENA_HEIGHT - 30 - FIGHTER_HEIGHT),
        element: document.createElement('div')
    };
    bonus.element.classList.add('arena-bonus');

    let titleText = "";
    if (type === 'health_pack') {
        bonus.element.classList.add('health-pack');
        bonus.element.textContent = '➕';
        titleText = "Аптечка (+50 ОЗ)";
        bonus.value = 50;
    } else if (type === 'elite_weapon') {
        bonus.element.classList.add('elite-weapon-pickup');
        const eliteWeaponSample = ELITE_WEAPONS[getRandomInt(0, ELITE_WEAPONS.length - 1)];
        bonus.element.textContent = eliteWeaponSample.emoji.length > 1 && eliteWeaponSample.emoji.includes("️") ? eliteWeaponSample.emoji.substring(0, eliteWeaponSample.emoji.indexOf("️")) : eliteWeaponSample.emoji.substring(0,1);
        titleText = `Элитное оружие: ${eliteWeaponSample.name}`;
        bonus.weapon = deepCopy(eliteWeaponSample);
    } else if (type === 'armor_light') {
        bonus.element.classList.add('armor-pack');
        bonus.element.textContent = '🛡️';
        titleText = `Легкая Броня (${MAX_ARMOR_HITS_LIGHT} блока)`;
        bonus.hits = MAX_ARMOR_HITS_LIGHT;
    } else if (type === 'armor_heavy') {
        bonus.element.classList.add('armor-pack');
        bonus.element.textContent = '💠';
        titleText = `Тяжелая Броня (${MAX_ARMOR_HITS_HEAVY} блока)`;
        bonus.hits = MAX_ARMOR_HITS_HEAVY;
    }
    bonus.element.title = titleText;

    bonus.element.style.left = `${bonus.x - (bonus.element.offsetWidth || 20) / 2}px`; // Центрируем бонус
    bonus.element.style.top = `${bonus.y - (bonus.element.offsetHeight || 20) / 2}px`;
    arenaEl.appendChild(bonus.element);
    arenaBonuses.push(bonus);
}

/**
 * Обрабатывает подбор бонуса бойцом.
 * @param {object} fighterInstance - Инстанс бойца, подобравший бонус.
 * @param {object} bonus - Объект бонуса.
 */
function collectBonus(fighterInstance, bonus) {
    if (!fighterInstance || !bonus || !bonus.element || !fighterInstance.alive) return; // Не подбираем, если боец мертв

    logIntellectAction(fighterInstance, 'resource', `подбирает ${bonus.element.title.split(':')[0]}`);
    addExperience(fighterInstance, 'pickup_bonus');
    fighterInstance.achievementsTrackers.bonusesCollectedThisRound = (fighterInstance.achievementsTrackers.bonusesCollectedThisRound || 0) + 1;

    showPickupAura(fighterInstance, bonus.type);

    if (bonus.type === 'health_pack' && bonus.value) {
        fighterInstance.health = Math.min(fighterInstance.maxHealth, fighterInstance.health + bonus.value);
        logMessage(`${fighterInstance.name} <span class="log-bonus">исцеляется на ${bonus.value} ОЗ</span> от аптечки!`, "log-bonus");
    } else if (bonus.type === 'elite_weapon' && bonus.weapon) {
        fighterInstance.weapon = deepCopy(bonus.weapon);
        fighterInstance.weapon.currentRange = fighterInstance.weapon.range; // Сброс дальности до базовой для нового оружия
        // Применяем множители урона и скорости атаки, бонусы крита к новому оружию
        const roundPermStats = fighterInstance.permanentStatsAppliedToRound;
        if (roundPermStats) {
            fighterInstance.weapon.minDamage = Math.round((fighterInstance.weapon.minDamage || 0) * (roundPermStats.baseDamageMultiplier || 1));
            fighterInstance.weapon.maxDamage = Math.round((fighterInstance.weapon.maxDamage || 0) * (roundPermStats.baseDamageMultiplier || 1));
            fighterInstance.weapon.critChance = (fighterInstance.weapon.critChance || 0) + (roundPermStats.critChanceBonus || 0);
            fighterInstance.weapon.speed = (fighterInstance.weapon.speed || 1) * (roundPermStats.attackSpeedMultiplier || 1);
            fighterInstance.weapon.critChance = Math.max(0, Math.min(1, fighterInstance.weapon.critChance || 0));
        }

        logMessage(`${fighterInstance.name} <span class="log-elite-weapon">подбирает Элитное Оружие: ${fighterInstance.weapon.name} ${fighterInstance.weapon.emoji}</span>!`, "log-elite-weapon");
        if (fighterInstance.element) {
            const weaponEmojiEl = fighterInstance.element.querySelector('.weapon-emoji');
            if (weaponEmojiEl) weaponEmojiEl.textContent = fighterInstance.weapon.emoji;
        }
    } else if ((bonus.type === 'armor_light' || bonus.type === 'armor_heavy') && bonus.hits) {
        let armorHitsToAdd = bonus.hits;
        if (activeRoundModifier && activeRoundModifier.name === "Хрупкая Броня") {
            armorHitsToAdd = Math.max(0, armorHitsToAdd - 1);
            if (armorHitsToAdd < bonus.hits) {
                 logMessage(`Модификатор "Хрупкая Броня" уменьшает прочность подобранной брони для ${fighterInstance.name}!`, "log-modifier");
            }
        }
        if (armorHitsToAdd > 0) {
            fighterInstance.armorHits = (fighterInstance.armorHits || 0) + armorHitsToAdd;
            fighterInstance.maxArmorHits = Math.max(fighterInstance.maxArmorHits || 0, fighterInstance.armorHits);
            fighterInstance.hasArmor = fighterInstance.armorHits > 0;
            logMessage(`${fighterInstance.name} <span class="log-armor">находит броню (${bonus.element.title.split('(')[0].trim()})</span>! (Всего: ${fighterInstance.armorHits} блоков)`, "log-armor");
        } else {
            logMessage(`${fighterInstance.name} пытался подобрать броню, но "Хрупкая Броня" уничтожила ее!`, "log-modifier");
        }
    }

    // Проверка "Аллергии на бонусы"
    const targetFighterData = fightersSessionData.find(f => f.id === fighterInstance.id);
    if (targetFighterData?.permanentStats?.bonusDamageOnPickup > 0) {
        const allergyDamage = targetFighterData.permanentStats.bonusDamageOnPickup;
        logMessage(`${fighterInstance.name} <span class="log-damage">получает ${allergyDamage} урона</span> от аллергии на бонусы!`, "log-damage");
        applyDamage(fighterInstance, allergyDamage, {name: "Аллергия", id:"debuff-allergy"}, false, "аллергия на бонус", true); // true - игнорировать броню
    }

    if (bonus.element.parentElement) {
        bonus.element.remove();
    }
    arenaBonuses = arenaBonuses.filter(b => b.id !== bonus.id);
    updateFighterElementOnArena(fighterInstance);
}
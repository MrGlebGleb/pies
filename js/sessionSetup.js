// --- SESSION SETUP LOGIC ---

/**
 * Инициализирует экран выбора гладиаторов для сессии.
 * Вызывается один раз при запуске игры.
 */
function initSessionSetupScreen() {
    if (!sessionSetupOverlayEl || !sessionFightersListContainerEl || !confirmSessionFightersButtonEl || !sessionSetupErrorEl) {
        console.error("Session Setup: Critical DOM elements are missing.");
        // Возможно, стоит показать пользователю сообщение об ошибке или остановить игру
        if (mainTitleEl) mainTitleEl.textContent = "ОШИБКА ЗАГРУЗКИ ИГРЫ!";
        return;
    }

    sessionFightersListContainerEl.innerHTML = ''; // Очищаем список на случай повторного вызова (хотя не должен)
    sessionSetupErrorEl.textContent = '';

    fightersInitialData.forEach(fighter => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('session-fighter-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `session-cb-${fighter.id}`;
        checkbox.value = fighter.id;
        checkbox.checked = true; // По умолчанию все выбраны
        checkbox.dataset.fighterName = fighter.name; // Сохраняем имя для сообщений

        const label = document.createElement('label');
        label.htmlFor = `session-cb-${fighter.id}`;

        const avatarImg = document.createElement('img');
        avatarImg.src = fighter.image;
        avatarImg.alt = fighter.name;
        avatarImg.onerror = () => { avatarImg.src = 'images/default.png'; };

        label.appendChild(avatarImg);
        label.appendChild(document.createTextNode(fighter.name));

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        sessionFightersListContainerEl.appendChild(itemDiv);
    });

    confirmSessionFightersButtonEl.onclick = handleConfirmSessionFighters;

    // Показываем оверлей, если он еще не активен (на случай если isInitialSetupPhase уже true)
    if (!sessionSetupOverlayEl.classList.contains('active')) {
        sessionSetupOverlayEl.classList.add('active');
    }
    isInitialSetupPhase = true;
    isInterRoundPhase = false;
    roundInProgress = false;
    if(nextRoundButtonEl) nextRoundButtonEl.style.display = 'none';
    if(mainTitleEl) mainTitleEl.textContent = "Выберите Участников";

    // Убедимся, что основной интерфейс игры (арена, лог) пока не виден или приглушен
    const gameContainer = document.querySelector('.container');
    if (gameContainer) gameContainer.style.display = 'none';
}

/**
 * Обрабатывает подтверждение выбора гладиаторов для сессии.
 */
function handleConfirmSessionFighters() {
    sessionSetupErrorEl.textContent = '';
    const selectedCheckboxes = sessionFightersListContainerEl.querySelectorAll('input[type="checkbox"]:checked');

    if (selectedCheckboxes.length < 2) {
        sessionSetupErrorEl.textContent = 'Нужно выбрать хотя бы двух гладиаторов для начала игры!';
        return;
    }

    fightersSessionData = []; // Очищаем данные предыдущей сессии, если есть

    selectedCheckboxes.forEach(checkbox => {
        const fighterId = checkbox.value;
        const initialData = fightersInitialData.find(f => f.id === fighterId);
        if (initialData) {
            const sessionFighter = deepCopy(initialData); // Глубокая копия, чтобы не менять исходные данные

            sessionFighter.participatingInGameSession = true;
            sessionFighter.currentGold = FIGHTER_STARTING_GOLD;
            sessionFighter.wins = 0; // Сбрасываем победы для новой сессии

            // Инициализация структуры для хранения перманентных статов и улучшений
            sessionFighter.permanentStats = {
                maxHealth: BASE_HEALTH,
                attackSpeedMultiplier: 1,
                critChanceBonus: 0,
                baseDamageMultiplier: 1,
                evasionBonus: 0,
                bonusPickupRadiusFactor: 1,
                bonusArmorChargesPerRound: 0,
                experienceGainMultiplier: { tactical: 1, defense: 1, resource: 1, spatial: 1 },
                enrageSettings: { thresholdPercent: null, damageBonus: 0 },
                hunterInstinctDamageBonus: 0,
                battleAura: { radius: 0, damageIncreasePercent: 0 },
                bonusKillExpPercent: 0,
                // Дебаффы, влияющие на статы (инициализируются значениями "без дебаффа")
                maxHealthModifierPercent: 1,
                baseDamageTakenDebuffMultiplier: 1,
                critChanceTakenDebuffModifier: 0,
                attackSpeedTakenDebuffMultiplier: 1,
                evasionTakenDebuffModifier: 0,
                maxArmorChargesDebuff: 0,
                pickupRadiusTakenDebuffMultiplier: 1,
                expGainTakenDebuffMultiplier: 1,
                bonusDamageOnPickup: 0,
                missChanceDebuff: 0,
                positiveEffectDurationModifier: 1
            };

            sessionFighter.temporaryRoundBonuses = {}; // Будет заполняться перед каждым раундом
            sessionFighter.purchasedUpgrades = {};    // { upgradeId: level }
            sessionFighter.debuffsInflicted = {};     // { targetId: { debuffId: level } }
            sessionFighter.activeBetsThisRound = [];
            sessionFighter.titles = [];
            sessionFighter.achievementsTrackers = resetAchievementTrackers(); // Функция для сброса счетчиков
            sessionFighter.economicUpgrades = { passiveIncomeLevel: 0, taxOptimizationLevel: 0 };
            sessionFighter.activePacts = [];
            sessionFighter.noPrizeStreak = 0;
            // Сбрасываем интеллект и опыт на начало сессии
            sessionFighter.combatStats.intellect = { tactical: 1, defense: 1, resource: 1, spatial: 1 };
            sessionFighter.combatStats.experience = { tactical: 0, defense: 0, resource: 0, spatial: 0 };


            fightersSessionData.push(sessionFighter);
        }
    });

    console.log("Fighters selected for session:", fightersSessionData.map(f => f.name));

    // Скрываем оверлей выбора
    sessionSetupOverlayEl.classList.remove('active');
    isInitialSetupPhase = false;

    // Показываем основной интерфейс игры
    const gameContainer = document.querySelector('.container');
    if (gameContainer) gameContainer.style.display = 'flex'; // или 'block', в зависимости от CSS

    // Переходим к первой межраундовой фазе
    startInterRoundPhase();
}

/**
 * Сбрасывает счетчики достижений для гладиатора.
 * @returns {object} Объект со сброшенными счетчиками.
 */
function resetAchievementTrackers() {
    return {
        killsThisRound: 0,
        timeSurvivedThisRound: 0, // в тиках или секундах
        bonusesCollectedThisRound: 0,
        successfulEvasionsThisRound: 0,
        critKills: 0,
        damageTakenThisRound: 0,
        wonDuel: false,
        killedTargetIds: [], // массив ID убитых целей
        // ... другие специфичные трекеры ...
    };
}

// Важно: initSessionSetupScreen() должна быть вызвана из main.js при старте игры.
// --- FIGHTER MANAGEMENT MODAL LOGIC ---

/**
 * Открывает модальное окно управления для выбранного гладиатора.
 * @param {object} fighterData - Данные гладиатора из fightersSessionData.
 */
function openFighterManagementModal(fighterData) {
    if (!fighterManagementOverlayEl || !fighterData) {
        console.error("Cannot open fighter management: overlay or fighterData missing.");
        return;
    }

    selectedFighterForManagementId = fighterData.id;

    if (fmFighterNameEl) fmFighterNameEl.textContent = fighterData.name;
    if (fmFighterGoldEl) fmFighterGoldEl.textContent = `Золото: ${formatNumberWithCommas(fighterData.currentGold || 0)} 💰`;
    if (fmActionMessageEl) fmActionMessageEl.textContent = '';
    if (fmBetErrorEl) fmBetErrorEl.textContent = '';

    switchTab(currentFighterManagementTab || 'fm-upgrades-tab');

    populateUpgradesTab(fighterData);
    populateBettingTab(fighterData);
    populateDebuffsTab(fighterData);
    populateSpecialActionsTab(fighterData);
    populateEconomyTab(fighterData);

    fighterManagementOverlayEl.classList.add('active');

    if (!fighterManagementOverlayEl.dataset.listenersAttached) {
        if (fmCloseButtonEl) fmCloseButtonEl.addEventListener('click', closeFighterManagementModal);
        if (fmTabsButtonsContainerEl) {
            fmTabsButtonsContainerEl.addEventListener('click', (event) => {
                if (event.target.classList.contains('tab-button')) {
                    switchTab(event.target.dataset.tab);
                }
            });
        }
        if (fmConfirmBetButtonEl) fmConfirmBetButtonEl.addEventListener('click', handleConfirmBet);
        fighterManagementOverlayEl.dataset.listenersAttached = 'true';
    }
}

function closeFighterManagementModal() {
    if (fighterManagementOverlayEl) {
        fighterManagementOverlayEl.classList.remove('active');
    }
    selectedFighterForManagementId = null;
}

function switchTab(tabId) {
    if (!fmTabsButtonsContainerEl || !fmTabContentAreaEl) return;
    currentFighterManagementTab = tabId;

    fmTabsButtonsContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    fmTabContentAreaEl.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeButton = fmTabsButtonsContainerEl.querySelector(`.tab-button[data-tab="${tabId}"]`);
    const activeContent = fmTabContentAreaEl.querySelector(`#${tabId}`);

    if (activeButton) activeButton.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    const fighterData = fightersSessionData.find(f => f.id === selectedFighterForManagementId);
    if (fighterData) {
        if (tabId === 'fm-upgrades-tab') populateUpgradesTab(fighterData);
        else if (tabId === 'fm-betting-tab') populateBettingTab(fighterData);
        else if (tabId === 'fm-debuffs-tab') populateDebuffsTab(fighterData);
        else if (tabId === 'fm-special-actions-tab') populateSpecialActionsTab(fighterData);
        else if (tabId === 'fm-economy-tab') populateEconomyTab(fighterData);
        if (fmFighterGoldEl) fmFighterGoldEl.textContent = `Золото: ${formatNumberWithCommas(fighterData.currentGold || 0)} 💰`;
    }
    if (fmActionMessageEl) fmActionMessageEl.textContent = '';
}

function populateUpgradesTab(fighterData) {
    if (!fmUpgradesListEl || !UPGRADES) return;
    fmUpgradesListEl.innerHTML = '';

    for (const upgradeKey in UPGRADES) {
        const upgrade = UPGRADES[upgradeKey];
        const currentLevel = fighterData.purchasedUpgrades?.[upgrade.id] || 0;
        const cost = calculateItemCost(upgrade.baseCost, upgrade.costIncrease, currentLevel);

        const li = document.createElement('li');
        li.classList.add('fm-item');
        li.title = upgrade.description || upgrade.name; // Подсказка для всего элемента списка

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('fm-item-name');
        nameSpan.textContent = `${upgrade.name} (Ур. ${currentLevel})`;
        // nameSpan.title = upgrade.description || upgrade.name; // Можно и сюда, если нужно только для имени

        const costSpan = document.createElement('span');
        costSpan.classList.add('fm-item-cost');
        costSpan.textContent = `💰 ${formatNumberWithCommas(cost)}`;

        const actionDiv = document.createElement('div');
        actionDiv.classList.add('fm-item-action');
        const buyButton = document.createElement('button');
        buyButton.textContent = 'Улучшить';
        buyButton.disabled = fighterData.currentGold < cost || (upgrade.maxLevel !== null && currentLevel >= upgrade.maxLevel);
        buyButton.onclick = () => handleBuyUpgrade(fighterData.id, upgrade.id);
        actionDiv.appendChild(buyButton);

        li.appendChild(nameSpan);
        li.appendChild(costSpan);
        li.appendChild(actionDiv);
        fmUpgradesListEl.appendChild(li);
    }
}

function handleBuyUpgrade(fighterId, upgradeId) {
    const fighter = fightersSessionData.find(f => f.id === fighterId);
    const upgradeDef = Object.values(UPGRADES).find(u => u.id === upgradeId);
    if (!fighter || !upgradeDef) return;

    const currentLevel = fighter.purchasedUpgrades?.[upgradeDef.id] || 0;
    const cost = calculateItemCost(upgradeDef.baseCost, upgradeDef.costIncrease, currentLevel);

    if (fighter.currentGold >= cost && (upgradeDef.maxLevel === null || currentLevel < upgradeDef.maxLevel)) {
        fighter.currentGold -= cost;
        fighter.purchasedUpgrades[upgradeDef.id] = (fighter.purchasedUpgrades[upgradeDef.id] || 0) + 1;
        applyUpgradeEffect(fighter, upgradeDef.effect);

        if (fmActionMessageEl) {
            fmActionMessageEl.textContent = `Улучшение "${upgradeDef.name}" куплено!`;
            fmActionMessageEl.className = 'info-message';
        }
        populateUpgradesTab(fighter);
        if (fmFighterGoldEl) fmFighterGoldEl.textContent = `Золото: ${formatNumberWithCommas(fighter.currentGold)} 💰`;
        updateScoreboardUI();
    } else {
        if (fmActionMessageEl) {
            fmActionMessageEl.textContent = `Недостаточно золота или достигнут макс. уровень.`;
            fmActionMessageEl.className = 'error-message';
        }
    }
}

function applyUpgradeEffect(fighter, effect) {
    if (!fighter.permanentStats) fighter.permanentStats = {};
    const parts = effect.statKey ? effect.statKey.split('.') : [];
    let currentObject = fighter;

    if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
            if (!currentObject[parts[i]]) currentObject[parts[i]] = {};
            currentObject = currentObject[parts[i]];
        }
    }
    const finalStatKey = parts.length > 0 ? parts[parts.length - 1] : null;

    switch (effect.type) {
        case "stat_add":
            if (finalStatKey) currentObject[finalStatKey] = (currentObject[finalStatKey] || 0) + effect.value;
            break;
        case "stat_multiply":
             if (finalStatKey) currentObject[finalStatKey] = (currentObject[finalStatKey] || 1) * (1 + effect.value);
            break;
        case "stat_multiply_inverse":
             if (finalStatKey) currentObject[finalStatKey] = (currentObject[finalStatKey] || 1) * (1 - effect.value);
            break;
        case "armor_charge":
            if (finalStatKey) currentObject[finalStatKey] = (currentObject[finalStatKey] || 0) + effect.value;
            break;
        case "exp_boost":
            if (!fighter.permanentStats.experienceGainMultiplier) fighter.permanentStats.experienceGainMultiplier = {};
            fighter.permanentStats.experienceGainMultiplier[effect.intellectType] = (fighter.permanentStats.experienceGainMultiplier[effect.intellectType] || 1) * (1 + effect.value);
            break;
        case "enrage_unlock":
            fighter.permanentStats.enrageSettings = {
                thresholdPercent: effect.thresholdPercent,
                damageBonus: (fighter.permanentStats.enrageSettings?.damageBonus || 0) + effect.damageBonus
            };
            break;
        case "hunter_instinct":
             if (finalStatKey) currentObject[finalStatKey] = (currentObject[finalStatKey] || 0) + effect.damageBonus;
            break;
        case "battle_aura":
            fighter.permanentStats.battleAura = {
                radius: Math.max(fighter.permanentStats.battleAura?.radius || 0, effect.radius),
                damageIncreasePercent: (fighter.permanentStats.battleAura?.damageIncreasePercent || 0) + effect.damageIncreasePercent
            };
            break;
        case "kill_exp_bonus":
            if (finalStatKey) currentObject[finalStatKey] = (currentObject[finalStatKey] || 0) + effect.value;
            break;
        default:
            console.warn("Unknown upgrade effect type:", effect.type);
    }
    if (fighter.permanentStats.maxHealth !== undefined) {
        fighter.permanentStats.maxHealth = Math.max(10, fighter.permanentStats.maxHealth);
    }
}

function populateBettingTab(fighterData) {
    if (!fmBettingOptionsListEl || !BET_TYPES || !fmActiveBetsListEl) return;
    fmBettingOptionsListEl.innerHTML = '';
    fmActiveBetsListEl.innerHTML = '';
    if (fmBetErrorEl) fmBetErrorEl.textContent = '';
    if (fmBetAmountInputEl) fmBetAmountInputEl.value = MIN_BET_AMOUNT.toString();

    for (const betKey in BET_TYPES) {
        const bet = BET_TYPES[betKey];
        const li = document.createElement('li');
        li.classList.add('fm-item');
        li.title = bet.description || bet.name; // Подсказка

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('fm-item-name');
        nameSpan.textContent = bet.name;

        const payoutSpan = document.createElement('span');
        payoutSpan.classList.add('fm-item-cost');
        payoutSpan.textContent = `Выплата: x${bet.payoutMultiplier}` + (bet.perKillMultiplier ? ` (+x${bet.perKillMultiplier}/килл)` : '');

        const actionDiv = document.createElement('div');
        actionDiv.classList.add('fm-item-action');
        const selectButton = document.createElement('button');
        selectButton.textContent = 'Выбрать';
        selectButton.onclick = () => {
            fmBetAmountInputEl.dataset.selectedBetType = bet.id;
            if (fmBetErrorEl) fmBetErrorEl.textContent = `Выбрана ставка: ${bet.name}. Введите сумму.`;
            fmBetErrorEl.className = 'info-message';
        };
        actionDiv.appendChild(selectButton);

        li.appendChild(nameSpan);
        li.appendChild(payoutSpan);
        li.appendChild(actionDiv);
        fmBettingOptionsListEl.appendChild(li);
    }

    if (fighterData.activeBetsThisRound && fighterData.activeBetsThisRound.length > 0) {
        fighterData.activeBetsThisRound.forEach(activeBet => {
            const betDef = BET_TYPES[activeBet.type];
            const betLi = document.createElement('li');
            betLi.textContent = `${betDef.name} - ${formatNumberWithCommas(activeBet.amount)} 💰`;
            fmActiveBetsListEl.appendChild(betLi);
        });
    } else {
        fmActiveBetsListEl.innerHTML = '<li>Нет активных ставок на этот раунд.</li>';
    }
}

function handleConfirmBet() {
    const fighter = fightersSessionData.find(f => f.id === selectedFighterForManagementId);
    const selectedBetType = fmBetAmountInputEl.dataset.selectedBetType;
    const betAmount = parseInt(fmBetAmountInputEl.value, 10);

    if (!fighter || !selectedBetType || !BET_TYPES[selectedBetType]) {
        fmBetErrorEl.textContent = 'Ошибка: Не выбран тип ставки или боец.';
        fmBetErrorEl.className = 'error-message';
        return;
    }
    if (isNaN(betAmount) || betAmount < MIN_BET_AMOUNT) {
        fmBetErrorEl.textContent = `Ошибка: Минимальная сумма ставки ${MIN_BET_AMOUNT} 💰.`;
        fmBetErrorEl.className = 'error-message';
        return;
    }
    if (fighter.currentGold < betAmount) {
        fmBetErrorEl.textContent = 'Ошибка: Недостаточно золота для этой ставки.';
        fmBetErrorEl.className = 'error-message';
        return;
    }

    fighter.currentGold -= betAmount;
    if (!fighter.activeBetsThisRound) fighter.activeBetsThisRound = [];
    fighter.activeBetsThisRound.push({ type: selectedBetType, amount: betAmount });

    fmBetErrorEl.textContent = `Ставка "${BET_TYPES[selectedBetType].name}" на ${formatNumberWithCommas(betAmount)} 💰 принята!`;
    fmBetErrorEl.className = 'info-message';
    fmBetAmountInputEl.value = MIN_BET_AMOUNT.toString();
    delete fmBetAmountInputEl.dataset.selectedBetType;

    populateBettingTab(fighter);
    if (fmFighterGoldEl) fmFighterGoldEl.textContent = `Золото: ${formatNumberWithCommas(fighter.currentGold)} 💰`;
    updateScoreboardUI();
}

function populateDebuffsTab(fighterData) {
    if (!fmDebuffsListEl || !fmDebuffTargetSelectEl || !DEBUFFS) return;
    fmDebuffsListEl.innerHTML = '';
    const currentSelectedTargetId = fmDebuffTargetSelectEl.value; // Сохраняем текущий выбор, если он есть
    fmDebuffTargetSelectEl.innerHTML = '';

    fightersSessionData.filter(f => f.participatingInGameSession && f.id !== fighterData.id).forEach(opponent => {
        const option = document.createElement('option');
        option.value = opponent.id;
        option.textContent = opponent.name;
        fmDebuffTargetSelectEl.appendChild(option);
    });

    if (currentSelectedTargetId && fmDebuffTargetSelectEl.querySelector(`option[value="${currentSelectedTargetId}"]`)) {
        fmDebuffTargetSelectEl.value = currentSelectedTargetId; // Восстанавливаем выбор, если цель еще существует
    }

    if (fmDebuffTargetSelectEl.options.length === 0) {
        fmDebuffsListEl.innerHTML = '<li>Нет доступных целей для дебаффов.</li>';
        fmDebuffTargetSelectEl.onchange = null; // Убираем слушатель, если нет целей
        return;
    }

    const selectedTargetId = fmDebuffTargetSelectEl.value;

    for (const debuffKey in DEBUFFS) {
        const debuff = DEBUFFS[debuffKey];
        const timesInflictedOnTarget = fighterData.debuffsInflicted?.[selectedTargetId]?.[debuff.id] || 0;
        const cost = calculateItemCost(debuff.baseCost, debuff.costIncrease, timesInflictedOnTarget);

        const li = document.createElement('li');
        li.classList.add('fm-item');
        li.title = debuff.description || debuff.name; // Подсказка

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('fm-item-name');
        nameSpan.textContent = `${debuff.name} (наложено: ${timesInflictedOnTarget} раз)`;

        const costSpan = document.createElement('span');
        costSpan.classList.add('fm-item-cost');
        costSpan.textContent = `💰 ${formatNumberWithCommas(cost)}`;

        const actionDiv = document.createElement('div');
        actionDiv.classList.add('fm-item-action');
        const buyButton = document.createElement('button');
        buyButton.textContent = 'Наложить';
        buyButton.disabled = fighterData.currentGold < cost;
        buyButton.onclick = () => handleBuyDebuff(fighterData.id, selectedTargetId, debuff.id);
        actionDiv.appendChild(buyButton);

        li.appendChild(nameSpan);
        li.appendChild(costSpan);
        li.appendChild(actionDiv);
        fmDebuffsListEl.appendChild(li);
    }
    fmDebuffTargetSelectEl.onchange = () => populateDebuffsTab(fighterData);
}

function handleBuyDebuff(attackerId, targetId, debuffId) {
    const attacker = fightersSessionData.find(f => f.id === attackerId);
    const target = fightersSessionData.find(f => f.id === targetId);
    const debuffDef = Object.values(DEBUFFS).find(d => d.id === debuffId);

    if (!attacker || !target || !debuffDef) return;

    const timesInflicted = attacker.debuffsInflicted?.[targetId]?.[debuffDef.id] || 0;
    const cost = calculateItemCost(debuffDef.baseCost, debuffDef.costIncrease, timesInflicted);

    if (attacker.currentGold >= cost) {
        attacker.currentGold -= cost;
        if (!attacker.debuffsInflicted[targetId]) attacker.debuffsInflicted[targetId] = {};
        attacker.debuffsInflicted[targetId][debuffDef.id] = (attacker.debuffsInflicted[targetId][debuffDef.id] || 0) + 1;
        applyDebuffEffectToTarget(target, debuffDef.effect);

        if (fmActionMessageEl) {
            fmActionMessageEl.textContent = `Дебафф "${debuffDef.name}" наложен на ${target.name}!`;
            fmActionMessageEl.className = 'info-message';
        }
        populateDebuffsTab(attacker);
        if (fmFighterGoldEl) fmFighterGoldEl.textContent = `Золото: ${formatNumberWithCommas(attacker.currentGold)} 💰`;
        updateScoreboardUI();
    } else {
         if (fmActionMessageEl) {
            fmActionMessageEl.textContent = `Недостаточно золота.`;
            fmActionMessageEl.className = 'error-message';
        }
    }
}

function applyDebuffEffectToTarget(targetFighter, effect) {
    if (!targetFighter.permanentStats) targetFighter.permanentStats = {};
    const parts = effect.targetStatKey ? effect.targetStatKey.split('.') : [];
    let currentObject = targetFighter.permanentStats; // Дебаффы всегда влияют на permanentStats цели
    const finalStatKey = parts.length > 0 ? parts[0] : null; // Для дебаффов statKey - это прямой ключ в permanentStats

    if (!finalStatKey) {
        console.warn("applyDebuffEffectToTarget: finalStatKey is null for effect", effect);
        return;
    }
    // Инициализируем ключ, если его нет (особенно для множителей)
    if (effect.type.includes("multiply") && currentObject[finalStatKey] === undefined) {
        currentObject[finalStatKey] = 1;
    } else if (currentObject[finalStatKey] === undefined) {
        currentObject[finalStatKey] = 0;
    }


    switch (effect.type) {
        case "stat_add":
            currentObject[finalStatKey] += effect.value;
            break;
        case "stat_add_capped":
            currentObject[finalStatKey] += effect.value;
            // Логика ограничения (например, чтобы броня не ушла в глубокий минус от дебаффа)
            // должна быть при расчете roundPermStats в createFighterInstance
            if (effect.targetStatKey === "maxArmorChargesDebuff" && targetFighter.permanentStats.bonusArmorChargesPerRound !== undefined) {
                 // Гарантируем, что общий бонус брони не станет отрицательным из-за дебаффа
                if (targetFighter.permanentStats.bonusArmorChargesPerRound + currentObject[finalStatKey] < 0) {
                    currentObject[finalStatKey] = -targetFighter.permanentStats.bonusArmorChargesPerRound;
                }
            }
            break;
        case "stat_multiply": // Для дебаффов, value обычно отрицательное (e.g., -0.02 для -2%)
                              // Эффект накапливается: base_stat_modifier * (1 + effect.value_1) * (1 + effect.value_2)
            currentObject[finalStatKey] *= (1 + effect.value);
            break;
        case "stat_multiply_inverse": // Для скорости атаки, value обычно отрицательное, (1 - (-0.02)) = 1.02 -> медленнее
            currentObject[finalStatKey] *= (1 - effect.value);
            break;
        case "damage_on_pickup":
             currentObject[finalStatKey] += effect.value;
            break;
        default:
            console.warn("Unknown debuff effect type:", effect.type);
    }
    // Гарантия, что maxHealth не станет < 10 после дебаффов, применяется в createFighterInstance
}

function populateSpecialActionsTab(fighterData) {
    if (!fmSpecialActionsListEl || !SPECIAL_ACTIONS) return;
    fmSpecialActionsListEl.innerHTML = '';

    for (const actionKey in SPECIAL_ACTIONS) {
        const action = SPECIAL_ACTIONS[actionKey];
        const timesUsed = fighterData.purchasedSpecialActions?.[action.id] || 0;
        const cost = action.cost !== undefined ? action.cost : calculateItemCost(action.baseCost, action.costIncrease, timesUsed);

        const li = document.createElement('li');
        li.classList.add('fm-item');
        li.title = action.description || action.name; // Подсказка

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('fm-item-name');
        nameSpan.textContent = action.name;

        const costSpan = document.createElement('span');
        costSpan.classList.add('fm-item-cost');
        costSpan.textContent = `💰 ${formatNumberWithCommas(cost)}`;

        const actionDiv = document.createElement('div');
        actionDiv.classList.add('fm-item-action');
        const useButton = document.createElement('button');
        useButton.textContent = 'Использовать';
        useButton.disabled = fighterData.currentGold < cost || (action.oneTimeOnly && timesUsed > 0);

        if (action.id === "exchangeExpForGold") {
            const selectIntellect = document.createElement('select');
            selectIntellect.id = `sa-select-${action.id}`;
            let canExchange = false;
            for(const intType in fighterData.combatStats.intellect) {
                if (fighterData.combatStats.intellect[intType] > 1) {
                    const opt = document.createElement('option');
                    opt.value = intType;
                    opt.textContent = `${INTELLECT_SYMBOLS[intType]} ${intType.charAt(0).toUpperCase() + intType.slice(1)} (Ур. ${fighterData.combatStats.intellect[intType]})`;
                    selectIntellect.appendChild(opt);
                    canExchange = true;
                }
            }
            if (!canExchange) useButton.disabled = true;
            actionDiv.appendChild(selectIntellect);
        }

        useButton.onclick = () => handleUseSpecialAction(fighterData.id, action.id);
        actionDiv.appendChild(useButton);

        li.appendChild(nameSpan);
        li.appendChild(costSpan);
        li.appendChild(actionDiv);
        fmSpecialActionsListEl.appendChild(li);
    }
}

function handleUseSpecialAction(fighterId, actionId) {
    const fighter = fightersSessionData.find(f => f.id === fighterId);
    const actionDef = SPECIAL_ACTIONS[actionId];
    if (!fighter || !actionDef) return;

    const timesUsed = fighter.purchasedSpecialActions?.[actionDef.id] || 0;
    const cost = actionDef.cost !== undefined ? actionDef.cost : calculateItemCost(actionDef.baseCost, actionDef.costIncrease, timesUsed);

    if (actionDef.oneTimeOnly && timesUsed > 0) {
         if (fmActionMessageEl) { fmActionMessageEl.textContent = `Это действие можно использовать только один раз.`; fmActionMessageEl.className = 'error-message'; }
        return;
    }
    if (fighter.currentGold < cost) {
        if (fmActionMessageEl) { fmActionMessageEl.textContent = `Недостаточно золота.`; fmActionMessageEl.className = 'error-message'; }
        return;
    }

    if (actionId === "exchangeExpForGold") {
        const selectIntellectEl = document.getElementById(`sa-select-${actionId}`);
        if (!selectIntellectEl || !selectIntellectEl.value) {
            if (fmActionMessageEl) { fmActionMessageEl.textContent = `Выберите интеллект для обмена.`; fmActionMessageEl.className = 'error-message'; } return;
        }
        const intellectToDecrease = selectIntellectEl.value;
        if (fighter.combatStats.intellect[intellectToDecrease] <= 1) {
             if (fmActionMessageEl) { fmActionMessageEl.textContent = `Нельзя понизить ${intellectToDecrease} интеллект ниже уровня 1.`; fmActionMessageEl.className = 'error-message'; } return;
        }
        fighter.combatStats.intellect[intellectToDecrease] -= actionDef.effect.intellectPoints;
        fighter.combatStats.experience[intellectToDecrease] = 0;
        fighter.currentGold += actionDef.effect.goldAmount;
        logMessage(`${fighter.name} обменял ${actionDef.effect.intellectPoints} ур. (${intellectToDecrease}) на ${actionDef.effect.goldAmount}💰.`);
    } else {
        fighter.currentGold -= cost;
        if (!fighter.temporaryRoundBonuses) fighter.temporaryRoundBonuses = {};
        switch (actionDef.effect.type) {
            case "temp_inspiration":
                fighter.temporaryRoundBonuses.inspirationBonusChance = (fighter.temporaryRoundBonuses.inspirationBonusChance || 0) + actionDef.effect.bonusChance;
                break;
            case "temp_elite_weapon":
                fighter.temporaryRoundBonuses.hasGuaranteedEliteWeapon = true;
                break;
            case "temp_regen":
                fighter.temporaryRoundBonuses.healthRegenPerTick = (fighter.temporaryRoundBonuses.healthRegenPerTick || 0) + actionDef.effect.healthPerTick;
                fighter.temporaryRoundBonuses.healthRegenInterval = actionDef.effect.tickIntervalSeconds; // В секундах!
                break;
        }
    }

    if (!fighter.purchasedSpecialActions) fighter.purchasedSpecialActions = {};
    fighter.purchasedSpecialActions[actionDef.id] = (fighter.purchasedSpecialActions[actionDef.id] || 0) + 1;

    if (fmActionMessageEl) { fmActionMessageEl.textContent = `Действие "${actionDef.name}" использовано!`; fmActionMessageEl.className = 'info-message'; }
    populateSpecialActionsTab(fighter);
    if (fmFighterGoldEl) fmFighterGoldEl.textContent = `Золото: ${formatNumberWithCommas(fighter.currentGold)} 💰`;
    updateScoreboardUI();
}

function populateEconomyTab(fighterData) {
    if (!fmEconomyUpgradesListEl || (!ECONOMIC_UPGRADES && !ECONOMIC_PACTS)) return;
    fmEconomyUpgradesListEl.innerHTML = '';

    const addEconomicItemToList = (item, type) => {
        const currentLevelOrPactActive = type === 'upgrade'
            ? (fighterData.economicUpgrades?.[item.id + 'Level'] || 0)
            : fighterData.activePacts?.some(p => p.pactId === item.id && (p.durationRoundsLeft > 0 || p.durationRoundsLeft === "permanent"));
        const cost = type === 'upgrade'
            ? calculateItemCost(item.baseCost, item.costIncrease, currentLevelOrPactActive)
            : item.cost;

        const li = document.createElement('li');
        li.classList.add('fm-item');
        li.title = item.description || item.name; // Подсказка

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('fm-item-name');
        let nameText = item.name;
        if (type === 'upgrade') nameText += ` (Ур. ${currentLevelOrPactActive})`;
        else if (currentLevelOrPactActive) nameText += ` (Активен)`;
        nameSpan.textContent = nameText;

        const costSpan = document.createElement('span');
        costSpan.classList.add('fm-item-cost');
        costSpan.textContent = `💰 ${formatNumberWithCommas(cost)}`;

        const actionDiv = document.createElement('div');
        actionDiv.classList.add('fm-item-action');
        const buyButton = document.createElement('button');
        buyButton.textContent = type === 'upgrade' ? 'Улучшить' : 'Заключить Пакт';

        let isDisabled = fighterData.currentGold < cost;
        if (type === 'upgrade' && item.maxLevel !== null && currentLevelOrPactActive >= item.maxLevel) isDisabled = true;
        if (type === 'pact' && item.oneTime && currentLevelOrPactActive) isDisabled = true;
        const miserPactActive = fighterData.activePacts?.find(p => p.pactId === "miserPact" && p.durationRoundsLeft > 0);
        if (miserPactActive && item.id !== "miserPact" && cost > 0) isDisabled = true;

        buyButton.disabled = isDisabled;
        buyButton.onclick = () => handleBuyEconomicItem(fighterData.id, item.id, type);
        actionDiv.appendChild(buyButton);

        li.appendChild(nameSpan);
        li.appendChild(costSpan);
        li.appendChild(actionDiv);
        fmEconomyUpgradesListEl.appendChild(li);
    };

    if (ECONOMIC_UPGRADES) {
        const upgradesHeader = document.createElement('h4');
        upgradesHeader.textContent = "Экономические Улучшения";
        fmEconomyUpgradesListEl.appendChild(upgradesHeader);
        for (const key in ECONOMIC_UPGRADES) addEconomicItemToList(ECONOMIC_UPGRADES[key], 'upgrade');
    }
    if (ECONOMIC_PACTS) {
        const pactsHeader = document.createElement('h4');
        pactsHeader.textContent = "Экономические Пакты";
        fmEconomyUpgradesListEl.appendChild(pactsHeader);
        for (const key in ECONOMIC_PACTS) addEconomicItemToList(ECONOMIC_PACTS[key], 'pact');
    }
}

function handleBuyEconomicItem(fighterId, itemId, type) {
    const fighter = fightersSessionData.find(f => f.id === fighterId);
    const itemDef = type === 'upgrade' ? ECONOMIC_UPGRADES[itemId] : ECONOMIC_PACTS[itemId];
    if (!fighter || !itemDef) return;

    const currentLevelOrActive = type === 'upgrade'
        ? (fighter.economicUpgrades?.[itemId + 'Level'] || 0)
        : fighter.activePacts?.some(p => p.pactId === itemId && (p.durationRoundsLeft > 0 || p.durationRoundsLeft === "permanent"));
    const cost = type === 'upgrade'
        ? calculateItemCost(itemDef.baseCost, itemDef.costIncrease, currentLevelOrActive)
        : itemDef.cost;

    const miserPactActive = fighter.activePacts?.find(p => p.pactId === "miserPact" && p.durationRoundsLeft > 0);
    if (miserPactActive && itemId !== "miserPact" && cost > 0) {
        if (fmActionMessageEl) { fmActionMessageEl.textContent = `Пакт Скупости активен! Нельзя тратить золото.`; fmActionMessageEl.className = 'error-message'; } return;
    }

    let canBuy = fighter.currentGold >= cost;
    if (type === 'upgrade' && itemDef.maxLevel !== null && currentLevelOrActive >= itemDef.maxLevel) canBuy = false;
    if (type === 'pact' && itemDef.oneTime && currentLevelOrActive) canBuy = false;

    if (canBuy) {
        fighter.currentGold -= cost;
        if (type === 'upgrade') {
            if (!fighter.economicUpgrades) fighter.economicUpgrades = {};
            fighter.economicUpgrades[itemId + 'Level'] = (fighter.economicUpgrades[itemId + 'Level'] || 0) + 1;
            if (itemDef.effect.type === "random_powerful_buff_next_round") {
                 if (!fighter.temporaryRoundBonuses) fighter.temporaryRoundBonuses = {};
                 fighter.temporaryRoundBonuses.godsOfferingActive = true;
            }
        } else if (type === 'pact') {
            if (!fighter.activePacts) fighter.activePacts = [];
            fighter.activePacts.push({ pactId: itemId, durationRoundsLeft: itemDef.durationRounds || "permanent" });
            if (itemDef.effect.maxHealthModifierPercent && fighter.permanentStats) {
                fighter.permanentStats.maxHealth = Math.round(fighter.permanentStats.maxHealth * (1 + itemDef.effect.maxHealthModifierPercent));
                fighter.permanentStats.maxHealth = Math.max(10, fighter.permanentStats.maxHealth);
            }
             if (itemDef.id === "miserPact") {
                // Здесь не нужно блокировать золото, просто запрет на траты.
                // Эффект бонуса сработает в gameFlow.js при истечении пакта.
                logMessage(`${fighter.name} заключил Пакт Скупости! Траты ограничены на ${itemDef.durationRounds} раунда.`, "log-effect");
            }
        }

        if (fmActionMessageEl) { fmActionMessageEl.textContent = `${itemDef.name} ${type === 'upgrade' ? 'улучшено' : 'заключен'}!`; fmActionMessageEl.className = 'info-message'; }
        populateEconomyTab(fighter);
        if (fmFighterGoldEl) fmFighterGoldEl.textContent = `Золото: ${formatNumberWithCommas(fighter.currentGold)} 💰`;
        updateScoreboardUI();
    } else {
        if (fmActionMessageEl) { fmActionMessageEl.textContent = `Недостаточно золота или достигнут лимит.`; fmActionMessageEl.className = 'error-message'; }
    }
}

function calculateItemCost(baseCost, costIncrease, currentLevel) {
    let cost = baseCost + (costIncrease * currentLevel);
    const fighter = fightersSessionData.find(f => f.id === selectedFighterForManagementId);
    if (fighter && fighter.economicUpgrades?.taxOptimizationLevel > 0 && ECONOMIC_UPGRADES.taxOptimization) {
        const discountPerLevel = ECONOMIC_UPGRADES.taxOptimization.effect.percent;
        const totalDiscount = Math.min(0.5, discountPerLevel * fighter.economicUpgrades.taxOptimizationLevel);
        cost = Math.round(cost * (1 - totalDiscount));
    }
    return Math.max(0, cost);
}
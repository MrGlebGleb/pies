// --- FIGHTER LOGIC ---

var createFighterInstanceNamespace = {
    commonWeaponThisRound: null
};

function createFighterInstance(fighterDataFromSession) {
    const instance = deepCopy(fighterDataFromSession);
    instance.x = getRandomInt(FIGHTER_WIDTH, ARENA_WIDTH - FIGHTER_WIDTH);
    instance.y = getRandomInt(FIGHTER_HEIGHT, ARENA_HEIGHT - FIGHTER_HEIGHT);
    instance.baseSpeed = getRandomInt(15, 25);
    instance.speed = instance.baseSpeed;
    instance.alive = true;
    instance.element = null;
    instance.target = null;
    instance.actionCooldown = 0;
    instance.statusEffects = {};
    instance.damageDealtThisRound = 0;
    instance.killsThisRound = 0;
    instance.achievementsTrackers = resetAchievementTrackers();
    instance.achievementsTrackers.damageTakenThisRound = 0;
    instance.achievementsTrackers.killedTargetIds = [];
    instance.currentAction = null;
    instance.lastDamagedBy = null;
    instance.lastPosition = { x: instance.x, y: instance.y };
    instance.ticksWithoutAction = 0;

    let roundPermStats = deepCopy(instance.permanentStats);

    if (instance.titles && instance.titles.length > 0) {
        instance.titles.forEach(activeTitleEntry => {
            const titleDef = TITLES[activeTitleEntry.titleId];
            if (titleDef && titleDef.effects && activeTitleEntry.durationRoundsLeft > 0) {
                if (titleDef.effects.allStatsMultiplier) {
                    const multiplier = titleDef.effects.allStatsMultiplier;
                    roundPermStats.maxHealth = Math.round(roundPermStats.maxHealth * multiplier);
                    roundPermStats.baseDamageMultiplier = (roundPermStats.baseDamageMultiplier || 1) * multiplier;
                    roundPermStats.attackSpeedMultiplier = (roundPermStats.attackSpeedMultiplier || 1) / multiplier;
                }
                if (titleDef.effects.evasionBonusAdd) {
                    roundPermStats.evasionBonus = (roundPermStats.evasionBonus || 0) + titleDef.effects.evasionBonusAdd;
                }
                if (titleDef.effects.damageMultiplierAdd) {
                    roundPermStats.baseDamageMultiplier = (roundPermStats.baseDamageMultiplier || 1) * (1 + titleDef.effects.damageMultiplierAdd);
                }
                 if (titleDef.effects.maxHealthMultiplierAdd) {
                    roundPermStats.maxHealth = Math.round(roundPermStats.maxHealth * (1 + titleDef.effects.maxHealthMultiplierAdd));
                }
                 if (titleDef.effects.pickupRadiusMultiplierAdd) {
                    roundPermStats.bonusPickupRadiusFactor = (roundPermStats.bonusPickupRadiusFactor || 1) * (1 + titleDef.effects.pickupRadiusMultiplierAdd);
                }
            }
        });
    }
    if (instance.activePacts && instance.activePacts.length > 0) {
        instance.activePacts.forEach(activePactEntry => {
            const pactDef = ECONOMIC_PACTS[activePactEntry.pactId];
            if (pactDef && pactDef.effect && (activePactEntry.durationRoundsLeft > 0 || activePactEntry.durationRoundsLeft === "permanent")) {
                if (pactDef.effect.maxHealthModifierPercent) {
                    roundPermStats.maxHealth = Math.round(roundPermStats.maxHealth * (1 + pactDef.effect.maxHealthModifierPercent));
                }
            }
        });
    }
    roundPermStats.maxHealth = Math.max(10, roundPermStats.maxHealth);

    instance.permanentStatsAppliedToRound = roundPermStats;
    instance.maxHealth = roundPermStats.maxHealth;
    instance.health = instance.maxHealth;
    instance.evasionChance = calculateInstanceEvasionChance(instance);
    instance.pickupRadiusFactor = roundPermStats.bonusPickupRadiusFactor;
    instance.actionCooldownMultiplier = 1;
    instance.projectileSpeedFactor = 1;

    if (instance.temporaryRoundBonuses?.hasGuaranteedEliteWeapon) {
        instance.weapon = deepCopy(ELITE_WEAPONS[getRandomInt(0, ELITE_WEAPONS.length - 1)]);
        logMessage(`${instance.name} получает элитное оружие "${instance.weapon.name}" благодаря инвестиции!`, "log-bonus");
    } else if (createFighterInstanceNamespace.commonWeaponThisRound) {
        instance.weapon = deepCopy(createFighterInstanceNamespace.commonWeaponThisRound);
    } else {
        instance.weapon = deepCopy(WEAPONS[getRandomInt(0, WEAPONS.length - 1)]);
    }
    instance.weapon.currentRange = instance.weapon.range;
    instance.weapon.minDamage = Math.round((instance.weapon.minDamage || 0) * (roundPermStats.baseDamageMultiplier || 1));
    instance.weapon.maxDamage = Math.round((instance.weapon.maxDamage || 0) * (roundPermStats.baseDamageMultiplier || 1));
    instance.weapon.critChance = (instance.weapon.critChance || 0) + (roundPermStats.critChanceBonus || 0);
    instance.weapon.speed = (instance.weapon.speed || 1) * (roundPermStats.attackSpeedMultiplier || 1);

    instance.armorHits = roundPermStats.bonusArmorChargesPerRound || 0;
    instance.maxArmorHits = instance.armorHits;
    instance.hasArmor = instance.armorHits > 0;
    if (instance.hasArmor) {
        logMessage(`${instance.name} начинает раунд с ${instance.armorHits} зарядами брони.`, "log-armor");
    }

    if (instance.temporaryRoundBonuses) {
        if (instance.temporaryRoundBonuses.inspirationBonusChance > 0) {
            instance.evasionChance = Math.min(0.9, instance.evasionChance + instance.temporaryRoundBonuses.inspirationBonusChance);
        }
        // Применение бонуса от "Подношения Божествам"
        if (instance.temporaryRoundBonuses.godsOfferingActive) {
            const positiveEffects = ORBITAL_EFFECTS_POOL.filter(e => e.type === 'buff' && e.action && !e.isPlayerEffect);
            if (positiveEffects.length > 0) {
                const randomBuffDef = positiveEffects[getRandomInt(0, positiveEffects.length - 1)];
                logMessage(`🙏 ${instance.name} получает благословение богов: "${randomBuffDef.name}"!`, "log-bonus");
                // Применяем эффект как если бы он был от орбиты
                // Нужно передать детали, которые ожидает action эффекта
                // Для большинства баффов, action ожидает targetFighterInstance
                if (typeof randomBuffDef.action === 'function') {
                     // Клонируем детали эффекта, чтобы не модифицировать глобальный пул
                    let effectDetailsClone = deepCopy(randomBuffDef);
                    // Для эффектов с onApply/onRemove, которые модифицируют статы,
                    // нужно чтобы они правильно восстанавливали значения.
                    // Поскольку это мгновенное применение, а не через клик,
                    // onApply/onRemove могут быть не до конца адаптированы.
                    // Простейший способ - если у эффекта есть duration, ставим его.
                    if (randomBuffDef.duration && randomBuffDef.duration > 0) {
                         applyStatusEffect(instance, randomBuffDef.id, { duration: Math.round(randomBuffDef.duration / GAME_SPEED) });
                    } else { // Если эффект мгновенный (типа heal, shield)
                        randomBuffDef.action(instance);
                    }
                }
            }
            delete instance.temporaryRoundBonuses.godsOfferingActive;
        }
    }
    const sessionDataRef = fightersSessionData.find(f => f.id === instance.id);
    if (sessionDataRef) {
        sessionDataRef.temporaryRoundBonuses = {};
    }

    instance.weapon.critChance = Math.max(0, Math.min(1, instance.weapon.critChance || 0));
    instance.evasionChance = Math.max(0, Math.min(0.9, instance.evasionChance || 0));
    instance.damageOutputMultiplier = 1;
    instance.statusEffects = {};
    return instance;
}

function calculateInstanceEvasionChance(fighterInstance) {
    let evasion = 0.05;
    evasion += (fighterInstance.combatStats?.intellect?.defense || 1) * 0.005;
    evasion += fighterInstance.permanentStatsAppliedToRound?.evasionBonus || 0;
    evasion += fighterInstance.permanentStatsAppliedToRound?.evasionTakenDebuffModifier || 0;
    return Math.max(0, Math.min(0.9, evasion));
}

function addExperience(fighterInstance, eventTypeKey, baseAmountMultiplier = 1) {
    if (!fighterInstance || !fighterInstance.alive || !fighterInstance.combatStats || !fighterInstance.combatStats.experience || !fighterInstance.combatStats.intellect) return;
    const rewardsForEvent = EXPERIENCE_REWARDS[eventTypeKey];
    if (!rewardsForEvent) return;
    const expGainMultipliers = fighterInstance.permanentStatsAppliedToRound?.experienceGainMultiplier || { tactical: 1, defense: 1, resource: 1, spatial: 1 };
    const killExpBonusFactor = 1 + (fighterInstance.permanentStatsAppliedToRound?.bonusKillExpPercent || 0);
    const expGainDebuffMultiplier = fighterInstance.permanentStatsAppliedToRound?.expGainTakenDebuffMultiplier || 1;

    for (const intellectType in rewardsForEvent) {
        if (fighterInstance.combatStats.intellect.hasOwnProperty(intellectType) &&
            fighterInstance.combatStats.intellect[intellectType] < MAX_INTELLECT_LEVEL) {
            let amount = (rewardsForEvent[intellectType] || 0) * baseAmountMultiplier;
            amount *= (expGainMultipliers[intellectType] || 1);
            amount *= expGainDebuffMultiplier;
            if (eventTypeKey.includes('kill') || eventTypeKey.includes('defeat') || eventTypeKey.includes('firstBlood')) {
                amount *= killExpBonusFactor;
            }
            const finalAmount = Math.round(amount);
            if (finalAmount > 0) {
                fighterInstance.combatStats.experience[intellectType] = (fighterInstance.combatStats.experience[intellectType] || 0) + finalAmount;
            }
        }
    }
}

function processEndOfRoundExperienceAndAchievements() {
    currentFighters.forEach(fighterInstance => {
        const sessionData = fightersSessionData.find(f => f.id === fighterInstance.id);
        if (!sessionData) return;
        for (const intellectType in fighterInstance.combatStats.experience) {
            if (sessionData.combatStats.experience.hasOwnProperty(intellectType)) {
                const gainedExpInRound = fighterInstance.combatStats.experience[intellectType] || 0;
                sessionData.combatStats.experience[intellectType] = (sessionData.combatStats.experience[intellectType] || 0) + gainedExpInRound;
                let currentLevelInSession = sessionData.combatStats.intellect[intellectType];
                let expInSession = sessionData.combatStats.experience[intellectType];
                while (currentLevelInSession < MAX_INTELLECT_LEVEL) {
                    const expNeeded = getExpToLevelUp(currentLevelInSession);
                    if (expInSession >= expNeeded) {
                        currentLevelInSession++;
                        expInSession -= expNeeded;
                        sessionData.combatStats.intellect[intellectType] = currentLevelInSession;
                        logMessage(`🧠 <span class="log-int-levelup">${sessionData.name} повысил ${intellectType} интеллект до ${currentLevelInSession}!</span> (<span class="log-int-${intellectType}">${INTELLECT_SYMBOLS[intellectType]}</span>)`, "log-int-levelup");
                        if (fighterInstance.element) showIntellectLevelUpSparkle(fighterInstance);
                    } else { break; }
                }
                sessionData.combatStats.experience[intellectType] = expInSession;
                if (currentLevelInSession >= MAX_INTELLECT_LEVEL) {
                    sessionData.combatStats.experience[intellectType] = 0;
                }
            }
        }
        fighterInstance.combatStats.experience = { tactical: 0, defense: 0, resource: 0, spatial: 0 };
        processFighterAchievements(fighterInstance, sessionData);
    });
}

function processFighterAchievements(fighterInstance, sessionData) {
    if (!ACHIEVEMENTS_ROUND || !TITLES || !fighterInstance.achievementsTrackers) return;
    const sortedByWins = [...fightersSessionData].filter(f => f.participatingInGameSession).sort((a, b) => (b.wins || 0) - (a.wins || 0));
    const currentLeaderId = sortedByWins.length > 0 ? sortedByWins[0].id : null;

    for (const achId in ACHIEVEMENTS_ROUND) {
        const ach = ACHIEVEMENTS_ROUND[achId];
        let conditionMet = false;
        try {
            conditionMet = ach.condition(fighterInstance, currentLeaderId, (fighterInstance.permanentStatsAppliedToRound?.maxHealth || BASE_HEALTH));
        } catch (e) { console.warn(`Error evaluating achievement ${achId} for ${fighterInstance.name}: ${e}`); }

        if (conditionMet) {
            if (ach.oneTimePerRoundGlobal) {
                if (roundGlobalAchievements[achId]) continue;
                roundGlobalAchievements[achId] = sessionData.id;
            }
            logMessage(`🏅 ${sessionData.name} выполнил: <span class="log-bonus">${ach.name}</span>!`, "log-bonus");
            if (ach.reward.type === "gold") {
                sessionData.currentGold += ach.reward.amount;
                logMessage(`💰 ${sessionData.name} +${formatNumberWithCommas(ach.reward.amount)} золота!`, "log-bonus");
            } else if (ach.reward.type === "temp_title") {
                const titleDef = TITLES[ach.reward.titleId];
                if (titleDef) {
                    if (!sessionData.titles) sessionData.titles = [];
                    const existingTitleIdx = sessionData.titles.findIndex(t => t.titleId === ach.reward.titleId);
                    if (existingTitleIdx !== -1) {
                        sessionData.titles[existingTitleIdx].durationRoundsLeft = Math.max(sessionData.titles[existingTitleIdx].durationRoundsLeft, titleDef.durationRounds);
                    } else {
                        sessionData.titles.push({ titleId: ach.reward.titleId, durationRoundsLeft: titleDef.durationRounds });
                    }
                    logMessage(`👑 ${sessionData.name} получает титул "${titleDef.name}" (${titleDef.durationRounds} р.)!`, "log-winner");
                }
            }
            if (!sessionData.achievementsEarnedOverall) sessionData.achievementsEarnedOverall = {};
            sessionData.achievementsEarnedOverall[achId] = (sessionData.achievementsEarnedOverall[achId] || 0) + 1;
        }
    }
}

function chooseAction(fighterInstance, aliveFighters, bonuses) {
    // ОТЛАДКА: Выводим состояние бойца перед выбором действия
    // console.log(`Choosing action for ${fighterInstance.name} (HP: ${fighterInstance.health}) | Cooldown: ${fighterInstance.actionCooldown} | Stun: ${!!fighterInstance.statusEffects?.stun} | Jam: ${!!fighterInstance.statusEffects?.oe_weapon_jam_effect} | Current Action: ${fighterInstance.currentAction?.type}`);
    // console.log(`${fighterInstance.name} Status Effects:`, JSON.stringify(Object.keys(fighterInstance.statusEffects)));

    if (fighterInstance.actionCooldown > 0 || fighterInstance.statusEffects?.stun || fighterInstance.statusEffects?.oe_weapon_jam_effect) {
        fighterInstance.ticksWithoutAction = 0;
        // ОТЛАДКА: Если не может действовать
        // if(fighterInstance.actionCooldown > 0) console.log(`${fighterInstance.name} is on cooldown.`);
        // if(fighterInstance.statusEffects?.stun) console.log(`${fighterInstance.name} is stunned.`);
        // if(fighterInstance.statusEffects?.oe_weapon_jam_effect) console.log(`${fighterInstance.name}'s weapon is jammed.`);
        return;
    }
    intelliActionLog[fighterInstance.id] = null;

    const { intellect, caution, aggression, preferredTargetType, learnedGrudges } = fighterInstance.combatStats;
    let bestAction = { type: 'idle', priority: -Infinity, message: "бездействует" }; // Изменено на -Infinity

    if (fighterInstance.statusEffects?.oe_disorient_movement_effect) {
        const destX = fighterInstance.x + getRandomInt(-2, 2) * fighterInstance.speed;
        const destY = fighterInstance.y + getRandomInt(-2, 2) * fighterInstance.speed;
        bestAction = { type: 'reposition', destX, destY, priority: 1000, message: `движется хаотично (дезориентация)` };
        logIntellectAction(fighterInstance, 'spatial', `дезориентирован!`);
    } else if (fighterInstance.statusEffects?.oe_confusion_effect) {
        const possibleTargetsIncludingSelf = currentFighters.filter(f => f.alive);
        if (possibleTargetsIncludingSelf.length > 0) {
            const randomTarget = possibleTargetsIncludingSelf[getRandomInt(0, possibleTargetsIncludingSelf.length - 1)];
            fighterInstance.target = randomTarget;
            const distToTarget = getDistance(fighterInstance, randomTarget);
            const attackRange = fighterInstance.weapon.currentRange || fighterInstance.weapon.range;
            if (distToTarget <= attackRange) {
                bestAction = { type: 'attack', target: randomTarget, priority: 100, message: `атакует ${randomTarget.name} (замешательство)` };
            } else {
                 bestAction = { type: 'move_to_attack', target: randomTarget, priority: 99, message: `движется к ${randomTarget.name} (замешательство)` };
            }
            logIntellectAction(fighterInstance, 'tactical', `в замешательстве!`);
            if (fighterInstance.statusEffects.oe_confusion_effect.attacksAffected > 0) {
                fighterInstance.statusEffects.oe_confusion_effect.attacksAffected--;
                if (fighterInstance.statusEffects.oe_confusion_effect.attacksAffected <= 0) {
                    const effectConf = fighterInstance.statusEffects.oe_confusion_effect;
                    if (effectConf && typeof effectConf.onRemove === 'function') effectConf.onRemove(fighterInstance, effectConf);
                    delete fighterInstance.statusEffects.oe_confusion_effect;
                }
            }
        }
    } else {
        if (bonuses && bonuses.length > 0) {
            let closestBonus = null;
            let minDistToBonus = Infinity;
            const currentPickupRadius = BONUS_PICKUP_RADIUS * (fighterInstance.pickupRadiusFactor || 1);
            bonuses.forEach(b => {
                const d = getDistance(fighterInstance, b);
                if (d < minDistToBonus) { minDistToBonus = d; closestBonus = b; }
            });
            if (closestBonus) {
                let bonusPriority = 10 + intellect.resource * 2;
                if (closestBonus.type === 'health_pack' && fighterInstance.health < fighterInstance.maxHealth * 0.75) {
                    bonusPriority += 50 + (1 - fighterInstance.health / fighterInstance.maxHealth) * 50 + intellect.resource * 5;
                } else if (closestBonus.type === 'elite_weapon' && !ELITE_WEAPONS.some(ew => ew.name === fighterInstance.weapon.name)) {
                    bonusPriority += 45 + intellect.resource * 6;
                } else if (closestBonus.type.includes('armor') && (!fighterInstance.hasArmor || fighterInstance.armorHits < 2)) {
                    bonusPriority += (closestBonus.type === 'armor_heavy' ? 40 : 35) + intellect.resource * 4;
                }
                if (minDistToBonus < currentPickupRadius * 2.5) bonusPriority += 25; // Увеличил радиус "привлекательности"
                if (minDistToBonus < currentPickupRadius * 1.2) bonusPriority += 30; // Очень близко

                if (bonusPriority > bestAction.priority) {
                    bestAction = { type: 'pickup', targetBonus: closestBonus, priority: bonusPriority, message: `идет за ${closestBonus.element.title.split(':')[0]}` };
                }
            }
        }

        const potentialTargets = aliveFighters.filter(f => f.id !== fighterInstance.id && f.alive);
        if (potentialTargets.length > 0) {
            let currentTarget = null;
            let highestScore = -Infinity;
            potentialTargets.forEach(pTarget => {
                let score = 0;
                const dist = getDistance(fighterInstance, pTarget);
                if (preferredTargetType === 'closest') score += (ARENA_WIDTH - dist) * 0.1;
                if (preferredTargetType === 'weakest') score += (pTarget.maxHealth - pTarget.health) * 0.5 + (intellect.tactical * 2) - (pTarget.hasArmor ? 30 : 0) ;
                if (preferredTargetType === 'highest_threat') {
                    const pTargetSessionData = fightersSessionData.find(f => f.id === pTarget.id);
                    score += (getTotalIntellect(pTarget) * 1.5) + ((pTargetSessionData?.wins || 0) * 15) + (pTarget.hasArmor ? 15 : 0);
                    if(pTarget.weapon && ELITE_WEAPONS.some(ew => ew.name === pTarget.weapon.name)) score += 25;
                }
                if(learnedGrudges && learnedGrudges[pTarget.id]) score += learnedGrudges[pTarget.id] * (3 + intellect.tactical);
                if (fighterInstance.permanentStatsAppliedToRound?.hunterInstinctDamageBonus > 0) {
                    const maxHealthOpponent = potentialTargets.reduce((prev, curr) => (curr.health / curr.maxHealth) > (prev.health / prev.maxHealth) ? curr : prev, potentialTargets[0]);
                    if (pTarget.id === maxHealthOpponent.id) { score *= (1 + fighterInstance.permanentStatsAppliedToRound.hunterInstinctDamageBonus * 10); }
                }
                if (fighterInstance.permanentStatsAppliedToRound?.battleAura?.radius > 0 && dist <= fighterInstance.permanentStatsAppliedToRound.battleAura.radius) { score *= 1.15; }
                score *= (1 + aggression - caution);
                if (pTarget.statusEffects?.oe_vulnerability_effect || pTarget.vulnerabilityBonusNextHitFactor > 1) score *= 1.25;
                if(score > highestScore) { highestScore = score; currentTarget = pTarget; }
            });
            if (preferredTargetType === 'random' && !currentTarget && potentialTargets.length > 0){
                currentTarget = potentialTargets[getRandomInt(0, potentialTargets.length -1)];
            }
            if (currentTarget) {
                fighterInstance.target = currentTarget; // Сохраняем цель
                const distToTarget = getDistance(fighterInstance, currentTarget);
                const attackRange = fighterInstance.weapon.currentRange || fighterInstance.weapon.range;
                if (distToTarget <= attackRange) {
                    let attackPriority = 40 + intellect.tactical * 5 + aggression * 20;
                    if (currentTarget.health < currentTarget.maxHealth * 0.25) attackPriority += 30;
                    if (fighterInstance.permanentStatsAppliedToRound?.enrageSettings?.thresholdPercent && fighterInstance.health < fighterInstance.maxHealth * fighterInstance.permanentStatsAppliedToRound.enrageSettings.thresholdPercent) { attackPriority *= 1.25; }
                    if (fighterInstance.health < fighterInstance.maxHealth * 0.20 && caution > aggression * 1.1) attackPriority *= (0.5 - caution);
                    if (attackPriority > bestAction.priority) {
                        bestAction = { type: 'attack', target: currentTarget, priority: attackPriority, message: `атакует ${currentTarget.name}` };
                    }
                } else {
                    let moveAttackPriority = 30 + intellect.spatial * 3 + aggression * 15;
                     if (currentTarget.health < currentTarget.maxHealth * 0.25) moveAttackPriority += 20;
                    if (moveAttackPriority > bestAction.priority) {
                        bestAction = { type: 'move_to_attack', target: currentTarget, priority: moveAttackPriority, message: `сближается с ${currentTarget.name}` };
                    }
                }
            }
        }

        let wantsToRetreat = false;
        if (fighterInstance.health < fighterInstance.maxHealth * (0.30 + caution * 0.6 - aggression * 0.3 + intellect.defense * 0.03)) wantsToRetreat = true;
        if (fighterInstance.hasArmor && fighterInstance.armorHits > 0 && fighterInstance.health > fighterInstance.maxHealth * 0.15) wantsToRetreat = false;
        if (fighterInstance.target && fighterInstance.target.alive && fighterInstance.target.health < fighterInstance.target.maxHealth * 0.10 && fighterInstance.health > fighterInstance.maxHealth * 0.10) wantsToRetreat = false;
        if (duelContenders && duelContenders.some(dc => dc.id === fighterInstance.id) && fighterInstance.health > fighterInstance.maxHealth * 0.05) wantsToRetreat = false;
        else if (aggression > 0.97 && fighterInstance.health > fighterInstance.maxHealth * 0.03) { if (Math.random() < aggression * 0.98) wantsToRetreat = false; }

        if (wantsToRetreat && potentialTargets.length > 0) {
            let escapeVector = { x: 0, y: 0 };
            let closestThreatDist = Infinity;
            let closestThreat = null;
            let numThreatsConsidered = 0;
            potentialTargets.forEach(pTarget => {
                const dist = getDistance(fighterInstance, pTarget);
                if (dist < (fighterInstance.weapon.range || 100) * 2.5 || (pTarget.target && pTarget.target.id === fighterInstance.id)) {
                    numThreatsConsidered++;
                    if (dist < closestThreatDist) { closestThreatDist = dist; closestThreat = pTarget; }
                    escapeVector.x -= (pTarget.x - fighterInstance.x) / (dist * dist + 1);
                    escapeVector.y -= (pTarget.y - fighterInstance.y) / (dist * dist + 1);
                }
            });
            if (numThreatsConsidered > 0) {
                let retreatDestX = fighterInstance.x, retreatDestY = fighterInstance.y;
                const norm = Math.sqrt(escapeVector.x * escapeVector.x + escapeVector.y * escapeVector.y);
                if (norm > 0) { retreatDestX = fighterInstance.x + (escapeVector.x / norm) * fighterInstance.speed * 3; retreatDestY = fighterInstance.y + (escapeVector.y / norm) * fighterInstance.speed * 3; }
                else if (closestThreat) { retreatDestX = fighterInstance.x + (fighterInstance.x - closestThreat.x) / closestThreatDist * fighterInstance.speed * 3; retreatDestY = fighterInstance.y + (fighterInstance.y - closestThreat.y) / closestThreatDist * fighterInstance.speed * 3; }
                const retreatPriorityVal = 35 + intellect.defense * 6 + caution * 20 - aggression * 15;
                 if (retreatPriorityVal > bestAction.priority) {
                    bestAction = { type: 'retreat', destX: retreatDestX, destY: retreatDestY, priority: retreatPriorityVal, message: `отступает` };
                }
            }
        }
        if (bestAction.type === 'idle' || bestAction.priority < (1 + intellect.spatial)) { // Понизил порог для репозиционирования, чтобы оно было чаще при "тупике"
            let destX = fighterInstance.x + getRandomInt(-1, 1) * fighterInstance.speed * (1 + intellect.spatial * 0.1);
            let destY = fighterInstance.y + getRandomInt(-1, 1) * fighterInstance.speed * (1 + intellect.spatial * 0.1);
            if (fighterInstance.x < 80) destX = fighterInstance.x + fighterInstance.speed * 1.5;
            if (fighterInstance.x > ARENA_WIDTH - 80) destX = fighterInstance.x - fighterInstance.speed * 1.5;
            if (fighterInstance.y < 80) destY = fighterInstance.y + fighterInstance.speed * 1.5;
            if (fighterInstance.y > ARENA_HEIGHT - 80) destY = fighterInstance.y - fighterInstance.speed * 1.5;
            bestAction = { type: 'reposition', destX, destY, priority: 1 + intellect.spatial, message: `маневрирует` }; // Понизил приоритет
        }
    }

    fighterInstance.currentAction = bestAction;
    // ОТЛАДКА: Выводим выбранное действие
    // console.log(`${fighterInstance.name} chose action: ${bestAction.type}, target: ${bestAction.target?.name || bestAction.targetBonus?.type || 'N/A'}, Prio: ${bestAction.priority.toFixed(2)}`);

    if (bestAction.type !== 'idle' && bestAction.message) {
        const intContext = bestAction.type.includes('attack') || bestAction.type.includes('move_to_attack') ? 'tactical' : (bestAction.type === 'pickup' ? 'resource' : (bestAction.type === 'retreat' ? 'defense' : 'spatial'));
        if (intellect[intContext] > 1 || ['attack', 'retreat', 'pickup'].includes(bestAction.type)) {
             logIntellectAction(fighterInstance, intContext, bestAction.message);
        }
    }

    if (bestAction.type === 'idle' || (bestAction.type === 'reposition' && getDistance(fighterInstance, fighterInstance.lastPosition) < fighterInstance.speed * 0.3)) {
        fighterInstance.ticksWithoutAction++;
    } else {
        fighterInstance.ticksWithoutAction = 0;
    }
    fighterInstance.lastPosition = { x: fighterInstance.x, y: fighterInstance.y };
}

function executeAction(fighterInstance) {
    if (!fighterInstance.alive || fighterInstance.actionCooldown > 0 || fighterInstance.statusEffects?.stun || !fighterInstance.currentAction) return;

    // ОТЛАДКА: Если боец все еще не может атаковать, но должен
    // if (fighterInstance.currentAction?.type === 'attack' && fighterInstance.statusEffects?.oe_weapon_jam_effect) {
    //     console.error(`${fighterInstance.name} TRIED TO ATTACK WITH JAMMED WEAPON. CurrentAction: ${fighterInstance.currentAction.type}`);
    // }


    if (fighterInstance.statusEffects?.oe_weapon_jam_effect && fighterInstance.currentAction.type === 'attack') {
        logIntellectAction(fighterInstance, 'tactical', `пытается атаковать, но оружие заклинило!`);
        fighterInstance.actionCooldown = Math.max(1, Math.round( (10 / (fighterInstance.weapon?.speed || 1)) / 2 * (fighterInstance.actionCooldownMultiplier || 1)));
        fighterInstance.currentAction = { type: 'idle', priority: -1, message: "оружие заклинило" }; // Сбрасываем атаку
        return;
    }

    const action = fighterInstance.currentAction;
    let targetFighter = null;
    if (action.target && action.target.id) {
        targetFighter = currentFighters.find(f => f.id === action.target.id && f.alive);
        if (!targetFighter && (action.type === 'attack' || action.type === 'move_to_attack')) {
            // console.log(`${fighterInstance.name}'s target ${action.target.name} is no longer valid. Resetting action.`);
            fighterInstance.currentAction = null;
            fighterInstance.target = null;
            fighterInstance.actionCooldown = 1;
            return;
        }
    }
    let targetBonus = null;
    if(action.targetBonus && action.targetBonus.id) {
        targetBonus = arenaBonuses.find(b => b.id === action.targetBonus.id);
        if (!targetBonus && action.type === 'pickup') {
            // console.log(`${fighterInstance.name}'s bonus target no longer exists. Resetting action.`);
            fighterInstance.currentAction = null;
            fighterInstance.actionCooldown = 1;
            return;
        }
    }

    let moveSpeed = fighterInstance.speed;
    if (fighterInstance.statusEffects?.root) moveSpeed = 0;
    let baseCooldown = 1;

    switch (action.type) {
        case 'attack':
            if (targetFighter) {
                if (fighterInstance.element) fighterInstance.element.classList.add('attacking');
                setTimeout(() => { if(fighterInstance.element) fighterInstance.element.classList.remove('attacking'); }, 100);
                if (fighterInstance.statusEffects?.oe_fumble_effect) {
                    const fumbleEffect = fighterInstance.statusEffects.oe_fumble_effect;
                    if (Math.random() < fumbleEffect.chance) {
                        logMessage(`${fighterInstance.name} <span class="log-effect">промахивается</span> из-за неуклюжести!`, "log-effect");
                        if (fumbleEffect.oneTimeUse) { if (typeof fumbleEffect.onRemove === 'function') fumbleEffect.onRemove(fighterInstance, fumbleEffect); delete fighterInstance.statusEffects.oe_fumble_effect; }
                        baseCooldown = Math.max(1, Math.round( (10 / (fighterInstance.weapon?.speed || 1)) / 2 ));
                        break;
                    }
                    if (fumbleEffect.oneTimeUse) { if (typeof fumbleEffect.onRemove === 'function') fumbleEffect.onRemove(fighterInstance, fumbleEffect); delete fighterInstance.statusEffects.oe_fumble_effect; }
                }
                if (fighterInstance.permanentStatsAppliedToRound?.missChanceDebuff > 0 && Math.random() < fighterInstance.permanentStatsAppliedToRound.missChanceDebuff) {
                    logMessage(`${fighterInstance.name} <span class="log-effect">промахивается</span> из-за дрожи! (Дебафф)`, "log-effect");
                    baseCooldown = Math.max(1, Math.round( (10 / (fighterInstance.weapon?.speed || 1)) / 2 ));
                    break;
                }
                const aoeMeleeEffect = fighterInstance.weapon.effects ? fighterInstance.weapon.effects.find(e => e.type === 'aoe_melee') : null;
                if (aoeMeleeEffect && fighterInstance.weapon.type === 'melee') {
                    createAoeIndicator(fighterInstance.x, fighterInstance.y, aoeMeleeEffect.radius);
                    let targetsHit = 0;
                    currentFighters.filter(f => f.alive && (aoeMeleeEffect.selfImmune ? f.id !== fighterInstance.id : true)).forEach(potentialVictim => {
                        if (getDistance(fighterInstance, potentialVictim) <= aoeMeleeEffect.radius) {
                            let damageMult = (potentialVictim.id === targetFighter.id) ? 1.0 : (aoeMeleeEffect.subDamageFactor || 0.7);
                            performAttackDamage(fighterInstance, potentialVictim, fighterInstance.weapon, damageMult);
                            targetsHit++;
                        }
                    });
                    if (targetsHit > 1) addExperience(fighterInstance, 'aoe_hit_multiple', (targetsHit -1));
                } else if (fighterInstance.weapon.type === 'melee') {
                    performAttackDamage(fighterInstance, targetFighter, fighterInstance.weapon);
                } else if (fighterInstance.weapon.type === 'ranged') {
                    createAndAnimateProjectile(fighterInstance, targetFighter, fighterInstance.weapon);
                }
                baseCooldown = Math.max(1, Math.round( (10 / (fighterInstance.weapon?.speed || 1)) / 2) );
            } else { fighterInstance.currentAction = null; fighterInstance.target = null;}
            break;
        case 'move_to_attack':
        case 'retreat':
        case 'reposition':
            if (moveSpeed > 0) {
                let destX = action.destX;
                let destY = action.destY;
                if (action.type === 'move_to_attack') {
                    if (targetFighter) { destX = targetFighter.x; destY = targetFighter.y; }
                    else { fighterInstance.currentAction = null; fighterInstance.target = null; baseCooldown = 1; break; }
                }
                 destX = Math.max(FIGHTER_WIDTH / 2, Math.min(ARENA_WIDTH - FIGHTER_WIDTH / 2, destX));
                 destY = Math.max(FIGHTER_HEIGHT / 2, Math.min(ARENA_HEIGHT - FIGHTER_HEIGHT / 2, destY));
                const dx = destX - fighterInstance.x;
                const dy = destY - fighterInstance.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > moveSpeed) {
                    fighterInstance.x += (dx / dist) * moveSpeed;
                    fighterInstance.y += (dy / dist) * moveSpeed;
                } else {
                    fighterInstance.x = destX;
                    fighterInstance.y = destY;
                    if (action.type === 'retreat' || action.type === 'reposition') fighterInstance.currentAction = null;
                }
                fighterInstance.x = Math.max(FIGHTER_WIDTH / 2, Math.min(ARENA_WIDTH - FIGHTER_WIDTH / 2, fighterInstance.x));
                fighterInstance.y = Math.max(FIGHTER_HEIGHT / 2, Math.min(ARENA_HEIGHT - FIGHTER_HEIGHT / 2, fighterInstance.y));
            }
            baseCooldown = 1;
            break;
        case 'pickup':
            if (targetBonus && moveSpeed > 0) {
                const currentPickupRadius = BONUS_PICKUP_RADIUS * (fighterInstance.pickupRadiusFactor || 1);
                const distToBonus = getDistance(fighterInstance, targetBonus);
                if (distToBonus <= currentPickupRadius) {
                    collectBonus(fighterInstance, targetBonus);
                    fighterInstance.currentAction = null;
                } else {
                    const dx = targetBonus.x - fighterInstance.x;
                    const dy = targetBonus.y - fighterInstance.y;
                    if (distToBonus > moveSpeed) {
                        fighterInstance.x += (dx / distToBonus) * moveSpeed;
                        fighterInstance.y += (dy / distToBonus) * moveSpeed;
                    } else {
                        fighterInstance.x = targetBonus.x;
                        fighterInstance.y = targetBonus.y;
                        if(targetBonus && arenaBonuses.includes(targetBonus) && getDistance(fighterInstance, targetBonus) <= currentPickupRadius) {
                            collectBonus(fighterInstance, targetBonus);
                        }
                        fighterInstance.currentAction = null;
                    }
                    fighterInstance.x = Math.max(FIGHTER_WIDTH / 2, Math.min(ARENA_WIDTH - FIGHTER_WIDTH / 2, fighterInstance.x));
                    fighterInstance.y = Math.max(FIGHTER_HEIGHT / 2, Math.min(ARENA_HEIGHT - FIGHTER_HEIGHT / 2, fighterInstance.y));
                }
            } else { fighterInstance.currentAction = null; }
            baseCooldown = 1;
            break;
        case 'idle':
            // ОТЛАДКА: Боец выбрал бездействие
            // console.log(`${fighterInstance.name} is idle. Ticks without action: ${fighterInstance.ticksWithoutAction}`);
            baseCooldown = 1;
            break;
        default:
            // console.log(`${fighterInstance.name} has unknown action type: ${action.type}`);
            baseCooldown = 1;
            break;
    }
    baseCooldown *= (fighterInstance.actionCooldownMultiplier || 1);
    fighterInstance.actionCooldown = Math.max(1, Math.round(baseCooldown));
    if(fighterInstance.actionCooldown > 0 && fighterInstance.currentAction?.type === 'attack') {
        if (targetFighter && fighterInstance.combatStats?.learnedGrudges) {
            fighterInstance.combatStats.learnedGrudges[targetFighter.id] = (fighterInstance.combatStats.learnedGrudges[targetFighter.id] || 0) + 1;
        }
    }
}

function createAndAnimateProjectile(attackerInstance, targetInstance, weapon) {
    const projectileEl = createProjectileElement(attackerInstance, weapon);
    if (!projectileEl) return;
    const currentProjectileSpeed = PROJECTILE_SPEED * (attackerInstance.projectileSpeedFactor || 1);
    const startX = attackerInstance.x;
    const startY = attackerInstance.y - (FIGHTER_HEIGHT / 4);
    let targetPredictedX = targetInstance.x;
    let targetPredictedY = targetInstance.y - (FIGHTER_HEIGHT / 4);
    const estimatedTravelTimeTicks = getDistance({x: startX, y: startY}, {x:targetPredictedX, y:targetPredictedY}) / currentProjectileSpeed;

    if (targetInstance.currentAction && (targetInstance.currentAction.type === 'move_to_attack' || targetInstance.currentAction.type === 'retreat' || targetInstance.currentAction.type === 'reposition')) {
        const targetDestX = targetInstance.currentAction.destX || targetInstance.x;
        const targetDestY = targetInstance.currentAction.destY || targetInstance.y;
        const targetDx = targetDestX - targetInstance.x;
        const targetDy = targetDestY - targetInstance.y;
        const targetDist = Math.sqrt(targetDx*targetDx + targetDy*targetDy);
        if (targetDist > 0) {
            const targetMoveXPerTick = (targetDx / targetDist) * targetInstance.speed;
            const targetMoveYPerTick = (targetDy / targetDist) * targetInstance.speed;
            targetPredictedX += targetMoveXPerTick * estimatedTravelTimeTicks * 0.6;
            targetPredictedY += targetMoveYPerTick * estimatedTravelTimeTicks * 0.6;
        }
    }
    const dx = targetPredictedX - startX;
    const dy = targetPredictedY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) { if (projectileEl.parentElement) projectileEl.remove(); handleProjectileHit(attackerInstance, targetInstance, weapon, {x: startX, y: startY}); return; }
    const moveX = (dx / dist) * currentProjectileSpeed;
    const moveY = (dy / dist) * currentProjectileSpeed;
    let currentX = startX;
    let currentY = startY;
    const travelTicks = Math.max(1, Math.round(dist / currentProjectileSpeed));
    let ticksPassed = 0;
    let animationFrameId = null;

    function animateProjectileTick() {
        if (!roundInProgress || !attackerInstance.alive || !projectileEl.parentElement) {
            if (projectileEl.parentElement) projectileEl.remove();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            return;
        }
        ticksPassed++;
        currentX += moveX;
        currentY += moveY;
        projectileEl.style.left = `${currentX - (projectileEl.offsetWidth / 2 || 12)}px`;
        projectileEl.style.top = `${currentY - (projectileEl.offsetHeight / 2 || 12)}px`;
        const finalTargetCheck = currentFighters.find(f => f.id === targetInstance.id && f.alive);

        if (finalTargetCheck && getDistance({x: currentX, y: currentY}, {x: finalTargetCheck.x, y: finalTargetCheck.y - FIGHTER_HEIGHT/4}) < (FIGHTER_WIDTH / 2.5) ) {
            if (projectileEl.parentElement) projectileEl.remove();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            handleProjectileHit(attackerInstance, finalTargetCheck, weapon, {x: currentX, y: currentY}); return;
        }
        if (ticksPassed >= travelTicks || currentX < -projectileEl.offsetWidth || currentX > ARENA_WIDTH || currentY < -projectileEl.offsetHeight || currentY > ARENA_HEIGHT) {
            if (projectileEl.parentElement) projectileEl.remove();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            const finalTarget = currentFighters.find(f => f.id === targetInstance.id && f.alive);
            if (finalTarget && getDistance({x: currentX, y: currentY}, {x: finalTarget.x, y: finalTarget.y - FIGHTER_HEIGHT/4}) < (FIGHTER_WIDTH * 0.6) ) {
                 handleProjectileHit(attackerInstance, finalTarget, weapon, {x: currentX, y: currentY});
            }
        } else { animationFrameId = requestAnimationFrame(animateProjectileTick); }
    }
    animationFrameId = requestAnimationFrame(animateProjectileTick);
}

function handleProjectileHit(attackerInstance, finalTargetInstance, weapon, hitCoords) {
    const aoeRangedEffect = weapon.effects ? weapon.effects.find(e => e.type === 'aoe_ranged') : null;
    if (aoeRangedEffect && aoeRangedEffect.radius) {
        createAoeIndicator(hitCoords.x, hitCoords.y, aoeRangedEffect.radius);
        let mainTargetWasHitInAoe = false;
        let targetsHitCount = 0;
        currentFighters.filter(f => f.alive).forEach(potentialVictim => {
            if (getDistance(hitCoords, potentialVictim) <= aoeRangedEffect.radius) {
                if (potentialVictim.id === attackerInstance.id && aoeRangedEffect.selfImmune && !aoeRangedEffect.damageSelfIfTargeted) return;
                let aoeDamageMultiplier = 1.0;
                if (finalTargetInstance && potentialVictim.id !== finalTargetInstance.id && aoeRangedEffect.subDamageFactor !== undefined) {
                    aoeDamageMultiplier = aoeRangedEffect.subDamageFactor;
                } else if (!finalTargetInstance && aoeRangedEffect.subDamageFactor !== undefined) {
                    aoeDamageMultiplier = aoeRangedEffect.subDamageFactor;
                }
                if (potentialVictim.id === attackerInstance.id && !aoeRangedEffect.selfImmune && aoeRangedEffect.subDamageFactor !== undefined) {
                    aoeDamageMultiplier = aoeRangedEffect.subDamageFactor;
                }
                performAttackDamage(attackerInstance, potentialVictim, weapon, aoeDamageMultiplier);
                targetsHitCount++;
                if (finalTargetInstance && potentialVictim.id === finalTargetInstance.id) mainTargetWasHitInAoe = true;
            }
        });
        if (finalTargetInstance && !mainTargetWasHitInAoe && getDistance(hitCoords, finalTargetInstance) < FIGHTER_WIDTH / 1.5) {
             if (!(finalTargetInstance.id === attackerInstance.id && aoeRangedEffect.selfImmune && !aoeRangedEffect.damageSelfIfTargeted)) {
                 performAttackDamage(attackerInstance, finalTargetInstance, weapon, 1.0);
                 targetsHitCount = Math.max(1, targetsHitCount);
             }
        }
        if (targetsHitCount > 1) addExperience(attackerInstance, 'aoe_hit_multiple', (targetsHitCount - 1));
    } else if (finalTargetInstance) {
        performAttackDamage(attackerInstance, finalTargetInstance, weapon);
    }
}

function performAttackDamage(attackerInstance, targetInstance, weaponToUse, damageMultiplier = 1.0) {
    if (!targetInstance.alive || !attackerInstance.alive || !weaponToUse) return;
    lastDamageTimestamp = Date.now();
    const isSilenced = attackerInstance.statusEffects?.oe_silence_effect;

    let attackerMissChance = attackerInstance.permanentStatsAppliedToRound?.missChanceDebuff || 0;
    if (attackerInstance.statusEffects?.oe_accuracy_debuff_effect?.missChance) {
        attackerMissChance += attackerInstance.statusEffects.oe_accuracy_debuff_effect.missChance;
    }
    if (attackerMissChance > 0 && Math.random() < attackerMissChance) {
        logMessage(`${attackerInstance.name} <span class="log-effect">промахивается</span>!`, "log-effect"); return;
    }

    const isCrit = Math.random() < (weaponToUse.critChance || 0);
    let damage = getRandomInt(weaponToUse.minDamage || 0, weaponToUse.maxDamage || 0);

    if (attackerInstance.permanentStatsAppliedToRound?.hunterInstinctDamageBonus > 0) {
        const aliveOpponents = currentFighters.filter(f => f.alive && f.id !== attackerInstance.id);
        if (aliveOpponents.length > 0) {
            const maxHealthOpponent = aliveOpponents.reduce((prev, curr) => (curr.health / curr.maxHealth) > (prev.health / prev.maxHealth) ? curr : prev, aliveOpponents[0]);
            if (targetInstance.id === maxHealthOpponent.id) {
                damage = Math.round(damage * (1 + attackerInstance.permanentStatsAppliedToRound.hunterInstinctDamageBonus));
            }
        }
    }
    if (attackerInstance.permanentStatsAppliedToRound?.battleAura?.radius > 0 && getDistance(attackerInstance, targetInstance) <= attackerInstance.permanentStatsAppliedToRound.battleAura.radius) {
        damage = Math.round(damage * (1 + attackerInstance.permanentStatsAppliedToRound.battleAura.damageIncreasePercent));
    }

    if (isCrit) {
        if (targetInstance.canNullifyCrit) {
            logMessage(`${targetInstance.name} <span class="log-armor-block">поглощает крит</span> ${attackerInstance.name} щитом!`, "log-armor-block");
            targetInstance.canNullifyCrit = false;
            const critDefEffect = targetInstance.statusEffects?.oe_crit_defense_effect;
            if (critDefEffect) {
                 if (typeof critDefEffect.onRemove === 'function') critDefEffect.onRemove(targetInstance, critDefEffect);
                 delete targetInstance.statusEffects.oe_crit_defense_effect;
                 updateFighterElementOnArena(targetInstance);
            }
            return;
        }
        damage = Math.round(damage * 1.5 * (targetInstance.critDamageTakenMultiplier || 1));
        attackerInstance.achievementsTrackers.critHits = (attackerInstance.achievementsTrackers.critHits || 0) + 1;
    }

    let finalDamageOutputMultiplier = attackerInstance.damageOutputMultiplier || 1;
    if (attackerInstance.permanentStatsAppliedToRound?.enrageSettings?.thresholdPercent &&
        attackerInstance.health < attackerInstance.maxHealth * attackerInstance.permanentStatsAppliedToRound.enrageSettings.thresholdPercent) {
        finalDamageOutputMultiplier *= (1 + attackerInstance.permanentStatsAppliedToRound.enrageSettings.damageBonus);
        // Добавляем класс enraged элементу бойца, если он еще не добавлен через statusEffect
        if (attackerInstance.element && !attackerInstance.element.classList.contains('enraged') && !attackerInstance.statusEffects?.oe_damage_boost_effect) {
            attackerInstance.element.classList.add('enraged');
            // Этот класс будет снят при обновлении здоровья или если эффект ярости закончится
        }
    } else {
        // Убираем класс enraged, если здоровье выше порога и нет другого эффекта ярости
        if (attackerInstance.element && attackerInstance.element.classList.contains('enraged') && !attackerInstance.statusEffects?.oe_damage_boost_effect) {
            attackerInstance.element.classList.remove('enraged');
        }
    }


    const attackerSessionData = fightersSessionData.find(f => f.id === attackerInstance.id);
    if (attackerSessionData?.titles?.some(t => t.titleId === 'killer' && TITLES.killer.effects.damageMultiplierAdd && t.durationRoundsLeft > 0)) {
        finalDamageOutputMultiplier *= (1 + TITLES.killer.effects.damageMultiplierAdd);
    }

    damage = Math.round(damage * finalDamageOutputMultiplier);
    damage = Math.round(damage * damageMultiplier);

    const targetEvasionRoll = Math.random();
    if (targetEvasionRoll < (targetInstance.evasionChance || 0) && !(weaponToUse.effects?.some(e => e.type === 'aoe_melee' || e.type === 'aoe_ranged'))) {
        logMessage(`${targetInstance.name} <span class="log-evasion">уклоняется</span> от атаки ${attackerInstance.name}!`, "log-evasion");
        addExperience(targetInstance, 'evade_attack');
        targetInstance.achievementsTrackers.successfulEvasionsThisRound = (targetInstance.achievementsTrackers.successfulEvasionsThisRound || 0) + 1;
        if (targetInstance.combatStats?.intellect?.defense > 2) logIntellectAction(targetInstance, 'defense', 'Уклонился!');
        return;
    }

    const armorPierceEffect = weaponToUse.effects?.find(e => e.type === 'armor_pierce');
    const piercesArmor = armorPierceEffect && (Math.random() < (armorPierceEffect.chance || 0.0));
    const damageResult = applyDamage(targetInstance, damage, attackerInstance, isCrit, weaponToUse.name, piercesArmor, weaponToUse.type === 'melee');

    if (!isSilenced && (damageResult.damageApplied > 0 || (damageResult.blockedByArmor && piercesArmor))) {
        applyWeaponSpecialEffects(attackerInstance, targetInstance, weaponToUse, damageResult.damageApplied);
    }
}

function applyDamage(targetInstance, damage, attackerInfo, isCrit, sourceName = "атака", piercesArmor = false, isMeleeAttack = false, ignoreArmorDamageType = false) {
    if (!targetInstance.alive) return { damageApplied: 0, blockedByArmor: false };
    lastDamageTimestamp = Date.now();

    if (targetInstance.isInvulnerable) {
        logMessage(`${targetInstance.name} <span class="log-evasion">неуязвим</span> и не получает урона от ${attackerInfo.name || "источника"}!`, "log-evasion");
        return { damageApplied: 0, blockedByArmor: false };
    }

    let actualDamage = damage;
    let blockedByArmorThisHit = false;
    const attackerName = attackerInfo.name || "Неизвестный источник";
    const attackerId = attackerInfo.id || null;

    let finalDamageTakenMultiplier = targetInstance.damageTakenMultiplier || 1;
    finalDamageTakenMultiplier *= (targetInstance.permanentStatsAppliedToRound?.baseDamageTakenDebuffMultiplier || 1);
    actualDamage = Math.round(actualDamage * finalDamageTakenMultiplier);

    if (targetInstance.vulnerabilityBonusNextHitFactor && targetInstance.vulnerabilityBonusNextHitFactor > 1) {
        actualDamage = Math.round(actualDamage * targetInstance.vulnerabilityBonusNextHitFactor);
        logMessage(`${targetInstance.name} получает <span class="log-crit-damage">усиленный урон</span> по слабому месту! (x${targetInstance.vulnerabilityBonusNextHitFactor.toFixed(1)})`, "log-crit-damage");
        delete targetInstance.vulnerabilityBonusNextHitFactor;
        const vulnEffect = targetInstance.statusEffects?.oe_vulnerability_effect;
        if (vulnEffect?.oneTimeUse) {
            if (typeof vulnEffect.onRemove === 'function') vulnEffect.onRemove(targetInstance, vulnEffect);
            delete targetInstance.statusEffects.oe_vulnerability_effect;
        }
    }

    if (targetInstance.hasArmor && targetInstance.armorHits > 0 && !piercesArmor && !ignoreArmorDamageType) {
        targetInstance.armorHits--;
        blockedByArmorThisHit = true;
        actualDamage = 0;
        logMessage(`🛡️ <span class="log-armor-block">Броня ${targetInstance.name} поглощает удар от ${attackerName}! (Осталось: ${targetInstance.armorHits})</span>`, "log-armor-block");
        showDamageFlash(targetInstance, false, true); showHitSpark(targetInstance, false, true);
        addExperience(targetInstance, 'block_attack');
        if (targetInstance.armorHits <= 0) {
            targetInstance.hasArmor = false;
            logMessage(`💔 <span class="log-armor">Броня ${targetInstance.name} сломана!</span>`, "log-armor");
        }
        updateFighterElementOnArena(targetInstance);
        return { damageApplied: 0, blockedByArmor: true };
    }
    if (piercesArmor && targetInstance.hasArmor) {
        logMessage(`⚡ <span class="log-effect">${attackerName} пробивает броню ${targetInstance.name}!</span>`, "log-effect");
    }

    if (targetInstance.kineticBarrierActive?.hitsLeft > 0) {
        actualDamage = Math.round(actualDamage * targetInstance.kineticBarrierActive.damageReductionFactor);
        targetInstance.kineticBarrierActive.hitsLeft--;
        logMessage(`${targetInstance.name} <span class="log-armor-block">снижает урон</span> кин. барьером! (Зарядов: ${targetInstance.kineticBarrierActive.hitsLeft})`, "log-armor-block");
        if (targetInstance.kineticBarrierActive.hitsLeft <= 0) {
            const effectData = targetInstance.kineticBarrierActive; delete targetInstance.kineticBarrierActive;
            const k = Object.keys(targetInstance.statusEffects).find(key => targetInstance.statusEffects[key] === effectData);
            if (k && typeof targetInstance.statusEffects[k]?.onRemove === 'function') { targetInstance.statusEffects[k].onRemove(targetInstance, targetInstance.statusEffects[k]); delete targetInstance.statusEffects[k];}
        }
    }
    if (targetInstance.reactiveArmorCharge?.charges > 0 && actualDamage >= targetInstance.reactiveArmorCharge.threshold) {
        logMessage(`${targetInstance.name} <span class="log-effect">активирует реактивную броню</span>!`, "log-effect");
        targetInstance.reactiveArmorCharge.charges--;
        currentFighters.filter(f => f.alive && f.id !== targetInstance.id && getDistance(targetInstance, f) < 100).forEach(oF => {
            const dx = oF.x - targetInstance.x, dy = oF.y - targetInstance.y, dist = Math.sqrt(dx*dx+dy*dy);
            if (dist > 0) { oF.x += (dx/dist)*targetInstance.reactiveArmorCharge.pushDistance; oF.y += (dy/dist)*targetInstance.reactiveArmorCharge.pushDistance;
                oF.x = Math.max(FIGHTER_WIDTH/2,Math.min(ARENA_WIDTH-FIGHTER_WIDTH/2,oF.x)); oF.y = Math.max(FIGHTER_HEIGHT/2,Math.min(ARENA_HEIGHT-FIGHTER_HEIGHT/2,oF.y)); updateFighterElementOnArena(oF); }
        });
        if (targetInstance.reactiveArmorCharge.charges <= 0) {
            const effectData = targetInstance.reactiveArmorCharge; delete targetInstance.reactiveArmorCharge;
            const k = Object.keys(targetInstance.statusEffects).find(key => targetInstance.statusEffects[key] === effectData);
            if (k && typeof targetInstance.statusEffects[k]?.onRemove === 'function') { targetInstance.statusEffects[k].onRemove(targetInstance, targetInstance.statusEffects[k]); delete targetInstance.statusEffects[k];}
        }
    }

    actualDamage = Math.max(0, actualDamage);
    targetInstance.health -= actualDamage;
    targetInstance.achievementsTrackers.damageTakenThisRound += actualDamage;

    if (attackerId && !String(attackerId).startsWith('status-') && !String(attackerId).startsWith('orbital_effect')) {
        targetInstance.lastDamagedBy = attackerId;
        const attackingInst = currentFighters.find(f => f.id === attackerId);
        if (attackingInst) attackingInst.damageDealtThisRound += actualDamage;
    }

    showDamageFlash(targetInstance, isCrit, false);
    showHitSpark(targetInstance, isCrit, false);
    if (targetInstance.element) targetInstance.element.classList.add('hit');
    setTimeout(() => { if (targetInstance.element) targetInstance.element.classList.remove('hit'); }, 150);

    if (actualDamage > 0) {
        logMessage(`${attackerName} (${sourceName}) наносит <span class="${isCrit ? "log-crit-damage" : "log-damage"}">${actualDamage}</span> урона ${targetInstance.name}. (ОЗ: ${Math.max(0, targetInstance.health)})`, isCrit ? "log-crit-damage" : "log-damage");
    }

    if (targetInstance.statusEffects?.oe_thorns_effect && isMeleeAttack && actualDamage > 0) {
         const thornDmg = targetInstance.statusEffects.oe_thorns_effect.reflectDamage || 0;
         if (thornDmg > 0 && attackerId && !String(attackerId).startsWith('status-')) {
             const origAttackerInst = currentFighters.find(f => f.id === attackerId);
             if (origAttackerInst?.alive) {
                logMessage(`🌵 <span style="color:#795548;">Шипы ${targetInstance.name} наносят ${thornDmg} урона ${origAttackerInst.name}!</span>`, "log-effect");
                applyDamage(origAttackerInst, thornDmg, {name: "Шипы", id: `thorns-${targetInstance.id}`}, false, "отражение шипов", false, false, true);
             }
         }
    }
    if (targetInstance.statusEffects?.oe_shared_pain_effect && actualDamage > 0) {
        const linkEff = targetInstance.statusEffects.oe_shared_pain_effect;
        const sharedDmg = Math.round(actualDamage * linkEff.percent);
        if (sharedDmg > 0) {
            const others = currentFighters.filter(f => f.alive && f.id !== targetInstance.id && f.id !== attackerId);
            if (others.length > 0) {
                const victim = others[getRandomInt(0, others.length - 1)];
                logMessage(`🔗 <span style="color:darkgreen;">Связь передает ${sharedDmg} урона от ${targetInstance.name} к ${victim.name}!</span>`, "log-effect");
                applyDamage(victim, sharedDmg, {name: "Паразит. связь", id: `link-${targetInstance.id}`}, false, "связь", true, false, true);
            }
        }
    }

    if (targetInstance.health <= 0) {
        targetInstance.health = 0;
        targetInstance.alive = false;
        if (targetInstance.element) {
            targetInstance.element.classList.remove('breathing');
            targetInstance.element.classList.add('defeated');
        }
        defeatedFightersOrder.push(targetInstance.id);
        logMessage(`${targetInstance.name} <span class="log-kill">повержен</span> от руки ${attackerName}!`, "log-kill");

        if (attackerId && !String(attackerId).startsWith('status-') && !String(attackerId).startsWith('orbital_effect')) {
            const attackingInst = currentFighters.find(f => f.id === attackerId);
            if (attackingInst) {
                attackingInst.killsThisRound = (attackingInst.killsThisRound || 0) + 1;
                attackingInst.achievementsTrackers.killsThisRound = attackingInst.killsThisRound;
                attackingInst.achievementsTrackers.killedTargetIds.push(targetInstance.id);
                if (isCrit) attackingInst.achievementsTrackers.critKills = (attackingInst.achievementsTrackers.critKills || 0) + 1;

                let expMult = 1 + (attackingInst.permanentStatsAppliedToRound?.bonusKillExpPercent || 0);
                const targetSessionForAch = fightersSessionData.find(f=>f.id === targetInstance.id);
                const attackerSessionForAch = fightersSessionData.find(f=>f.id === attackerId);

                const sortedByWinsForAch = [...fightersSessionData].filter(f => f.participatingInGameSession).sort((a, b) => (b.wins || 0) - (a.wins || 0));
                const currentLeaderIdForAch = sortedByWinsForAch.length > 0 ? sortedByWinsForAch[0].id : null;
                if (targetInstance.id === currentLeaderIdForAch && attackerId !== currentLeaderIdForAch) {
                    addExperience(attackingInst, 'leader_hunter_reward', expMult);
                }

                addExperience(attackingInst, 'kill', expMult);
                if (targetSessionForAch && attackerSessionForAch && (getTotalIntellect(targetSessionForAch) > getTotalIntellect(attackerSessionForAch) + 2 || targetSessionForAch.wins > attackerSessionForAch.wins)) {
                   addExperience(attackingInst, 'defeat_dangerous_enemy', expMult);
                } else {
                   addExperience(attackingInst, 'kill_major_boost', expMult);
                }
                if (!roundGlobalAchievements.firstBlood) {
                     addExperience(attackingInst, 'first_blood', expMult);
                }
            }
        }
    } else {
        if (attackerId && !String(attackerId).startsWith('status-') && targetInstance.combatStats?.learning?.dangerousEnemies) {
            targetInstance.combatStats.learning.dangerousEnemies[attackerId] = (targetInstance.combatStats.learning.dangerousEnemies[attackerId] || 0) + actualDamage;
        }
    }
    updateFighterElementOnArena(targetInstance);
    return { damageApplied: actualDamage, blockedByArmor: false };
}
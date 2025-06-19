// --- STATUS EFFECTS LOGIC ---

/**
 * Применяет статусный эффект к цели.
 * @param {object} targetFighterInstance - Инстанс бойца из currentFighters.
 * @param {string} effectTypeKey - Ключ типа эффекта из STATUS_EFFECT_DEFINITIONS.
 * @param {object} details - Дополнительные детали для эффекта (например, duration, dps, originalValue).
 */
function applyStatusEffect(targetFighterInstance, effectTypeKey, details) {
    if (!targetFighterInstance || !targetFighterInstance.statusEffects || !STATUS_EFFECT_DEFINITIONS[effectTypeKey]) {
        console.warn(`Cannot apply effect: Invalid target, statusEffects, or definition for ${effectTypeKey}`);
        return;
    }

    const existingEffect = targetFighterInstance.statusEffects[effectTypeKey];

    if (existingEffect && !details.forceReapply) {
        if (details.duration && existingEffect.duration < details.duration) {
            existingEffect.duration = details.duration; // Обновляем длительность, если новый эффект дольше
            if (!details.isReapplyLogSuppressed) {
                logMessage(`Длительность эффекта <span class="log-effect">${effectTypeKey.replace('_effect','').replace('oe_','')}</span> на ${targetFighterInstance.name} обновлена.`, "log-effect");
            }
        }
        // Если эффект стакается по силе (например, dps яда), можно добавить логику здесь
        // if (details.dps && existingEffect.dps) existingEffect.dps = Math.max(existingEffect.dps, details.dps);
        return; // Не применяем заново, если только не forceReapply
    }

    const effectData = { ...STATUS_EFFECT_DEFINITIONS[effectTypeKey], ...details };
    effectData.effectKey = effectTypeKey;

    if (existingEffect && typeof existingEffect.onRemove === 'function') {
        try {
            existingEffect.onRemove(targetFighterInstance, existingEffect);
        } catch (error) {
            console.error(`Error during onRemove for existing effect ${effectTypeKey} on ${targetFighterInstance.name}:`, error);
        }
    }

    targetFighterInstance.statusEffects[effectTypeKey] = effectData;

    if (typeof effectData.onApply === 'function') {
        try {
            effectData.onApply(targetFighterInstance, effectData);
        } catch (error) {
            console.error(`Error during onApply for effect ${effectTypeKey} on ${targetFighterInstance.name}:`, error);
        }
    }

    if (!details.isReapplyLogSuppressed) {
        const durationText = effectData.duration && effectData.duration > 0 ? `(${(effectData.duration * GAME_SPEED / 1000).toFixed(1)}с)` : '(мгновенно)';
        // Не логируем мгновенные эффекты без видимого изменения, если нет специального сообщения
        if (effectData.duration > 0 || effectTypeKey.includes('heal') || effectTypeKey.includes('damage') || effectTypeKey.includes('shield') || effectTypeKey.includes('xp')) {
             logMessage(`${targetFighterInstance.name} получает эффект: <span class="log-effect">${effectTypeKey.replace('_effect','').replace('oe_','')}</span> ${durationText}`, "log-effect");
        }
    }
    updateFighterElementOnArena(targetFighterInstance);
}


function processStatusEffects(fighterInstance) {
    if (!fighterInstance?.statusEffects || !fighterInstance.alive) return;

    const effectsToRemove = [];

    for (const effectKey in fighterInstance.statusEffects) {
        const effect = fighterInstance.statusEffects[effectKey];

        if (effect.duration !== undefined && !isNaN(effect.duration)) {
            effect.duration--;
            if (effect.duration <= 0) {
                effectsToRemove.push(effectKey);
            }
        }

        if (fighterInstance.alive) { // Тиковые эффекты только для живых
            if ((effectKey === 'poison' || effectKey === 'burn') && effect.dps > 0) {
                applyDamage(fighterInstance, effect.dps, { name: effectKey, id: `status-${effectKey}` }, false, `${effectKey} (эффект)`, true, false, true);
            } else if (effectKey === 'oe_health_burn_percent_effect' && effect.dpsPercent > 0) {
                const damage = Math.max(1, Math.round(fighterInstance.maxHealth * effect.dpsPercent));
                applyDamage(fighterInstance, damage, { name: "Едкие Споры", id: "status-oe_health_burn_percent" }, false, "едкие споры", true, false, true);
            } else if (effectKey === 'oe_swift_retreat_effect' && effect.healthThresholdPercent) {
                if (!effect.isActive && !effect.triggeredThisRound && fighterInstance.health < fighterInstance.maxHealth * effect.healthThresholdPercent) {
                    effect.isActive = true;
                    effect.triggeredThisRound = true;
                    effect.originalSpeed = fighterInstance.speed;
                    fighterInstance.speed *= effect.speedBonusFactor;
                    effect.duration = effect.activeDurationTicks; // Длительность активной фазы
                    logMessage(`<span style="color:orangered;">${fighterInstance.name} АКТИВИРУЕТ Прилив Адреналина! Скорость резко увеличена!</span>`, "log-effect");
                    if (effect.duration <= 0 && !effectsToRemove.includes(effectKey)) effectsToRemove.push(effectKey); // Сразу на удаление, если активная фаза 0
                }
            } else if (effectKey === 'oe_gravity_well_effect' && effect.radius > 0) {
                currentFighters.forEach(f => {
                    if (f.alive) {
                        const distToWell = getDistance(f, { x: effect.x, y: effect.y });
                        if (distToWell < effect.radius && distToWell > 5) {
                            const dx = effect.x - f.x;
                            const dy = effect.y - f.y;
                            const pullForce = Math.min(5, (f.baseSpeed * effect.strength) / (distToWell * 0.1 + 1));
                            const moveX = (dx / distToWell) * pullForce;
                            const moveY = (dy / distToWell) * pullForce;
                            f.x += moveX;
                            f.y += moveY;
                            f.x = Math.max(FIGHTER_WIDTH / 2, Math.min(ARENA_WIDTH - FIGHTER_WIDTH / 2, f.x));
                            f.y = Math.max(FIGHTER_HEIGHT / 2, Math.min(ARENA_HEIGHT - FIGHTER_HEIGHT / 2, f.y));
                            updateFighterElementOnArena(f);
                        }
                    }
                });
            }
            // Регенерация от спец. действия
            if (fighterInstance.temporaryRoundBonuses?.healthRegenPerTick > 0 && fighterInstance.health < fighterInstance.maxHealth) {
                // Проверяем интервал
                if (!fighterInstance.temporaryRoundBonuses._regenTickCounter) fighterInstance.temporaryRoundBonuses._regenTickCounter = 0;
                fighterInstance.temporaryRoundBonuses._regenTickCounter++;
                const ticksPerRegen = Math.max(1, Math.round((fighterInstance.temporaryRoundBonuses.healthRegenInterval * 1000) / GAME_SPEED));
                if (fighterInstance.temporaryRoundBonuses._regenTickCounter >= ticksPerRegen) {
                    fighterInstance.health = Math.min(fighterInstance.maxHealth, fighterInstance.health + fighterInstance.temporaryRoundBonuses.healthRegenPerTick);
                    fighterInstance.temporaryRoundBonuses._regenTickCounter = 0;
                    // logMessage(`${fighterInstance.name} регенерирует ${fighterInstance.temporaryRoundBonuses.healthRegenPerTick} ОЗ.`, "log-bonus"); // Можно раскомментировать для отладки
                }
            }
        }

        if (effect.duration !== undefined && effect.duration <= 0 && !effectsToRemove.includes(effectKey)) {
            effectsToRemove.push(effectKey);
        }
    }

    effectsToRemove.forEach(effectKeyToRemove => {
        const effectToRemove = fighterInstance.statusEffects[effectKeyToRemove];
        if (!effectToRemove) return;

        if (typeof effectToRemove.onRemove === 'function') {
            try {
                effectToRemove.onRemove(fighterInstance, effectToRemove);
            } catch (error) {
                console.error(`Error during onRemove for effect ${effectKeyToRemove} on ${fighterInstance.name}:`, error);
            }
        } else {
            // Стандартные действия при снятии некоторых эффектов, если onRemove не определен в самом эффекте
            if (effectKeyToRemove === 'slow' && fighterInstance.baseSpeed) {
                fighterInstance.speed = fighterInstance.baseSpeed;
            } else if (effectKeyToRemove === 'enrage' && effectToRemove.damageMultiplier && fighterInstance.damageOutputMultiplier) {
                // Этот эффект (enrage из WEAPONS) обычно не имеет onRemove, так как его влияние учитывается в permanentStats.
                // Но если бы это был временный enrage, то так:
                // fighterInstance.damageOutputMultiplier /= effectToRemove.damageMultiplier;
            } else if (effectKeyToRemove === 'oe_swift_retreat_effect' && effectToRemove.isActive) {
                fighterInstance.speed = effectToRemove.originalSpeed; // Восстанавливаем скорость
                effectToRemove.isActive = false;
            }
        }

        delete fighterInstance.statusEffects[effectKeyToRemove];
        // Логируем только если боец жив или эффект не был мгновенным и имел длительность
        if ((fighterInstance.alive || effectToRemove.duration >= 0) && effectToRemove.duration !== undefined) {
            logMessage(`Эффект <span class="log-effect">${effectKeyToRemove.replace('_effect','').replace('oe_','')}</span> на ${fighterInstance.name} прошел.`, "log-effect");
        }

        if (effectKeyToRemove.startsWith('oe_')) {
            const orbitalDef = ORBITAL_EFFECTS_POOL.find(def => def.id === effectKeyToRemove);
            if (orbitalDef?.duration > 0) {
                const highlightClass = orbitalDef.type === 'buff' ? 'orbital-buff-active' : 'orbital-debuff-active';
                removeOrbitalEffectHighlight(fighterInstance, highlightClass);
            }
        }
    });

    if (Object.keys(fighterInstance.statusEffects).length > 0 || effectsToRemove.length > 0) {
        updateFighterElementOnArena(fighterInstance);
    }
}

function applyWeaponSpecialEffects(attackerInstance, targetInstance, weaponUsed, actualDamageDealt) {
    if (!attackerInstance?.alive || !targetInstance?.alive || !weaponUsed || actualDamageDealt <= 0) return;

    const isSilenced = attackerInstance.statusEffects?.oe_silence_effect;
    if (isSilenced) {
        // logMessage(`${attackerInstance.name} не может использовать спецэффекты оружия из-за молчания!`, "log-effect"); // Можно добавить лог
        return;
    }

    if (weaponUsed.effects) {
        weaponUsed.effects.forEach(effect => {
            if (Math.random() < (effect.chance || 1.0)) {
                if (effect.type === 'lifesteal' && effect.percent) {
                    const healed = Math.round(actualDamageDealt * effect.percent);
                    if (healed > 0) {
                        attackerInstance.health = Math.min(attackerInstance.maxHealth, attackerInstance.health + healed);
                        logMessage(`${attackerInstance.name} <span class="log-bonus">восстанавливает ${healed} ОЗ</span> (оружие)!`, "log-bonus");
                        updateFighterElementOnArena(attackerInstance);
                    }
                } else if ((effect.type === 'pull' || effect.type === 'push') && effect.distance) {
                    const distEffect = effect.distance * (effect.type === 'pull' ? -1 : 1);
                    const dx = targetInstance.x - attackerInstance.x;
                    const dy = targetInstance.y - attackerInstance.y;
                    const currentDist = Math.sqrt(dx * dx + dy * dy);
                    if (currentDist > 0) {
                        let moveX = (dx / currentDist) * distEffect;
                        let moveY = (dy / currentDist) * distEffect;
                        if (effect.type === 'pull' && Math.abs(distEffect) >= currentDist - (FIGHTER_WIDTH / 2)) {
                            targetInstance.x = attackerInstance.x + (dx / currentDist) * (FIGHTER_WIDTH / 2 + 5);
                            targetInstance.y = attackerInstance.y + (dy / currentDist) * (FIGHTER_HEIGHT / 2 + 5);
                        } else {
                            targetInstance.x += moveX;
                            targetInstance.y += moveY;
                        }
                        targetInstance.x = Math.max(FIGHTER_WIDTH / 2, Math.min(ARENA_WIDTH - FIGHTER_WIDTH / 2, targetInstance.x));
                        targetInstance.y = Math.max(FIGHTER_HEIGHT / 2, Math.min(ARENA_HEIGHT - FIGHTER_HEIGHT / 2, targetInstance.y));
                        logMessage(`${attackerInstance.name} ${effect.type === 'pull' ? 'притягивает' : 'отталкивает'} ${targetInstance.name} (оружие)!`, "log-effect");
                        updateFighterElementOnArena(targetInstance);
                    }
                }
                else if (['stun', 'poison', 'slow', 'root', 'burn'].includes(effect.type)) {
                    // Передаем dps и duration для poison и burn, duration для stun, root, slow
                    let effectDetails = { sourceId: attackerInstance.id };
                    if (effect.dps) effectDetails.dps = effect.dps;
                    if (effect.duration) effectDetails.duration = Math.round(effect.duration * 1000 / GAME_SPEED); // Конвертируем секунды в тики
                    if (effect.factor) effectDetails.factor = effect.factor;
                    applyStatusEffect(targetInstance, effect.type, effectDetails);
                }
            }
        });
    }

    if (attackerInstance.statusEffects?.oe_lifesteal_aura_effect) {
        const auraEffect = attackerInstance.statusEffects.oe_lifesteal_aura_effect;
        if (auraEffect.lifestealPercent) {
            const healed = Math.round(actualDamageDealt * auraEffect.lifestealPercent);
            if (healed > 0) {
                attackerInstance.health = Math.min(attackerInstance.maxHealth, attackerInstance.health + healed);
                logMessage(`${attackerInstance.name} <span class="log-bonus">восстанавливает ${healed} ОЗ</span> (аура вампиризма)!`, "log-bonus");
                updateFighterElementOnArena(attackerInstance);
            }
        }
    }
}
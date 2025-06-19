// --- GAME FLOW ---

function startGameAfterSetup() {
    console.log("startGameAfterSetup: Starting the first inter-round phase.");
    isInitialSetupPhase = false;
    isGameOver = false;
    roundCounter = 0;
    firstRoundStarted = false;
    updateScoreboardUI();
    startInterRoundPhase();
}

function startInterRoundPhase() {
    console.log(`Starting Inter-Round Phase for Round ${roundCounter + 1}.`);
    isInterRoundPhase = true;
    roundInProgress = false;
    if (gameLoopInterval) clearInterval(gameLoopInterval); gameLoopInterval = null;
    if (preRoundTimeoutId) clearTimeout(preRoundTimeoutId); preRoundTimeoutId = null;

    // Заголовок остается "Арена Гладиаторов"
    // if (mainTitleEl) mainTitleEl.textContent = `Арена Пирожков: Управление`;
    if (roundCounterDisplayEl) roundCounterDisplayEl.textContent = (roundCounter + 1).toString();

    let interRoundLogMessages = [];
    fightersSessionData.forEach(fighter => {
        if (!fighter.participatingInGameSession) return;
        if (fighter.economicUpgrades?.passiveIncomeLevel > 0) {
            const incomeUpgrade = ECONOMIC_UPGRADES.passiveIncome;
            const incomeAmount = incomeUpgrade.effect.amount * fighter.economicUpgrades.passiveIncomeLevel;
            fighter.currentGold += incomeAmount;
            interRoundLogMessages.push({ name: fighter.name, msg: `получает ${formatNumberWithCommas(incomeAmount)} пассивного дохода.` });
        }
        if (fighter.activePacts && fighter.activePacts.length > 0) {
            fighter.activePacts = fighter.activePacts.filter(pact => {
                if (pact.durationRoundsLeft !== "permanent" && typeof pact.durationRoundsLeft === 'number') {
                    if (pact.durationRoundsLeft === 1) {
                        if (pact.pactId === "miserPact" && ECONOMIC_PACTS.miserPact) {
                            const bonusPercent = ECONOMIC_PACTS.miserPact.effect.bonusPercent || 0;
                            const bonusGold = Math.round(fighter.currentGold * bonusPercent);
                            fighter.currentGold += bonusGold;
                            interRoundLogMessages.push({ name: fighter.name, msg: `завершил Пакт Скупости! +${formatNumberWithCommas(bonusGold)} бонусного золота.`});
                        }
                        logMessage(`Пакт "${ECONOMIC_PACTS[pact.pactId]?.name}" у ${fighter.name} истек.`, "log-effect");
                        return false;
                    }
                    pact.durationRoundsLeft--;
                }
                return true;
            });
        }
    });

    updateScoreboardUI();
    interRoundLogMessages.forEach(logEntry => {
        logMessage(`💰 ${logEntry.name} ${logEntry.msg}`, "log-bonus");
    });

    if (nextRoundButtonEl) {
        nextRoundButtonEl.textContent = `Начать Раунд ${roundCounter + 1}!`;
        nextRoundButtonEl.disabled = false;
        nextRoundButtonEl.style.display = 'inline-block';
    }

    if (arenaEl) arenaEl.innerHTML = '';
    clearOrbitalEffects();
    arenaBonuses.forEach(b => { if (b.element?.parentElement) b.element.remove(); });
    arenaBonuses = [];
    currentFighters = [];
    defeatedFightersOrder = [];
    duelContenders = null;
    activeRoundModifier = null;
    createFighterInstanceNamespace.commonWeaponThisRound = null;

    logMessage(`--- Фаза Управления Перед Раундом ${roundCounter + 1} ---`, "log-round-start");
    logMessage("Кликните на гладиатора в таблице для управления.", "log-effect");
    if (roundCounter === 0 && !firstRoundStarted) {
        logMessage(`Подготовьте гладиаторов к первой битве!`, "log-effect");
    }
}

function prepareAndStartRound() {
    if (roundInProgress || isGameOver || isInitialSetupPhase || !isInterRoundPhase) {
        console.warn("prepareAndStartRound: Cannot start, game/round state conflict."); return;
    }
    console.log(`Preparing and starting Round ${roundCounter + 1}`);

    isInterRoundPhase = false;
    if (fighterManagementOverlayEl && fighterManagementOverlayEl.classList.contains('active')) {
        closeFighterManagementModal();
    }
    if (nextRoundButtonEl) {
        nextRoundButtonEl.disabled = true;
        nextRoundButtonEl.textContent = 'Раунд Идет...';
    }

    roundCounter++;
    // Обновляем title страницы, чтобы там был номер раунда
    document.title = `Арена: Раунд ${roundCounter}`;
    logMessage(`⚔️ Раунд ${roundCounter} начинается! Бойцы выходят на арену...`, "log-round-start");
    roundGlobalAchievements = {};
    activeRoundModifier = null;
    if (roundCounter > 0 && Math.random() < MODIFIER_CHANCE_PER_ROUND) {
        activeRoundModifier = roundModifiers[getRandomInt(0, roundModifiers.length - 1)];
        logMessage(`🔮 МОДИФИКАТОР РАУНДА: <span class="log-modifier">${activeRoundModifier.name}</span>`, "log-modifier");
        logMessage(`<i>${activeRoundModifier.description}</i>`, "log-modifier");
    }
    if (roundCounter > 0 && roundCounter % 5 === 0) {
        createFighterInstanceNamespace.commonWeaponThisRound = deepCopy(WEAPONS[getRandomInt(0, WEAPONS.length - 1)]);
        logMessage(`💥 <span class='log-winner'>Спец-раунд! Все бойцы получают: ${createFighterInstanceNamespace.commonWeaponThisRound.name} ${createFighterInstanceNamespace.commonWeaponThisRound.emoji}</span>`, "log-winner");
    } else { createFighterInstanceNamespace.commonWeaponThisRound = null; }

    if (arenaEl) arenaEl.innerHTML = '';
    clearOrbitalEffects();
    arenaBonuses.forEach(b => { if (b.element?.parentElement) b.element.remove(); });
    arenaBonuses = [];
    defeatedFightersOrder = [];
    duelContenders = null;

    currentFighters = [];
    fightersSessionData.filter(fsd => fsd.participatingInGameSession).forEach(sessionFighter => {
        const fighterInstance = createFighterInstance(sessionFighter);
        if (activeRoundModifier && activeRoundModifier.apply) {
            activeRoundModifier.apply(fighterInstance);
        }
        currentFighters.push(fighterInstance);
    });

    if (currentFighters.length < 2) {
        logMessage("Недостаточно бойцов для начала раунда. Игра остановлена.", "log-kill");
        isGameOver = true; endGame(null, "Недостаточно участников для продолжения."); return;
    }
    currentFighters.forEach(fighterInstance => { createFighterElementOnArena(fighterInstance); });
    spawnInitialArenaBonuses();
    spawnInitialOrbitalEffects();
    updateScoreboardUI();

    logMessage("БОЙ НАЧИНАЕТСЯ!", "log-round-start");
    roundInProgress = true; firstRoundStarted = true; lastDamageTimestamp = Date.now(); userScrolledLog = false;
    gameLoopInterval = setInterval(gameTick, GAME_SPEED);
}

function gameTick() {
    if (!roundInProgress || isGameOver || isInitialSetupPhase || isInterRoundPhase || isGuideOpen) {
        return;
    }
    intelliActionLog = {}; // Сбрасываем лог действий для этого тика
    const aliveFighters = currentFighters.filter(f => f.alive);

    // Улучшенная проверка на "застой"
    let inactiveFightersCount = 0;
    let didAnyoneTakeSignificantActionThisTick = false;
    aliveFighters.forEach(f => {
        // Считаем бойца неактивным, если он долго не совершал осмысленных действий
        if (f.ticksWithoutAction * GAME_SPEED > STALL_TIMEOUT * 0.75) { // Порог для индивидуальной неактивности
            inactiveFightersCount++;
        }
        // Проверяем, было ли осмысленное действие (не idle и не reposition)
        if (f.currentAction && f.currentAction.type !== 'idle' && f.currentAction.type !== 'reposition') {
            didAnyoneTakeSignificantActionThisTick = true;
        }
    });

    const noDamageRecently = Date.now() - lastDamageTimestamp > STALL_TIMEOUT;
    // Если все живые бойцы долго неактивны (стоят или только маневрируют)
    const allEffectivelyIdle = aliveFighters.length > 0 && inactiveFightersCount === aliveFighters.length;
    // Если нет урона ДОЛГО ИЛИ (все живые стоят ИЛИ никто не делает осмысленных действий уже некоторое время)
    // И при этом есть хотя бы 2 живых бойца, и это не дуэль
    if (aliveFighters.length > 1 && !duelContenders &&
        ( noDamageRecently ||
          (allEffectivelyIdle && inactiveFightersCount > 0) ||
          (!didAnyoneTakeSignificantActionThisTick && Date.now() - lastDamageTimestamp > STALL_TIMEOUT / 2) // Если нет урона И нет активных действий (кроме idle/reposition)
        )
       ) {
        let stallReason = "Бездействие на арене";
        if (allEffectivelyIdle && aliveFighters.length > 1) { // Условие, что это не последний выживший
            stallReason = "Все активные бойцы не предпринимают решительных действий";
        } else if (!didAnyoneTakeSignificantActionThisTick && Date.now() - lastDamageTimestamp > STALL_TIMEOUT / 2 && aliveFighters.length > 1) {
            stallReason = "Бойцы не совершают активных действий";
        } else if (!noDamageRecently) { // Если причина не в общем простое по урону, то не перезапускаем
             stallReason = ""; // Сбрасываем причину, если не полный застой по урону
        }

        if (stallReason) {
            logMessage(`⏳ <span class='log-stall-restart'>${stallReason} слишком долго! Раунд перезапускается...</span>`, "log-stall-restart");
            endRound(true); return;
        }
    }


    if (aliveFighters.length <= 1 && roundInProgress) {
        endRound(false); return;
    }

    aliveFighters.forEach(fighterInstance => {
        if (!fighterInstance.alive) return;
        fighterInstance.achievementsTrackers.timeSurvivedThisRound = (fighterInstance.achievementsTrackers.timeSurvivedThisRound || 0) + (GAME_SPEED / 1000);
        if (fighterInstance.actionCooldown > 0) fighterInstance.actionCooldown--;
        processStatusEffects(fighterInstance);
        if (activeRoundModifier?.applyTick) activeRoundModifier.applyTick(fighterInstance);
        if (fighterInstance.alive && fighterInstance.actionCooldown <= 0 && !fighterInstance.statusEffects?.stun) {
            chooseAction(fighterInstance, aliveFighters, arenaBonuses);
            executeAction(fighterInstance);
        }
        updateFighterElementOnArena(fighterInstance);
    });
    manageArenaBonuses();
    updateOrbitalEffectsPosition();

    if (!duelContenders && aliveFighters.length === 2) {
        duelContenders = [...aliveFighters];
        logMessage(`⚔️ <span class="log-duel">ДУЭЛЬ!</span> ${duelContenders[0].name} против ${duelContenders[1].name}!`, "log-duel");
        duelContenders.forEach(f => { addExperience(f, 'target_priority_success'); f.achievementsTrackers.wonDuel = false; f.achievementsTrackers.enteredDuel = true; if(getTotalIntellect(f) >= 8) logIntellectAction(f, 'tactical', `вступает в дуэль!`); });
    } else if (duelContenders) {
        const [fighter1, fighter2] = duelContenders;
        if (!fighter1.alive || !fighter2.alive) {
            const duelWinner = fighter1.alive ? fighter1 : (fighter2.alive ? fighter2 : null);
            if (duelWinner) {
                duelWinner.achievementsTrackers.wonDuel = true;
                logMessage(`👑 <span class="log-winner">${duelWinner.name}</span> побеждает в дуэли!`, "log-winner");
                addExperience(duelWinner, 'defeat_dangerous_enemy');
            }
            duelContenders = null;
        }
    }
}

function endRound(isStallRestart = false) {
    if (!roundInProgress && !isStallRestart) { console.warn("endRound called, but round not in progress or not a stall restart."); return; }
    console.log(`Ending Round ${roundCounter}. Stall restart: ${isStallRestart}`);

    if (gameLoopInterval) clearInterval(gameLoopInterval); gameLoopInterval = null;
    roundInProgress = false;

    if (activeRoundModifier && activeRoundModifier.remove) {
        currentFighters.forEach(fInstance => { if (fInstance) activeRoundModifier.remove(fInstance); });
    }
    activeRoundModifier = null;

    if (isStallRestart) {
        logMessage(`🏁 <span class='log-stall-restart'>Раунд ${roundCounter} перезапускается из-за застоя...</span>`, "log-stall-restart");
        currentFighters.forEach(f => { if (f.element) removeFighterElementFromArena(f); });
        currentFighters = [];
        roundCounter--;
        startInterRoundPhase();
        return;
    }

    const aliveFightersAtEnd = currentFighters.filter(f => f.alive);
    let winnerInstance = null;
    let roundPlaces = [];

    if (aliveFightersAtEnd.length === 1) {
        winnerInstance = aliveFightersAtEnd[0];
        roundPlaces.push({ id: winnerInstance.id, place: 1, healthPercent: (winnerInstance.health / winnerInstance.maxHealth) });
        defeatedFightersOrder.slice().reverse().forEach((defeatedId, index) => {
            if (winnerInstance && defeatedId !== winnerInstance.id) {
                roundPlaces.push({ id: defeatedId, place: index + 2, healthPercent: 0 });
            } else if (!winnerInstance) {
                 roundPlaces.push({ id: defeatedId, place: index + 1, healthPercent: 0 });
            }
        });
    } else {
        defeatedFightersOrder.slice().reverse().forEach((defeatedId, index) => {
            roundPlaces.push({ id: defeatedId, place: index + 1, healthPercent: 0 });
        });
        aliveFightersAtEnd.forEach(af => {
            if (!roundPlaces.some(rp => rp.id === af.id)) {
                roundPlaces.unshift({ id: af.id, place: 1, healthPercent: (af.health / af.maxHealth) });
            }
        });
        if (roundPlaces.length > 0 && roundPlaces[0].place === 1) {
            winnerInstance = currentFighters.find(f => f.id === roundPlaces[0].id);
        }
        if (aliveFightersAtEnd.length > 1) logMessage(`💔 Раунд ${roundCounter} завершился ничьей среди ${aliveFightersAtEnd.map(f=>f.name).join(', ')}!`, "log-winner");
        else if (aliveFightersAtEnd.length === 0) logMessage(`💔 Все бойцы пали в раунде ${roundCounter}!`, "log-winner");
    }

    if (winnerInstance) {
        const winnerSessData = fightersSessionData.find(f => f.id === winnerInstance.id);
        if (winnerSessData) winnerSessData.winStreak = (winnerSessData.winStreak || 0) + 1;
    }
    fightersSessionData.forEach(f => {
        if (!f.participatingInGameSession) return;
        if (!winnerInstance || f.id !== winnerInstance.id) f.winStreak = 0;
    });

    roundPlaces.forEach(rp => {
        const sessionData = fightersSessionData.find(f => f.id === rp.id);
        if (sessionData && ROUND_REWARDS_GOLD[rp.place]) {
            let prizeMoney = ROUND_REWARDS_GOLD[rp.place];
            if (sessionData.activePacts?.some(p => p.pactId === "bloodPact" && (p.durationRoundsLeft > 0 || p.durationRoundsLeft === "permanent"))) {
                prizeMoney *= (1 + (ECONOMIC_PACTS.bloodPact.effect.prizeBonusPercent || 0));
            }
            const championTitle = sessionData.titles?.find(t => t.titleId === 'champion' && t.durationRoundsLeft > 0);
            if (championTitle) {
                prizeMoney *= (TITLES.champion.effects.prizeGoldMultiplier || 1);
            }
            if (sessionData.winStreak >= DYNAMIC_BALANCE.progressiveTaxThreshold2) {
                prizeMoney *= (1 - DYNAMIC_BALANCE.progressiveTaxPercent2);
            } else if (sessionData.winStreak >= DYNAMIC_BALANCE.progressiveTaxThreshold1) {
                prizeMoney *= (1 - DYNAMIC_BALANCE.progressiveTaxPercent1);
            }
            prizeMoney = Math.round(prizeMoney);
            if (prizeMoney > 0) {
                sessionData.currentGold += prizeMoney;
                logMessage(`💰 ${sessionData.name} получает ${formatNumberWithCommas(prizeMoney)} золота за ${rp.place}-е место!`, "log-bonus");
            }
            if (rp.place === 1 && winnerInstance && sessionData.id === winnerInstance.id) {
                sessionData.wins = (sessionData.wins || 0) + 1;
                logMessage(`🎉 <span class="log-winner">${sessionData.name}</span> ПОБЕЖДАЕТ В РАУНДЕ ${roundCounter}! (Побед: ${sessionData.wins}, Серия: ${sessionData.winStreak || 1})`, "log-winner");
                const winnerInstFromCurrent = currentFighters.find(f => f.id === sessionData.id);
                if (winnerInstFromCurrent) winnerInstFromCurrent.achievementsTrackers.winsThisRound = 1;
            }
        }
    });

    fightersSessionData.forEach(sessionFighter => {
        if (!sessionFighter.activeBetsThisRound || sessionFighter.activeBetsThisRound.length === 0 || !sessionFighter.participatingInGameSession) return;
        const fighterPlaceEntry = roundPlaces.find(rp => rp.id === sessionFighter.id);
        const fighterPlace = fighterPlaceEntry ? fighterPlaceEntry.place : 0;
        const fighterHealthPercent = fighterPlaceEntry ? fighterPlaceEntry.healthPercent : 0;
        const fighterInstForBet = currentFighters.find(f => f.id === sessionFighter.id);
        let totalBetWinnings = 0;
        sessionFighter.activeBetsThisRound.forEach(bet => {
            const betDef = BET_TYPES[bet.type];
            if (!betDef) return;
            let payout = 0; let wonBet = false;
            switch (bet.type) {
                case 'win': if (fighterPlace === 1) wonBet = true; break;
                case 'second_place': if (fighterPlace === 2) wonBet = true; break;
                case 'third_place': if (fighterPlace === 3) wonBet = true; break;
                case 'survival':
                    const isAliveAtEnd = aliveFightersAtEnd.some(af => af.id === sessionFighter.id);
                    if (isAliveAtEnd || (fighterPlace > 0 && fighterPlace <= 3)) wonBet = true;
                    break;
                case 'kills_1': case 'kills_3':
                    const killsAchieved = fighterInstForBet?.killsThisRound || 0;
                    if (killsAchieved >= betDef.baseKills) {
                        wonBet = true; payout = bet.amount * betDef.payoutMultiplier;
                        if (betDef.perKillMultiplier) {
                            payout += (killsAchieved - betDef.baseKills) * bet.amount * betDef.perKillMultiplier;
                        }
                    } break;
                case 'risky_win_domination':
                    if (fighterPlace === 1 && fighterHealthPercent > (betDef.healthThreshold || 0.75)) {
                        wonBet = true;
                    }
                    break;
            }
            if (wonBet && !payout) { payout = bet.amount * betDef.payoutMultiplier; }
            payout = Math.round(payout);
            if (payout > 0) {
                totalBetWinnings += payout;
                logMessage(`🎰 Ставка "${betDef.name}" (${formatNumberWithCommas(bet.amount)}💰) ${sessionFighter.name} ВЫИГРАЛА! +${formatNumberWithCommas(payout)}💰.`, "log-bonus");
            } else if (bet.type === "risky_win_domination" && !(fighterPlace === 1 && fighterHealthPercent > (betDef.healthThreshold || 0.75))) {
                logMessage(`🎲 Рискованная ставка "${betDef.name}" ${sessionFighter.name} не сыграла.`, "log-damage");
            } else if (!wonBet) {
                logMessage(`📉 Ставка "${betDef.name}" (${formatNumberWithCommas(bet.amount)}💰) ${sessionFighter.name} не сыграла.`, "log-damage");
            }
        });
        sessionFighter.currentGold += totalBetWinnings;
        sessionFighter.activeBetsThisRound = [];
    });

    processEndOfRoundExperienceAndAchievements();

    fightersSessionData.forEach(sf => {
        if (!sf.participatingInGameSession) return;
        const placeEntry = roundPlaces.find(rp => rp.id === sf.id);
        const placeTaken = placeEntry ? placeEntry.place : 0;
        if (placeTaken > 0 && placeTaken <= 3) {
            sf.noPrizeStreak = 0;
        } else {
            sf.noPrizeStreak = (sf.noPrizeStreak || 0) + 1;
            if (sf.noPrizeStreak >= DYNAMIC_BALANCE.badLuckStreakThreshold) {
                sf.currentGold += DYNAMIC_BALANCE.badLuckCompensationGold;
                logMessage(`💸 ${sf.name} получает ${formatNumberWithCommas(DYNAMIC_BALANCE.badLuckCompensationGold)}💰 компенсации (${sf.noPrizeStreak} р. без призов)!`, "log-bonus");
                sf.noPrizeStreak = 0;
            }
        }
    });

    fightersSessionData.forEach(sf => {
        if (sf.titles && sf.titles.length > 0) {
            sf.titles = sf.titles.filter(title => {
                if (title.durationRoundsLeft !== "permanent") {
                    title.durationRoundsLeft--;
                    if (title.durationRoundsLeft <= 0) {
                        logMessage(`Титул "${TITLES[title.titleId]?.name}" у ${sf.name} истек.`, "log-effect");
                        return false;
                    }
                }
                return true;
            });
        }
    });

    const GAME_WIN_CONDITIONS = { wins: 100, gold: 100000 };
    const gameWinner = fightersSessionData.find(f => f.participatingInGameSession && (f.wins >= GAME_WIN_CONDITIONS.wins || f.currentGold >= GAME_WIN_CONDITIONS.gold ));
    if (gameWinner) {
        isGameOver = true;
        let winReason = "";
        if (gameWinner.wins >= GAME_WIN_CONDITIONS.wins) winReason = `набрав ${gameWinner.wins} побед`;
        else if (gameWinner.currentGold >= GAME_WIN_CONDITIONS.gold) winReason = `накопив ${formatNumberWithCommas(gameWinner.currentGold)} золота`;
        logMessage(`🏆🏆🏆 <span class="log-winner">${gameWinner.name}</span> СТАЛ АБСОЛЮТНЫМ ЧЕМПИОНОМ АРЕНЫ, ${winReason}! 🏆🏆🏆`, "log-winner");
        endGame(gameWinner); return;
    }
    const activePlayersLeft = fightersSessionData.filter(f => f.participatingInGameSession && f.currentGold >= MIN_BET_AMOUNT).length;
    const totalParticipating = fightersSessionData.filter(f => f.participatingInGameSession).length;
    if (totalParticipating >=2 && activePlayersLeft < 2) {
        isGameOver = true;
        const lastSolventPlayer = activePlayersLeft === 1 ? fightersSessionData.find(f => f.participatingInGameSession && f.currentGold >= MIN_BET_AMOUNT) : null;
        if(lastSolventPlayer){
            logMessage(`☠️ Все остальные гладиаторы обанкротились! <span class="log-winner">${lastSolventPlayer.name}</span> остается единственным победителем!`, "log-kill");
            endGame(lastSolventPlayer, `${lastSolventPlayer.name} победил из-за банкротства остальных!`);
        } else {
            logMessage(`☠️ Все гладиаторы обанкротились! Игра окончена.`, "log-kill");
            endGame(null, "Все гладиаторы обанкротились!");
        } return;
    }

    if (!isGameOver) {
        preRoundTimeoutId = setTimeout(() => {
            startInterRoundPhase();
        }, NEW_ROUND_DELAY_AFTER_MANAGEMENT * 2.5);
    }
}

function endGame(winnerData = null, customMessage = null) {
    console.log("Game Over.");
    isGameOver = true; roundInProgress = false; isInterRoundPhase = false; isInitialSetupPhase = false;
    if (gameLoopInterval) clearInterval(gameLoopInterval); if (preRoundTimeoutId) clearTimeout(preRoundTimeoutId);
    gameLoopInterval = null; preRoundTimeoutId = null;

    if (nextRoundButtonEl) { nextRoundButtonEl.disabled = true; nextRoundButtonEl.textContent = 'Игра Окончена'; nextRoundButtonEl.style.display = 'none'; }
    if (sessionSetupOverlayEl) sessionSetupOverlayEl.classList.remove('active');
    if (fighterManagementOverlayEl) fighterManagementOverlayEl.classList.remove('active');
    if (guideModalEl && guideModalEl.style.display === 'flex') closeGuide();

    if (gameOverOverlayEl) {
        let titleText = "ИГРА ОКОНЧЕНА"; let announcementText = "Спасибо за игру!";
        if (customMessage) { announcementText = customMessage; }
        else if (winnerData) { titleText = `ПОБЕДИТЕЛЬ - ${winnerData.name.toUpperCase()}!`; announcementText = `ПОЗДРАВЛЯЕМ, <span id="game-over-winner-name">${winnerData.name}</span>!`; }
        else { announcementText = "Никто не смог достичь абсолютной победы в этот раз."; }
        if (gameOverTitleEl) gameOverTitleEl.textContent = titleText;
        if (gameOverWinnerAnnouncementEl) gameOverWinnerAnnouncementEl.innerHTML = announcementText;
        gameOverOverlayEl.classList.add('active');
    }
    if (restartEntireGameButtonEl) { restartEntireGameButtonEl.onclick = () => { gameOverOverlayEl.classList.remove('active'); resetAndRestartGame(); }; }
    updateScoreboardUI();
}
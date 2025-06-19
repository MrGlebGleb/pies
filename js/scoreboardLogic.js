// --- SCOREBOARD LOGIC ---

/**
 * Обновляет отображение таблицы лидеров.
 * Заполняет список гладиаторов из fightersSessionData.
 */
function updateScoreboardUI() {
    if (!scoreboardListEl) {
        console.error("Scoreboard UI: scoreboardListEl is missing!");
        return;
    }
    if (!fightersSessionData || !Array.isArray(fightersSessionData)) {
        console.error("Scoreboard UI: fightersSessionData is invalid!");
        scoreboardListEl.innerHTML = '<li>Ошибка загрузки данных гладиаторов.</li>';
        return;
    }

    scoreboardListEl.innerHTML = ''; // Очищаем предыдущее содержимое

    // Сортируем гладиаторов по победам (desc), затем по золоту (desc)
    const sortedFighters = [...fightersSessionData].sort((a, b) => {
        if ((b.wins || 0) !== (a.wins || 0)) {
            return (b.wins || 0) - (a.wins || 0);
        }
        return (b.currentGold || 0) - (a.currentGold || 0);
    });

    if (sortedFighters.length === 0 && !isInitialSetupPhase) {
        scoreboardListEl.innerHTML = '<li>Нет гладиаторов в этой сессии.</li>';
        return;
    }

    sortedFighters.forEach(fighterData => {
        const li = document.createElement('li');
        li.classList.add('scoreboard-fighter-entry');
        li.dataset.fighterId = fighterData.id;

        // Аватар
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('sb-fighter-avatar');
        const img = document.createElement('img');
        img.src = fighterData.image;
        img.alt = fighterData.name;
        img.onerror = () => { img.src = 'images/default.png'; };
        avatarDiv.appendChild(img);

        // Информация: Имя и Золото
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('sb-fighter-info');
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('sb-fighter-name');
        nameSpan.textContent = fighterData.name || "Безымянный";
        const goldSpan = document.createElement('span');
        goldSpan.classList.add('sb-fighter-gold');
        goldSpan.textContent = `💰 ${(fighterData.currentGold || 0).toLocaleString()}`;
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(goldSpan);

        // Победы (кубки)
        const winsSpan = document.createElement('span');
        winsSpan.classList.add('sb-fighter-wins');
        winsSpan.textContent = '🏆'.repeat(fighterData.wins || 0) || "-"; // Показываем прочерк, если 0 побед

        // Всплывающая подсказка для статов (будет заполняться при наведении или при клике для управления)
        const tooltipDiv = document.createElement('div');
        tooltipDiv.classList.add('sb-fighter-intellect-tooltip');
        tooltipDiv.innerHTML = generateFighterTooltipHTML(fighterData); // Генерируем HTML для подсказки

        li.appendChild(avatarDiv);
        li.appendChild(infoDiv);
        li.appendChild(winsSpan);
        li.appendChild(tooltipDiv); // Добавляем скрытую подсказку

        // Делаем элемент кликабельным, если активна межраундовая фаза
        if (isInterRoundPhase) {
            li.classList.add('manageable');
            li.addEventListener('click', () => handleScoreboardFighterClick(fighterData.id));
        } else {
            li.classList.remove('manageable');
        }
        scoreboardListEl.appendChild(li);
    });
}

/**
 * Генерирует HTML-содержимое для всплывающей подсказки с характеристиками гладиатора.
 * @param {object} fighterData - Данные гладиатора из fightersSessionData.
 * @returns {string} HTML-строка для подсказки.
 */
function generateFighterTooltipHTML(fighterData) {
    if (!fighterData) return "<p>Нет данных</p>";

    const int = fighterData.combatStats?.intellect || { tactical: 1, defense: 1, resource: 1, spatial: 1 };
    const permStats = fighterData.permanentStats || {};

    // Базовые значения из UPGRADES для отображения "улучшено на X"
    const baseCritBonus = UPGRADES.critChance.effect.value; // 0.02
    const baseEvasionBonus = UPGRADES.evasion.effect.value; // 0.01

    let html = `<p><strong>${fighterData.name}</strong></p>`;
    html += `<p><span class="int-stat int-tactical">${INTELLECT_SYMBOLS.tactical} ${int.tactical}</span> <span class="int-stat int-defense">${INTELLECT_SYMBOLS.defense} ${int.defense}</span> <span class="int-stat int-resource">${INTELLECT_SYMBOLS.resource} ${int.resource}</span> <span class="int-stat int-spatial">${INTELLECT_SYMBOLS.spatial} ${int.spatial}</span></p>`;
    html += `<hr>`;
    html += `<p>Макс. ОЗ: ${permStats.maxHealth || BASE_HEALTH}</p>`;
    // Отображаем скорость атаки как % бонус (1 / множитель)
    const attackSpeedBonusPercent = permStats.attackSpeedMultiplier ? ((1 / permStats.attackSpeedMultiplier - 1) * 100).toFixed(0) : 0;
    html += `<p>Бонус скор. атаки: +${attackSpeedBonusPercent}%</p>`;
    html += `<p>Доп. шанс крита: +${((permStats.critChanceBonus || 0) * 100).toFixed(0)}%</p>`;
    html += `<p>Бонус к урону: +${(permStats.baseDamageMultiplier ? (permStats.baseDamageMultiplier - 1) * 100 : 0).toFixed(0)}%</p>`;
    html += `<p>Доп. шанс уклонения: +${((permStats.evasionBonus || 0) * 100).toFixed(0)}%</p>`;
    if (permStats.bonusArmorChargesPerRound > 0) {
        html += `<p>Броня в начале раунда: ${permStats.bonusArmorChargesPerRound}</p>`;
    }
    // Можно добавить отображение других permanentStats, если они есть

    return html;
}


/**
 * Обработчик клика по гладиатору в таблице лидеров.
 * Открывает модальное окно управления для выбранного гладиатора.
 * @param {string} fighterId - ID выбранного гладиатора.
 */
function handleScoreboardFighterClick(fighterId) {
    if (!isInterRoundPhase) {
        console.log("Scoreboard click: Not in inter-round phase. Management disabled.");
        return;
    }

    const fighterToManage = fightersSessionData.find(f => f.id === fighterId);
    if (!fighterToManage) {
        console.error("Scoreboard click: Fighter data not found for ID:", fighterId);
        return;
    }

    selectedFighterForManagementId = fighterId; // Сохраняем ID в state.js
    console.log(`Scoreboard click: Managing fighter ${fighterToManage.name} (ID: ${fighterId})`);

    // Вызов функции для отображения модального окна управления
    // Эта функция будет в fighterManagement.js
    if (typeof openFighterManagementModal === 'function') {
        openFighterManagementModal(fighterToManage);
    } else {
        console.error("handleScoreboardFighterClick: openFighterManagementModal function is not defined.");
        alert("Функция управления гладиатором еще не готова.");
    }
}

// Первоначальное обновление таблицы при загрузке (если гладиаторы уже есть в fightersSessionData)
// Обычно вызывается после завершения sessionSetup или в начале межраундовой фазы.
// document.addEventListener('DOMContentLoaded', () => {
//    // updateScoreboardUI(); // Не вызываем здесь, пусть gameFlow решает когда
// });
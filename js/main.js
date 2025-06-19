// --- MAIN SCRIPT (INITIALIZATION AND GAME START) ---

function initializeApp() {
    console.log("Initializing Gladiator Arena App (New Version)...");

    // Настройка слушателей для руководства
    if (typeof setupGuideEventListeners === 'function' && guideButtonEl) {
        setupGuideEventListeners();
    } else if (guideButtonEl && typeof openGuide === 'function') {
        guideButtonEl.addEventListener('click', openGuide);
    } else {
        console.warn("Guide button or setupGuideEventListeners not found.");
    }

    // Настройка слушателя для кнопки "Начать Раунд"
    if (nextRoundButtonEl && typeof prepareAndStartRound === 'function') {
        nextRoundButtonEl.addEventListener('click', () => {
            if (isInterRoundPhase && !roundInProgress && !isGameOver) {
                prepareAndStartRound();
            } else {
                console.warn("Next Round button clicked at an inappropriate time.", {isInterRoundPhase, roundInProgress, isGameOver});
            }
        });
    } else {
        console.warn("Next Round button or prepareAndStartRound not found.");
    }

    // Настройка слушателей для прокрутки лога
    if (battleLogEl && scrollLogDownButtonEl) {
        battleLogEl.addEventListener('wheel', handleLogScroll);
        battleLogEl.addEventListener('scroll', handleLogScroll);
        scrollLogDownButtonEl.addEventListener('click', scrollToLogBottom);
    }

    resetFullGameState(); // Сброс состояния перед началом

    // Инициализация экрана выбора сессии
    if (typeof initSessionSetupScreen === 'function') {
        initSessionSetupScreen(); // Эта функция сделает sessionSetupOverlayEl активным
    } else {
        console.error("CRITICAL: initSessionSetupScreen function is not defined. Game cannot start.");
        if (mainTitleEl) mainTitleEl.textContent = "ОШИБКА ЗАГРУЗКИ ИГРЫ!";
        const body = document.querySelector('body');
        if (body) {
            const errorMsg = document.createElement('div');
            errorMsg.innerHTML = `<p style="color:red; text-align:center; font-size:1.5em; margin-top: 20px;">Не удалось загрузить игру. Проверьте консоль (F12).</p>`;
            body.insertBefore(errorMsg, body.firstChild);
        }
        return;
    }

    logMessage("Добро пожаловать на обновленную Арену Пирожков!", "log-round-start");
    logMessage("Выберите гладиаторов, которые сразятся в этой сессии, и подтвердите выбор.", "log-effect");

    console.log("Gladiator Arena App Initialized successfully.");
}

function handleLogScroll() {
    if (!battleLogEl || !scrollLogDownButtonEl) return;
    setTimeout(() => {
        const threshold = 25; // Порог, после которого считаем, что пользователь прокрутил вверх
        if (battleLogEl.scrollTop + battleLogEl.clientHeight < battleLogEl.scrollHeight - threshold) {
            if (!userScrolledLog) {
                userScrolledLog = true;
                scrollLogDownButtonEl.style.opacity = '0.8';
            }
        } else { // Если внизу или близко к низу
            if (userScrolledLog) { // Если пользователь был вверху, а теперь внизу
                userScrolledLog = false;
                scrollLogDownButtonEl.style.opacity = '0';
            }
        }
    }, 50); // Небольшая задержка для предотвращения слишком частых проверок
}

function scrollToLogBottom() {
    if (battleLogEl) {
        battleLogEl.scrollTop = battleLogEl.scrollHeight;
        userScrolledLog = false; // Сбрасываем флаг, так как мы принудительно прокрутили вниз
        if (scrollLogDownButtonEl) scrollLogDownButtonEl.style.opacity = '0';
    }
}

function resetFullGameState() {
    console.log("Resetting full game state for a new game or on initial load...");
    // Остановка игровых циклов
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (preRoundTimeoutId) clearTimeout(preRoundTimeoutId);
    gameLoopInterval = null; preRoundTimeoutId = null;

    // Сброс данных сессии и состояния
    fightersSessionData = [];
    isInitialSetupPhase = true; // Важно для initSessionSetupScreen
    isInterRoundPhase = false;
    selectedFighterForManagementId = null;
    roundInProgress = false;
    firstRoundStarted = false;
    isGameOver = false;
    isGuideOpen = false;
    roundCounter = 0;
    currentFighters = [];
    arenaBonuses = [];
    duelContenders = null;
    activeRoundModifier = null;
    defeatedFightersOrder = [];
    lastDamageTimestamp = Date.now();
    intelliActionLog = {};
    userScrolledLog = false;
    activeOrbitalEffects = [];
    currentFighterManagementTab = 'fm-upgrades-tab';
    roundGlobalAchievements = {};

    // Очистка UI элементов
    if (arenaEl) arenaEl.innerHTML = '';
    if (battleLogEl) battleLogEl.innerHTML = '';
    if (scoreboardListEl) scoreboardListEl.innerHTML = '<li>Ожидание выбора гладиаторов...</li>';
    if (typeof clearOrbitalEffects === "function") clearOrbitalEffects();

    // Управление видимостью оверлеев
    if (sessionSetupOverlayEl) sessionSetupOverlayEl.classList.remove('active'); // Будет активирован в initSessionSetupScreen
    if (fighterManagementOverlayEl) fighterManagementOverlayEl.classList.remove('active');
    if (gameOverOverlayEl) gameOverOverlayEl.classList.remove('active');
    if (guideModalEl) guideModalEl.style.display = 'none'; // Прячем руководство

    // Сброс кнопок и заголовков
    if (nextRoundButtonEl) {
        nextRoundButtonEl.style.display = 'none';
        nextRoundButtonEl.disabled = true;
        nextRoundButtonEl.textContent = 'Начать Раунд 1!';
    }
    if (mainTitleEl) mainTitleEl.textContent = "Арена Пирожков";
    if (roundCounterDisplayEl) roundCounterDisplayEl.textContent = "1";
    document.title = "Арена Гладиаторов";

    // Сброс полей ввода и сообщений в модалке управления
    if (fmBetAmountInputEl) fmBetAmountInputEl.value = '';
    if (fmBetErrorEl) fmBetErrorEl.textContent = '';
    if (fmActionMessageEl) fmActionMessageEl.textContent = '';

    console.log("Full game state reset complete.");
}

function resetAndRestartGame() {
    console.log("Reset and Restart Game button triggered.");
    resetFullGameState();
    // Переинициализация экрана выбора сессии
    if (typeof initSessionSetupScreen === 'function') {
        initSessionSetupScreen();
    } else {
        console.error("CRITICAL on RESTART: initSessionSetupScreen function is not defined. Cannot restart.");
        alert("Ошибка перезапуска игры. Пожалуйста, обновите страницу.");
    }
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', initializeApp);
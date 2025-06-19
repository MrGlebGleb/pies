// --- GUIDE MODAL LOGIC (Обновленная версия) ---

let gameWasPausedByGuideLocal = false;

function openGuide() {
    if (!guideModalEl) {
        console.error("GuideLogic: guideModalEl not found.");
        return;
    }
    isGuideOpen = true;
    guideModalEl.style.display = 'flex';
    showGuideMainMenu(); // Показываем основное меню при открытии

    if (roundInProgress && !isInitialSetupPhase && !isInterRoundPhase && !isGameOver) {
        if (gameLoopInterval) {
            clearInterval(gameLoopInterval);
            gameLoopInterval = null;
            gameWasPausedByGuideLocal = true;
            console.log("Game paused by guide.");
        }
    }

    if (nextRoundButtonEl) nextRoundButtonEl.disabled = true;
    if (isInitialSetupPhase && confirmSessionFightersButtonEl) {
        confirmSessionFightersButtonEl.disabled = true;
    }
}

function closeGuide() {
    if (!guideModalEl) {
        console.error("GuideLogic: guideModalEl not found.");
        return;
    }
    isGuideOpen = false;
    guideModalEl.style.display = 'none';

    if (gameWasPausedByGuideLocal) {
        lastDamageTimestamp = Date.now();
        console.log("Stall timer reset after closing guide.");
        if (roundInProgress && !isGameOver && !gameLoopInterval && typeof gameTick === 'function') {
            gameLoopInterval = setInterval(gameTick, GAME_SPEED);
            console.log("Game resumed by guide.");
        } else if (!gameLoopInterval && roundInProgress) {
             console.error("closeGuide: gameTick is not defined or game not in resumable state.");
        }
    }
    gameWasPausedByGuideLocal = false;

    if (isInitialSetupPhase && confirmSessionFightersButtonEl) {
        confirmSessionFightersButtonEl.disabled = false;
    } else if (isInterRoundPhase && nextRoundButtonEl && !roundInProgress && !isGameOver) {
        nextRoundButtonEl.disabled = false;
    } else if (roundInProgress && nextRoundButtonEl) {
        // nextRoundButtonEl.disabled = true; // Эта логика уже есть в prepareAndStartRound
    }
}

function showGuideSection(targetId) {
    if (!guideContentEl || !guideMainNavigationEl || !guideBackButtonEl || !guideTitleElementEl) {
        console.error("GuideLogic: Core guide elements are missing.");
        return;
    }

    // Скрываем все секции контента и все подменю
    guideContentEl.querySelectorAll('.guide-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.guide-navigation.sub-navigation').forEach(subnav => subnav.style.display = 'none');

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
        guideContentEl.scrollTop = 0; // Прокрутка вверх при смене секции
    } else {
        console.warn(`GuideLogic: Section with ID "${targetId}" not found.`);
        const defaultSection = document.getElementById('guide-default-content');
        if (defaultSection) defaultSection.classList.add('active');
    }

    // Определяем, является ли текущая секция частью подменю
    const isSubSection = targetSection && targetSection.closest('.sub-navigation') !== null || 
                         targetId.includes('-melee-') || targetId.includes('-ranged-') || targetId.includes('-elite-') ||
                         targetId.includes('-basic-') || targetId.includes('-debuffs-') || targetId.includes('-economy-') || targetId.includes('-special-actions-');

    const mainButtonForSubNav = guideMainNavigationEl.querySelector(`.guide-tab-button[data-subnav][data-target="${targetId.split('-')[0] + '-' + targetId.split('-')[1] + '-main-new'}"]`) ||
                                guideMainNavigationEl.querySelector(`.guide-tab-button[data-subnav="${targetSection?.parentElement.id}"]`);


    if (targetId === 'guide-default-content' || !targetSection) { // Главная страница руководства
        guideMainNavigationEl.style.display = 'flex';
        guideBackButtonEl.style.display = 'none';
        guideTitleElementEl.textContent = "📖 РУКОВОДСТВО ПО АРЕНЕ ГЛАДИАТОРОВ";
        setActiveGuideButton(null, guideMainNavigationEl);
    } else if (mainButtonForSubNav) { // Если это кнопка, ведущая в подменю, или сама секция из подменю
        const subNavId = mainButtonForSubNav.dataset.subnav;
        const subNavElement = document.getElementById(subNavId);
        
        guideMainNavigationEl.style.display = 'none';
        if (subNavElement) subNavElement.style.display = 'flex';
        guideBackButtonEl.style.display = 'inline-block';
        guideTitleElementEl.textContent = mainButtonForSubNav.textContent.trim(); // Используем текст главной кнопки как заголовок

        setActiveGuideButton(mainButtonForSubNav, guideMainNavigationEl); // Активируем главную кнопку
        if (subNavElement) {
            setActiveGuideButton(subNavElement.querySelector(`.guide-tab-button[data-target="${targetId}"]`), subNavElement); // Активируем кнопку в подменю
        }
    } else { // Обычная секция из главного меню (без подменю)
        guideMainNavigationEl.style.display = 'flex';
        guideBackButtonEl.style.display = 'none'; // Кнопка "Назад" не нужна
        guideTitleElementEl.textContent = "📖 РУКОВОДСТВО ПО АРЕНЕ ГЛАДИАТОРОВ";
        setActiveGuideButton(guideMainNavigationEl.querySelector(`.guide-tab-button[data-target="${targetId}"]`), guideMainNavigationEl);
    }
}


function showGuideMainMenu() {
    const defaultSectionId = 'guide-default-content';
    const defaultSection = document.getElementById(defaultSectionId);

    guideContentEl.querySelectorAll('.guide-section').forEach(section => section.classList.remove('active'));
    if (defaultSection) defaultSection.classList.add('active');
    else console.warn("Default guide section not found");

    document.querySelectorAll('.guide-navigation.sub-navigation').forEach(subnav => subnav.style.display = 'none');
    if (guideMainNavigationEl) guideMainNavigationEl.style.display = 'flex';
    if (guideBackButtonEl) guideBackButtonEl.style.display = 'none';
    if (guideTitleElementEl) guideTitleElementEl.textContent = "📖 РУКОВОДСТВО ПО АРЕНЕ ГЛАДИАТОРОВ";

    setActiveGuideButton(null, guideMainNavigationEl); // Снимаем выделение с кнопок
    document.querySelectorAll('.guide-navigation.sub-navigation').forEach(subnav => setActiveGuideButton(null, subnav));
}


function setActiveGuideButton(buttonToActivate, parentNavElement) {
    if (!parentNavElement) return;
    parentNavElement.querySelectorAll('.guide-tab-button').forEach(btn => btn.classList.remove('active'));
    if (buttonToActivate) {
        buttonToActivate.classList.add('active');
    }
}

// Переменные для элементов навигации (должны быть объявлены глобально или переданы)
// Предполагается, что domElements.js уже их определил. Если нет, нужно будет их получить здесь.
let guideMainNavigationEl, guideWeaponsSubNavNewEl, guideUpgradesSubNavNewEl;


function setupGuideEventListeners() {
    // Получаем элементы после загрузки DOM
    guideMainNavigationEl = document.getElementById('guide-main-navigation');
    guideWeaponsSubNavNewEl = document.getElementById('guide-weapons-subnav-new');
    guideUpgradesSubNavNewEl = document.getElementById('guide-upgrades-subnav-new');


    if (guideButtonEl) guideButtonEl.addEventListener('click', openGuide);
    if (closeGuideButtonEl) closeGuideButtonEl.addEventListener('click', closeGuide);

    if (guideModalEl) {
        guideModalEl.addEventListener('click', (event) => {
            if (event.target === guideModalEl) closeGuide(); // Закрытие по клику вне контента
        });
    }

    if (guideMainNavigationEl) {
        guideMainNavigationEl.addEventListener('click', (event) => {
            const button = event.target.closest('.guide-tab-button');
            if (button) {
                const targetId = button.dataset.target;
                const subNavId = button.dataset.subnav; // Проверяем, есть ли у кнопки атрибут для подменю

                if (subNavId) { // Если это кнопка, открывающая подменю
                    showGuideSection(targetId); // Показываем "главную" страницу подраздела
                    // Дополнительно можно сразу показать первую вкладку подменю, если есть targetId для нее
                    const subNavElement = document.getElementById(subNavId);
                    if (subNavElement) {
                        const firstSubButton = subNavElement.querySelector('.guide-tab-button');
                        if (firstSubButton && targetId.endsWith('-main-new')) { // Если это главная страница подраздела
                           // Не переключаем активную секцию, даем пользователю выбрать из подменю
                        }
                    }
                } else if (targetId) {
                    showGuideSection(targetId);
                }
            }
        });
    }

    if (guideWeaponsSubNavNewEl) {
         guideWeaponsSubNavNewEl.addEventListener('click', (event) => {
            const button = event.target.closest('.guide-tab-button');
            if (button && button.dataset.target) {
                showGuideSection(button.dataset.target);
            }
        });
    }
    if (guideUpgradesSubNavNewEl) {
         guideUpgradesSubNavNewEl.addEventListener('click', (event) => {
            const button = event.target.closest('.guide-tab-button');
            if (button && button.dataset.target) {
                showGuideSection(button.dataset.target);
            }
        });
    }


    if (guideBackButtonEl) {
        guideBackButtonEl.addEventListener('click', showGuideMainMenu);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isGuideOpen) {
            closeGuide();
        }
    });
}
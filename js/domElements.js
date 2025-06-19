// --- DOM ELEMENTS ---

// --- Заголовок и управление раундом ---
const mainTitleEl = document.getElementById('main-title');
const nextRoundButtonEl = document.getElementById('next-round-button');
const roundCounterDisplayEl = document.getElementById('round-counter-display');

// --- Оверлей Начальной Настройки Сессии ---
const sessionSetupOverlayEl = document.getElementById('session-setup-overlay');
const sessionFightersListContainerEl = document.getElementById('session-fighters-list-container');
const confirmSessionFightersButtonEl = document.getElementById('confirm-session-fighters-button');
const sessionSetupErrorEl = document.getElementById('session-setup-error');

// --- Оверлей Управления Гладиатором ---
const fighterManagementOverlayEl = document.getElementById('fighter-management-overlay');
const fmCloseButtonEl = document.getElementById('fm-close-button');
const fmFighterNameEl = document.getElementById('fm-fighter-name');
const fmFighterGoldEl = document.getElementById('fm-fighter-gold');
const fmTabsButtonsContainerEl = document.getElementById('fm-tabs-buttons');
const fmTabContentAreaEl = document.getElementById('fm-tab-content-area');
// Вкладки контента
const fmUpgradesTabContentEl = document.getElementById('fm-upgrades-tab');
const fmBettingTabContentEl = document.getElementById('fm-betting-tab');
const fmDebuffsTabContentEl = document.getElementById('fm-debuffs-tab');
const fmSpecialActionsTabContentEl = document.getElementById('fm-special-actions-tab');
const fmEconomyTabContentEl = document.getElementById('fm-economy-tab');
// Списки внутри вкладок
const fmUpgradesListEl = document.getElementById('fm-upgrades-list');
const fmBettingOptionsListEl = document.getElementById('fm-betting-options-list');
const fmDebuffTargetSelectEl = document.getElementById('fm-debuff-target-select');
const fmDebuffsListEl = document.getElementById('fm-debuffs-list');
const fmSpecialActionsListEl = document.getElementById('fm-special-actions-list');
const fmEconomyUpgradesListEl = document.getElementById('fm-economy-upgrades-list');
// Элементы для ставок
const fmBetAmountInputEl = document.getElementById('fm-bet-amount-input');
const fmConfirmBetButtonEl = document.getElementById('fm-confirm-bet-button');
const fmBetErrorEl = document.getElementById('fm-bet-error');
const fmActiveBetsListEl = document.getElementById('fm-active-bets-list');
// Сообщение о действии в модалке
const fmActionMessageEl = document.getElementById('fm-action-message');


// --- Оверлей Конца Игры ---
const gameOverOverlayEl = document.getElementById('game-over-overlay');
const gameOverTitleEl = document.getElementById('game-over-title');
const gameOverWinnerAnnouncementEl = document.getElementById('game-over-winner-announcement');
const gameOverWinnerNameSpanEl = document.getElementById('game-over-winner-name'); // span для имени
const restartEntireGameButtonEl = document.getElementById('restart-entire-game-button');

// --- Основной контейнер игры ---
const scoreboardListEl = document.getElementById('scoreboard-list');
const arenaEl = document.getElementById('arena');
const battleLogEl = document.getElementById('battle-log');
const scrollLogDownButtonEl = document.getElementById('scroll-log-down-button');

// --- Руководство ---
const guideButtonEl = document.getElementById('guide-button'); // Изменил имя переменной для единообразия
const guideModalEl = document.getElementById('guide-modal');    // Изменил имя переменной
const closeGuideButtonEl = document.getElementById('close-guide-button'); // Изменил имя переменной
const guideNavigationEl = document.getElementById('guide-navigation'); // Изменил имя переменной
const guideWeaponsSubNavEl = document.getElementById('guide-weapons-subnav'); // Изменил имя переменной
const guideContentEl = document.getElementById('guide-content'); // Изменил имя переменной
const guideBackButtonEl = document.getElementById('guide-back-button'); // Изменил имя переменной
const guideTitleElementEl = document.getElementById('guide-title-element'); // Было guideTitleElement в HTML

// --- Орбитальные эффекты ---
const orbitalEffectsContainerEl = document.getElementById('orbital-effects-container');

// --- Старые элементы, которые точно не нужны ---
// const startGameButtonEl = document.getElementById('start-button'); // Заменено на confirmSessionFightersButtonEl и nextRoundButtonEl
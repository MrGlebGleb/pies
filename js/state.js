// --- GAME STATE VARIABLES ---

// --- Данные сессии и гладиаторов ---
let fightersSessionData = [];

// --- Флаги состояния игры и UI ---
let isInitialSetupPhase = true;
let isInterRoundPhase = false;
let selectedFighterForManagementId = null;
let roundInProgress = false;
let firstRoundStarted = false;
let isGameOver = false;
let isGuideOpen = false; // Флаг для модального окна руководства

// --- Переменные состояния текущего раунда ---
let roundCounter = 0;
let gameLoopInterval = null;
let preRoundTimeoutId = null;
let currentFighters = [];
let arenaBonuses = [];
let duelContenders = null;
let activeRoundModifier = null;
let defeatedFightersOrder = [];
let lastDamageTimestamp = Date.now();

// --- UI и логирование ---
let intelliActionLog = {};
let userScrolledLog = false;

// --- Состояние Орбитальных Эффектов ---
let activeOrbitalEffects = [];

// --- Информация о текущей открытой вкладке в модалке управления ---
let currentFighterManagementTab = 'fm-upgrades-tab';

// --- Глобальные достижения за раунд (сбрасываются каждый раунд) ---
let roundGlobalAchievements = {};

// КОНСТАНТЫ FIGHTER_STARTING_GOLD, ROUND_REWARDS, BET_PAYOUTS и др.
// находятся в js/constants.js
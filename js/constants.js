// --- GAME CONSTANTS ---
const BASE_HEALTH = 100;
const ARENA_WIDTH = 1000;
const ARENA_HEIGHT = 700;
const FIGHTER_WIDTH = 70;
const FIGHTER_HEIGHT = 100;
const GAME_SPEED = 350; // Скорость тиков игры
const PRE_ROUND_MANAGEMENT_DURATION = 5000;
const NEW_ROUND_DELAY_AFTER_MANAGEMENT = 1000;
const MAX_ARENA_BONUSES = 5;
const BONUS_PICKUP_RADIUS = 45;
const PROJECTILE_SPEED = 18;
const EXP_TO_LEVEL_UP_BASE = 100;
const EXP_TO_LEVEL_UP_FACTOR = 1.5;
const MAX_INTELLECT_LEVEL = 10;
const STALL_TIMEOUT = 20000;
const MIN_INITIAL_BONUSES_PER_ROUND = 1;
const MAX_INITIAL_BONUSES_PER_ROUND = 2;

// --- BONUS CHANCES & VALUES ---
const ELITE_WEAPON_BONUS_CHANCE = 0.0300;
const HEALTH_PACK_BONUS_CHANCE = 0.0300;
const ARMOR_PACK_LIGHT_CHANCE = 0.0200;
const ARMOR_PACK_HEAVY_CHANCE = 0.0100;
const MAX_ARMOR_HITS_LIGHT = 2;
const MAX_ARMOR_HITS_HEAVY = 4;


const INTELLECT_SYMBOLS = {
    tactical: '🎯', defense: '🛡️', resource: '🛠️', spatial: '🗺️'
};

const EXPERIENCE_REWARDS = {
    kill: { tactical: 25, spatial: 10 },
    kill_major_boost: { tactical: 40, spatial: 15 },
    assist: { tactical: 10 },
    damage_dealt_ratio: { tactical: 30 },
    evade_attack: { defense: 15, spatial: 5 },
    block_attack: { defense: 20 },
    pickup_bonus: { resource: 25, spatial: 5 },
    survive_round_tick: { defense: 1, tactical: 0.5 },
    win_round: { tactical: 60, defense: 40, resource: 25, spatial: 25 },
    place_2nd: { tactical: 35, defense: 20, resource: 15, spatial: 15 },
    place_3rd: { tactical: 20, defense: 15, resource: 10, spatial: 10 },
    target_priority_success: { tactical: 10 },
    defeat_dangerous_enemy: { tactical: 30, defense: 10 },
    successful_retreat: { defense: 15, spatial: 10 },
    aoe_hit_multiple: { tactical: 5 },
    participation: { tactical: 3, defense: 3, resource: 2, spatial: 2 },
    first_blood: { tactical: 15, resource: 5},
    master_survival_seconds_threshold: 60,
    master_survival_reward: { defense: 20, spatial: 10 },
    bonus_collector_threshold: 3,
    bonus_collector_reward: { resource: 15, spatial: 5 },
    great_evader_threshold: 5,
    great_evader_reward: { defense: 25, spatial: 10 },
    leader_hunter_reward: { tactical: 35, resource: 10 },
};

// --- ECONOMIC CONSTANTS ---
const FIGHTER_STARTING_GOLD = 1000;
const ROUND_REWARDS_GOLD = {
    1: 1000,
    2: 500,
    3: 300
};
const MIN_BET_AMOUNT = 50;

// --- UPGRADES ---
const UPGRADES = {
    health: { id: "health", name: "Здоровье", description: "+10 к макс. ОЗ", baseCost: 200, costIncrease: 100, maxLevel: null, effect: { type: "stat_add", statKey: "permanentStats.maxHealth", value: 10 } },
    attackSpeed: { id: "attackSpeed", name: "Скорость Атаки", description: "+5% к скорости атаки", baseCost: 250, costIncrease: 150, maxLevel: null, effect: { type: "stat_multiply_inverse", statKey: "permanentStats.attackSpeedMultiplier", value: 0.05 } },
    critChance: { id: "critChance", name: "Шанс Крита", description: "+2% к шансу крит. удара", baseCost: 300, costIncrease: 200, maxLevel: null, effect: { type: "stat_add", statKey: "permanentStats.critChanceBonus", value: 0.02 } },
    damage: { id: "damage", name: "Урон", description: "+5% к базовому урону", baseCost: 350, costIncrease: 200, maxLevel: null, effect: { type: "stat_multiply", statKey: "permanentStats.baseDamageMultiplier", value: 0.05 } },
    evasion: { id: "evasion", name: "Уклонение", description: "+1% к шансу уклонения", baseCost: 300, costIncrease: 150, maxLevel: null, effect: { type: "stat_add", statKey: "permanentStats.evasionBonus", value: 0.01 } },
    armor: { id: "armor", name: "Броня", description: "+1 заряд брони перед раундом", baseCost: 400, costIncrease: 250, maxLevel: null, effect: { type: "armor_charge", statKey: "permanentStats.bonusArmorChargesPerRound", value: 1 } },
    pickupRadius: { id: "pickupRadius", name: "Радиус Подбора", description: "+15% к радиусу подбора бонусов", baseCost: 200, costIncrease: 100, maxLevel: null, effect: { type: "stat_multiply", statKey: "permanentStats.bonusPickupRadiusFactor", value: 0.15 } },
    expBoostTactical: { id: "expBoostTactical", name: "Обучение: Тактика", description: "+20% тактического опыта", baseCost: 500, costIncrease: 300, maxLevel: null, effect: { type: "exp_boost", intellectType: "tactical", statKey: "permanentStats.experienceGainMultiplier.tactical", value: 0.20 } },
    expBoostDefense: { id: "expBoostDefense", name: "Обучение: Защита", description: "+20% защитного опыта", baseCost: 500, costIncrease: 300, maxLevel: null, effect: { type: "exp_boost", intellectType: "defense", statKey: "permanentStats.experienceGainMultiplier.defense", value: 0.20 } },
    expBoostResource: { id: "expBoostResource", name: "Обучение: Ресурсы", description: "+20% ресурсного опыта", baseCost: 500, costIncrease: 300, maxLevel: null, effect: { type: "exp_boost", intellectType: "resource", statKey: "permanentStats.experienceGainMultiplier.resource", value: 0.20 } },
    expBoostSpatial: { id: "expBoostSpatial", name: "Обучение: Пространство", description: "+20% пространственного опыта", baseCost: 500, costIncrease: 300, maxLevel: null, effect: { type: "exp_boost", intellectType: "spatial", statKey: "permanentStats.experienceGainMultiplier.spatial", value: 0.20 } },
    battleRage: { id: "battleRage", name: "Боевая Ярость", description: "+15% урона, когда ОЗ < 30%", baseCost: 400, costIncrease: 250, maxLevel: null, effect: { type: "enrage_unlock", statKey: "permanentStats.enrageSettings", thresholdPercent: 0.3, damageBonus: 0.15 } },
    hunterInstinct: { id: "hunterInstinct", name: "Интуиция Охотника", description: "+3% урона по цели с макс. ОЗ", baseCost: 350, costIncrease: 200, maxLevel: null, effect: { type: "hunter_instinct", statKey: "permanentStats.hunterInstinctDamageBonus", damageBonus: 0.03 } },
    battleAura: { id: "battleAura", name: "Боевая Аура", description: "Враги в радиусе 100 получают +5% урона", baseCost: 500, costIncrease: 300, maxLevel: null, effect: { type: "battle_aura", statKey: "permanentStats.battleAura", radius: 100, damageIncreasePercent: 0.05 } },
    combatExperience: { id: "combatExperience", name: "Боевой Опыт", description: "+10% к опыту за убийства", baseCost: 600, costIncrease: 400, maxLevel: null, effect: { type: "kill_exp_bonus", statKey: "permanentStats.bonusKillExpPercent", value: 0.10 } }
};

// --- DEBUFFS ---
const DEBUFFS = {
    poisonBlood: { id: "poisonBlood", name: "Отравление Крови", description: "-2% к макс. ОЗ противника", baseCost: 400, costIncrease: 300, effect: { type: "stat_multiply", targetStatKey: "maxHealthModifierPercent", value: -0.02, applyMode: "multiply_total" } },
    deformWeapon: { id: "deformWeapon", name: "Деформация Оружия", description: "-1.5% к базовому урону противника", baseCost: 450, costIncrease: 350, effect: { type: "stat_multiply", targetStatKey: "baseDamageTakenDebuffMultiplier", value: -0.015, applyMode: "multiply_total" } },
    curseAccuracy: { id: "curseAccuracy", name: "Проклятие Точности", description: "-1% к шансу крит. удара противника", baseCost: 500, costIncrease: 400, effect: { type: "stat_add", targetStatKey: "critChanceTakenDebuffModifier", value: -0.01 } },
    maimMuscles: { id: "maimMuscles", name: "Увечье Мышц", description: "-2% к скорости атаки противника", baseCost: 500, costIncrease: 400, effect: { type: "stat_multiply_inverse", targetStatKey: "attackSpeedTakenDebuffMultiplier", value: -0.02, applyMode: "multiply_total" } },
    coordViolation: { id: "coordViolation", name: "Нарушение Координации", description: "-0.5% к шансу уклонения противника", baseCost: 550, costIncrease: 450, effect: { type: "stat_add", targetStatKey: "evasionTakenDebuffModifier", value: -0.005 } },
    spoilArmor: { id: "spoilArmor", name: "Порча Брони", description: "-1 к макс. зарядам брони противника (min 0)", baseCost: 600, costIncrease: 500, effect: { type: "stat_add_capped", targetStatKey: "maxArmorChargesDebuff", value: -1, minValue: null } },
    shortSightedness: { id: "shortSightedness", name: "Близорукость", description: "-5% к радиусу подбора бонусов противника", baseCost: 400, costIncrease: 300, effect: { type: "stat_multiply", targetStatKey: "pickupRadiusTakenDebuffMultiplier", value: -0.05, applyMode: "multiply_total" } },
    forgetfulness: { id: "forgetfulness", name: "Забывчивость", description: "-5% к получаемому опыту противника", baseCost: 650, costIncrease: 550, effect: { type: "stat_multiply", targetStatKey: "expGainTakenDebuffMultiplier", value: -0.05, applyMode: "multiply_total" } },
    bonusAllergy: { id: "bonusAllergy", name: "Аллергия на Бонусы", description: "Противник получает 5 урона при подборе бонуса", baseCost: 450, costIncrease: 350, effect: { type: "damage_on_pickup", targetStatKey: "bonusDamageOnPickup", value: 5 } },
    tremorCurse: { id: "tremorCurse", name: "Проклятие Дрожи", description: "+5% шанс промаха для противника", baseCost: 500, costIncrease: 400, effect: { type: "stat_add", targetStatKey: "missChanceDebuff", value: 0.05 } },
    exhaustSupplies: { id: "exhaustSupplies", name: "Истощение Запасов", description: "-10% к длит. полож. орбит. эффектов для цели", baseCost: 420, costIncrease: 320, effect: { type: "stat_multiply", targetStatKey: "positiveEffectDurationModifier", value: -0.10, applyMode: "multiply_total" } }
};

// --- BET TYPES ---
const BET_TYPES = {
    win: { id: "win", name: "На победу (1-е место)", payoutMultiplier: 3, description: "Выплата x3. Ставка теряется при любом другом исходе."},
    second_place: { id: "second_place", name: "На 2-е место", payoutMultiplier: 1.5, description: "Выплата x1.5. Ставка теряется при любом другом исходе."},
    third_place: { id: "third_place", name: "На 3-е место", payoutMultiplier: 1.3, description: "Выплата x1.3. Ставка теряется при любом другом исходе."},
    survival: { id: "survival", name: "На выживание", payoutMultiplier: 1.5, description: "Выплата x1.5, если гладиатор останется жив (независимо от места)."},
    kills_1: { id: "kills_1", name: "На 1+ убийство", payoutMultiplier: 1.2, perKillMultiplier: 0.5, baseKills: 1, description: "x1.2 + x0.5 за каждое убийство сверх 1."},
    kills_3: { id: "kills_3", name: "На 3+ убийства", payoutMultiplier: 2, perKillMultiplier: 0.7, baseKills: 3, description: "x2 + x0.7 за каждое убийство сверх 3."},
    risky_win_domination: { id: "risky_win_domination", name: "Рискованная победа (Доминация)", payoutMultiplier: 5, healthThreshold: 0.75, description: "Выплата x5 за победу с >75% ОЗ. Ставка сгорает при любом другом исходе."}
};

// --- SPECIAL ACTIONS (на 1 раунд) ---
const SPECIAL_ACTIONS = {
    exchangeExpForGold: { id: "exchangeExpForGold", name: "Обмен Опыта на Золото", description: "Понизить выбранный интеллект на 1 уровень (min 1) в обмен на 300 золота.", cost: 0, effect: { type: "exp_to_gold", goldAmount: 300, intellectPoints: 1 } },
    inspire: { id: "inspire", name: "Воодушевление", description: "+5% к шансу блока/уклонения в след. раунде.", baseCost: 200, costIncrease: 100, effect: { type: "temp_inspiration", bonusChance: 0.05 } },
    investWeapon: { id: "investWeapon", name: "Инвестиция в Оружие", description: "Получить случайное элитное оружие перед след. раундом.", baseCost: 800, costIncrease: 500, effect: { type: "temp_elite_weapon" } },
    regenerate: { id: "regenerate", name: "Регенерация", description: "Восст. 1 ОЗ каждые 2 сек. в след. раунде.", baseCost: 300, costIncrease: 200, effect: { type: "temp_regen", healthPerTick: 1, tickIntervalSeconds: 2 } }
};

// --- ECONOMIC UPGRADES (постоянные) ---
const ECONOMIC_UPGRADES = {
    passiveIncome: { id: "passiveIncome", name: "Пассивный Доход", description: "+50 золота в начале каждого раунда.", baseCost: 500, costIncrease: 300, effect: { type: "passive_gold", amount: 50 } },
    taxOptimization: { id: "taxOptimization", name: "Налоговая Оптимизация", description: "-10% к стоимости всех улучшений и дебаффов (до 3 раз).", cost: 1000, maxLevel: 3, effect: { type: "cost_reduction_all", percent: 0.10 } },
    godsOffering: { id: "godsOffering", name: "Подношение Божествам", description: "Случайный сильный бафф на следующий раунд.", cost: 1000, effect: { type: "random_powerful_buff_next_round" } }
};

// --- ECONOMIC PACTS (временные или постоянные с условиями) ---
const ECONOMIC_PACTS = {
    bloodPact: { id: "bloodPact", name: "Кровавый Пакт (+Приз, -ОЗ)", description: "+20% к призовым, но -10% к макс. ОЗ (постоянно).", cost: 0, oneTime: true, effect: { prizeBonusPercent: 0.20, maxHealthModifierPercent: -0.10 } },
    miserPact: { id: "miserPact", name: "Пакт Скупости (Заморозка + Бонус)", description: "Нельзя тратить золото 3 раунда, затем +50% к накопленной за это время сумме.", cost: 0, durationRounds: 3, effect: { type: "gold_freeze_bonus", bonusPercent: 0.50 } }
};

// --- ACHIEVEMENTS (награды за раунд) ---
const ACHIEVEMENTS_ROUND = {
    firstBlood: { id: "firstBlood", name: "Первая Кровь", condition: (fighter) => fighter.achievementsTrackers.killsThisRound > 0 && roundGlobalAchievements.firstBlood === undefined, reward: { type: "gold", amount: 100 }, oneTimePerRoundGlobal: true },
    masterSurvivor: { id: "masterSurvivor", name: "Мастер Выживания", condition: (fighter) => fighter.achievementsTrackers.timeSurvivedThisRound >= EXPERIENCE_REWARDS.master_survival_seconds_threshold, reward: { type: "gold", amount: 150 } },
    bonusCollector: { id: "bonusCollector", name: "Коллекционер Бонусов", condition: (fighter) => fighter.achievementsTrackers.bonusesCollectedThisRound >= EXPERIENCE_REWARDS.bonus_collector_threshold, reward: { type: "gold", amount: 50 } },
    greatEvader: { id: "greatEvader", name: "Великий Уклонист", condition: (fighter) => fighter.achievementsTrackers.successfulEvasionsThisRound >= EXPERIENCE_REWARDS.great_evader_threshold, reward: { type: "gold", amount: 75 } },
    leaderHunter: { id: "leaderHunter", name: "Охотник на Лидеров", condition: (fighter, leaderId) => fighter.achievementsTrackers.killedTargetIds && fighter.achievementsTrackers.killedTargetIds.includes(leaderId) && leaderId !== null && fighter.id !== leaderId, reward: { type: "gold", amount: 200 } },
    stylistKill: { id: "stylistKill", name: "Стилист", condition: (fighter) => fighter.achievementsTrackers.critKills > 0, reward: { type: "gold", amount: 50 } },
    flawlessVictory: { id: "flawlessVictory", name: "Неуязвимый", condition: (fighter) => fighter.alive && fighter.achievementsTrackers.damageTakenThisRound === 0 && fighter.achievementsTrackers.winsThisRound > 0, reward: { type: "gold", amount: 200 } },
    closeCallVictory: { id: "closeCallVictory", name: "На Грани", condition: (fighter, baseHealth) => fighter.alive && fighter.health < baseHealth * 0.1 && fighter.achievementsTrackers.winsThisRound > 0, reward: { type: "gold", amount: 100 } },
    duelMaster: { id: "duelMaster", name: "Мастер Дуэли", condition: (fighter) => fighter.achievementsTrackers.wonDuel, reward: { type: "gold", amount: 150 } }
};

// --- TITLES (временные бонусы на 1 раунд) ---
const TITLES = {
    champion: { id: "champion", name: "Чемпион", description: "+5% ко всем статам, но -50% к призовым.", durationRounds: 1, condition: (fighter) => fighter.winStreak >= 3, effects: { allStatsMultiplier: 1.05, prizeGoldMultiplier: 0.5 } },
    luckyOne: { id: "luckyOne", name: "Везунчик", description: "+10% к шансу уклонения.", durationRounds: 1, condition: (fighter) => fighter.achievementsTrackers.successfulEvasionsThisRound >= 5, effects: { evasionBonusAdd: 0.10 } },
    killer: { id: "killer", name: "Убийца", description: "+10% к урону оружия.", durationRounds: 1, condition: (fighter) => fighter.achievementsTrackers.killsThisRound >= 3, effects: { damageMultiplierAdd: 0.10 } },
    survivorPro: { id: "survivorPro", name: "Живучий", description: "+15% к макс. здоровью.", durationRounds: 1, condition: (fighter, baseHealth) => fighter.achievementsTrackers.timeSurvivedThisRound >= 75 && fighter.health < baseHealth * 0.1, effects: { maxHealthMultiplierAdd: 0.15 } },
    collectorPro: { id: "collectorPro", name: "Коллекционер PRO", description: "+25% к радиусу подбора.", durationRounds: 1, condition: (fighter) => fighter.achievementsTrackers.bonusesCollectedThisRound >= 5, effects: { pickupRadiusMultiplierAdd: 0.25 } }
};

// --- DYNAMIC BALANCE ---
const DYNAMIC_BALANCE = {
    richTaxPercent: 0.05,
    catchUpBonusEffectMultiplier: 1.10,
    badLuckCompensationGold: 200,
    badLuckStreakThreshold: 3,
    marketFluctuationPercent: 0.20,
    saleDiscountPercent: 0.30,
    highDemandPriceIncreasePercent: 0.25,
    diminishingReturnsThreshold: 5,
    diminishingReturnsFactor: 0.80,
    progressiveTaxThreshold1: 3,
    progressiveTaxPercent1: 0.10,
    progressiveTaxThreshold2: 5,
    progressiveTaxPercent2: 0.20,
};

// --- ОРУЖИЕ ---
const WEAPONS = [
    // Original 7
    { name: "Ржавый Меч", emoji: "⚔️", type: "melee", minDamage: 8, maxDamage: 12, range: 85, critChance: 0.05, speed: 1, effects: [] },
    { name: "Дубина", emoji: "🏏", type: "melee", minDamage: 10, maxDamage: 15, range: 80, critChance: 0.02, speed: 0.9, effects: [{ type: 'stun', chance: 0.1, duration: 2 }] },
    { name: "Короткий Лук", emoji: "🏹", type: "ranged", minDamage: 7, maxDamage: 10, range: 420, critChance: 0.08, speed: 1.1, projectile: "→", effects: [] },
    { name: "Метательные Ножи", emoji: "🔪", type: "ranged", minDamage: 5, maxDamage: 8, range: 320, critChance: 0.1, speed: 1.2, projectile: "∗", effects: [{ type: 'poison', chance: 0.15, dps: 2, duration: 3 }] },
    { name: "Боевой Топор", emoji: "🪓", type: "melee", minDamage: 12, maxDamage: 18, range: 95, critChance: 0.1, speed: 0.8, effects: [] },
    { name: "Магический Посох", emoji: "🪄", type: "ranged", minDamage: 10, maxDamage: 14, range: 470, critChance: 0.05, speed: 1, projectile: "✨", effects: [{ type: 'slow', chance: 0.2, factor: 0.5, duration: 2 }] },
    { name: "Цеп", emoji: "⛓️", type: "melee", minDamage: 9, maxDamage: 13, range: 125, critChance: 0.07, speed: 0.95, effects: [{ type: 'aoe_melee', radius: 55, selfImmune: true }] },

    // Expanded list (original 53)
    { name: "Тяжелый Молот", emoji: "🔨", type: "melee", minDamage: 13, maxDamage: 20, range: 90, critChance: 0.03, speed: 0.75, effects: [{ type: 'stun', chance: 0.12, duration: 1 }] },
    { name: "Острый Кинжал", emoji: "🗡️", type: "melee", minDamage: 6, maxDamage: 10, range: 75, critChance: 0.12, speed: 1.15, effects: [{ type: 'poison', chance: 0.1, dps: 1, duration: 3 }] },
    { name: "Длинный Лук", emoji: "⬆️", type: "ranged", minDamage: 9, maxDamage: 14, range: 480, critChance: 0.07, speed: 1.0, projectile: "➢", effects: [] },
    { name: "Легкий Арбалет", emoji: "🎯", type: "ranged", minDamage: 10, maxDamage: 16, range: 450, critChance: 0.09, speed: 0.9, projectile: "⇒", effects: [] },
    { name: "Боевой Посох", emoji: "🌿", type: "melee", minDamage: 9, maxDamage: 14, range: 100, critChance: 0.06, speed: 0.9, effects: [] },
    { name: "Зазубренная Секира", emoji: "🩸", type: "melee", minDamage: 14, maxDamage: 22, range: 92, critChance: 0.08, speed: 0.78, effects: [{ type: 'burn', chance: 0.05, dps: 2, duration: 2 }] },
    { name: "Метательный Молот", emoji: "💨", type: "ranged", minDamage: 11, maxDamage: 17, range: 250, critChance: 0.04, speed: 0.85, projectile: "ธ", effects: [{ type: 'stun', chance: 0.08, duration: 1 }] },
    { name: "Отравленные Дротики", emoji: "💧", type: "ranged", minDamage: 4, maxDamage: 7, range: 380, critChance: 0.05, speed: 1.25, projectile: "↦", effects: [{ type: 'poison', chance: 0.25, dps: 3, duration: 3 }] },
    { name: "Копье", emoji: "🔱", type: "melee", minDamage: 10, maxDamage: 16, range: 130, critChance: 0.07, speed: 0.95, effects: [] },
    { name: "Праща с Камнями", emoji: "🌀", type: "ranged", minDamage: 6, maxDamage: 11, range: 350, critChance: 0.03, speed: 1.05, projectile: "●", effects: [] },
    { name: "Стальной Кастет", emoji: "👊", type: "melee", minDamage: 7, maxDamage: 11, range: 70, critChance: 0.09, speed: 1.1, effects: [] },
    { name: "Огненный Жезл", emoji: "🔥", type: "ranged", minDamage: 9, maxDamage: 15, range: 400, critChance: 0.06, speed: 0.95, projectile: "☄️", effects: [{ type: 'burn', chance: 0.2, dps: 3, duration: 2 }] },
    { name: "Ледяной Клинок", emoji: "❄️", type: "melee", minDamage: 10, maxDamage: 15, range: 88, critChance: 0.05, speed: 0.98, effects: [{ type: 'slow', chance: 0.15, factor: 0.4, duration: 2 }] },
    { name: "Парные Кинжалы", emoji: "🔪🔪", type: "melee", minDamage: 7, maxDamage: 10, range: 78, critChance: 0.15, speed: 1.2, effects: [] },
    { name: "Утренняя Звезда", emoji: "🌟", type: "melee", minDamage: 12, maxDamage: 19, range: 95, critChance: 0.04, speed: 0.82, effects: [{ type: 'stun', chance: 0.1, duration: 1 }] },
    { name: "Сюрикены", emoji: "⭐", type: "ranged", minDamage: 3, maxDamage: 6, range: 300, critChance: 0.18, speed: 1.3, projectile: "✴", effects: [] },
    { name: "Двуручный Меч", emoji: "⬆️⚔️", type: "melee", minDamage: 15, maxDamage: 25, range: 110, critChance: 0.07, speed: 0.7, effects: [] },
    { name: "Электрический Хлыст", emoji: "⚡", type: "melee", minDamage: 8, maxDamage: 13, range: 140, critChance: 0.08, speed: 1.0, effects: [{ type: 'slow', chance: 0.1, factor: 0.3, duration: 2 }, { type: 'stun', chance: 0.05, duration: 1 }] },
    { name: "Взрывной Болт (Арбалет)", emoji: "💥🏹", type: "ranged", minDamage: 12, maxDamage: 20, range: 430, critChance: 0.05, speed: 0.8, projectile: "💣", effects: [{ type: 'aoe_ranged', radius: 40, selfImmune: false, subDamageFactor: 0.5 }] },
    { name: "Святой Молот", emoji: "✨🔨", type: "melee", minDamage: 11, maxDamage: 17, range: 93, critChance: 0.06, speed: 0.88, effects: [] },
    { name: "Темный Клинок", emoji: "🌑", type: "melee", minDamage: 10, maxDamage: 16, range: 90, critChance: 0.09, speed: 0.92, effects: [{ type: 'poison', chance: 0.1, dps: 2, duration: 4 }] },
    { name: "Проклятый Лук", emoji: "💀🏹", type: "ranged", minDamage: 8, maxDamage: 13, range: 460, critChance: 0.11, speed: 1.02, projectile: "☠", effects: [{ type: 'root', chance: 0.08, duration: 1 }] },
    { name: "Каменный Молот", emoji: "🗿", type: "melee", minDamage: 14,maxDamage: 23, range: 85, critChance: 0.02, speed: 0.65, effects: [{type:"stun", chance: 0.15, duration: 2}]},
    { name: "Костяной Лук", emoji: "🦴🏹", type: "ranged", minDamage: 7, maxDamage: 11, range: 410, critChance: 0.07, speed: 1.0, projectile: "🦴", effects: []},
    { name: "Изогнутая Сабля", emoji: "🌙", type: "melee", minDamage: 9, maxDamage: 15, range: 90, critChance: 0.08, speed: 1.05, effects: []},
    { name: "Малый Щит (для удара)", emoji: "🛡️💥", type: "melee", minDamage: 5, maxDamage: 9, range: 70, critChance: 0.03, speed: 0.9, effects: [{type:"stun", chance: 0.08, duration: 1}]},
    { name: "Отравленный Дыхательный Трубка", emoji: "🌬️💧", type: "ranged", minDamage: 2, maxDamage: 4, range: 280, critChance: 0.02, speed: 1.1, projectile: "💦", effects: [{type:"poison", chance: 0.3, dps: 4, duration: 3}]},
    { name: "Цепной Моргенштерн", emoji: "🔗🌟", type: "melee", minDamage: 10, maxDamage: 18, range: 115, critChance: 0.05, speed: 0.85, effects: [{ type: 'aoe_melee', radius: 50, selfImmune: true }]},
    { name: "Тяжелый Арбалет", emoji: "🏋️🏹", type: "ranged", minDamage: 13, maxDamage: 20, range: 500, critChance: 0.1, speed: 0.75, projectile: "BOLT", effects: []},
    { name: "Боевые Когти", emoji: "爪", type: "melee", minDamage: 8, maxDamage: 12, range: 72, critChance: 0.13, speed: 1.18, effects: []},
    { name: "Кристальный Посох", emoji: "💎🌿", type: "ranged", minDamage: 11, maxDamage: 17, range: 480, critChance: 0.07, speed: 0.93, projectile: "💠", effects: [{type:"slow", chance: 0.18, factor: 0.35, duration: 2}]},
    { name: "Железная Палица", emoji: "🔩🏏", type: "melee", minDamage: 12, maxDamage: 19, range: 82, critChance: 0.04, speed: 0.8, effects: [{type:"stun", chance: 0.11, duration: 1}]},
    { name: "Охотничье Копье", emoji: "🌲🔱", type: "ranged", minDamage: 9, maxDamage: 14, range: 320, critChance: 0.09, speed: 0.97, projectile: "↑", effects: []},
    { name: "Деревянный Щит (атака)", emoji: "🪵🛡️", type: "melee", minDamage: 4, maxDamage: 7, range: 65, critChance: 0.01, speed: 0.85, effects: []},
    { name: "Метательные Топоры", emoji: "🪓💨", type: "ranged", minDamage: 8, maxDamage: 14, range: 290, critChance: 0.08, speed: 0.9, projectile: "AXE", effects: []},
    { name: "Ядовитый Кнут", emoji: "🐍⛓️", type: "melee", minDamage: 7, maxDamage: 11, range: 135, critChance: 0.06, speed: 1.05, effects: [{type: "poison", chance: 0.25, dps: 2, duration: 4}]},
    { name: "Священная Книга (удар)", emoji: "📖💥", type: "melee", minDamage: 6, maxDamage: 10, range: 75, critChance: 0.02, speed: 0.9, effects: [{type: "stun", chance: 0.1, duration: 1}, {type: "slow", chance: 0.1, factor: 0.2, duration: 2}]},
    { name: "Чакрам", emoji: "💿", type: "ranged", minDamage: 9, maxDamage: 13, range: 360, critChance: 0.12, speed: 1.1, projectile: "🔄", effects: []},
    { name: "Кистень", emoji: "💣⛓️", type: "melee", minDamage: 11, maxDamage: 17, range: 100, critChance: 0.05, speed: 0.88, effects: [{type: "stun", chance: 0.12, duration: 1}]},
    { name: "Посох Призывателя (слабый удар)", emoji: "👻🌿", type: "melee", minDamage: 5, maxDamage: 8, range: 80, critChance: 0.01, speed: 0.95, effects: []},
    { name: "Трезубец", emoji: "🌊🔱", type: "melee", minDamage: 12, maxDamage: 19, range: 120, critChance: 0.08, speed: 0.92, effects: []},
    { name: "Отравленные Шипы (ловушка)", emoji: "🌵💧", type: "melee", minDamage: 4, maxDamage: 7, range: 70, critChance: 0.03, speed: 1.0, effects: [{type:"poison", chance: 0.4, dps: 3, duration: 2}]},
    { name: "Бумеранг", emoji: "↩️", type: "ranged", minDamage: 7, maxDamage: 12, range: 330, critChance: 0.07, speed: 1.0, projectile: "🔄", effects: []},
    { name: "Болас", emoji: "➰", type: "ranged", minDamage: 3, maxDamage: 6, range: 280, critChance: 0.02, speed: 0.9, projectile: "➿", effects: [{type: "root", chance: 0.25, duration: 2}]},
    { name: "Тяжелая Цепь", emoji: "🔗⛓️", type: "melee", minDamage: 10, maxDamage: 16, range: 110, critChance: 0.04, speed: 0.8, effects: [{type:"slow", chance: 0.15, factor: 0.4, duration: 1}]},
    { name: "Осадный Лук", emoji: "🏰🏹", type: "ranged", minDamage: 14, maxDamage: 22, range: 550, critChance: 0.05, speed: 0.65, projectile: "❱❱❱", effects: []},
    { name: "Ритуальный Кинжал", emoji: "🩸🗡️", type: "melee", minDamage: 8, maxDamage: 13, range: 77, critChance: 0.1, speed: 1.1, effects: [{type: "lifesteal", chance: 0.1, percent: 0.15}]},
    { name: "Ледяные Осколки (снаряд)", emoji: "❄️✨", type: "ranged", minDamage: 6, maxDamage: 10, range: 400, critChance: 0.08, speed: 1.15, projectile: "❄", effects: [{type:"slow", chance: 0.2, factor: 0.3, duration: 2}]},
    { name: "Гарпун", emoji: "⚓", type: "ranged", minDamage: 10, maxDamage: 15, range: 300, critChance: 0.06, speed: 0.8, projectile: "⚓", effects: [{type: "pull", chance: 0.15, distance: 50}]},
    { name: "Книга Заклинаний (огненный шар)", emoji: "🔥📖", type: "ranged", minDamage: 9, maxDamage: 16, range: 440, critChance: 0.07, speed: 0.95, projectile: "🔥", effects: [{type: "burn", chance: 0.18, dps: 3, duration: 2}]},
    { name: "Молот Земли", emoji: "🌍🔨", type: "melee", minDamage: 13, maxDamage: 21, range: 92, critChance: 0.03, speed: 0.7, effects: [{type: "aoe_melee", radius: 60, selfImmune: true, subDamageFactor: 0.4}]},
    { name: "Ветряной Клинок", emoji: "🌬️⚔️", type: "melee", minDamage: 9, maxDamage: 14, range: 95, critChance: 0.09, speed: 1.12, effects: [{type: "push", chance: 0.1, distance: 40}]},
    { name: "Метательные Иглы", emoji: "針", type: "ranged", minDamage: 2, maxDamage: 5, range: 310, critChance: 0.15, speed: 1.35, projectile: "|", effects: [{type: "poison", chance: 0.1, dps: 1, duration: 5}]},
    { name: "Энергетический Меч", emoji: "💡⚔️", type: "melee", minDamage: 10, maxDamage: 17, range: 90, critChance: 0.07, speed: 1.0, effects: []},
    { name: "Звуковой Удар (посох)", emoji: "🔊🌿", type: "ranged", minDamage: 8, maxDamage: 12, range: 380, critChance: 0.04, speed: 0.9, projectile: "🎶", effects: [{type: "stun", chance: 0.08, duration: 1}]},

    // Первая партия новых 20 оружий (добавлена ранее)
    { name: "Боевой Веер", emoji: "🪭", type: "melee", minDamage: 7, maxDamage: 11, range: 90, critChance: 0.06, speed: 1.15, effects: [{ type: 'push', chance: 0.2, distance: 25 }] },
    { name: "Серп", emoji: "낫", type: "melee", minDamage: 9, maxDamage: 14, range: 95, critChance: 0.10, speed: 1.0, effects: [{ type: 'lifesteal', chance: 0.05, percent: 0.10 }] },
    { name: "Катана", emoji: "🎌", type: "melee", minDamage: 11, maxDamage: 17, range: 100, critChance: 0.12, speed: 1.05, effects: [] },
    { name: "Рапира", emoji: "🤺", type: "melee", minDamage: 8, maxDamage: 13, range: 105, critChance: 0.18, speed: 1.2, effects: [{ type: 'armor_pierce', chance: 0.1 }] },
    { name: "Боевая Коса", emoji: "💀🔪", type: "melee", minDamage: 14, maxDamage: 22, range: 120, critChance: 0.08, speed: 0.8, effects: [{ type: 'aoe_melee', radius: 60, selfImmune: true }] }, // Changed emoji
    { name: "Нунчаки", emoji: "🥋", type: "melee", minDamage: 6, maxDamage: 9, range: 80, critChance: 0.05, speed: 1.3, effects: [{ type: 'stun', chance: 0.1, duration: 1 }] },
    { name: "Алебарда", emoji: "⚰️", type: "melee", minDamage: 13, maxDamage: 20, range: 130, critChance: 0.07, speed: 0.85, effects: [] }, // Changed emoji
    { name: "Клеймор", emoji: "⚔️⬆️", type: "melee", minDamage: 16, maxDamage: 26, range: 115, critChance: 0.06, speed: 0.65, effects: [] }, // Changed emoji
    { name: "Защитный Багор", emoji: "⚓🎣", type: "melee", minDamage: 9, maxDamage: 15, range: 125, critChance: 0.04, speed: 0.9, effects: [{ type: 'pull', chance: 0.1, distance: 30 }] }, // Changed emoji
    { name: "Шипастая Перчатка", emoji: "🧤🌵", type: "melee", minDamage: 10, maxDamage: 14, range: 75, critChance: 0.09, speed: 1.1, effects: [{ type: 'poison', chance: 0.08, dps: 2, duration: 2 }] }, // Changed emoji
    { name: "Композитный Лук", emoji: "🎯🏹", type: "ranged", minDamage: 10, maxDamage: 15, range: 460, critChance: 0.10, speed: 1.0, projectile: "➶", effects: [] },
    { name: "Метательные Дротики (Слоу)", emoji: "🎯❄️", type: "ranged", minDamage: 4, maxDamage: 7, range: 350, critChance: 0.12, speed: 1.25, projectile: "→", effects: [{ type: 'slow', chance: 0.15, factor: 0.4, duration: 2 }] },
    { name: "Огненные Стрелы", emoji: "🔥🏹", type: "ranged", minDamage: 8, maxDamage: 13, range: 430, critChance: 0.07, speed: 1.05, projectile: "➹", effects: [{ type: 'burn', chance: 0.25, dps: 3, duration: 3 }] },
    { name: "Тяжелая Праща (Стан)", emoji: "🏋️🌀", type: "ranged", minDamage: 9, maxDamage: 16, range: 380, critChance: 0.04, speed: 0.9, projectile: "⬤", effects: [{ type: 'stun', chance: 0.1, duration: 1 }] },
    { name: "Самострел", emoji: "⚙️🏹", type: "ranged", minDamage: 11, maxDamage: 17, range: 480, critChance: 0.08, speed: 0.85, projectile: "BOLT", effects: [] },
    { name: "Ледяные Дротики (Рут)", emoji: "❄️🎯", type: "ranged", minDamage: 6, maxDamage: 10, range: 360, critChance: 0.06, speed: 1.1, projectile: "❄️", effects: [{ type: 'root', chance: 0.1, duration: 1.5 }] }, // Changed name slightly
    { name: "Длинные Метательные Ножи", emoji: "🔪🔪🔪", type: "ranged", minDamage: 7, maxDamage: 11, range: 390, critChance: 0.09, speed: 1.15, projectile: "∗∗", effects: [] },
    { name: "Кислотные Сферы", emoji: "🧪🟢", type: "ranged", minDamage: 5, maxDamage: 9, range: 340, critChance: 0.05, speed: 1.0, projectile: "🦠", effects: [{ type: 'poison', chance: 0.3, dps: 4, duration: 3 }] },
    { name: "Световые Болты", emoji: "✨🏹", type: "ranged", minDamage: 10, maxDamage: 14, range: 500, critChance: 0.11, speed: 0.95, projectile: "✧", effects: [] },
    { name: "Рикошетящий Диск", emoji: "🔄💿", type: "ranged", minDamage: 8, maxDamage: 13, range: 400, critChance: 0.07, speed: 1.0, projectile: "💿", effects: [{ type: 'aoe_ranged', radius: 30, selfImmune: true, subDamageFactor: 0.6 }] }, // Убрал maxBounces, т.к. не реализовано

    // --- НОВЫЕ 20 ОРУЖИЙ (ВТОРАЯ ПАРТИЯ) ---
    // 10 Ближнего боя
    { name: "Кнут Укротителя", emoji: "🤠", type: "melee", minDamage: 7, maxDamage: 12, range: 150, critChance: 0.05, speed: 1.1, effects: [{ type: 'pull', chance: 0.1, distance: 40 }] },
    { name: "Тяжелый Щит (Оглушение)", emoji: "🛡️💫", type: "melee", minDamage: 6, maxDamage: 10, range: 70, critChance: 0.02, speed: 0.8, effects: [{ type: 'stun', chance: 0.2, duration: 1.5 }] },
    { name: "Морской Якорь", emoji: "⚓", type: "melee", minDamage: 15, maxDamage: 24, range: 90, critChance: 0.03, speed: 0.6, effects: [{ type: 'slow', chance: 0.3, factor: 0.5, duration: 2.5 }] },
    { name: "Парные Топорики", emoji: "🪓🪓", type: "melee", minDamage: 9, maxDamage: 15, range: 85, critChance: 0.12, speed: 1.05, effects: [] },
    { name: "Энергетический Молот", emoji: "💡🔨", type: "melee", minDamage: 12, maxDamage: 19, range: 95, critChance: 0.06, speed: 0.8, effects: [{ type: 'aoe_melee', radius: 50, selfImmune: true, subDamageFactor: 0.4 }] },
    { name: "Трость Фехтовальщика", emoji: "🦯", type: "melee", minDamage: 8, maxDamage: 12, range: 100, critChance: 0.15, speed: 1.25, effects: [] },
    { name: "Кровавый Тесак", emoji: "🩸🔪", type: "melee", minDamage: 13, maxDamage: 20, range: 90, critChance: 0.07, speed: 0.9, effects: [{ type: 'lifesteal', chance: 0.15, percent: 0.20 }] },
    { name: "Ледяная Глефа", emoji: "❄️📏", type: "melee", minDamage: 11, maxDamage: 18, range: 130, critChance: 0.08, speed: 0.88, effects: [{ type: 'root', chance: 0.1, duration: 1.5 }] }, // Emoji placeholder
    { name: "Призрачный Клинок", emoji: "👻⚔️", type: "melee", minDamage: 10, maxDamage: 16, range: 95, critChance: 0.10, speed: 1.1, effects: [{ type: 'armor_pierce', chance: 0.15}] },
    { name: "Осадный Таран (мини)", emoji: "🪵➡️", type: "melee", minDamage: 18, maxDamage: 28, range: 80, critChance: 0.02, speed: 0.55, effects: [{ type: 'push', chance: 0.4, distance: 50 }] },

    // 10 Дальнего боя
    { name: "Лук Сокола", emoji: "🦅🏹", type: "ranged", minDamage: 9, maxDamage: 14, range: 520, critChance: 0.12, speed: 1.1, projectile: "➢➢", effects: [] },
    { name: "Метательное Копье", emoji: "🎯🔱", type: "ranged", minDamage: 12, maxDamage: 19, range: 350, critChance: 0.08, speed: 0.9, projectile: "↑↑", effects: [{ type: 'armor_pierce', chance: 0.1 }] },
    { name: "Разрывные Стрелы", emoji: "💥🏹", type: "ranged", minDamage: 10, maxDamage: 16, range: 440, critChance: 0.06, speed: 1.0, projectile: "☄", effects: [{ type: 'aoe_ranged', radius: 35, selfImmune: false, subDamageFactor: 0.55 }] },
    { name: "Отравленный Дротик (Сильный)", emoji: "☠️💧", type: "ranged", minDamage: 3, maxDamage: 6, range: 320, critChance: 0.04, speed: 1.2, projectile: "💧*", effects: [{ type: 'poison', chance: 0.5, dps: 5, duration: 4 }] },
    { name: "Магические Ракеты", emoji: "🪄🚀", type: "ranged", minDamage: 7, maxDamage: 11, range: 470, critChance: 0.05, speed: 1.15, projectile: "🚀", effects: [{ type: 'burn', chance: 0.15, dps: 2, duration: 3 }] }, // projectile can be multiple
    { name: "Снайперский Арбалет", emoji: "🔭🏹", type: "ranged", minDamage: 15, maxDamage: 25, range: 650, critChance: 0.20, speed: 0.6, projectile: "BOLT+", effects: [] },
    { name: "Гарпунная Пушка", emoji: "⚓💣", type: "ranged", minDamage: 13, maxDamage: 20, range: 280, critChance: 0.05, speed: 0.7, projectile: "⚓➡️", effects: [{ type: 'pull', chance: 0.3, distance: 60 }, {type: 'stun', chance: 0.1, duration: 1}] },
    { name: "Взрывчатая Слизь", emoji: "🦠💥", type: "ranged", minDamage: 8, maxDamage: 14, range: 300, critChance: 0.03, speed: 0.95, projectile: "🦠", effects: [{ type: 'aoe_ranged', radius: 45, selfImmune: false, subDamageFactor: 0.6 }, {type: 'slow', chance: 0.2, factor: 0.4, duration: 2.5}] },
    { name: "Электрические Диски", emoji: "⚡💿", type: "ranged", minDamage: 9, maxDamage: 15, range: 420, critChance: 0.09, speed: 1.05, projectile: "💿⚡", effects: [{type: 'stun', chance: 0.08, duration: 1}, {type: 'slow', chance: 0.1, factor: 0.25, duration: 2}] },
    { name: "Теневые Иглы", emoji: "🌑針", type: "ranged", minDamage: 6, maxDamage: 9, range: 370, critChance: 0.13, speed: 1.3, projectile: "↝", effects: [{type: 'poison', chance: 0.15, dps: 3, duration: 2.5}]}
];

const ELITE_WEAPONS = [
    { name: "Огненный Клинок", emoji: "🔥", type: "melee", minDamage: 20, maxDamage: 30, range: 110, critChance: 0.15, speed: 1, effects: [{ type: 'burn', chance: 0.5, dps: 5, duration: 3 }] },
    { name: "Громовой Молот", emoji: "⚡", type: "melee", minDamage: 25, maxDamage: 35, range: 100, critChance: 0.1, speed: 0.7, effects: [{ type: 'stun', chance: 0.3, duration: 3 }, { type: 'aoe_melee', radius: 75, selfImmune: true }] },
    { name: "Ледяной Лук", emoji: "❄️", type: "ranged", minDamage: 18, maxDamage: 25, range: 520, critChance: 0.12, speed: 1.1, projectile: "❄️", effects: [{ type: 'slow', chance: 0.4, factor: 0.3, duration: 3 }, { type: 'root', chance: 0.1, duration: 2 }] },
    { name: "Клинок Бури", emoji: "🌪️", type: "melee", minDamage: 22, maxDamage: 32, range: 115, critChance: 0.18, speed: 1.05, effects: [{ type: 'aoe_melee', radius: 65, selfImmune: true }, { type: 'slow', chance: 0.25, factor: 0.3, duration: 2 }] },
    { name: "Посох Архимага", emoji: "🌟", type: "ranged", minDamage: 20, maxDamage: 28, range: 550, critChance: 0.1, speed: 1, projectile: "🌠", effects: [{ type: 'burn', chance: 0.3, dps: 6, duration: 3 }, { type: 'stun', chance: 0.15, duration: 1 }] },
    { name: "Коса Жнеца", emoji: "💀", type: "melee", minDamage: 28, maxDamage: 40, range: 120, critChance: 0.2, speed: 0.8, effects: [{ type: 'poison', chance: 0.4, dps: 7, duration: 4 }, {type: 'lifesteal', chance: 0.2, percent: 0.25}] },
    { name: "Арбалет Истребителя", emoji: "☣️", type: "ranged", minDamage: 25, maxDamage: 35, range: 600, critChance: 0.25, speed: 0.9, projectile: "☣️", effects: [{ type: 'root', chance: 0.2, duration: 2 }, {type: 'armor_pierce', chance: 0.3}] },
    { name: "Молот Титана", emoji: "🌋", type: "melee", minDamage: 30, maxDamage: 45, range: 95, critChance: 0.08, speed: 0.6, effects: [{ type: 'stun', chance: 0.4, duration: 3 }, { type: 'aoe_melee', radius: 80, selfImmune: true }, {type: 'burn', chance: 0.2, dps: 4, duration: 2}] },
    { name: "Лук Звездного Охотника", emoji: "🌌", type: "ranged", minDamage: 20, maxDamage: 30, range: 580, critChance: 0.15, speed: 1.15, projectile: "⭐", effects: [{ type: 'slow', chance: 0.3, factor: 0.25, duration: 3 }, { type: 'burn', chance: 0.2, dps: 5, duration: 2 }] },
    { name: "Парные Клинки Хаоса", emoji: "⛓️", type: "melee", minDamage: 18, maxDamage: 26, range: 125, critChance: 0.16, speed: 1.2, effects: [{ type: 'aoe_melee', radius: 70, selfImmune: true }, { type: 'burn', chance: 0.35, dps: 4, duration: 3 }] },
    { name: "Скипетр Забвения", emoji: "🔮", type: "ranged", minDamage: 24, maxDamage: 33, range: 530, critChance: 0.11, speed: 0.95, projectile: "🔮", effects: [{ type: 'poison', chance: 0.3, dps: 6, duration: 4 }, { type: 'slow', chance: 0.2, factor: 0.4, duration: 3 }] },
    { name: "Копье Драконоборца", emoji: "🐉", type: "melee", minDamage: 26, maxDamage: 38, range: 140, critChance: 0.13, speed: 0.9, effects: [{ type: 'burn', chance: 0.4, dps: 5, duration: 3}] },
    { name: "Рукавицы Титана", emoji: "👊", type: "melee", minDamage: 20, maxDamage: 30, range: 80, critChance: 0.1, speed: 1.0, effects: [{type: 'stun', chance: 0.25, duration: 2}]},
    { name: "Лук Шепота Ветра", emoji: "🍃", type: "ranged", minDamage: 19, maxDamage: 27, range: 620, critChance: 0.14, speed: 1.2, projectile: "~", effects: [{type: 'poison', chance: 0.2, dps: 4, duration: 3}, {type: 'slow', chance: 0.2, factor: 0.2, duration: 3}]},
    { name: "Секира Варвара", emoji: "😡", type: "melee", minDamage: 27, maxDamage: 39, range: 105, critChance: 0.12, speed: 0.75, effects: [{type: 'aoe_melee', radius: 60, selfImmune: true}]},
    { name: "Посох Землетрясения", emoji: "🧱", type: "ranged", minDamage: 22, maxDamage: 31, range: 500, critChance: 0.09, speed: 0.85, projectile: "🧱", effects: [{type: 'stun', chance: 0.2, duration: 2}, {type: 'root', chance: 0.15, duration: 2}, {type: 'aoe_ranged', radius: 50, selfImmune: false, subDamageFactor: 0.6}]},
    { name: "Меч Солнечной Ярости", emoji: "☀️", type: "melee", minDamage: 24, maxDamage: 34, range: 112, critChance: 0.17, speed: 1.02, effects: [{type: 'burn', chance: 0.5, dps: 6, duration: 3}]}
];

// --- СТАТУСНЫЕ ЭФФЕКТЫ ---
const STATUS_EFFECT_DEFINITIONS = {
    poison: { dps: 0, duration: 0, color: 'var(--poison-color)' },
    stun: { duration: 0, color: 'var(--warning-color)' },
    root: { duration: 0, color: 'var(--root-color)' },
    slow: { factor: 1, duration: 0, color: 'var(--slow-color)' },
    enrage: { damageMultiplier: 1, speedMultiplier: 1, duration: 0, color: 'var(--enrage-color)' },
    burn: { dps: 0, duration: 0, color: 'var(--danger-color)'},
    lifesteal: { percent: 0 },
    pull: { distance: 0 },
    push: { distance: 0 },
    armor_pierce: {},
    oe_generic_status: { duration: 0, onApply: null, onRemove: null, originalValues: {} },
    oe_speed_boost_effect: { originalSpeed: 0, duration: 0, onApply: null, onRemove: null },
    oe_damage_boost_effect: { originalMultiplier: 1, duration: 0, onApply: null, onRemove: null },
    oe_evasion_boost_effect: { originalEvasion: 0, duration: 0, onApply: null, onRemove: null },
    oe_crit_boost_effect: { originalCritChance: 0, duration: 0, onApply: null, onRemove: null },
    oe_lifesteal_aura_effect: { lifestealPercent: 0, duration: 0, onApply: null, onRemove: null },
    oe_thorns_effect: { reflectDamage: 0, duration: 0, onApply: null, onRemove: null },
    oe_vulnerability_effect: { originalTakenMultiplier: 1, duration: 0, onApply: null, onRemove: null },
    oe_slow_aura_effect: { originalSpeed: 0, duration: 0, onApply: null, onRemove: null },
    oe_disarm_effect: { originalMultiplier: 1, duration: 0, onApply: null, onRemove: null },
    oe_confusion_effect: { duration: 0, originalPreferredTarget: '', attacksAffected: 1, onApply: null, onRemove: null },
    oe_silence_effect: { duration: 0 },
    oe_drain_tactical_effect: { duration: 0, originalValue: 0, drainAmount: 1, onApply: null, onRemove: null, intellectTypeToDrain: 'tactical' },
    oe_drain_defense_effect: { duration: 0, originalValue: 0, drainAmount: 1, onApply: null, onRemove: null, intellectTypeToDrain: 'defense' },
    oe_drain_resource_effect: { duration: 0, originalValue: 0, drainAmount: 1, onApply: null, onRemove: null, intellectTypeToDrain: 'resource' },
    oe_drain_spatial_effect: { duration: 0, originalValue: 0, drainAmount: 1, onApply: null, onRemove: null, intellectTypeToDrain: 'spatial' },
    oe_increased_cooldowns_effect: { duration: 0, cooldownMultiplier: 1 },
    oe_invulnerability_effect: { duration: 0, onApply: null, onRemove: null },
    oe_range_boost_effect: { duration: 0, originalRange: 0, onApply: null, onRemove: null },
    oe_crit_defense_effect: { duration: 0, nullifyNextCrit: false, onApply: null, onRemove: null },
    oe_swift_retreat_effect: { duration: 0, isActive: false, originalSpeed: 0, speedBonus:1, healthThreshold:0.2, bonusDurationTicks:0, triggeredThisRound: false, onApply: null, onRemove: null },
    oe_intellect_focus_tactical_effect: { duration: 0, originalTactical: 0, onApply: null, onRemove: null },
    oe_kinetic_barrier_effect: { duration: 0, hitsLeft: 0, damageReduction: 1, originalDamageTakenMultiplier:1, onApply:null, onRemove:null },
    oe_temporal_acceleration_effect: { duration:0, originalCooldownMultiplier:1, onApply:null, onRemove:null },
    oe_bonus_magnet_effect: { duration: 0, originalPickupRadiusFactor: 1, onApply: null, onRemove: null },
    oe_reactive_armor_effect: { duration:0, charges:0, threshold:0, pushDistance:0, onApply:null, onRemove:null },
    oe_weapon_jam_effect: { duration: 0, onApply: null, onRemove: null },
    oe_accuracy_debuff_effect: { duration: 0, originalCritChance: 0, originalRange: 0, isRanged:false, missChance:0.15, onApply: null, onRemove: null },
    oe_health_burn_percent_effect: { duration: 0, dpsPercent: 0, onApply: null, onRemove: null },
    oe_intellect_disrupt_defense_effect: { duration: 0, originalDefense: 0, onApply: null, onRemove: null },
    oe_fumble_effect: { duration: 0, chance: 0, oneTimeUse: true, onApply: null, onRemove: null },
    oe_disorient_movement_effect: { duration: 0, onApply: null, onRemove: null },
    oe_marked_for_death_effect: { duration: 0, originalTakenMultiplier: 1, onApply: null, onRemove: null },
    oe_shared_pain_effect: { duration: 0, percent: 0, onApply: null, onRemove: null },
    oe_sluggish_projectiles_effect: { duration: 0, speedFactor: 1, onApply: null, onRemove: null },
    oe_gravity_well_effect: { duration: 0, radius: 0, strength: 0, x:0, y:0, onApply: null, onRemove: null }
};

// --- МОДИФИКАТОРЫ РАУНДА ---
const MODIFIER_CHANCE_PER_ROUND = 0.25;
const roundModifiers = [
    {
        name: "Ярость Берсерка",
        description: "Все бойцы наносят на 25% больше урона, но получают на 15% больше урона.",
        apply: (fighter) => {
            fighter.damageOutputMultiplier = (fighter.damageOutputMultiplier || 1) * 1.25;
            fighter.damageTakenMultiplier = (fighter.damageTakenMultiplier || 1) * 1.15;
        },
        remove: (fighter) => {
            if (fighter && fighter.damageOutputMultiplier) fighter.damageOutputMultiplier /= 1.25;
            if (fighter && fighter.damageTakenMultiplier) fighter.damageTakenMultiplier /= 1.15;
        }
    },
    {
        name: "Быстрые Ноги",
        description: "Скорость передвижения всех бойцов увеличена на 30%.",
        apply: (fighter) => { fighter.speed = (fighter.speed || fighter.baseSpeed) * 1.3; },
        remove: (fighter) => { if (fighter && fighter.speed && fighter.baseSpeed) fighter.speed = fighter.baseSpeed; }
    },
    {
        name: "Густой Туман",
        description: "Дальность атаки всех дальнобойных оружий снижена на 30%.",
        apply: (fighter) => {
            if (fighter.weapon && fighter.weapon.type === 'ranged') fighter.weapon.currentRange = (fighter.weapon.currentRange || fighter.weapon.range) * 0.7;
        },
        remove: (fighter) => {
             if (fighter && fighter.weapon && fighter.weapon.type === 'ranged' && fighter.weapon.range) {
                 fighter.weapon.currentRange = fighter.weapon.range;
             }
        }
    },
    {
        name: "Целебный Воздух",
        description: "Все бойцы медленно восстанавливают 1 ОЗ за игровой тик.",
        applyTick: (fighter) => {
            if (fighter.health < fighter.maxHealth) {
                fighter.health = Math.min(fighter.maxHealth, fighter.health + 1);
            }
        }
    },
    {
        name: "Хрупкая Броня",
        description: "Вся подобранная броня имеет на 1 заряд меньше.",
    }
];

// --- НАЧАЛЬНЫЕ ДАННЫЕ ГЛАДИАТОРОВ ---
const fightersInitialData = [
     { id: "fighter1", name: "Артем", image: "images/Артём.jpg", wins: 0, combatStats: { preferredTargetType: 'closest', caution: 0.02, aggression: 0.98, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter2", name: "Влад", image: "images/Влад.jpg", wins: 0, combatStats: { preferredTargetType: 'weakest', caution: 0.04, aggression: 0.95, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter3", name: "Глеб", image: "images/Глеб.jpg", wins: 0, combatStats: { preferredTargetType: 'highest_threat', caution: 0.03, aggression: 0.96, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter4", name: "Егор", image: "images/Егор.jpg", wins: 0, combatStats: { preferredTargetType: 'random', caution: 0.01, aggression: 0.99, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter5", name: "Федя", image: "images/Федя.jpg", wins: 0, combatStats: { preferredTargetType: 'closest', caution: 0.05, aggression: 0.90, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter6", name: "Anton", image: "images/Anton.jpg", wins: 0, combatStats: { preferredTargetType: 'weakest', caution: 0.06, aggression: 0.88, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter7", name: "Astik", image: "images/Astik.jpg", wins: 0, combatStats: { preferredTargetType: 'highest_threat', caution: 0.02, aggression: 0.97, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter8", name: "Ivan", image: "images/Ivan.jpg", wins: 0, combatStats: { preferredTargetType: 'closest', caution: 0.04, aggression: 0.92, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter9", name: "Karen", image: "images/Karen.jpg", wins: 0, combatStats: { preferredTargetType: 'random', caution: 0.015, aggression: 0.95, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}},
     { id: "fighter10", name: "Wladeo", image: "images/Wladeo.jpg", wins: 0, combatStats: { preferredTargetType: 'weakest', caution: 0.03, aggression: 0.93, learnedGrudges: {}, intellect: { tactical: 1, defense: 1, resource: 1, spatial: 1 }, experience: { tactical: 0, defense: 0, resource: 0, spatial: 0 }, learning: { weaponEffectiveness: {}, targetPriorities: {}, dangerousEnemies: {}, optimalDistances: {}, successfulPatterns: [] }}}
];

// --- ОРБИТАЛЬНЫЕ ЭФФЕКТЫ (КОНСТАНТЫ) ---
const ORBITAL_EFFECT_ORBIT_RADIUS = 550;
const ORBITAL_EFFECT_SIZE_ON_ARENA = 35;
const ORBITAL_EFFECT_SPEED_FACTOR = 0.0015 * 3 * 900;
const MAX_ORBITAL_EFFECTS_PER_ROUND = 7;
const ORBITAL_EFFECT_PROJECTILE_SPEED_VALUE = 25;
const ORBITAL_EFFECTS_POOL = [
    {
        id: "oe_heal_small", name: "Малое Исцеление", description: "Лечит 30 ОЗ", icon: "💖", type: "buff", color: "lightgreen",
        action: (target) => { if (target.alive) { target.health = Math.min(target.maxHealth, target.health + 30); logMessage(`<span style="color:lightgreen;">${target.name} исцелен на 30 ОЗ орбитальным эффектом!</span>`, "log-bonus"); updateFighterElementOnArena(target); } },
        cooldown: 25000, duration: 0
    },
    {
        id: "oe_temp_shield", name: "Временный Щит", description: "Дает +1 заряд брони (стакается)", icon: "🛡️", type: "buff", color: "lightblue",
        action: (target) => { if (target.alive) { if (!target.hasArmor) { target.maxArmorHits = 1; target.armorHits = 1; target.hasArmor = true; } else { target.maxArmorHits = Math.max(target.maxArmorHits + 1, target.armorHits + 1); target.armorHits += 1; } logMessage(`<span style="color:lightblue;">${target.name} получает +1 заряд брони от орбиты! (Всего: ${target.armorHits})</span>`, "log-armor"); updateFighterElementOnArena(target); } },
        cooldown: 40000, duration: 0
    },
    {
        id: "oe_speed_boost", name: "Ускорение", description: "Скорость +60% на 6с", icon: "💨", type: "buff", color: "cyan",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_speed_boost_effect', { originalSpeed: target.speed, duration: Math.round(6000 / GAME_SPEED), onApply: (t) => { t.speed *= 1.6; }, onRemove: (t, effectDetails) => { t.speed = effectDetails.originalSpeed; } }); logMessage(`<span style="color:cyan;">${target.name} ускорен орбитой!</span>`, "log-effect"); } },
        cooldown: 35000, duration: 6000
    },
    {
        id: "oe_damage_boost", name: "Ярость", description: "Урон +35% на 6с", icon: "💪", type: "buff", color: "orange",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_damage_boost_effect', { originalMultiplier: target.damageOutputMultiplier, duration: Math.round(6000 / GAME_SPEED), onApply: (t) => { t.damageOutputMultiplier = (t.damageOutputMultiplier || 1) * 1.35; }, onRemove: (t, effectDetails) => { t.damageOutputMultiplier = effectDetails.originalMultiplier; } }); logMessage(`<span style="color:orange;">${target.name} в ярости от орбиты!</span>`, "log-enrage"); } },
        cooldown: 45000, duration: 6000
    },
    {
        id: "oe_evasion_boost", name: "Ловкость", description: "Уклонение +20% на 7с", icon: "🤸", type: "buff", color: "#B3E5FC",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_evasion_boost_effect', { originalEvasion: target.evasionChance, duration: Math.round(7000 / GAME_SPEED), onApply: (t) => { t.evasionChance = Math.min(0.9, (t.evasionChance || 0) + 0.20); }, onRemove: (t, effectDetails) => { t.evasionChance = effectDetails.originalEvasion; } }); logMessage(`<span style="color:#B3E5FC;">${target.name} стал ловчее благодаря орбите!</span>`, "log-evasion"); } },
        cooldown: 40000, duration: 7000
    },
    {
        id: "oe_cleanse", name: "Очищение", description: "Снимает до 2х случайных негативных эффектов", icon: "✨", type: "buff", color: "white",
        action: (target) => { if (target.alive && target.statusEffects) { for (let i=0; i<2; i++) { const debuffs = Object.keys(target.statusEffects).filter(key => ['poison', 'burn', 'slow', 'root', 'stun', 'oe_slow_aura_effect', 'oe_disarm_effect', 'oe_confusion_effect', 'oe_silence_effect', 'oe_vulnerability_effect', 'oe_drain_tactical_effect', 'oe_drain_defense_effect', 'oe_drain_resource_effect', 'oe_drain_spatial_effect', 'oe_increased_cooldowns_effect', 'oe_weapon_jam_effect', 'oe_accuracy_debuff_effect', 'oe_health_burn_percent_effect', 'oe_intellect_disrupt_defense_effect', 'oe_fumble_effect', 'oe_disorient_movement_effect', 'oe_marked_for_death_effect', 'oe_shared_pain_effect', 'oe_sluggish_projectiles_effect' ].includes(key)); if (debuffs.length > 0) { const randomDebuffKey = debuffs[getRandomInt(0, debuffs.length - 1)]; const effectDetails = target.statusEffects[randomDebuffKey]; if (effectDetails && typeof effectDetails.onRemove === 'function') { effectDetails.onRemove(target, effectDetails); } if (randomDebuffKey === 'slow' && target.baseSpeed) target.speed = target.baseSpeed; delete target.statusEffects[randomDebuffKey]; logMessage(`<span style="color:white;">${target.name} очищен от ${randomDebuffKey.replace('_effect','').replace('oe_','')} орбитой!</span>`, "log-effect"); updateFighterElementOnArena(target); } else { if (i===0) logMessage(`<span style="color:white;">Орбита пыталась очистить ${target.name}, но нет дебаффов!</span>`, "log-effect"); break; } } } },
        cooldown: 30000, duration: 0
    },
     {
        id: "oe_crit_chance_boost", name: "Точность", description: "Шанс крит. удара +25% на 6с", icon: "🎯", type: "buff", color: "gold",
        action: (target) => { if (target.alive && target.weapon) { applyStatusEffect(target, 'oe_crit_boost_effect', { originalCritChance: target.weapon.critChance, duration: Math.round(6000 / GAME_SPEED), onApply: (t) => { if (t.weapon) t.weapon.critChance = Math.min(1, (t.weapon.critChance || 0) + 0.25); }, onRemove: (t, effectDetails) => { if (t.weapon) t.weapon.critChance = effectDetails.originalCritChance; } }); logMessage(`<span style="color:gold;">${target.name} получил +25% к шансу крит. удара от орбиты!</span>`, "log-effect"); } },
        cooldown: 50000, duration: 6000
    },
    {
        id: "oe_lifesteal_aura", name: "Аура Вампиризма", description: "12% вампиризма на 5с", icon: "🩸", type: "buff", color: "#E91E63",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_lifesteal_aura_effect', { lifestealPercent: 0.12, duration: Math.round(5000 / GAME_SPEED) }); logMessage(`<span style="color:#E91E63;">${target.name} окружен аурой вампиризма!</span>`, "log-effect"); } },
        cooldown: 50000, duration: 5000
    },
    {
        id: "oe_reflect_small_damage", name: "Шипы", description: "Отражает 6 урона при атаке в ближнем бою на 7с", icon: "🌵", type: "buff", color: "#795548",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_thorns_effect', { reflectDamage: 6, duration: Math.round(7000 / GAME_SPEED) }); logMessage(`<span style="color:#795548;">${target.name} покрыт шипами от орбиты!</span>`, "log-effect"); } },
        cooldown: 45000, duration: 7000
    },
    {
        id: "oe_xp_boost", name: "Прилив Мудрости", description: "Дает 60 опыта случайному интеллекту", icon: "💡", type: "buff", color: "var(--primary-color)",
        action: (target) => { if (target.alive && target.combatStats && target.combatStats.experience && target.combatStats.intellect) { const fighterSessionRef = fightersSessionData.find(fsd => fsd.id === target.id); if (!fighterSessionRef) return; const intellectTypes = ['tactical', 'defense', 'resource', 'spatial']; const randomIntellect = intellectTypes[getRandomInt(0, intellectTypes.length - 1)]; fighterSessionRef.combatStats.experience[randomIntellect] = (fighterSessionRef.combatStats.experience[randomIntellect] || 0) + 60; const expNeeded = getExpToLevelUp(fighterSessionRef.combatStats.intellect[randomIntellect]); if (fighterSessionRef.combatStats.experience[randomIntellect] >= expNeeded && fighterSessionRef.combatStats.intellect[randomIntellect] < MAX_INTELLECT_LEVEL) { fighterSessionRef.combatStats.intellect[randomIntellect]++; fighterSessionRef.combatStats.experience[randomIntellect] -= expNeeded; if (target.combatStats.intellect[randomIntellect] < MAX_INTELLECT_LEVEL) { target.combatStats.intellect[randomIntellect]++; } logMessage(`🧠 <span class="log-int-levelup">${target.name} повысил ${randomIntellect} интеллект до ${fighterSessionRef.combatStats.intellect[randomIntellect]}!</span> (Орбита)`, "log-int-levelup"); updateFighterIntellectVisuals(target); showIntellectLevelUpSparkle(target); } logMessage(`<span style="color:var(--primary-color);">${target.name} получил прилив мудрости (${randomIntellect}) от орбиты!</span>`, "log-int-levelup"); updateScoreboardUI(); } },
        cooldown: 55000, duration: 0
    },
    {
        id: "oe_reset_cooldowns", name: "Обнуление КД", description: "Сбрасывает КД одного случайного активного орбитального эффекта", icon: "♻️", type: "buff", color: "silver", isPlayerEffect: true,
        action: () => { const activeOrbitalEffectsWithCooldown = activeOrbitalEffects.filter(oe => oe.onCooldownUntil && oe.onCooldownUntil > Date.now() && oe.definition.cooldown > 0); if (activeOrbitalEffectsWithCooldown.length > 0) { const randomEffectInstance = activeOrbitalEffectsWithCooldown[getRandomInt(0, activeOrbitalEffectsWithCooldown.length - 1)]; randomEffectInstance.onCooldownUntil = 0; if (randomEffectInstance.element) randomEffectInstance.element.classList.remove('on-cooldown'); logMessage(`<span style="color:silver;">Кулдаун эффекта "${randomEffectInstance.definition.name}" сброшен орбитой!</span>`, "log-effect"); } else { logMessage(`<span style="color:silver;">Орбита пыталась сбросить кулдаун, но нет активных КД!</span>`, "log-effect"); } },
        cooldown: 80000, duration: 0, isUnique: true
    },
    {
        id: "oe_reveal_enemy_weakness", name: "Слабое Место Врага", description: "Следующая атака по цели нанесет +50% урона", icon: "🎯", type: "buff", color: "#4CAF50",
        action: (attacker) => { if (attacker.alive && attacker.target && attacker.target.alive) { const enemyTarget = attacker.target; applyStatusEffect(enemyTarget, 'oe_vulnerability_effect', { originalTakenMultiplier: enemyTarget.damageTakenMultiplier || 1, duration: Math.round(4500 / GAME_SPEED), oneTimeUse: true, damageBonusFactor: 1.5, onApply: (t, effectDetails) => { t.vulnerabilityBonusNextHitFactor = effectDetails.damageBonusFactor; }, onRemove: (t, effectDetails) => { delete t.vulnerabilityBonusNextHitFactor; } }); logMessage(`<span style="color:#4CAF50;">${attacker.name} обнаружил слабое место у ${enemyTarget.name}! Следующая атака будет усилена.</span>`, "log-effect"); } },
        cooldown: 45000, duration: 0
    },
    {
        id: "oe_invulnerability_short", name: "Неуязвимость", description: "Полная неуязвимость на 1.8с", icon: "✨", type: "buff", color: "gold",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_invulnerability_effect', { duration: Math.round(1800 / GAME_SPEED), onApply: (t) => { t.isInvulnerable = true; }, onRemove: (t) => { t.isInvulnerable = false; } }); logMessage(`<span style="color:gold;">${target.name} становится неуязвимым на короткое время!</span>`, "log-effect"); } }, cooldown: 70000, duration: 1800
    },
    {
        id: "oe_aoe_heal_pulse", name: "Импульс Жизни", description: "Лечит цель и 1 ближайшего союзника на 25 ОЗ.", icon: "💞", type: "buff", color: "lightpink",
        action: (target) => { if (target.alive) { const healAmount = 25; target.health = Math.min(target.maxHealth, target.health + healAmount); logMessage(`<span style="color:lightpink;">${target.name} исцелен на ${healAmount} ОЗ импульсом жизни!</span>`, "log-bonus"); updateFighterElementOnArena(target); const allies = currentFighters.filter(f => f.alive && f.id !== target.id); if (allies.length > 0) { allies.sort((a,b) => getDistance(target,a) - getDistance(target,b)); const closestAlly = allies[0]; closestAlly.health = Math.min(closestAlly.maxHealth, closestAlly.health + healAmount); logMessage(`<span style="color:lightpink;">${closestAlly.name} (союзник) также исцелен на ${healAmount} ОЗ!</span>`, "log-bonus"); updateFighterElementOnArena(closestAlly); } } }, cooldown: 50000, duration: 0
    },
    {
        id: "oe_range_boost_ranged", name: "Дальний Выстрел", description: "Дальность стрельбы +30% на 7с.", icon: "🔭", type: "buff", color: "skyblue",
        action: (target) => { if (target.alive && target.weapon && target.weapon.type === 'ranged') { applyStatusEffect(target, 'oe_range_boost_effect', { duration: Math.round(7000 / GAME_SPEED), originalRange: target.weapon.currentRange || target.weapon.range, onApply: (t) => { if(t.weapon) t.weapon.currentRange = (t.weapon.currentRange || t.weapon.range) * 1.30; }, onRemove: (t, effectDetails) => { if(t.weapon) t.weapon.currentRange = effectDetails.originalRange; } }); logMessage(`<span style="color:skyblue;">${target.name} увеличивает дальность стрельбы!</span>`, "log-effect"); } else if (target.alive) { logMessage(`<span style="color:skyblue;">Орбита пыталась усилить ${target.name}, но эффект только для стрелков!</span>`, "log-effect"); } }, cooldown: 55000, duration: 7000
    },
    {
        id: "oe_crit_nullification", name: "Анти-Крит Щит", description: "Полностью поглощает след. крит. удар (8с).", icon: "🛡️", type: "buff", color: "lightcoral",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_crit_defense_effect', { duration: Math.round(8000 / GAME_SPEED), nullifyNextCrit: true, onApply: (t) => { t.canNullifyCrit = true; }, onRemove: (t) => { t.canNullifyCrit = false; } }); logMessage(`<span style="color:lightcoral;">${target.name} готов поглотить следующий критический удар!</span>`, "log-effect"); } }, cooldown: 65000, duration: 8000
    },
    {
        id: "oe_adrenaline_rush", name: "Прилив Адреналина", description: "Скорость +120%, если ОЗ < 20% (на 5с, раз за раунд).", icon: "⚡", type: "buff", color: "orangered",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_swift_retreat_effect', { duration: Math.round(20000 / GAME_SPEED), speedBonusFactor: 2.2, healthThresholdPercent: 0.20, activeDurationTicks: Math.round(5000 / GAME_SPEED), isActive: false, originalSpeed: 0, triggeredThisRound: false, }); logMessage(`<span style="color:orangered;">${target.name} ощущает прилив адреналина! Эффект активируется при низком ОЗ.</span>`, "log-effect"); } }, cooldown: 70000, duration: 20000
    },
    {
        id: "oe_intellect_surge_tactical", name: "Тактический Гений", description: "Временно +2 к Тактическому Интеллекту на 12с.", icon: "🧠", type: "buff", color: "var(--tactical-int-color)",
        action: (target) => { if (target.alive && target.combatStats && target.combatStats.intellect) { const fighterSessionRef = fightersSessionData.find(fsd => fsd.id === target.id); if (!fighterSessionRef) return; applyStatusEffect(target, 'oe_intellect_focus_tactical_effect', { duration: Math.round(12000 / GAME_SPEED), originalTactical: fighterSessionRef.combatStats.intellect.tactical, onApply: (t) => { const fSRef = fightersSessionData.find(fsd => fsd.id === t.id); if(fSRef) fSRef.combatStats.intellect.tactical = Math.min(MAX_INTELLECT_LEVEL, fSRef.combatStats.intellect.tactical + 2); t.combatStats.intellect.tactical = Math.min(MAX_INTELLECT_LEVEL, t.combatStats.intellect.tactical + 2); updateScoreboardUI(); updateFighterIntellectVisuals(t); }, onRemove: (t, effectDetails) => { const fSRef = fightersSessionData.find(fsd => fsd.id === t.id); if(fSRef) fSRef.combatStats.intellect.tactical = effectDetails.originalTactical; t.combatStats.intellect.tactical = effectDetails.originalTactical; updateScoreboardUI(); updateFighterIntellectVisuals(t); } }); logMessage(`<span style="color:var(--tactical-int-color);">${target.name} временно становится тактическим гением!</span>`, "log-effect"); } }, cooldown: 60000, duration: 12000
    },
    {
        id: "oe_kinetic_barrier", name: "Кинетический Барьер", description: "Следующие 2 атаки нанесут на 40% меньше урона (на 10с).", icon: "🚧", type: "buff", color: "cadetblue",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_kinetic_barrier_effect', { duration: Math.round(10000 / GAME_SPEED), hitsLeft: 2, damageReductionFactor: 0.60, onApply: (t, effectDetails) => { t.kineticBarrierActive = effectDetails; }, onRemove: (t) => { delete t.kineticBarrierActive; } }); logMessage(`<span style="color:cadetblue;">${target.name} активирует кинетический барьер!</span>`, "log-effect"); } }, cooldown: 65000, duration: 10000
    },
    {
        id: "oe_temporal_acceleration", name: "Ускорение Времени", description: "Собственные кулдауны действий -30% на 8с.", icon: "⏳", type: "buff", color: "lightsalmon",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_temporal_acceleration_effect', { duration: Math.round(8000 / GAME_SPEED), originalCooldownMultiplier: target.actionCooldownMultiplier || 1, onApply: (t) => { t.actionCooldownMultiplier = (t.actionCooldownMultiplier || 1) * 0.7; }, onRemove: (t, effectDetails) => { t.actionCooldownMultiplier = effectDetails.originalCooldownMultiplier; } }); logMessage(`<span style="color:lightsalmon;">${target.name} ускоряет собственные действия!</span>`, "log-effect"); } }, cooldown: 70000, duration: 8000
    },
    {
        id: "oe_bonus_attraction_field", name: "Магнит Бонусов", description: "Увеличивает радиус подбора бонусов на 60% на 10с.", icon: "🧲", type: "buff", color: "khaki",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_bonus_magnet_effect', { duration: Math.round(10000 / GAME_SPEED), originalPickupRadiusFactor: target.pickupRadiusFactor || 1, onApply: (t) => { t.pickupRadiusFactor = (t.pickupRadiusFactor || 1) * 1.6; }, onRemove: (t, effectDetails) => { t.pickupRadiusFactor = effectDetails.originalPickupRadiusFactor; } }); logMessage(`<span style="color:khaki;">${target.name} притягивает бонусы!</span>`, "log-effect"); } }, cooldown: 50000, duration: 10000
    },
    {
        id: "oe_reactive_armor_charge", name: "Реактивная Броня", description: "При уроне >15 ОЗ, отброс врагов (1 заряд, 10с)", icon: "💥", type: "buff", color: "silver",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_reactive_armor_effect', { duration: Math.round(10000 / GAME_SPEED), charges: 1, threshold: 15, pushDistance: 30, onApply: (t, effectDetails) => { t.reactiveArmorCharge = effectDetails; }, onRemove: (t) => { delete t.reactiveArmorCharge; } }); logMessage(`<span style="color:silver;">${target.name} заряжает реактивную броню!</span>`, "log-effect"); } }, cooldown: 60000, duration: 10000
    },
    {
        id: "oe_damage_small", name: "Малый Урон", description: "Наносит 24 урона", icon: "💥", type: "debuff", color: "tomato",
        action: (target) => { if (target.alive) applyDamage(target, 24, {name: "Орбитальный Удар", id: "orbital_effect_damage"}, false, "орбитальный удар"); },
        cooldown: 25000, duration: 0
    },
    {
        id: "oe_slow_aura", name: "Замедление", description: "Скорость -35% на 6с", icon: "🐌", type: "debuff", color: "slategray",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_slow_aura_effect', { originalSpeed: target.speed, duration: Math.round(6000 / GAME_SPEED), onApply: (t) => { t.speed *= 0.65; }, onRemove: (t, effectDetails) => { t.speed = effectDetails.originalSpeed; } }); logMessage(`<span style="color:slategray;">${target.name} замедлен орбитой!</span>`, "log-effect"); } }, cooldown: 35000, duration: 6000
    },
    {
        id: "oe_disarm_temp", name: "Ослабление", description: "Урон оружия -40% на 5с", icon: "🚫", type: "debuff", color: "darkred",
         action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_disarm_effect', { originalMultiplier: target.damageOutputMultiplier || 1, duration: Math.round(5000 / GAME_SPEED), onApply: (t) => { t.damageOutputMultiplier = (t.damageOutputMultiplier || 1) * 0.6; }, onRemove: (t, effectDetails) => { t.damageOutputMultiplier = effectDetails.originalMultiplier; } }); logMessage(`<span style="color:darkred;">Оружие ${target.name} ослаблено орбитой!</span>`, "log-effect"); } }, cooldown: 45000, duration: 5000
    },
    {
        id: "oe_root_short", name: "Корни", description: "Обездвижить на 2.5с", icon: "🌲", type: "debuff", color: "saddlebrown",
        action: (target) => { if (target.alive) applyStatusEffect(target, 'root', { duration: Math.round(2500 / GAME_SPEED) }); },
        cooldown: 40000, duration: 2500
    },
    {
        id: "oe_poison_dot", name: "Яд", description: "4 урона/сек в теч. 6с", icon: "🧪", type: "debuff", color: "greenyellow",
        action: (target) => { if (target.alive) applyStatusEffect(target, 'poison', { dps: 4, duration: Math.round(6000 / GAME_SPEED) }); },
        cooldown: 30000, duration: 6000
    },
    {
        id: "oe_instant_kill_rare", name: "Смертельный Удар", description: "Мгновенно убивает цель (очень редко!)", icon: "💀", type: "debuff", color: "black",
        action: (target) => { if (target.alive) applyDamage(target, target.health + target.maxHealth + 100, {name: "Орбита Смерти", id: "orbital_effect_kill"}, true, "смертельный удар"); },
        cooldown: 270000, duration: 0, isUnique: true, spawnChanceMultiplier: 0.15
    },
    {
        id: "oe_weapon_swap_random", name: "Смена Оружия", description: "Меняет оружие цели на случайное базовое", icon: "🔄", type: "debuff", color: "purple",
        action: (target) => { if (target.alive && target.weapon) { const oldWeaponName = target.weapon.name; target.weapon = deepCopy(WEAPONS[getRandomInt(0, WEAPONS.length - 1)]); target.weapon.currentRange = target.weapon.range; logMessage(`<span style="color:purple;">Оружие ${target.name} (${oldWeaponName}) заменено на ${target.weapon.name} орбитой!</span>`, "log-effect"); if (target.element) { const weaponEmojiEl = target.element.querySelector('.weapon-emoji'); if (weaponEmojiEl) weaponEmojiEl.textContent = target.weapon.emoji; } updateFighterElementOnArena(target); } }, cooldown: 65000, duration: 0
    },
    {
        id: "oe_confusion", name: "Замешательство", description: "Цель атакует случайного бойца (или себя) след. 1-2 атаками (4с)", icon: "❓", type: "debuff", color: "magenta",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_confusion_effect', { duration: Math.round(4000 / GAME_SPEED), originalPreferredTarget: target.combatStats?.preferredTargetType || 'closest', attacksAffected: getRandomInt(1,2), onApply: (t) => { if (t.combatStats) t.combatStats.preferredTargetType = 'random_confusion'; }, onRemove: (t, effectDetails) => { if (t.combatStats) t.combatStats.preferredTargetType = effectDetails.originalPreferredTarget; } }); logMessage(`<span style="color:magenta;">${target.name} в замешательстве от орбиты!</span>`, "log-effect"); } }, cooldown: 55000, duration: 4000
    },
    {
        id: "oe_steal_armor", name: "Разрушение Брони", description: "Снимает ВСЮ броню с цели, если есть", icon: "🔨", type: "debuff", color: "darkgray",
        action: (target) => { if (target.alive && target.hasArmor) { target.hasArmor = false; target.armorHits = 0; target.maxArmorHits = 0; logMessage(`<span style="color:darkgray;">Броня ${target.name} разрушена орбитой!</span>`, "log-armor"); updateFighterElementOnArena(target); } else if (target.alive) { logMessage(`<span style="color:darkgray;">Орбита пыталась разрушить броню у ${target.name}, но ее нет!</span>`, "log-effect"); } }, cooldown: 45000, duration: 0
    },
    {
        id: "oe_silence_short", name: "Молчание", description: "Запрещает спец.эффекты оружия на 4с", icon: "🔇", type: "debuff", color: "#607D8B",
        action: (target) => { if (target.alive) applyStatusEffect(target, 'oe_silence_effect', { duration: Math.round(4000 / GAME_SPEED) }); logMessage(`<span style="color:#607D8B;">${target.name} не может использовать спец. эффекты оружия из-за орбиты!</span>`, "log-effect"); },
        cooldown: 40000, duration: 4000
    },
    {
        id: "oe_drain_intellect_temp", name: "Отупление", description: "Снижает случайный интеллект на 1-2 (min 1) на 12с", icon: "📉", type: "debuff", color: "rosybrown",
        action: (target) => { if (target.alive && target.combatStats && target.combatStats.intellect) { const intellectTypes = ['tactical', 'defense', 'resource', 'spatial']; const randomIntellect = intellectTypes[getRandomInt(0, intellectTypes.length - 1)]; const drainAmount = getRandomInt(1,2); const fighterSessionRef = fightersSessionData.find(fsd => fsd.id === target.id); if (!fighterSessionRef) return; if (fighterSessionRef.combatStats.intellect[randomIntellect] > 1) { applyStatusEffect(target, `oe_drain_${randomIntellect}_effect`, { duration: Math.round(12000 / GAME_SPEED), originalValue: fighterSessionRef.combatStats.intellect[randomIntellect], drainAmountVal: drainAmount, intellectTypeToDrain: randomIntellect, onApply: (t, effectDetailsSelf) => { const fSRef = fightersSessionData.find(fsd => fsd.id === t.id); if (fSRef) fSRef.combatStats.intellect[effectDetailsSelf.intellectTypeToDrain] = Math.max(1, fSRef.combatStats.intellect[effectDetailsSelf.intellectTypeToDrain] - effectDetailsSelf.drainAmountVal); t.combatStats.intellect[effectDetailsSelf.intellectTypeToDrain] = Math.max(1, t.combatStats.intellect[effectDetailsSelf.intellectTypeToDrain] - effectDetailsSelf.drainAmountVal); updateScoreboardUI(); updateFighterIntellectVisuals(t); }, onRemove: (t, effectDetailsSelf) => { const fSRef = fightersSessionData.find(fsd => fsd.id === t.id); if (fSRef) fSRef.combatStats.intellect[effectDetailsSelf.intellectTypeToDrain] = effectDetailsSelf.originalValue; t.combatStats.intellect[effectDetailsSelf.intellectTypeToDrain] = effectDetailsSelf.originalValue; updateScoreboardUI(); updateFighterIntellectVisuals(t); } }); logMessage(`<span style="color:rosybrown;">Интеллект (${randomIntellect}) ${target.name} временно снижен на ${drainAmount} орбитой!</span>`, "log-effect"); } } }, cooldown: 65000, duration: 12000
    },
    {
        id: "oe_force_target_switch", name: "Смена Цели", description: "Заставляет цель сменить текущую цель на случайную другую", icon: "🔄", type: "debuff", color: "teal",
        action: (target) => { if (target.alive && target.target) { const otherTargets = currentFighters.filter(f => f.alive && f.id !== target.id && f.id !== target.target.id); if (otherTargets.length > 0) { const newTarget = otherTargets[getRandomInt(0, otherTargets.length - 1)]; target.target = newTarget; logMessage(`<span style="color:teal;">${target.name} вынужден сменить цель на ${newTarget.name} из-за орбиты!</span>`, "log-effect"); if (getTotalIntellect(target) > 3) logIntellectAction(target, 'spatial', `меняет цель из-за вмешательства`); } } }, cooldown: 60000, duration: 0
    },
    {
        id: "oe_increased_cooldowns_short", name: "Заторможенность", description: "Кулдауны действий +25% на 6с", icon: "⏳", type: "debuff", color: "chocolate",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_increased_cooldowns_effect', { duration: Math.round(6000 / GAME_SPEED), originalCooldownMultiplier: target.actionCooldownMultiplier || 1, onApply: (t) => { t.actionCooldownMultiplier = (t.actionCooldownMultiplier || 1) * 1.25; }, onRemove: (t, effectDetails) => { t.actionCooldownMultiplier = effectDetails.originalCooldownMultiplier; } }); logMessage(`<span style="color:chocolate;">Действия ${target.name} замедлены орбитой!</span>`, "log-effect"); } }, cooldown: 50000, duration: 6000
    },
    {
        id: "oe_weapon_jam_field", name: "Поле Помех", description: "Цель не может атаковать 3с.", icon: "🚫", type: "debuff", color: "darkslateblue",
        action: (target) => { if (target.alive) applyStatusEffect(target, 'oe_weapon_jam_effect', { duration: Math.round(3000 / GAME_SPEED) }); logMessage(`<span style="color:darkslateblue;">${target.name} не может атаковать из-за помех!</span>`, "log-effect"); }, cooldown: 60000, duration: 3000
    },
    {
        id: "oe_blinding_flash", name: "Ослепляющая Вспышка", description: "Снижает шанс крита на 30% и дальность стрельбы на 25% на 7с.", icon: "😵", type: "debuff", color: "lightyellow",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_accuracy_debuff_effect', { duration: Math.round(7000 / GAME_SPEED), originalCritChance: target.weapon?.critChance || 0, originalRange: target.weapon?.currentRange || target.weapon?.range || 0, isRanged: target.weapon?.type === 'ranged', onApply: (t) => { if (t.weapon) { t.weapon.critChance = Math.max(0, (t.weapon.critChance || 0) - 0.30); if (t.weapon.type === 'ranged') t.weapon.currentRange = (t.weapon.currentRange || t.weapon.range) * 0.75; } }, onRemove: (t, effectDetails) => { if (t.weapon) { t.weapon.critChance = effectDetails.originalCritChance; if (effectDetails.isRanged) t.weapon.currentRange = effectDetails.originalRange; } } }); logMessage(`<span style="color:lightyellow;">${target.name} ослеплен вспышкой!</span>`, "log-effect"); } }, cooldown: 55000, duration: 7000
    },
    {
        id: "oe_corrosive_spores", name: "Едкие Споры", description: "Наносит 2.5% от макс. ОЗ в сек. в теч. 6с (игнорирует броню).", icon: "🍄", type: "debuff", color: "olive",
        action: (target) => { if (target.alive) applyStatusEffect(target, 'oe_health_burn_percent_effect', { dpsPercent: 0.025, duration: Math.round(6000 / GAME_SPEED) }); logMessage(`<span style="color:olive;">${target.name} заражен едкими спорами!</span>`, "log-effect"); }, cooldown: 60000, duration: 6000
    },
    {
        id: "oe_intellect_dampener_defense", name: "Подавитель Защиты", description: "Временно -2 к Защитному Интеллекту на 12с.", icon: "🔩", type: "debuff", color: "var(--defense-int-color)",
        action: (target) => { if (target.alive && target.combatStats && target.combatStats.intellect) { const fighterSessionRef = fightersSessionData.find(fsd => fsd.id === target.id); if (!fighterSessionRef) return; applyStatusEffect(target, 'oe_intellect_disrupt_defense_effect', { duration: Math.round(12000 / GAME_SPEED), originalDefense: fighterSessionRef.combatStats.intellect.defense, onApply: (t) => { const fSRef = fightersSessionData.find(fsd => fsd.id === t.id); if(fSRef) fSRef.combatStats.intellect.defense = Math.max(1, fSRef.combatStats.intellect.defense - 2); t.combatStats.intellect.defense = Math.max(1, t.combatStats.intellect.defense - 2) ; updateScoreboardUI(); updateFighterIntellectVisuals(t); }, onRemove: (t, effectDetails) => { const fSRef = fightersSessionData.find(fsd => fsd.id === t.id); if(fSRef) fSRef.combatStats.intellect.defense = effectDetails.originalDefense; t.combatStats.intellect.defense = effectDetails.originalDefense; updateScoreboardUI(); updateFighterIntellectVisuals(t); } }); logMessage(`<span style="color:var(--defense-int-color);">${target.name} ощущает подавление защитного интеллекта!</span>`, "log-effect"); } }, cooldown: 65000, duration: 12000
    },
    {
        id: "oe_clumsiness_curse", name: "Проклятие Неуклюжести", description: "Следующая атака с 70% шансом нанесет 0 урона.", icon: "🤞", type: "debuff", color: "sienna",
        action: (target) => { if (target.alive) applyStatusEffect(target, 'oe_fumble_effect', { duration: Math.round(10000 / GAME_SPEED), chance: 0.70, oneTimeUse: true }); logMessage(`<span style="color:sienna;">${target.name} проклят на неуклюжесть!</span>`, "log-effect"); }, cooldown: 50000, duration: 10000
    },
    {
        id: "oe_random_teleport", name: "Случайный Телепорт", description: "Телепортирует цель в случайную точку арены.", icon: "🌀", type: "debuff", color: "mediumpurple",
        action: (target) => { if (target.alive) { target.x = getRandomInt(FIGHTER_WIDTH / 2, ARENA_WIDTH - FIGHTER_WIDTH / 2); target.y = getRandomInt(FIGHTER_HEIGHT / 2, ARENA_HEIGHT - FIGHTER_HEIGHT / 2); updateFighterElementOnArena(target); logMessage(`<span style="color:mediumpurple;">${target.name} был случайным образом телепортирован!</span>`, "log-effect"); } }, cooldown: 70000, duration: 0
    },
    {
        id: "oe_fragility_curse", name: "Проклятие Хрупкости", description: "Цель получает +20% урона от всех источников на 8с.", icon: "💔", type: "debuff", color: "lightcoral",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_marked_for_death_effect', { duration: Math.round(8000 / GAME_SPEED), originalTakenMultiplier: target.damageTakenMultiplier || 1, onApply: (t) => { t.damageTakenMultiplier = (t.damageTakenMultiplier || 1) * 1.20; }, onRemove: (t, effectDetails) => { t.damageTakenMultiplier = effectDetails.originalTakenMultiplier; } }); logMessage(`<span style="color:lightcoral;">${target.name} становится хрупким и получает больше урона!</span>`, "log-effect"); } }, cooldown: 55000, duration: 8000
    },
    {
        id: "oe_parasitic_link", name: "Паразитическая Связь", description: "В течение 6с, 25% урона, полученного целью, передается случайному другому бойцу.", icon: "🔗", type: "debuff", color: "darkgreen",
        action: (target) => { if (target.alive) applyStatusEffect(target, 'oe_shared_pain_effect', { duration: Math.round(6000 / GAME_SPEED), percent: 0.25 }); logMessage(`<span style="color:darkgreen;">${target.name} связан паразитической связью!</span>`, "log-effect"); }, cooldown: 75000, duration: 6000
    },
    {
        id: "oe_projectile_friction", name: "Трение Снарядов", description: "Снаряды цели летят на 50% медленнее на 7с.", icon: "🏹", type: "debuff", color: "dimgray",
        action: (target) => { if (target.alive && target.weapon && target.weapon.type === 'ranged') { applyStatusEffect(target, 'oe_sluggish_projectiles_effect', { duration: Math.round(7000 / GAME_SPEED), originalProjectileSpeedFactor: target.projectileSpeedFactor || 1, onApply: (t) => { t.projectileSpeedFactor = (t.projectileSpeedFactor || 1) * 0.5; }, onRemove: (t, effectDetails) => { t.projectileSpeedFactor = effectDetails.originalProjectileSpeedFactor; } }); logMessage(`<span style="color:dimgray;">Снаряды ${target.name} замедлены!</span>`, "log-effect"); } else if (target.alive) { logMessage(`<span style="color:dimgray;">Орбита пыталась замедлить снаряды ${target.name}, но эффект только для стрелков!</span>`, "log-effect"); } }, cooldown: 60000, duration: 7000
    },
    {
        id: "oe_mini_black_hole", name: "Мини-Червоточина", description: "На 2.5с создает в месте цели червоточину, слегка притягивающую ВСЕХ бойцов.", icon: "⚫", type: "debuff", color: "black",
        action: (target) => { if (target.alive) { applyStatusEffect(target, 'oe_gravity_well_effect', { duration: Math.round(2500 / GAME_SPEED), radius: 150, strength: 0.5, x: target.x, y: target.y, }); logMessage(`<span style="color:black;">Червоточина открывается у ${target.name}!</span>`, "log-effect"); } }, cooldown: 80000, duration: 2500
    }
];

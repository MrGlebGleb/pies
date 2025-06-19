// --- ORBITAL EFFECTS LOGIC ---

function clearOrbitalEffects() {
    activeOrbitalEffects.forEach(effect => {
        if (effect.element?.parentElement) {
            effect.element.remove();
        }
        if (effect.projectileAnimationId) {
            cancelAnimationFrame(effect.projectileAnimationId);
        }
    });
    activeOrbitalEffects = [];
    // console.log("Orbital effects cleared.");
}

function spawnInitialOrbitalEffects() {
    clearOrbitalEffects();
    if (!orbitalEffectsContainerEl) return;

    const numberOfEffects = Math.min(MAX_ORBITAL_EFFECTS_PER_ROUND, ORBITAL_EFFECTS_POOL.length);
    const availableEffects = [...ORBITAL_EFFECTS_POOL]; // Копируем, чтобы не изменять оригинал
    const perimeter = 2 * ARENA_WIDTH + 2 * ARENA_HEIGHT;
    const spacing = numberOfEffects > 0 ? perimeter / numberOfEffects : 0;

    for (let i = 0; i < numberOfEffects; i++) {
        let chosenDefinition = null;
        let attempts = 0;

        // Пытаемся выбрать эффект с учетом его шанса появления
        while (!chosenDefinition && attempts < availableEffects.length * 3 && availableEffects.length > 0) {
             const randomIndex = getRandomInt(0, availableEffects.length - 1);
             const potentialEffect = availableEffects[randomIndex];
             const spawnChance = potentialEffect.spawnChanceMultiplier !== undefined ? potentialEffect.spawnChanceMultiplier : 1.0;

             if (Math.random() < spawnChance) {
                 chosenDefinition = potentialEffect;
                 availableEffects.splice(randomIndex, 1); // Удаляем выбранный, чтобы не повторялся
             }
             attempts++;
        }
        // Если не удалось выбрать по шансу (например, все редкие), берем любой оставшийся
        if (!chosenDefinition && availableEffects.length > 0) {
             const randomIndex = getRandomInt(0, availableEffects.length - 1);
             chosenDefinition = availableEffects[randomIndex];
             availableEffects.splice(randomIndex, 1);
        }

        if (!chosenDefinition) continue; // Если эффекты закончились

        const effectInstance = {
            id: `orb-effect-${Date.now()}-${i}`,
            definition: chosenDefinition,
            element: null,
            distanceAlongPerimeter: spacing * i,
            onCooldownUntil: 0,
            projectileAnimationId: null,
        };

        effectInstance.element = createOrbitalEffectElement(effectInstance); // Функция из ui.js
        if(effectInstance.element) {
            activeOrbitalEffects.push(effectInstance);
        }
    }
    updateOrbitalEffectsPosition(); // Первичное размещение
    // console.log(`Spawned ${activeOrbitalEffects.length} orbital effects.`);
}


function updateOrbitalEffectsPosition() {
    if (!orbitalEffectsContainerEl || !arenaEl || activeOrbitalEffects.length === 0) return;

    const perimeter = 2 * ARENA_WIDTH + 2 * ARENA_HEIGHT;
    const speed = ORBITAL_EFFECT_SPEED_FACTOR; // Уже настроенная скорость из constants.js

    const arenaOffsetX = (orbitalEffectsContainerEl.offsetWidth - ARENA_WIDTH) / 2;
    const arenaOffsetY = (orbitalEffectsContainerEl.offsetHeight - ARENA_HEIGHT) / 2;

    activeOrbitalEffects.forEach(effect => {
        if (!effect.element) return;

        effect.distanceAlongPerimeter = (effect.distanceAlongPerimeter + speed) % perimeter;
        let currentDistance = effect.distanceAlongPerimeter;
        if (currentDistance < 0) currentDistance += perimeter; // Гарантируем положительное значение

        let xOnArenaEdge, yOnArenaEdge;

        if (currentDistance < ARENA_WIDTH) { // Верхняя грань
            xOnArenaEdge = currentDistance;
            yOnArenaEdge = 0;
        } else if (currentDistance < ARENA_WIDTH + ARENA_HEIGHT) { // Правая грань
            xOnArenaEdge = ARENA_WIDTH;
            yOnArenaEdge = currentDistance - ARENA_WIDTH;
        } else if (currentDistance < ARENA_WIDTH * 2 + ARENA_HEIGHT) { // Нижняя грань
            xOnArenaEdge = ARENA_WIDTH - (currentDistance - (ARENA_WIDTH + ARENA_HEIGHT));
            yOnArenaEdge = ARENA_HEIGHT;
        } else { // Левая грань
            xOnArenaEdge = 0;
            yOnArenaEdge = ARENA_HEIGHT - (currentDistance - (ARENA_WIDTH * 2 + ARENA_HEIGHT));
        }

        const effectSize = effect.element.offsetWidth || ORBITAL_EFFECT_SIZE_ON_ARENA;
        const finalX = arenaOffsetX + xOnArenaEdge - (effectSize / 2);
        const finalY = arenaOffsetY + yOnArenaEdge - (effectSize / 2);

        effect.element.style.left = `${finalX}px`;
        effect.element.style.top = `${finalY}px`;

        if (effect.onCooldownUntil && effect.onCooldownUntil > Date.now()) {
            if (!effect.element.classList.contains('on-cooldown')) {
                effect.element.classList.add('on-cooldown');
            }
        } else if (effect.element.classList.contains('on-cooldown')) {
            effect.element.classList.remove('on-cooldown');
            effect.onCooldownUntil = 0;
        }
    });
}

function handleOrbitalEffectClick(event) {
    if (!roundInProgress || isGameOver || isInitialSetupPhase || isInterRoundPhase) return; // Нельзя кликать вне активного боя
    const effectElement = event.currentTarget;
    const effectId = effectElement.dataset.id;
    const effectInstance = activeOrbitalEffects.find(oe => oe.id === effectId);

    if (!effectInstance || (effectInstance.onCooldownUntil && effectInstance.onCooldownUntil > Date.now())) {
         if (effectInstance?.element) { // Легкая анимация "нельзя"
             effectInstance.element.style.transition = 'transform 0.1s ease-in-out';
             effectInstance.element.style.transform = 'scale(0.95)';
             setTimeout(() => { if(effectInstance.element) effectInstance.element.style.transform = 'scale(1)'; }, 100);
         }
        return;
    }

    const definition = effectInstance.definition;

    if (definition.isPlayerEffect) { // Глобальные эффекты, не нацеленные на бойца
        if(typeof definition.action === 'function'){
            definition.action(); // Вызываем без цели
            startOrbitalEffectCooldown(effectInstance);
        } else {
            console.error("Player orbital effect action is not a function:", definition);
        }
        return;
    }

    // Находим ближайшего бойца к КЛИКНУТОМУ элементу орбиты
    let nearestFighterInstance = null;
    let minDistance = Infinity;
    const effectRect = effectElement.getBoundingClientRect(); // Координаты элемента орбиты относительно viewport
    const effectCenterX_viewport = effectRect.left + effectRect.width / 2;
    const effectCenterY_viewport = effectRect.top + effectRect.height / 2;

    currentFighters.filter(f => f.alive && f.element).forEach(fighterInst => {
        const fighterRect = fighterInst.element.getBoundingClientRect(); // Координаты бойца относительно viewport
        const fighterCenterX_viewport = fighterRect.left + fighterRect.width / 2;
        const fighterCenterY_viewport = fighterRect.top + fighterRect.height / 2;
        const distance = getDistance(
            {x: effectCenterX_viewport, y: effectCenterY_viewport},
            {x: fighterCenterX_viewport, y: fighterCenterY_viewport}
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearestFighterInstance = fighterInst;
        }
    });

    if (nearestFighterInstance) {
        // console.log(`Orbital effect ${definition.name} triggered on ${nearestFighterInstance.name}`);
        animateEffectProjectile(effectInstance, nearestFighterInstance);
        startOrbitalEffectCooldown(effectInstance);
    } else {
        // console.log("No alive fighters found for orbital effect target.");
        // Если нет цели, эффект может просто уйти в КД без действия или сработать глобально, если это предусмотрено
        startOrbitalEffectCooldown(effectInstance); // В любом случае уходит в КД
    }
}

function startOrbitalEffectCooldown(effectInstance) {
    if (!effectInstance?.definition) return;
    const cooldownMs = effectInstance.definition.cooldown;
    if (cooldownMs && cooldownMs > 0) {
        effectInstance.onCooldownUntil = Date.now() + cooldownMs;
        if (effectInstance.element) { effectInstance.element.classList.add('on-cooldown'); }
    }
}

function animateEffectProjectile(effectInstance, targetFighterInstance) {
    if (!orbitalEffectsContainerEl || !effectInstance?.element || !targetFighterInstance?.element || !arenaEl) return;

    if (effectInstance.projectileAnimationId) { // Отменяем предыдущую анимацию, если есть
        cancelAnimationFrame(effectInstance.projectileAnimationId);
        const oldProjectile = orbitalEffectsContainerEl.querySelector(`.effect-projectile[data-source-id="${effectInstance.id}"]`);
        if (oldProjectile) oldProjectile.remove();
    }

    const projectile = document.createElement('div');
    projectile.classList.add('effect-projectile');
    projectile.dataset.sourceId = effectInstance.id;
    const effectColor = effectInstance.definition.color || 'yellow';
    projectile.style.background = `radial-gradient(circle, white 20%, ${effectColor} 80%)`;
    projectile.style.boxShadow = `0 0 10px 4px ${effectColor}`;
    // Размеры снаряда уже заданы в CSS

    const projectileSize = parseFloat(getComputedStyle(projectile).width) || 18; // Берем из CSS или дефолт
    // Координаты старта снаряда относительно orbitalEffectsContainerEl
    const startX = parseFloat(effectInstance.element.style.left || '0') + (effectInstance.element.offsetWidth / 2) - (projectileSize / 2);
    const startY = parseFloat(effectInstance.element.style.top || '0') + (effectInstance.element.offsetHeight / 2) - (projectileSize / 2);
    projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY}px`;

    orbitalEffectsContainerEl.appendChild(projectile);

    let animationStartTime = null;

    function tickAnimation(timestamp) {
        if (animationStartTime === null) animationStartTime = timestamp;
        const elapsed = timestamp - animationStartTime;

        if (!roundInProgress || !targetFighterInstance.alive || !targetFighterInstance.element || !projectile.parentElement) {
            if (projectile.parentElement) projectile.remove();
            effectInstance.projectileAnimationId = null;
            return;
        }

        const currentX_center = parseFloat(projectile.style.left || '0') + projectileSize / 2;
        const currentY_center = parseFloat(projectile.style.top || '0') + projectileSize / 2;

        // Цель - центр бойца на арене, переведенный в координаты orbitalEffectsContainerEl
        const arenaRect = arenaEl.getBoundingClientRect();
        const containerRect = orbitalEffectsContainerEl.getBoundingClientRect();

        const targetArenaX_center = targetFighterInstance.x;
        const targetArenaY_center = targetFighterInstance.y - FIGHTER_HEIGHT / 4; // Целимся чуть выше центра бойца

        // Переводим координаты цели из системы арены в систему orbitalEffectsContainer
        // (0,0) orbitalEffectsContainer -> (arenaOffsetX, arenaOffsetY) начало арены
        const arenaOffsetX_inContainer = (orbitalEffectsContainerEl.offsetWidth - ARENA_WIDTH) / 2;
        const arenaOffsetY_inContainer = (orbitalEffectsContainerEl.offsetHeight - ARENA_HEIGHT) / 2;

        const targetContainerX_center = arenaOffsetX_inContainer + targetArenaX_center;
        const targetContainerY_center = arenaOffsetY_inContainer + targetArenaY_center;


        const dx = targetContainerX_center - currentX_center;
        const dy = targetContainerY_center - currentY_center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ORBITAL_EFFECT_PROJECTILE_SPEED_VALUE) { // Если достаточно близко для "попадания"
            projectile.remove();
            effectInstance.projectileAnimationId = null;
            if (typeof effectInstance.definition.action === 'function') {
                effectInstance.definition.action(targetFighterInstance); // Применяем эффект
            } else {
                console.error("Orbital effect action is not a function:", effectInstance.definition);
            }
            const effectDurationMs = effectInstance.definition.duration || 0;
            addOrbitalEffectHighlight(targetFighterInstance, effectInstance.definition.type, effectDurationMs);
        } else {
            const moveX = (dx / dist) * ORBITAL_EFFECT_PROJECTILE_SPEED_VALUE;
            const moveY = (dy / dist) * ORBITAL_EFFECT_PROJECTILE_SPEED_VALUE;
            projectile.style.left = `${currentX_center + moveX - projectileSize / 2}px`;
            projectile.style.top = `${currentY_center + moveY - projectileSize / 2}px`;
            effectInstance.projectileAnimationId = requestAnimationFrame(tickAnimation);
        }
    }
    effectInstance.projectileAnimationId = requestAnimationFrame(tickAnimation);
}
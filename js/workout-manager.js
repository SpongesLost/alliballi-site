// Workout manager for handling workout sessions
class WorkoutManager {
    goToPreviousSet() {
        if (this.isAnimating) return;
        // If not at the first set, go back one set
        if (this.currentSetIndex > 0) {
            this.currentSetIndex--;
            this.displayCurrentExercise();
        } else if (this.currentExerciseIndex > 0) {
            // If at first set but not first exercise, go to last set of previous exercise
            this.currentExerciseIndex--;
            const prevExercise = this.currentExercises[this.currentExerciseIndex];
            this.currentSetIndex = prevExercise.sets - 1;
            this.displayCurrentExercise();
        }
    }
    constructor(programManager) {
        this.programManager = programManager;
        this.currentProgram = null;
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
        this.currentExercises = [];
        this.workoutData = {};
        this.touchHandler = null;
        this.wakeLock = null;
        this.wakeLockActive = false;
        this.isAnimating = false; // Prevent double actions during animations
    }

    startWorkout(programId) {
        this.currentProgram = this.programManager.getProgramById(programId);
        this.currentExercises = [...this.currentProgram.exercises];
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
        this.workoutData = {};
        this.isAnimating = false; // Ensure animation flag is reset at start
        const card = document.getElementById('exercise-card');
        card.style.touchAction = 'auto';
        card.style.pointerEvents = 'auto';
        
        
        // Create a fresh TouchHandler for this workout session
        this.touchHandler = new TouchHandler();
        
        // Initialize workout data structure with index as unique key for each exercise instance
        this.currentExercises.forEach((exercise, idx) => {
            exercise._instanceKey = idx; // Use index as unique key
            this.workoutData[idx] = {
                sets: Array(exercise.sets).fill(null).map(() => ({ reps: 0, weight: 0, note: '' }))
            };
        });
        
        UIManager.showWorkoutMode();
        this.displayCurrentExercise();
        // Don't call setupSwipeHandlers here since displayCurrentExercise already does it
        this.createWakeLockToggle();
    }

    setupSwipeHandlers() {
        const cardElement = document.getElementById('exercise-card');
        if (this.touchHandler && cardElement) {
            this.touchHandler.setupSwipeHandlers(cardElement, this.handleSwipe.bind(this));
        } else {
            console.warn('Failed to setup swipe handlers:', { touchHandler: !!this.touchHandler, cardElement: !!cardElement });
        }
    }

    handleSwipe(direction) {
        // Prevent handling swipes during animations
        if (this.isAnimating) {
            return;
        }
        this.animateCardSwipe(direction);
    }

    animateCardSwipe(direction) {
        // Set animation flag to prevent double actions
        this.isAnimating = true;
        
        // Prevent swiping right when at the very beginning (first exercise, first set)
        if (
            direction === 'right' &&
            this.currentExerciseIndex === 0 &&
            this.currentSetIndex === 0
        ) {
            // Snap back
            const cardElement = document.getElementById('exercise-card');
            cardElement.style.transition = 'transform 0.3s cubic-bezier(.4,1.3,.6,1), opacity 0.3s';
            cardElement.style.transform = 'translateX(0)';
            cardElement.style.opacity = '1';
            
            // Clear animation flag after snap back
            setTimeout(() => {
                this.isAnimating = false;
            }, 200);
            return;
        }

        // Animate current card offscreen
        const cardElement = document.getElementById('exercise-card');
        cardElement.style.transition = 'transform 0.3s cubic-bezier(.4,1.3,.6,1), opacity 0.3s';
        cardElement.style.transform = direction === 'left' ? 'translateX(-110vw)' : 'translateX(110vw)';
        cardElement.style.opacity = '0';
        
        // After card is offscreen, update the content
        setTimeout(() => {
            // Update exercise/set index
            if (direction === 'left') {
                // Move to next exercise
                this.currentExerciseIndex++;
                this.currentSetIndex = 0;
                if (this.currentExerciseIndex >= this.currentExercises.length) {
                    this.finishWorkout();
                    return;
                }
            } else {
                // Going back (right swipe)
                if (this.currentExerciseIndex > 0) {
                    // Go back to previous exercise, start at set 0
                    this.currentExerciseIndex--;
                    this.currentSetIndex = 0;
                }
            }

            // Update card content while it's offscreen
            const exercise = this.currentExercises[this.currentExerciseIndex];
            const card = document.getElementById('exercise-card');
            const progress = document.getElementById('progress-indicator');
            
            progress.textContent = `${this.currentExerciseIndex + 1} / ${this.currentExercises.length}`;
            
            const previousData = this.getPreviousSessionData(exercise.name, this.currentExerciseIndex);
            // Update HTML while card is still offscreen
            card.innerHTML = this.generateExerciseCardHTML(exercise, this.currentSetIndex, previousData);
            
            // Position new card on the opposite side from swipe direction
            cardElement.style.transition = 'none';
            cardElement.style.transform = direction === 'left' ? 'translateX(110vw)' : 'translateX(-110vw)';
            // Force reflow to ensure the browser applies the transform before animating
            void cardElement.offsetWidth;
            // Animate new card in
            requestAnimationFrame(() => {
                cardElement.style.transition = 'transform 0.3s cubic-bezier(.4,1.3,.6,1), opacity 0.3s';
                cardElement.style.transform = 'translateX(0)';
                cardElement.style.opacity = '1';
                
                // Re-setup swipe handlers after animation completes
                setTimeout(() => {
                    this.setupSwipeHandlers();
                    // Clear animation flag immediately for faster response
                    this.isAnimating = false;
                    // Removed auto-focus to prevent keyboard popup on mobile
                }, 100);
            });
        }, 300);
    }

    displayCurrentExercise() {
        const exercise = this.currentExercises[this.currentExerciseIndex];
        const card = document.getElementById('exercise-card');
        const progress = document.getElementById('progress-indicator');
        
        progress.textContent = `${this.currentExerciseIndex + 1} / ${this.currentExercises.length}`;
        const previousData = this.getPreviousSessionData(exercise.name, this.currentExerciseIndex);
        card.innerHTML = this.generateExerciseCardHTML(exercise, this.currentSetIndex, previousData);
        
        // Focus on reps input and setup swipe handlers after DOM update
        setTimeout(() => {
            // Setup swipe handlers immediately after DOM update
            this.setupSwipeHandlers();
            this.isAnimating = false; // Clear immediately for faster response
            // Removed auto-focus to prevent keyboard popup on mobile
        }, 50);
    }

    getPreviousSessionData(exerciseName, exerciseIndex) {
        if (this.currentProgram.sessions.length === 0) return null;
        const exerciseObj = this.currentExercises[exerciseIndex];
        const rangeType = exerciseObj?.rangeType || (exerciseObj?.repRange && exerciseObj.repRange.type) || 'reps';
        for (let i = this.currentProgram.sessions.length - 1; i >= 0; i--) {
            const session = this.currentProgram.sessions[i];
            const exerciseData = session.exercises[exerciseIndex];
            if (exerciseData && exerciseData.name === exerciseName && exerciseData.sets && exerciseData.sets.length > 0) {
                const hasData = exerciseData.sets.some(set => {
                    if (rangeType === 'seconds') {
                        return set.seconds > 0 || set.weight > 0 || (set.note && set.note.trim().length > 0);
                    } else {
                        return set.reps > 0 || set.weight > 0 || (set.note && set.note.trim().length > 0);
                    }
                });
                if (hasData) {
                    return exerciseData;
                }
            }
        }
        return null; // No previous session with data found
    }

    getPreviousSetData(exerciseName, setIndex, exerciseIndex) {
        if (this.currentProgram.sessions.length === 0) return null;
        const exerciseObj = this.currentExercises[exerciseIndex];
        const rangeType = exerciseObj?.rangeType || (exerciseObj?.repRange && exerciseObj.repRange.type) || 'reps';
        for (let i = this.currentProgram.sessions.length - 1; i >= 0; i--) {
            const session = this.currentProgram.sessions[i];
            const exerciseData = session.exercises[exerciseIndex];
            if (exerciseData && exerciseData.name === exerciseName && exerciseData.sets && exerciseData.sets[setIndex]) {
                const setData = exerciseData.sets[setIndex];
                if (rangeType === 'seconds') {
                    if (setData.seconds > 0 || setData.weight > 0 || (setData.note && setData.note.trim().length > 0)) {
                        return setData;
                    }
                } else {
                    if (setData.reps > 0 || setData.weight > 0 || (setData.note && setData.note.trim().length > 0)) {
                        return setData;
                    }
                }
            }
        }
        return null; // No previous set data found
    }

    completeSet() {
        const card = document.getElementById('exercise-card');
        if (card) {
            // Remove previous animationend listener if any
            if (card._setCompleteEffectListener) {
                card.removeEventListener('animationend', card._setCompleteEffectListener);
            }
            // Reset animation if already playing
            card.classList.remove('set-complete-effect');
            void card.offsetWidth;
            // Add highlight animation
            card.classList.add('set-complete-effect');
            // Remove effect after animation ends
            card._setCompleteEffectListener = function() {
                card.classList.remove('set-complete-effect');
                card.removeEventListener('animationend', card._setCompleteEffectListener);
                card._setCompleteEffectListener = null;
            };
            card.addEventListener('animationend', card._setCompleteEffectListener);
        }
        if (this.isAnimating) {
            return;
        }
        const exercise = this.currentExercises[this.currentExerciseIndex];
        let repsInput, secondsInput;
        let reps = null, seconds = null;
        let rangeType = exercise.rangeType || (exercise.repRange && exercise.repRange.type) || 'reps';
        if (rangeType === 'seconds') {
            secondsInput = document.getElementById(`seconds-${this.currentSetIndex}`).value;
            seconds = secondsInput !== '' ? parseInt(secondsInput) : null;
        } else {
            repsInput = document.getElementById(`reps-${this.currentSetIndex}`).value;
            reps = repsInput !== '' ? parseInt(repsInput) : null;
        }
        let weightInput = document.getElementById(`weight-${this.currentSetIndex}`).value;
        const note = document.getElementById(`note-${this.currentSetIndex}`).value.trim() || '';
        let weight = weightInput !== '' ? parseFloat(weightInput) : null;
        // If note is present and reps/seconds/weight are blank or 0, use previous session's value if available
        if (note && ((reps === null || reps === 0) && (seconds === null || seconds === 0)) && (weight === null || weight === 0)) {
            const previousData = this.getPreviousSessionData(exercise.name, this.currentExerciseIndex);
            const prevSet = previousData ? this.getPreviousSetData(exercise.name, this.currentSetIndex, this.currentExerciseIndex) : null;
            if (prevSet) {
                if (rangeType === 'seconds' && (seconds === null || seconds === 0) && prevSet.seconds > 0) seconds = prevSet.seconds;
                if (rangeType === 'reps' && (reps === null || reps === 0) && prevSet.reps > 0) reps = prevSet.reps;
                if ((weight === null || weight === 0) && prevSet.weight > 0) weight = prevSet.weight;
            }
        }
        // Default to 0 if still null
        if (rangeType === 'seconds') seconds = seconds !== null ? seconds : 0;
        else reps = reps !== null ? reps : 0;
        weight = weight !== null ? weight : 0;
        // Save set data
        const key = exercise._instanceKey;
        if (rangeType === 'seconds') {
            this.workoutData[key].sets[this.currentSetIndex] = { seconds, weight, note };
        } else {
            this.workoutData[key].sets[this.currentSetIndex] = { reps, weight, note };
        }
        // --- COOL EFFECT: Confetti burst and card highlight ---
        // ...animation now handled above...
        this.currentSetIndex++;
        // Check if all sets for this exercise are complete
        if (this.currentSetIndex >= exercise.sets) {
            // Move to next exercise
            this.currentExerciseIndex++;
            this.currentSetIndex = 0;

            if (this.currentExerciseIndex >= this.currentExercises.length) {
                this.finishWorkout();
                return;
            }

            // Animate to next exercise
            this.animateToNextExercise();
        } else {
            // Just update the current exercise display
            this.displayCurrentExercise();
        }
    }

    skipExercise() {
        // Prevent skipping exercises during animations
        if (this.isAnimating) {
            return;
        }
        // Move to next exercise
        this.currentExerciseIndex++;
        this.currentSetIndex = 0;
        
        if (this.currentExerciseIndex >= this.currentExercises.length) {
            this.finishWorkout();
            return;
        }
        
        // Animate to next exercise (same as completeSet when moving to next exercise)
        this.animateToNextExercise();
    }

    animateToNextExercise() {
        // Set animation flag
        this.isAnimating = true;
        const card = document.getElementById('exercise-card');
        
        // Animate current card offscreen
        card.style.transition = 'transform 0.3s cubic-bezier(.4,1.3,.6,1), opacity 0.3s';
        card.style.transform = 'translateX(-110vw)';
        card.style.opacity = '0';
        
        setTimeout(() => {
            // Update card content while it's offscreen
            const exercise = this.currentExercises[this.currentExerciseIndex];
            const progress = document.getElementById('progress-indicator');
            progress.textContent = `${this.currentExerciseIndex + 1} / ${this.currentExercises.length}`;
            
            const previousData = this.getPreviousSessionData(exercise.name, this.currentExerciseIndex);
            
            // Update HTML while card is still offscreen
            card.innerHTML = this.generateExerciseCardHTML(exercise, this.currentSetIndex, previousData);
            
            // Position new card on the right side
            card.style.transition = 'none';
            card.style.transform = 'translateX(110vw)';
            
            // Animate new card in
            requestAnimationFrame(() => {
                card.style.transition = 'transform 0.3s cubic-bezier(.4,1.3,.6,1), opacity 0.3s';
                card.style.transform = 'translateX(0)';
                card.style.opacity = '1';
                
                // Setup swipe handlers after animation completes
                setTimeout(() => {
                    this.setupSwipeHandlers();
                    this.isAnimating = false; // Clear immediately for faster response
                }, 300);
            });
        }, 300);
    }

    generateExerciseCardHTML(exercise, setIndex, previousData) {
        const key = exercise._instanceKey;
        const currentSet = this.workoutData[key].sets[setIndex];
        const prevSet = previousData ? this.getPreviousSetData(exercise.name, setIndex, key) : null;
        let rangeType = exercise.rangeType || (exercise.repRange && exercise.repRange.type) || 'reps';
        // Fix isCompleted logic to check seconds for second-range exercises
        const isCompleted = (rangeType === 'seconds')
            ? (currentSet.seconds > 0 || currentSet.weight > 0)
            : (currentSet.reps > 0 || currentSet.weight > 0);

        // Use the full rep/second range as the placeholder if available, otherwise fallback to min or 0
        let repPlaceholder = '0';
        let secPlaceholder = '0';
        // For previous set display, show seconds if rangeType is seconds
        if (rangeType === 'seconds') {
            if (exercise.repRange && typeof exercise.repRange.min === 'number' && typeof exercise.repRange.max === 'number') {
                secPlaceholder = `${exercise.repRange.min}-${exercise.repRange.max}`;
            } else if (exercise.repRange && typeof exercise.repRange.min === 'number') {
                secPlaceholder = exercise.repRange.min.toString();
            }
        } else {
            if (exercise.repRange && typeof exercise.repRange.min === 'number' && typeof exercise.repRange.max === 'number') {
                repPlaceholder = `${exercise.repRange.min}-${exercise.repRange.max}`;
            } else if (exercise.repRange && typeof exercise.repRange.min === 'number') {
                repPlaceholder = exercise.repRange.min.toString();
            }
        }
        // For weight, show previous set's weight if available, otherwise 0
        let weightPlaceholder = '0';
        if (prevSet && typeof prevSet.weight === 'number' && prevSet.weight > 0) {
            weightPlaceholder = prevSet.weight.toString();
        }
        // Return HTML as a template literal
        return `
            <div class="exercise-title">${exercise.name}</div>
            <div class="exercise-info">Set ${setIndex + 1} of ${exercise.sets}</div>
            <div class="sets-container">
                <div class="set-item active ${isCompleted ? 'completed' : ''}">
                    <div class="set-header">
                        ${prevSet ? `<span class="set-previous">Last: ${rangeType === 'seconds' ? (prevSet.seconds || 0) + ' sec' : (prevSet.reps || 0) + ' reps'} × ${prevSet.weight} kg</span>` : ''}
                        ${prevSet && prevSet.note ? `<div class="set-previous-note">\"${prevSet.note}\"</div>` : ''}
                    </div>
                    <div class="set-inputs">
                        ${rangeType === 'seconds' ? `
                        <div class="set-input">
                            <label>Seconds</label>
                            <input type="number" id="seconds-${setIndex}" placeholder="${secPlaceholder}" min="0" value="${currentSet.seconds || ''}">
                        </div>
                        ` : `
                        <div class="set-input">
                            <label>Reps</label>
                            <input type="number" id="reps-${setIndex}" placeholder="${repPlaceholder}" min="0" value="${currentSet.reps || ''}">
                        </div>
                        `}
                        <div class="set-input">
                            <label>Weight</label>
                            <input type="number" id="weight-${setIndex}" placeholder="${weightPlaceholder}" min="0" step="0.5" value="${currentSet.weight || ''}">
                        </div>
                    </div>
                </div>
                <div class="set-note-container">
                    <div class="set-input set-note">
                        <label>Note (optional)</label>
                        <input type="text" id="note-${setIndex}" placeholder="e.g., felt easy, good form" value="${currentSet.note || ''}" maxlength="100">
                    </div>
                </div>
            </div>
            <div class="workout-buttons" style="display: flex; flex-direction: column; gap: 8px; align-items: stretch; margin-bottom: 8px;">
                <button class="btn" style="width: 100%;" onclick="window.workoutManager.completeSet()">Complete Set</button>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary" style="flex: 1 1 20%; max-width: 20%; min-width: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; padding-top: 2px; padding-bottom: 4px;" onclick="window.workoutManager.goToPreviousSet()"><span style="display:inline-block; vertical-align:middle; font-size:22px; line-height:1;">&#8592;</span></button>
                    <button class="btn btn-secondary" style="flex: 1 1 80%; max-width: 80%; min-width: 0;" onclick="window.workoutManager.skipExercise()">Skip Exercise</button>
                </div>
            </div>
            <div class="swipe-hint">Swipe left to skip, right to go back</div>
        `;
    }

    createWakeLockToggle() {
        // Remove existing toggle if it exists
        const existingToggle = document.querySelector('.wake-lock-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        // Create the wake lock toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'wake-lock-toggle';
        toggleButton.title = 'Toggle screen wake lock';
        toggleButton.onclick = () => this.toggleWakeLock();
        
        const icon = document.createElement('span');
        icon.id = 'wake-lock-icon';
        icon.textContent = this.wakeLockActive ? '👁️' : '👁️‍🗨️';
        
        toggleButton.appendChild(icon);
        document.body.appendChild(toggleButton);
    }

    finishWorkout() {
        const session = {
            date: new Date().toISOString(),
            exercises: this.currentExercises.map((exercise, idx) => {
                const rangeType = exercise.rangeType || (exercise.repRange && exercise.repRange.type) || 'reps';
                const sets = this.workoutData[idx].sets;
                return {
                    name: exercise.name,
                    index: idx,
                    sets
                };
            }).filter(ex => {
                const exerciseObj = this.currentExercises[ex.index];
                const rangeType = exerciseObj?.rangeType || (exerciseObj?.repRange && exerciseObj.repRange.type) || 'reps';
                return ex.sets.some(set => {
                    if (rangeType === 'seconds') {
                        return (set.seconds > 0 || set.weight > 0 || (set.note && set.note.trim().length > 0));
                    } else {
                        return (set.reps > 0 || set.weight > 0 || (set.note && set.note.trim().length > 0));
                    }
                });
            }) // Only filter out exercises with no data at all
        };
        this.programManager.addSessionToProgram(this.currentProgram.id, session);

        // Clean up touch handlers
        if (this.touchHandler) {
            this.touchHandler.cleanup();
            this.touchHandler = null;
        }

        // Hide the swipe hint
        const swipeHint = document.querySelector('.swipe-hint');
        if (swipeHint) {
            swipeHint.style.display = 'none';
        }

        // Show completion card with animation
        const card = document.getElementById('exercise-card');
        card.style.transition = 'transform 0.3s cubic-bezier(.4,1.3,.6,1), opacity 0.3s';
        card.style.opacity = '0';
        
        setTimeout(() => {
            // Update card content while it's invisible
            card.innerHTML = `
                <div class="exercise-title" style="color: #34c759; font-size: 50px; margin: 45px 0;">Workout Complete!</div>
                <div class="exercise-info" style="font-size: 30px; margin: 20px 0;">Great job!</div>
                <div style="margin: 20px 0; color: #8e8e93;">
                    ${session.exercises.length} exercises completed
                </div>
            `;
            window.fireBottomConfetti();
            
            // Disable touch and pointer events on completion card
            card.style.touchAction = 'none';
            card.style.pointerEvents = 'none';
            
            // Reset any transform and show the completion card
            card.style.transform = 'translateX(0)';
            card.style.opacity = '1';
            
            // Wait for the user to see the completion message before exiting
            setTimeout(() => {
                // Remove wake lock toggle button
                const wakeLockToggle = document.querySelector('.wake-lock-toggle');
                if (wakeLockToggle) {
                    wakeLockToggle.remove();
                }
                CustomAlert.success('Workout completed! 🎉', 'Congratulations!');
                this.exitWorkout();
            }, 1500);
        }, 300);
    }

    async exitWorkout() {
        // Clean up touch handlers
        if (this.touchHandler) {
            this.touchHandler.cleanup();
            this.touchHandler = null;
        }

        // Remove wake lock toggle button
        const wakeLockToggle = document.querySelector('.wake-lock-toggle');
        if (wakeLockToggle) {
            wakeLockToggle.remove();
        }

        // Release wake lock
        await this.releaseWakeLock();

        UIManager.showProgramsTab();
        UIManager.displayPrograms(this.programManager.getAllPrograms());
    }

    async toggleWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                if (this.wakeLockActive && this.wakeLock) {
                    // Release wake lock
                    await this.wakeLock.release();
                    this.wakeLock = null;
                    this.wakeLockActive = false;
                    console.log('Wake lock released');
                } else {
                    // Request wake lock
                    this.wakeLock = await navigator.wakeLock.request('screen');
                    this.wakeLockActive = true;
                    console.log('Wake lock activated');
                    
                    // Listen for wake lock release (e.g., when tab becomes hidden)
                    this.wakeLock.addEventListener('release', () => {
                        this.wakeLockActive = false;
                        this.updateWakeLockIcon();
                        console.log('Wake lock was released');
                    });
                }
                
                this.updateWakeLockIcon();
            } else {
                console.warn('Wake Lock API not supported');
                CustomAlert.warning('Wake Lock is not supported in this browser', 'Feature Unavailable');
            }
        } catch (err) {
            console.error('Failed to toggle wake lock:', err);
            CustomAlert.error('Failed to toggle wake lock', 'Error');
        }
    }

    updateWakeLockIcon() {
        const icon = document.getElementById('wake-lock-icon');
        if (icon) {
            icon.textContent = this.wakeLockActive ? '👁️' : '👁️‍🗨️';
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                this.wakeLockActive = false;
                console.log('Wake lock released on workout exit');
            } catch (err) {
                console.error('Failed to release wake lock:', err);
            }
        }
    }
}
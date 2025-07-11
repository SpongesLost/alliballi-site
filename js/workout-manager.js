// Workout manager for handling workout sessions
class WorkoutManager {
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
    }

    startWorkout(programId) {
        this.currentProgram = this.programManager.getProgramById(programId);
        this.currentExercises = [...this.currentProgram.exercises];
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
        this.workoutData = {};
        const card = document.getElementById('exercise-card');
        card.style.touchAction = 'auto';
        card.style.pointerEvents = 'auto';
        
        
        // Create a fresh TouchHandler for this workout session
        this.touchHandler = new TouchHandler();
        
        // Initialize workout data structure
        this.currentExercises.forEach(exercise => {
            this.workoutData[exercise.name] = {
                sets: Array(exercise.sets).fill(null).map(() => ({ reps: 0, weight: 0, note: '' }))
            };
        });
        
        UIManager.showWorkoutMode();
        this.displayCurrentExercise();
        this.setupSwipeHandlers();
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
        this.animateCardSwipe(direction);
    }

    animateCardSwipe(direction) {
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
            
            const previousData = this.getPreviousSessionData(exercise.name);
            
            // Update HTML while card is still offscreen
            card.innerHTML = this.generateExerciseCardHTML(exercise, this.currentSetIndex, previousData);
            
            // Position new card on the opposite side from swipe direction
            cardElement.style.transition = 'none';
            cardElement.style.transform = direction === 'left' ? 'translateX(110vw)' : 'translateX(-110vw)';
            
            // Animate new card in
            requestAnimationFrame(() => {
                cardElement.style.transition = 'transform 0.3s cubic-bezier(.4,1.3,.6,1), opacity 0.3s';
                cardElement.style.transform = 'translateX(0)';
                cardElement.style.opacity = '1';
                
                // Re-setup swipe handlers after animation completes
                setTimeout(() => {
                    this.setupSwipeHandlers();
                    const repsInput = document.getElementById(`reps-${this.currentSetIndex}`);
                    if (repsInput) repsInput.focus();
                }, 300);
            });
        }, 300);
    }

    displayCurrentExercise() {
        const exercise = this.currentExercises[this.currentExerciseIndex];
        const card = document.getElementById('exercise-card');
        const progress = document.getElementById('progress-indicator');
        
        progress.textContent = `${this.currentExerciseIndex + 1} / ${this.currentExercises.length}`;
        const previousData = this.getPreviousSessionData(exercise.name);
        card.innerHTML = this.generateExerciseCardHTML(exercise, this.currentSetIndex, previousData);
        
        // Focus on reps input and setup swipe handlers after DOM update
        setTimeout(() => {
            this.setupSwipeHandlers();
            const repsInput = document.getElementById(`reps-${this.currentSetIndex}`);
            if (repsInput) repsInput.focus();
        }, 50);
    }

    getPreviousSessionData(exerciseName) {
        if (this.currentProgram.sessions.length === 0) return null;
        
        // Search backwards through sessions to find the most recent one with actual data
        for (let i = this.currentProgram.sessions.length - 1; i >= 0; i--) {
            const session = this.currentProgram.sessions[i];
            const exerciseData = session.exercises.find(ex => ex.name === exerciseName);
            
            if (exerciseData && exerciseData.sets && exerciseData.sets.length > 0) {
                // Check if this exercise has any sets with actual data (not all zeros)
                const hasData = exerciseData.sets.some(set => set.reps > 0 || set.weight > 0 || (set.note && set.note.trim().length > 0));
                if (hasData) {
                    return exerciseData;
                }
            }
        }
        
        return null; // No previous session with data found
    }

    getPreviousSetData(exerciseName, setIndex) {
        if (this.currentProgram.sessions.length === 0) return null;
        
        // Search backwards through sessions to find the most recent set with actual data
        for (let i = this.currentProgram.sessions.length - 1; i >= 0; i--) {
            const session = this.currentProgram.sessions[i];
            const exerciseData = session.exercises.find(ex => ex.name === exerciseName);
            
            if (exerciseData && exerciseData.sets && exerciseData.sets[setIndex]) {
                const setData = exerciseData.sets[setIndex];
                // Check if this specific set has actual data (not all zeros or empty note)
                if (setData.reps > 0 || setData.weight > 0 || (setData.note && setData.note.trim().length > 0)) {
                    return setData;
                }
            }
        }
        
        return null; // No previous set data found
    }

    completeSet() {
        const reps = parseInt(document.getElementById(`reps-${this.currentSetIndex}`).value) || 0;
        const weight = parseFloat(document.getElementById(`weight-${this.currentSetIndex}`).value) || 0;
        const note = document.getElementById(`note-${this.currentSetIndex}`).value.trim() || '';
        
        const exercise = this.currentExercises[this.currentExerciseIndex];
        this.workoutData[exercise.name].sets[this.currentSetIndex] = { reps, weight, note };
        
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
            
            const previousData = this.getPreviousSessionData(exercise.name);
            
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
                
                // Setup swipe handlers and focus after animation completes
                setTimeout(() => {
                    this.setupSwipeHandlers();
                    const repsInput = document.getElementById(`reps-${this.currentSetIndex}`);
                    if (repsInput) repsInput.focus();
                }, 300);
            });
        }, 300);
    }

    generateExerciseCardHTML(exercise, setIndex, previousData) {
        const currentSet = this.workoutData[exercise.name].sets[setIndex];
        const isCompleted = currentSet.reps > 0 || currentSet.weight > 0;
        const prevSet = this.getPreviousSetData(exercise.name, setIndex);

        return `
            <div class="exercise-title">${exercise.name}</div>
            <div class="exercise-info">Set ${setIndex + 1} of ${exercise.sets}</div>
            <div class="sets-container">
                <div class="set-item active ${isCompleted ? 'completed' : ''}">
                    <div class="set-header">
                        ${prevSet ? `<span class="set-previous">Last: ${prevSet.reps} reps × ${prevSet.weight} kg</span>` : ''}
                        ${prevSet && prevSet.note ? `<div class="set-previous-note">Note: "${prevSet.note}"</div>` : ''}
                    </div>
                    <div class="set-inputs">
                        <div class="set-input">
                            <label>Reps</label>
                            <input type="number" id="reps-${setIndex}" placeholder="0" min="0" 
                                   value="${currentSet.reps || ''}">
                        </div>
                        <div class="set-input">
                            <label>Weight</label>
                            <input type="number" id="weight-${setIndex}" placeholder="0" min="0" step="0.5"
                                   value="${currentSet.weight || ''}">
                        </div>
                    </div>
                </div>
                <div class="set-note-container">
                    <div class="set-input set-note">
                        <label>Note (optional)</label>
                        <input type="text" id="note-${setIndex}" placeholder="e.g., felt easy, good form"
                               value="${currentSet.note || ''}" maxlength="100">
                    </div>
                    <div class="workout-buttons">
                        <button class="btn btn-secondary" onclick="window.workoutManager.skipExercise()">Skip Exercise</button>
                        <button class="btn" onclick="window.workoutManager.completeSet()">Complete Set</button>
                    </div>
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
            exercises: Object.entries(this.workoutData).map(([name, data]) => ({
                name,
                sets: data.sets // Keep all sets to preserve set index positions
            })).filter(ex => ex.sets.some(set => set.reps > 0 || set.weight > 0 || (set.note && set.note.trim().length > 0))) // Only filter out exercises with no data at all
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
            
            // Disable touch and pointer events on completion card
            card.style.touchAction = 'none';
            card.style.pointerEvents = 'none';
            
            // Reset any transform and show the completion card
            card.style.transform = 'translateX(0)';
            card.style.opacity = '1';
            
            // Wait for the user to see the completion message before exiting
            setTimeout(() => {
                alert('Workout completed! Great job!');
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
                alert('Wake Lock is not supported in this browser');
            }
        } catch (err) {
            console.error('Failed to toggle wake lock:', err);
            alert('Failed to toggle wake lock');
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

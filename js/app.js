if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
    .then((registration) => {
      console.log("✅ Service Worker registered successfully:", registration.scope);
    })
    .catch(err => {
      console.error("❌ SW registration failed:", err);
    });
}

// Main application file that initializes all modules
class FitnessApp {
    constructor() {
        this.programManager = new ProgramManager();
        this.programEditor = new ProgramEditor(this.programManager);
        this.workoutManager = new WorkoutManager(this.programManager);
        
        // Make instances available globally for onclick handlers
        window.programEditor = this.programEditor;
        window.workoutManager = this.workoutManager;

        this.init();
    }

    init() {
        // Display programs on startup
        UIManager.displayPrograms(this.programManager.getAllPrograms());
        
        // Set up keyboard event handlers
        this.setupKeyboardHandlers();
    }

    setupKeyboardHandlers() {
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeTab = document.querySelector('.tab-content:not(.hidden)');
                if (activeTab && activeTab.id === 'workout-tab') {
                    const activeRepsInput = document.getElementById(`reps-${this.workoutManager.currentSetIndex}`);
                    const activeWeightInput = document.getElementById(`weight-${this.workoutManager.currentSetIndex}`);
                    
                    if (document.activeElement === activeRepsInput) {
                        activeWeightInput.focus();
                    }
                    // Do NOT auto-complete set on Enter in weight field
                }
            }
        });
    }
}

// Global functions for onclick handlers (keeping backward compatibility)
function showTab(tabName, event) {
    UIManager.showTab(tabName, event);
}

function addExercise() {
    window.programEditor.addExercise();
}

function saveProgram() {
    window.programEditor.saveProgram();
}

function editProgram(programId) {
    window.programEditor.editProgram(programId);
}

function cancelEdit() {
    window.programEditor.cancelEdit();
}

function startWorkout(programId) {
    window.workoutManager.startWorkout(programId);
}

function deleteProgram(programId) {
    const program = window.app.programManager.getProgramById(programId);
    if (!program) return;
    
    const programName = program.name || 'this program';
    
    CustomAlert.confirm(
        `Are you sure you want to delete "${programName}"? This action cannot be undone.`,
        'Delete Program',
        () => {
            // Confirmed - delete the program
            window.app.programManager.deleteProgram(programId);
            UIManager.displayPrograms(window.app.programManager.getAllPrograms());
            CustomAlert.success('Program deleted successfully');
        },
        () => {
            // Cancelled - do nothing
        }
    );
}

function exportPrograms() {
    UIManager.exportPrograms();
}

function importPrograms() {
    UIManager.importPrograms();
}

function handleFileImport(event) {
    UIManager.handleFileImport(event);
}

function exitWorkout() {
    window.workoutManager.exitWorkout();
}
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitnessApp();
});

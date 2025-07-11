// Storage module for handling data persistence
class Storage {
    static loadPrograms() {
        try {
            const saved = localStorage.getItem('fitnessPrograms');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading programs:', e);
        }
        return [];
    }

    static savePrograms(programs) {
        try {
            const programsData = JSON.stringify(programs);
            localStorage.setItem('fitnessPrograms', programsData);
        } catch (e) {
            console.error('Error saving programs:', e);
        }
    }
}

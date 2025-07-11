// Program manager for handling program CRUD operations
class ProgramManager {
    constructor() {
        this.programs = [];
        this.editingProgramId = null;
        this.loadPrograms();
    }

    loadPrograms() {
        this.programs = Storage.loadPrograms();
    }

    savePrograms() {
        Storage.savePrograms(this.programs);
    }

    getAllPrograms() {
        return this.programs;
    }

    getProgramById(id) {
        return this.programs.find(p => p.id === id);
    }

    createProgram(name, exercises) {
        const program = {
            id: Date.now(),
            name: name,
            exercises: exercises,
            sessions: []
        };
        this.programs.push(program);
        this.savePrograms();
        return program;
    }

    updateProgram(id, name, exercises) {
        const programIndex = this.programs.findIndex(p => p.id === id);
        if (programIndex !== -1) {
            this.programs[programIndex].name = name;
            this.programs[programIndex].exercises = exercises;
            this.savePrograms();
            return this.programs[programIndex];
        }
        return null;
    }

    deleteProgram(id) {
        this.programs = this.programs.filter(p => p.id !== id);
        this.savePrograms();
    }

    addSessionToProgram(programId, session) {
        const program = this.getProgramById(programId);
        if (program) {
            program.sessions.push(session);
            this.savePrograms();
        }
    }

    setEditingProgramId(id) {
        this.editingProgramId = id;
    }

    getEditingProgramId() {
        return this.editingProgramId;
    }

    clearEditingProgram() {
        this.editingProgramId = null;
    }
}

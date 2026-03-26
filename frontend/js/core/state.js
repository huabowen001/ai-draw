class State {
    constructor(initialState = {}) {
        this.state = { ...initialState };
        this.listeners = new Map();
    }

    get(key) {
        return key ? this.state[key] : { ...this.state };
    }

    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notify(key, value, oldValue);
    }

    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        return () => this.listeners.get(key)?.delete(callback);
    }

    notify(key, newValue, oldValue) {
        this.listeners.get(key)?.forEach(callback => {
            callback(newValue, oldValue);
        });
    }

    reset(initialState = {}) {
        this.state = { ...initialState };
        this.listeners.clear();
    }
}

export const appState = new State({
    currentFile: null,
    currentXml: null,
    isLoading: false,
    error: null
});

export default State;

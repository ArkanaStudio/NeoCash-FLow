const Storage = {
    KEYS: {
        API_URL: 'finora_api_url',
        THEME: 'finora_theme',
        TRANSACTIONS: 'finora_transactions',
        BUDGETS: 'finora_budgets',
        GOALS: 'finora_goals',
        USERNAME: 'finora_username',
        USER_EMAIL: 'finora_user_email',
        USER_AVATAR: 'finora_user_avatar'
    },

    DEFAULT_API_URL: '',

    getApiUrl() {
        return localStorage.getItem(this.KEYS.API_URL) || '';
    },

    setApiUrl(url) {
        localStorage.setItem(this.KEYS.API_URL, url);
    },

    resetApiUrl() {
        localStorage.setItem(this.KEYS.API_URL, this.DEFAULT_API_URL);
    },

    getUsername() {
        return localStorage.getItem(this.KEYS.USERNAME) || '';
    },

    setUsername(name) {
        localStorage.setItem(this.KEYS.USERNAME, name.trim());
    },

    getUserEmail() {
        return localStorage.getItem(this.KEYS.USER_EMAIL) || '';
    },

    setUserEmail(email) {
        localStorage.setItem(this.KEYS.USER_EMAIL, email.trim());
    },

    getUserAvatar() {
        return localStorage.getItem(this.KEYS.USER_AVATAR) || '';
    },

    setUserAvatar(url) {
        localStorage.setItem(this.KEYS.USER_AVATAR, url);
    },

    clearUserProfile() {
        localStorage.removeItem(this.KEYS.USERNAME);
        localStorage.removeItem(this.KEYS.USER_EMAIL);
        localStorage.removeItem(this.KEYS.USER_AVATAR);
    },

    getTransactions() {
        return JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
    },

    saveTransactions(data) {
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(data));
    },

    getBudgets() {
        return JSON.parse(localStorage.getItem(this.KEYS.BUDGETS) || '[]');
    },

    saveBudgets(data) {
        localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(data));
    },

    getGoals() {
        return JSON.parse(localStorage.getItem(this.KEYS.GOALS) || '[]');
    },

    saveGoals(data) {
        localStorage.setItem(this.KEYS.GOALS, JSON.stringify(data));
    }
};
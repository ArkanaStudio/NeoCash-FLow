const API = {
    async fetchAllData() {
        const url = Storage.getApiUrl();
        if (!url) return null;

        try {
            const [txRes, bgRes, glRes, catRes] = await Promise.all([
                fetch(`${url}?action=getTransactions`),
                fetch(`${url}?action=getBudgets`),
                fetch(`${url}?action=getGoals`),
                fetch(`${url}?action=getCategories`)
            ]);

            const transactions = await txRes.json();
            const budgets = await bgRes.json();
            const goals = await glRes.json();
            let categories = [];
            try { categories = await catRes.json(); } catch(e){}

            if (Array.isArray(transactions)) Storage.saveTransactions(transactions);
            if (Array.isArray(budgets)) Storage.saveBudgets(budgets);
            if (Array.isArray(goals)) Storage.saveGoals(goals);

            return { transactions, budgets, goals, categories };
        } catch (error) {
            console.error("Gagal mengambil data remote:", error);
            return null;
        }
    },

    async postData(payload) {
        const url = Storage.getApiUrl();
        if (!url) return { status: 'offline' };

        try {
            const formData = new URLSearchParams();
            formData.append('data', JSON.stringify(payload));

            const res = await fetch(url, {
                method: 'POST',
                body: formData
            });

            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return { status: 'offline' };
        }
    },

    async saveTransaction(payload) {
        const action = payload.isUpdate ? 'updateTransaction' : 'addTransaction';
        return await this.postData({ action, ...payload });
    },

    async deleteTransaction(id) {
        return await this.postData({ action: 'deleteTransaction', id });
    },

    async deleteAllTransactions() {
        return await this.postData({ action: 'deleteAllTransactions' });
    },

    async saveBudget(payload) {
        return await this.postData({ action: 'setBudget', ...payload });
    },

    async deleteBudget(id, category, month) {
        return await this.postData({ action: 'deleteBudget', id, category, month });
    },

    async saveGoal(payload) {
        return await this.postData({ action: 'saveGoal', ...payload });
    },

    async deleteGoal(id) {
        return await this.postData({ action: 'deleteGoal', id });
    },

    async addCategory(name, type) {
        return await this.postData({ action: 'addCategory', name, type });
    },

    async updateCategory(oldName, newName, type) {
        return await this.postData({ action: 'updateCategory', oldName, newName, type });
    },

    async deleteCategory(name) {
        return await this.postData({ action: 'deleteCategory', name });
    },

    async saveMonthlyRecap(recapData) {
        return await this.postData({ action: 'saveMonthlyRecap', ...recapData });
    }
};
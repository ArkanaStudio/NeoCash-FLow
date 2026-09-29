const UI = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    renderDashboardCards(transactions, goals = []) {
        let income = 0;
        let expense = 0;
        let savingsFromTx = 0;

        transactions.filter(t => t && t.id && (parseFloat(t.amount) > 0)).forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'Income') income += amt;
            else if (t.type === 'Expense') expense += amt;
            else if (t.type === 'Transfer' || t.category === 'Investasi' || t.category === 'Tujuan') savingsFromTx += amt;
        });

        const totalSavings = savingsFromTx;
        const totalBalance = income - expense - totalSavings;

        document.getElementById('card-total-balance').innerText = this.formatCurrency(totalBalance);
        document.getElementById('card-income').innerText = this.formatCurrency(income);
        document.getElementById('card-expense').innerText = this.formatCurrency(expense);
        document.getElementById('card-savings').innerText = this.formatCurrency(totalSavings);
    },

    renderMonthlyRecap(transactions, budgets, selectedMonth) {
        if (!selectedMonth) {
            const now = new Date();
            selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        let income = 0;
        let expense = 0;
        let savings = 0;
        const catExpenseMap = {};

        transactions.filter(t => t && t.date && t.date.startsWith(selectedMonth) && parseFloat(t.amount) > 0).forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'Income') {
                income += amt;
            } else if (t.type === 'Expense') {
                expense += amt;
                catExpenseMap[t.category] = (catExpenseMap[t.category] || 0) + amt;
            } else if (t.type === 'Transfer' || t.category === 'Investasi' || t.category === 'Tujuan') {
                savings += amt;
            }
        });

        let topExpenseCat = '-';
        let maxExp = 0;
        for (const [cat, amt] of Object.entries(catExpenseMap)) {
            if (amt > maxExp) {
                maxExp = amt;
                topExpenseCat = cat;
            }
        }

        const incomeEl = document.getElementById('rekap-total-income');
        if (incomeEl) incomeEl.innerText = this.formatCurrency(income);

        const expenseEl = document.getElementById('rekap-total-expense');
        if (expenseEl) expenseEl.innerText = this.formatCurrency(expense);

        const savingsEl = document.getElementById('rekap-total-savings');
        if (savingsEl) savingsEl.innerText = this.formatCurrency(savings);

        const topExpenseEl = document.getElementById('rekap-top-expense');
        if (topExpenseEl) {
            topExpenseEl.innerText = topExpenseCat !== '-' ? `${topExpenseCat} (${this.formatCurrency(maxExp)})` : '-';
        }

        const savingsRate = income > 0 ? Math.max(0, Math.round((savings / income) * 100)) : 0;
        const net = income - expense - savings;

        return {
            month: selectedMonth,
            totalIncome: income,
            totalExpense: expense,
            totalSavings: savings,
            netCash: net,
            savingsRatio: `${savingsRate}%`,
            budgetUsed: expense,
            topExpenseCategory: topExpenseCat
        };
    },

    renderRecentTransactions(transactions) {
        const tbody = document.querySelector('#recent-transactions-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const validTx = transactions.filter(t => t && t.id && t.description && parseFloat(t.amount) > 0);
        const recent = validTx.slice(0, 5);

        if (recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--text-muted); padding:24px;">Belum ada transaksi tersimpan.</td></tr>`;
            return;
        }

        recent.forEach(t => {
            const tr = document.createElement('tr');
            const isIncome = t.type === 'Income';
            const isTransfer = t.type === 'Transfer';
            const classColor = isIncome ? 'amount-income' : (isTransfer ? 'amount-transfer' : 'amount-expense');
            const prefix = isIncome ? '+' : (isTransfer ? '• ' : '-');
            const dateOnly = (t.date || '').split('T')[0].split(' ')[0];

            tr.innerHTML = `
                <td><strong>${t.description}</strong></td>
                <td>${t.category}</td>
                <td>${dateOnly}</td>
                <td>${t.account}</td>
                <td class="text-right ${classColor}">
                    ${prefix}${this.formatCurrency(t.amount)}
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderFullTransactions(transactions, page = 1, limit = 10) {
        const tbody = document.querySelector('#full-transactions-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const validTx = transactions.filter(t => t && t.id && t.description && parseFloat(t.amount) > 0);
        const totalItems = validTx.length;

        if (totalItems === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--text-muted); padding:24px;">Tidak ada transaksi ditemukan.</td></tr>`;
            this.updatePaginationUI(0, 0, 0, 1, 1);
            return;
        }

        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.min(Math.max(1, page), totalPages);
        const startIndex = (currentPage - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalItems);

        const paginatedItems = validTx.slice(startIndex, endIndex);

        paginatedItems.forEach(t => {
            const tr = document.createElement('tr');
            const isIncome = t.type === 'Income';
            const isTransfer = t.type === 'Transfer';
            const classColor = isIncome ? 'amount-income' : (isTransfer ? 'amount-transfer' : 'amount-expense');
            const dateOnly = (t.date || '').split('T')[0].split(' ')[0];

            tr.innerHTML = `
                <td>${dateOnly}</td>
                <td><strong>${t.description}</strong></td>
                <td>${t.category}</td>
                <td>${t.account}</td>
                <td><span class="btn-sm btn-outline">${t.type === 'Income' ? 'Pemasukan' : (t.type === 'Expense' ? 'Pengeluaran' : 'Transfer')}</span></td>
                <td class="text-right ${classColor}">${this.formatCurrency(t.amount)}</td>
                <td class="text-center" style="display:flex; gap:6px; justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="window.editTransaction('${t.id}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.deleteTransaction('${t.id}')" style="color:var(--expense); border-color:var(--expense);">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (window.lucide) window.lucide.createIcons();
        this.updatePaginationUI(startIndex + 1, endIndex, totalItems, currentPage, totalPages);
    },

    updatePaginationUI(start, end, total, currentPage, totalPages) {
        const infoEl = document.getElementById('tx-pagination-info');
        if (infoEl) infoEl.innerText = `Menampilkan ${start}-${end} dari ${total}`;

        const pageNumEl = document.getElementById('tx-page-num');
        if (pageNumEl) pageNumEl.innerText = `${currentPage} / ${totalPages || 1}`;

        const btnPrev = document.getElementById('btn-tx-prev');
        if (btnPrev) btnPrev.disabled = currentPage <= 1;

        const btnNext = document.getElementById('btn-tx-next');
        if (btnNext) btnNext.disabled = currentPage >= totalPages;
    },

    renderBudgets(budgets, transactions) {
        const container = document.getElementById('budget-items-list');
        if (!container) return;
        container.innerHTML = '';

        if (budgets.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:14px; text-align:center; padding:16px;">Belum ada anggaran yang ditentukan.</p>`;
            return;
        }

        budgets.forEach(b => {
            let used = 0;
            transactions.filter(t => t.type === 'Expense' && String(t.category).toLowerCase() === String(b.category).toLowerCase() && parseFloat(t.amount) > 0).forEach(t => {
                used += parseFloat(t.amount) || 0;
            });

            const budgetAmt = parseFloat(b.budget) || 1;
            const remaining = budgetAmt - used;
            const percentage = Math.min(Math.round((used / budgetAmt) * 100), 100);
            
            let barClass = '';
            if (percentage >= 100) barClass = 'danger';
            else if (percentage >= 80) barClass = 'warning';

            const bgId = b.id || '';
            const bgMonth = b.month || '';

            const div = document.createElement('div');
            div.className = 'mt-3';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; font-weight:600;">
                    <span>${b.category}</span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="budget-info" style="font-weight:normal;">${this.formatCurrency(used)} / ${this.formatCurrency(budgetAmt)} (${percentage}%)</span>
                        <button class="btn btn-text" onclick="window.editBudget('${b.category}', ${b.budget})"><i data-lucide="edit-2" style="width:14px;"></i></button>
                        <button class="btn btn-text" onclick="window.deleteBudget('${bgId}', '${b.category}', '${bgMonth}')" style="color:var(--expense);"><i data-lucide="trash-2" style="width:14px;"></i></button>
                    </div>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill ${barClass}" style="width: ${percentage}%;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="remaining-badge ${remaining < 0 ? 'danger' : ''}">
                        Sisa Anggaran: ${this.formatCurrency(Math.max(0, remaining))} ${remaining < 0 ? '(Melebihi Anggaran!)' : ''}
                    </span>
                </div>
            `;
            container.appendChild(div);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    renderGoals(goals) {
        const container = document.getElementById('goals-items-list');
        if (!container) return;
        container.innerHTML = '';

        if (goals.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:14px; text-align:center; padding:16px;">Belum ada Target Tabungan.</p>`;
            return;
        }

        goals.forEach(g => {
            const current = parseFloat(g.current) || 0;
            const target = parseFloat(g.target) || 1;
            const remainingNeeded = target - current;
            const percentage = Math.min(Math.round((current / target) * 100), 100);
            const isCompleted = current >= target;

            const div = document.createElement('div');
            div.className = 'mt-3';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; font-weight:600;">
                    <span>${g.goal} ${isCompleted ? '🎉 (Tercapai!)' : ''}</span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="budget-info" style="font-weight:normal;">${this.formatCurrency(current)} / ${this.formatCurrency(target)} (${percentage}%)</span>
                        <button class="btn btn-text" onclick="window.editGoal('${g.id}')"><i data-lucide="edit-2" style="width:14px;"></i></button>
                        <button class="btn btn-text" onclick="window.deleteGoal('${g.id}')" style="color:var(--expense);"><i data-lucide="trash-2" style="width:14px;"></i></button>
                    </div>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill ${isCompleted ? 'warning' : ''}" style="width: ${percentage}%;"></div>
                </div>
                <div>
                    <span class="remaining-badge">
                        ${isCompleted ? 'Target Selesai' : `Sisa Kekurangan: ${this.formatCurrency(Math.max(0, remainingNeeded))}`}
                    </span>
                </div>
            `;
            container.appendChild(div);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    renderStatistics(transactions) {
        const todayStr = new Date().toISOString().substring(0, 10);
        let todayExpense = 0;
        let todayIncome = 0;
        const catMap = {};
        const daysSet = new Set();

        transactions.filter(t => t && t.id && parseFloat(t.amount) > 0).forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.date) daysSet.add((t.date || '').split('T')[0].split(' ')[0]);

            const txDateOnly = (t.date || '').split('T')[0].split(' ')[0];
            if (txDateOnly === todayStr) {
                if (t.type === 'Expense') {
                    todayExpense += amt;
                    catMap[t.category] = (catMap[t.category] || 0) + amt;
                } else if (t.type === 'Income') {
                    todayIncome += amt;
                }
            }
        });

        let topCat = '-';
        let maxAmt = 0;
        for (const [cat, amt] of Object.entries(catMap)) {
            if (amt > maxAmt) {
                maxAmt = amt;
                topCat = cat;
            }
        }

        const topCatElem = document.getElementById('stat-top-category');
        if (topCatElem) topCatElem.innerText = topCat !== '-' ? `${topCat} (${this.formatCurrency(maxAmt)})` : '-';

        const totalDays = daysSet.size || 1;
        let totalExpenseAllDays = 0;
        transactions.filter(t => t.type === 'Expense').forEach(t => { totalExpenseAllDays += parseFloat(t.amount) || 0; });
        const dailyAvg = totalExpenseAllDays / totalDays;

        const dailyAvgElem = document.getElementById('stat-daily-avg');
        if (dailyAvgElem) dailyAvgElem.innerText = this.formatCurrency(dailyAvg);

        const dailyRatio = todayIncome > 0 ? Math.round((todayExpense / todayIncome) * 100) : (todayExpense > 0 ? 100 : 0);
        const dailyRatioElem = document.getElementById('stat-daily-ratio');
        if (dailyRatioElem) dailyRatioElem.innerText = `${dailyRatio}%`;
    }
};
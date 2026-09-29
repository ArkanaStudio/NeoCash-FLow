function handleGoogleSignIn(response) {
  try {
    const base64Url = response.credential.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);

    let firstName = payload.name;
    if (payload.given_name) {
      firstName = payload.given_name;
    } else if (payload.name && payload.name.trim() !== "") {
      firstName = payload.name.trim().split(" ")[0];
    }

    if (firstName) Storage.setUsername(firstName);
    if (payload.email) Storage.setUserEmail(payload.email);
    if (payload.picture) Storage.setUserAvatar(payload.picture);

    document.getElementById("google-login-modal").classList.remove("active");
    if (window.appInstance) {
      window.appInstance.initClockAndGreeting();
      window.appInstance.updateAuthUI();
      window.appInstance.init();
    }

    UI.showToast(`Berhasil masuk sebagai ${firstName}!`, "success");
  } catch (e) {
    console.error("Gagal memproses Google Sign-In:", e);
    UI.showToast("Gagal masuk dengan akun Google.", "warning");
  }
}

class App {
  constructor() {
    window.appInstance = this;
    this.transactions = Storage.getTransactions();
    this.budgets = Storage.getBudgets();
    this.goals = Storage.getGoals();
    this.customCategories = JSON.parse(
      localStorage.getItem("finora_custom_categories") || "[]",
    );

    this.currentTxPage = 1;
    this.txPerPage = 10;

    this.cashFlowChart = null;
    this.categoryChart = null;
    this.statBarChart = null;
    this.mobileStatBarChart = null;

    this.init();
  }

  async init() {
    this.initClockAndGreeting();
    this.initTheme();
    this.initRecapPicker();
    this.initUsernameModal();
    this.initAuthModal();
    this.updateAuthUI();
    this.initEventListeners();
    this.initCalculator();
    this.populateCategories();

    this.setUpdateNotice("", false);

    window.deleteTransaction = (id) => this.deleteTransaction(id);
    window.editTransaction = (id) => this.editTransaction(id);
    window.editBudget = (category, amount) => this.editBudget(category, amount);
    window.deleteBudget = (id, category, month) =>
      this.deleteBudget(id, category, month);
    window.editGoal = (id) => this.editGoal(id);
    window.deleteGoal = (id) => this.deleteGoal(id);
    window.editCategory = (name) => this.editCategory(name);
    window.deleteCategory = (name) => this.deleteCategory(name);

    this.renderAll();

    const data = await API.fetchAllData();
    if (data) {
      if (data.transactions) this.transactions = data.transactions;
      if (data.budgets) this.budgets = data.budgets;
      if (data.goals) this.goals = data.goals;

      if (data.categories && Array.isArray(data.categories)) {
        const defaultId = this.getDefaultCategories();
        const oldEnglish = this.getOldEnglishCategories();

        data.categories.forEach((c) => {
          if (!c.name) return;
          const name = String(c.name).trim();
          if (!name) return;

          const isOldEnglish = oldEnglish.some(
            (en) => en.toLowerCase() === name.toLowerCase(),
          );
          if (isOldEnglish) return;

          const isDefaultId = defaultId.some(
            (d) => d.toLowerCase() === name.toLowerCase(),
          );
          if (isDefaultId) return;

          const alreadyCustom = this.customCategories.some(
            (cc) => cc.toLowerCase() === name.toLowerCase(),
          );
          if (alreadyCustom) return;

          this.customCategories.push(name);
        });

        localStorage.setItem(
          "finora_custom_categories",
          JSON.stringify(this.customCategories),
        );
        this.populateCategories();
      }

      this.renderAll();
      UI.showToast(
        "Data berhasil disinkronkan dengan Google Spreadsheet",
        "success",
      );
    }
  }

  setUpdateNotice(messageText, isWarning = false) {
    const noticeElem = document.getElementById("update-notice-text");
    if (!noticeElem) return;

    if (messageText && messageText.trim() !== "") {
      noticeElem.innerHTML = `<i data-lucide="${isWarning ? 'alert-triangle' : 'check-circle'}" style="width:14px; height:14px; flex-shrink:0;"></i> ${messageText}`;
      noticeElem.className = `update-notice-paragraph ${isWarning ? 'warning-notice' : ''}`;
      noticeElem.style.display = "flex";
      if (window.lucide) window.lucide.createIcons();
    } else {
      noticeElem.style.display = "none";
      noticeElem.innerHTML = "";
    }
  }

  getDefaultCategories() {
    return [
      "Makanan",
      "Bensin",
      "Servis",
      "Transportasi",
      "Belanja",
      "Tagihan",
      "Hiburan",
      "Kesehatan",
      "Pendidikan",
      "Tujuan",
      "Gaji",
      "Bisnis",
      "Investasi",
      "Lainnya",
    ];
  }

  getOldEnglishCategories() {
    return [
      "Food",
      "Gasoline",
      "Service",
      "Transport",
      "Shopping",
      "Bills",
      "Entertainment",
      "Health",
      "Education",
      "Goals",
      "Salary",
      "Business",
      "Investment",
      "Others",
    ];
  }

  initUsernameModal() {
    const modal = document.getElementById("username-modal");
    const openBtn = document.getElementById("btn-edit-username");
    const closeBtn = document.getElementById("close-username-modal");
    const cancelBtn = document.getElementById("cancel-username-modal");
    const form = document.getElementById("username-form");
    const input = document.getElementById("input-username");

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        input.value = Storage.getUsername();
        modal.classList.add("active");
      });
    }

    const closeModal = () => modal.classList.remove("active");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const newName = input.value.trim();
        if (newName) {
          Storage.setUsername(newName);
          this.initClockAndGreeting();
          closeModal();
          UI.showToast(`Nama pengguna diubah menjadi: ${newName}`, "success");
        }
      });
    }
  }

  initAuthModal() {
    const modal = document.getElementById("google-login-modal");
    const openBtn = document.getElementById("btn-open-login");
    const openBtnMobile = document.getElementById("mobile-btn-open-login");
    const logoutBtn = document.getElementById("btn-logout-google");
    const logoutBtnMobile = document.getElementById("mobile-btn-logout-google");
    const closeBtn = document.getElementById("close-login-modal");
    const cancelBtn = document.getElementById("cancel-login-modal");

    const showModal = () => modal.classList.add("active");
    if (openBtn) openBtn.addEventListener("click", showModal);
    if (openBtnMobile) openBtnMobile.addEventListener("click", showModal);

    const handleLogout = () => {
      if (confirm("Apakah Anda yakin ingin keluar dari akun Google?")) {
        Storage.clearUserProfile();
        this.initClockAndGreeting();
        this.updateAuthUI();
        UI.showToast("Anda telah keluar dari akun Google.", "info");
      }
    };

    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", handleLogout);

    const closeModal = () => modal.classList.remove("active");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  }

  updateAuthUI() {
    const avatarContainer = document.getElementById("user-avatar-container");
    const avatarImg = document.getElementById("user-avatar");
    const openLoginBtn = document.getElementById("btn-open-login");
    const logoutBtn = document.getElementById("btn-logout-google");

    const mobileOpenLoginBtn = document.getElementById("mobile-btn-open-login");
    const mobileLogoutBtn = document.getElementById("mobile-btn-logout-google");

    const avatarUrl = Storage.getUserAvatar();
    const userEmail = Storage.getUserEmail();

    if (avatarUrl && userEmail) {
      if (avatarImg) avatarImg.src = avatarUrl;
      if (avatarContainer) avatarContainer.style.display = "block";

      if (openLoginBtn) openLoginBtn.style.setProperty("display", "none", "important");
      if (logoutBtn) logoutBtn.style.setProperty("display", "inline-flex", "important");

      if (mobileOpenLoginBtn) mobileOpenLoginBtn.style.setProperty("display", "none", "important");
      if (mobileLogoutBtn) mobileLogoutBtn.style.setProperty("display", "inline-flex", "important");
    } else {
      if (avatarContainer) avatarContainer.style.display = "none";

      if (openLoginBtn) openLoginBtn.style.setProperty("display", "inline-flex", "important");
      if (logoutBtn) logoutBtn.style.setProperty("display", "none", "important");

      if (mobileOpenLoginBtn) mobileOpenLoginBtn.style.setProperty("display", "inline-flex", "important");
      if (mobileLogoutBtn) mobileLogoutBtn.style.setProperty("display", "none", "important");
    }

    if (window.lucide) window.lucide.createIcons();
  }

  initClockAndGreeting() {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();

      const clockStr = now.toLocaleTimeString("id-ID", { hour12: false });
      const fullDateStr = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const clockElem = document.getElementById("live-clock");
      if (clockElem) clockElem.innerText = clockStr;
      const monthElem = document.getElementById("active-month-text");
      if (monthElem) {
        monthElem.innerHTML = `<span id="live-clock">${clockStr}</span> — ${fullDateStr}`;
      }

      let baseGreeting = "Selamat Datang";
      if (hours >= 4 && hours < 11) baseGreeting = "Selamat Pagi";
      else if (hours >= 11 && hours < 16) baseGreeting = "Selamat Siang";
      else if (hours >= 16 && hours < 19) baseGreeting = "Selamat Sore";
      else if (hours >= 19 || hours < 4) baseGreeting = "Selamat Malam";

      const savedName = Storage.getUsername();
      const fullGreeting = savedName
        ? `${baseGreeting}, ${savedName} 👋`
        : `${baseGreeting} 👋`;

      const greetElem = document.getElementById("greeting-text");
      if (greetElem) greetElem.innerText = fullGreeting;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  initRecapPicker() {
    const picker = document.getElementById("recap-month-picker");
    if (picker) {
      const now = new Date();
      picker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      picker.addEventListener("change", () => {
        UI.renderMonthlyRecap(this.transactions, this.budgets, picker.value);
      });
    }

    const btnSync = document.getElementById("btn-sync-recap");
    if (btnSync) {
      btnSync.addEventListener("click", () => this.handleSaveMonthlyRecap());
    }
  }

  async handleSaveMonthlyRecap() {
    const picker = document.getElementById("recap-month-picker");
    const month = picker
      ? picker.value
      : new Date().toISOString().substring(0, 7);

    const recapData = UI.renderMonthlyRecap(
      this.transactions,
      this.budgets,
      month,
    );
    UI.showToast("Menyimpan Rekap Bulanan ke Spreadsheet...", "info");

    const res = await API.saveMonthlyRecap(recapData);
    if (res && res.status === "success") {
      UI.showToast(
        `Rekap bulan ${month} berhasil disimpan di Spreadsheet!`,
        "success",
      );
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem(Storage.KEYS.THEME) || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const toggleTheme = () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(Storage.KEYS.THEME, next);
    };

    const btnToggleDesktop = document.getElementById("theme-toggle");
    if (btnToggleDesktop)
      btnToggleDesktop.addEventListener("click", toggleTheme);

    const btnToggleMobile = document.getElementById("mobile-theme-toggle");
    if (btnToggleMobile)
      btnToggleMobile.addEventListener("click", toggleTheme);
  }

  initCalculator() {
    const calcInput = document.getElementById("calc-income");
    const calcRule = document.getElementById("calc-rule");
    const btnUseIncome = document.getElementById("btn-use-latest-income");

    const calculate = () => {
      const income = parseFloat(calcInput.value) || 0;
      const rule = calcRule.value;

      let pNeeds = 50, pWants = 30, pSavings = 20;

      if (rule === "60-30-10") {
        pNeeds = 60;
        pWants = 30;
        pSavings = 10;
      }

      const needsAmt = (income * pNeeds) / 100;
      const wantsAmt = (income * pWants) / 100;
      const savingsAmt = (income * pSavings) / 100;

      document.getElementById("pct-needs").innerText = `${pNeeds}%`;
      document.getElementById("pct-wants").innerText = `${pWants}%`;
      document.getElementById("pct-savings").innerText = `${pSavings}%`;

      document.getElementById("res-needs").innerText = UI.formatCurrency(needsAmt);
      document.getElementById("res-wants").innerText = UI.formatCurrency(wantsAmt);
      document.getElementById("res-savings").innerText = UI.formatCurrency(savingsAmt);
    };

    if (calcInput) calcInput.addEventListener("input", calculate);
    if (calcRule) calcRule.addEventListener("change", calculate);

    if (btnUseIncome) {
      btnUseIncome.addEventListener("click", () => {
        const currentMonth = new Date().toISOString().substring(0, 7);
        let totalIncome = 0;

        this.transactions.forEach((t) => {
          if (t.type === "Income" && t.date && t.date.startsWith(currentMonth)) {
            totalIncome += parseFloat(t.amount) || 0;
          }
        });

        if (totalIncome > 0) {
          calcInput.value = totalIncome;
          calculate();
          UI.showToast(`Mengambil total pemasukan bulan ini: ${UI.formatCurrency(totalIncome)}`, "info");
        } else {
          UI.showToast("Belum ada pencatatan Pemasukan pada bulan ini.", "warning");
        }
      });
    }

    calculate();
  }

  initEventListeners() {
    document
      .querySelectorAll(".nav-item, .mobile-nav-item, #btn-mobile-settings-top")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.currentTarget.getAttribute("data-target");
          if (target) this.switchTab(target);
        });
      });

    const btnPrev = document.getElementById("btn-tx-prev");
    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        if (this.currentTxPage > 1) {
          this.currentTxPage--;
          this.filterAndRenderTransactions();
        }
      });
    }

    const btnNext = document.getElementById("btn-tx-next");
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        this.currentTxPage++;
        this.filterAndRenderTransactions();
      });
    }

    const txModal = document.getElementById("transaction-modal");
    const openTx = () => {
      document.getElementById("tx-id").value = "";
      document.getElementById("tx-form").reset();
      document.getElementById("tx-custom-category").style.display = "none";
      document.getElementById("modal-title").innerText = "Tambah Transaksi";
      
      const nowStr = new Date().toISOString().substring(0, 10);
      document.getElementById("tx-date").value = nowStr;
      
      txModal.classList.add("active");
    };

    const openTxBtn = document.getElementById("open-transaction-modal");
    if (openTxBtn) openTxBtn.addEventListener("click", openTx);

    const fabBtn = document.getElementById("mobile-fab-add");
    if (fabBtn) fabBtn.addEventListener("click", openTx);

    const closeTxBtn = document.getElementById("close-tx-modal");
    if (closeTxBtn)
      closeTxBtn.addEventListener("click", () =>
        txModal.classList.remove("active"),
      );
    const cancelTxBtn = document.getElementById("cancel-tx-modal");
    if (cancelTxBtn)
      cancelTxBtn.addEventListener("click", () =>
        txModal.classList.remove("active"),
      );

    const selectCat = document.getElementById("tx-category");
    if (selectCat) {
      selectCat.addEventListener("change", (e) => {
        const customInput = document.getElementById("tx-custom-category");
        if (e.target.value === "ADD_CUSTOM") {
          customInput.style.display = "block";
          customInput.focus();
        } else {
          customInput.style.display = "none";
        }
      });
    }

    const txForm = document.getElementById("tx-form");
    if (txForm)
      txForm.addEventListener("submit", (e) => this.handleSaveTransaction(e));
    const btnDelAll = document.getElementById("btn-delete-all-tx");
    if (btnDelAll)
      btnDelAll.addEventListener("click", () => this.deleteAllTransactions());

    const btnDelAllBudgets = document.getElementById("btn-delete-all-budgets");
    if (btnDelAllBudgets)
      btnDelAllBudgets.addEventListener("click", () => this.deleteAllBudgets());

    const btnDelAllGoals = document.getElementById("btn-delete-all-goals");
    if (btnDelAllGoals)
      btnDelAllGoals.addEventListener("click", () => this.deleteAllGoals());

    const svgModal = document.getElementById("savings-deposit-modal");
    const openSvgBtn = document.getElementById("open-savings-modal");
    if (openSvgBtn) {
      openSvgBtn.addEventListener("click", () => {
        this.populateGoalsDropdown();
        svgModal.classList.add("active");
      });
    }
    const closeSvgBtn = document.getElementById("close-savings-modal");
    if (closeSvgBtn)
      closeSvgBtn.addEventListener("click", () =>
        svgModal.classList.remove("active"),
      );
    const cancelSvgBtn = document.getElementById("cancel-savings-modal");
    if (cancelSvgBtn)
      cancelSvgBtn.addEventListener("click", () =>
        svgModal.classList.remove("active"),
      );

    const svgForm = document.getElementById("savings-deposit-form");
    if (svgForm)
      svgForm.addEventListener("submit", (e) => this.handleSaveDeposit(e));

    const bgModal = document.getElementById("budget-modal");
    const openBgBtn = document.getElementById("btn-add-budget");
    if (openBgBtn) {
      openBgBtn.addEventListener("click", () => {
        document.getElementById("budget-form").reset();
        bgModal.classList.add("active");
      });
    }
    const closeBgBtn = document.getElementById("close-budget-modal");
    if (closeBgBtn)
      closeBgBtn.addEventListener("click", () =>
        bgModal.classList.remove("active"),
      );
    const cancelBgBtn = document.getElementById("cancel-budget-modal");
    if (cancelBgBtn)
      cancelBgBtn.addEventListener("click", () =>
        bgModal.classList.remove("active"),
      );

    const bgForm = document.getElementById("budget-form");
    if (bgForm)
      bgForm.addEventListener("submit", (e) => this.handleSaveBudget(e));

    const glModal = document.getElementById("goal-modal");
    const openGlBtn = document.getElementById("btn-add-goal");
    if (openGlBtn) {
      openGlBtn.addEventListener("click", () => {
        document.getElementById("gl-id").value = "";
        document.getElementById("goal-form").reset();
        document.getElementById("goal-modal-title").innerText =
          "Tambah Target Tabungan";
        glModal.classList.add("active");
      });
    }
    const closeGlBtn = document.getElementById("close-goal-modal");
    if (closeGlBtn)
      closeGlBtn.addEventListener("click", () =>
        glModal.classList.remove("active"),
      );
    const cancelGlBtn = document.getElementById("cancel-goal-modal");
    if (cancelGlBtn)
      cancelGlBtn.addEventListener("click", () =>
        glModal.classList.remove("active"),
      );

    const glForm = document.getElementById("goal-form");
    if (glForm)
      glForm.addEventListener("submit", (e) => this.handleSaveGoal(e));

    const catModal = document.getElementById("category-modal");
    const openCatBtn = document.getElementById("btn-open-cat-modal");
    if (openCatBtn) {
      openCatBtn.addEventListener("click", () => {
        document.getElementById("cat-old-name").value = "";
        document.getElementById("cat-form").reset();
        document.getElementById("cat-modal-title").innerText =
          "Tambah Kategori";
        catModal.classList.add("active");
      });
    }
    const closeCatBtn = document.getElementById("close-cat-modal");
    if (closeCatBtn)
      closeCatBtn.addEventListener("click", () =>
        catModal.classList.remove("active"),
      );
    const cancelCatBtn = document.getElementById("cancel-cat-modal");
    if (cancelCatBtn)
      cancelCatBtn.addEventListener("click", () =>
        catModal.classList.remove("active"),
      );

    const catForm = document.getElementById("cat-form");
    if (catForm)
      catForm.addEventListener("submit", (e) => this.handleSaveCategoryForm(e));

    ["tx-search", "tx-filter-type", "tx-filter-category", "tx-sort"].forEach(
      (id) => {
        const elem = document.getElementById(id);
        if (elem)
          elem.addEventListener("input", () => {
            this.currentTxPage = 1;
            this.filterAndRenderTransactions();
          });
      },
    );

    const setUrlInput = document.getElementById("setting-api-url");
    if (setUrlInput) setUrlInput.value = Storage.getApiUrl();

    const btnSaveSet = document.getElementById("save-settings-btn");
    if (btnSaveSet) {
      btnSaveSet.addEventListener("click", () => {
        const url = document.getElementById("setting-api-url").value.trim();
        Storage.setApiUrl(url);
        UI.showToast("Konfigurasi berhasil disimpan!", "success");
        this.init();
      });
    }

    const btnResetSet = document.getElementById("reset-settings-btn");
    if (btnResetSet) {
      btnResetSet.addEventListener("click", () => {
        Storage.resetApiUrl();
        document.getElementById("setting-api-url").value = Storage.getApiUrl();
        UI.showToast("Direset ke URL Default", "info");
        this.init();
      });
    }
  }

  switchTab(target) {
    document
      .querySelectorAll(".view-section")
      .forEach((s) => s.classList.remove("active"));
    document
      .querySelectorAll(".nav-item, .mobile-nav-item")
      .forEach((n) => n.classList.remove("active"));

    const targetView = document.getElementById(`view-${target}`);
    if (targetView) targetView.classList.add("active");

    document
      .querySelectorAll(`[data-target="${target}"]`)
      .forEach((n) => n.classList.add("active"));
    this.renderCharts();
  }

  populateCategories() {
    const defaultCategories = this.getDefaultCategories();
    const allCategories = Array.from(
      new Set([...defaultCategories, ...this.customCategories]),
    );

    const txCat = document.getElementById("tx-category");
    if (txCat) {
      txCat.innerHTML =
        `<option value="ADD_CUSTOM" style="font-weight:bold; color:var(--primary);">+ Tambah Kategori Kustom...</option>` +
        allCategories.map((c) => `<option value="${c}">${c}</option>`).join("");
    }

    const bgCat = document.getElementById("bg-category");
    if (bgCat) {
      bgCat.innerHTML = allCategories
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("");
    }

    const filterCat = document.getElementById("tx-filter-category");
    if (filterCat) {
      filterCat.innerHTML =
        `<option value="all">Semua Kategori</option>` +
        allCategories.map((c) => `<option value="${c}">${c}</option>`).join("");
    }
  }

  populateGoalsDropdown() {
    const select = document.getElementById("svg-target-goal");
    if (!select) return;
    if (this.goals.length === 0) {
      select.innerHTML = `<option value="">Tabungan Umum (Tidak Ada Target)</option>`;
      return;
    }
    select.innerHTML =
      `<option value="">Tabungan Umum</option>` +
      this.goals
        .map(
          (g) =>
            `<option value="${g.id}">${g.goal} (Saat ini: ${UI.formatCurrency(g.current)})</option>`,
        )
        .join("");
  }

  renderCategoryTable() {
    const tbody = document.querySelector("#categories-manage-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const defaultCategories = this.getDefaultCategories();
    const allCategories = Array.from(
      new Set([...defaultCategories, ...this.customCategories]),
    );

    allCategories.forEach((catName) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${catName}">
                    <strong>${catName}</strong>
                </td>
                <td><span class="btn-sm btn-outline" style="font-size:10px; padding:2px 6px;">Kategori</span></td>
                <td class="text-center">
                    <div style="display:flex; gap:6px; justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="window.editCategory('${catName}')" title="Edit">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.deleteCategory('${catName}')" title="Hapus" style="color:var(--expense); border-color:var(--expense);">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
      tbody.appendChild(tr);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  editCategory(name) {
    document.getElementById("cat-old-name").value = name;
    document.getElementById("cat-name").value = name;
    document.getElementById("cat-modal-title").innerText = "Edit Kategori";
    document.getElementById("category-modal").classList.add("active");
  }

  async deleteCategory(name) {
    if (!confirm(`Hapus kategori "${name}" dari sistem dan Spreadsheet?`))
      return;

    this.customCategories = this.customCategories.filter(
      (c) => c.toLowerCase() !== name.toLowerCase(),
    );
    localStorage.setItem(
      "finora_custom_categories",
      JSON.stringify(this.customCategories),
    );

    this.populateCategories();
    this.renderCategoryTable();

    UI.showToast("Menghapus kategori dari Spreadsheet...", "info");
    await API.deleteCategory(name);
    UI.showToast("Kategori berhasil dihapus dari Spreadsheet", "success");
  }

  async handleSaveCategoryForm(e) {
    e.preventDefault();
    const oldName = document.getElementById("cat-old-name").value.trim();
    const newName = document.getElementById("cat-name").value.trim();
    const type = document.getElementById("cat-type").value;

    if (!newName) return;

    if (oldName) {
      const idx = this.customCategories.findIndex(
        (c) => c.toLowerCase() === oldName.toLowerCase(),
      );
      if (idx >= 0) this.customCategories[idx] = newName;
      API.updateCategory(oldName, newName, type);
    } else {
      if (!this.customCategories.includes(newName)) {
        this.customCategories.push(newName);
        API.addCategory(newName, type);
      }
    }

    localStorage.setItem(
      "finora_custom_categories",
      JSON.stringify(this.customCategories),
    );
    document.getElementById("category-modal").classList.remove("active");
    document.getElementById("cat-form").reset();

    this.populateCategories();
    this.renderCategoryTable();
    UI.showToast("Kategori berhasil disimpan", "success");
  }

  async handleSaveTransaction(e) {
    e.preventDefault();
    const existingId = document.getElementById("tx-id").value;
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const amount = parseFloat(document.getElementById("tx-amount").value) || 0;
    let category = document.getElementById("tx-category").value;
    const account = document.getElementById("tx-account").value;
    
    let date = document.getElementById("tx-date").value;
    if (!date) date = new Date().toISOString().substring(0, 10);

    const description = document.getElementById("tx-description").value.trim();

    if (category === "ADD_CUSTOM") {
      const customVal = document
        .getElementById("tx-custom-category")
        .value.trim();
      if (!customVal) {
        UI.showToast("Silakan isi nama kategori baru.", "warning");
        return;
      }
      category = customVal;
      if (!this.customCategories.includes(category)) {
        this.customCategories.push(category);
        localStorage.setItem(
          "finora_custom_categories",
          JSON.stringify(this.customCategories),
        );
        this.populateCategories();
        API.addCategory(category, type);
      }
    }

    if (!description || amount <= 0) {
      UI.showToast("Nominal harus > 0 & Deskripsi harus diisi.", "warning");
      return;
    }

    const isUpdate = Boolean(existingId);
    const payload = {
      id: existingId || "TRX_" + Date.now(),
      type,
      amount,
      category,
      account,
      date,
      description,
      isUpdate,
    };

    if (isUpdate) {
      const idx = this.transactions.findIndex(
        (t) => String(t.id).trim() === String(existingId).trim(),
      );
      if (idx >= 0) this.transactions[idx] = payload;
    } else {
      this.transactions.unshift(payload);
    }

    Storage.saveTransactions(this.transactions);
    document.getElementById("transaction-modal").classList.remove("active");
    document.getElementById("tx-form").reset();

    this.renderAll();
    UI.showToast("Menyimpan Transaksi...", "info");

    const res = await API.saveTransaction(payload);
    if (res && res.status === "success")
      UI.showToast("Transaksi berhasil disimpan ke Spreadsheet", "success");
  }

  async handleSaveDeposit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("svg-amount").value) || 0;
    const goalId = document.getElementById("svg-target-goal").value;
    const account = document.getElementById("svg-account").value;

    if (amount <= 0) {
      UI.showToast("Nominal setoran harus lebih dari 0.", "warning");
      return;
    }

    let desc = "Setoran Tabungan";
    if (goalId) {
      const goalObj = this.goals.find(
        (g) => String(g.id).trim() === String(goalId).trim(),
      );
      if (goalObj) {
        goalObj.current = (parseFloat(goalObj.current) || 0) + amount;
        desc = `Tabungan untuk Tujuan: ${goalObj.goal}`;
        await API.saveGoal(goalObj);
      }
    }

    const txPayload = {
      id: "TRX_" + Date.now(),
      type: "Transfer",
      amount: amount,
      category: "Tujuan",
      account: account,
      date: new Date().toISOString().substring(0, 10),
      description: desc,
      isUpdate: false,
    };

    this.transactions.unshift(txPayload);
    Storage.saveTransactions(this.transactions);
    Storage.saveGoals(this.goals);

    document.getElementById("savings-deposit-modal").classList.remove("active");
    document.getElementById("savings-deposit-form").reset();

    this.renderAll();
    UI.showToast("Setoran Tabungan berhasil disimpan!", "success");
    await API.saveTransaction(txPayload);
  }

  editTransaction(id) {
    const item = this.transactions.find(
      (t) => String(t.id).trim() === String(id).trim(),
    );
    if (!item) return;

    document.getElementById("tx-id").value = item.id;
    document.getElementById("modal-title").innerText = "Edit Transaksi";
    document.getElementById("tx-amount").value = item.amount;
    document.getElementById("tx-category").value = item.category;
    document.getElementById("tx-account").value = item.account;
    document.getElementById("tx-date").value = (item.date || '').split('T')[0].split(' ')[0];
    document.getElementById("tx-description").value = item.description;

    const radType = document.querySelector(
      `input[name="tx-type"][value="${item.type}"]`,
    );
    if (radType) radType.checked = true;

    document.getElementById("transaction-modal").classList.add("active");
  }

  async deleteTransaction(id) {
    if (!confirm("Hapus transaksi ini dari web dan spreadsheet?")) return;

    this.transactions = this.transactions.filter(
      (t) => String(t.id).trim() !== String(id).trim(),
    );
    Storage.saveTransactions(this.transactions);
    this.renderAll();

    UI.showToast("Menghapus dari Spreadsheet...", "info");
    const res = await API.deleteTransaction(id);
    if (res && res.status === "success") {
      UI.showToast("Transaksi berhasil dihapus dari Spreadsheet", "success");
    }
  }

  async deleteAllTransactions() {
    if (this.transactions.length === 0) {
      UI.showToast("Tidak ada transaksi untuk dihapus.", "info");
      return;
    }

    const confirm1 = confirm(
      "PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA TRANSAKSI?",
    );
    if (!confirm1) return;

    const confirm2 = prompt("Ketik HAPUS untuk mengonfirmasi tindakan ini:");
    if (confirm2 !== "HAPUS" && confirm2 !== "hapus") {
      UI.showToast("Penghapusan dibatalkan.", "info");
      return;
    }

    this.transactions = [];
    Storage.saveTransactions([]);
    this.renderAll();

    UI.showToast("Menghapus semua transaksi dari Spreadsheet...", "info");
    const res = await API.deleteAllTransactions();
    if (res && res.status === "success") {
      UI.showToast(
        "Semua transaksi berhasil dihapus dari Spreadsheet",
        "success",
      );
    }
  }

  async deleteAllBudgets() {
    if (this.budgets.length === 0) {
      UI.showToast("Tidak ada anggaran untuk dihapus.", "info");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin MENGHAPUS SEMUA ANGGARAN?")) return;

    this.budgets = [];
    Storage.saveBudgets([]);
    this.renderAll();

    UI.showToast("Semua anggaran berhasil dihapus.", "success");
  }

  async deleteAllGoals() {
    if (this.goals.length === 0) {
      UI.showToast("Tidak ada target tujuan untuk dihapus.", "info");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin MENGHAPUS SEMUA TARGET TUJUAN TABUNGAN?")) return;

    this.goals = [];
    Storage.saveGoals([]);
    this.renderAll();

    UI.showToast("Semua target tujuan berhasil dihapus.", "success");
  }

  editBudget(category, amount) {
    document.getElementById("bg-category").value = category;
    document.getElementById("bg-amount").value = amount;
    document.getElementById("budget-modal").classList.add("active");
  }

  async deleteBudget(id, category, month) {
    if (!confirm(`Hapus anggaran untuk ${category}?`)) return;

    this.budgets = this.budgets.filter((b) => {
      if (id && b.id) return String(b.id).trim() !== String(id).trim();
      return (
        String(b.category).toLowerCase() !== String(category).toLowerCase()
      );
    });
    Storage.saveBudgets(this.budgets);
    this.renderAll();

    UI.showToast("Menghapus anggaran dari Spreadsheet...", "info");
    const res = await API.deleteBudget(id, category, month);
    if (res && res.status === "success") {
      UI.showToast("Anggaran berhasil dihapus dari Spreadsheet", "success");
    }
  }

  async handleSaveBudget(e) {
    e.preventDefault();
    const category = document.getElementById("bg-category").value;
    const budget = parseFloat(document.getElementById("bg-amount").value) || 0;
    const month = new Date().toISOString().substring(0, 7);

    let used = 0;
    this.transactions
      .filter(
        (t) =>
          t.type === "Expense" &&
          String(t.category).toLowerCase() === String(category).toLowerCase() &&
          parseFloat(t.amount) > 0,
      )
      .forEach((t) => {
        used += parseFloat(t.amount) || 0;
      });

    const existing = this.budgets.find(
      (b) =>
        String(b.category).toLowerCase() === String(category).toLowerCase() &&
        (b.month === month || !b.month),
    );
    const budgetId = existing ? existing.id : "BDG_" + Date.now();

    const payload = { id: budgetId, category, budget, used, month };

    if (existing) {
      existing.budget = budget;
      existing.used = used;
    } else {
      this.budgets.push(payload);
    }

    Storage.saveBudgets(this.budgets);
    document.getElementById("budget-modal").classList.remove("active");
    document.getElementById("budget-form").reset();

    this.renderAll();
    UI.showToast("Menyimpan anggaran...", "info");
    await API.saveBudget(payload);
    UI.showToast("Anggaran berhasil disimpan ke Spreadsheet", "success");
  }

  editGoal(id) {
    const item = this.goals.find(
      (g) => String(g.id).trim() === String(id).trim(),
    );
    if (!item) return;

    document.getElementById("gl-id").value = item.id;
    document.getElementById("goal-modal-title").innerText =
      "Edit Target Tabungan";
    document.getElementById("gl-name").value = item.goal;
    document.getElementById("gl-target").value = item.target;
    document.getElementById("gl-current").value = item.current;

    document.getElementById("goal-modal").classList.add("active");
  }

  async deleteGoal(id) {
    if (!confirm("Hapus Target Tabungan ini dari web dan spreadsheet?")) return;

    this.goals = this.goals.filter(
      (g) => String(g.id).trim() !== String(id).trim(),
    );
    Storage.saveGoals(this.goals);
    this.renderAll();

    UI.showToast("Menghapus Target dari Spreadsheet...", "info");
    const res = await API.deleteGoal(id);
    if (res && res.status === "success") {
      UI.showToast("Target berhasil dihapus dari Spreadsheet", "success");
    }
  }

  async handleSaveGoal(e) {
    e.preventDefault();
    const existingId = document.getElementById("gl-id").value;
    const goal = document.getElementById("gl-name").value;
    const target = parseFloat(document.getElementById("gl-target").value) || 0;
    const current =
      parseFloat(document.getElementById("gl-current").value) || 0;

    const payload = {
      id: existingId || "GOL_" + Date.now(),
      goal,
      target,
      current,
      deadline: "",
    };

    if (existingId) {
      const idx = this.goals.findIndex(
        (g) => String(g.id).trim() === String(existingId).trim(),
      );
      if (idx >= 0) this.goals[idx] = payload;
    } else {
      this.goals.push(payload);
    }

    Storage.saveGoals(this.goals);

    document.getElementById("goal-modal").classList.remove("active");
    document.getElementById("goal-form").reset();

    this.renderAll();
    UI.showToast("Menyimpan Target...", "info");
    await API.saveGoal(payload);
    UI.showToast("Target Tabungan berhasil disimpan ke Spreadsheet", "success");
  }

  filterAndRenderTransactions() {
    const search = document.getElementById("tx-search").value.toLowerCase();
    const type = document.getElementById("tx-filter-type").value;
    const category = document.getElementById("tx-filter-category").value;
    const sort = document.getElementById("tx-sort").value;

    let filtered = this.transactions.filter((t) => {
      const matchSearch =
        (t.description || "").toLowerCase().includes(search) ||
        (t.category || "").toLowerCase().includes(search);
      const matchType = type === "all" || t.type === type;
      const matchCategory = category === "all" || t.category === category;
      return matchSearch && matchType && matchCategory;
    });

    filtered.sort((a, b) => {
      if (sort === "newest") return new Date(b.date) - new Date(a.date);
      if (sort === "oldest") return new Date(a.date) - new Date(b.date);
      if (sort === "highest") return b.amount - a.amount;
      if (sort === "lowest") return a.amount - b.amount;
    });

    UI.renderFullTransactions(filtered, this.currentTxPage, this.txPerPage);
  }

  renderAll() {
    UI.renderDashboardCards(this.transactions, this.goals);

    const picker = document.getElementById("recap-month-picker");
    const selMonth = picker ? picker.value : null;
    UI.renderMonthlyRecap(this.transactions, this.budgets, selMonth);

    UI.renderRecentTransactions(this.transactions);
    this.filterAndRenderTransactions();
    UI.renderBudgets(this.budgets, this.transactions);
    UI.renderGoals(this.goals);
    UI.renderStatistics(this.transactions);
    this.renderCategoryTable();

    this.renderCharts();
  }

  renderCharts() {
    const dates = [];
    const incomeMap = {};
    const expenseMap = {};
    const catExpenseMap = {};

    const todayStr = new Date().toISOString().substring(0, 10);
    let todayIncome = 0;
    let todayExpense = 0;

    this.transactions.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      const txDateOnly = (t.date || '').split('T')[0].split(' ')[0];

      if (txDateOnly && !dates.includes(txDateOnly)) dates.push(txDateOnly);

      if (t.type === "Income") {
        incomeMap[txDateOnly] = (incomeMap[txDateOnly] || 0) + amt;
        if (txDateOnly === todayStr) todayIncome += amt;
      } else if (t.type === "Expense") {
        expenseMap[txDateOnly] = (expenseMap[txDateOnly] || 0) + amt;
        catExpenseMap[t.category] = (catExpenseMap[t.category] || 0) + amt;
        if (txDateOnly === todayStr) todayExpense += amt;
      }
    });

    dates.sort();
    const labels = dates.length > 0 ? dates : ["Tidak Ada Data"];
    const incomeData =
      dates.length > 0 ? dates.map((d) => incomeMap[d] || 0) : [0];
    const expenseData =
      dates.length > 0 ? dates.map((d) => expenseMap[d] || 0) : [0];

    const ctx1 = document.getElementById("cashFlowChart").getContext("2d");
    if (this.cashFlowChart) this.cashFlowChart.destroy();

    this.cashFlowChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Pemasukan",
            data: incomeData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.1)",
            fill: true,
            tension: 0.3,
          },
          {
            label: "Pengeluaran",
            data: expenseData,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    const catLabels = Object.keys(catExpenseMap);
    const catData = Object.values(catExpenseMap);

    const ctx2 = document.getElementById("categoryChart").getContext("2d");
    if (this.categoryChart) this.categoryChart.destroy();

    this.categoryChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: catLabels.length > 0 ? catLabels : ["Tidak Ada Data"],
        datasets: [
          {
            data: catData.length > 0 ? catData : [0],
            backgroundColor: [
              "#4f46e5",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
              "#14b8a6",
            ],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    // CHART STATISTIK PADA TAB STATISTIK
    const ctx3 = document.getElementById("statBarChart").getContext("2d");
    if (this.statBarChart) this.statBarChart.destroy();

    this.statBarChart = new Chart(ctx3, {
      type: "bar",
      data: {
        labels: [todayStr],
        datasets: [
          { label: "Pemasukan Hari Ini", data: [todayIncome], backgroundColor: "#10b981" },
          { label: "Pengeluaran Hari Ini", data: [todayExpense], backgroundColor: "#ef4444" },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    // CHART RINGKASAN STATISTIK KHUSUS MOBILE
    const mobileCanvas = document.getElementById("mobileStatBarChart");
    if (mobileCanvas) {
      const ctxMobile = mobileCanvas.getContext("2d");
      if (this.mobileStatBarChart) this.mobileStatBarChart.destroy();

      this.mobileStatBarChart = new Chart(ctxMobile, {
        type: "bar",
        data: {
          labels: [todayStr],
          datasets: [
            { label: "Pemasukan Hari Ini", data: [todayIncome], backgroundColor: "#10b981" },
            { label: "Pengeluaran Hari Ini", data: [todayExpense], backgroundColor: "#ef4444" },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }
  }
}

const app = new App();
"use strict";

Module.register("MMM-SheetsMealPlan", {
  defaults: {
    title: "Veckans mat",
    spreadsheetId: "",
    weekSheetPrefix: "v",
    updateInterval: 60 * 60 * 1000,
    highlightToday: true,
    fade: true,
    showWeekInfo: true,
    dayNames: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
  },

  getStyles() {
    return ["MMM-SheetsMealPlan.css"];
  },

  getHeader() {
    if (this.config.showWeekInfo && this.weekNum) {
      return `${this.config.title} v${this.weekNum} — ${this.weekRange}`;
    }
    return this.config.title;
  },

  start() {
    this.meals = null;
    this.weekNum = null;
    this.weekRange = null;
    this.loaded = false;
    this.error = null;

    if (!this.config.spreadsheetId) {
      this.error = "Configure spreadsheetId in config.js";
      this.updateDom();
      return;
    }

    this.scheduleFetch();
  },

  scheduleFetch() {
    this.fetchMeals();
    setInterval(() => this.fetchMeals(), this.config.updateInterval);
  },

  fetchMeals() {
    this.sendSocketNotification("FETCH_MEALS", {
      spreadsheetId: this.config.spreadsheetId,
      weekSheetPrefix: this.config.weekSheetPrefix,
    });
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "MEALS_DATA") {
      this.error = null;
      this.loaded = true;
      this.meals = payload.days;
      this.weekNum = payload.weekNum;
      this.weekRange = this.formatWeekRange(payload.weekStart, payload.weekEnd);
      this.updateDom(800);
    } else if (notification === "MEALS_ERROR") {
      this.error = payload.error;
      this.loaded = true;
      this.updateDom(800);
    }
  },

  formatWeekRange(startISO, endISO) {
    const fmt = (iso) => {
      const d = new Date(iso);
      return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
    };
    return `${fmt(startISO)} - ${fmt(endISO)}`;
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-SheetsMealPlan";

    if (this.error) {
      const err = document.createElement("div");
      err.className = "small dimmed";
      err.textContent = this.error;
      wrapper.appendChild(err);
      return wrapper;
    }

    if (!this.loaded) {
      const loading = document.createElement("div");
      loading.className = "small dimmed";
      loading.textContent = "Hämtar matsedel…";
      wrapper.appendChild(loading);
      return wrapper;
    }

    if (!this.meals || this.meals.length === 0) {
      const empty = document.createElement("div");
      empty.className = "small dimmed";
      empty.textContent = "Ingen matsedel tillgänglig.";
      wrapper.appendChild(empty);
      return wrapper;
    }

    // 0=Mon … 6=Sun
    const todayIdx = (new Date().getDay() + 6) % 7;

    const table = document.createElement("table");
    table.className = "small";

    this.meals.forEach((row, idx) => {
      const tr = document.createElement("tr");
      const isToday = idx === todayIdx;
      const isPast = idx < todayIdx;

      if (isToday && this.config.highlightToday) {
        tr.className = "today";
      } else if (isPast && this.config.fade) {
        tr.className = "past";
      }

      const dayCell = document.createElement("td");
      dayCell.className = "day";
      dayCell.textContent = row.day;
      tr.appendChild(dayCell);

      const mealCell = document.createElement("td");
      mealCell.className = "meal";
      mealCell.textContent = row.meal;
      tr.appendChild(mealCell);

      table.appendChild(tr);
    });

    wrapper.appendChild(table);
    return wrapper;
  },
});

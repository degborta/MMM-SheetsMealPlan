"use strict";

const NodeHelper = require("node_helper");
const https = require("https");
const http = require("http");

module.exports = NodeHelper.create({
  start() {
    console.log(`[${this.name}] Node helper started`);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "FETCH_MEALS") {
      this.fetchMeals(payload).catch((err) => {
        console.error(`[${this.name}] Unhandled error:`, err);
      });
    }
  },

  async fetchMeals(payload) {
    const { spreadsheetId, weekSheetPrefix } = payload;
    const now = new Date();
    const { week: weekNum, year } = this.getISOWeek(now);
    const sheetName = `${weekSheetPrefix}${weekNum}`;

    const url =
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}` +
      `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&range=A:B`;

    try {
      const csv = await this.fetchUrl(url);
      const rows = this.parseCSV(csv);

      if (rows.length === 0) {
        this.sendSocketNotification("MEALS_ERROR", {
          error: `Hittade ingen data i blad "${sheetName}"`,
        });
        return;
      }

      const { start, end } = this.getWeekDates(weekNum, year);
      this.sendSocketNotification("MEALS_DATA", {
        days: rows,
        weekNum,
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
      });
    } catch (err) {
      console.error(`[${this.name}] Fetch error:`, err.message);
      this.sendSocketNotification("MEALS_ERROR", { error: err.message });
    }
  },

  getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return {
      week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
      year: d.getUTCFullYear(),
    };
  },

  getWeekDates(weekNum, year) {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (weekNum - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return { start: monday, end: sunday };
  },

  fetchUrl(url, redirectCount = 0) {
    if (redirectCount > 5) return Promise.reject(new Error("Too many redirects"));

    return new Promise((resolve, reject) => {
      const lib = url.startsWith("https") ? https : http;
      const req = lib.get(
        url,
        { headers: { "User-Agent": "MagicMirror/MMM-SheetsMealPlan" } },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            resolve(this.fetchUrl(res.headers.location, redirectCount + 1));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} from Google Sheets`));
            return;
          }
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
          res.on("error", reject);
        }
      );
      req.on("error", reject);
    });
  },

  parseCSV(csv) {
    const rows = [];
    for (const line of csv.trim().split("\n")) {
      const cols = this.parseCSVLine(line);
      const day = cols[0] ? cols[0].trim() : "";
      const meal = cols[1] ? cols[1].trim() : "";
      if (day && meal) {
        rows.push({ day, meal });
      }
    }
    return rows;
  },

  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (line[i] === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += line[i];
      }
    }

    result.push(current);
    return result;
  },
});

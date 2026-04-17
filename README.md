# MMM-SheetsMealPlan

A [MagicMirror²](https://magicmirror.builders/) module that displays your weekly meal plan from a Google Sheets spreadsheet.

## Preview

The module header updates automatically with the current week number and date range:

```
Veckans mat - v17 {13/4 - 19/4}
Mån  Pasta med köttfärssås
Tis  Kycklinggryta med ris
Ons  Tacos
Tor  Laxfilé med potatis
Fre  Pizza
```

Today's meal is highlighted, past days are faded.

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/yourusername/MMM-SheetsMealPlan
```

No additional dependencies — uses only Node.js built-in modules.

## Google Sheets Setup

1. Create a spreadsheet with one sheet per week, named `v1`, `v2`, … `v52`
2. In each week sheet:
   - **Column A** — day names (e.g. Mån, Tis, Ons, Tor, Fre)
   - **Column B** — the planned meal for that day
3. Share the spreadsheet publicly: **File → Share → Anyone with the link → Viewer**
4. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

Other sheets in the workbook (e.g. "Måltidsinspiration") are ignored — only the current week's sheet is ever fetched.

## Configuration

Add to your `config/config.js`:

```javascript
{
  module: "MMM-SheetsMealPlan",
  position: "top_right",
  config: {
    title: "Veckans mat",
    spreadsheetId: "YOUR_SPREADSHEET_ID",
    weekSheetPrefix: "v",
    updateInterval: 3600000,
    highlightToday: true,
    fade: true,
    showWeekInfo: true,
  }
}
```

## Config Options

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `"Veckans mat"` | Text shown at the start of the module header |
| `spreadsheetId` | `string` | `""` | **Required.** The ID from your Google Sheets URL |
| `weekSheetPrefix` | `string` | `"v"` | Prefix used in sheet names — `"v"` matches sheets named `v1`…`v52` |
| `updateInterval` | `int` | `3600000` | How often to refresh data, in milliseconds (default: 1 hour) |
| `highlightToday` | `bool` | `true` | Highlight the current day's row |
| `fade` | `bool` | `true` | Fade out rows for days that have already passed |
| `showWeekInfo` | `bool` | `true` | Append week number and date range to the header |

## Header Format

When `showWeekInfo` is `true` the header renders as:

```
{title} - v{weekNumber} {startDate - endDate}
```

For example: `Veckans mat - v17 {13/4 - 19/4}`

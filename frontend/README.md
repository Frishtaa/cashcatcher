# Ca$hCatcher

A clean, full-featured personal finance tracker built with React + TypeScript.

## Features
- 📊 Dashboard with balance, income, expenses overview
- 💸 Add/edit/delete transactions (income & expense)
- 🏷️ Custom categories with icons and colors
- 🎯 Monthly budgets with progress tracking
- 📈 Reports with charts (monthly trend, category breakdown, savings)
- 🔄 Recurring transactions support
- 📤 Export transactions to CSV
- 🌙 Dark/light mode
- 💱 Multiple currencies (IQD, USD, EUR, GBP)
- 💾 Data saved to browser (localStorage — no backend needed)

## How to Run

### Requirements
- Node.js (download from https://nodejs.org — get the LTS version)

### Steps

1. Open a terminal in this folder
2. Install dependencies:
   ```
   npm install
   ```
3. Start the app:
   ```
   npm run dev
   ```
4. Open your browser at: **http://localhost:5173**

That's it! Your data is automatically saved in your browser.

## Build for Production
```
npm run build
```
This creates a `dist/` folder you can host anywhere (Netlify, Vercel, GitHub Pages, etc.)

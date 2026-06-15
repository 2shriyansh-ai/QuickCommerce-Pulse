<div align="center">

<br/>

```
██████╗ ██╗   ██╗██╗      ███████╗███████╗
██╔══██╗██║   ██║██║      ██╔════╝██╔════╝
██████╔╝██║   ██║██║      ███████╗█████╗  
██╔═══╝ ██║   ██║██║      ╚════██║██╔══╝  
██║     ╚██████╔╝███████╗ ███████║███████╗
╚═╝      ╚═════╝ ╚══════╝ ╚══════╝╚══════╝
```

# QuickCommerce Pulse
### Real-Data Delivery Benchmark · Hyderabad Restaurant Intelligence

<br/>

![Python](https://img.shields.io/badge/Python-ML%20%26%20Statistics-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-Decision%20Dashboard-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Analytics-336791?style=flat-square&logo=postgresql&logoColor=white)
![Excel](https://img.shields.io/badge/Excel-Ops%20Report-217346?style=flat-square&logo=microsoft-excel&logoColor=white)

<br/>

</div>

---

## What It Does

A full-stack analytics product built on two real Kaggle datasets — not synthetic, not mocked. It predicts delivery times, validates operational hypotheses statistically, scores 1,075 Hyderabad restaurants by operational risk, and surfaces everything through a React dashboard and Excel workbook.

---

## Results at a Glance

| Metric | Value |
|---|---|
| Delivery records | 1,000 |
| Hyderabad restaurant listings | 1,075 |
| Best model | Linear Regression |
| Holdout R² | **0.826** |
| Mean Absolute Error | **5.9 min** |
| Priority restaurants flagged | 271 |
| Hyderabad areas normalized | 147 |

---

## Two Tracks, One Platform

**Track 1 — Delivery Intelligence**  
Three models (Linear Regression, Random Forest, Gradient Boosting) trained on distance, weather, traffic, prep time, and courier experience. Linear Regression wins cleanly. Rainy conditions add +6.64 min on average (Welch t-test, p < 0.05).

**Track 2 — Restaurant Attention Score**  
Every Hyderabad listing scores on:
```
45% listed delivery pressure  +  35% rating weakness  +  20% review uncertainty
```
Outputs: `Stable` · `Watch` · `Priority` — a transparent prioritization heuristic, not a black-box prediction.

---

## Architecture

```
Delivery CSV ──→ Clean & Impute ──→ ML Models ──→ ─────────────────┐
                                         │                           ▼
                                     Statistics              Dashboard JSON
                                                                     │
Swiggy CSV ───→ Hyderabad Filter ──→ Attention Score ──────────────→┤
                                                                     ▼
                                              React Dashboard · Excel Report
```

---

## Stack

```
Python          pandas · scikit-learn · scipy · openpyxl
SQL             PostgreSQL schema + analytical queries
JavaScript      React dashboard · Node ops workbook builder
Testing         unittest (data contracts) · ESLint · Vite build
```

---

## Quick Start

```bash
# 1. Drop datasets into data/raw/
#    Food_Delivery_Times.csv
#    swiggy.csv

# 2. Python pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/prepare_real_data.py
python scripts/run_analysis.py
node scripts/build_ops_workbook.mjs

# 3. Dashboard
cd dashboard && npm install && npm run dev
```

---

## Project Structure

```
quickcommerce-pulse/
├── data/           raw (git-ignored) + processed
├── scripts/        prepare · analyse · build workbook
├── analysis/       model, stats, area, attention outputs
├── sql/            schema + queries
├── dashboard/      React interface
├── excel/          generated workbook + previews
├── ai_insights/    optional Gemini executive summary
└── tests/          data contracts + model checks
```

---

<div align="center">

*Built with real data. Documented limitations. No synthetic shortcuts.*

</div>


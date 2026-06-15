
<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=32&pause=1000&color=F97316&center=true&vCenter=true&width=600&lines=QuickCommerce+Pulse+%F0%9F%9B%B5;Delivery+Intelligence+Platform" alt="Typing SVG" />

  <p align="center">
    <strong>Delivery-time prediction · Restaurant intelligence · Real Kaggle data</strong><br/>
    <sub>1,000 delivery records · 1,075 Hyderabad restaurants · R² 0.826 · MAE 5.9 min</sub>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
    <img src="https://img.shields.io/badge/Microsoft_Excel-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white" />
  </p>

  <p align="center">
    <a href="#-quick-start">Quick Start</a> ·
    <a href="#-results">Results</a> ·
    <a href="#%EF%B8%8F-architecture">Architecture</a> ·
    <a href="#-dashboard">Dashboard</a>
  </p>
</div>

---

## What is this?

**QuickCommerce Pulse** is a full-stack analytics product built entirely on real public data — no synthetic rows, no shortcuts. It combines ML-based delivery-time prediction with a transparent restaurant attention scoring system, surfaced through a React dashboard and an auto-generated Excel workbook.

> Built to demonstrate end-to-end data engineering: ingestion → cleaning → ML → statistical validation → SQL → visual reporting.

---

## 📊 Results

<table>
<tr>
<td>

**Delivery Prediction**

| Model | R² | MAE | RMSE |
|---|---|---|---|
| ✅ Linear Regression | **0.826** | **5.90** | **8.83** |
| Random Forest | 0.797 | 6.60 | 9.54 |
| Gradient Boosting | 0.793 | 6.51 | 9.63 |

</td>
<td>

**Statistical Findings**

| Factor | Effect |
|---|---|
| 🌧️ Rain vs Clear | +6.64 min (Welch t-test) |
| 🚦 Traffic levels | 11.92 min range (ANOVA) |
| 🏍️ Courier experience | r = −0.089 (Pearson) |

All significant at p < 0.05.

</td>
</tr>
</table>

---

## 🗺️ Architecture

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Food_Delivery.csv  │     │       swiggy.csv          │
│   (1,000 records)   │     │   (8,680 → 1,075 HYD)    │
└────────┬────────────┘     └────────────┬─────────────┘
         │ clean + impute                │ filter + normalize
         ▼                               ▼
   ML Pipeline                   Attention Score
   (3 models)                    45% delivery pressure
   Statistics                  + 35% rating weakness
   SQL queries                 + 20% review uncertainty
         │                               │
         └──────────────┬────────────────┘
                        ▼
           ┌────────────────────────┐
           │   dashboard/data.json  │
           └─────────┬──────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
  React Dashboard           Excel Workbook
  (4 modules)               (5 sheets)
```

---

## 🚀 Quick Start

```bash
# 1. Place datasets in data/raw/
#    → Food_Delivery_Times.csv
#    → swiggy.csv

# 2. Python pipeline
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/prepare_real_data.py
python scripts/run_analysis.py
node scripts/build_ops_workbook.mjs

# 3. Launch dashboard
cd dashboard && npm install && npm run dev

# 4. Run tests
python -m unittest discover tests -v
```

---

## 🖥️ Dashboard

Four modules — all wired to real analysis output, no mocked data.

| Module | What it shows |
|---|---|
| **Data Command Center** | KPIs, area comparison, weather & traffic effects |
| **Restaurant Attention** | Ranked Hyderabad listings with score breakdown |
| **Model Lab** | R², MAE, RMSE comparison + feature importance |
| **Delivery Simulator** | Estimate delivery time from live inputs |

---

## 📁 Structure

```
quickcommerce-pulse/
├── data/           raw/ (git-ignored) · processed/
├── scripts/        prepare · analyse · build workbook
├── analysis/       model, stats, area, attention outputs
├── sql/            schema + analytical queries
├── dashboard/      React (Vite)
├── excel/          generated workbook + previews
├── ai_insights/    optional Gemini executive summary
└── tests/          data-contract + model checks
```

---

## ⚠️ Known Limitations

- Delivery data has no city/date field — not Hyderabad-specific
- The two datasets share no join key and are analyzed independently
- Restaurant attention score is a prioritization heuristic, not churn probability
- Delivery Simulator uses observed category effects, not the trained model directly

These limitations are intentionally visible in code, dashboard, and docs.

---



# QuickCommerce Pulse — Hyderabad Delivery Intelligence Platform
**Portfolio Flagship Project Brief**

---

## 1. Elevator Pitch
An end-to-end data intelligence platform that analyzes food/quick-commerce delivery operations across Hyderabad localities, predicts delivery delays and demand surges, scores restaurants on "churn risk," and generates AI-written executive insights — covering the full analytics stack: SQL → Excel → Power BI/Tableau → Statistics → Python (ML + LLM layer).

**The hook for recruiters:** "I built a system that doesn't just show *what* happened in delivery ops — it predicts *what's about to happen* and explains *why* in plain English, automatically."

---

## 2. Datasets to Use

### Primary dataset — Delivery Time Prediction (Indian cities)
- Source: Kaggle — search "Food Delivery Time Prediction" (Porter/Swiggy-style dataset, ~45,000 rows)
- Reference implementation: https://github.com/Vikranth3140/Food-Delivery-Time-Prediction
- Key columns: `Delivery_person_Age`, `Delivery_person_Ratings`, `Restaurant_latitude/longitude`, `Delivery_location_latitude/longitude`, `Order_Date`, `Time_Orderd`, `Time_Order_picked`, `Weather_conditions`, `Road_traffic_density`, `Vehicle_condition`, `Type_of_order`, `Type_of_vehicle`, `multiple_deliveries`, `Festival`, `City`, `Time_taken (min)`

### Secondary dataset — Restaurant data
- Source: Kaggle — "Swiggy Restaurants Dataset" (ashishjangra27/swiggy-restaurants-dataset)
- Columns: `Area`, `City`, `Restaurant`, `Price`, `Avg ratings`, `Total ratings`, `Food type`, `Delivery time`
- Note: Banjara Hills, Hyderabad already appears prominently in this dataset — good for your localization angle.

### Optional enrichment data (adds uniqueness)
- **Weather**: Open-Meteo API (free, no key needed) — pull historical Hyderabad weather to cross-reference with delay spikes
- **Festival/cricket calendar**: manually compile a small CSV of 2024-2025 Indian festival dates + IPL match dates in Hyderabad (for the surge-prediction angle)

---

## 3. Unique Differentiators (what makes this NOT a tutorial clone)
1. **Localized to real Hyderabad areas** (Gachibowli, Madhapur, Banjara Hills, Kukatpally, Jubilee Hills, HITEC City) — remap/relabel generic city data to these zones for geospatial analysis
2. **Restaurant "At-Risk" Score** — composite churn metric from declining ratings + falling order frequency + price sensitivity (not just a delay predictor)
3. **Festival/Event Demand Surge Model** — quantify how much delivery times spike during festivals/cricket matches
4. **AI Insights Layer** — Gemini API (you already used this in AI Trip Planner) reads aggregated metrics and writes a natural-language "Ops Summary" — bridges your data analyst + AI/full-stack skill sets in ONE project
5. **What-if simulator** (stretch goal) — small Streamlit/React input where changing "delivery partners +2 in Madhapur during rain" recalculates projected delay reduction

---

## 4. Pipeline Breakdown by Stage

### Stage 1 — SQL (PostgreSQL)
**Goal:** Build a relational schema and write analytical queries.

Suggested schema:
```sql
restaurants (restaurant_id, name, area, city, cuisine_type, avg_rating, total_ratings, price_range)
orders (order_id, restaurant_id, customer_area, order_date, time_ordered, time_picked, time_taken_min,
        weather_condition, traffic_density, vehicle_type, multiple_deliveries, is_festival, delivery_person_id)
delivery_partners (delivery_person_id, age, rating, vehicle_condition)
calendar_events (event_date, event_name, event_type)  -- festivals, IPL matches
```

Key queries to build:
- Avg delivery time by area, hour-of-day, weather condition
- Top 10 areas with highest delay variance
- Restaurant churn-risk candidates (rating trend declining over time windows)
- Festival vs non-festival delivery time comparison (window functions, CTEs)

### Stage 2 — Excel
**Goal:** Show business-reporting fluency before the technical layers.
- Pivot tables: delivery time by area x weather, restaurant performance scorecards
- A simple "Ops Manager" mock report (conditional formatting for at-risk restaurants/areas)
- Export a cleaned CSV for downstream BI/Python use

### Stage 3 — Power BI / Tableau
**Goal:** Interactive dashboard — the visual centerpiece.
Pages to build:
1. **Overview** — KPIs: avg delivery time, on-time %, total orders, top problem areas
2. **Geospatial Heatmap** — Hyderabad map with delay intensity by locality (use lat/long)
3. **Restaurant Risk Board** — sortable table/scorecard of at-risk restaurants
4. **Festival Impact** — before/during/after comparison charts
5. **AI Insights Panel** — text box/card displaying the Gemini-generated summary (refreshed via Python script output)

### Stage 4 — Statistics
**Goal:** Show rigor, not just visualization.
- Hypothesis test: does rain/weather significantly increase delivery time? (t-test / ANOVA)
- Correlation analysis: traffic density vs delivery time, distance vs delivery time
- Confidence intervals on average delay per area
- Regression analysis (significance of each feature — feeds into the ML model)

### Stage 5 — Python
**Goal:** ML model + AI layer.
- **Data prep**: haversine distance calc (restaurant → delivery location), feature engineering (hour, day-of-week, is_festival)
- **Model**: Random Forest / XGBoost / LightGBM regression for delivery time prediction (reference paper achieved R²=0.76 with LightGBM — beat or match this and report it)
- **At-Risk Score model**: simple weighted scoring or logistic regression on restaurant decline indicators
- **AI Insights script**: send aggregated stats (top delay zones, churn-risk restaurants, festival impact %) to Gemini API → returns a 3-4 sentence executive summary → save as text/JSON → feed into Power BI

---

## 5. Suggested Repo Structure
```
quickcommerce-pulse/
├── data/
│   ├── raw/
│   └── processed/
├── sql/
│   ├── schema.sql
│   └── analysis_queries.sql
├── excel/
│   └── ops_report.xlsx
├── notebooks/
│   ├── 01_eda_stats.ipynb
│   ├── 02_feature_engineering.ipynb
│   └── 03_model_training.ipynb
├── ai_insights/
│   └── generate_summary.py
├── dashboard/
│   └── quickcommerce_pulse.pbix
└── README.md
```

---

## 6. README / Resume Narrative (draft)
**Project title:** QuickCommerce Pulse — Hyderabad Delivery Intelligence Platform
**One-liner:** "Built an end-to-end analytics platform predicting delivery delays (R² ~0.7+) and restaurant churn risk across Hyderabad localities, with an LLM-generated executive insights layer — spanning SQL, Power BI, statistical testing, and ML."

---

## 7. Build Order (recommended sequence)
1. Download both datasets, explore in Excel/Pandas
2. Design and load SQL schema, write core queries
3. Run statistical tests in Python (foundation for the model)
4. Build and evaluate ML model (delay prediction + at-risk score)
5. Build Power BI dashboard using SQL outputs + model outputs
6. Build the AI insights script last (ties everything together)
7. Write README with screenshots, push to GitHub with meaningful commits

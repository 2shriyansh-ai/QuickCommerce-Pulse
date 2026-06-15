"""Run real-data delivery ML and Hyderabad restaurant intelligence."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "processed"
ANALYSIS = ROOT / "analysis"
MODELS = ROOT / "models"
DASHBOARD_DATA = ROOT / "dashboard" / "public" / "data"

NUMERIC_FEATURES = ["distance_km", "preparation_time_min", "courier_experience_yrs"]
CATEGORICAL_FEATURES = ["weather", "traffic_level", "time_of_day", "vehicle_type"]
TARGET = "delivery_time_min"


def records(frame, digits=3):
    output = frame.copy()
    numeric = output.select_dtypes(include="number").columns
    output[numeric] = output[numeric].round(digits)
    return output.replace({np.nan: None}).to_dict(orient="records")


def train_models(delivery):
    x = delivery[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = delivery[TARGET]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
    preprocess = ColumnTransformer([
        ("numeric", StandardScaler(), NUMERIC_FEATURES),
        ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
    ])
    candidates = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=250, max_depth=14, min_samples_leaf=2, random_state=42, n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=180, learning_rate=0.045, max_depth=2, loss="huber", random_state=42
        ),
    }
    rows, fitted = [], {}
    for name, estimator in candidates.items():
        pipeline = Pipeline([("preprocess", preprocess), ("model", estimator)])
        pipeline.fit(x_train, y_train)
        prediction = pipeline.predict(x_test)
        rows.append({
            "model": name,
            "r2": r2_score(y_test, prediction),
            "mae": mean_absolute_error(y_test, prediction),
            "rmse": mean_squared_error(y_test, prediction) ** 0.5,
        })
        fitted[name] = pipeline
    metrics = pd.DataFrame(rows).sort_values("r2", ascending=False)
    best_name = metrics.iloc[0]["model"]
    best_model = fitted[best_name]
    importance_result = permutation_importance(
        best_model, x_test, y_test, n_repeats=12, random_state=42, scoring="r2"
    )
    importance = pd.DataFrame({
        "feature": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "importance": importance_result.importances_mean,
    }).sort_values("importance", ascending=False)
    return best_name, best_model, metrics, importance


def test_hypotheses(delivery):
    rainy = delivery[delivery["weather"].eq("Rainy")][TARGET]
    clear = delivery[delivery["weather"].eq("Clear")][TARGET]
    rain_test = stats.ttest_ind(rainy, clear, equal_var=False)
    traffic_groups = [group[TARGET].values for _, group in delivery.groupby("traffic_level")]
    traffic_test = stats.f_oneway(*traffic_groups)
    experience = stats.pearsonr(delivery["courier_experience_yrs"], delivery[TARGET])
    return pd.DataFrame([
        {
            "test": "Rainy vs clear delivery time",
            "method": "Welch two-sample t-test",
            "statistic": rain_test.statistic,
            "p_value": rain_test.pvalue,
            "effect_min": rainy.mean() - clear.mean(),
            "conclusion": "Statistically significant" if rain_test.pvalue < 0.05 else "Not significant",
        },
        {
            "test": "Traffic-level delivery time",
            "method": "One-way ANOVA",
            "statistic": traffic_test.statistic,
            "p_value": traffic_test.pvalue,
            "effect_min": delivery.groupby("traffic_level")[TARGET].mean().max() - delivery.groupby("traffic_level")[TARGET].mean().min(),
            "conclusion": "Statistically significant" if traffic_test.pvalue < 0.05 else "Not significant",
        },
        {
            "test": "Courier experience relationship",
            "method": "Pearson correlation",
            "statistic": experience.statistic,
            "p_value": experience.pvalue,
            "effect_min": experience.statistic,
            "conclusion": "Statistically significant" if experience.pvalue < 0.05 else "Not significant",
        },
    ])


def empirical_effects(delivery):
    base = delivery[TARGET].mean()
    weather = delivery.groupby("weather")[TARGET].mean().sub(
        delivery.groupby("weather")[TARGET].mean().get("Clear", base)
    ).to_dict()
    traffic = delivery.groupby("traffic_level")[TARGET].mean().sub(
        delivery.groupby("traffic_level")[TARGET].mean().get("Low", base)
    ).to_dict()
    time = delivery.groupby("time_of_day")[TARGET].mean().sub(
        delivery.groupby("time_of_day")[TARGET].mean().get("Morning", base)
    ).to_dict()
    distance_slope = np.polyfit(delivery["distance_km"], delivery[TARGET], 1)[0]
    preparation_slope = np.polyfit(delivery["preparation_time_min"], delivery[TARGET], 1)[0]
    experience_slope = np.polyfit(delivery["courier_experience_yrs"], delivery[TARGET], 1)[0]
    return {
        "base_minutes": base,
        "mean_distance_km": delivery["distance_km"].mean(),
        "mean_preparation_min": delivery["preparation_time_min"].mean(),
        "mean_experience_yrs": delivery["courier_experience_yrs"].mean(),
        "distance_slope": distance_slope,
        "preparation_slope": preparation_slope,
        "experience_slope": experience_slope,
        "weather_effects": weather,
        "traffic_effects": traffic,
        "time_effects": time,
    }


def main():
    ANALYSIS.mkdir(exist_ok=True)
    MODELS.mkdir(exist_ok=True)
    DASHBOARD_DATA.mkdir(parents=True, exist_ok=True)

    delivery = pd.read_csv(DATA / "delivery_records.csv")
    restaurants = pd.read_csv(DATA / "hyderabad_restaurants.csv")
    best_name, model, metrics, importance = train_models(delivery)
    tests = test_hypotheses(delivery)

    area_metrics = restaurants.groupby("area").agg(
        restaurants=("restaurant_id", "count"),
        avg_delivery_time_min=("delivery_time_min", "mean"),
        avg_rating=("avg_rating", "mean"),
        median_price=("price", "median"),
        total_reviews=("total_ratings", "sum"),
        priority_restaurants=("attention_tier", lambda values: int((values == "Priority").sum())),
    ).reset_index()
    area_metrics = area_metrics[area_metrics["restaurants"] >= 5].sort_values(
        ["avg_delivery_time_min", "restaurants"], ascending=[False, False]
    )

    weather_metrics = delivery.groupby("weather").agg(
        records=("order_id", "count"),
        avg_delivery_time_min=(TARGET, "mean"),
        under_60_rate_pct=("under_60_min", lambda values: 100 * values.mean()),
    ).reset_index()
    traffic_metrics = delivery.groupby("traffic_level").agg(
        records=("order_id", "count"),
        avg_delivery_time_min=(TARGET, "mean"),
        under_60_rate_pct=("under_60_min", lambda values: 100 * values.mean()),
    ).reset_index()
    time_metrics = delivery.groupby("time_of_day").agg(
        records=("order_id", "count"),
        avg_delivery_time_min=(TARGET, "mean"),
    ).reset_index()

    attention = restaurants.sort_values("attention_score", ascending=False)
    joblib.dump(model, MODELS / "delivery_time_model.joblib")
    metrics.to_csv(ANALYSIS / "model_metrics.csv", index=False)
    importance.to_csv(ANALYSIS / "feature_importance.csv", index=False)
    tests.to_csv(ANALYSIS / "statistical_tests.csv", index=False)
    attention.to_csv(ANALYSIS / "restaurant_attention_scores.csv", index=False)
    area_metrics.to_csv(ANALYSIS / "area_performance.csv", index=False)

    top_area = area_metrics.iloc[0]
    top_restaurant = attention.iloc[0]
    summary = (
        f"The delivery benchmark contains {len(delivery):,} records and averages "
        f"{delivery[TARGET].mean():.1f} minutes. {best_name} achieved a holdout R2 of "
        f"{metrics.iloc[0]['r2']:.3f} with {metrics.iloc[0]['mae']:.1f}-minute MAE. "
        f"Among {len(restaurants):,} real Hyderabad restaurant listings, {top_area['area']} "
        f"has the highest average listed delivery time among areas with at least five restaurants. "
        f"{top_restaurant['name']} currently has the highest operational attention score, driven by "
        f"listed delivery time, rating, and review confidence."
    )
    (ROOT / "ai_insights" / "executive_summary.txt").write_text(summary, encoding="utf-8")

    payload = {
        "metadata": {
            "city": "Hyderabad",
            "data_type": "Real public Kaggle datasets",
            "delivery_records": len(delivery),
            "hyderabad_restaurants": len(restaurants),
            "best_model": best_name,
            "tracks_are_separate": True,
        },
        "kpis": {
            "delivery_records": len(delivery),
            "hyderabad_restaurants": len(restaurants),
            "avg_delivery_time_min": delivery[TARGET].mean(),
            "under_60_rate_pct": 100 * delivery["under_60_min"].mean(),
            "priority_restaurants": int((restaurants["attention_tier"] == "Priority").sum()),
        },
        "executive_summary": summary,
        "area_metrics": records(area_metrics.head(25)),
        "weather_metrics": records(weather_metrics),
        "traffic_metrics": records(traffic_metrics),
        "time_metrics": records(time_metrics),
        "restaurant_attention": records(attention.head(50)),
        "model_metrics": records(metrics, 4),
        "feature_importance": records(importance, 4),
        "statistical_tests": records(tests, 6),
        "simulator": empirical_effects(delivery),
        "limitations": [
            "Delivery records do not contain city, restaurant, date, or event identifiers.",
            "Restaurant listings and delivery records are not joined at row level.",
            "The operational attention score is a heuristic, not a churn prediction.",
        ],
    }
    (DASHBOARD_DATA / "pulse_data.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({
        "delivery_records": len(delivery),
        "hyderabad_restaurants": len(restaurants),
        "best_model": best_name,
        "r2": round(float(metrics.iloc[0]["r2"]), 4),
        "mae": round(float(metrics.iloc[0]["mae"]), 2),
        "priority_restaurants": int((restaurants["attention_tier"] == "Priority").sum()),
    }, indent=2))


if __name__ == "__main__":
    main()

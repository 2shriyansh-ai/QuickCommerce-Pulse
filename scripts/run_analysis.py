"""Run the statistical, machine-learning, and business-risk pipeline."""

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
MODELS = ROOT / "models"
ANALYSIS = ROOT / "analysis"
DASHBOARD_DATA = ROOT / "dashboard" / "public" / "data"

TARGET = "time_taken_min"
NUMERIC_FEATURES = [
    "order_hour", "distance_km", "multiple_deliveries", "is_event",
    "is_peak_hour", "prep_time_min",
]
CATEGORICAL_FEATURES = [
    "restaurant_area", "weather_condition", "traffic_density",
    "vehicle_type", "event_type", "day_of_week",
]


def round_records(frame, digits=2):
    result = frame.copy()
    numeric = result.select_dtypes(include="number").columns
    result[numeric] = result[numeric].round(digits)
    return result.replace({np.nan: None}).to_dict(orient="records")


def score_restaurant_risk(orders, restaurants):
    orders = orders.copy()
    orders["order_date"] = pd.to_datetime(orders["order_date"])
    recent = orders[orders["order_date"] >= "2025-10-01"]
    prior = orders[(orders["order_date"] >= "2025-07-01") & (orders["order_date"] < "2025-10-01")]

    recent_metrics = recent.groupby("restaurant_id").agg(
        recent_orders=("order_id", "count"),
        recent_rating=("customer_rating", "mean"),
        recent_delay=("delay_min", "mean"),
        recent_on_time=("is_on_time", "mean"),
    )
    prior_metrics = prior.groupby("restaurant_id").agg(
        prior_orders=("order_id", "count"),
        prior_rating=("customer_rating", "mean"),
    )
    risk = restaurants.merge(recent_metrics, on="restaurant_id").merge(prior_metrics, on="restaurant_id")
    risk["order_growth_pct"] = 100 * (risk["recent_orders"] - risk["prior_orders"]) / risk["prior_orders"].clip(lower=1)
    risk["rating_change"] = risk["recent_rating"] - risk["prior_rating"]

    volume_risk = (-risk["order_growth_pct"]).clip(lower=0, upper=40) / 40
    rating_risk = (-risk["rating_change"]).clip(lower=0, upper=0.8) / 0.8
    delay_risk = risk["recent_delay"].clip(lower=0, upper=18) / 18
    reliability_risk = (1 - risk["recent_on_time"]).clip(0, 1)
    risk["risk_score"] = (100 * (
        0.35 * volume_risk
        + 0.25 * rating_risk
        + 0.25 * delay_risk
        + 0.15 * reliability_risk
    ) * 1.8).clip(0, 100)
    risk["risk_tier"] = pd.cut(
        risk["risk_score"],
        bins=[-1, 30, 50, 101],
        labels=["Stable", "Watch", "Critical"],
    ).astype(str)
    columns = [
        "restaurant_id", "name", "area", "cuisine_type", "recent_orders",
        "order_growth_pct", "recent_rating", "rating_change", "recent_delay",
        "recent_on_time", "risk_score", "risk_tier",
    ]
    return risk[columns].sort_values("risk_score", ascending=False)


def train_models(orders):
    features = orders[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    target = orders[TARGET]
    x_train, x_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=42
    )

    preprocessor = ColumnTransformer([
        ("numeric", StandardScaler(), NUMERIC_FEATURES),
        ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
    ])
    candidates = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=160, max_depth=18, min_samples_leaf=2,
            n_jobs=-1, random_state=42,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=180, learning_rate=0.055, max_depth=3,
            loss="huber", random_state=42,
        ),
    }

    results = []
    fitted = {}
    for name, estimator in candidates.items():
        pipeline = Pipeline([("preprocess", preprocessor), ("model", estimator)])
        pipeline.fit(x_train, y_train)
        predictions = pipeline.predict(x_test)
        results.append({
            "model": name,
            "r2": r2_score(y_test, predictions),
            "mae": mean_absolute_error(y_test, predictions),
            "rmse": mean_squared_error(y_test, predictions) ** 0.5,
        })
        fitted[name] = pipeline

    model_results = pd.DataFrame(results).sort_values("r2", ascending=False)
    best_name = model_results.iloc[0]["model"]
    best_pipeline = fitted[best_name]

    sampled = x_test.sample(min(1800, len(x_test)), random_state=42)
    sampled_target = y_test.loc[sampled.index]
    importance = permutation_importance(
        best_pipeline, sampled, sampled_target,
        n_repeats=4, random_state=42, scoring="r2",
    )
    importance_frame = pd.DataFrame({
        "feature": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "importance": importance.importances_mean,
    }).sort_values("importance", ascending=False)

    return best_name, best_pipeline, model_results, importance_frame


def statistical_tests(orders):
    rain = orders[orders["weather_condition"].isin(["Light Rain", "Heavy Rain"])][TARGET]
    dry = orders[~orders["weather_condition"].isin(["Light Rain", "Heavy Rain"])][TARGET]
    rain_test = stats.ttest_ind(rain, dry, equal_var=False)

    traffic_groups = [
        group[TARGET].values
        for _, group in orders.groupby("traffic_density")
    ]
    traffic_anova = stats.f_oneway(*traffic_groups)

    event = orders[orders["is_event"] == 1][TARGET]
    normal = orders[orders["is_event"] == 0][TARGET]
    event_test = stats.ttest_ind(event, normal, equal_var=False)

    return [
        {
            "test": "Rain vs dry delivery time",
            "method": "Welch two-sample t-test",
            "statistic": rain_test.statistic,
            "p_value": rain_test.pvalue,
            "effect_min": rain.mean() - dry.mean(),
            "conclusion": "Statistically significant" if rain_test.pvalue < 0.05 else "Not significant",
        },
        {
            "test": "Traffic density delivery time",
            "method": "One-way ANOVA",
            "statistic": traffic_anova.statistic,
            "p_value": traffic_anova.pvalue,
            "effect_min": orders.groupby("traffic_density")[TARGET].mean().max() - orders.groupby("traffic_density")[TARGET].mean().min(),
            "conclusion": "Statistically significant" if traffic_anova.pvalue < 0.05 else "Not significant",
        },
        {
            "test": "Event vs normal delivery time",
            "method": "Welch two-sample t-test",
            "statistic": event_test.statistic,
            "p_value": event_test.pvalue,
            "effect_min": event.mean() - normal.mean(),
            "conclusion": "Statistically significant" if event_test.pvalue < 0.05 else "Not significant",
        },
    ]


def build_executive_summary(kpis, area_metrics, event_metrics, risk, model_results):
    worst_area = area_metrics.sort_values("avg_delivery_time_min", ascending=False).iloc[0]
    event_row = event_metrics[event_metrics["period_type"] != "Normal Day"].sort_values("avg_delivery_time_min", ascending=False).iloc[0]
    normal_row = event_metrics[event_metrics["period_type"] == "Normal Day"].iloc[0]
    event_lift = 100 * (event_row["avg_delivery_time_min"] / normal_row["avg_delivery_time_min"] - 1)
    critical_count = int((risk["risk_tier"] == "Critical").sum())
    best_model = model_results.iloc[0]

    return (
        f"Hyderabad operations averaged {kpis['avg_delivery_time_min']:.1f} minutes with "
        f"{kpis['on_time_rate_pct']:.1f}% of orders meeting the promise. "
        f"{worst_area['restaurant_area']} is the highest-pressure locality at "
        f"{worst_area['avg_delivery_time_min']:.1f} minutes, while {event_row['period_type']} periods "
        f"increase delivery time by {event_lift:.1f}% versus normal days. "
        f"{critical_count} restaurants currently require intervention, and the "
        f"{best_model['model']} model explains {best_model['r2']:.1%} of delivery-time variation."
    )


def main():
    MODELS.mkdir(exist_ok=True)
    ANALYSIS.mkdir(exist_ok=True)
    DASHBOARD_DATA.mkdir(parents=True, exist_ok=True)

    orders = pd.read_csv(DATA / "orders.csv", keep_default_na=False)
    restaurants = pd.read_csv(DATA / "restaurants.csv", keep_default_na=False)

    kpis = {
        "total_orders": int(len(orders)),
        "avg_delivery_time_min": float(orders[TARGET].mean()),
        "on_time_rate_pct": float(100 * orders["is_on_time"].mean()),
        "avg_delay_min": float(orders["delay_min"].mean()),
        "gross_order_value": float(orders["order_value"].sum()),
    }
    area_metrics = orders.groupby("restaurant_area").agg(
        orders=("order_id", "count"),
        avg_delivery_time_min=(TARGET, "mean"),
        p90_delivery_time_min=(TARGET, lambda values: values.quantile(0.9)),
        on_time_rate_pct=("is_on_time", lambda values: 100 * values.mean()),
        avg_delay_min=("delay_min", "mean"),
        avg_order_value=("order_value", "mean"),
        latitude=("restaurant_latitude", "mean"),
        longitude=("restaurant_longitude", "mean"),
    ).reset_index()

    event_metrics = orders.assign(
        period_type=orders["event_type"].replace({"None": "Normal Day"})
    ).groupby("period_type").agg(
        orders=("order_id", "count"),
        avg_delivery_time_min=(TARGET, "mean"),
        on_time_rate_pct=("is_on_time", lambda values: 100 * values.mean()),
        avg_delay_min=("delay_min", "mean"),
    ).reset_index()

    hourly_metrics = orders.groupby(["restaurant_area", "order_hour"]).agg(
        orders=("order_id", "count"),
        avg_delivery_time_min=(TARGET, "mean"),
        on_time_rate_pct=("is_on_time", lambda values: 100 * values.mean()),
    ).reset_index()

    weather_metrics = orders.groupby(["weather_condition", "traffic_density"]).agg(
        orders=("order_id", "count"),
        avg_delivery_time_min=(TARGET, "mean"),
        avg_delay_min=("delay_min", "mean"),
    ).reset_index()

    risk = score_restaurant_risk(orders, restaurants)
    best_name, best_model, model_results, importance = train_models(orders)
    tests = statistical_tests(orders)

    joblib.dump(best_model, MODELS / "delivery_time_model.joblib")
    risk.to_csv(ANALYSIS / "restaurant_risk_scores.csv", index=False)
    area_metrics.to_csv(ANALYSIS / "area_performance.csv", index=False)
    model_results.to_csv(ANALYSIS / "model_metrics.csv", index=False)
    importance.to_csv(ANALYSIS / "feature_importance.csv", index=False)
    pd.DataFrame(tests).to_csv(ANALYSIS / "statistical_tests.csv", index=False)

    summary = build_executive_summary(kpis, area_metrics, event_metrics, risk, model_results)
    (ROOT / "ai_insights" / "executive_summary.txt").write_text(summary, encoding="utf-8")

    dashboard_payload = {
        "metadata": {
            "city": "Hyderabad",
            "generated_from": "Reproducible synthetic operations data",
            "best_model": best_name,
        },
        "kpis": {key: round(value, 2) for key, value in kpis.items()},
        "executive_summary": summary,
        "area_metrics": round_records(area_metrics),
        "event_metrics": round_records(event_metrics),
        "hourly_metrics": round_records(hourly_metrics),
        "weather_metrics": round_records(weather_metrics),
        "restaurant_risk": round_records(risk.head(30)),
        "model_metrics": round_records(model_results, 4),
        "feature_importance": round_records(importance, 4),
        "statistical_tests": [
            {
                **item,
                "statistic": round(float(item["statistic"]), 4),
                "p_value": float(item["p_value"]),
                "effect_min": round(float(item["effect_min"]), 2),
            }
            for item in tests
        ],
        "simulator": {
            "base_minutes": round(float(orders[TARGET].mean()), 2),
            "rain_penalty": 5.8,
            "heavy_rain_penalty": 11.4,
            "peak_penalty": 5.2,
            "event_penalty": 6.9,
            "partner_reduction_per_person": 1.35,
            "minimum_minutes": 18,
        },
    }
    (DASHBOARD_DATA / "pulse_data.json").write_text(
        json.dumps(dashboard_payload, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({
        "best_model": best_name,
        "model_r2": round(float(model_results.iloc[0]["r2"]), 4),
        "model_mae": round(float(model_results.iloc[0]["mae"]), 2),
        "critical_restaurants": int((risk["risk_tier"] == "Critical").sum()),
        "summary": summary,
    }, indent=2))


if __name__ == "__main__":
    main()

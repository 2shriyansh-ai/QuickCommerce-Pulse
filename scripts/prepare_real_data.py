"""Clean the supplied delivery benchmark and Hyderabad Swiggy datasets."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"

AREA_ALIASES = {
    "Himayatnagar": "Himayath Nagar",
    "Toli Chowki": "Tolichowki",
    "Toli chowki": "Tolichowki",
    "Kothapet & Dilsukhnagar": "Kothapet / Dilsukhnagar",
    "Kothapet  & Dilsukhnagar": "Kothapet / Dilsukhnagar",
    "A.S. Rao Nagar & Sainikpuri": "AS Rao Nagar / Sainikpuri",
    "A S Rao Nagar": "AS Rao Nagar / Sainikpuri",
    "Nallakunta & Vidyanagar": "Nallakunta / Vidyanagar",
    "Santoshnagar & Saidabad": "Santoshnagar / Saidabad",
}


def percentile_rank(series):
    return series.rank(pct=True, method="average")


def main():
    PROCESSED.mkdir(parents=True, exist_ok=True)

    delivery = pd.read_csv(RAW / "Food_Delivery_Times.csv")
    delivery = delivery.rename(columns={
        "Order_ID": "order_id",
        "Distance_km": "distance_km",
        "Weather": "weather",
        "Traffic_Level": "traffic_level",
        "Time_of_Day": "time_of_day",
        "Vehicle_Type": "vehicle_type",
        "Preparation_Time_min": "preparation_time_min",
        "Courier_Experience_yrs": "courier_experience_yrs",
        "Delivery_Time_min": "delivery_time_min",
    })
    for column in ["weather", "traffic_level", "time_of_day"]:
        delivery[column] = delivery[column].fillna(delivery[column].mode().iat[0])
    delivery["courier_experience_yrs"] = delivery["courier_experience_yrs"].fillna(
        delivery["courier_experience_yrs"].median()
    )
    delivery["under_60_min"] = (delivery["delivery_time_min"] <= 60).astype(int)
    delivery.to_csv(PROCESSED / "delivery_records.csv", index=False)

    restaurants = pd.read_csv(RAW / "swiggy.csv")
    restaurants = restaurants[restaurants["City"].eq("Hyderabad")].copy()
    restaurants = restaurants.rename(columns={
        "ID": "restaurant_id",
        "Area": "area",
        "City": "city",
        "Restaurant": "name",
        "Price": "price",
        "Avg ratings": "avg_rating",
        "Total ratings": "total_ratings",
        "Food type": "food_type",
        "Address": "address",
        "Delivery time": "delivery_time_min",
    })
    restaurants["area"] = restaurants["area"].str.replace(r"\s+", " ", regex=True).str.strip().replace(AREA_ALIASES)
    restaurants["primary_cuisine"] = restaurants["food_type"].str.split(",").str[0].str.strip()

    restaurants["delivery_pressure"] = percentile_rank(restaurants["delivery_time_min"])
    restaurants["rating_weakness"] = 1 - percentile_rank(restaurants["avg_rating"])
    restaurants["review_uncertainty"] = 1 - percentile_rank(np.log1p(restaurants["total_ratings"]))
    restaurants["attention_score"] = 100 * (
        0.45 * restaurants["delivery_pressure"]
        + 0.35 * restaurants["rating_weakness"]
        + 0.20 * restaurants["review_uncertainty"]
    )
    restaurants["attention_tier"] = pd.cut(
        restaurants["attention_score"],
        bins=[-1, 45, 65, 101],
        labels=["Stable", "Watch", "Priority"],
    ).astype(str)
    restaurants.to_csv(PROCESSED / "hyderabad_restaurants.csv", index=False)

    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "data_type": "real public Kaggle datasets supplied by the project owner",
        "delivery_records": int(len(delivery)),
        "hyderabad_restaurants": int(len(restaurants)),
        "normalized_areas": int(restaurants["area"].nunique()),
        "delivery_missing_values_after_cleaning": int(delivery.isna().sum().sum()),
        "limitations": [
            "The delivery benchmark has no city, date, event, or restaurant identifier.",
            "The two datasets have no shared key and are analyzed as separate tracks.",
            "The delivery benchmark contains non-Hyderabad weather categories such as Snowy.",
            "The restaurant attention score is a cross-sectional heuristic, not churn prediction.",
        ],
    }
    (PROCESSED / "data_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()

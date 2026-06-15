"""Generate a reproducible Hyderabad quick-commerce operations dataset.

The generated data is intentionally transparent and replaceable. It provides a
working portfolio demo while data/raw remains the integration point for the
referenced Kaggle datasets.
"""

from __future__ import annotations

import csv
import json
import math
import random
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
SEED = 42
ORDER_COUNT = 24000

AREAS = {
    "Gachibowli": (17.4401, 78.3489, 1.16),
    "Madhapur": (17.4483, 78.3915, 1.22),
    "HITEC City": (17.4435, 78.3772, 1.25),
    "Banjara Hills": (17.4156, 78.4347, 1.08),
    "Jubilee Hills": (17.4326, 78.4071, 1.12),
    "Kukatpally": (17.4948, 78.3996, 1.18),
    "Kondapur": (17.4698, 78.3614, 1.14),
    "Ameerpet": (17.4375, 78.4483, 1.06),
    "Begumpet": (17.4449, 78.4664, 1.02),
    "Secunderabad": (17.4399, 78.4983, 1.09),
}

CUISINES = [
    "Biryani", "South Indian", "North Indian", "Chinese", "Fast Food",
    "Healthy", "Desserts", "Cafe", "Pizza", "Multi-cuisine",
]

WEATHER = [
    ("Clear", 0.62, 0.0),
    ("Cloudy", 0.18, 1.5),
    ("Light Rain", 0.14, 5.5),
    ("Heavy Rain", 0.06, 11.0),
]

EVENTS = {
    date(2025, 1, 14): ("Sankranti", "Festival"),
    date(2025, 3, 14): ("Holi", "Festival"),
    date(2025, 3, 23): ("SRH Home Match", "Cricket"),
    date(2025, 4, 6): ("SRH Home Match", "Cricket"),
    date(2025, 4, 12): ("SRH Home Match", "Cricket"),
    date(2025, 4, 23): ("SRH Home Match", "Cricket"),
    date(2025, 8, 27): ("Ganesh Chaturthi", "Festival"),
    date(2025, 10, 2): ("Dussehra", "Festival"),
    date(2025, 10, 20): ("Diwali", "Festival"),
}

RESTAURANT_PREFIXES = [
    "Deccan", "Nizam's", "Charminar", "Metro", "Spice Route", "Urban Tadka",
    "Pearl", "Minerva", "Bowl Company", "Daily Kitchen", "Green Fork", "Cafe 45",
]
RESTAURANT_SUFFIXES = [
    "Kitchen", "House", "Express", "Cafe", "Biryani Co.", "Foods", "Corner",
]


def weighted_choice(items):
    values = [item[0] for item in items]
    weights = [item[1] for item in items]
    return random.choices(values, weights=weights, k=1)[0]


def haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    value = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def create_restaurants():
    restaurants = []
    restaurant_id = 1
    for area_index, (area, (lat, lon, _)) in enumerate(AREAS.items()):
        for index in range(8):
            cuisine = CUISINES[(area_index * 3 + index) % len(CUISINES)]
            name = f"{RESTAURANT_PREFIXES[(area_index + index) % len(RESTAURANT_PREFIXES)]} {RESTAURANT_SUFFIXES[index % len(RESTAURANT_SUFFIXES)]}"
            base_rating = round(random.uniform(3.55, 4.65), 2)
            restaurants.append({
                "restaurant_id": f"R{restaurant_id:03d}",
                "name": name,
                "area": area,
                "city": "Hyderabad",
                "latitude": round(lat + random.uniform(-0.009, 0.009), 6),
                "longitude": round(lon + random.uniform(-0.009, 0.009), 6),
                "cuisine_type": cuisine,
                "avg_rating": base_rating,
                "total_ratings": random.randint(180, 8200),
                "avg_order_value": random.randrange(180, 720, 10),
                "monthly_decline_factor": round(random.uniform(-0.045, 0.018), 4),
            })
            restaurant_id += 1
    return restaurants


def create_partners():
    partners = []
    for index in range(1, 451):
        partners.append({
            "delivery_person_id": f"D{index:04d}",
            "age": random.randint(19, 49),
            "rating": round(min(5, max(3.2, random.gauss(4.35, 0.32))), 2),
            "vehicle_condition": random.choice([1, 2, 2, 3, 3, 3]),
            "vehicle_type": random.choice(["Motorcycle", "Scooter", "Scooter", "Electric Scooter"]),
            "home_area": random.choice(list(AREAS)),
        })
    return partners


def sample_order_datetime():
    start = datetime(2025, 1, 1)
    day = start + timedelta(days=random.randrange(365))
    hour = random.choices(
        list(range(24)),
        weights=[1, 1, 1, 1, 1, 2, 4, 7, 6, 4, 5, 8, 11, 10, 7, 5, 6, 9, 14, 17, 18, 14, 8, 4],
        k=1,
    )[0]
    return datetime.combine(day.date(), time(hour, random.randrange(60)))


def main():
    random.seed(SEED)
    PROCESSED.mkdir(parents=True, exist_ok=True)

    restaurants = create_restaurants()
    partners = create_partners()
    partner_by_id = {item["delivery_person_id"]: item for item in partners}
    area_restaurants = defaultdict(list)
    for restaurant in restaurants:
        area_restaurants[restaurant["area"]].append(restaurant)

    orders = []
    for index in range(1, ORDER_COUNT + 1):
        ordered_at = sample_order_datetime()
        area = random.choices(
            list(AREAS),
            weights=[AREAS[item][2] for item in AREAS],
            k=1,
        )[0]
        restaurant = random.choice(area_restaurants[area])
        partner = random.choice(partners)
        weather = weighted_choice([(name, weight) for name, weight, _ in WEATHER])
        weather_penalty = next(penalty for name, _, penalty in WEATHER if name == weather)
        event_name, event_type = EVENTS.get(ordered_at.date(), ("None", "None"))
        is_event = event_name != "None"
        is_peak = ordered_at.hour in {8, 9, 12, 13, 19, 20, 21}

        destination_area = area if random.random() < 0.72 else random.choice(list(AREAS))
        dest_lat, dest_lon, _ = AREAS[destination_area]
        customer_lat = dest_lat + random.uniform(-0.014, 0.014)
        customer_lon = dest_lon + random.uniform(-0.014, 0.014)
        distance = max(0.8, haversine_km(
            restaurant["latitude"], restaurant["longitude"], customer_lat, customer_lon
        ))

        traffic_score = (
            1.1
            + (1.25 if is_peak else 0)
            + (0.65 if ordered_at.weekday() >= 5 else 0)
            + (0.8 if weather in {"Light Rain", "Heavy Rain"} else 0)
            + random.gauss(0, 0.45)
        )
        traffic_density = "Jam" if traffic_score > 2.8 else "High" if traffic_score > 2.0 else "Medium" if traffic_score > 1.2 else "Low"
        traffic_penalty = {"Low": 0, "Medium": 3.5, "High": 7.5, "Jam": 13.5}[traffic_density]

        multiple_deliveries = random.choices([0, 1, 2, 3], weights=[0.47, 0.34, 0.15, 0.04], k=1)[0]
        prep_time = max(8, random.gauss(17.5, 4.2) + (3 if restaurant["cuisine_type"] == "Biryani" else 0))
        event_penalty = 7.5 if event_type == "Festival" else 5.0 if event_type == "Cricket" else 0
        partner_effect = (4.5 - partner["rating"]) * 4.2 + (3 - partner["vehicle_condition"]) * 1.6
        delivery_time = (
            prep_time
            + distance * 2.65
            + traffic_penalty
            + weather_penalty
            + event_penalty
            + multiple_deliveries * 3.1
            + partner_effect
            + (distance ** 1.35) * (0.42 if traffic_density in {"High", "Jam"} else 0.12)
            + (4.8 if is_peak and weather in {"Light Rain", "Heavy Rain"} else 0)
            + (3.6 if is_event and multiple_deliveries >= 2 else 0)
            + (2.8 if area in {"HITEC City", "Madhapur", "Kukatpally"} and is_peak else 0)
            + random.gauss(0, 3.5)
        )
        delivery_time = round(max(16, delivery_time), 1)
        promised_time = 32 + distance * 1.8 + (4 if traffic_density in {"High", "Jam"} else 0)
        order_value = max(120, random.gauss(restaurant["avg_order_value"], 105))
        rating_trend = restaurant["monthly_decline_factor"] * ((ordered_at.month - 1) / 11)
        order_rating = min(5, max(1, restaurant["avg_rating"] + rating_trend + random.gauss(0, 0.42)))

        orders.append({
            "order_id": f"O{index:06d}",
            "restaurant_id": restaurant["restaurant_id"],
            "delivery_person_id": partner["delivery_person_id"],
            "restaurant_area": area,
            "customer_area": destination_area,
            "order_date": ordered_at.date().isoformat(),
            "time_ordered": ordered_at.strftime("%H:%M"),
            "order_hour": ordered_at.hour,
            "day_of_week": ordered_at.strftime("%A"),
            "month": ordered_at.month,
            "distance_km": round(distance, 2),
            "weather_condition": weather,
            "traffic_density": traffic_density,
            "vehicle_type": partner["vehicle_type"],
            "multiple_deliveries": multiple_deliveries,
            "event_name": event_name,
            "event_type": event_type,
            "is_event": int(is_event),
            "is_peak_hour": int(is_peak),
            "prep_time_min": round(prep_time, 1),
            "promised_time_min": round(promised_time, 1),
            "time_taken_min": delivery_time,
            "delay_min": round(delivery_time - promised_time, 1),
            "is_on_time": int(delivery_time <= promised_time),
            "order_value": round(order_value, 2),
            "customer_rating": round(order_rating, 1),
            "restaurant_latitude": restaurant["latitude"],
            "restaurant_longitude": restaurant["longitude"],
            "customer_latitude": round(customer_lat, 6),
            "customer_longitude": round(customer_lon, 6),
        })

    write_csv(PROCESSED / "restaurants.csv", restaurants)
    write_csv(PROCESSED / "delivery_partners.csv", partners)
    write_csv(PROCESSED / "orders.csv", orders)
    write_csv(PROCESSED / "calendar_events.csv", [
        {"event_date": event_date.isoformat(), "event_name": value[0], "event_type": value[1]}
        for event_date, value in EVENTS.items()
    ])

    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "seed": SEED,
        "orders": len(orders),
        "restaurants": len(restaurants),
        "delivery_partners": len(partners),
        "areas": list(AREAS),
        "data_type": "synthetic portfolio demonstration data",
    }
    (PROCESSED / "data_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


def write_csv(path, rows):
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()

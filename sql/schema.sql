DROP TABLE IF EXISTS delivery_records;
DROP TABLE IF EXISTS hyderabad_restaurants;

CREATE TABLE delivery_records (
    order_id INTEGER PRIMARY KEY,
    distance_km NUMERIC(8, 2) NOT NULL,
    weather TEXT NOT NULL,
    traffic_level TEXT NOT NULL,
    time_of_day TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    preparation_time_min INTEGER NOT NULL,
    courier_experience_yrs NUMERIC(5, 1) NOT NULL,
    delivery_time_min INTEGER NOT NULL,
    under_60_min BOOLEAN NOT NULL
);

CREATE TABLE hyderabad_restaurants (
    restaurant_id INTEGER PRIMARY KEY,
    area TEXT NOT NULL,
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2),
    avg_rating NUMERIC(3, 1),
    total_ratings INTEGER,
    food_type TEXT,
    address TEXT,
    delivery_time_min INTEGER,
    primary_cuisine TEXT,
    delivery_pressure NUMERIC(8, 5),
    rating_weakness NUMERIC(8, 5),
    review_uncertainty NUMERIC(8, 5),
    attention_score NUMERIC(8, 3),
    attention_tier TEXT
);

CREATE INDEX idx_delivery_weather ON delivery_records(weather);
CREATE INDEX idx_delivery_traffic ON delivery_records(traffic_level);
CREATE INDEX idx_restaurant_area ON hyderabad_restaurants(area);
CREATE INDEX idx_restaurant_attention ON hyderabad_restaurants(attention_score DESC);

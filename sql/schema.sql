DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS delivery_partners;
DROP TABLE IF EXISTS restaurants;

CREATE TABLE restaurants (
    restaurant_id VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Hyderabad',
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    cuisine_type TEXT,
    avg_rating NUMERIC(3, 2),
    total_ratings INTEGER,
    avg_order_value NUMERIC(10, 2),
    monthly_decline_factor NUMERIC(8, 4)
);

CREATE TABLE delivery_partners (
    delivery_person_id VARCHAR(10) PRIMARY KEY,
    age INTEGER,
    rating NUMERIC(3, 2),
    vehicle_condition INTEGER,
    vehicle_type TEXT,
    home_area TEXT
);

CREATE TABLE calendar_events (
    event_date DATE PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL
);

CREATE TABLE orders (
    order_id VARCHAR(12) PRIMARY KEY,
    restaurant_id VARCHAR(10) REFERENCES restaurants(restaurant_id),
    delivery_person_id VARCHAR(10) REFERENCES delivery_partners(delivery_person_id),
    restaurant_area TEXT,
    customer_area TEXT,
    order_date DATE,
    time_ordered TIME,
    order_hour INTEGER,
    day_of_week TEXT,
    month INTEGER,
    distance_km NUMERIC(8, 2),
    weather_condition TEXT,
    traffic_density TEXT,
    vehicle_type TEXT,
    multiple_deliveries INTEGER,
    event_name TEXT,
    event_type TEXT,
    is_event BOOLEAN,
    is_peak_hour BOOLEAN,
    prep_time_min NUMERIC(8, 2),
    promised_time_min NUMERIC(8, 2),
    time_taken_min NUMERIC(8, 2),
    delay_min NUMERIC(8, 2),
    is_on_time BOOLEAN,
    order_value NUMERIC(10, 2),
    customer_rating NUMERIC(3, 1),
    restaurant_latitude NUMERIC(9, 6),
    restaurant_longitude NUMERIC(9, 6),
    customer_latitude NUMERIC(9, 6),
    customer_longitude NUMERIC(9, 6)
);

CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_area ON orders(restaurant_area);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_weather ON orders(weather_condition);


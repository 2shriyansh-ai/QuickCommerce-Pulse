-- 1. Delivery benchmark summary
SELECT
    COUNT(*) AS delivery_records,
    ROUND(AVG(delivery_time_min), 2) AS avg_delivery_time_min,
    ROUND(100.0 * AVG(under_60_min::INT), 2) AS under_60_rate_pct,
    ROUND(AVG(distance_km), 2) AS avg_distance_km
FROM delivery_records;

-- 2. Weather comparison
SELECT
    weather,
    COUNT(*) AS records,
    ROUND(AVG(delivery_time_min), 2) AS avg_delivery_time_min,
    ROUND(100.0 * AVG(under_60_min::INT), 2) AS under_60_rate_pct
FROM delivery_records
GROUP BY weather
ORDER BY avg_delivery_time_min DESC;

-- 3. Traffic comparison
SELECT
    traffic_level,
    COUNT(*) AS records,
    ROUND(AVG(delivery_time_min), 2) AS avg_delivery_time_min,
    ROUND(STDDEV_SAMP(delivery_time_min), 2) AS delivery_time_stddev
FROM delivery_records
GROUP BY traffic_level
ORDER BY avg_delivery_time_min DESC;

-- 4. Hyderabad area intelligence
SELECT
    area,
    COUNT(*) AS restaurants,
    ROUND(AVG(delivery_time_min), 2) AS avg_listed_delivery_min,
    ROUND(AVG(avg_rating), 2) AS avg_rating,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::NUMERIC, 2) AS median_price,
    SUM(total_ratings) AS total_reviews
FROM hyderabad_restaurants
GROUP BY area
HAVING COUNT(*) >= 5
ORDER BY avg_listed_delivery_min DESC;

-- 5. Restaurant attention board
SELECT
    name,
    area,
    primary_cuisine,
    avg_rating,
    total_ratings,
    delivery_time_min,
    ROUND(attention_score, 1) AS attention_score,
    attention_tier
FROM hyderabad_restaurants
ORDER BY attention_score DESC
LIMIT 50;

-- 6. Cuisine opportunity view
SELECT
    primary_cuisine,
    COUNT(*) AS restaurants,
    ROUND(AVG(avg_rating), 2) AS avg_rating,
    ROUND(AVG(delivery_time_min), 2) AS avg_delivery_time_min,
    ROUND(AVG(price), 2) AS avg_price
FROM hyderabad_restaurants
GROUP BY primary_cuisine
HAVING COUNT(*) >= 10
ORDER BY restaurants DESC;

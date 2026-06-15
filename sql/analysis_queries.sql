-- 1. Executive KPI summary
SELECT
    COUNT(*) AS total_orders,
    ROUND(AVG(time_taken_min), 2) AS avg_delivery_time_min,
    ROUND(100.0 * AVG(is_on_time::INT), 2) AS on_time_rate_pct,
    ROUND(AVG(delay_min), 2) AS avg_delay_min,
    ROUND(SUM(order_value), 2) AS gross_order_value
FROM orders;

-- 2. Locality performance with volatility
SELECT
    restaurant_area,
    COUNT(*) AS orders,
    ROUND(AVG(time_taken_min), 2) AS avg_delivery_time_min,
    ROUND(STDDEV_SAMP(time_taken_min), 2) AS delivery_time_stddev,
    ROUND(100.0 * AVG(is_on_time::INT), 2) AS on_time_rate_pct
FROM orders
GROUP BY restaurant_area
ORDER BY avg_delivery_time_min DESC;

-- 3. Weather and traffic interaction
SELECT
    weather_condition,
    traffic_density,
    COUNT(*) AS orders,
    ROUND(AVG(time_taken_min), 2) AS avg_delivery_time_min,
    ROUND(AVG(delay_min), 2) AS avg_delay_min
FROM orders
GROUP BY weather_condition, traffic_density
ORDER BY avg_delivery_time_min DESC;

-- 4. Festival and cricket event impact
SELECT
    COALESCE(NULLIF(event_type, 'None'), 'Normal Day') AS period_type,
    COUNT(*) AS orders,
    ROUND(AVG(time_taken_min), 2) AS avg_delivery_time_min,
    ROUND(100.0 * AVG(is_on_time::INT), 2) AS on_time_rate_pct
FROM orders
GROUP BY period_type
ORDER BY avg_delivery_time_min DESC;

-- 5. Restaurant risk board using recent-vs-prior windows
WITH restaurant_windows AS (
    SELECT
        restaurant_id,
        COUNT(*) FILTER (WHERE order_date >= DATE '2025-10-01') AS recent_orders,
        COUNT(*) FILTER (WHERE order_date BETWEEN DATE '2025-07-01' AND DATE '2025-09-30') AS prior_orders,
        AVG(customer_rating) FILTER (WHERE order_date >= DATE '2025-10-01') AS recent_rating,
        AVG(customer_rating) FILTER (WHERE order_date BETWEEN DATE '2025-07-01' AND DATE '2025-09-30') AS prior_rating,
        AVG(delay_min) FILTER (WHERE order_date >= DATE '2025-10-01') AS recent_delay
    FROM orders
    GROUP BY restaurant_id
)
SELECT
    r.name,
    r.area,
    w.recent_orders,
    ROUND(100.0 * (w.recent_orders - w.prior_orders) / NULLIF(w.prior_orders, 0), 2) AS order_growth_pct,
    ROUND(w.recent_rating - w.prior_rating, 2) AS rating_change,
    ROUND(w.recent_delay, 2) AS recent_avg_delay,
    ROUND(
        LEAST(100, GREATEST(0,
            40 * GREATEST(0, (w.prior_orders - w.recent_orders)::NUMERIC / NULLIF(w.prior_orders, 0))
            + 35 * GREATEST(0, w.prior_rating - w.recent_rating)
            + 25 * GREATEST(0, w.recent_delay / 15.0)
        )),
        1
    ) AS risk_score
FROM restaurant_windows w
JOIN restaurants r USING (restaurant_id)
ORDER BY risk_score DESC
LIMIT 20;

-- 6. Hourly staffing pressure
SELECT
    restaurant_area,
    order_hour,
    COUNT(*) AS orders,
    ROUND(AVG(time_taken_min), 2) AS avg_delivery_time_min,
    ROUND(100.0 * AVG(is_on_time::INT), 2) AS on_time_rate_pct
FROM orders
GROUP BY restaurant_area, order_hour
HAVING COUNT(*) >= 20
ORDER BY restaurant_area, order_hour;


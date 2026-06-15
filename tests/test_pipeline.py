import json
import unittest
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]


class PipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orders = pd.read_csv(ROOT / "data" / "processed" / "orders.csv", keep_default_na=False)
        cls.risk = pd.read_csv(ROOT / "analysis" / "restaurant_risk_scores.csv")
        cls.metrics = pd.read_csv(ROOT / "analysis" / "model_metrics.csv")
        cls.dashboard = json.loads(
            (ROOT / "dashboard" / "public" / "data" / "pulse_data.json").read_text(encoding="utf-8")
        )

    def test_expected_data_volume(self):
        self.assertEqual(len(self.orders), 24000)
        self.assertEqual(self.orders["restaurant_area"].nunique(), 10)
        self.assertEqual(self.orders["restaurant_id"].nunique(), 80)

    def test_delivery_values_are_valid(self):
        self.assertGreaterEqual(self.orders["time_taken_min"].min(), 16)
        self.assertTrue(self.orders["distance_km"].between(0.5, 40).all())
        self.assertTrue(self.orders["customer_rating"].between(1, 5).all())

    def test_model_meets_portfolio_threshold(self):
        best = self.metrics.sort_values("r2", ascending=False).iloc[0]
        self.assertGreater(best["r2"], 0.75)
        self.assertLess(best["mae"], 5)

    def test_risk_board_has_actionable_segments(self):
        self.assertIn("Critical", set(self.risk["risk_tier"]))
        self.assertIn("Watch", set(self.risk["risk_tier"]))
        self.assertGreater((self.risk["risk_tier"] == "Critical").sum(), 0)

    def test_dashboard_contract(self):
        required = {
            "kpis", "area_metrics", "restaurant_risk", "model_metrics",
            "statistical_tests", "simulator", "executive_summary",
        }
        self.assertTrue(required.issubset(self.dashboard))
        self.assertEqual(self.dashboard["kpis"]["total_orders"], 24000)


if __name__ == "__main__":
    unittest.main()


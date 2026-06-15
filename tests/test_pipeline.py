import json
import unittest
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]


class RealDataPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.delivery = pd.read_csv(ROOT / "data" / "processed" / "delivery_records.csv")
        cls.restaurants = pd.read_csv(ROOT / "data" / "processed" / "hyderabad_restaurants.csv")
        cls.attention = pd.read_csv(ROOT / "analysis" / "restaurant_attention_scores.csv")
        cls.metrics = pd.read_csv(ROOT / "analysis" / "model_metrics.csv")
        cls.dashboard = json.loads(
            (ROOT / "dashboard" / "public" / "data" / "pulse_data.json").read_text(encoding="utf-8")
        )

    def test_real_dataset_volume(self):
        self.assertEqual(len(self.delivery), 1000)
        self.assertEqual(len(self.restaurants), 1075)
        self.assertTrue(self.restaurants["city"].eq("Hyderabad").all())

    def test_cleaning_removed_missing_values(self):
        self.assertEqual(int(self.delivery.isna().sum().sum()), 0)
        self.assertEqual(self.restaurants["area"].nunique(), 147)

    def test_model_has_useful_holdout_performance(self):
        best = self.metrics.sort_values("r2", ascending=False).iloc[0]
        self.assertGreater(best["r2"], 0.70)
        self.assertLess(best["mae"], 8)

    def test_attention_score_is_bounded_and_segmented(self):
        self.assertTrue(self.attention["attention_score"].between(0, 100).all())
        self.assertEqual(set(self.attention["attention_tier"]), {"Stable", "Watch", "Priority"})

    def test_dashboard_preserves_separate_track_disclosure(self):
        self.assertTrue(self.dashboard["metadata"]["tracks_are_separate"])
        self.assertEqual(self.dashboard["kpis"]["delivery_records"], 1000)
        self.assertEqual(self.dashboard["kpis"]["hyderabad_restaurants"], 1075)
        self.assertIn("limitations", self.dashboard)


if __name__ == "__main__":
    unittest.main()

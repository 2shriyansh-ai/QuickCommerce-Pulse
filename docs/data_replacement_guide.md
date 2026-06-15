# Replacing the Demo Dataset

The repository ships with deterministic synthetic data so the complete project
can be built, tested, and reviewed without a Kaggle account.

## Expected raw inputs

Place the original files in `data/raw/`:

- `delivery_data.csv`
- `swiggy_restaurants.csv`

## Target contract

The downstream pipeline expects these processed files:

- `orders.csv`
- `restaurants.csv`
- `delivery_partners.csv`
- `calendar_events.csv`

The required column contract is documented in `sql/schema.sql`.

## Localization rules

When adapting the Indian delivery dataset:

1. Preserve the original operational variables and target.
2. Map generic city records to the ten documented Hyderabad locality clusters.
3. Keep a `source_record_id` if traceability to the raw file is required.
4. Do not present remapped locality labels as observed source geography.
5. Regenerate all analysis outputs and record the new row count and model metrics.

## Rebuild

```bash
python scripts/run_analysis.py
node scripts/build_ops_workbook.mjs
cd dashboard
npm run build
```


# Data Setup

The repository uses two public Kaggle datasets supplied separately by the
project owner.

## Required files

Place these files in `data/raw/`:

```text
Food_Delivery_Times.csv
swiggy.csv
```

The raw files are intentionally excluded from Git.

## Dataset roles

### Food Delivery Times

Used for:

- Delivery-time prediction
- Weather comparison
- Traffic comparison
- Courier-experience analysis
- Delivery-condition simulator

It does not contain city, restaurant, date, or event identifiers.

### Swiggy Restaurants

Filtered to real Hyderabad listings and used for:

- Area-level restaurant analysis
- Rating and price comparisons
- Listed delivery-time comparisons
- Restaurant operational attention scoring

## Important rule

These datasets have no shared key. The project does not fabricate a row-level
join between them.

## Build

```bash
python scripts/prepare_real_data.py
python scripts/run_analysis.py
node scripts/build_ops_workbook.mjs
```

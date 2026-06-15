.PHONY: data analysis all

data:
	python scripts/prepare_real_data.py

analysis:
	python scripts/run_analysis.py

all: data analysis

.PHONY: data analysis all

data:
	python scripts/generate_demo_data.py

analysis:
	python scripts/run_analysis.py

all: data analysis


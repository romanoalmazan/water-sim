.PHONY: setup run train plan test clean

setup:
	pip install -r requirements.txt
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@echo "Setup complete. Edit .env if you want to use weather API."

run:
	streamlit run app/main.py

train:
	python -m ml.train

plan:
	@if [ -z "$(DATE)" ]; then \
		echo "Usage: make plan DATE=2025-11-09"; \
	else \
		python -m control.plan --date $(DATE) --use_api false --solver greedy; \
	fi

generate-data:
	python -m tools.generate_sample_data --days 60

test:
	pytest tests/ -v

clean:
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf outputs/*.csv

all: setup generate-data train


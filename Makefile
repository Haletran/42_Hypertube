all:
	@clear
	@read -p "In what environment do you want to run the application? (prod/dev): " env; \
	if [ "$$env" = "prod" ]; then \
		clear; \
		echo "\033[1;32mRunning in production mode...\033[0m"; \
		make prod; \
	elif [ "$$env" = "dev" ]; then \
		clear; \
		echo "\033[1;33mRunning in development mode...\033[0m"; \
		make dev; \
	else \
		echo "Invalid environment. Please choose 'prod' or 'dev'."; \
	fi

prod:
	@docker compose -f docker-compose.yml up --build

dev:
	@docker compose -f docker-compose-dev.yml up --build

database:
	@docker compose -f docker-compose.yml up -d --build database

down:
	-docker compose -f docker-compose.yml down
	-docker container prune -f
	-docker volume prune -f
	-docker image prune -f -a
	-docker network prune -f
	-docker system prune --all --volumes --force

re: down all
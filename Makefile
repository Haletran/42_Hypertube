all:
	@docker compose -f docker-compose.yml up --build -d --remove-orphans

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
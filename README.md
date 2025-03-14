# 42_Hypertube

This project aims to create a web application that enables user’s to search for and
watch videos.

=> Front prototype (made by v0) : [link](https://v0.dev/chat/simple-streaming-website-dxwD7slikKg?b=b_lL5zpOHzJLe)


## STACK

- Front: NextJS (with React in typescript)
- Backend: AdonisJS (REST API)
- DB: Sqlite for now
- CSS Lib: Tailwind CSS
- Components Lib: shadcn
- Movie API: TMDB (since IMDB require AWS account and use graphQL)

## TODO

- [ ] Create the controllers and the api routes (add more than mandatory routes for easier dev of features)
- [x] Fix db models for User (add AlreadyWatched feature and add migration / model for it)
- [x] Create a basic front template
- [ ] Torrent downloader and viewer
- [ ] Torrent fetcher (PirateBay or PrivateTracker)
- [ ] Make all the API routes work and secure them with Session token
- [ ] Create Register / Login / Oauth2 to access the website
- [ ] On front-page, only render movies that are on the view and remove the others 

## Setup the Project

<!-- ### Apply Migrations
```bash
cd backend && node ace migration:run
``` -->

### Environment Setup
To make the project work, create a `.env` file in the backend folder with the following content:

```bash
TZ=UTC
PORT=3333
HOST=backend
LOG_LEVEL=info
APP_KEY= # generate a new APP_KEY with gpg --gen-random --armor 1 16
NODE_ENV=development
SESSION_DRIVER=cookie
TMDB_API_KEY= # add your TMDB API key here
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres #or put another password
POSTGRES_DB=hypertube
```

Also, create a `.env` file in the frontend folder with the following content:

```bash 
# this is a temporary solution
NEXT_PUBLIC_TMDB_API_KEY= # add your TMDB API key here
```

### Launch the Project
```bash
# To launch the project, without container for backend/frontend only for database
NIXPKGS_ALLOW_UNFREE=1 nix-shell $1
# You need to change the host in next.config.js to localhost:3333 instead of backend:3333
# and in /movie/[id]/page.tsx to localhost:3333 instead of backend:3333 same for /watch/[id]/page.tsx

npm run dev  # On both backend and frontend
make database

# Or from the root of the project with everything in docker
# do the reverse of the changes in next.config.js and /movie/[id]/page.tsx and /watch/[id]/page.tsx
make
```
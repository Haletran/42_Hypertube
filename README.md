# 42_Hypertube

This project aims to create a web application that enables user’s to search for and
watch videos.

## STACK

- Front: NextJS (with React in typescript)
- Backend: AdonisJS (REST API)
- DB: Postgres
- CSS Lib: Tailwind CSS
- Components Lib: shadcn
- Movie API: TMDB (since IMDB require AWS account and use graphQL)

## TODO

- [x] Fix db models for User (add AlreadyWatched feature and add migration / model for it)
- [x] Create a basic front template
- [x] Torrent downloader and viewer
- [x] Torrent fetcher (PirateBay or PrivateTracker)
- [x] Add Comments section for each movie
- [x] Selection of movies via bar (check discord video) (already movie or not [.mp4 | .hls])
- [x] Fix search bar to search for movies (problem with spaces etc..., parsing)
- [x] Create Register / Login / Oauth2 to access the website
- [x] Make all the API routes work and secure them with Session token
- [x] On front-page, only render movies that are on the view and remove the others
- [x] Make Profile and settings page
- [x] Make already watched movies page / and render in the /dashboard
- [ ] Fix status in /movie/:id page (loading infinite if the progress is null)
- [x] Add a menu to see all the movies that are currently being downloaded
- [x] Make the comments works (still need to implement updated_at and created_at)
- [x] Add filter for dashboard page (by date, by rating, by genre)
- [x] Forget password mail
- [x] Do websocket for comments section and currently watching movies (update in real time)
- [x] Add cronjob to delete old torrents (1 months old)
- [x] Setup frontend validation with Zod (to add multiple validators backend and frontend)
- [x] Add first_name and last_name to the user
- [x] Add show nsfw content option
- [x] Make the frontend rules for password and everything else the same in the backend
- [x] Make the traduction for every page
- [ ] Delete the token when the user logout
- [ ] Add admin page to see all users, all movies etc...
- [ ] Implement Redux for removing the need to reload the page every now and then just to update some value (keep the context API for api calls)



## Setup the Project

### Setup 42 oauth

Add this to redirect URI in 42 API settings:
```
http://localhost:3333/api/oauth/42
```

### Environment Setup
To make the project work, create a `.env` file in the backend folder with the following content:

```bash
TZ=UTC
PORT=3333
LOG_LEVEL=info
APP_KEY= # generate a new APP_KEY with gpg --gen-random --armor 1 16
NODE_ENV=development
DB_HOST=database
DB_PORT=5432
SESSION_DRIVER=cookie
HOST=0.0.0.0
TMDB_API_KEY= # add your TMDB API key here
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=hypertube
CLIENT_ID= # add your 42 API client ID here
CLIENT_SECRET= # add your 42 API secret here
GITHUB_CLIENT_ID= # add your github API client ID here
GITHUB_CLIENT_SECRET= # add your github API secret here
```

Also, create a `.env` file in the frontend folder with the following content:

```bash 
# this is a temporary solution
NEXT_PUBLIC_TMDB_API_KEY= # add your TMDB API key here
NEXT_PUBLIC_BACKEND_URL=http://localhost:3333
NEXT_PUBLIC_CLIENT_ID= # add your 42 API client ID here
NEXT_PUBLIC_GITHUB_CLIENT_ID= # add your github API client ID here
```

### Launch the Project
```bash
make 
```
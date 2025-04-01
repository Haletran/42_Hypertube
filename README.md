# 42_Hypertube

This project aims to create a web application that enables user’s to search for and
watch videos.

=> Front prototype (made by v0) : [link](https://v0.dev/chat/simple-streaming-website-dxwD7slikKg?b=b_lL5zpOHzJLe)


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
- [ ] Selection of movies via bar (check discord video) (already movie or not [.mp4 | .hls])
- [x] Fix search bar to search for movies (problem with spaces etc..., parsing)
- [ ] Create Register / Login / Oauth2 to access the website
- [ ] Make all the API routes work and secure them with Session token
- [ ] On front-page, only render movies that are on the view and remove the others

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

```bash
curl -X POST http://localhost:3333/api/stream/start \
  -H "Content-Type: application/json" \
  -d '{"magnet":"magnet:?xt=urn:btih:b7ba8edf1c2a5f80c8dd4aedf27e81e15a85fee6&tr=http://tracker.p2p-world.net:8080/2t9i8O8FwPIrgw2VHU18K4qP872rrCvj/announce", "streamId":"1190215"}'
```

### Launch the Project
```bash
make 
```
```bash
curl -X POST http://localhost:3333/api/stream/start \
  -H "Content-Type: application/json" \
  -d '{"magnet":"magnet:?xt=urn:btih:79816060ea56d56f2a2148cd45705511079f9bca&dn=TPB.AFK.2013.720p.h264-SimonKlose&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969", "streamId":"1190215"}'
```
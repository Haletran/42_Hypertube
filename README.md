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

## Commands

```bash
# apply migrations
cd backend && node ace migration:run

#generate a new APP_KEY
gpg --gen-random --armor 1 16

# launch the project
npm run dev # on both backend and frontend
# or
make # on the root of the project
```

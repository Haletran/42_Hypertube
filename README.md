# 42_Hypertube

## STACK

- Front: NextJS (with React in typescript)
- Backend: AdonisJS (REST API)
- DB: Sqlite for now
- CSS Lib: Tailwind CSS
- Components Lib: shadcn
- Movie API: TMDB (since IMDB require AWS account and use graphQL)

Might containerize everything later...

## TODO

- [ ] Create the controllers and the api routes (add more than mandatory routes for easier dev of features)
- [ ] Fix db models for User (add AlreadyWatched feature and add migration / model for it)
- [ ] Create a basic front template
- [ ] Torrent downloader and viewer
- [ ] Torrent fetcher (PirateBay or PrivateTracker)
- [ ] Make all the API routes work and secure them with Session token
- [ ] Create Register / Login / Oauth2 to access the website

## Commands

```bash
# apply migrations
cd backend && node ace migration:run

# launch the project
npm run dev # on both backend and frontend
```

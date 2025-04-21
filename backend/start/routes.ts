/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
//import type { HttpContext } from '@adonisjs/core/http'
import MoviesController from '#controllers/movies_controller'
import AuthController from '#controllers/auth_controller'
import StreamController from '#controllers/stream_controller'
import CommentsController from '#controllers/comments_controller'
import LibrariesController from '#controllers/libraries_controller'
import UsersController from '#controllers/users_controller'
import transmit from '@adonisjs/transmit/services/main'
import User from '#models/user'

transmit.registerRoutes()

router.group(() => {
  router.post('/register', [AuthController, 'register']);
  router.post('/login', [AuthController, 'login']);
  router.delete('/logout', [AuthController, 'logout'])
  router.get('/me', [AuthController, 'me']);
  router.post('/forgot-password', [AuthController, 'forgotPassword']);
  router.post('/reset-password', [AuthController, 'resetPassword']);
}).prefix('/api/auth')

router.group(() => {
  router.patch('/:id', [UsersController, 'update'])
  router.patch('/:id/language', [UsersController, 'updateLanguage'])
  router.get('/:id', [UsersController, 'getById'])
}).prefix('/api/users')

router.group(() => {
  router.get('/42', [AuthController, 'oauth42']);
  router.get('/github', [AuthController, 'oauthgithub'])
}).prefix('/api/oauth')

router.group(() => {
  router.get('/:id', [CommentsController, 'getById'])
  router.patch('/:id', [CommentsController, 'update'])
  router.delete('/:id', [CommentsController, 'delete'])
  router.post('', [CommentsController, 'addcomments'])
  router.get('', [CommentsController, 'getAll'])
}).prefix('/api/comments')

router.group(() => {

  router.post('/start', [StreamController, 'start'])
  router.get('/:id/status', [StreamController, 'status'])
  router.get('/:id/video', [StreamController, 'video'])
  router.get('/:id/video/isAvailable', [StreamController, 'isAvailable'])
  router.get('/:id/video.mp4', [StreamController, 'videomp4'])
  router.get('/:streamId/:segment.ts', [StreamController, 'videoSegment'])
  router.get('/:streamId/subtitles', [StreamController, 'subtitles'])
  router.get('/:title/download', [StreamController, 'getTorrentsList'])
  router.get('/:streamId/:file', [StreamController, 'subtitlesFile'])
  router.get('/current_download', [StreamController, 'getAllStreams'])
}).prefix('/api/stream')

router.group(() => {

  router.get('/popular', [MoviesController, 'popular'])
  router.get('/:id', [MoviesController, 'getByTmdbById'])
    .where('id', {
      match: /^[0-9]+$/,
    })
  router.get('/watch/:id', [MoviesController, 'watch'])
  router.get('/search/:name', [MoviesController, 'search'])
  router.delete('/:id', [MoviesController, 'deleteMovie'])
}).prefix('/api/movies')

router.group(() => {
  router.get('/user/:id', [LibrariesController, 'getAllUserMovies'])
  router.get('/:id', [LibrariesController, 'getUserMovie'])
  router.post('/:id', [LibrariesController, 'addUserMovie'])
  router.patch('/:id', [LibrariesController, 'updateUserMovie'])
}).prefix('/api/library')

// GET /api/users
// GET /api/users/:id
// PATCH /api/users/:id
// GET /api/comments
// GET /comments/:id
// PATCH /comments/:id
// DELETE /comments/:id
// POST /comments or POST /movies/:movie_id/comments

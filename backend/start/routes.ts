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
import { middleware } from './kernel.js'

router.group(() => {
  router.post('/register', [AuthController, 'register']);
  router.post('/login', [AuthController, 'login']);
  router.delete('/logout', [AuthController, 'logout']).use(middleware.auth());
  router.get('/me', [AuthController, 'me']);
}).prefix('/api/auth')

router.group(() => {
  router.get('/42', [AuthController, 'oauth42']);
  router.get('/github', [AuthController, 'oauthgithub'])
}).prefix('/api/oauth')

router.group(() => {

  router.post('/start', [StreamController, 'start'])
  router.get('/:id/status', [StreamController, 'status'])
  router.get('/:id/video', [StreamController, 'video'])
  router.get('/:id/video.mp4', [StreamController, 'videomp4'])
  router.get('/:streamId/:segment.ts', [StreamController, 'videoSegment'])
  router.get('/:streamId/subtitles', [StreamController, 'subtitles'])
  router.get('/:title/download', [StreamController, 'getTorrentsList'])
  router.get('/:streamId/:file', [StreamController, 'subtitlesFile'])

}).prefix('/api/stream')


router.group(() => {

  router.get('/popular', [MoviesController, 'popular'])
  router.get('/:id', [MoviesController, 'getByTmdbById'])
    .where('id', {
      match: /^[0-9]+$/,
    })
  router.get('/watch/:id', [MoviesController, 'watch'])
  router.get('/search/:name', [MoviesController, 'search'])

}).prefix('/api/movies')



// GET /api/users
// GET /api/users/:id
// PATCH /api/users/:id
// GET /api/comments
// GET /comments/:id
// PATCH /comments/:id
// DELETE /comments/:id
// POST /comments or POST /movies/:movie_id/comments

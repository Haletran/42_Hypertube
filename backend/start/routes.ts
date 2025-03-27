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
// GET /api/movies
// GET /api/movies/:id

router.group(() => {
  router.post('/stream/start', [StreamController, 'start'])
  router.get('/stream/:id/status', [StreamController, 'status'])
  router.get('/stream/:id/video', [StreamController, 'video'])
  router.get('/stream/:streamId/:segment.ts', [StreamController, 'videoSegment'])
  router.get('/stream/:streamId/subtitles', [StreamController, 'subtitles'])
  router.get('/stream/:title/download', [StreamController, 'getPirateBay'])
  router.get('/stream/:streamId/:file', [StreamController, 'subtitlesFile'])

  router.get('/movies/popular', [MoviesController, 'popular'])

  router.get('/movies/:id', [MoviesController, 'getByTmdbById'])
    .where('id', {
      match: /^[0-9]+$/,
    })
  router.get('/movies/watch/:id', [MoviesController, 'watch'])

  router.get('/movies/search/:name', [MoviesController, 'search'])
  router.post('/auth/register', [AuthController, 'register']);
  router.post('/auth/login', [AuthController, 'login']);
  
}).prefix('/api')


// GET /api/users
// GET /api/users/:id
// PATCH /api/users/:id
// GET /api/comments
// GET /comments/:id
// PATCH /comments/:id
// DELETE /comments/:id
// POST /comments or POST /movies/:movie_id/comments

// GET /api/torrent/piratebay/:name
/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/api/:id', ({ params }) => {
  return { message: `Hello ${params.id}` }
})

// GET /api/users
// GET /api/users/:id
// PATCH /api/users/:id
// GET /api/movies
// GET /api/movies/:id
// GET /api/comments
// GET /comments/:id
// PATCH /comments/:id
// DELETE /comments/:id
// POST /comments or POST /movies/:movie_id/comments

// GET /api/torrent/piratebay?query=NAME_OF_THE_MOVIE
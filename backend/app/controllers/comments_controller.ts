import type { HttpContext } from '@adonisjs/core/http'
import Comment from '#models/comments'


export default class CommentsController {

  async getById({ auth, params, response }: HttpContext) {
    const { id } = params

    if (!id) {
      return response.status(400).json({ error: 'ID is required' })
    }
    const check = await auth.check();
    if (!check) {
        throw new Error('unauthorized');
    }
    try { 
      const comment = await Comment.query()
        .where('movie_id', id)
        .preload('user')
      return response.json(comment);
    } catch (error) {
      return response.status(500).json({ error: 'Error fetching comment' })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const { id } = params
    const { text } = request.body()

    if (!text) {
      return response.status(400).json({ error: 'Text is required' })
    }

    // Update the comment in the database
    // await Comment.query().where('id', id).update({ text })

    return response.json({ message: 'Comment updated successfully' })
  }


  async delete({ params, response }: HttpContext) {
    const { id } = params

    // Delete the comment from the database
    // await Comment.query().where('id', id).delete()

    return response.json({ message: 'Comment deleted successfully' })
  }

  async addcomments({ request, auth, response }: HttpContext) {
    const { id } = request.qs()
    const { content } = request.qs()

    const check = await auth.check();
    if (!check) {
        throw new Error('unauthorized');
    }

    if (!content) {
      return response.status(400).json({ error: 'Text is required' })
    }

    try {
      const comment = new Comment()
      comment.content = content
      comment.movieId = id
      comment.userId = auth.user!.id
      comment.created_at = new Date().toISOString()
      await comment.save()
    } catch (error) {
      return response.status(500).json({ error: 'Error adding comment' })
    }

    return response.json({ message: 'Comment added successfully' })
  }
}
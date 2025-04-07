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

  async update({ auth, params, request, response }: HttpContext) {
    const { id } = params
    const { content } = request.body()

    if (!content) {
      return response.status(400).json({ error: 'Text is required' })
    }
    if (!id) {
      return response.status(400).json({ error: 'ID is required' })
    }
    const check = await auth.check();
    if (!check) {
        throw new Error('unauthorized');
    }
    try {
      const comment = await Comment.query().where('id', id).first()
      if (!comment) {
        return response.status(404).json({ error: 'Comment not found' })
      }
      if (comment.userId !== auth.user!.id) {
        return response.status(403).json({ error: 'Unauthorized' })
      }
      comment.content = content
      await comment.save()
      return response.json({ message: 'Comment updated successfully' })
    } catch (error) {
      return response.status(500).json({ error: 'Error updating comment' })
    }
  }


  async delete({ auth, params, response }: HttpContext) {
    const { id } = params

    const check = await auth.check();
    if (!check) {
        throw new Error('unauthorized');
    }

    try {
      const comment = await Comment.query().where('id', id).first()
      if (comment.userId !== auth.user!.id) {
        return response.status(403).json({ error: 'Unauthorized' })
      }
      comment.delete()
      return response.json({ message: 'Comment deleted successfully' })
    } catch (error) {
      return response.status(500).json({ error: 'Error deleting comment' })
    }
  }

  async getAll({ auth, params, response }: HttpContext) {
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
      return response.json(comment);
    } catch (error) {
      return response.status(500).json({ error: 'Error fetching comment' })
    }
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
      await comment.save()
    } catch (error) {
      return response.status(500).json({ error: 'Error adding comment' })
    }

    return response.json({ message: 'Comment added successfully' })
  }
}
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Movie from '#models/movie_user'

export default class LibrariesController {

  async getUserMovie({ auth, params, response }: HttpContext) {
    try {
        const response = await auth.check();
        if (!response) {
            throw new Error('unauthorized');
        }
        const userId = auth?.user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const movieId = params.id;
        const user = await User.findOrFail(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const movies = await Movie.query().where('user_id', userId).where('movie_id', movieId);
        if (movies.length === 0) {
            throw new Error('Movie not found');
        }
        return movies;
    }
    catch (error) {
        return response.status(400).json(error);
    }
}

async getAllUserMovies({ auth, params, response }: HttpContext) {
    try {
        const response = await auth.check();
        if (!response) {
            throw new Error('unauthorized');
        }
        const userId = params.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const user = await User.findOrFail(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const movies = await Movie.query().where('user_id', userId);
        if (movies.length === 0) {
            throw new Error('No movies found for this user');
        }
        return movies;
    }
    catch (error) {
        return response.status(400).json(error);
    }
}

async addUserMovie({ auth, params, request, response }: HttpContext) {
    try {
        const response = await auth.check();
        if (!response) {
            throw new Error('unauthorized');
        }
        if (!auth.user) {
            throw new Error('User not found');
        }
        const userId = auth.user.id;
        const movie_id = params.id;
        if (!movie_id) {
            throw new Error('Movie ID is required');
        }
        const user = await User.findOrFail(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const { watched_timecode, original_timecode } = request.body();
        if (!watched_timecode || !original_timecode) {
            throw new Error('Missing required fields');
        }
        const check = await Movie.query().where('user_id', userId).where('movie_id', movie_id);
        if (check.length > 0) {
            console.error(check);
            throw new Error('Movie already exists');
        }
        const movie = await Movie.create({
            user_id: userId,
            movie_id,
            watched_timecode,
            original_timecode
        });
        return movie;
    }
    catch (error) {
        console.error('Failed to add movie:', error);
        return response.status(400).json(error);
    }
}

async updateUserMovie({ auth, request, response, params }: HttpContext) {
    try {
        const response = await auth.check();
        if (!response) {
            throw new Error('unauthorized');
        }
        const userId = auth?.user?.id;
        if (!userId) {
            throw new Error('User not found');
        }
        const movie_id = params.id;
        const user = await User.findOrFail(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const { watched_timecode } = request.body();
        const movie = await Movie.query().where('user_id', userId).where('movie_id', movie_id).update({
            watched_timecode,
        });
        return movie;
    } catch (error) {
        return response.status(400).json(error);
    }
}

}
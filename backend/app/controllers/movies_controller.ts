import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'


export default class MoviesController {
    async search({ params, request, response }: HttpContext) {
        const name = params.name;
        const apiKey = process.env.TMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const language = request.input('language', defaultLanguage);

        try {
            const first = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${name}&language=${language}`);

            const test = await first.json() as { results: { id: number }[] };
            const movieIds = test.results.map(result => result.id);

            const movies = await Promise.all(movieIds.map(async (id) => {
                const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=${language}`);
                return res.json();
            }));

            return response.json(movies);
        } catch (error) {
            return response.status(500).json({
                error: 'Error fetching movie data'
            });
        }
    }
    async popular({ request, response }: HttpContext) {
        const apiKey = process.env.TMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const defaultpage = 1;
        const language = request.input('language', defaultLanguage);
        const page = request.input('page', defaultpage);

        try {
            const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${language}&page=${page}`);

            const data = await res.json();
            return response.json(data);
        } catch (error) {
            return response.status(500).json({
                error: 'Error fetching discover movie'
            });
        }
    }

    async watch({ params, response }: HttpContext) {
        const embedUrl = `https://vidsrc.to/embed/movie/${params.id}`;

        if (!params.id) {
            return response.status(400).json({
                error: 'Missing movie ID'
            });
        }
        return (embedUrl);
    }

    async getByTmdbById({ params, response, request }: HttpContext) {
        const apiKey = process.env.TMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const language = request.input('language', defaultLanguage);
        const id = params.id;

        try {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits&language=${language}`);

            const data = await res.json();
            return response.json(data);
        } catch (error) {
            return response.status(500).json({
                error: 'Error fetching movie data'
            });
        }
    }
}
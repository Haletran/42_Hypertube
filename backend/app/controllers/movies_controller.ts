import type { HttpContext } from '@adonisjs/core/http'

export default class MoviesController {
    async index({ params, request, response }: HttpContext) {
        const apiKey = process.env.TMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const language = request.input('language', defaultLanguage);

        try {
            const first = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${params.name}&language=${language}`);

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
}

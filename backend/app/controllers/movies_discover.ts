import type { HttpContext } from '@adonisjs/core/http'

export default class MoviesDiscover {
    async index({ request, response }: HttpContext) {
        const apiKey = process.env.TMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const language = request.input('language', defaultLanguage);

        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${language}`);

            const data = await response.json();
            return (data.results)
        } catch (error) {
            return response.status(500).json({
                error: 'Error fetching discover movie'
            });
        }
    }
}

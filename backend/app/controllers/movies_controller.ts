import type { HttpContext } from '@adonisjs/core/http'

export default class MoviesController {
    async index({ params, response }: HttpContext) {
        const apiKey = process.env.TMDB_API_KEY || '';
        const language = ["fr-FR", "en-US"]


        try {
            const first = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(params.name)}&language=${language[0]}`)

            const test = await first.json() as { results: { id: number }[] };
            const movieId = test.results[0]?.id;

            const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=${language[0]}`);
            const data = await res.json();
            return response.json(data);
        } catch (error) {
            return response.status(500).json({ 
                error: 'Error fetching movie data' 
            });
        }
    }
}

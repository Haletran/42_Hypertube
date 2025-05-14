import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import fs from 'fs/promises'
import path from 'path'

export interface SearchMovie {
    id: number;
    title: string;
    poster_path: string;
    vote_average: number;
    release_date: string
}


export default class MoviesController {
    async search({ params, request, response, auth }: HttpContext) {
        const name = params.name;
        const tmdb_api_key = process.env.TMDB_API_KEY || '';
        const omdb_api_key = process.env.OMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const language = request.input('language', defaultLanguage);
        const source = request.input('source', 'tmdb');
        
        try {
            const check = await auth.check();
            if (!check) {
                throw new Error('unauthorized');
            }

            if (source === 'tmdb') {
                const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdb_api_key}&query=${name}&language=${language}`);
                const data = await res.json() as { results: SearchMovie[] };
                const movieIds = data.results.map(result => result.id);
    
                const movies = await Promise.all(movieIds.map(async (id) => {
                    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${tmdb_api_key}&language=${language}`);
                    return res.json();
                }));
                return response.json(movies);
            } else if (source === 'omdb') {
                const res = await fetch(`http://www.omdbapi.com/?s=${name}&type=movie&apikey=${omdb_api_key}`);
                const searchData = await res.json();
                if (searchData.Response === 'True' && searchData.Search) {
                    const movies = await Promise.all(searchData.Search.map(async (item) => {
                        const detailRes = await fetch(`http://www.omdbapi.com/?i=${item.imdbID}&apikey=${omdb_api_key}`);
                        const replaceRes = await fetch(`https://api.themoviedb.org/3/find/${item.imdbID}?api_key=${tmdb_api_key}&external_source=imdb_id`)
                        const detailData = await detailRes.json();
                        const replaceData = await replaceRes.json();
                        return {
                            id: replaceData.movie_results[0].id,
                            title: detailData.Title,
                            poster_path: replaceData.movie_results[0].poster_path,
                            vote_average: parseFloat(detailData.imdbRating) || 0,
                            release_date: detailData.Year,
                        };
                    }));
                    return response.json(movies);
                }
                return response.status(404).json({ error: 'Movie not found' });
            } else {
                return response.status(400).json({ error: 'Invalid source' });
            }

        } catch (error) {
            return response.status(500).json({
                error: 'Error fetching movie data'
            });
        }
    }
    async popular({ request, response, auth }: HttpContext) {
        const apiKey = process.env.TMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const defaultpage = 1;
        const filter = request.input('filter', '');
        const language = request.input('language', defaultLanguage);
        const page = request.input('page', defaultpage);
        const sort = request.input('sort_by', '');

        try {
            const check = await auth.check();
            if (!check) {
                throw new Error('unauthorized');
            }
            const user = await auth.authenticate();
            const userInfo = await User.findOrFail(user.id);

            let res;
            let nsfw = userInfo.nsfw ? true : false;
            if (filter === '' && sort === '') {
                res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${language}&include_adult=${nsfw}&page=${page}`);
            } else {
                res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=${language}&sort_by=${sort}&include_adult=${nsfw}&page=${page}${filter}`);
            }
            const data = await res.json()
            return response.json(data);
        } catch (error) {
            return response.status(500).json({
                error: 'Error fetching discover movie'
            });
        }
    }


    async getByTmdbById({ params, response, request, auth }: HttpContext) {
        const apiKey = process.env.TMDB_API_KEY || '';
        const defaultLanguage = "en-US";
        const language = request.input('language', defaultLanguage);
        const id = params.id;

        try {
            const check = await auth.check();
            if (!check) {
                throw new Error('unauthorized');
            }
            const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits&language=${language}`);

            const data = await res.json();
            return response.json(data);
        } catch (error) {
            return response.status(500).json({
                error: 'Error fetching movie data'
            });
        }
    }


    async deleteMovie({ params, response, auth }: HttpContext) {
        const mp4Path = path.join('data', params.id);
        const hlsPath = path.join('data', 'hls', params.id);

        const deleteFolder = async (folderPath: string) => {
            try {
            const files = await fs.readdir(folderPath);
            await Promise.all(files.map(async (file) => {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                if (stat.isDirectory()) {
                await deleteFolder(filePath);
                } else {
                await fs.unlink(filePath);
                }
            }));
            await fs.rmdir(folderPath);
            } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            }
        };

        // might need to check if a user is currently watching the movie
        try {
            const check = await auth.check();
            if (!check) {
                throw new Error('unauthorized');
            }
            const user = await User.findOrFail(auth.user!.id);
            if (user.role !== 'admin') {
                return response.status(403).json({ error: 'Unauthorized' });
            }
            const mp4Exists = await fs.access(mp4Path).then(() => true).catch(() => false);
            const hlsExists = await fs.access(hlsPath).then(() => true).catch(() => false);

            if (!mp4Exists && !hlsExists) {
                return response.status(404).json({ error: 'Movie not found' });
            }
            if (mp4Exists) {
                await deleteFolder(mp4Path);
            }
            if (hlsExists) {
                await deleteFolder(hlsPath);
            }
            return response.status(200).json({ message: 'Movie deleted successfully' });
        } catch (error) {
            return response.status(500).json({
                error: 'Error deleting movie'
            });
        }
    }
}
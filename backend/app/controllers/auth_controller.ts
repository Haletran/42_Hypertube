import type { HttpContext } from '@adonisjs/core/http'
import { RegisterValidator, LoginValidator, UpdateValidator } from '#validators/register_user';
import User from '#models/user'
import axios from 'axios'

export default class AuthController {
    public async register({ request }: HttpContext) {
        const data = request.all();
        const payload = await RegisterValidator.validate(data);
        const user = await User.create(payload);
        await user.save();
        const token = await User.accessTokens.create(user)
        return (token);
    }

    public async login({ request, response }: HttpContext) {
        try {
            const { email, password } = request.only(['email', 'username', 'password'])
            const user = await User.verifyCredentials(email, password);
            if (user.auth_method !== 'local') {
               throw new Error(`Account is link to ${user.auth_method} cannot login with password`)
            }
            await User.findByOrFail('email', email);
            const token = await User.accessTokens.create(user)
            return (token)
        } catch (error) {
            console.error('Login failed:', error);
            return response.status(400).json(error);
        }
    }

    public async oauth42({ request, response }: HttpContext) {
        const url = new URL(request.url(), request.completeUrl(true))
        const code = request.qs().code
        
        if (!code) {
            return { error: 'No code' }
        }

        try {
            const response2 = await axios.post('https://api.intra.42.fr/oauth/token', {
                grant_type: 'authorization_code',
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: url,
                code: code,
            })

            const accessToken = response2.data.access_token
            if (!accessToken) {
                throw new Error('No access token')
            }
    
            const me = await axios.get('https://api.intra.42.fr/v2/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            })

            const existingUser = await User.findBy('email', me.data.email)
            let user: any;

            if (existingUser) {
              user = existingUser
            } else {
              user = await User.firstOrCreate({
                email: me.data.email,
                username: me.data.login,
                password: '42',
                profile_picture: me.data.image.versions.small,
                auth_method: '42',
              })
            }
            const token = await User.accessTokens.create(user)
            return response.redirect(`http://localhost:3000/auth/login?token=${encodeURIComponent(JSON.stringify(token))}`)
        } catch (error) {
            console.error('Oauth42 failed:', error);
        }
    }

    public async oauthgithub({request, response}: HttpContext)
    {
        const code = request.qs().code
        if (!code) {
            return { error: 'No code' }
        }

        try {
            const response2 = await axios.post('https://github.com/login/oauth/access_token', {
                grant_type: 'authorization_code',
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code
            }, {
                headers: {
                    'Accept': 'application/json'
                }
            })

            const accessToken = response2.data.access_token
            if (!accessToken) {
                throw new Error('No access token')
            }

            const me = await axios.get('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${accessToken}` },
            })

            const existingUser = await User.findBy('email', me.data.email || me.data.login + '@github.com')
            let user: any;
            
            if (existingUser) {
              user = existingUser
            } else {
              user = await User.firstOrCreate({
                email: me.data.email || me.data.login + '@github.com',
                username: me.data.login,
                password: 'github',
                profile_picture: me.data.avatar_url,
                auth_method: 'github',
              })
            }
            const token = await User.accessTokens.create(user)
            return response.redirect(`http://localhost:3000/auth/login?token=${encodeURIComponent(JSON.stringify(token))}`)
        } catch (error) {
            console.error('Oauth42 failed:', error);
        }
    }

    public async logout({ auth }: HttpContext) {
        const user = auth.user!;
        await User.accessTokens.delete(user, user.currentAccessToken.identifier)
        return { message: "success" }
    }

    public async update({ auth, request, response }: HttpContext) {
        try {
            const response = await auth.check();
            if (!response) {
                throw new Error('unauthorized');
            }
            const data = request.all();
            const userWithPassword = await User.findOrFail(request.param('id'));
            const payload = await UpdateValidator.validate(data);
            if (data.old_password) {
                await User.verifyCredentials(userWithPassword.email, data.old_password);
            }
            if (data.password) userWithPassword.password = data.password;
            if (data.email) userWithPassword.email = data.email;
            if (data.username) userWithPassword.username = data.username;
            if (data.profilePicture) userWithPassword.profile_picture = data.profilePicture;
            if (data.language) userWithPassword.language = data.language;
            await userWithPassword.save();
            return { message: 'User updated successfully' };
        } catch (error) {
            console.error('Failed to update user:', error);
            return response.status(400).json(error);
        }
    }

    public async updateLanguage({ auth, request, response }: HttpContext) {
        try {
            const response = await auth.check();
            if (!response) {
                throw new Error('unauthorized');
            }
            const data = request.all();
            const userWithPassword = await User.findOrFail(request.param('id'));
            const payload = await UpdateValidator.validate(data);
            if (data.language != 'fr' && data.language != 'en') {
                throw new Error('language not supported');
            }
            if (data.language) userWithPassword.language = data.language;
            await userWithPassword.save();
            return { message: 'User updated successfully' };
        } catch (error) {
            console.error('Failed to update user:', error);
            return response.status(400).json(error);
        }
    }



    public async me({ auth }: HttpContext) {
        await auth.check();
        return {
            user: auth.user,
        }
    }
}
import type { HttpContext } from '@adonisjs/core/http'
import { RegisterValidator, ResetPasswordValidator } from '#validators/register_user';
import User from '#models/user'
import axios from 'axios'
import { randomBytes } from 'crypto'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon';

export default class AuthController {
    public async forgotPassword({ request, response }: HttpContext) {
        const email = request.input('email')
        const user = await User.findBy('email', email)
    
        if (!user) {
          return response.status(404).send({ message: 'Utilisateur non trouvé' })
        }
        const token = randomBytes(32).toString('hex')
        const expiresAt = DateTime.fromJSDate(new Date(Date.now() + 60 * 60 * 1000));
        user.merge({
            reset_token: token,
            reset_token_expires: expiresAt,
        })
        await user.save()
    
        const resetLink = `http://localhost:3000/auth/reset-password?token=${token}&email=${email}`
    
        await mail.send((message) => {
            message
              .from(process.env.SMTP_USER || '')
              .to(email)
              .subject('Hypertube - Reset Your Password')
              .html(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Reset Your Password</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      line-height: 1.6;
                      color: #333;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                    }
                    .button {
                      display: inline-block;
                      background-color: #4f46e5;
                      color: white;
                      text-decoration: none;
                      padding: 10px 20px;
                      border-radius: 4px;
                      margin: 20px 0;
                    }
                    .footer {
                      margin-top: 30px;
                      font-size: 12px;
                      color: #666;
                    }
                  </style>
                </head>
                <body>
                  <h1>Password Reset Request</h1>
                  <p>Hello ${user.username},</p>
                  <p>We received a request to reset your password. Click the button below to create a new password:</p>
                  
                  <a href="${resetLink}" class="button">Reset Password</a>
                  
                  <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                  
                  <p>This link will expire in 1 hour.</p>
                  
                  <div class="footer">
                    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
                    <p>${resetLink}</p>
                  </div>
                </body>
                </html>
              `)
          })
    
        return response.ok({ message: 'Lien de réinitialisation envoyé' })
      }

    public async resetPassword({ request, response}: HttpContext) {
        const token = request.input('token')
        const email = request.input('email')

        try {
            const user = await User.findBy('email', email)
            if (!user) {
                throw new Error('Utilisateur non trouvé')
            }
            if (user.reset_token !== token) {
                throw new Error('Token invalide')
            }
            if (user.auth_method !== 'local') {
                throw new Error(`Account is link to ${user.auth_method} cannot reset password`)
             }

            const now = DateTime.now()
            if (user.reset_token_expires && user.reset_token_expires < now) {
                throw new Error('Token expiré')
            }
            const password = request.input('password')
            if (!password) {
                throw new Error('Mot de passe requis')
            }
            await ResetPasswordValidator.validate({ password })
            user.password = password
            user.reset_token = null
            user.reset_token_expires = null
            await user.save()
            return response.ok({ message: 'Mot de passe réinitialisé avec succès' })
        } catch (error) {
            console.error('Reset password failed:', error);
            return response.status(400).json({ error: 'Failed to reset password' });
        }
    }

    public async register({ request }: HttpContext) {
        try {
            const data = request.all();
            const payload = await RegisterValidator.validate(data);
            const user = await User.create(payload);
            await user.save();
            const token = await User.accessTokens.create(user)
            return (token);
        } catch (error) {
            console.error('Register failed:', error);
            return { error: 'Registration failed' };
        }
    }

    public async login({ request, response }: HttpContext) {
        try {
            const { username, password } = request.only(['username', 'password'])
            const payload = await User.findByOrFail('username', username);
            const user = await User.verifyCredentials(payload.email, password);
            if (user.auth_method !== 'local') {
               throw new Error(`Account is link to ${user.auth_method} cannot login with password`)
            }
            await User.findByOrFail('username', username);
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

            const existingUser = await User.findBy('username', me.data.login)
            let user: any;
            let role: string = 'basic';

            if (me.data.login === 'bapasqui' || me.data.login === 'hbelle')
                role = 'admin';

            if (existingUser) {
              user = existingUser
            } else {
              user = await User.firstOrCreate({
                email: me.data.email,
                username: me.data.login,
                first_name: me.data.first_name,
                last_name: me.data.last_name,
                password: '42',
                profile_picture: me.data.image.versions.small,
                auth_method: '42',
                role: role
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

            const existingUser = await User.findBy('username', me.data.login)
            let user: any;
            let role: string = 'basic';

            if (me.data.login === 'Haletran')
                role = 'admin';

            if (existingUser) {
              user = existingUser
            } else {
              user = await User.firstOrCreate({
                email: me.data.email || me.data.login + '@github.com',
                username: me.data.login,
                first_name: me.data.name ? me.data.name.split(' ')[0] : me.data.login,
                last_name: me.data.name ? me.data.name.split(' ').slice(1).join(' ') : me.data.login,
                password: 'github',
                profile_picture: me.data.avatar_url,
                auth_method: 'github',
                role: role
              })
            }
            const token = await User.accessTokens.create(user)
            return response.redirect(`http://localhost:3000/auth/login?token=${encodeURIComponent(JSON.stringify(token))}`)
        } catch (error) {
            console.error('Oauth42 failed:', error);
        }
    }

    public async logout({ auth, response }: HttpContext) {
        try {
            const check = await auth.check();
            if (!check) {
                return response.status(401).json({ error: 'Unauthorized' });
            }
            const user = auth.user!;
            await User.accessTokens.delete(user, user.currentAccessToken.identifier);
            return response.json({ message: 'Successfully logged out' });
        } catch (error) {
            console.error('Logout failed:', error);
            return response.status(500).json({ error: 'Failed to logout' });
        }
    }

    public async me({ auth, response }: HttpContext) {
        try {
            const check = await auth.check();
            if (!check) {
                throw new Error('unauthorized');
            }
            const user = auth.user!;
            if (!user) {
                throw new Error('unauthorized');
            }
            return { user }
        } catch (error) {
            console.error('Failed to get user:', error);
            return response.status(400).json(error);
        }
    }
}
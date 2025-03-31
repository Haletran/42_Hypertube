import type { HttpContext } from '@adonisjs/core/http'
import { RegisterValidator, LoginValidator } from '#validators/register_user';
import User from '#models/user'

export default class AuthController {
    public async register({ request, response }: HttpContext) {
        const data = request.all();
        const payload = await RegisterValidator.validate(data);
        await User.create(payload);
        return response.status(201).json({ message: "User created" });
    }

    public async login({ request }: HttpContext) {
        const { email, password } = request.only(['email', 'username', 'password'])
        const user = await User.verifyCredentials(email, password);
        const token = await User.accessTokens.create(user)
        return (token)
    }

    public async logout({ auth }: HttpContext) {
        const user = auth.user!;
        await User.accessTokens.delete(user, user.currentAccessToken.identifier)
        return { message: "success" }
    }

    public async me({ auth }: HttpContext) {
        await auth.check();
        return {
            user: auth.user,
        }
    }
}
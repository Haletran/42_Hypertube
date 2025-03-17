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

    public async login({ request, response, auth }: HttpContext) {
        const data = request.all();
        const payload = await LoginValidator.validate(data);
        return (payload);
        //return response.status(201).json({ message: "User Connected" });
    }
}
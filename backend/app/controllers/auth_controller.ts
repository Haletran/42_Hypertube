import type { HttpContext } from '@adonisjs/core/http'
import { RegisterValidator, LoginValidator } from '#validators/register_user';

export default class AuthController {
    public async register({ request }: HttpContext) {
        const data = request.all();
        const payload = await RegisterValidator.validate(data);
        return (payload);
    }

    public async login({ request }: HttpContext) {
        const data = request.all();
        const payload = await LoginValidator.validate(data);
        return (payload);
    }
}
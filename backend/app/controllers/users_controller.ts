import type { HttpContext } from '@adonisjs/core/http'
import { UpdateValidator } from '#validators/register_user'
import User from '#models/user'

export default class UsersController {

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
      if (data.password && userWithPassword.auth_method == 'local') userWithPassword.password = data.password;
      if (data.email) userWithPassword.email = data.email;
      if (data.username && userWithPassword.auth_method == 'local') userWithPassword.username = data.username;
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

  public async getById({ auth, request, response }: HttpContext) {
    try {
      const response = await auth.check();
      if (!response) {
        throw new Error('unauthorized');
      }
      const user = await User.findOrFail(request.param('id'));
      const private_user = {
        id: user.id,
        username: user.username,
        profile_picture: user.profile_picture,
        language: user.language,
        created_at: user.createdAt,
      }
      return private_user;
    } catch (error) {
      console.error('Failed to get user:', error);
      return response.status(400).json(error);
    }
  }
}
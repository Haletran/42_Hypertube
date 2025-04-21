import vine from '@vinejs/vine'

export const RegisterValidator = vine.compile(
    vine.object({
        username: vine.string()
            .trim()
            .minLength(3)
            .maxLength(20)
            .regex(/^[a-zA-Z0-9_]+$/)
            .escape()
            .unique({ table: 'users', column: 'username' }),
        first_name: vine.string()
            .trim()
            .minLength(2)
            .maxLength(20)
            .regex(/^[a-zA-Z]+$/)
            .escape(),
        last_name: vine.string()
            .trim()
            .minLength(2)
            .maxLength(20)
            .regex(/^[a-zA-Z]+$/)
            .escape(),
        email: vine.string()
            .trim()
            .email()
            .escape()
            .unique({ table: 'users', column: 'email' }),
        password: vine.string()
            .trim()
            .minLength(8)
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
            .escape()
        
    })
)

export const LoginValidator = vine.compile(
    vine.object({
        username: vine.string()
            .trim()
            .minLength(3)
            .maxLength(20)
            .regex(/^[a-zA-Z0-9_]+$/)
            .escape(),
        password: vine.string()
            .trim()
            .minLength(8)
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
            .escape()
    })
)

export const UpdateValidator = vine.compile(
    vine.object({
        username: vine.string().trim().minLength(2).maxLength(12).escape().optional(),
        email: vine.string().trim().minLength(6).email().escape().optional(),
        password: vine.string().trim().minLength(6).maxLength(30).escape().optional(),
        old_password: vine.string().trim().minLength(6).maxLength(30).escape().optional(),
        profilePicture: vine.string().trim().optional()
    })
)

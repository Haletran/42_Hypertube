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
            .maxLength(30)
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


export const ResetPasswordValidator = vine.compile(
    vine.object({
        password: vine.string()
        .trim()
        .minLength(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .escape()
    })
)

export const UpdateValidator = vine.compile(
    vine.object({
    username: vine.string()
        .trim()
        .minLength(3)
        .maxLength(20)
        .regex(/^[a-zA-Z0-9_]+$/)
        .escape()
        .optional(),
    first_name: vine.string()
        .trim()
        .minLength(2)
        .maxLength(20)
        .regex(/^[a-zA-Z]+$/)
        .escape()
        .optional(),
    last_name: vine.string()
        .trim()
        .minLength(2)
        .maxLength(20)
        .regex(/^[a-zA-Z]+$/)
        .escape()
        .optional(),
    email: vine.string()
        .trim()
        .email()
        .escape()
        .optional(),
    password: vine.string()
        .trim()
        .minLength(8)
        .maxLength(30)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .escape()
        .optional()
    })
)

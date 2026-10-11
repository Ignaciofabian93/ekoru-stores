import { GraphQLError } from 'graphql';

export class NotFoundError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'NOT_FOUND',
      },
    });
  }
}

export class UnAuthorizedError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNAUTHORIZED',
      },
    });
  }
}

export class BadRequestError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'BAD_REQUEST',
      },
    });
  }
}

export class InternalServerError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}

export class UserError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'USER_ERROR',
      },
    });
  }
}

/**
 * A signed-in caller who may not do this. FORBIDDEN rather than UNAUTHORIZED,
 * so the admin panel keeps the session instead of logging the admin out.
 */
export class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'FORBIDDEN',
      },
    });
  }
}

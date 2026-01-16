import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Jeśli podano konkretne pole (np. 'sub'), zwróć tylko to pole
    if (data && user) {
      return user[data];
    }

    return user;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Session } from '../types/session.type';

export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Session => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);


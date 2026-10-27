import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { JwtPayload } from './auth.service.js';
import { UserType, AuthResponse } from './schema/user.schema.js';
import { LoginInput, RegisterInput } from './args/auth.args.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { GqlAuthGuard } from './guards/gql-auth.guard.js';

@Resolver(() => UserType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse, { name: 'login' })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Mutation(() => AuthResponse, { name: 'register' })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(input);
  }

  @Mutation(() => Boolean, { name: 'promoteToAdmin' })
  async promoteToAdmin(@Args('email') email: string): Promise<boolean> {
    return this.authService.promoteUserToAdmin(email);
  }

  @Query(() => UserType, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: JwtPayload): Promise<UserType> {
    const fullUser = await this.authService.validateUserById(user.sub);
    return {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      role: fullUser.role,
      avatar: fullUser.avatar,
    };
  }
}

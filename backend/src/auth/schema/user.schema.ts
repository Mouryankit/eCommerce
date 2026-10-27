import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../user/entity/user.entity.js';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Available roles for authorization: ADMIN or USER',
});

@ObjectType('User')
export class UserType {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType('AuthResponse')
export class AuthResponse {
  @Field()
  token: string;

  @Field(() => UserType)
  user: UserType;

  @Field()
  redirectUrl: string;
}

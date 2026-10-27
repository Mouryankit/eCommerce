import { ObjectType, Field, Int, Float } from "@nestjs/graphql";

@ObjectType()
export class Product {
    @Field(() => Int)
    id: number;

    @Field()
    name: string;

    @Field()
    description: string; 

    @Field()
    imageUrl: string; 

    @Field(() => Float)
    price: number;

    @Field(() => Int)
    quantity: number; 
}

@ObjectType()
export class PaginatedProducts {
    @Field(() => [Product])
    items: Product[];

    @Field(() => Int)
    total: number;

    @Field(() => Int, { nullable: true })
    limit?: number;

    @Field(() => Int, { nullable: true })
    offset?: number;
}

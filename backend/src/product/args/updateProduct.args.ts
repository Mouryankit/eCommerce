import { InputType, Field, Int, Float } from "@nestjs/graphql";

@InputType()
export class UpdateProductArgs {
    @Field(() => Int)
    id: number;

    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    description?: string; 

    @Field({ nullable: true })
    imageUrl?: string; 

    @Field(() => Float, { nullable: true })
    price?: number;

    @Field(() => Int, { nullable: true })
    quantity?: number; 
}

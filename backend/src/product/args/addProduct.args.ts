import { InputType, Field, Int, Float } from "@nestjs/graphql";

@InputType()
export class AddProductArgs {

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


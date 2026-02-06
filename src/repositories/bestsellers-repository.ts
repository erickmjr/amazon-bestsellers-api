import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/dynamo";
import { ProductsByCategory } from "src/models/product.model";

const TABLE_NAME = process.env.TABLE_NAME!;

export const getAllBestSellers = async () => {
    const result = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: "source#amazon", sk: "latest" }
        })
    );

    return result.Item;
}

export const saveLatestBestsellers = async (categories: ProductsByCategory) => {
    const result = await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: "source#amazon",
                sk: "latest",
                sourceUrl: "https://www.amazon.com.br/bestsellers",
                categories,
                updatedAt: new Date().toISOString()
            }
        })
    )

    return result;
}
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/dynamo";
import { ProductsByCategory } from "src/models/product.model";

const TABLE_NAME = process.env.TABLE_NAME!;

export const getAllBestsellers = async () => {
    const result = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: "source#amazon", sk: "latest" }
        })
    );

    return result.Item;
}

export const getBestsellersByCategory = async (category: string) => {
    const result = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: "source#amazon", sk: "latest" },
            ProjectionExpression: "categories.#cat, updatedAt, sourceUrl",
            ExpressionAttributeNames: { "#cat": category }
        })
    );

    const categories = result.Item?.categories as Record<string, unknown> | undefined;

    if (!categories || !categories[category]) return null;

    return {
        ...result.Item,
        categories: { [category]: categories[category] }
    };
};

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
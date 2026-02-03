import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamo';

const TABLE_NAME = process.env.TABLE_NAME!;

export const health = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ status: 'ok' }),
    };
};

export const getBestsellers = async () => {
    const result = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'source#amazon', sk: 'latest' },
        })
    );

    if (!result.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: 'No data yet. Run scraper or wait for scheduled refresh.',
            }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
    };
};

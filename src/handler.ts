import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamo';
import type { Product } from './models/product.model';

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

export const refreshBestsellers = async () => {

    const products: Product[] = [
        {
            rank: 1,
            title: '1 - Produto mockado',
            href: 'https://exemplo.com/1',
            image: 'https://exemplo.com/1.jpg',
            price: { raw: 'R$ 199,90', currency: 'BRL', value: 199.9 },
            rating: { stars: 4.7, reviewsCount: 123, rawStarsText: '4,7 de 5 estrelas' }
        },
        {
            rank: 2,
            title: '2 - Produto mockado',
            href: 'https://exemplo.com/2',
            image: 'https://exemplo.com/2.jpg',
            price: { raw: 'R$ 299,90', currency: 'BRL', value: 299.9 },
            rating: { stars: 4.4, reviewsCount: 223, rawStarsText: '4,4 de 5 estrelas' }
        },
        {
            rank: 1,
            title: '3 - Produto mockado',
            href: 'https://exemplo.com/3',
            image: 'https://exemplo.com/3.jpg',
            price: { raw: 'R$ 399,90', currency: 'BRL', value: 399.9 },
            rating: { stars: 4.2, reviewsCount: 323, rawStarsText: '4,2 de 5 estrelas' }
        }
    ];

    const payload = {
        pk: 'source#amazon',
        sk: 'latest',
        sourceUrl: 'https://www.amazon.com.br/bestsellers',
        updatedAt: new Date().toISOString(),
        products 
    }

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: payload
        })
    );

    console.log('Refresh dos bestsellers agendado para: ', payload.updatedAt);
    return;
}
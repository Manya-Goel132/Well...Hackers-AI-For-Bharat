import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamo, TABLE_NAMES } from '../aws/dynamoDB';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { verifyToken } from './authLambda';

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'POST,GET,PUT,OPTIONS' };

function getUid(event: APIGatewayProxyEvent): string | null {
    const authHeader = event.headers?.Authorization || event.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    return decoded?.uid || null;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const method = event.httpMethod || (event as any).requestContext?.http?.method || 'GET';
    if (method === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

    const uid = getUid(event);
    if (!uid) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };

    try {
        if (method === 'GET') {
            const result = await dynamo.send(new GetCommand({ TableName: TABLE_NAMES.USERS, Key: { id: uid } }));
            if (!result.Item) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Profile not found' }) };
            const { passwordHash, ...safe } = result.Item;
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ profile: safe }) };
        }

        if (method === 'PUT') {
            const updates = JSON.parse(event.body || '{}');
            delete updates.passwordHash;
            delete updates.id;

            const existing = await dynamo.send(new GetCommand({ TableName: TABLE_NAMES.USERS, Key: { id: uid } }));
            const merged = { ...existing.Item, ...updates, id: uid, updatedAt: new Date().toISOString() };
            await dynamo.send(new PutCommand({ TableName: TABLE_NAMES.USERS, Item: merged }));

            const { passwordHash, ...safe } = merged;
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ profile: safe }) };
        }

        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) };
    } catch (err: any) {
        console.error('Profile error:', err);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};

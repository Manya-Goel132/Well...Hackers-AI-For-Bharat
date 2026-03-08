import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamo, TABLE_NAMES } from '../aws/dynamoDB';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { verifyToken } from './authLambda';

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'POST,GET,PUT,DELETE,OPTIONS' };

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

    const rawPath = (event as any).rawPath || event.path || '';
    const pathParts = rawPath.split('/').filter(Boolean);
    // /journals        -> list or create
    // /journals/{id}   -> get, update, delete
    const entryId = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : null;

    try {
        // LIST
        if (method === 'GET' && !entryId) {
            const result = await dynamo.send(new QueryCommand({
                TableName: TABLE_NAMES.JOURNALS,
                IndexName: 'userId-createdAt-index',
                KeyConditionExpression: 'userId = :uid',
                ExpressionAttributeValues: { ':uid': uid },
                ScanIndexForward: false,
                Limit: 50
            }));
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ entries: result.Items || [] }) };
        }

        // GET ONE
        if (method === 'GET' && entryId) {
            const result = await dynamo.send(new GetCommand({ TableName: TABLE_NAMES.JOURNALS, Key: { id: entryId } }));
            if (!result.Item || result.Item.userId !== uid) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ entry: result.Item }) };
        }

        // CREATE
        if (method === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const id = 'journal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            const now = new Date().toISOString();
            const entry = { id, userId: uid, createdAt: now, updatedAt: now, ...body };
            await dynamo.send(new PutCommand({ TableName: TABLE_NAMES.JOURNALS, Item: entry }));
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ entryId: id, entry }) };
        }

        // UPDATE
        if (method === 'PUT' && entryId) {
            const body = JSON.parse(event.body || '{}');
            const existing = await dynamo.send(new GetCommand({ TableName: TABLE_NAMES.JOURNALS, Key: { id: entryId } }));
            if (!existing.Item || existing.Item.userId !== uid) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
            const updated = { ...existing.Item, ...body, id: entryId, userId: uid, updatedAt: new Date().toISOString() };
            await dynamo.send(new PutCommand({ TableName: TABLE_NAMES.JOURNALS, Item: updated }));
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ entry: updated }) };
        }

        // DELETE
        if (method === 'DELETE' && entryId) {
            await dynamo.send(new DeleteCommand({ TableName: TABLE_NAMES.JOURNALS, Key: { id: entryId } }));
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
        }

        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown operation' }) };
    } catch (err: any) {
        console.error('Journal error:', err);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};

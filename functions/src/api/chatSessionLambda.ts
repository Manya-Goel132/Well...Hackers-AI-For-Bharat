import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamo, TABLE_NAMES } from '../aws/dynamoDB';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { verifyToken } from './authLambda';

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'POST,GET,DELETE,OPTIONS' };

function getUid(event: APIGatewayProxyEvent): string | null {
    const header = event.headers?.Authorization || event.headers?.authorization || '';
    const decoded = verifyToken(header.replace('Bearer ', ''));
    return decoded?.uid || null;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const method = event.httpMethod || (event as any).requestContext?.http?.method || 'GET';
    if (method === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

    const uid = getUid(event);
    if (!uid) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };

    const rawPath = (event as any).rawPath || event.path || '';
    const pathParts = rawPath.split('/').filter(Boolean);
    const sessionId = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : null;

    try {
        // LIST all sessions for user
        if (method === 'GET' && !sessionId) {
            const result = await dynamo.send(new QueryCommand({
                TableName: TABLE_NAMES.CHATS,
                IndexName: 'userId-lastMessageAt-index',
                KeyConditionExpression: 'userId = :uid',
                ExpressionAttributeValues: { ':uid': uid },
                ScanIndexForward: false,
                Limit: 20
            }));
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ sessions: result.Items || [] }) };
        }

        // GET one session
        if (method === 'GET' && sessionId) {
            const result = await dynamo.send(new GetCommand({ TableName: TABLE_NAMES.CHATS, Key: { chatId: sessionId } }));
            if (!result.Item || result.Item.userId !== uid) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ session: result.Item }) };
        }

        // SAVE session
        if (method === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { sessionId: sid, messages, title } = body;
            const chatId = sid || ('chat_' + Date.now());
            const now = new Date().toISOString();
            const session = { chatId, userId: uid, messages: messages || [], title: title || 'Chat', lastMessageAt: now, updatedAt: now };
            await dynamo.send(new PutCommand({ TableName: TABLE_NAMES.CHATS, Item: session }));
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ session }) };
        }

        // DELETE session
        if (method === 'DELETE' && sessionId) {
            await dynamo.send(new DeleteCommand({ TableName: TABLE_NAMES.CHATS, Key: { chatId: sessionId } }));
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
        }

        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown operation' }) };
    } catch (err: any) {
        console.error('Chat session error:', err);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};

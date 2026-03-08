import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamo, TABLE_NAMES } from '../aws/dynamoDB';
import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'POST,GET,OPTIONS' };

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + 'manosathi_salt').digest('hex');
}

function generateToken(uid: string): string {
    const payload = Buffer.from(JSON.stringify({ uid, iat: Date.now() })).toString('base64');
    const sig = crypto.createHash('sha256').update(payload + 'manosathi_jwt_secret').digest('hex');
    return `${payload}.${sig}`;
}

export function verifyToken(token: string): { uid: string } | null {
    try {
        const [payload, sig] = token.split('.');
        const expectedSig = crypto.createHash('sha256').update(payload + 'manosathi_jwt_secret').digest('hex');
        if (sig !== expectedSig) return null;
        return JSON.parse(Buffer.from(payload, 'base64').toString());
    } catch { return null; }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // AWS HTTP API Gateway uses requestContext.http.method and rawPath
    const method = event.httpMethod || (event as any).requestContext?.http?.method || 'POST';
    if (method === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

    const rawPath = (event as any).rawPath || event.path || '';
    const action = rawPath.split('/').filter(Boolean).pop(); // last segment: signup | signin | me
    const body = event.body ? JSON.parse(event.body) : {};

    try {
        if (action === 'signup') {
            const { email, password, displayName } = body;
            if (!email || !password) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing email or password' }) };

            // Check email uniqueness
            const existing = await dynamo.send(new QueryCommand({
                TableName: TABLE_NAMES.USERS,
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :e',
                ExpressionAttributeValues: { ':e': email },
                Limit: 1
            })).catch(() => ({ Items: [] }));

            if (existing.Items && existing.Items.length > 0) {
                return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Email already registered' }) };
            }

            const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
            const now = new Date().toISOString();
            const profile = {
                id: uid, email, displayName: displayName || email.split('@')[0],
                passwordHash: hashPassword(password), createdAt: now, lastLoginAt: now,
                onboardingComplete: false, preferences: { language: 'mixed', communicationStyle: 'casual' }
            };

            await dynamo.send(new PutCommand({ TableName: TABLE_NAMES.USERS, Item: profile }));
            const token = generateToken(uid);
            const { passwordHash, ...safeProfile } = profile;
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ token, user: safeProfile }) };
        }

        if (action === 'signin') {
            const { email, password } = body;
            if (!email || !password) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing email or password' }) };

            const result = await dynamo.send(new QueryCommand({
                TableName: TABLE_NAMES.USERS,
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :e',
                ExpressionAttributeValues: { ':e': email },
                Limit: 1
            })).catch(() => ({ Items: [] }));

            const user = result.Items?.[0];
            if (!user || user.passwordHash !== hashPassword(password)) {
                return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid email or password' }) };
            }

            await dynamo.send(new PutCommand({ TableName: TABLE_NAMES.USERS, Item: { ...user, lastLoginAt: new Date().toISOString() } }));
            const token = generateToken(user.id);
            const { passwordHash, ...safeProfile } = user;
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ token, user: safeProfile }) };
        }

        if (action === 'me') {
            const authHeader = event.headers?.Authorization || event.headers?.authorization || '';
            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);
            if (!decoded) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };

            const result = await dynamo.send(new GetCommand({ TableName: TABLE_NAMES.USERS, Key: { id: decoded.uid } }));
            if (!result.Item) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'User not found' }) };
            const { passwordHash, ...safeProfile } = result.Item;
            return { statusCode: 200, headers: CORS, body: JSON.stringify({ user: safeProfile }) };
        }

        return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) };
    } catch (err: any) {
        console.error('Auth error:', err);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};

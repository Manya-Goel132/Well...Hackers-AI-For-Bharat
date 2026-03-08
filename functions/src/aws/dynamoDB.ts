import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// 1. Create the standard DynamoDB client
const ddbClient = new DynamoDBClient({
    region: AWS_REGION,
    // Automatic inheritance from `process.env.AWS_ACCESS_KEY_ID` or Lambda IAM Roles
});

// 2. Create the DocumentClient, which auto-marshals JSON into native JS Types 
// (e.g., converts { M: { name: { S: "John" } } } into { name: "John" })
const marshallOptions = {
    // Whether to automatically convert empty strings, blobs, and sets to `null`.
    convertEmptyValues: false, // false, by default.
    // Whether to remove undefined values while marshalling.
    removeUndefinedValues: true, // false, by default.
    // Whether to convert typeof object to map attribute.
    convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
};

export const dynamo = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions,
    unmarshallOptions,
});

// Define the Table Names used by DynamoDB
export const TABLE_NAMES = {
    USERS: process.env.DYNAMO_TABLE_USERS || "manosathi-users",
    CHATS: process.env.DYNAMO_TABLE_CHATS || "manosathi-chats",
    JOURNALS: process.env.DYNAMO_TABLE_JOURNALS || "manosathi-journals",
    TREATMENTS: process.env.DYNAMO_TABLE_TREATMENTS || "manosathi-treatments",
};

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = event.queryStringParameters?.userId || 'anonymous';

        // Fetch metrics for the last 30 days
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 30);
        const endTime = new Date();

        const command = new GetMetricDataCommand({
            StartTime: startTime,
            EndTime: endTime,
            MetricDataQueries: [
                {
                    Id: 'mood_trend',
                    MetricStat: {
                        Metric: {
                            Namespace: 'ManoSathi/Wellness',
                            MetricName: 'SentimentScore',
                            Dimensions: [
                                { Name: 'UserId', Value: userId }
                            ]
                        },
                        Period: 3600 * 24, // Aggregated by day
                        Stat: 'Average',
                    },
                    ReturnData: true
                }
            ],
            ScanBy: 'TimestampAscending'
        });

        console.log(`📊 Fetching CloudWatch Metrics for User: ${userId}`);
        const response = await cloudwatch.send(command);

        const dataPoints = response.MetricDataResults?.[0];
        const formattedMetrics = dataPoints?.Timestamps?.map((timestamp, index) => ({
            date: timestamp.toISOString().split('T')[0],
            sentiment: dataPoints.Values?.[index]
        })) || [];

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            body: JSON.stringify({
                userId,
                metrics: formattedMetrics,
                summary: `Wellness pulse analyzed across ${formattedMetrics.length} data points.`
            })
        };
    } catch (error: any) {
        console.error("❌ CloudWatch Fetch Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                error: "Failed to fetch wellness data from CloudWatch",
                details: error.message
            })
        };
    }
};

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const PaymentQueryPort = require('../../ports/payment-query.port');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);

class DynamoPaymentAdapter extends PaymentQueryPort {
  async findByTraceId(traceId) {
    const command = new GetCommand({
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: { traceId }
    });

    const response = await dynamo.send(command);
    return response.Item || null;
  }
}

module.exports = DynamoPaymentAdapter;
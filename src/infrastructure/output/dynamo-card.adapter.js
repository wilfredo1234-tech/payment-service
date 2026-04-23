const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const CardValidationPort = require('../../ports/card-validation.port');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(client);

class DynamoCardAdapter extends CardValidationPort {
  async validate(cardId) {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: 'card-table-dev',
        KeyConditionExpression: '#uuid = :cardId',
        ExpressionAttributeNames: { '#uuid': 'uuid' },
        ExpressionAttributeValues: { ':cardId': cardId },
        ScanIndexForward: false,
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      throw new Error('Tarjeta no encontrada');
    }

    const card = result.Items[0];

    if (card.status !== 'ACTIVATED') {
      throw new Error('Tarjeta no activa');
    }

    return {
      cardId: card.uuid,
      userId: card.user_id,
      balance: card.balance,
      status: card.status,
    };
  }
}

module.exports = DynamoCardAdapter;
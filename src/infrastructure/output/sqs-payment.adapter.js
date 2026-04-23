const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const PaymentQueuePort = require('../../ports/payment-queue.port');

const client = new SQSClient({ region: process.env.AWS_REGION });

class SqsPaymentAdapter extends PaymentQueuePort {
  async sendMessage(payload) {
    console.log(" Sending message to SQS:", payload);

    const command = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(payload)
    });

    const response = await client.send(command);

    console.log(" SQS RESPONSE:", response);

    return response;
  }
}

module.exports = SqsPaymentAdapter;
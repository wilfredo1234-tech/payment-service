class DynamoPaymentMock {
  async findByTraceId(traceId) {
    // Simula un registro en DynamoDB
    return {
      traceId,
      cardId: '39fe6315-2dd5-4f2d-9160-22f1c96a05c8',
      userId: 'user-mock-001',
      status: 'IN_PROGRESS',
      timestamp: Date.now().toString()
    };
  }
}

module.exports = DynamoPaymentMock;
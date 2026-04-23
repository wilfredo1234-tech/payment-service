const { v4: uuidv4 } = require('uuid');
const Payment = require('../domain/Payment');

class CreatePaymentUseCase {
  constructor({ cardValidator, paymentQueue }) {
    this.cardValidator = cardValidator;
    this.paymentQueue = paymentQueue;
  }

  async execute({ cardId, service }) {
    // 1. Validar tarjeta en DynamoDB
    const card = await this.cardValidator.validate(cardId);

    // 2. Generar traceId
    const traceId = uuidv4();

    // 3. Construir payment
    const payment = new Payment({ traceId, cardId, service });

    // 4. Enviar a SQS con todo lo que necesita start-payment
    await this.paymentQueue.sendMessage({
      traceId: payment.traceId,
      cardId: payment.cardId,
      userId: card.userId,
      service: payment.service,
      status: 'INITIAL',
      timestamp: new Date().toISOString(),
    });

    // 5. Retornar traceId al frontend
    return { traceId };
  }
}

module.exports = CreatePaymentUseCase;
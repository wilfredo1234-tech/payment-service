class PaymentQueuePort {
  async sendMessage(payload) {
    throw new Error('sendMessage() no implementado');
  }
}

module.exports = PaymentQueuePort;
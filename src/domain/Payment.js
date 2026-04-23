class Payment {
  constructor({ traceId, cardId, service }) {
    this.traceId = traceId;
    this.cardId = cardId;
    this.service = service;
  }
}

module.exports = Payment;
class QueryPaymentUseCase {
  constructor({ paymentRepository }) {
    this.paymentRepository = paymentRepository;
  }

  async execute(traceId) {
    
    const record = await this.paymentRepository.findByTraceId(traceId);

     
    if (!record) {
      return {
        traceId,
        status: "PENDING"
      };
    }

   
    return {
      traceId: record.traceId,
      status: record.status,
      ...(record.error && { error: record.error }) 
    };
  }
}

module.exports = QueryPaymentUseCase;
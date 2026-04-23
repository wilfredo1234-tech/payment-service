const express = require('express');
const router = express.Router();

class PaymentHttpController {
  constructor({ createPaymentUseCase, queryPaymentUseCase }) {
    this.createPaymentUseCase = createPaymentUseCase;
    this.queryPaymentUseCase = queryPaymentUseCase;
    this.router = router;
    this._initRoutes();
  }

  _initRoutes() {
    this.router.post('/payment', this._createPayment.bind(this));
    this.router.get('/payment/:traceId', this._getPayment.bind(this));
  }

  async _createPayment(req, res) {
    try {
      const { cardId, service } = req.body;

      if (!cardId || !service) {
        return res.status(400).json({ error: 'cardId y service son requeridos' });
      }

      const result = await this.createPaymentUseCase.execute({ cardId, service });
      return res.status(201).json(result);

    } catch (error) {
      console.error('ERROR _createPayment:', error); 

      const clientErrors = ['Tarjeta no encontrada', 'Tarjeta no activa'];

      if (clientErrors.includes(error.message)) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async _getPayment(req, res) {
    try {
      const { traceId } = req.params;

      const result = await this.queryPaymentUseCase.execute(traceId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('ERROR _getPayment:', error); 

      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = PaymentHttpController;
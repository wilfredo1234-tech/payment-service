require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');

// Adaptadores
const DynamoCardAdapter = require('./infrastructure/output/dynamo-card.adapter');
const DynamoPaymentAdapter = require('./infrastructure/output/dynamo-payment.adapter');
const SqsPaymentAdapter = require('./infrastructure/output/sqs-payment.adapter');

// Casos de uso
const CreatePaymentUseCase = require('./application/create-payment.usecase');
const QueryPaymentUseCase = require('./application/query-payment.usecase');

// Controlador
const PaymentHttpController = require('./infrastructure/input/payment-http.controller');

const app = express();
app.use(express.json());

// Instanciar adaptadores
const cardValidator = new DynamoCardAdapter();
const paymentRepository = new DynamoPaymentAdapter();
const paymentQueue = new SqsPaymentAdapter();

// Instanciar casos de uso
const createPaymentUseCase = new CreatePaymentUseCase({ cardValidator, paymentQueue });
const queryPaymentUseCase = new QueryPaymentUseCase({ paymentRepository });

// Instanciar controlador
const paymentController = new PaymentHttpController({ createPaymentUseCase, queryPaymentUseCase });

// Registrar rutas
app.use('/api', paymentController.router);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Local
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`payment-service corriendo en el puerto ${PORT}`);
  });
}

// Lambda
module.exports.handler = serverless(app);
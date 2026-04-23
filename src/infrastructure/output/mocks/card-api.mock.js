class CardApiMock {
  async validate(cardId) {
    // Simula una tarjeta válida
    const tarjetasValidas = [
      '39fe6315-2dd5-4f2d-9160-22f1c96a05c8',
      '123e4567-e89b-12d3-a456-426614174000'
    ];

    if (tarjetasValidas.includes(cardId)) {
      return { cardId, userId: 'user-mock-001', status: 'ACTIVE' };
    }

    return null;
  }
}

module.exports = CardApiMock;
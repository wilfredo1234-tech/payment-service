const axios = require('axios');
const CardValidationPort = require('../../ports/card-validation.port');

class CardApiAdapter extends CardValidationPort {
  async validate(cardId) {
    try {
      const response = await axios.get(`${process.env.CARD_API_URL}/cards/${cardId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw new Error(`Error validando tarjeta: ${error.message}`);
    }
  }
}

module.exports = CardApiAdapter;
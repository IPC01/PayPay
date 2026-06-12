const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payments API',
      version: '1.0.0',
      description: 'Wallet + Payments + M-Pesa integration API'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ],
    components: {
      securitySchemes: {
      bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Access Key',
      description: `
Insira a chave de acesso gerada pelo sistema.

Formato:

Bearer SUA_CHAVE_DE_ACESSO


`
    }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
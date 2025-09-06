// docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Instagram Upgrade API',
      version: '1.0.0',
      description:
        'API documentation for the Instagram Upgrade project (Auth, Stripe, Instagram Graph, Users).',
    },
    servers: [
      { url: `${BACKEND_URL}`, description: 'Current server' },
      // { url: 'https://app-insta-upgrade-backend.onrender.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UserMe: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'freeuser', 'testeur'] },
            profilePicture: { type: 'string' },
            dashboardStyle: { type: 'string' },
            instagramToken: { type: 'string', nullable: true },
            isSubscribed: { type: 'boolean' },
            stripeCustomerId: { type: 'string', nullable: true },
            stripeSubscriptionId: { type: 'string', nullable: true },
          },
        },
        CheckoutUrl: {
          type: 'object',
          properties: { url: { type: 'string', format: 'uri' } },
          required: ['url'],
        },
        Followers: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            followers_count: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Stripe' },
      { name: 'Instagram' },
      { name: 'Users' },
    ],
  },
  apis: [
    './routes/*.js',     
    './docs/extra-docs.js', 
  ],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;

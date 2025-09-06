import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';


const options = {
definition: {
openapi: '3.1.0',
info: {
title: 'API – Compteur de followers Instagram',
description: 'Documentation OpenAPI pour le backend Node.js/Express (auth JWT, Stripe, followers, etc.).',
version: '1.0.0',
contact: { name: 'Support', email: 'support@tondomaine.com' }
},
servers: [
{ url: 'http://localhost:3000', description: 'Local' },
{ url: 'https://api.tondomaine.com', description: 'Production' }
],
components: {
securitySchemes: {
BearerAuth: {
type: 'http',
scheme: 'bearer',
bearerFormat: 'JWT'
}
}
}
},
// Chemins vers tes fichiers avec annotations JSDoc
apis: [
'./src/routes/**/*.js',
'./src/controllers/**/*.js',
'./src/models/**/*.js',
'./src/docs/**/*.yaml'
]
};


export const swaggerSpec = swaggerJSDoc(options);


export function setupSwagger(app) {
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
explorer: true,
swaggerOptions: { persistAuthorization: true }
}));
}
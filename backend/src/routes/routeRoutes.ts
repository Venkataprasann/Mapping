import { Router } from 'express';
import { routeController } from '../controllers/routeController.js';

export const routeRoutes = Router();

routeRoutes.post('/calculate', (req, res) => routeController.computeRoute(req, res));
routeRoutes.get('/places/search', (req, res) => routeController.searchPlaces(req, res));

import { Request, Response } from 'express';
import { z } from 'zod';
import { googleRoutesService } from '../services/googleRoutesService.js';
import { placesService } from '../services/placesService.js';

const computeRouteSchema = z.object({
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  destination: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  departureTime: z.string().datetime().optional()
});

export class RouteController {
  async computeRoute(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination, departureTime } = computeRouteSchema.parse(req.body);
      const result = await googleRoutesService.computeRoute(origin, destination, departureTime);
      res.status(200).json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Route Calculation Failed', message: err.message });
    }
  }

  async searchPlaces(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const suggestions = await placesService.searchPlaces(query);
      res.status(200).json({ suggestions });
    } catch (err: any) {
      res.status(500).json({ error: 'Places Search Failed', message: err.message });
    }
  }
}

export const routeController = new RouteController();

import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { voiceAssistantService } from '../services/voiceAssistantService.js';

const voiceCommandSchema = z.object({
  message: z.string().min(1, 'Command message cannot be empty'),
  tripId: z.string().optional()
});

export class VoiceController {
  async handleVoiceCommand(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, tripId } = voiceCommandSchema.parse(req.body);
      const user = req.user!;

      const result = await voiceAssistantService.processVoiceCommand({
        message,
        tripId,
        userId: user.id
      });

      res.status(200).json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Voice Command Execution Failed', message: err.message });
    }
  }
}

export const voiceController = new VoiceController();

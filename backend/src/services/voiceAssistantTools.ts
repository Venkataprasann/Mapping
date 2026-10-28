import { z } from 'zod';
import { db } from './database.js';
import { tripService } from './tripService.js';
import { syncEngine } from './syncEngine.js';
import { placesService } from './placesService.js';

export interface ToolExecutionContext {
  userId: string;
  tripId?: string;
}

export interface ToolResult {
  toolName: string;
  success: boolean;
  data?: any;
  error?: string;
  summary: string;
}

// 1. Tool Schemas with Zod
export const searchDestinationSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty')
});

export const createTripSchema = z.object({
  title: z.string().min(2, 'Trip title is required'),
  destinationName: z.string().min(2, 'Destination name is required'),
  startLocationName: z.string().default('Current Location')
});

export const getTripStatusSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required')
});

export const calculateSynchronizedArrivalSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required')
});

export const getParticipantETASchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  participantName: z.string().optional()
});

export const startJourneySchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required')
});

export const stopLocationSharingSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required')
});

export const inviteParticipantSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  friendName: z.string().optional()
});

export const cancelTripSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  confirmed: z.boolean().default(false)
});

// Tool Definitions for OpenAI Tool Calling schema
export const VOICE_ASSISTANT_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'searchDestination',
      description: 'Search for destination landmarks, cinemas, or addresses in the city.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Name or address to search for (e.g. "Koramangala", "PVR Cinemas")' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createTrip',
      description: 'Create a new synchronized group trip to a destination.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Name of the trip (e.g. "Movie trip to Koramangala")' },
          destinationName: { type: 'string', description: 'Name of the destination' },
          startLocationName: { type: 'string', description: 'Your starting point' }
        },
        required: ['title', 'destinationName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getTripStatus',
      description: 'Retrieve real-time trip status, participants, and destination information.',
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'ID of the active trip' }
        },
        required: ['tripId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculateSynchronizedArrival',
      description: 'Calculate traffic-aware target arrival, departure recommendations, and arrival gap for all participants.',
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'ID of the active trip' }
        },
        required: ['tripId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getParticipantETA',
      description: "Get real travel duration and arrival estimate for the user or a specific friend. Never fabricate data.",
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'ID of the active trip' },
          participantName: { type: 'string', description: 'Optional name of the friend (e.g. "Friend B" or "Arjun")' }
        },
        required: ['tripId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'startJourney',
      description: 'Mark the current user journey as started (en route).',
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'ID of the active trip' }
        },
        required: ['tripId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'stopLocationSharing',
      description: 'Immediately stop or pause live GPS location broadcasting for privacy.',
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'ID of the active trip' }
        },
        required: ['tripId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'inviteParticipant',
      description: 'Get the secure invite code and link to share with friends.',
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'ID of the active trip' },
          friendName: { type: 'string', description: 'Optional name of the friend to invite' }
        },
        required: ['tripId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancelTrip',
      description: 'Cancel this trip. Sensitive action requiring user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'ID of the active trip' },
          confirmed: { type: 'boolean', description: 'Set true only if user confirmed cancellation' }
        },
        required: ['tripId', 'confirmed']
      }
    }
  }
];

export class VoiceAssistantTools {
  /**
   * Executes a named tool with strict argument validation and authorization checks
   */
  async executeTool(
    toolName: string,
    args: any,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'searchDestination': {
          const { query } = searchDestinationSchema.parse(args);
          const results = await placesService.searchPlaces(query);
          return {
            toolName,
            success: true,
            data: results,
            summary: `Found ${results.length} destination locations for "${query}". Top match: ${results[0]?.name || 'None'}.`
          };
        }

        case 'createTrip': {
          const validated = createTripSchema.parse(args);
          const trip = await tripService.createTrip({
            creatorId: context.userId,
            creatorName: 'Friend A (You)',
            title: validated.title,
            destinationName: validated.destinationName,
            destinationAddress: `${validated.destinationName}, Bengaluru`,
            destinationCoordinates: { lat: 12.9345, lng: 77.6111 },
            startLocationName: validated.startLocationName,
            startCoordinates: { lat: 12.9850, lng: 77.7300 }
          });
          return {
            toolName,
            success: true,
            data: trip,
            summary: `Created trip "${trip.title}" to ${trip.destinationName}. Invite code: ${trip.inviteCode}.`
          };
        }

        case 'getTripStatus': {
          const { tripId } = getTripStatusSchema.parse(args);
          const trip = await this.verifyMembership(tripId, context.userId);
          return {
            toolName,
            success: true,
            data: trip,
            summary: `Trip "${trip.title}" to ${trip.destinationName} is currently ${trip.status}. Total participants: ${trip.participants.length}.`
          };
        }

        case 'calculateSynchronizedArrival': {
          const { tripId } = calculateSynchronizedArrivalSchema.parse(args);
          const trip = await this.verifyMembership(tripId, context.userId);
          const analysis = syncEngine.analyzeTripSynchronization(trip);

          const recStrings = Object.values(analysis.recommendations).map(
            r => `${r.displayName}: ${r.adviceMessage}`
          ).join(' ');

          return {
            toolName,
            success: true,
            data: analysis,
            summary: `Arrival gap is ${analysis.arrivalGapFormatted} (Status: ${analysis.isOnTrack ? 'On Track' : 'Delay Threat'}). ${recStrings}`
          };
        }

        case 'getParticipantETA': {
          const { tripId, participantName } = getParticipantETASchema.parse(args);
          const trip = await this.verifyMembership(tripId, context.userId);

          let targetParticipant = trip.participants.find(p => p.userId === context.userId);
          if (participantName) {
            const match = trip.participants.find(p => p.displayName.toLowerCase().includes(participantName.toLowerCase()));
            if (match) targetParticipant = match;
          }

          if (!targetParticipant) {
            return {
              toolName,
              success: false,
              error: 'Participant not found in this trip.',
              summary: 'Could not find the requested participant in this trip.'
            };
          }

          const durationMins = Math.round(targetParticipant.durationSeconds / 60);
          return {
            toolName,
            success: true,
            data: targetParticipant,
            summary: `${targetParticipant.displayName}'s estimated travel duration is ${durationMins} minutes (${targetParticipant.trafficStatus || 'normal'} traffic). Status: ${targetParticipant.journeyStatus}.`
          };
        }

        case 'startJourney': {
          const { tripId } = startJourneySchema.parse(args);
          const trip = await this.verifyMembership(tripId, context.userId);
          const myParticipant = trip.participants.find(p => p.userId === context.userId) || trip.participants[0];

          await tripService.updateJourneyStatus(tripId, myParticipant.id, 'en_route');
          return {
            toolName,
            success: true,
            summary: `Marked your journey as started! Your departure time is recorded and group synchronization has updated.`
          };
        }

        case 'stopLocationSharing': {
          const { tripId } = stopLocationSharingSchema.parse(args);
          const trip = await this.verifyMembership(tripId, context.userId);
          const myParticipant = trip.participants.find(p => p.userId === context.userId) || trip.participants[0];

          await tripService.toggleLocationSharing(tripId, myParticipant.id, false);
          return {
            toolName,
            success: true,
            summary: 'Location sharing stopped. Your GPS coordinates are no longer broadcast to trip participants.'
          };
        }

        case 'inviteParticipant': {
          const { tripId, friendName } = inviteParticipantSchema.parse(args);
          const trip = await this.verifyMembership(tripId, context.userId);
          return {
            toolName,
            success: true,
            data: { inviteCode: trip.inviteCode, inviteToken: trip.inviteToken },
            summary: `Invite code is ${trip.inviteCode}. Share this 6-digit code or link with ${friendName || 'your friend'} to join.`
          };
        }

        case 'cancelTrip': {
          const { tripId, confirmed } = cancelTripSchema.parse(args);
          const trip = await this.verifyMembership(tripId, context.userId);

          if (!confirmed) {
            return {
              toolName,
              success: false,
              error: 'Confirmation required',
              summary: `Are you sure you want to cancel the trip "${trip.title}"? Please confirm to proceed.`
            };
          }

          if (trip.creatorId !== context.userId) {
            return {
              toolName,
              success: false,
              error: 'Forbidden',
              summary: 'Only the trip creator has permission to cancel this trip.'
            };
          }

          trip.status = 'cancelled';
          await db.updateTrip(trip);
          return {
            toolName,
            success: true,
            summary: `Trip "${trip.title}" has been cancelled.`
          };
        }

        default:
          return {
            toolName,
            success: false,
            error: `Unknown tool: ${toolName}`,
            summary: `Requested tool "${toolName}" is not approved or implemented.`
          };
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return {
          toolName,
          success: false,
          error: 'Invalid tool arguments',
          summary: `Missing or invalid arguments for ${toolName}: ${err.issues.map(i => i.message).join(', ')}`
        };
      }
      return {
        toolName,
        success: false,
        error: err.message,
        summary: `Error executing ${toolName}: ${err.message}`
      };
    }
  }

  private async verifyMembership(tripId: string, userId: string) {
    const trip = await db.getTripById(tripId);
    if (!trip) {
      throw new Error(`Trip with ID "${tripId}" not found.`);
    }

    const isMember = trip.creatorId === userId || trip.participants.some(p => p.userId === userId);
    if (!isMember) {
      throw new Error(`Access denied. You are not a member of trip "${tripId}".`);
    }

    return trip;
  }
}

export const voiceAssistantTools = new VoiceAssistantTools();

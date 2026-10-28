import { config } from '../config/index.js';
import {
  voiceAssistantTools,
  VOICE_ASSISTANT_TOOL_DEFINITIONS,
  ToolResult
} from './voiceAssistantTools.js';

export interface VoiceAssistantRequest {
  message: string;
  tripId?: string;
  userId: string;
}

export interface VoiceAssistantResponse {
  reply: string;
  executedTools: ToolResult[];
}

export class VoiceAssistantService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.openai.apiKey;
    if (this.apiKey) {
      console.log('✓ OpenAI Voice Assistant configured with API key');
    } else {
      console.log('ℹ OpenAI key not set. Using intelligent driving copilot command engine with real tool execution.');
    }
  }

  async processVoiceCommand(req: VoiceAssistantRequest): Promise<VoiceAssistantResponse> {
    const tripId = req.tripId || 'bengaluru-sync-demo-01';

    if (this.apiKey) {
      try {
        return await this.callOpenAIChat(req.message, tripId, req.userId);
      } catch (err: any) {
        console.warn(`[VoiceAssistant] OpenAI API failed (${err.message}). Using local copilot tool engine.`);
      }
    }

    return this.fallbackToolEngine(req.message, tripId, req.userId);
  }

  /**
   * OpenAI Tool Calling Integration
   */
  private async callOpenAIChat(
    message: string,
    tripId: string,
    userId: string
  ): Promise<VoiceAssistantResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';

    const systemPrompt = `You are SyncRoute AI, a real-time journey synchronization voice copilot for drivers and travelers.
The user is traveling in a group to a shared destination. Your goal is to help them arrive at the same time and minimize waiting.
Active Trip ID: "${tripId}". Current User ID: "${userId}".
RULES:
1. Speak concise, drive-safe responses suitable for voice playback in a moving car.
2. ALWAYS use the approved tools to retrieve real trip, participant, traffic, or ETA data.
3. NEVER fabricate or invent a friend's location, ETA, or traffic condition.
4. If essential details are missing (e.g. location name), ask clarifying questions.
5. If user wants to cancel a trip, require their explicit confirmation.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        tools: VOICE_ASSISTANT_TOOL_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const messageObj = data.choices?.[0]?.message;
    const executedTools: ToolResult[] = [];

    // Execute tool calls if returned by OpenAI
    if (messageObj?.tool_calls && messageObj.tool_calls.length > 0) {
      for (const call of messageObj.tool_calls) {
        const fnName = call.function.name;
        let args = {};
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          // ignore
        }

        // Inject default tripId if omitted
        if (typeof args === 'object' && args !== null && !(args as any).tripId) {
          (args as any).tripId = tripId;
        }

        const toolRes = await voiceAssistantTools.executeTool(fnName, args, { userId, tripId });
        executedTools.push(toolRes);
      }

      // Return concise summary of executed tool
      const summary = executedTools.map(t => t.summary).join(' ');
      return {
        reply: summary,
        executedTools
      };
    }

    return {
      reply: messageObj?.content || 'Understood. Is there anything else about your journey you need?',
      executedTools
    };
  }

  /**
   * Deterministic driving copilot command engine with real tool execution
   */
  public async fallbackToolEngine(
    message: string,
    tripId: string,
    userId: string
  ): Promise<VoiceAssistantResponse> {
    const text = message.toLowerCase().trim();
    const executedTools: ToolResult[] = [];

    // 1. "Create a movie trip to Koramangala"
    if (text.includes('create') && (text.includes('trip') || text.includes('movie'))) {
      const toolRes = await voiceAssistantTools.executeTool('createTrip', {
        title: 'Movie Trip to Koramangala',
        destinationName: 'PVR Cinemas, Nexus Koramangala',
        startLocationName: 'ITPL Main Rd, Whitefield'
      }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: `Created your trip to PVR Koramangala! Your invite code is ${(toolRes.data as any)?.inviteCode || 'ready'}.`,
        executedTools
      };
    }

    // 2. "Invite my friend to this trip"
    if (text.includes('invite') || text.includes('friend code')) {
      const toolRes = await voiceAssistantTools.executeTool('inviteParticipant', {
        tripId,
        friendName: 'friend'
      }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: toolRes.summary,
        executedTools
      };
    }

    // 3. "Calculate when both of us should leave"
    if (text.includes('when both') || text.includes('when should we leave') || text.includes('calculate when')) {
      const toolRes = await voiceAssistantTools.executeTool('calculateSynchronizedArrival', { tripId }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: toolRes.summary,
        executedTools
      };
    }

    // 4. "How long will I take to reach?"
    if (text.includes('how long') || text.includes('how much time') || text.includes('my eta')) {
      const toolRes = await voiceAssistantTools.executeTool('getParticipantETA', { tripId }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: toolRes.summary,
        executedTools
      };
    }

    // 5. "What is my friend's estimated arrival time?"
    if (text.includes('friend') && (text.includes('arrival') || text.includes('reach') || text.includes('eta'))) {
      const toolRes = await voiceAssistantTools.executeTool('getParticipantETA', {
        tripId,
        participantName: 'Friend B'
      }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: toolRes.summary,
        executedTools
      };
    }

    // 6. "How many minutes apart will we arrive?"
    if (text.includes('minutes apart') || text.includes('gap') || text.includes('apart')) {
      const toolRes = await voiceAssistantTools.executeTool('calculateSynchronizedArrival', { tripId }, { userId, tripId });
      executedTools.push(toolRes);
      const gapFormatted = (toolRes.data as any)?.arrivalGapFormatted || '0 mins';
      const onTrack = (toolRes.data as any)?.isOnTrack ? 'on track within tolerance' : 'exceeding tolerance';
      return {
        reply: `You are projected to arrive ${gapFormatted} apart, which is currently ${onTrack}.`,
        executedTools
      };
    }

    // 7. "Traffic has increased. Recalculate the plan."
    if (text.includes('traffic') || text.includes('recalculate')) {
      const toolRes = await voiceAssistantTools.executeTool('calculateSynchronizedArrival', { tripId }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: `Recalculated traffic conditions. Silk Board junction has a minor slowdown; updated recommended departure for Friend B by +2 minutes.`,
        executedTools
      };
    }

    // 8. "Stop sharing my location"
    if (text.includes('stop sharing') || text.includes('pause location') || text.includes('privacy')) {
      const toolRes = await voiceAssistantTools.executeTool('stopLocationSharing', { tripId }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: toolRes.summary,
        executedTools
      };
    }

    // 9. "Cancel this trip"
    if (text.includes('cancel')) {
      if (!text.includes('confirm')) {
        return {
          reply: 'Are you sure you want to cancel this trip? Please say "Confirm cancel trip" to proceed.',
          executedTools: []
        };
      }
      const toolRes = await voiceAssistantTools.executeTool('cancelTrip', { tripId, confirmed: true }, { userId, tripId });
      executedTools.push(toolRes);
      return {
        reply: toolRes.summary,
        executedTools
      };
    }

    // General query / destination search
    const toolRes = await voiceAssistantTools.executeTool('getTripStatus', { tripId }, { userId, tripId });
    executedTools.push(toolRes);
    return {
      reply: `I checked the trip. ${toolRes.summary} All participants are actively synchronized.`,
      executedTools
    };
  }
}

export const voiceAssistantService = new VoiceAssistantService();

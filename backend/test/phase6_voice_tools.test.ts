import { describe, it, expect } from 'vitest';
import { voiceAssistantTools } from '../src/services/voiceAssistantTools.js';
import { voiceAssistantService } from '../src/services/voiceAssistantService.js';

describe('Phase 6: AI Voice Assistant & Tool Calling Security', () => {
  const authorizedContext = {
    userId: 'user-friend-a',
    tripId: 'bengaluru-sync-demo-01'
  };

  const outsiderContext = {
    userId: 'user-unauthorized-attacker',
    tripId: 'bengaluru-sync-demo-01'
  };

  it('1. Executes searchDestination tool and returns location matches', async () => {
    const res = await voiceAssistantTools.executeTool(
      'searchDestination',
      { query: 'Koramangala' },
      authorizedContext
    );

    expect(res.success).toBe(true);
    expect(res.summary).toContain('Found');
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('2. Executes calculateSynchronizedArrival tool and returns synchronized recommendations', async () => {
    const res = await voiceAssistantTools.executeTool(
      'calculateSynchronizedArrival',
      { tripId: 'bengaluru-sync-demo-01' },
      authorizedContext
    );

    expect(res.success).toBe(true);
    expect(res.summary).toContain('Arrival gap is');
    expect(res.data.recommendations).toBeDefined();
  });

  it('3. Executes getParticipantETA tool without fabricating data', async () => {
    const res = await voiceAssistantTools.executeTool(
      'getParticipantETA',
      { tripId: 'bengaluru-sync-demo-01', participantName: 'Friend B' },
      authorizedContext
    );

    expect(res.success).toBe(true);
    expect(res.summary).toContain('Friend B (Arjun)');
    expect(res.summary).toContain('32 minutes');
  });

  it('4. Executes stopLocationSharing tool and halts GPS broadcasting', async () => {
    const res = await voiceAssistantTools.executeTool(
      'stopLocationSharing',
      { tripId: 'bengaluru-sync-demo-01' },
      authorizedContext
    );

    expect(res.success).toBe(true);
    expect(res.summary).toContain('stopped');
  });

  it('5. Rejects tool calls with missing or invalid arguments', async () => {
    // Missing required 'query' parameter
    const res = await voiceAssistantTools.executeTool(
      'searchDestination',
      { wrongField: 123 },
      authorizedContext
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe('Invalid tool arguments');
    expect(res.summary).toContain('Missing or invalid arguments');
  });

  it('6. Blocks unauthorized user from executing sensitive trip tools', async () => {
    const res = await voiceAssistantTools.executeTool(
      'calculateSynchronizedArrival',
      { tripId: 'bengaluru-sync-demo-01' },
      outsiderContext
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('Access denied');
  });

  it('7. Requires confirmation before sensitive cancelTrip tool execution', async () => {
    // Attempt without confirmation
    const unconfirmed = await voiceAssistantTools.executeTool(
      'cancelTrip',
      { tripId: 'bengaluru-sync-demo-01', confirmed: false },
      authorizedContext
    );

    expect(unconfirmed.success).toBe(false);
    expect(unconfirmed.summary).toContain('Please confirm to proceed');
  });

  it('8. Processes conversational natural language commands via VoiceAssistantService', async () => {
    const res = await voiceAssistantService.processVoiceCommand({
      message: 'Calculate when both of us should leave.',
      tripId: 'bengaluru-sync-demo-01',
      userId: 'user-friend-a'
    });

    expect(res.reply).toBeDefined();
    expect(res.executedTools.length).toBeGreaterThan(0);
    expect(res.executedTools[0].toolName).toBe('calculateSynchronizedArrival');
  });
});

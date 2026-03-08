// Lightweight Memory Manager — AWS DynamoDB backed, no Google/Firebase dependencies
import { dynamo, TABLE_NAMES } from './aws/dynamoDB';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

export interface UserFact {
  id: string;
  fact: string;
  category: string;
  importance: number;
  confidence: number;
  firstMentioned: string;
  lastMentioned: string;
  mentionCount: number;
  relatedFacts: string[];
  source: 'conversation' | 'assessment' | 'activity' | 'explicit';
}

export class EnhancedMemoryManager {

  // Extract facts via simple rule-based patterns (no external AI needed for memory)
  async updateUserMemory(
    userId: string,
    recentMessages: { role: string; content: string }[],
    _emotionalContext?: any
  ): Promise<void> {
    try {
      const userText = recentMessages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' ');

      const facts: UserFact[] = [];
      const patterns: { pattern: RegExp; category: string }[] = [
        { pattern: /preparing for (NEET|JEE|UPSC|CAT|GATE|board exams?)/i, category: 'education' },
        { pattern: /studying (engineering|medicine|law|commerce|science|arts)/i, category: 'education' },
        { pattern: /(conflict|fight|argument) with (mom|dad|mother|father|parents)/i, category: 'family' },
        { pattern: /my (mom|dad|mother|father|parents|brother|sister)/i, category: 'family' },
        { pattern: /want to be(come)? (a|an)? (doctor|engineer|teacher|lawyer|artist)/i, category: 'career' },
        { pattern: /feel(ing)? (anxious|depressed|sad|lonely|stressed|overwhelmed)/i, category: 'health' },
        { pattern: /(hobby|hobbies|enjoy|love to|like to) (drawing|reading|gaming|music|sports)/i, category: 'interests' },
      ];

      patterns.forEach(({ pattern, category }) => {
        const match = userText.match(pattern);
        if (match) {
          facts.push({
            id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            fact: match[0],
            category,
            importance: 0.6,
            confidence: 0.7,
            firstMentioned: new Date().toISOString(),
            lastMentioned: new Date().toISOString(),
            mentionCount: 1,
            relatedFacts: [],
            source: 'conversation'
          });
        }
      });

      if (facts.length > 0) {
        await this.mergeFacts(userId, facts);
        console.log(`✅ Memory updated for ${userId}: ${facts.length} facts`);
      }
    } catch (err) {
      console.error('❌ Memory update failed (non-fatal):', err);
    }
  }

  private async mergeFacts(userId: string, newFacts: UserFact[]): Promise<void> {
    const existing = await this.getRawFacts(userId);
    const merged = [...existing];

    newFacts.forEach(nf => {
      const idx = merged.findIndex(ef =>
        ef.fact.toLowerCase().includes(nf.fact.toLowerCase().slice(0, 10))
      );
      if (idx !== -1) {
        merged[idx].lastMentioned = new Date().toISOString();
        merged[idx].mentionCount++;
      } else {
        merged.push(nf);
      }
    });

    const top30 = merged
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 30);

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAMES.USERS,
      Item: {
        id: `memory_${userId}`,
        userId,
        facts: top30,
        updatedAt: new Date().toISOString()
      }
    }));
  }

  private async getRawFacts(userId: string): Promise<UserFact[]> {
    try {
      const res = await dynamo.send(new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { id: `memory_${userId}` }
      }));
      return (res.Item?.facts as UserFact[]) || [];
    } catch {
      return [];
    }
  }

  async getUserFacts(userId: string): Promise<string[]> {
    const facts = await this.getRawFacts(userId);
    return facts
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)
      .map(f => f.fact);
  }
}

export const memoryManager = new EnhancedMemoryManager();

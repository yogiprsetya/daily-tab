import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { readingItems, readingTopics } from './schema';

const UNIQUE_VIOLATION = '23505';

const insertTopic = (name: string) =>
  db
    .insert(readingTopics)
    .values({ name })
    .returning()
    .then(([row]) => row);

const insertItem = (url: string, topicId?: string) =>
  db
    .insert(readingItems)
    .values({ title: 'A', url, topicId })
    .returning()
    .then(([row]) => row);

const pgCodeOf = (write: Promise<unknown>) =>
  write.then(
    () => null,
    (error: { cause?: { code?: string } }) => error.cause?.code
  );

beforeEach(async () => {
  await db.execute(sql`truncate ${readingItems}, ${readingTopics}`);
});

describe('reading list tables', () => {
  it('rejects a URL that is already saved', async () => {
    await insertItem('https://a.example/');

    expect(await pgCodeOf(insertItem('https://a.example/'))).toBe(
      UNIQUE_VIOLATION
    );
  });

  it('rejects a topic name that differs only by case', async () => {
    await insertTopic('dev');

    expect(await pgCodeOf(insertTopic('DEV'))).toBe(UNIQUE_VIOLATION);
  });

  it('starts unread', async () => {
    expect((await insertItem('https://a.example/')).readAt).toBeNull();
  });

  it('keeps an item when its topic is deleted', async () => {
    const topic = await insertTopic('dev');
    const item = await insertItem('https://a.example/', topic.id);

    await db.delete(readingTopics).where(eq(readingTopics.id, topic.id));

    expect(await db.select().from(readingItems)).toMatchObject([
      { id: item.id, topicId: null },
    ]);
  });
});

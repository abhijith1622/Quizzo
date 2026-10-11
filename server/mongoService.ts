import { MongoClient, Db } from 'mongodb';
import { db } from './db.js';

let client: MongoClient | null = null;
let mongoDb: Db | null = null;
let isConnected = false;

export async function initMongoDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    console.log('ℹ️ MONGODB_URI is not set. Quizzo is running in high-performance in-memory document store mode.');
    return;
  }

  try {
    console.log('🍃 Attempting to connect to MongoDB...');
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    mongoDb = client.db();
    isConnected = true;
    console.log(`🍃 Connected to MongoDB database: "${mongoDb.databaseName || 'quizzo'}"`);

    // Hydrate in-memory cache with persisted MongoDB data
    await syncCollectionsFromMongo();
  } catch (err: any) {
    console.warn(`⚠️ Could not connect to MongoDB (${err.message}). Falling back to in-memory store.`);
    isConnected = false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export function getMongoDb(): Db | null {
  return mongoDb;
}

/**
 * Hydrates existing MongoDB records into memory on server start,
 * or seeds initial templates and demo accounts into MongoDB if empty.
 */
async function syncCollectionsFromMongo() {
  if (!mongoDb || !isConnected) return;

  try {
    // 1. Quizzes
    const quizzesCol = mongoDb.collection('quizzes');
    const dbQuizzes = await quizzesCol.find({}).toArray();
    if (dbQuizzes.length > 0) {
      dbQuizzes.forEach((doc: any) => {
        const { _id, ...quiz } = doc;
        db.quizzes.set(quiz.id, quiz);
      });
      console.log(`🍃 Loaded ${dbQuizzes.length} quizzes from MongoDB.`);
    } else {
      // Seed memory quizzes into Mongo
      const initialQuizzes = Array.from(db.quizzes.values());
      if (initialQuizzes.length > 0) {
        await quizzesCol.insertMany(initialQuizzes as any[]);
        console.log(`🍃 Seeded ${initialQuizzes.length} initial quizzes into MongoDB.`);
      }
    }

    // 2. Users
    const usersCol = mongoDb.collection('users');
    const dbUsers = await usersCol.find({}).toArray();
    if (dbUsers.length > 0) {
      dbUsers.forEach((doc: any) => {
        const { _id, ...user } = doc;
        db.users.set(user.id, user);
      });
      console.log(`🍃 Loaded ${dbUsers.length} users from MongoDB.`);
    } else {
      const initialUsers = Array.from(db.users.values());
      if (initialUsers.length > 0) {
        await usersCol.insertMany(initialUsers as any[]);
        console.log(`🍃 Seeded ${initialUsers.length} initial users into MongoDB.`);
      }
    }

    // 3. Results
    const resultsCol = mongoDb.collection('results');
    const dbResults = await resultsCol.find({}).toArray();
    if (dbResults.length > 0) {
      dbResults.forEach((doc: any) => {
        const { _id, ...res } = doc;
        db.results.set(res.sessionId, res);
      });
      console.log(`🍃 Loaded ${dbResults.length} historical game results from MongoDB.`);
    }

    // 4. Sessions
    const sessionsCol = mongoDb.collection('sessions');
    const dbSessions = await sessionsCol.find({}).toArray();
    if (dbSessions.length > 0) {
      dbSessions.forEach((doc: any) => {
        const { _id, ...sess } = doc;
        db.sessions.set(sess.id, sess);
      });
      console.log(`🍃 Loaded ${dbSessions.length} sessions from MongoDB.`);
    } else {
      const initialSessions = Array.from(db.sessions.values());
      if (initialSessions.length > 0) {
        await sessionsCol.insertMany(initialSessions as any[]);
        console.log(`🍃 Seeded ${initialSessions.length} initial sessions into MongoDB.`);
      }
    }

    // 5. Answers
    const answersCol = mongoDb.collection('answers');
    const dbAnswers = await answersCol.find({}).toArray();
    if (dbAnswers.length > 0) {
      dbAnswers.forEach((doc: any) => {
        const { _id, ...ans } = doc;
        let sessionAnswers = db.answers.get(ans.sessionId);
        if (!sessionAnswers) {
          sessionAnswers = [];
          db.answers.set(ans.sessionId, sessionAnswers);
        }
        sessionAnswers.push(ans);
      });
      console.log(`🍃 Loaded ${dbAnswers.length} answer records from MongoDB.`);
    }
  } catch (err: any) {
    console.error('Error synchronizing with MongoDB:', err.message);
  }
}

/**
 * Asynchronously persists/updates a quiz in MongoDB when created or edited
 */
export async function persistQuiz(quiz: any) {
  if (!mongoDb || !isConnected) return;
  try {
    const col = mongoDb.collection('quizzes');
    await col.updateOne({ id: quiz.id }, { $set: quiz }, { upsert: true });
  } catch (err: any) {
    console.warn(`Failed to persist quiz ${quiz.id} to MongoDB:`, err.message);
  }
}

/**
 * Removes a deleted quiz from MongoDB
 */
export async function removeQuiz(quizId: string) {
  if (!mongoDb || !isConnected) return;
  try {
    const col = mongoDb.collection('quizzes');
    await col.deleteOne({ id: quizId });
  } catch (err: any) {
    console.warn(`Failed to delete quiz ${quizId} from MongoDB:`, err.message);
  }
}

/**
 * Persists a new or updated user profile in MongoDB
 */
export async function persistUser(user: any) {
  if (!mongoDb || !isConnected) return;
  try {
    const col = mongoDb.collection('users');
    await col.updateOne({ id: user.id }, { $set: user }, { upsert: true });
  } catch (err: any) {
    console.warn(`Failed to persist user ${user.id} to MongoDB:`, err.message);
  }
}

/**
 * Persists completed game results and scorecards in MongoDB
 */
export async function persistGameResult(result: any) {
  if (!mongoDb || !isConnected) return;
  try {
    const col = mongoDb.collection('results');
    await col.updateOne({ sessionId: result.sessionId }, { $set: result }, { upsert: true });
  } catch (err: any) {
    console.warn(`Failed to persist game result ${result.sessionId} to MongoDB:`, err.message);
  }
}

/**
 * Persists or updates a live/completed game session in MongoDB
 */
export async function persistSession(session: any) {
  if (!mongoDb || !isConnected) return;
  try {
    const col = mongoDb.collection('sessions');
    await col.updateOne({ id: session.id }, { $set: session }, { upsert: true });
  } catch (err: any) {
    console.warn(`Failed to persist session ${session.id} to MongoDB:`, err.message);
  }
}

/**
 * Persists an answer record in MongoDB
 */
export async function persistAnswer(answer: any) {
  if (!mongoDb || !isConnected) return;
  try {
    const col = mongoDb.collection('answers');
    await col.insertOne(answer);
  } catch (err: any) {
    console.warn(`Failed to persist answer record to MongoDB:`, err.message);
  }
}

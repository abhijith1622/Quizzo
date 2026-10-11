import { Quiz, QuizTemplate, User, GameSession, AnswerRecord, GameResult } from '../src/types/quiz.js';
import { hashPassword } from './auth.js';

// In-Memory document store with typed collections and seed data
class DatabaseStore {
  users: Map<string, User & { passwordHash: string }> = new Map();
  quizzes: Map<string, Quiz> = new Map();
  templates: Map<string, QuizTemplate> = new Map();
  sessions: Map<string, GameSession> = new Map();
  answers: Map<string, AnswerRecord[]> = new Map(); // sessionId -> AnswerRecord[]
  results: Map<string, GameResult> = new Map(); // sessionId -> GameResult

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Demo User
    const demoUser: User & { passwordHash: string } = {
      id: 'usr_demo_1',
      email: 'demo@quizzo.com',
      displayName: 'Alex Rivers',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'creator',
      preferredTheme: 'light',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      passwordHash: hashPassword('password123'),
    };
    this.users.set(demoUser.id, demoUser);

    const legacyDemoUser: User & { passwordHash: string } = {
      ...demoUser,
      id: 'usr_demo_legacy',
      email: 'demo@pulsequiz.com',
    };
    this.users.set(legacyDemoUser.id, legacyDemoUser);

    // 2. Seed Templates
    const templatesList: QuizTemplate[] = [
      {
        id: 'tmpl_tech_trivia',
        title: 'Ultimate Web Tech & JavaScript Trivia',
        description: 'Test your knowledge on modern JavaScript, browsers, DOM, CSS architecture, and backend systems.',
        category: 'Technology',
        coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        difficulty: 'Medium',
        estimatedDurationMinutes: 10,
        questionCount: 6,
        tags: ['Frontend', 'JavaScript', 'Node.js', 'Web'],
        slides: [
          {
            id: 's_t1',
            slideType: 'multiple_choice',
            title: 'Which event loop phase executes `process.nextTick` callbacks in Node.js?',
            timeLimitSeconds: 20,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'process.nextTick callbacks run immediately after the current operation finishes, before continuing the event loop phases.',
            options: [
              { id: 'opt_1', text: 'Timers phase', isCorrect: false },
              { id: 'opt_2', text: 'Immediately after the current operation', isCorrect: true },
              { id: 'opt_3', text: 'Close callbacks phase', isCorrect: false },
              { id: 'opt_4', text: 'Poll phase only', isCorrect: false }
            ]
          },
          {
            id: 's_t2',
            slideType: 'true_false',
            title: 'Is HTTP/3 built entirely on top of UDP via the QUIC protocol?',
            timeLimitSeconds: 15,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'HTTP/3 replaces TCP with QUIC, which runs on top of UDP to reduce handshake latency and packet loss head-of-line blocking.',
            options: [
              { id: 'opt_tf1', text: 'True', isCorrect: true },
              { id: 'opt_tf2', text: 'False', isCorrect: false }
            ]
          },
          {
            id: 's_t3',
            slideType: 'numeric',
            title: 'In what year was the first version of JavaScript released?',
            timeLimitSeconds: 20,
            basePoints: 1200,
            expectedNumericAnswer: 1995,
            numericTolerance: 0,
            explanation: 'JavaScript was created by Brendan Eich at Netscape in 1995 in just 10 days.',
            options: []
          },
          {
            id: 's_t4',
            slideType: 'poll',
            title: 'Which CSS layout method do you prefer for main application shells?',
            timeLimitSeconds: 20,
            basePoints: 500,
            options: [
              { id: 'p_1', text: 'CSS Grid with subgrid' },
              { id: 'p_2', text: 'Flexbox layouts' },
              { id: 'p_3', text: 'Tailwind utility combinations' },
              { id: 'p_4', text: 'Container queries with flex' }
            ]
          },
          {
            id: 's_t5',
            slideType: 'word_cloud',
            title: 'What single word describes your favorite debugging tool or feeling?',
            timeLimitSeconds: 25,
            basePoints: 500,
            wordCloudMaxWords: 1,
            options: []
          },
          {
            id: 's_t6',
            slideType: 'multiple_choice',
            title: 'Which data structure does a JavaScript Map use internally in V8 for deterministic iteration order?',
            timeLimitSeconds: 25,
            basePoints: 2000,
            isDoublePoints: true,
            speedScoring: true,
            explanation: 'V8 uses a deterministic hash table with insertion-order linked bucket indices.',
            options: [
              { id: 'opt_m1', text: 'Red-Black Tree', isCorrect: false },
              { id: 'opt_m2', text: 'Deterministic Ordered Hash Table', isCorrect: true },
              { id: 'opt_m3', text: 'Binary Heap', isCorrect: false },
              { id: 'opt_m4', text: 'Skip List', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 'tmpl_science_cosmos',
        title: 'Cosmic Wonders: Astrophysics & Space',
        description: 'Explore the mysteries of black holes, orbital mechanics, planetary geology, and cosmic radiation.',
        category: 'Science',
        coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
        difficulty: 'Hard',
        estimatedDurationMinutes: 12,
        questionCount: 5,
        tags: ['Astronomy', 'Physics', 'Space', 'NASA'],
        slides: [
          {
            id: 's_sc1',
            slideType: 'multiple_choice',
            title: 'What is the point of no return around a black hole called?',
            timeLimitSeconds: 20,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'The event horizon is the boundary beyond which nothing, not even light, can escape.',
            options: [
              { id: 'sc_1', text: 'Photon Sphere', isCorrect: false },
              { id: 'sc_2', text: 'Event Horizon', isCorrect: true },
              { id: 'sc_3', text: 'Singularity', isCorrect: false },
              { id: 'sc_4', text: 'Accretion Disk', isCorrect: false }
            ]
          },
          {
            id: 's_sc2',
            slideType: 'numeric',
            title: 'Approximately how many minutes does light from the Sun take to reach Earth?',
            timeLimitSeconds: 20,
            basePoints: 1000,
            expectedNumericAnswer: 8,
            numericTolerance: 1,
            explanation: 'Light travels roughly 150 million kilometers in about 8 minutes and 20 seconds.',
            options: []
          },
          {
            id: 's_sc3',
            slideType: 'multiple_choice',
            title: 'Which telescope captured the first direct image of Sagittarius A* in our galaxy center?',
            timeLimitSeconds: 20,
            basePoints: 1000,
            options: [
              { id: 'sc_t1', text: 'James Webb Space Telescope', isCorrect: false },
              { id: 'sc_t2', text: 'Event Horizon Telescope (EHT)', isCorrect: true },
              { id: 'sc_t3', text: 'Hubble Space Telescope', isCorrect: false },
              { id: 'sc_t4', text: 'Chandra X-Ray Observatory', isCorrect: false }
            ]
          },
          {
            id: 's_sc4',
            slideType: 'rating',
            title: 'On a scale from 1 to 5, how likely do you think humanity will establish a permanent Moon base by 2035?',
            timeLimitSeconds: 20,
            basePoints: 500,
            ratingMin: 1,
            ratingMax: 5,
            ratingMinLabel: 'Very Unlikely',
            ratingMaxLabel: 'Virtually Certain',
            options: []
          },
          {
            id: 's_sc5',
            slideType: 'true_false',
            title: 'Are neutron stars denser than the nucleus of an atom?',
            timeLimitSeconds: 15,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'Neutron stars have roughly the same atomic nuclear density, about 10^17 kg/m³.',
            options: [
              { id: 'sc_tf1', text: 'True', isCorrect: true },
              { id: 'sc_tf2', text: 'False', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 'tmpl_team_icebreaker',
        title: 'Team Pulse & Remote Icebreaker',
        description: 'Engaging, fun questions to warm up team syncs, sprint retrospectives, and all-hands meetings.',
        category: 'Team Building',
        coverImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
        difficulty: 'Easy',
        estimatedDurationMinutes: 8,
        questionCount: 5,
        tags: ['Icebreaker', 'Retrospective', 'Culture', 'Fun'],
        slides: [
          {
            id: 's_ib1',
            slideType: 'content',
            title: 'Welcome to Team Pulse!',
            content: 'Get ready for a quick energizer. Grab your phones or open a side tab to share your answers and see live team vibes.',
            timeLimitSeconds: 15,
            basePoints: 0,
            options: []
          },
          {
            id: 's_ib2',
            slideType: 'poll',
            title: 'What is your current energy level right now?',
            timeLimitSeconds: 20,
            basePoints: 500,
            options: [
              { id: 'ib_p1', text: '⚡ Fully charged & ready to ship' },
              { id: 'ib_p2', text: '☕ Need one more espresso' },
              { id: 'ib_p3', text: '🧘 Calm, focused, and steady' },
              { id: 'ib_p4', text: '🚀 Thinking about Friday already' }
            ]
          },
          {
            id: 's_ib3',
            slideType: 'word_cloud',
            title: 'What is one word that represents your biggest win this week?',
            timeLimitSeconds: 25,
            basePoints: 500,
            wordCloudMaxWords: 1,
            options: []
          },
          {
            id: 's_ib4',
            slideType: 'multiple_choice',
            title: 'Pop Trivia: Which famous game originally had the working title "Cave Game"?',
            timeLimitSeconds: 20,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'Minecraft was initially called "Cave Game" during Markus Persson\'s early development in 2009.',
            options: [
              { id: 'ib_m1', text: 'Minecraft', isCorrect: true },
              { id: 'ib_m2', text: 'Terraria', isCorrect: false },
              { id: 'ib_m3', text: 'Spelunky', isCorrect: false },
              { id: 'ib_m4', text: 'Don\'t Starve', isCorrect: false }
            ]
          },
          {
            id: 's_ib5',
            slideType: 'open_ended',
            title: 'What is a book, podcast, or tool you recently discovered and recommend?',
            timeLimitSeconds: 30,
            basePoints: 500,
            openEndedMaxChars: 140,
            options: []
          }
        ]
      },
      {
        id: 'tmpl_cybersecurity',
        title: 'Cybersecurity Threat Defense & Zero Trust',
        description: 'Test security hygiene, phishing detection, cryptography basics, and cloud security controls.',
        category: 'Cybersecurity',
        coverImageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
        difficulty: 'Medium',
        estimatedDurationMinutes: 10,
        questionCount: 4,
        tags: ['Security', 'InfoSec', 'ZeroTrust', 'Phishing'],
        slides: [
          {
            id: 's_sec1',
            slideType: 'multiple_choice',
            title: 'What is the primary principle of a "Zero Trust" architecture?',
            timeLimitSeconds: 20,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'Zero Trust assumes no user or device inside or outside the network perimeter should be trusted by default.',
            options: [
              { id: 'sec_1', text: 'Trust anyone connected to the company VPN', isCorrect: false },
              { id: 'sec_2', text: 'Never trust, always verify every request', isCorrect: true },
              { id: 'sec_3', text: 'Only verify users upon initial annual login', isCorrect: false },
              { id: 'sec_4', text: 'Trust devices with antivirus software installed', isCorrect: false }
            ]
          },
          {
            id: 's_sec2',
            slideType: 'true_false',
            title: 'Can an attacker steal HttpOnly cookies directly through JavaScript `document.cookie` execution?',
            timeLimitSeconds: 15,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'HttpOnly cookies cannot be accessed by client-side scripts, mitigating cross-site scripting (XSS) cookie theft.',
            options: [
              { id: 'sec_tf1', text: 'True', isCorrect: false },
              { id: 'sec_tf2', text: 'False', isCorrect: true }
            ]
          },
          {
            id: 's_sec3',
            slideType: 'multiple_choice',
            title: 'Which attack involves tricking a user\'s browser into making unwanted requests to a site where they are authenticated?',
            timeLimitSeconds: 20,
            basePoints: 1000,
            speedScoring: true,
            explanation: 'Cross-Site Request Forgery (CSRF) abuses browser cookie transmission to perform unauthorized actions.',
            options: [
              { id: 'sec_a1', text: 'SQL Injection', isCorrect: false },
              { id: 'sec_a2', text: 'Cross-Site Request Forgery (CSRF)', isCorrect: true },
              { id: 'sec_a3', text: 'DNS Amplification', isCorrect: false },
              { id: 'sec_a4', text: 'Man-in-the-Middle (MitM)', isCorrect: false }
            ]
          },
          {
            id: 's_sec4',
            slideType: 'poll',
            title: 'Which multi-factor authentication (MFA) method does your team prioritize?',
            timeLimitSeconds: 20,
            basePoints: 500,
            options: [
              { id: 'sec_p1', text: 'FIDO2 / Hardware Security Keys (YubiKey)' },
              { id: 'sec_p2', text: 'Authenticator App TOTP (Google/Microsoft)' },
              { id: 'sec_p3', text: 'Push Notifications (Okta / Duo)' },
              { id: 'sec_p4', text: 'SMS Codes' }
            ]
          }
        ]
      }
    ];

    templatesList.forEach(t => this.templates.set(t.id, t));

    // 3. Seed Demo Quizzes owned by demoUser
    const demoQuiz1: Quiz = {
      id: 'quiz_demo_web_masters',
      ownerId: demoUser.id,
      ownerName: demoUser.displayName,
      title: 'Modern Web Engineering Championship',
      description: 'Challenging questions covering JS microtasks, HTTP/3, browser internals, and performance optimization.',
      coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      category: 'Technology',
      tags: ['Frontend', 'JavaScript', 'Node.js', 'Web'],
      language: 'English',
      visibility: 'public',
      status: 'published',
      settings: {
        randomizeQuestions: false,
        randomizeOptions: false,
        showCorrectAnswerImmediately: true,
        allowTeamMode: true,
        soundEffectsEnabled: true
      },
      slides: [
        {
          id: 'slide_1',
          quizId: 'quiz_demo_web_masters',
          position: 0,
          slideType: 'multiple_choice',
          title: 'Which event loop phase executes `process.nextTick` callbacks in Node.js?',
          timeLimitSeconds: 20,
          basePoints: 1000,
          speedScoring: true,
          explanation: 'process.nextTick callbacks run immediately after the current operation finishes, before continuing the event loop phases.',
          options: [
            { id: 'opt_1', text: 'Timers phase', isCorrect: false, color: '#EF4444' },
            { id: 'opt_2', text: 'Immediately after current operation finishes', isCorrect: true, color: '#3B82F6' },
            { id: 'opt_3', text: 'Close callbacks phase', isCorrect: false, color: '#F59E0B' },
            { id: 'opt_4', text: 'Poll phase only', isCorrect: false, color: '#10B981' }
          ]
        },
        {
          id: 'slide_2',
          quizId: 'quiz_demo_web_masters',
          position: 1,
          slideType: 'true_false',
          title: 'Is HTTP/3 built entirely on top of UDP via the QUIC protocol?',
          timeLimitSeconds: 15,
          basePoints: 1000,
          speedScoring: true,
          explanation: 'HTTP/3 replaces TCP with QUIC, which runs on top of UDP to reduce handshake latency and head-of-line blocking.',
          options: [
            { id: 'opt_tf1', text: 'True', isCorrect: true, color: '#3B82F6' },
            { id: 'opt_tf2', text: 'False', isCorrect: false, color: '#EF4444' }
          ]
        },
        {
          id: 'slide_3',
          quizId: 'quiz_demo_web_masters',
          position: 2,
          slideType: 'numeric',
          title: 'In what year was the first version of JavaScript officially released?',
          timeLimitSeconds: 20,
          basePoints: 1200,
          expectedNumericAnswer: 1995,
          numericTolerance: 0,
          explanation: 'JavaScript was created by Brendan Eich in 1995 at Netscape Communications.',
          options: []
        },
        {
          id: 'slide_4',
          quizId: 'quiz_demo_web_masters',
          position: 3,
          slideType: 'poll',
          title: 'What frontend framework/paradigm do you reach for first in new products?',
          timeLimitSeconds: 20,
          basePoints: 500,
          options: [
            { id: 'opt_p1', text: 'React with Vite & TypeScript' },
            { id: 'opt_p2', text: 'Next.js App Router' },
            { id: 'opt_p3', text: 'Vue 3 / Nuxt' },
            { id: 'opt_p4', text: 'Svelte 5 / SvelteKit' }
          ]
        },
        {
          id: 'slide_5',
          quizId: 'quiz_demo_web_masters',
          position: 4,
          slideType: 'multiple_choice',
          title: 'Which CSS property triggers GPU compositing layer promotion without layout reflow?',
          timeLimitSeconds: 20,
          basePoints: 2000,
          isDoublePoints: true,
          speedScoring: true,
          explanation: '`transform` and `opacity` are composited on the GPU without triggering document reflow or repaint.',
          options: [
            { id: 'opt_c1', text: 'transform: translate3d(...)', isCorrect: true, color: '#EF4444' },
            { id: 'opt_c2', text: 'left / top position coordinates', isCorrect: false, color: '#3B82F6' },
            { id: 'opt_c3', text: 'width and height', isCorrect: false, color: '#F59E0B' },
            { id: 'opt_c4', text: 'margin-inline-start', isCorrect: false, color: '#10B981' }
          ]
        }
      ],
      playCount: 142,
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    };
    this.quizzes.set(demoQuiz1.id, demoQuiz1);

    const demoQuiz2: Quiz = {
      id: 'quiz_demo_science_trivia',
      ownerId: demoUser.id,
      ownerName: demoUser.displayName,
      title: 'Cosmic Wonders: Galaxies & Relativity',
      description: 'Journey through physics, astronomy, black holes, and the speed of light.',
      coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      category: 'Science',
      tags: ['Astronomy', 'Physics', 'Cosmos'],
      language: 'English',
      visibility: 'public',
      status: 'published',
      settings: {
        randomizeQuestions: false,
        randomizeOptions: false,
        showCorrectAnswerImmediately: true,
        allowTeamMode: true
      },
      slides: [
        {
          id: 'slide_s1',
          quizId: 'quiz_demo_science_trivia',
          position: 0,
          slideType: 'multiple_choice',
          title: 'What is the point of no return around a black hole called?',
          timeLimitSeconds: 20,
          basePoints: 1000,
          speedScoring: true,
          explanation: 'The event horizon is the boundary beyond which nothing can escape the gravitational pull.',
          options: [
            { id: 'opt_s1a', text: 'Photon Sphere', isCorrect: false },
            { id: 'opt_s1b', text: 'Event Horizon', isCorrect: true },
            { id: 'opt_s1c', text: 'Gravitational Well', isCorrect: false },
            { id: 'opt_s1d', text: 'Accretion Flare', isCorrect: false }
          ]
        },
        {
          id: 'slide_s2',
          quizId: 'quiz_demo_science_trivia',
          position: 1,
          slideType: 'numeric',
          title: 'Approximately how many minutes does sunlight take to reach Earth?',
          timeLimitSeconds: 20,
          basePoints: 1000,
          expectedNumericAnswer: 8,
          numericTolerance: 1,
          explanation: 'Light traveling at ~300,000 km/s covers the 150 million km distance in approximately 8 minutes 20 seconds.',
          options: []
        }
      ],
      playCount: 88,
      createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    };
    this.quizzes.set(demoQuiz2.id, demoQuiz2);

    // 4. Seed Historical Results & Analytics for creator dashboard
    const participantSeedData = [
      { id: 'p_h1', nickname: 'Maya Stark', avatarKey: 'fox', score: 4850, streak: 5, correct: 5, timeMs: 2100 },
      { id: 'p_h2', nickname: 'Leo Cyber', avatarKey: 'robot', score: 4200, streak: 4, correct: 4, timeMs: 2900 },
      { id: 'p_h3', nickname: 'Zara Nova', avatarKey: 'cat', score: 3950, streak: 3, correct: 4, timeMs: 3200 },
      { id: 'p_h4', nickname: 'Kai Vance', avatarKey: 'panda', score: 3750, streak: 3, correct: 4, timeMs: 3500 },
      { id: 'p_h5', nickname: 'Samira Patel', avatarKey: 'tiger', score: 3600, streak: 3, correct: 4, timeMs: 3800 },
      { id: 'p_h6', nickname: 'David Kim', avatarKey: 'bear', score: 3500, streak: 2, correct: 3, timeMs: 4000 },
      { id: 'p_h7', nickname: 'Elena Rostova', avatarKey: 'owl', score: 3400, streak: 2, correct: 3, timeMs: 4100 },
      { id: 'p_h8', nickname: 'Marcus Brody', avatarKey: 'wolf', score: 3300, streak: 2, correct: 3, timeMs: 4300 },
      { id: 'p_h9', nickname: 'Chloe Bennett', avatarKey: 'rabbit', score: 3200, streak: 2, correct: 3, timeMs: 4500 },
      { id: 'p_h10', nickname: "Liam O'Connor", avatarKey: 'lion', score: 3100, streak: 2, correct: 3, timeMs: 4700 },
      { id: 'p_h11', nickname: 'Sophia Rossi', avatarKey: 'fox', score: 3000, streak: 1, correct: 3, timeMs: 4800 },
      { id: 'p_h12', nickname: 'Lucas Silva', avatarKey: 'robot', score: 2900, streak: 1, correct: 3, timeMs: 4900 },
      { id: 'p_h13', nickname: 'Aisha Khan', avatarKey: 'cat', score: 2800, streak: 1, correct: 2, timeMs: 5100 },
      { id: 'p_h14', nickname: 'Ethan Walker', avatarKey: 'panda', score: 2700, streak: 1, correct: 2, timeMs: 5200 },
      { id: 'p_h15', nickname: 'Olivia Zhang', avatarKey: 'tiger', score: 2600, streak: 1, correct: 2, timeMs: 5400 },
      { id: 'p_h16', nickname: 'Noah Taylor', avatarKey: 'bear', score: 2500, streak: 1, correct: 2, timeMs: 5500 },
      { id: 'p_h17', nickname: 'Emma Watson', avatarKey: 'owl', score: 2400, streak: 1, correct: 2, timeMs: 5600 },
      { id: 'p_h18', nickname: 'James Miller', avatarKey: 'wolf', score: 2300, streak: 0, correct: 2, timeMs: 5800 },
      { id: 'p_h19', nickname: 'Isabella Garcia', avatarKey: 'rabbit', score: 2200, streak: 0, correct: 2, timeMs: 5900 },
      { id: 'p_h20', nickname: 'Benjamin Moore', avatarKey: 'lion', score: 2100, streak: 0, correct: 1, timeMs: 6100 },
      { id: 'p_h21', nickname: 'Mia Anderson', avatarKey: 'fox', score: 2000, streak: 0, correct: 1, timeMs: 6300 },
      { id: 'p_h22', nickname: 'William Davis', avatarKey: 'robot', score: 1900, streak: 0, correct: 1, timeMs: 6500 },
      { id: 'p_h23', nickname: 'Charlotte Brown', avatarKey: 'cat', score: 1850, streak: 0, correct: 1, timeMs: 6700 },
      { id: 'p_h24', nickname: 'Alexander Wilson', avatarKey: 'panda', score: 1750, streak: 0, correct: 1, timeMs: 7000 }
    ];

    const historicalCompletedAt = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    const historicalStartedAt = new Date(Date.now() - 3 * 24 * 3600 * 1000 - 15 * 60 * 1000).toISOString();

    const sessionParticipants = participantSeedData.map((p, idx) => ({
      id: p.id,
      sessionId: 'sess_hist_1',
      userId: idx === 0 ? demoUser.id : undefined,
      nickname: p.nickname,
      avatarKey: p.avatarKey,
      score: p.score,
      streak: p.streak,
      correctCount: p.correct,
      incorrectCount: Math.max(0, 5 - p.correct),
      lastResponseTimeMs: p.timeMs,
      connectionStatus: 'connected' as const,
      joinedAt: historicalStartedAt
    }));

    const historicalSession1: GameSession = {
      id: 'sess_hist_1',
      quizId: demoQuiz1.id,
      quizTitle: demoQuiz1.title,
      hostId: demoUser.id,
      hostName: demoUser.displayName,
      joinCode: '942816',
      mode: 'live',
      status: 'completed',
      currentSlideIndex: demoQuiz1.slides.length - 1,
      isLobbyLocked: true,
      participants: sessionParticipants,
      teams: [],
      slides: demoQuiz1.slides,
      startedAt: historicalStartedAt,
      completedAt: historicalCompletedAt,
      createdAt: historicalStartedAt
    };
    this.sessions.set(historicalSession1.id, historicalSession1);

    // Seed answer records for sess_hist_1
    const histAnswers: AnswerRecord[] = [];
    demoQuiz1.slides.forEach((slide, sIdx) => {
      participantSeedData.forEach((p, pIdx) => {
        const isCorrect = (sIdx < p.correct);
        let answerVal: any = 'opt_1';
        if (slide.slideType === 'multiple_choice') {
          const correctOpt = slide.options?.find(o => o.isCorrect);
          const wrongOpt = slide.options?.find(o => !o.isCorrect);
          answerVal = isCorrect ? (correctOpt ? correctOpt.id : 'opt_2') : (wrongOpt ? wrongOpt.id : 'opt_1');
        } else if (slide.slideType === 'true_false') {
          answerVal = isCorrect ? 'opt_tf1' : 'opt_tf2';
        } else if (slide.slideType === 'numeric') {
          answerVal = isCorrect ? 1995 : 1990;
        } else {
          answerVal = 'opt_p1';
        }

        const points = isCorrect ? Math.round(1000 * (0.5 + 0.5 * ((20000 - p.timeMs) / 20000))) : 0;
        histAnswers.push({
          id: `ans_hist_${p.id}_${slide.id}`,
          sessionId: 'sess_hist_1',
          participantId: p.id,
          slideId: slide.id,
          answer: answerVal,
          isCorrect,
          responseTimeMs: p.timeMs + (pIdx % 3) * 200,
          pointsEarned: points,
          submittedAt: new Date(new Date(historicalStartedAt).getTime() + (sIdx + 1) * 60 * 1000).toISOString()
        });
      });
    });
    this.answers.set('sess_hist_1', histAnswers);

    const historicalResult1: GameResult = {
      sessionId: 'sess_hist_1',
      quizId: demoQuiz1.id,
      quizTitle: demoQuiz1.title,
      totalParticipants: 24,
      averageScore: 3420,
      topParticipants: participantSeedData.map((p, idx) => ({
        participantId: p.id,
        nickname: p.nickname,
        avatarKey: p.avatarKey,
        score: p.score,
        rank: idx + 1,
        previousRank: idx + 1,
        streak: p.streak,
        lastPointsEarned: Math.round(p.score / 5)
      })),
      completedAt: historicalCompletedAt
    };
    this.results.set(historicalResult1.sessionId, historicalResult1);
  }

  // Helper generators
  generateJoinCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check collision
    for (const session of this.sessions.values()) {
      if (session.joinCode === code && session.status !== 'completed' && session.status !== 'cancelled') {
        return this.generateJoinCode();
      }
    }
    return code;
  }
}

export const db = new DatabaseStore();

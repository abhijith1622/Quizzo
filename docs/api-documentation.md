# PulseQuiz REST API & Socket.IO Documentation

Base REST path: `/api/v1`

## Authentication & Users
- `POST /api/v1/auth/register`: Register creator (`email`, `password`, `displayName`) -> `{ token, user }`
- `POST /api/v1/auth/login`: Authenticate creator (`email`, `password`) -> `{ token, user }`
- `GET /api/v1/auth/me`: Get current authenticated user profile
- `PATCH /api/v1/auth/profile`: Update user profile details

## Quizzes & Slides
- `GET /api/v1/quizzes`: Query quizzes (`category`, `search`, `filter: 'mine' | 'all'`)
- `POST /api/v1/quizzes`: Create quiz with title, settings, and slides
- `GET /api/v1/quizzes/:id`: Retrieve quiz details
- `PATCH /api/v1/quizzes/:id`: Update quiz and slide sequence
- `DELETE /api/v1/quizzes/:id`: Delete quiz
- `POST /api/v1/quizzes/:id/duplicate`: Duplicate quiz into a draft
- `POST /api/v1/quizzes/:id/publish`: Publish quiz for live hosting

## Game Sessions
- `POST /api/v1/games`: Create live session (`quizId`, `mode: 'live' | 'team' | 'solo'`) -> `{ session }`
- `GET /api/v1/games/code/:code`: Resolve 6-character game PIN to session metadata
- `POST /api/v1/games/join`: Validate player nickname and PIN
- `GET /api/v1/games/:id`: Authoritative session status
- `GET /api/v1/games/:id/results`: Final standings & score distribution

## Templates
- `GET /api/v1/templates`: List curated templates by category
- `GET /api/v1/templates/:id`: Template slide details
- `POST /api/v1/templates/:id/use`: Clone template into creator library

## AI Quiz Generation (Gemini 3.8 Flash)
- `POST /api/v1/ai/generate-quiz`: Structured quiz generation (`topic`, `difficulty`, `questionCount`, `targetAudience`, `sourceText`)
- `POST /api/v1/ai/regenerate-question`: Regenerate single question candidate

## Analytics & Report Exports
- `GET /api/v1/analytics/overview`: Overall creator metrics, activity trend, most played quizzes
- `GET /api/v1/analytics/report-data/:sessionId`: Retrieve structured session report for PDF generation
- `GET /api/v1/analytics/export/:sessionId`: Download raw scorecard data

---

## Real-Time Socket.IO Events

### Client to Server:
- `game:join`: `{ sessionId, nickname, avatarKey, teamId, participantId }`
- `host:join`: `{ sessionId, hostId }`
- `game:start`: `{ sessionId }`
- `question:next`: `{ sessionId }`
- `question:lock`: `{ sessionId }`
- `question:reveal`: `{ sessionId }`
- `leaderboard:show`: `{ sessionId }`
- `answer:submit`: `{ sessionId, participantId, answer, responseTimeMs }`
- `game:reaction`: `{ sessionId, emoji, nickname }`
- `lobby:toggle_lock`: `{ sessionId }`

### Server to Client:
- `lobby:update`: `{ participants, teams, isLobbyLocked, status }`
- `question:started`: `{ slide, slideIndex, totalSlides, deadline, durationSeconds }`
- `answer:count`: `{ answeredCount, totalParticipants }`
- `question:locked`: `{ slideIndex }`
- `answer:revealed`: `{ slide, distribution, totalAnswers }`
- `leaderboard:update`: `{ leaderboard, isFinal }`
- `game:completed`: `{ leaderboard, podium, averageScore }`
- `game:reaction`: `{ emoji, nickname, id }`

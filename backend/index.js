require('dotenv/config');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
    maxHttpBufferSize: 15e6,
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
});

// ============================================================================
// DEFAULT MERMAID.JS SYSTEM ARCHITECTURE DIAGRAM (Reflective of Report Q2/Q4)
// ============================================================================
const DEFAULT_MERMAID_DIAGRAM = `flowchart LR
    subgraph Client["Frontend (React + Vite SPA)"]
      UI["Sidebar / ChatArea / RightPanel"]
      MM["Mermaid.js Diagram Renderer"]
      SC["Socket.IO Client"]
    end

    subgraph Server["Backend (Node.js + Express 5)"]
      API["REST API (/api/rooms & /messages)"]
      WS["Socket.IO Room Gateway"]
      AI["Agentic AI Service (Summaries & Mermaid)"]
    end

    subgraph Data["Persistence & DevOps"]
      PG[("PostgreSQL (Rooms & Messages)")]
      GH["GitHub Repo, PRs & Issues"]
      CI["Docker + GitHub Actions CI"]
    end

    UI --> API
    SC <-->|Live WebSockets| WS
    UI --> MM
    API --> PG
    WS --> PG
    WS --> AI
    AI -->|Generates Mermaid & Summaries| WS
    AI -->|Branches, Files & PR Gate| GH
    GH --> CI`;

// ============================================================================
// DATA STORE (Rooms, Messages, Files, Branches, PRs, Issues)
// ============================================================================
let roomsStore = [
    {
        room_id: 'central',
        user_id: 1,
        title: 'Central',
        name: 'Central',
        scope: 'SHARED',
        branch: 'main',
        description: 'Centralized team planning, AI chat summaries & Mermaid.js architecture diagrams'
    },
    {
        room_id: 'frontend',
        user_id: 1,
        title: 'Front-end',
        name: 'Front-end',
        scope: 'ISOLATED',
        branch: 'feat/room-presence',
        description: 'Isolated feature room — React UI components, search & WebSocket client'
    },
    {
        room_id: 'backend',
        user_id: 1,
        title: 'Back-end',
        name: 'Back-end',
        scope: 'ISOLATED',
        branch: 'feat/express-socket-api',
        description: 'Isolated feature room — Express 5 REST routes, Socket.IO & PostgreSQL'
    },
    {
        room_id: 'qa',
        user_id: 1,
        title: 'QA & testing',
        name: 'QA & testing',
        scope: 'ISOLATED',
        branch: 'chore/docker-github-actions',
        description: 'Isolated feature room — GitHub Actions CI & Docker container verification'
    }
];

let messagesStore = {
    central: [
        {
            message_id: 'm-1',
            room_id: 'central',
            username: 'Inder Grewal',
            initials: 'IG',
            isAgent: false,
            message:
                "@DevAgent let's generate our DevRooms system architecture diagram using Mermaid.js based on our Weekly Status Report.",
            time: '10:20 AM'
        },
        {
            message_id: 'm-2',
            room_id: 'central',
            username: 'DevAgent',
            initials: 'AI',
            isAgent: true,
            message:
                '📐 **AI Mermaid.js Architecture Diagram** generated from your #Central discussion. You can view the rendered diagram below or customize the Mermaid syntax:',
            time: '10:21 AM',
            artifactType: 'mermaid-diagram',
            mermaidCode: DEFAULT_MERMAID_DIAGRAM,
            diagramTitle: 'DevRooms Client/Server & Agentic Architecture (v2)'
        },
        {
            message_id: 'm-3',
            room_id: 'central',
            username: 'Vin Ong',
            initials: 'VO',
            isAgent: false,
            message:
                "Looks great! We have room creation/deletion, message search, AI conversation summaries, and Mermaid.js diagrams in place. Let's use isolated rooms for feature branches.",
            time: '10:23 AM'
        }
    ],
    frontend: [
        {
            message_id: 'm-4',
            room_id: 'frontend',
            username: 'Vin Ong',
            initials: 'VO',
            isAgent: false,
            message:
                '@DevAgent wire up the 3-column React layout (Sidebar, ChatArea, RightPanel) on `feat/room-presence` and open a Pull Request for review.',
            time: '10:30 AM'
        },
        {
            message_id: 'm-5',
            room_id: 'frontend',
            username: 'DevAgent',
            initials: 'AI',
            isAgent: true,
            message:
                '🔗 Opened **Pull Request #42** (`feat/room-presence` → `main`). Review the modified files below and click **Approve PR** or **Deny PR**.',
            time: '10:31 AM',
            artifactType: 'pull-request',
            prData: {
                prNumber: 42,
                title: 'Implement 3-column DevRooms UI, live presence & Mermaid.js viewer',
                sourceBranch: 'feat/room-presence',
                targetBranch: 'main',
                status: 'PENDING',
                filesChanged: 4,
                additions: 142,
                deletions: 18
            }
        }
    ],
    backend: [
        {
            message_id: 'm-6',
            room_id: 'backend',
            username: 'Inder Grewal',
            initials: 'IG',
            isAgent: false,
            message:
                '@DevAgent verify our Express REST API routes (`GET /api/rooms`, `POST /api/rooms`, `GET /api/rooms/:id/messages`, `POST /api/rooms/:id/messages`) and Socket.IO broadcasts.',
            time: '10:35 AM'
        },
        {
            message_id: 'm-7',
            room_id: 'backend',
            username: 'DevAgent',
            initials: 'AI',
            isAgent: true,
            message:
                '✅ All REST endpoints from Report Section Q4 and Socket.IO room channels (`room:join`, `message:receive`, `presence:update`) are active.',
            time: '10:36 AM'
        }
    ],
    qa: [
        {
            message_id: 'm-8',
            room_id: 'qa',
            username: 'Vin Ong',
            initials: 'VO',
            isAgent: false,
            message:
                '@DevAgent configure Docker containerization and GitHub Actions so every Pull Request runs automated checks.',
            time: '10:40 AM'
        }
    ]
};

// Virtual Repository Files (Agentic Read & Write capability)
let repoFilesStore = {
    'frontend/src/ChatArea.jsx': {
        path: 'frontend/src/ChatArea.jsx',
        branch: 'feat/room-presence',
        language: 'JavaScript React',
        updatedBy: 'Vin Ong',
        content: `// DevRooms ChatArea with Search, AI Summary & Mermaid.js Diagram Rendering
export default function ChatArea({ currentRoom, currentUser }) {
  // Renders live WebSocket messages, AI summaries, Mermaid diagrams & PR cards
}`
    },
    'backend/index.js': {
        path: 'backend/index.js',
        branch: 'feat/express-socket-api',
        language: 'JavaScript',
        updatedBy: 'Inder Grewal & Vin Ong',
        content: `// Express 5 + Socket.IO Gateway + PostgreSQL REST Routes
// Implements GET/POST /api/rooms and GET/POST /api/rooms/:id/messages`
    },
    'Dockerfile': {
        path: 'Dockerfile',
        branch: 'chore/docker-github-actions',
        language: 'Dockerfile',
        updatedBy: 'DevAgent',
        content: `FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000 5173
CMD ["npm", "start"]`
    }
};

// Pull Requests Store
let pullRequestsStore = [
    {
        prNumber: 42,
        roomId: 'frontend',
        title: 'Implement 3-column DevRooms UI, live presence & Mermaid.js viewer',
        sourceBranch: 'feat/room-presence',
        targetBranch: 'main',
        status: 'PENDING', // 'PENDING' | 'APPROVED' | 'DENIED'
        actionBy: null,
        actionAt: null
    }
];

// GitHub Issues & Bug Tracker Store (Compatible with /v1/issues)
let nextIssueId = 103;
let issuesStore = [
    {
        id: 101,
        title: 'Integrate Mermaid.js diagram generation from room chat context',
        description: 'Render live editable Mermaid.js architecture diagrams inside ChatArea when @DevAgent is prompted.',
        reporterContact: 'Vin Ong',
        roomId: 'central',
        status: 'Resolved',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
    },
    {
        id: 102,
        title: 'Add per-room AI conversation summary endpoint',
        description: 'Synthesize room chat logs into key architectural decisions and action items.',
        reporterContact: 'Inder Grewal',
        roomId: 'central',
        status: 'InProgress',
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
    }
];

// Live Connected Socket Presence & Typing Maps
const roomPresenceMap = new Map(); // roomId -> Map(socketId -> userObj)
const roomTypingMap = new Map();   // roomId -> Map(socketId -> username)

function getRoomMembers(roomId) {
    const map = roomPresenceMap.get(roomId);
    return map ? Array.from(map.values()) : [];
}

function getRoomTypingUsers(roomId) {
    const map = roomTypingMap.get(roomId);
    return map ? Array.from(new Set(map.values())) : [];
}

// ============================================================================
// 1. AUTHENTICATION ENDPOINT (Password: admin123)
// ============================================================================
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Developer username is required.' });
    }
    if (password !== 'admin123') {
        return res.status(401).json({ message: 'Invalid password. Use password: admin123' });
    }

    const cleanName = username.trim();
    const initials = cleanName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'DV';

    const isVin = cleanName.toLowerCase().includes('vin');
    const user = {
        userId: isVin ? 1 : 2,
        username: cleanName,
        name: cleanName,
        initials,
        role: isVin ? 'Frontend & DB Architecture (Vin Ong)' : 'Backend & WebSockets (Inder Grewal)'
    };

    res.status(200).json({ ok: true, user });
});

// ============================================================================
// 2. REPORT Q4 REST API ROUTES: ROOMS (GET, POST, DELETE)
// ============================================================================
app.get('/api/rooms', (req, res) => {
    res.status(200).json({
        data: roomsStore,
        message: 'Rooms fetched successfully.'
    });
});

app.post('/api/rooms', (req, res) => {
    const { userId = 1, title, name, description, scope = 'ISOLATED', branch } = req.body;
    const roomTitle = (title || name || '').trim();
    if (!roomTitle) {
        return res.status(422).json({ message: 'Error: Room title is required.' });
    }

    const slug = roomTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-3);
    const branchName = branch?.trim() || `feat/${slug}`;

    const newRoom = {
        room_id: slug,
        user_id: userId,
        title: roomTitle,
        name: roomTitle,
        scope,
        branch: branchName,
        description: description || `Isolated workspace on branch ${branchName}`
    };

    roomsStore.push(newRoom);
    messagesStore[slug] = [
        {
            message_id: `init-${Date.now()}`,
            room_id: slug,
            username: 'DevAgent',
            initials: 'AI',
            isAgent: true,
            message: `🌿 Created room **#${roomTitle}** and checked out dedicated branch \`${branchName}\` (${scope} scope).`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ];

    io.emit('rooms:updated', roomsStore);
    res.status(201).json({
        data: newRoom,
        rooms: roomsStore,
        message: 'Room was created successfully.'
    });
});

// Core Feature from Report Q2 Table: Ability to delete rooms
app.delete('/api/rooms/:id', (req, res) => {
    const roomId = req.params.id;
    if (roomId === 'central') {
        return res.status(400).json({ message: 'Cannot delete the shared #Central room.' });
    }
    roomsStore = roomsStore.filter((r) => r.room_id !== roomId);
    delete messagesStore[roomId];
    io.emit('rooms:updated', roomsStore);
    res.status(200).json({ data: roomsStore, message: 'Room deleted successfully.' });
});

// ============================================================================
// 3. REPORT Q4 REST API ROUTES: MESSAGES (GET, POST)
// ============================================================================
app.get('/api/rooms/:id/messages', (req, res) => {
    const roomId = req.params.id;
    const messages = messagesStore[roomId] || [];
    res.status(200).json({
        data: messages,
        message: 'Messages were fetched successfully.'
    });
});

app.post('/api/rooms/:id/messages', (req, res) => {
    const roomId = req.params.id;
    const { username = 'Vin Ong', initials = 'VO', userMessage, message, attachment, codeSnippet } = req.body;
    const text = (userMessage || message || '').trim();

    if (!text && !attachment && !codeSnippet) {
        return res.status(422).json({ message: 'Error: Message content cannot be empty.' });
    }

    const roomObj = roomsStore.find((r) => r.room_id === roomId) || roomsStore[0];
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
        message_id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        room_id: roomId,
        username,
        initials,
        isAgent: false,
        message: text || (attachment ? `Shared file: ${attachment.name}` : `Shared snippet: ${codeSnippet.filename}`),
        attachment: attachment || null,
        codeSnippet: codeSnippet || null,
        time: now
    };

    if (!messagesStore[roomId]) messagesStore[roomId] = [];
    messagesStore[roomId].push(newMsg);

    // Broadcast live over Socket.IO to all users in the room
    io.to(roomId).emit('message:receive', { roomId, message: newMsg });

    // Check if user tagged @DevAgent for AI tasks
    if (text.toLowerCase().includes('@devagent')) {
        if (!roomTypingMap.has(roomId)) roomTypingMap.set(roomId, new Map());
        roomTypingMap.get(roomId).set('agent', 'DevAgent');
        io.to(roomId).emit('typing:update', { roomId, typingUsers: getRoomTypingUsers(roomId) });

        setTimeout(() => {
            const lower = text.toLowerCase();
            let agentMsg = null;

            if (lower.includes('summar')) {
                agentMsg = buildAiSummaryMessage(roomId, roomObj, username);
            } else if (lower.includes('diagram') || lower.includes('mermaid') || lower.includes('architect')) {
                agentMsg = buildAiMermaidMessage(roomId, roomObj, text);
            } else if (lower.includes('pr') || lower.includes('pull request')) {
                agentMsg = {
                    message_id: `agent-${Date.now()}`,
                    room_id: roomId,
                    username: 'DevAgent',
                    initials: 'AI',
                    isAgent: true,
                    message: `🔗 Opened **Pull Request** for branch \`${roomObj.branch}\` → \`main\`. Use the controls below to **Approve** or **Deny**:`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    artifactType: 'pull-request',
                    prData: {
                        prNumber: 42,
                        title: `Merge ${roomObj.branch} changes from #${roomObj.title}`,
                        sourceBranch: roomObj.branch,
                        targetBranch: 'main',
                        status: 'PENDING',
                        filesChanged: 3,
                        additions: 96,
                        deletions: 12
                    }
                };
            } else if (lower.includes('issue') || lower.includes('bug')) {
                const cleanTitle = text.replace(/@devagent/i, '').replace(/create issue/i, '').trim() || `Follow-up in #${roomObj.title}`;
                const newIss = {
                    id: nextIssueId++,
                    title: cleanTitle,
                    description: `Created by @DevAgent from #${roomObj.title} discussion.`,
                    reporterContact: username,
                    roomId,
                    status: 'Open',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                issuesStore.unshift(newIss);
                io.emit('issues:updated', issuesStore);
                agentMsg = {
                    message_id: `agent-${Date.now()}`,
                    room_id: roomId,
                    username: 'DevAgent',
                    initials: 'AI',
                    isAgent: true,
                    message: `🏷️ Created **GitHub Issue #${newIss.id}**: "${newIss.title}" (Status: \`Open\`).`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            } else {
                agentMsg = {
                    message_id: `agent-${Date.now()}`,
                    room_id: roomId,
                    username: 'DevAgent',
                    initials: 'AI',
                    isAgent: true,
                    message: `Acknowledged in **#${roomObj.title}** (branch \`${roomObj.branch}\`). Ask me to **summarize chat**, **create a Mermaid diagram**, **read/write files**, **open a PR**, or **create an issue**.`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }

            roomTypingMap.get(roomId)?.delete('agent');
            io.to(roomId).emit('typing:update', { roomId, typingUsers: getRoomTypingUsers(roomId) });

            messagesStore[roomId].push(agentMsg);
            io.to(roomId).emit('message:receive', { roomId, message: agentMsg });
        }, 650);
    }

    res.status(201).json({
        data: newMsg,
        message: 'Message was created successfully.'
    });
});

// ============================================================================
// 4. CORE AI FEATURE 1: AI GENERATED SUMMARIES OF ROOM CHAT
// ============================================================================
function buildAiSummaryMessage(roomId, roomObj, requestedBy) {
    const roomMsgs = messagesStore[roomId] || [];
    const participants = Array.from(new Set(roomMsgs.map((m) => m.username))).join(', ');
    const recentSnippets = roomMsgs
        .slice(-4)
        .map((m) => `${m.username}: "${m.message.slice(0, 85)}${m.message.length > 85 ? '...' : ''}"`);

    return {
        message_id: `summary-${Date.now()}`,
        room_id: roomId,
        username: 'DevAgent',
        initials: 'AI',
        isAgent: true,
        message: `✨ **AI Conversation Summary** generated for **#${roomObj.title}** (requested by ${requestedBy}):`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        artifactType: 'ai-summary',
        summaryData: {
            roomName: roomObj.title,
            branch: roomObj.branch,
            messageCount: roomMsgs.length,
            participants,
            overview: `Synthesized ${roomMsgs.length} messages in #${roomObj.title} on branch ${roomObj.branch} (${roomObj.scope} workspace).`,
            highlights: recentSnippets,
            decisions: [
                'Scoped down to core MVP: Real-time WebSocket rooms, AI chat summaries, and Mermaid.js diagrams.',
                `Branch ${roomObj.branch} isolated for feature development with PR approval/denial gating.`
            ],
            actionItems: [
                'Review generated Mermaid.js architecture diagram with teammates.',
                'Verify PR status and run Docker + GitHub Actions test suite.'
            ]
        }
    };
}

app.post('/api/rooms/:id/summarize', (req, res) => {
    const roomId = req.params.id;
    const { requestedBy = 'Vin Ong' } = req.body;
    const roomObj = roomsStore.find((r) => r.room_id === roomId) || roomsStore[0];

    const summaryMsg = buildAiSummaryMessage(roomId, roomObj, requestedBy);
    if (!messagesStore[roomId]) messagesStore[roomId] = [];
    messagesStore[roomId].push(summaryMsg);

    io.to(roomId).emit('message:receive', { roomId, message: summaryMsg });
    res.status(201).json({ data: summaryMsg });
});

// ============================================================================
// 5. CORE AI FEATURE 2: AI GENERATED DIAGRAMS WITH MERMAID.JS
// ============================================================================
function buildAiMermaidMessage(roomId, roomObj, customInstructions = '') {
    const lower = customInstructions.toLowerCase();
    let mermaidCode = DEFAULT_MERMAID_DIAGRAM;
    let diagramTitle = `Mermaid.js Architecture Diagram — #${roomObj.title}`;

    if (lower.includes('sequence') || lower.includes('flow') || lower.includes('chat')) {
        diagramTitle = `Mermaid.js Sequence Diagram — Real-Time Chat & AI Workflow`;
        mermaidCode = `sequenceDiagram
    participant Dev as Developer (Vin / Inder)
    participant UI as React Frontend (ChatArea)
    participant WS as Express + Socket.IO Server
    participant AI as @DevAgent (Summary & Mermaid)
    participant DB as PostgreSQL Database

    Dev->>UI: Posts message or @DevAgent command
    UI->>WS: POST /api/rooms/:id/messages
    WS->>DB: INSERT INTO messages
    WS-->>UI: Broadcast message:receive (Socket.IO)
    alt @DevAgent Triggered
        WS->>AI: Analyze recent room chat context
        AI-->>WS: Return AI Summary or Mermaid.js syntax
        WS-->>UI: Render Mermaid SVG / Summary Card
    end`;
    } else if (lower.includes('db') || lower.includes('database') || lower.includes('schema') || lower.includes('er')) {
        diagramTitle = `Mermaid.js Database Schema Diagram (PostgreSQL)`;
        mermaidCode = `erDiagram
    USERS ||--o{ ROOMS : creates
    USERS ||--o{ MESSAGES : posts
    ROOMS ||--o{ MESSAGES : contains
    ROOMS ||--o{ PULL_REQUESTS : tracks

    USERS {
      uuid user_id PK
      varchar username
      varchar role
    }
    ROOMS {
      varchar room_id PK
      varchar title
      varchar scope
      varchar branch
    }
    MESSAGES {
      varchar message_id PK
      varchar room_id FK
      varchar poster_name
      text message
      varchar artifact_type
    }`;
    }

    return {
        message_id: `mermaid-${Date.now()}`,
        room_id: roomId,
        username: 'DevAgent',
        initials: 'AI',
        isAgent: true,
        message: customInstructions
            ? `📐 **AI Mermaid.js Diagram** generated from chat discussion ("${customInstructions}"):`
            : `📐 **AI Mermaid.js Diagram** generated from #${roomObj.title} discussion:`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        artifactType: 'mermaid-diagram',
        mermaidCode,
        diagramTitle
    };
}

app.post('/api/rooms/:id/diagram', (req, res) => {
    const roomId = req.params.id;
    const { instructions = '', customMermaidCode } = req.body;
    const roomObj = roomsStore.find((r) => r.room_id === roomId) || roomsStore[0];

    const diagramMsg = buildAiMermaidMessage(roomId, roomObj, instructions);
    if (customMermaidCode) {
        diagramMsg.mermaidCode = customMermaidCode;
    }

    if (!messagesStore[roomId]) messagesStore[roomId] = [];
    messagesStore[roomId].push(diagramMsg);

    io.to(roomId).emit('message:receive', { roomId, message: diagramMsg });
    res.status(201).json({ data: diagramMsg });
});

// ============================================================================
// 6. AGENTIC REPO FILES, PULL REQUESTS (APPROVE/DENY) & GITHUB ISSUES
// ============================================================================
app.get('/api/repo', (req, res) => {
    res.json({
        files: repoFilesStore,
        branches: roomsStore.map((r) => ({
            branch: r.branch,
            room: r.title,
            scope: r.scope
        })),
        pullRequests: pullRequestsStore
    });
});

app.post('/api/repo/files', (req, res) => {
    const { path: filePath, content, language = 'JavaScript', updatedBy = 'Vin Ong', roomId = 'frontend' } = req.body;
    if (!filePath) return res.status(400).json({ message: 'File path is required.' });

    const roomObj = roomsStore.find((r) => r.room_id === roomId) || roomsStore[0];
    repoFilesStore[filePath] = {
        path: filePath,
        branch: roomObj.branch,
        language,
        updatedBy,
        content
    };

    const fileMsg = {
        message_id: `file-${Date.now()}`,
        room_id: roomId,
        username: 'DevAgent',
        initials: 'AI',
        isAgent: true,
        message: `📝 **Agent File Write Complete:** Updated \`${filePath}\` on branch \`${roomObj.branch}\` (by ${updatedBy}).`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codeSnippet: { filename: filePath, language, code: content }
    };

    if (!messagesStore[roomId]) messagesStore[roomId] = [];
    messagesStore[roomId].push(fileMsg);
    io.to(roomId).emit('message:receive', { roomId, message: fileMsg });
    io.emit('repo:updated', repoFilesStore);

    res.status(201).json({ data: repoFilesStore[filePath] });
});

app.post('/api/prs/:prNumber/decision', (req, res) => {
    const prNumber = Number(req.params.prNumber);
    const { decision, reviewer = 'Vin Ong', roomId = 'frontend' } = req.body; // decision: 'APPROVED' | 'DENIED'
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    pullRequestsStore = pullRequestsStore.map((pr) =>
        pr.prNumber === prNumber ? { ...pr, status: decision, actionBy: reviewer, actionAt: now } : pr
    );

    const decisionMsg = {
        message_id: `pr-dec-${Date.now()}`,
        room_id: roomId,
        username: reviewer,
        initials: reviewer.startsWith('I') ? 'IG' : 'VO',
        isAgent: false,
        message:
            decision === 'APPROVED'
                ? `✅ **Approved Pull Request #${prNumber}** — Ready to merge into \`main\`.`
                : `❌ **Denied Pull Request #${prNumber}** — Requested additional changes on branch.`,
        time: now
    };

    if (!messagesStore[roomId]) messagesStore[roomId] = [];
    messagesStore[roomId].push(decisionMsg);

    io.emit('pr:updated', { prNumber, status: decision, actionBy: reviewer, actionAt: now });
    io.to(roomId).emit('message:receive', { roomId, message: decisionMsg });

    res.json({ ok: true, status: decision, actionBy: reviewer });
});

// Issues API (Compatible with /v1/issues Bug Tracker Form)
app.get('/v1/issues', (req, res) => {
    res.json({ data: issuesStore });
});

app.post('/v1/issues', (req, res) => {
    const { title, description, reporterContact, roomId = 'central' } = req.body;
    if (!title || title.trim().length < 3) {
        return res.status(400).json({ error: 'Bad Request', message: 'Title must be at least 3 characters.' });
    }
    if (!description || description.trim().length < 10) {
        return res.status(400).json({ error: 'Bad Request', message: 'Description must be at least 10 characters.' });
    }

    const created = {
        id: nextIssueId++,
        title: title.trim(),
        description: description.trim(),
        reporterContact: reporterContact?.trim() || null,
        roomId,
        status: 'Open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    issuesStore.unshift(created);
    io.emit('issues:updated', issuesStore);
    res.status(201).json(created);
});

app.patch('/v1/issues/:id', (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    issuesStore = issuesStore.map((iss) => (iss.id === id ? { ...iss, status } : iss));
    io.emit('issues:updated', issuesStore);
    res.json({ ok: true });
});

// ============================================================================
// 7. SOCKET.IO REAL-TIME GATEWAY (Only Connected Users Shown)
// ============================================================================
io.on('connection', (socket) => {
    socket.on('room:join', ({ roomId, user }) => {
        if (!roomId || !user) return;

        if (socket.data.currentRoom && socket.data.currentRoom !== roomId) {
            const prev = socket.data.currentRoom;
            socket.leave(prev);
            roomPresenceMap.get(prev)?.delete(socket.id);
            roomTypingMap.get(prev)?.delete(socket.id);
            io.to(prev).emit('presence:update', { roomId: prev, members: getRoomMembers(prev) });
            io.to(prev).emit('typing:update', { roomId: prev, typingUsers: getRoomTypingUsers(prev) });
        }

        socket.join(roomId);
        socket.data.currentRoom = roomId;
        socket.data.user = user;

        if (!roomPresenceMap.has(roomId)) roomPresenceMap.set(roomId, new Map());
        roomPresenceMap.get(roomId).set(socket.id, {
            ...user,
            socketId: socket.id
        });

        io.to(roomId).emit('presence:update', {
            roomId,
            members: getRoomMembers(roomId)
        });
        socket.emit('typing:update', {
            roomId,
            typingUsers: getRoomTypingUsers(roomId)
        });
    });

    socket.on('typing:start', ({ roomId, username }) => {
        if (!roomId || !username) return;
        if (!roomTypingMap.has(roomId)) roomTypingMap.set(roomId, new Map());
        roomTypingMap.get(roomId).set(socket.id, username);
        io.to(roomId).emit('typing:update', { roomId, typingUsers: getRoomTypingUsers(roomId) });
    });

    socket.on('typing:stop', ({ roomId }) => {
        if (!roomId) return;
        roomTypingMap.get(roomId)?.delete(socket.id);
        io.to(roomId).emit('typing:update', { roomId, typingUsers: getRoomTypingUsers(roomId) });
    });

    socket.on('disconnect', () => {
        const roomId = socket.data.currentRoom;
        if (roomId) {
            roomPresenceMap.get(roomId)?.delete(socket.id);
            roomTypingMap.get(roomId)?.delete(socket.id);
            io.to(roomId).emit('presence:update', { roomId, members: getRoomMembers(roomId) });
            io.to(roomId).emit('typing:update', { roomId, typingUsers: getRoomTypingUsers(roomId) });
        }
    });
});

app.use((req, res) => {
    res.status(404).json({ message: `The path "${req.originalUrl}" was not found.` });
});

server.listen(PORT, () => {
    console.log(`🚀 DevRooms Express + Socket.IO Server listening on http://localhost:${PORT}`);
});
# Hermes
AI-Powered Misinformation Detection Platform

A comprehensive fact-checking system powered by Google's Gemini 3 Flash AI with semantic clustering, category-based filtering, and real-time misinformation detection.

## Features

- **AI-Powered Analysis**: Gemini 3 Flash integration for intelligent content verification with confidence scoring
- **Content Filtering**: Pre-validation to reject spam, personal attacks, and non-news content
- **Semantic Clustering**: Automatic duplicate detection using AI similarity analysis
- **Category Organization**: 9 color-coded categories (Politics, Health, Science, Climate, Technology, Finance, Entertainment, etc.)
- **Social Browsing**: Browse and upvote misinformation without mandatory submissions
- **Real-Time Updates**: Relative timestamps ("5m ago", "3h ago") across all views
- **CSV Export**: Download reports with top 5 trending + last 25 recent detections
- **Mobile Responsive**: Three-tab navigation with hamburger menu for mobile devices

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Google Gemini 3 Flash API
- Axios for HTTP requests
- Security: Helmet, CORS, Rate Limiting

**Frontend:**
- React 18 + Vite
- Lucide React icons
- Vanilla CSS (modern dark theme)
- Mobile-first responsive design

## Project Structure

```
Hermes/
├── backend/                    # Express API server
│   ├── routes/
│   │   ├── verify.js          # Fact-checking endpoint
│   │   ├── dashboard.js       # Feed data
│   │   ├── trending.js        # Trending items
│   │   ├── upvote.js          # Upvote handling
│   │   └── export.js          # CSV export
│   ├── services/
│   │   ├── aiService.js       # Gemini AI integration
│   │   └── similarityService.js  # Duplicate detection
│   ├── index.js               # Server entry point
│   └── package.json
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx    # Homepage
│   │   │   ├── VerificationForm.jsx
│   │   │   ├── ResultDisplay.jsx
│   │   │   ├── Feed.jsx       # Feed with categories
│   │   │   ├── Trending.jsx   # Trending view
│   │   │   └── MessageCluster.jsx
│   │   ├── styles/
│   │   │   └── index.css      # Global styles
│   │   ├── App.jsx            # Main app + navigation
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   └── package.json
│
├── README.md
└── vercel.json
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- Gemini API key ([Get one here](https://aistudio.google.com/apikey))
- npm >= 9.0.0

### Installation

#### Backend Setup
```bash
cd backend
npm install

# Create .env file
copy .env.example .env
# Edit .env with your MongoDB URI and Gemini API key
```

#### Frontend Setup
```bash
cd frontend
npm install

# Create .env file (optional, defaults to localhost:4000)
copy .env.example .env
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

## Environment Variables

### Backend (.env):
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=hermes_ai
GEMINI_API_KEY=your_gemini_api_key
GROK_API_KEY=your_grok_api_key (optional fallback)
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env):
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000/api
```

### Production (.env.production):
```env
VITE_BACKEND_URL=https://your-app.onrender.com
VITE_API_URL=https://your-app.onrender.com/api
```

## Usage Guide

### 1. Submit Content for Fact-Checking

1. Navigate to the app and click **"Fact Check"** tab
2. Enter news or factual claim in the text area (max 5000 characters)
3. Click **"Verify Text"**
4. AI analyzes the content and returns:
   - **Verdict**: Reliable or Misinformation
   - **Confidence Score**: 0-100%
   - **Category**: Auto-detected (Politics, Health, Science, etc.)
   - **Explanation**: Detailed reasoning

**Note**: Content is pre-validated. The following will be rejected:
- Personal attacks or insults
- Hate speech
- Spam or promotional content
- Threats or cyberbullying

### 2. Browse the Feed

1. Click **"Feed"** tab or "Browse Feed" from homepage
2. View all detected misinformation organized by category
3. **Filter by Category**:
   - Click any category button (Politics, Health, Science, etc.)
   - See color-coded indicator and item count
   - Feed updates to show only that category
4. **Upvote** items to flag widespread misinformation
5. **Export Data**:
   - Click "Export CSV" button
   - Downloads report with top 5 trending + last 25 recent

### 3. View Trending Misinformation

1. Navigate to **"Trending"** tab
2. **Filter by Time Period**:
   - 24 Hours
   - 7 Days
   - 30 Days
3. **Sort by**:
   - Most Upvoted
   - Most Recent
   - Highest Confidence
4. See variation counts for clustered similar messages

### 4. Social Features

- **Browse Without Submitting**: Explore feed without fact-checking
- **Upvote System**: Help identify widespread misinformation
- **Duplicate Detection**: Similar messages automatically clustered
- **Variation Counts**: See how many times similar claims appeared

### Example: Verify Content

**Request:**
```bash
POST /api/verify
Content-Type: application/json

{
  "text": "The Earth is flat and NASA is lying to us"
}
```

**Response:**
```json
{
  "verdict": "misinformation",
  "confidence": 0.98,
  "category": "science",
  "explanation": "This claim contradicts overwhelming scientific evidence...",
  "timestamp": "2026-02-07T15:54:32.123Z",
  "clusterId": "cluster_abc123",
  "isClusterHead": true,
  "variations": 3
}
```

## AI Features Explained

### Content Validation
Before fact-checking, AI validates content type:
- ✅ **Allowed**: News, factual claims, public information
- ❌ **Rejected**: Personal attacks, spam, hate speech, threats

### Semantic Similarity Detection
AI compares new submissions with existing database:
1. Generates embeddings for content
2. Calculates cosine similarity
3. If similarity > 85%, clusters messages together
4. Creates common template for grouped messages

### Category Classification
AI automatically categorizes content into:
- Politics
- Health
- Science
- Climate
- Technology
- Finance
- Entertainment
- General

## Security Features

- **Helmet.js**: Security headers protection
- **CORS**: Configured cross-origin resource sharing
- **Rate Limiting**: API endpoint protection
- **Environment Variables**: Sensitive data protection
- **Input Validation**: Content length and format validation

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License

Created by [**jeevapriyan10**](https://github.com/jeevapriyan10)

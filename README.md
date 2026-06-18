# 🍽️ Food Intelligence

Food Intelligence is a full-stack nutrition analysis platform that combines AI-powered food recognition with USDA nutrition data to help users understand, track, and analyze meals in real time.

Users can search foods from the USDA FoodData Central database, scan food items using a camera, estimate nutritional values, build meals, monitor macronutrient intake, and generate nutrition insights through a modern responsive interface.

---

## ✨ Features

### 🤖 AI Food Recognition
- Camera-based food scanning
- AI-powered food identification
- Automatic USDA nutrition lookup
- Real-time nutrition analysis

### 🥗 USDA Nutrition Database Integration
- Search thousands of verified foods
- Access authoritative nutrition information
- Retrieve calories, protein, carbohydrates, and fats
- USDA FoodData Central integration

### 🍱 Meal Builder
- Add foods to meals
- Adjust serving sizes
- Estimate food weights
- Automatic nutrition aggregation

### 📊 Nutrition Analytics
- Total calorie tracking
- Macronutrient breakdown
- Protein, carbohydrate, and fat analysis
- Meal balance insights

### 🎯 Goal Tracking
- Daily calorie goals
- Protein goals
- Carbohydrate goals
- Fat goals
- Progress visualization

### 💾 Saved Meals
- Save meal plans
- Reload previous meals
- Quick nutrition comparisons

### 📱 Responsive Interface
- Mobile-first design
- Desktop dashboard experience
- Camera support
- Modern UI built with Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- Python
- Uvicorn

### APIs & Data Sources
- USDA FoodData Central API
- Google Cloud Vision API

---

## 🏗️ Project Architecture

```text
Food Intelligence
│
├── Frontend (Next.js)
│   ├── Food Search
│   ├── Camera Scanner
│   ├── Meal Builder
│   ├── Analytics Dashboard
│   └── Goal Tracking
│
├── Backend (FastAPI)
│   ├── Food Search Endpoints
│   ├── Nutrition Processing
│   ├── Image Analysis
│   └── USDA Integration
│
└── External Services
    ├── USDA FoodData Central
    └── Google Cloud Vision
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/your-username/food-intelligence.git
cd food-intelligence
```

---

## ⚙️ Backend Setup

Create and activate a virtual environment:

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend directory:

```env
USDA_API_KEY=YOUR_USDA_API_KEY
GOOGLE_APPLICATION_CREDENTIALS=credentials.json
```

Start the backend server:

```bash
cd backend

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 💻 Frontend Setup

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Install dependencies:

```bash
cd frontend

npm install
```

Run development server:

```bash
npm run dev
```

Application URLs:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
API Docs: http://localhost:8000/docs
```

---

## 🔌 API Endpoints

### Search Foods

```http
GET /search-all/{query}
```

Returns matching foods from USDA.

---

### Food Details

```http
GET /food-details/{fdcId}
```

Returns detailed nutrition information.

---

### Analyze Food Image

```http
POST /analyze-food-image
```

Uploads an image, identifies the food, and returns nutrition data.

---

## 📖 Example Workflow

1. Open Food Intelligence.
2. Search for a food or use the camera scanner.
3. Select a food item.
4. Adjust serving size and estimated weight.
5. Add the food to a meal.
6. Review meal nutrition totals.
7. Track progress toward daily goals.
8. Save meals for future use.

---

## 🔮 Future Improvements

- Portion size estimation using computer vision
- Personalized nutrition recommendations
- Weekly and monthly nutrition trends
- Barcode scanning
- User authentication
- Cloud meal synchronization
- AI-powered meal planning
- Micronutrient tracking
- Fitness integration

---

## 🎓 Why This Project?

Food Intelligence demonstrates modern full-stack development by combining:

- AI-powered image recognition
- Real-world nutrition datasets
- API integrations
- FastAPI backend development
- Next.js frontend architecture
- Responsive UI/UX design
- Data visualization
- State management

The project showcases the ability to build production-style applications that integrate machine learning, public datasets, and modern web technologies into a cohesive user experience.

---

## 📜 License

MIT License

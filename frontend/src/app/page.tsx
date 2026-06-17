"use client";

import { useEffect, useRef, useState } from "react";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const AVERAGE_WEIGHTS: Record<string, number> = {
  banana: 120,
  apple: 180,
  orange: 130,
  egg: 50,
  potato: 170,
  tomato: 120,
  avocado: 200,
  onion: 110,
  cucumber: 300,
};


  
export default function Home() {
  const ProgressRing = ({
    value,
    goal,
    label,
    suffix = "",
  }: {
    value: number;
    goal: number;
    label: string;
    suffix?: string;
  }) => {
    const percentage = Math.min((value / Math.max(goal, 1)) * 100, 100);
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative h-28 w-28">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} stroke="#E5E7EB" strokeWidth="10" fill="none" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#0F766E"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{Math.round(percentage)}%</span>
            <span className="text-xs text-zinc-500">{value.toFixed(0)}{suffix}</span>
          </div>
        </div>
        <p className="mt-2 text-sm font-semibold text-[#0F766E]">{label}</p>
      </div>
    );
  };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [meal, setMeal] = useState<any[]>([]);
  const [selectedWeight, setSelectedWeight] = useState(100);
  const [estimatedWeight, setEstimatedWeight] = useState(100);
  const weightMultiplier = estimatedWeight / 100;
  const displayedNutrition = selectedFood
    ? {
        calories: (selectedFood.nutrition?.calories || 0) * weightMultiplier,
        protein: (selectedFood.nutrition?.protein || 0) * weightMultiplier,
        fat: (selectedFood.nutrition?.fat || 0) * weightMultiplier,
        carbs: (selectedFood.nutrition?.carbs || 0) * weightMultiplier,
      }
    : null;
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [carbsGoal, setCarbsGoal] = useState(250);
  const [fatGoal, setFatGoal] = useState(70);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [cardWeights, setCardWeights] = useState<Record<number, number>>({});


  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

useEffect(() => {
  const storedMeals = localStorage.getItem("savedMeals");

  if (storedMeals) {
    setSavedMeals(JSON.parse(storedMeals));
  }
}, []);

  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraActive, cameraStream]);


  const searchFood = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSelectedFood(null);
    setSelectedWeight(100);

    try {
     let endpoint = `/search-all/${encodeURIComponent(query)}`;

if (
  query.toLowerCase().includes("protein") ||
  query.toLowerCase().includes("fiber") ||
  query.toLowerCase().includes("potassium") ||
  query.toLowerCase().includes("magnesium") ||
  query.toLowerCase().includes("vitamin c")
) {
  endpoint = `/ai-search/${encodeURIComponent(query)}`;
}

const response = await fetch(
  `${API_URL}${endpoint}`
);

const data = await response.json();

if (Array.isArray(data)) {
  setResults(data);
} else if (data.foods) {
  setResults(
    data.foods.map((name: string, index: number) => ({
      fdcId: index + 1,
      name,
      source: "AI Search",
      nutrition: {},
    }))
  );
} else {
  setResults([]);
}
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const analyzeFoodImage = async (file?: File) => {
    const imageFile = file || selectedImageFile;

    if (!imageFile) return;

    setImageLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch(
        `${API_URL}/analyze-food-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      const estimated =
        AVERAGE_WEIGHTS[(data.food || "").toLowerCase()] || 100;
      setEstimatedWeight(estimated);

      setSelectedFood({
        name: data.food,
        nutrition: data.nutrition,
        fdcId: data.fdcId,
        source: data.source,
      });

      setResults([]);
      setQuery("");

      setToastMessage(`Detected ${data.food}`);

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight * 0.45,
          behavior: "smooth",
        });
      }, 200);
      setTimeout(() => setToastMessage(""), 2500);
    } catch (error) {
      console.error(error);
    }

    setImageLoading(false);
  };

 const startCamera = async () => {
  setSelectedImage(null);
  setSelectedFood(null);

  try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        captureAndAnalyze();
      }, 2500);
    } catch (error) {
      console.error(error);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg");
    });

    if (!blob) return;

    const file = new File([blob], "capture.jpg", {
      type: "image/jpeg",
    });

    await analyzeFoodImage(file);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setCameraStream(null);
  };

  const loadFoodDetails = async (fdcId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/food-details/${fdcId}`
      );

      const data = await response.json();
      setSelectedFood(data);
      setSelectedWeight(100);
      const estimated =
        AVERAGE_WEIGHTS[(data.name || "").toLowerCase()] || 100;
      setEstimatedWeight(estimated);
    } catch (error) {
      console.error(error);
    }
  };

  const addToMeal = () => {
    if (!selectedFood) return;

    const foodWithServings = {
      ...selectedFood,
      weight: estimatedWeight,
    nutritionPer100g: {
  calories: selectedFood.nutrition?.calories || 0,
  protein: selectedFood.nutrition?.protein || 0,
  fat: selectedFood.nutrition?.fat || 0,
  carbs: selectedFood.nutrition?.carbs || 0,

  fiber: selectedFood.nutrition?.fiber || 0,
  sugar: selectedFood.nutrition?.sugar || 0,

  sodium: selectedFood.nutrition?.sodium || 0,
  potassium: selectedFood.nutrition?.potassium || 0,

  calcium: selectedFood.nutrition?.calcium || 0,
  iron: selectedFood.nutrition?.iron || 0,
  magnesium: selectedFood.nutrition?.magnesium || 0,

  vitamin_c: selectedFood.nutrition?.vitamin_c || 0,
},
     nutrition: {
  calories: (selectedFood.nutrition?.calories || 0) * weightMultiplier,
  protein: (selectedFood.nutrition?.protein || 0) * weightMultiplier,
  fat: (selectedFood.nutrition?.fat || 0) * weightMultiplier,
  carbs: (selectedFood.nutrition?.carbs || 0) * weightMultiplier,

  fiber: (selectedFood.nutrition?.fiber || 0) * weightMultiplier,
  sugar: (selectedFood.nutrition?.sugar || 0) * weightMultiplier,

  sodium: (selectedFood.nutrition?.sodium || 0) * weightMultiplier,
  potassium: (selectedFood.nutrition?.potassium || 0) * weightMultiplier,

  calcium: (selectedFood.nutrition?.calcium || 0) * weightMultiplier,
  iron: (selectedFood.nutrition?.iron || 0) * weightMultiplier,
  magnesium: (selectedFood.nutrition?.magnesium || 0) * weightMultiplier,

  vitamin_c: (selectedFood.nutrition?.vitamin_c || 0) * weightMultiplier,
},
    };

    setMeal((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.fdcId === foodWithServings.fdcId
      );

      if (existingIndex === -1) {
        return [...prev, foodWithServings];
      }

      return prev.map((item, index) => {
        if (index !== existingIndex) return item;

        return {
  ...item,
  weight: (item.weight || 100) + estimatedWeight,
  nutrition: {
    calories:
      (item.nutrition?.calories || 0) +
      (foodWithServings.nutrition?.calories || 0),

    protein:
      (item.nutrition?.protein || 0) +
      (foodWithServings.nutrition?.protein || 0),

    fat:
      (item.nutrition?.fat || 0) +
      (foodWithServings.nutrition?.fat || 0),

    carbs:
      (item.nutrition?.carbs || 0) +
      (foodWithServings.nutrition?.carbs || 0),

    fiber:
      (item.nutrition?.fiber || 0) +
      (foodWithServings.nutrition?.fiber || 0),

    sugar:
      (item.nutrition?.sugar || 0) +
      (foodWithServings.nutrition?.sugar || 0),

    sodium:
      (item.nutrition?.sodium || 0) +
      (foodWithServings.nutrition?.sodium || 0),

    potassium:
      (item.nutrition?.potassium || 0) +
      (foodWithServings.nutrition?.potassium || 0),

    calcium:
      (item.nutrition?.calcium || 0) +
      (foodWithServings.nutrition?.calcium || 0),

    iron:
      (item.nutrition?.iron || 0) +
      (foodWithServings.nutrition?.iron || 0),

    magnesium:
      (item.nutrition?.magnesium || 0) +
      (foodWithServings.nutrition?.magnesium || 0),

    vitamin_c:
      (item.nutrition?.vitamin_c || 0) +
      (foodWithServings.nutrition?.vitamin_c || 0),
  },
};
      });
    });
    setToastMessage(`${selectedFood.name} added to meal`);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const addFoodCardToMeal = async (fdcId: number, weight: number = 100) => {
    try {
      const response = await fetch(
        `${API_URL}/food-details/${fdcId}`
      );

      const food = await response.json();
      const multiplier = weight / 100;

      setMeal((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.fdcId === food.fdcId
        );

        if (existingIndex === -1) {
          return [
            ...prev,
            {
              ...food,
              weight,
nutritionPer100g: {
  calories: food.nutrition?.calories || 0,
  protein: food.nutrition?.protein || 0,
  fat: food.nutrition?.fat || 0,
  carbs: food.nutrition?.carbs || 0,

  fiber: food.nutrition?.fiber || 0,
  sugar: food.nutrition?.sugar || 0,

  sodium: food.nutrition?.sodium || 0,
  potassium: food.nutrition?.potassium || 0,

  calcium: food.nutrition?.calcium || 0,
  iron: food.nutrition?.iron || 0,
  magnesium: food.nutrition?.magnesium || 0,

  vitamin_c: food.nutrition?.vitamin_c || 0,
},
             nutrition: {
  calories: (food.nutrition?.calories || 0) * multiplier,
  protein: (food.nutrition?.protein || 0) * multiplier,
  fat: (food.nutrition?.fat || 0) * multiplier,
  carbs: (food.nutrition?.carbs || 0) * multiplier,

  fiber: (food.nutrition?.fiber || 0) * multiplier,
  sugar: (food.nutrition?.sugar || 0) * multiplier,

  sodium: (food.nutrition?.sodium || 0) * multiplier,
  potassium: (food.nutrition?.potassium || 0) * multiplier,

  calcium: (food.nutrition?.calcium || 0) * multiplier,
  iron: (food.nutrition?.iron || 0) * multiplier,
  magnesium: (food.nutrition?.magnesium || 0) * multiplier,

  vitamin_c: (food.nutrition?.vitamin_c || 0) * multiplier,
},
            },
          ];
        }

        return prev.map((item, index) => {
          if (index !== existingIndex) return item;

          return {
            ...item,
            weight: (item.weight || 100) + weight,
            nutrition: {
              calories: (item.nutrition?.calories || 0) + (food.nutrition?.calories || 0) * multiplier,
              protein: (item.nutrition?.protein || 0) + (food.nutrition?.protein || 0) * multiplier,
              fat: (item.nutrition?.fat || 0) + (food.nutrition?.fat || 0) * multiplier,
              carbs: (item.nutrition?.carbs || 0) + (food.nutrition?.carbs || 0) * multiplier,
              fiber: (item.nutrition?.fiber || 0) + (food.nutrition?.fiber || 0) * multiplier,
              sugar: (item.nutrition?.sugar || 0) + (food.nutrition?.sugar || 0) * multiplier,
              sodium: (item.nutrition?.sodium || 0) + (food.nutrition?.sodium || 0) * multiplier,
              potassium: (item.nutrition?.potassium || 0) + (food.nutrition?.potassium || 0) * multiplier,
              calcium: (item.nutrition?.calcium || 0) + (food.nutrition?.calcium || 0) * multiplier,
              iron: (item.nutrition?.iron || 0) + (food.nutrition?.iron || 0) * multiplier,
              magnesium: (item.nutrition?.magnesium || 0) + (food.nutrition?.magnesium || 0) * multiplier,
              vitamin_c: (item.nutrition?.vitamin_c || 0) + (food.nutrition?.vitamin_c || 0) * multiplier,
            },
          };
        });
      });
      setToastMessage(`${food.name} added to meal`);
      setTimeout(() => setToastMessage(""), 2500);
    } catch (error) {
      console.error(error);
    }
  };

  const removeFromMeal = (indexToRemove: number) => {
    setMeal((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const updateMealWeight = (index: number, change: number) => {
    setMeal((prev) =>
      prev.map((food, i) => {
        if (i !== index) return food;

        const currentWeight = food.weight || 100;
        const newWeight = Math.max(1, currentWeight + change);
        const multiplier = newWeight / 100;

        return {
          ...food,
          weight: newWeight,
        nutrition: {
  calories: (food.nutritionPer100g?.calories || 0) * multiplier,
  protein: (food.nutritionPer100g?.protein || 0) * multiplier,
  fat: (food.nutritionPer100g?.fat || 0) * multiplier,
  carbs: (food.nutritionPer100g?.carbs || 0) * multiplier,

  fiber: (food.nutritionPer100g?.fiber || 0) * multiplier,
  sugar: (food.nutritionPer100g?.sugar || 0) * multiplier,

  sodium: (food.nutritionPer100g?.sodium || 0) * multiplier,
  potassium: (food.nutritionPer100g?.potassium || 0) * multiplier,

  calcium: (food.nutritionPer100g?.calcium || 0) * multiplier,
  iron: (food.nutritionPer100g?.iron || 0) * multiplier,
  magnesium: (food.nutritionPer100g?.magnesium || 0) * multiplier,

  vitamin_c: (food.nutritionPer100g?.vitamin_c || 0) * multiplier,
},
        };
      })
    );
  };

  const saveCurrentMeal = () => {
    if (meal.length === 0) return;

    const mealData = {
      id: Date.now(),
      foods: meal,
      totals: mealTotals,
    };

    const updatedMeals = [...savedMeals, mealData];

    setSavedMeals(updatedMeals);
    localStorage.setItem("savedMeals", JSON.stringify(updatedMeals));
  };

  const loadSavedMeal = (mealPlan: any) => {
    setMeal(mealPlan.foods);
  };

  const deleteSavedMeal = (mealId: number) => {
    const updatedMeals = savedMeals.filter(
      (savedMeal) => savedMeal.id !== mealId
    );

    setSavedMeals(updatedMeals);
    localStorage.setItem("savedMeals", JSON.stringify(updatedMeals));
  };

const mealTotals = meal.reduce(
  (acc, food) => ({
    calories: acc.calories + (food.nutrition?.calories || 0),
    protein: acc.protein + (food.nutrition?.protein || 0),
    fat: acc.fat + (food.nutrition?.fat || 0),
    carbs: acc.carbs + (food.nutrition?.carbs || 0),

    fiber: acc.fiber + (food.nutrition?.fiber || 0),
    sugar: acc.sugar + (food.nutrition?.sugar || 0),

    sodium: acc.sodium + (food.nutrition?.sodium || 0),
    potassium: acc.potassium + (food.nutrition?.potassium || 0),

    calcium: acc.calcium + (food.nutrition?.calcium || 0),
    iron: acc.iron + (food.nutrition?.iron || 0),
    magnesium: acc.magnesium + (food.nutrition?.magnesium || 0),

    vitamin_c: acc.vitamin_c + (food.nutrition?.vitamin_c || 0),
  }),
  {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,

    fiber: 0,
    sugar: 0,

    sodium: 0,
    potassium: 0,

    calcium: 0,
    iron: 0,
    magnesium: 0,

    vitamin_c: 0,
  }
);

  const totalMacroCalories =
    mealTotals.protein * 4 +
    mealTotals.carbs * 4 +
    mealTotals.fat * 9;

  const proteinPct = totalMacroCalories
    ? ((mealTotals.protein * 4) / totalMacroCalories) * 100
    : 0;

  const carbsPct = totalMacroCalories
    ? ((mealTotals.carbs * 4) / totalMacroCalories) * 100
    : 0;

  const fatPct = totalMacroCalories
    ? ((mealTotals.fat * 9) / totalMacroCalories) * 100
    : 0;

  const mealInsights = [];

  if (mealTotals.protein < 25) {
    mealInsights.push(
      "Protein is low. Consider adding chicken breast, Greek yogurt, or salmon."
    );
  }
let nutritionScore = 100;

if (mealTotals.fiber < 25) nutritionScore -= 10;
if (mealTotals.potassium < 3500) nutritionScore -= 10;
if (mealTotals.magnesium < 400) nutritionScore -= 10;
if (mealTotals.vitamin_c < 90) nutritionScore -= 10;
if (mealTotals.protein < 50) nutritionScore -= 10;

nutritionScore = Math.max(0, nutritionScore);
  if (mealTotals.carbs > 100) {
    mealInsights.push(
      "Carbohydrates are relatively high compared to the rest of the meal."
    );
  }

  if (mealTotals.calories > 2000) {
    mealInsights.push(
      "This meal exceeds 2000 calories."
    );
  }

  if (mealInsights.length === 0 && meal.length > 0) {
    mealInsights.push("This meal appears reasonably balanced.");
  }

  if (proteinPct < 20 && meal.length > 0) {
    mealInsights.push(
      `Protein provides only ${proteinPct.toFixed(0)}% of calories.`
    );
  }

  if (carbsPct > 55 && meal.length > 0) {
    mealInsights.push(
      `Carbohydrates provide ${carbsPct.toFixed(0)}% of calories.`
    );
  }

  return (
    <main className={`${spaceGrotesk.className} min-h-screen bg-[#F8F8F5] text-[#111111]`}>
      <div className="mx-auto max-w-6xl px-6 py-6 sm:px-8 lg:px-8 lg:py-10">
        <div className="space-y-8">
        {toastMessage && (
  <div className="fixed top-6 right-6 z-50 rounded-2xl border border-[#39FF14] bg-white px-5 py-4 text-black shadow-2xl">
    ✓ {toastMessage}
  </div>
)}
        {/* Metrics Dashboard */}
        {meal.length > 0 && (
  <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
    <div className="rounded-[32px] border border-[#39FF14] bg-white p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Calories</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{mealTotals.calories.toFixed(0)}</p>
      <p className="text-sm text-zinc-500">Goal {calorieGoal}</p>
    </div>
    <div className="rounded-[32px] border border-[#39FF14] bg-white p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Protein</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{mealTotals.protein.toFixed(0)}g</p>
      <p className="text-sm text-zinc-500">Goal {proteinGoal}g</p>
    </div>
    <div className="rounded-[32px] border border-[#39FF14] bg-white p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Carbs</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{mealTotals.carbs.toFixed(0)}g</p>
      <p className="text-sm text-zinc-500">Goal {carbsGoal}g</p>
    </div>
    <div className="rounded-[32px] border border-[#39FF14] bg-white p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Fat</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{mealTotals.fat.toFixed(0)}g</p>
      <p className="text-sm text-zinc-500">Goal {fatGoal}g</p>
    </div>
  </div>
)}

        <div className="mb-4">
          <p className="mb-4 text-sm font-medium text-zinc-500">
            FOOD INTELLIGENCE
          </p>

          <h1 className="mb-4 max-w-3xl text-4xl font-semibold leading-[1] tracking-[-0.05em] text-[#111111] sm:text-5xl lg:text-[4rem]">
            Food Intelligence
          </h1>

          <p className="max-w-2xl text-base leading-7 text-zinc-500">
            Search USDA foods, analyze nutrition, estimate portions, and build meals with a cleaner nutrition-first workflow.
          </p>

          <div className="mt-6 rounded-[24px] border border-[#39FF14] bg-white p-6 shadow-[0_0_18px_rgba(57,255,20,0.18)] lg:p-7">
            <h3 className="mb-2 text-3xl font-semibold tracking-[-0.04em]">Food Lens</h3>
            <p className="mb-4 text-base leading-7 text-zinc-500">
              Point your camera at food and instantly identify nutrition using AI vision and USDA data.
            </p>

            <div className="flex gap-3">
              <button
                onClick={startCamera}
                className="rounded-2xl bg-[#111111] px-8 py-5 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#39FF14] hover:text-black hover:shadow-[0_0_35px_rgba(57,255,20,0.75)]"
              >
                {selectedFood ? "Scan Another Food" : "Start Camera"}
              </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {cameraActive && (
              <div className="relative mt-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-96 rounded-2xl border object-cover scale-x-[-1]"
                />

                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="relative h-64 w-64 rounded-3xl border-4 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.6)]">
                    <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-cyan-400"></div>
                    <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-cyan-400"></div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl bg-black px-4 py-2 text-sm text-white">
                  Center food inside the box
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="mb-4 mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchFood();
            }}
            placeholder="⌕ Search any food..."
            className="w-full rounded-[28px] border border-[#39FF14] bg-white px-8 py-6 text-lg text-black placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-none sm:flex-1"
          />
          <button
            onClick={searchFood}
            className="rounded-[28px] bg-[#111111] px-8 py-6 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#39FF14] hover:text-black hover:shadow-[0_0_35px_rgba(57,255,20,0.75)]"
          >
            Search
          </button>
        </div>

        {loading && (
          <div className="rounded-[32px] border border-[#39FF14] bg-white p-5 shadow-[0_0_22px_rgba(57,255,20,0.20)] sm:p-8">
            Searching USDA database...
          </div>
        )}


        <div className="mt-10 grid gap-4">
            {results.map((food) => (
              <div
                key={food.fdcId}
                onClick={() => loadFoodDetails(food.fdcId)}
                className="cursor-pointer rounded-[32px] border border-[#39FF14] bg-white p-5 shadow-[0_0_22px_rgba(57,255,20,0.20)] transition-all duration-300 hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.65)] sm:p-8"
              >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{food.name}</h2>

                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    USDA Verified • {food.source}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-zinc-500">Calories</span>
                      <p className="font-semibold">{food.nutrition?.calories ?? '-'} </p>
                    </div>

                    <div>
                      <span className="text-zinc-500">Protein</span>
                      <p className="font-semibold">{food.nutrition?.protein ?? '-'}g</p>
                    </div>

                    <div>
                      <span className="text-zinc-500">Fat</span>
                      <p className="font-semibold">{food.nutrition?.fat ?? '-'}g</p>
                    </div>

                    <div>
                      <span className="text-zinc-500">Carbs</span>
                      <p className="font-semibold">{food.nutrition?.carbs ?? '-'}g</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-sm font-medium text-zinc-500">
                    {food.source}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={cardWeights[food.fdcId] || 100}
                    onChange={(e) =>
                      setCardWeights((prev) => ({
                        ...prev,
                        [food.fdcId]: Number(e.target.value) || 100,
                      }))
                    }
                    className="w-24 rounded-xl border px-3 py-2 text-sm"
                    placeholder="grams"
                  />
                  <p className="text-xs text-zinc-500">
                    Weight (g)
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addFoodCardToMeal(
                        food.fdcId,
                        cardWeights[food.fdcId] || 100
                      );
                    }}
                    className="rounded-xl bg-[#111111] text-white px-4 py-2 text-sm transition-all duration-200 hover:-translate-y-1 hover:bg-[#39FF14] hover:text-black hover:shadow-[0_0_25px_rgba(57,255,20,0.75)]"
                  >
                    Add →
                  </button>
                </div>
              </div>
            </div>
          ))}
</div>

        {selectedFood && (
          <div className="mt-10 rounded-[32px] border border-[#39FF14] bg-white p-5 shadow-[0_0_22px_rgba(57,255,20,0.20)] sm:p-8">
            <div className="mb-3 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
              AI Detected Food
            </div>
            <h2 className="mb-4 text-3xl font-semibold tracking-[-0.04em]">
              {selectedFood.name}
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">Calories</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">
                  {((selectedFood.nutrition?.calories || 0) * weightMultiplier).toFixed(0)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-500">Protein</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">
                  {displayedNutrition?.protein.toFixed(1)}g
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-500">Fat</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">
                  {displayedNutrition?.fat.toFixed(1)}g
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-500">Carbs</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">
                  {displayedNutrition?.carbs.toFixed(1)}g
                </p>
              </div>
            </div>

            {/* Serving controls removed for weight-based tracking */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-zinc-500">
                Estimated Weight (grams)
              </p>

              <input
                type="number"
                value={estimatedWeight}
                onChange={(e) => setEstimatedWeight(Number(e.target.value) || 0)}
                className="w-40 rounded-xl border px-4 py-2"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Auto-estimated from food type. Adjust if needed.
              </p>
            </div>

            <button
              onClick={addToMeal}
              className="mt-8 rounded-2xl bg-[#111111] px-8 py-5 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#39FF14] hover:text-black hover:shadow-[0_0_35px_rgba(57,255,20,0.75)]"
            >
              Add →
            </button>
          </div>
          
        )}

        {meal.length > 0 && (
          <div className="mt-10 rounded-[32px] border border-[#39FF14] bg-white p-5 shadow-[0_0_22px_rgba(57,255,20,0.20)] sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">Meal Builder</h2>

              <button
                onClick={saveCurrentMeal}
                className="rounded-xl bg-[#111111] text-white px-4 py-2 text-sm transition-all duration-200 hover:-translate-y-1 hover:bg-[#39FF14] hover:text-black hover:shadow-[0_0_25px_rgba(57,255,20,0.75)]"
              >
                Save Meal
              </button>
              <button
                onClick={() => setMeal([])}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                Clear Meal
              </button>
            </div>

            <div className="mb-6 space-y-2">
              {meal.map((food, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p>{food.name}</p>

                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <button
                        onClick={() => updateMealWeight(index, -10)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border"
                      >
                        -
                      </button>

                      <span className="min-w-[70px] text-center text-zinc-500">
                        {food.weight || 100}g
                      </span>

                      <button
                        onClick={() => updateMealWeight(index, 10)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span>{Number(food.nutrition?.calories || 0).toFixed(0)} cal</span>

                    <button
                      onClick={() => removeFromMeal(index)}
                      className="rounded-lg border px-2 py-1 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Calories</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.calories.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Protein</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.protein.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Fat</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.fat.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Carbs</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.carbs.toFixed(1)}g</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Fiber</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.fiber.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Potassium</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.potassium.toFixed(0)}mg</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Magnesium</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.magnesium.toFixed(0)}mg</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#0F766E]">Vitamin C</p>
                <p className="text-2xl font-semibold tracking-[-0.03em]">{mealTotals.vitamin_c.toFixed(0)}mg</p>
              </div>
            </div>

            <div className="mt-10 border-t pt-8">
              <h3 className="mb-6 text-3xl font-semibold tracking-[-0.04em]">Daily Goals</h3>
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(Number(e.target.value) || 0)}
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(Number(e.target.value) || 0)}
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(Number(e.target.value) || 0)}
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(Number(e.target.value) || 0)}
                  className="rounded-xl border p-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <ProgressRing
                  label="Calories"
                  value={mealTotals.calories}
                  goal={calorieGoal}
                />

                <ProgressRing
                  label="Protein"
                  value={mealTotals.protein}
                  goal={proteinGoal}
                  suffix="g"
                />

                <ProgressRing
                  label="Carbs"
                  value={mealTotals.carbs}
                  goal={carbsGoal}
                  suffix="g"
                />

                <ProgressRing
                  label="Fat"
                  value={mealTotals.fat}
                  goal={fatGoal}
                  suffix="g"
                />
              </div>
            </div>

            <div className="mt-10 border-t pt-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-3xl font-semibold tracking-[-0.04em]">Meal Analysis</h3>
              </div>

              <div className="mb-6 rounded-3xl border border-[#39FF14] bg-white p-6 shadow-[0_0_18px_rgba(57,255,20,0.18)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-zinc-400">
                  Nutrition Score
                </p>
                <p className="mt-2 text-5xl font-bold tracking-[-0.04em] text-[#0F766E]">
                  {nutritionScore}/100
                </p>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#39FF14] bg-white p-4 shadow-[0_0_18px_rgba(57,255,20,0.18)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-zinc-400">Protein %</p>
                  <p className="text-2xl font-semibold tracking-[-0.03em]">{proteinPct.toFixed(0)}%</p>
                </div>

                <div className="rounded-2xl border border-[#39FF14] bg-white p-4 shadow-[0_0_18px_rgba(57,255,20,0.18)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-zinc-400">Carbs %</p>
                  <p className="text-2xl font-semibold tracking-[-0.03em]">{carbsPct.toFixed(0)}%</p>
                </div>

                <div className="rounded-2xl border border-[#39FF14] bg-white p-4 shadow-[0_0_18px_rgba(57,255,20,0.18)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-zinc-400">Fat %</p>
                  <p className="text-2xl font-semibold tracking-[-0.03em]">{fatPct.toFixed(0)}%</p>
                </div>
              </div>
              <div className="space-y-3">
                {mealInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-[#39FF14] bg-white p-4 shadow-[0_0_18px_rgba(57,255,20,0.18)]"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {savedMeals.length > 0 && (
          <div className="mt-10 rounded-3xl border border-[#39FF14] bg-white p-8 shadow-[0_0_18px_rgba(57,255,20,0.18)]">
            <h2 className="mb-6 text-3xl font-semibold tracking-[-0.04em]">Meal Library</h2>

            <div className="space-y-4">
              {savedMeals.map((mealPlan) => (
                <div key={mealPlan.id} className="rounded-2xl border border-[#39FF14] bg-white p-4 shadow-[0_0_22px_rgba(57,255,20,0.20)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {mealPlan.foods.length} food item(s)
                      </p>

                      <div>
                        <p className="text-sm font-medium text-zinc-500">
                          {mealPlan.totals.calories.toFixed(0)} calories
                        </p>

                        <p className="text-xs text-gray-400">
                          Protein: {mealPlan.totals.protein.toFixed(1)}g
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSavedMeal(mealPlan)}
                        className="rounded-lg border px-3 py-1 text-sm"
                      >
                        Load
                      </button>

                      <button
                        onClick={() => deleteSavedMeal(mealPlan.id)}
                        className="rounded-lg border px-3 py-1 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}

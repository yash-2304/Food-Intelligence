from fastapi import FastAPI, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import os
from google.cloud import vision
from google.oauth2 import service_account
from usda_client import (
    search_food,
    get_best_match,
    extract_basic_nutrition,
    get_food_details,
)




app = FastAPI()

credentials_json = os.getenv("GOOGLE_CREDENTIALS_JSON")

if credentials_json:
    credentials_json = credentials_json.strip()
    credentials_info = json.loads(credentials_json)
    credentials = service_account.Credentials.from_service_account_info(credentials_info)
    vision_client = vision.ImageAnnotatorClient(credentials=credentials)
else:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "credentials/google-vision.json"
    vision_client = vision.ImageAnnotatorClient()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.79:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MealItem(BaseModel):
    name: str
    servings: int = 1


class MealRequest(BaseModel):
    foods: List[MealItem]

with open("data/foods.json", "r") as file:
    foods = json.load(file)


@app.get("/")
def home():
    return {
        "project": "Food Intelligence",
        "status": "running"
    }


@app.get("/food/{food_name}")
def get_food(food_name: str):
    food = foods.get(food_name.lower())

    if not food:
        return {"error": "Food not found"}

    return food
@app.get("/ai-search/{query}")
def ai_search(query: str):
    query = query.lower()

    nutrient = None
    food_names = []

    # Protein
    if any(word in query for word in [
        "protein",
        "high protein",
        "muscle",
        "gym",
        "bodybuilding"
    ]):
        nutrient = "protein"
        food_names = [
            "chicken breast",
            "turkey breast",
            "tuna",
            "eggs",
            "greek yogurt"
        ]

    # Fiber
    elif any(word in query for word in [
        "fiber",
        "fibre",
        "high fiber",
        "high fibre"
    ]):
        nutrient = "fiber"
        food_names = [
            "black beans",
            "lentils",
            "oats",
            "pear",
            "apple"
        ]

    # Potassium
    elif any(word in query for word in [
        "potassium",
        "electrolyte",
        "electrolytes"
    ]):
        nutrient = "potassium"
        food_names = [
            "banana",
            "sweet potato",
            "avocado",
            "spinach",
            "coconut water"
        ]

    # Magnesium
    elif any(word in query for word in [
        "magnesium"
    ]):
        nutrient = "magnesium"
        food_names = [
            "spinach",
            "almonds",
            "pumpkin seeds",
            "black beans",
            "avocado"
        ]

    # Vitamin C
    elif any(word in query for word in [
        "vitamin c",
        "immune",
        "immunity"
    ]):
        nutrient = "vitamin_c"
        food_names = [
            "orange",
            "kiwi",
            "strawberry",
            "bell pepper",
            "broccoli"
        ]

    # Low calorie
    elif any(word in query for word in [
        "low calorie",
        "low calories",
        "weight loss",
        "diet food"
    ]):
        nutrient = "calories"
        food_names = [
            "cucumber raw",
            "lettuce raw",
            "celery raw",
            "watermelon raw",
            "zucchini raw"
        ]

    else:
        return {
            "intent": "unknown",
            "message": "No matching food intent found."
        }

    results = []

    for food_name in food_names:
        search_results = search_food(food_name)
        food = get_best_match(search_results)

        if food:
            nutrition = extract_basic_nutrition(food)

            results.append({
                "name": food["description"],
                "fdcId": food["fdcId"],
                "source": food["dataType"],
                "nutrition": nutrition
            })

    # Rank foods by requested nutrient
    results.sort(
        key=lambda x: x["nutrition"].get(nutrient, 0),
        reverse=(nutrient != "calories")
    )

    return results
@app.get("/search/{food_name}")
def search_usda_food(food_name: str):
    results = search_food(food_name)

    food = get_best_match(results)

    nutrition = extract_basic_nutrition(food)

    return {
        "name": food["description"],
        "fdcId": food["fdcId"],
        "source": food["dataType"],
        "nutrition": nutrition
    }


# New endpoint for food details by fdc_id
@app.get("/food-details/{fdc_id}")
def food_details(fdc_id: int):
    food = get_food_details(fdc_id)

    nutrition = extract_basic_nutrition(food)

    return {
        "name": food.get("description"),
        "fdcId": food.get("fdcId"),
        "source": food.get("dataType"),
        "nutrition": nutrition
    }

@app.get("/search-all/{food_name}")
def search_all_foods(food_name: str, limit: int = Query(default=5, le=20)):
    results = search_food(food_name)

    foods = results.get("foods", [])[:limit]

    output = []

    for food in foods:
        nutrition = extract_basic_nutrition(food)

        output.append({
            "name": food["description"],
            "fdcId": food["fdcId"],
            "source": food["dataType"],
            "nutrition": nutrition
        })

    return output


# Analyze meal endpoint
@app.post("/analyze-meal")
def analyze_meal(meal: MealRequest):
    totals = {
        "calories": 0,
        "protein": 0,
        "fat": 0,
        "carbs": 0
    }
    food_breakdown = []

    for item in meal.foods:
        results = search_food(item.name)
        food = get_best_match(results)
        nutrition = extract_basic_nutrition(food)

        totals["calories"] += nutrition["calories"] * item.servings
        totals["protein"] += nutrition["protein"] * item.servings
        totals["fat"] += nutrition["fat"] * item.servings
        totals["carbs"] += nutrition["carbs"] * item.servings

        food_breakdown.append({
            "name": item.name,
            "servings": item.servings,
            "nutrition": {
                "calories": nutrition["calories"] * item.servings,
                "protein": nutrition["protein"] * item.servings,
                "fat": nutrition["fat"] * item.servings,
                "carbs": nutrition["carbs"] * item.servings
            }
        })

    if totals["calories"] < 500 and totals["protein"] > 20:
        health_score = "A"
        health_reason = "Low calories and high protein"
    elif totals["calories"] < 800:
        health_score = "B"
        health_reason = "Moderate calories"
    elif totals["calories"] < 1200:
        health_score = "C"
        health_reason = "High calorie meal"
    elif totals["calories"] < 1800:
        health_score = "D"
        health_reason = "Very high calorie meal"
    else:
        health_score = "F"
        health_reason = "Extremely high calorie meal"

    return {
        "foods": food_breakdown,
        "totals": totals,
        "healthScore": health_score,
        "healthReason": health_reason
    }


# New endpoint for analyzing food images
@app.post("/analyze-food-image")
async def analyze_food_image(file: UploadFile = File(...)):
    content = await file.read()

    image = vision.Image(content=content)

    response = vision_client.label_detection(image=image)

    labels = [label.description for label in response.label_annotations]

    if not labels:
        return {
            "success": False,
            "message": "No food detected"
        }

    preferred_labels = [
        label for label in labels
        if label.lower() not in [
            "food",
            "fruit",
            "produce",
            "natural foods",
            "yellow",
            "staple food"
        ]
    ]

    food_name = preferred_labels[0] if preferred_labels else labels[0]

    results = search_food(food_name)
    food = get_best_match(results)

    nutrition = extract_basic_nutrition(food)

    return {
        "success": True,
        "food": food.get("description"),
        "fdcId": food.get("fdcId"),
        "source": food.get("dataType"),
        "nutrition": nutrition,
        "visionLabels": labels[:10]
    }
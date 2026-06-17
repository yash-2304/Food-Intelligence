import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("USDA_API_KEY")

BASE_URL = "https://api.nal.usda.gov/fdc/v1"


def search_food(query):
    url = f"{BASE_URL}/foods/search"

    response = requests.post(
        url,
        params={"api_key": API_KEY},
        json={
            "query": query,
            "pageSize": 50
        }
    )

    return response.json()


def get_food_details(fdc_id):
    response = requests.get(
        f"{BASE_URL}/food/{fdc_id}",
        params={"api_key": API_KEY}
    )

    response.raise_for_status()

    return response.json()

def get_best_match(results):
    priority = {
        "Foundation": 1,
        "Survey (FNDDS)": 2,
        "SR Legacy": 3,
        "Branded": 4
    }

    foods = results.get("foods", [])

    if not foods:
        return None

    foods = sorted(
        foods,
        key=lambda x: (
            priority.get(x.get("dataType", ""), 999),
            len(x.get("description", "")),
            1 if "raw" not in x.get("description", "").lower() else 0
        )
    )

    return foods[0]
def extract_basic_nutrition(food):
    nutrients = {
        "calories": 0,
        "protein": 0,
        "fat": 0,
        "carbs": 0,

        "fiber": 0,
        "sugar": 0,

        "sodium": 0,
        "potassium": 0,

        "calcium": 0,
        "iron": 0,
        "magnesium": 0,

        "vitamin_c": 0,
        "vitamin_a": 0,
        "vitamin_d": 0,
        "vitamin_b12": 0
    }

    for nutrient in food.get("foodNutrients", []):

        if "nutrientName" in nutrient:
            name = nutrient.get("nutrientName", "")
            value = nutrient.get("value", 0)
        else:
            name = nutrient.get("nutrient", {}).get("name", "")
            value = nutrient.get("amount", 0)
            print(name, "=", value)
        if name == "Energy":
            nutrients["calories"] = value

        elif name == "Protein":
            nutrients["protein"] = value

        elif name == "Total lipid (fat)":
            nutrients["fat"] = value

        elif name == "Carbohydrate, by difference":
            nutrients["carbs"] = value

        elif name == "Fiber, total dietary":
            nutrients["fiber"] = value

        elif name == "Sugars, total including NLEA":
            nutrients["sugar"] = value

        elif name == "Sodium, Na":
            nutrients["sodium"] = value

        elif name == "Potassium, K":
            nutrients["potassium"] = value

        elif name == "Calcium, Ca":
            nutrients["calcium"] = value

        elif name == "Iron, Fe":
            nutrients["iron"] = value

        elif name == "Magnesium, Mg":
            nutrients["magnesium"] = value

        elif name == "Vitamin C, total ascorbic acid":
            nutrients["vitamin_c"] = value

        elif name == "Vitamin A, RAE":
            nutrients["vitamin_a"] = value

        elif name == "Vitamin D (D2 + D3)":
            nutrients["vitamin_d"] = value

        elif name == "Vitamin B-12":
            nutrients["vitamin_b12"] = value

    return nutrients

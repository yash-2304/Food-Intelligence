from usda_client import (
    search_food,
    get_best_match,
    extract_basic_nutrition
)

results = search_food("banana")

food = get_best_match(results)

nutrition = extract_basic_nutrition(food)

print(food["description"])
print(nutrition)
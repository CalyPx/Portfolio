"""Precomputes QuakeSafe predictions for the "Will it survive?" game.

Loads Rohit's trained model (final_xgboost_model_70.joblib from github.com/CalyPx/earthquake-damage-prediction)
and builds every input exactly as that repo's webapp/main.py does, for each combination of the options the
game offers, in three real survey regions. The footprint stays at the web form's default. Writes public/quake-table.json.

    python scripts/quake_table.py <folder with the .joblib files>
"""
import itertools
import json
import pathlib
import sys

import joblib
import numpy as np
import pandas as pd

src = pathlib.Path(sys.argv[1])
model = joblib.load(src / 'final_xgboost_model_70.joblib')
columns = joblib.load(src / 'model_columns.joblib')
model.named_steps['xgb'].set_params(device='cpu')

FLOORS = [1, 2, 3, 4, 5]
AGES = [0, 5, 10, 20, 35, 60, 100]
FOUNDATIONS = {'Rubble/Stone': 'r', 'Undressed Stone': 'u', 'Wood': 'w', 'Cement/Brick': 'i', 'Other': 'h'}
ROOFS = {'Bamboo/Light Timber': 'n', 'Heavy Timber': 'q', 'Concrete/Cement': 'x'}
MUD = [0, 1]
# three real survey regions, from the lightest hit to the hardest hit in the 2015 data (see REGION_FACTS)
REGIONS = [26, 6, 17]
REGION_FACTS = {26: {'share_grade3': 8.6, 'buildings': 22615}, 6: {'share_grade3': 24.8, 'buildings': 24381}, 17: {'share_grade3': 80.8, 'buildings': 21813}}

# the form's default for what the game does not ask
AREA = 10        # "Small (30 to 70 m²)"
HEIGHT = {1: 3, 2: 6, 3: 6, 4: 10, 5: 10}   # the form's height bands, matched to the number of floors

rows, keys = [], []
for region, floors, age, (found, fv), (roof, rv), mud in itertools.product(REGIONS, FLOORS, AGES, FOUNDATIONS.items(), ROOFS.items(), MUD):
    row = dict.fromkeys(columns, 0.0)
    height = HEIGHT[floors]
    row['age'] = age
    row['count_floors_pre_eq'] = floors
    row['area_percentage'] = AREA
    row['height_percentage'] = height
    row['geo_level_1_id'] = region
    row['has_superstructure_mud_mortar_stone'] = mud
    row['volume_proxy'] = AREA * height
    row['age_log'] = np.log1p(age)
    row['floor_area_ratio'] = AREA / (floors + 1)
    if f'foundation_type_{fv}' in row:
        row[f'foundation_type_{fv}'] = 1
    if f'roof_type_{rv}' in row:
        row[f'roof_type_{rv}'] = 1
    rows.append(row)
    keys.append(f'{region}|{floors}|{age}|{fv}|{rv}|{mud}')

df = pd.DataFrame(rows, columns=columns).astype(float)
probs = model.predict_proba(df)
table = {k: [round(float(p) * 100, 1) for p in pr] for k, pr in zip(keys, probs)}

out = {
    'source': 'QuakeSafe Nepal, final_xgboost_model_70, predictions computed offline with the repo inputs',
    'options': {'regions': REGIONS, 'floors': FLOORS, 'ages': AGES, 'foundations': FOUNDATIONS, 'roofs': ROOFS},
    'regions': REGION_FACTS,
    'fixed': {'area_percentage': AREA, 'height_by_floors': HEIGHT},
    'p': table,   # key "region|floors|age|foundation|roof|mud" -> [grade 1 %, grade 2 %, grade 3 %]
}
dest = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'quake-table.json'
dest.write_text(json.dumps(out, separators=(',', ':')))
grades = np.argmax(probs, axis=1) + 1
print(f'{len(table)} combinations written to {dest}; predicted grades: ' + ', '.join(f'{g}: {(grades == g).sum()}' for g in (1, 2, 3)))

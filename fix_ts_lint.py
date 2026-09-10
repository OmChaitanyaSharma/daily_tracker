import re

def replace_in_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file("src/components/CityHeatmap3D.tsx", "import React, { useMemo } from 'react';", "import { useMemo } from 'react';")
replace_in_file("src/components/CityHeatmap3D.tsx", "import { getTodayStr } from '../utils/dateUtils';", "")

replace_in_file("src/components/WeeklyBoss.tsx", "import { getTodayStr } from '../utils/dateUtils';", "")

replace_in_file("src/pages/Shop.tsx", "import { ArrowLeft, Snowflake, Zap, Coffee, Shield } from 'lucide-react';", "import { ArrowLeft, Coffee, Shield } from 'lucide-react';")


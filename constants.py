# constants.py
"""
Application-wide constants including colors, activity levels, and mappings.
"""

# Color Scheme
COLORS = {
    'bg_gradient_top': '#667eea',
    'bg_gradient_bottom': '#764ba2',
    'card_bg': '#ffffff',
    'primary': '#667eea',
    'accent': '#f093fb',
    'text_dark': '#2d3748',
    'text_light': '#718096',
}

# Activity Levels (multiplier, title, description)
ACTIVITY_LEVELS = [
    ('1.2', 'Sedentary', 'Little or no exercise'),
    ('1.375', 'Lightly Active', '1-3 days/week'),
    ('1.55', 'Moderately Active', '3-5 days/week'),
    ('1.725', 'Very Active', '6-7 days/week'),
    ('1.9', 'Extremely Active', 'Physical job'),
]

# Weekly Goal Options (value in kg, description)
WEEKLY_GOALS = [
    ('0', 'No specific goal'),
    ('-1', 'Lose 1 kg/week'),
    ('-0.75', 'Lose 0.75 kg/week'),
    ('-0.5', 'Lose 0.5 kg/week'),
    ('-0.25', 'Lose 0.25 kg/week'),
    ('0.25', 'Gain 0.25 kg/week'),
    ('0.5', 'Gain 0.5 kg/week'),
    ('0.75', 'Gain 0.75 kg/week'),
    ('1', 'Gain 1 kg/week'),
]

# BMI Classification (max_value, category, color, bg_color)
BMI_RANGES = [
    (18.5, 'Underweight', '#3b82f6', '#dbeafe'),
    (25, 'Normal Weight', '#10b981', '#d1fae5'),
    (30, 'Overweight', '#f59e0b', '#fef3c7'),
    (float('inf'), 'Obese', '#ef4444', '#fee2e2'),
]

# WHR Classification (max_value, category, color, bg_color)
WHR_RANGES = [
    (0.4, 'Very Lean', '#3b82f6', '#dbeafe'),
    (0.5, 'Lean/Athletic', '#10b981', '#d1fae5'),
    (0.6, 'Healthy', '#10b981', '#d1fae5'),
    (0.63, 'Increased Risk', '#f59e0b', '#fef3c7'),
    (float('inf'), 'High Risk', '#ef4444', '#fee2e2'),
]

# Calorie conversion constant
CALORIES_PER_KG = 7700

# File paths
PROFILES_FILE = 'data/tdee_profiles.json'
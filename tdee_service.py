# tdee_service.py - WITH Ethnicity-Adjusted BMI Categories
"""
TDEE, BMR, BMI, WHtR calculation services with ethnicity adjustment.
"""

from constants import CALORIES_PER_KG

# Ethnicity adjustment factors for BMR (multiplicative)
ETHNICITY_ADJUSTMENTS = {
    'caucasian': 1.0,
    'african': 0.95,
    'asian': 0.97,
    'hispanic': 0.99,
    'middle_eastern': 1.0,
    'mixed': 1.0,
    'prefer_not_to_say': 1.0,
    'other': 1.0
}

# BMI Categories by Ethnicity (max_value, category, color, bg_color)
BMI_RANGES_BY_ETHNICITY = {
    # Asian populations - lower thresholds
    'asian': [
        (18.5, 'Underweight', '#3b82f6', '#dbeafe'),
        (23.0, 'Normal Weight', '#10b981', '#d1fae5'),  # Lower threshold
        (27.5, 'Overweight', '#f59e0b', '#fef3c7'),     # Lower threshold
        (float('inf'), 'Obese', '#ef4444', '#fee2e2'),
    ],
    # Standard WHO thresholds (Caucasian, Middle Eastern, Hispanic, Other)
    'standard': [
        (18.5, 'Underweight', '#3b82f6', '#dbeafe'),
        (25.0, 'Normal Weight', '#10b981', '#d1fae5'),
        (30.0, 'Overweight', '#f59e0b', '#fef3c7'),
        (float('inf'), 'Obese', '#ef4444', '#fee2e2'),
    ],
    # African populations - standard thresholds but different interpretation
    'african': [
        (18.5, 'Underweight', '#3b82f6', '#dbeafe'),
        (25.0, 'Normal Weight', '#10b981', '#d1fae5'),
        (30.0, 'Overweight', '#f59e0b', '#fef3c7'),
        (float('inf'), 'Obese', '#ef4444', '#fee2e2'),
    ],
}

# WHtR Classification
WHTR_RANGES = [
    (0.40, 'Extremely Lean', '#3b82f6', '#dbeafe'),
    (0.43, 'Very Lean', '#3b82f6', '#dbeafe'),
    (0.46, 'Lean/Athletic', '#10b981', '#d1fae5'),
    (0.53, 'Healthy', '#10b981', '#d1fae5'),
    (0.58, 'Increased Risk', '#f59e0b', '#fef3c7'),
    (0.63, 'High Risk', '#ef4444', '#fee2e2'),
    (float('inf'), 'Very High Risk', '#ef4444', '#fee2e2'),
]


class TDEEService:
    """Service for all TDEE-related calculations with ethnicity support."""
    
    @staticmethod
    def calculate_bmr(weight_kg, height_cm, age, gender, ethnicity='prefer_not_to_say'):
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
        with ethnicity adjustment.
        """
        # Standard Mifflin-St Jeor calculation
        if gender.lower() == 'male':
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        else:
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
        
        # Apply ethnicity adjustment
        adjustment = ETHNICITY_ADJUSTMENTS.get(ethnicity, 1.0)
        adjusted_bmr = bmr * adjustment
        
        print(f"🧬 BMR Calculation: base={bmr:.2f}, ethnicity={ethnicity}, adjustment={adjustment}, final={adjusted_bmr:.2f}")
        
        return adjusted_bmr
    
    @staticmethod
    def calculate_tdee(bmr, activity_level):
        """Calculate Total Daily Energy Expenditure."""
        return bmr * activity_level
    
    @staticmethod
    def calculate_bmi(weight_kg, height_cm):
        """Calculate Body Mass Index."""
        height_m = height_cm / 100
        return weight_kg / (height_m ** 2)
    
    @staticmethod
    def get_bmi_category(bmi, ethnicity='prefer_not_to_say'):
        """
        Get BMI category with ethnicity-adjusted thresholds.
        
        Args:
            bmi: BMI value
            ethnicity: Ethnicity key for adjusted thresholds
        
        Returns:
            dict: {category, color, bg_color, ethnicity_note}
        """
        # Determine which BMI ranges to use
        if ethnicity == 'asian':
            ranges = BMI_RANGES_BY_ETHNICITY['asian']
            ethnicity_note = "Using Asian-specific BMI thresholds (lower risk thresholds)"
        elif ethnicity == 'african':
            ranges = BMI_RANGES_BY_ETHNICITY['african']
            ethnicity_note = "Using standard BMI thresholds (African populations typically have higher muscle mass)"
        else:
            ranges = BMI_RANGES_BY_ETHNICITY['standard']
            ethnicity_note = None
        
        for max_val, category, color, bg_color in ranges:
            if bmi < max_val:
                result = {
                    'category': category,
                    'color': color,
                    'bg_color': bg_color
                }
                if ethnicity_note:
                    result['ethnicity_note'] = ethnicity_note
                return result
        
        return {
            'category': 'Unknown',
            'color': '#718096',
            'bg_color': '#f7fafc'
        }
    
    @staticmethod
    def calculate_whtr(waist_cm, height_cm):
        """Calculate Waist-to-Height Ratio (WHtR)."""
        return waist_cm / height_cm
    
    @staticmethod
    def calculate_whr(waist_cm, hip_cm):
        """Calculate Waist-to-Hip Ratio (WHR)."""
        return waist_cm / hip_cm
    
    @staticmethod
    def get_whtr_category(whtr):
        """Get WHtR category and associated colors."""
        for max_val, category, color, bg_color in WHTR_RANGES:
            if whtr < max_val:
                health_info = ""
                if whtr < 0.40:
                    health_info = "Excellent body composition for competitive athletes"
                elif whtr < 0.43:
                    health_info = "Very good - typical for fitness competitors"
                elif whtr < 0.46:
                    health_info = "Good - athletic build"
                elif whtr < 0.53:
                    health_info = "Healthy range - low health risk"
                elif whtr < 0.58:
                    health_info = "Take action - increased health risk"
                elif whtr < 0.63:
                    health_info = "High risk - consider dietary changes"
                else:
                    health_info = "Very high risk - consult healthcare provider"
                
                return {
                    'category': category,
                    'color': color,
                    'bg_color': bg_color,
                    'health_info': health_info
                }
        
        return {
            'category': 'Unknown',
            'color': '#718096',
            'bg_color': '#f7fafc',
            'health_info': 'Unable to determine'
        }
    
    @staticmethod
    def calculate_healthy_weight_range(height_cm, ethnicity='prefer_not_to_say'):
        """
        Calculate healthy weight range with ethnicity-adjusted BMI thresholds.
        
        Args:
            height_cm: Height in centimeters
            ethnicity: Ethnicity for adjusted thresholds
        
        Returns:
            tuple: (min_weight_kg, max_weight_kg)
        """
        height_m = height_cm / 100
        
        # Use ethnicity-specific thresholds
        if ethnicity == 'asian':
            min_bmi = 18.5
            max_bmi = 23.0  # Lower for Asian populations
        else:
            min_bmi = 18.5
            max_bmi = 25.0  # Standard WHO
        
        min_weight = min_bmi * (height_m ** 2)
        max_weight = max_bmi * (height_m ** 2)
        return min_weight, max_weight
    
    @staticmethod
    def calculate_target_calories(tdee, weekly_goal_kg):
        """Calculate target calories based on weekly goal."""
        weekly_calorie_change = weekly_goal_kg * CALORIES_PER_KG
        daily_calorie_change = weekly_calorie_change / 7
        return int(tdee + daily_calorie_change)
    
    @staticmethod
    def get_ethnicity_info(ethnicity):
        """Get information about ethnicity adjustment."""
        adjustment = ETHNICITY_ADJUSTMENTS.get(ethnicity, 1.0)
        
        descriptions = {
            'caucasian': 'Standard calculation (baseline)',
            'african': 'Adjusted for typically lower metabolic rate (~5% reduction)',
            'asian': 'Adjusted for typically lower metabolic rate (~3% reduction) + Lower BMI thresholds',
            'hispanic': 'Adjusted for typically lower metabolic rate (~1% reduction)',
            'middle_eastern': 'Standard calculation (baseline)',
            'mixed': 'Standard calculation (baseline)',
            'prefer_not_to_say': 'Standard calculation (baseline)',
            'other': 'Standard calculation (baseline)'
        }
        
        return {
            'adjustment_factor': adjustment,
            'description': descriptions.get(ethnicity, 'Standard calculation')
        }
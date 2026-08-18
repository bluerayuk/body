# helpers.py
"""
Helper functions for unit conversions, validation, and formatting.
"""

from datetime import datetime

# Conversion constants
LBS_TO_KG = 0.453592
INCHES_TO_CM = 2.54


def convert_to_metric(weight, height, unit_system):
    """
    Convert weight and height to metric if needed.
    
    Args:
        weight: Weight value
        height: Height value
        unit_system: 'metric' or 'imperial'
    
    Returns:
        tuple: (weight_kg, height_cm)
    """
    if unit_system == 'imperial':
        weight_kg = weight * LBS_TO_KG
        height_cm = height * INCHES_TO_CM
        return weight_kg, height_cm
    return weight, height


def convert_from_metric(value, unit_system, value_type='weight'):
    """
    Convert metric value to imperial if needed.
    
    Args:
        value: Metric value (kg or cm)
        unit_system: 'metric' or 'imperial'
        value_type: 'weight' or 'height'
    
    Returns:
        float: Converted value
    """
    if unit_system == 'imperial':
        if value_type == 'weight':
            return value / LBS_TO_KG
        elif value_type == 'height':
            return value / INCHES_TO_CM
    return value


def get_unit_label(unit_system, value_type='weight'):
    """
    Get the appropriate unit label.
    
    Args:
        unit_system: 'metric' or 'imperial'
        value_type: 'weight' or 'height'
    
    Returns:
        str: Unit label (kg/lbs, cm/in)
    """
    if value_type == 'weight':
        return 'kg' if unit_system == 'metric' else 'lbs'
    elif value_type == 'height':
        return 'cm' if unit_system == 'metric' else 'in'
    return ''


def validate_numeric_input(value, field_name, min_val=None, max_val=None):
    """
    Validate that input is numeric and within range.
    
    Args:
        value: Value to validate
        field_name: Name of field (for error messages)
        min_val: Minimum allowed value
        max_val: Maximum allowed value
    
    Returns:
        tuple: (is_valid, error_message, float_value)
    """
    try:
        float_val = float(value)
        
        if min_val is not None and float_val < min_val:
            return False, f"{field_name} must be at least {min_val}", None
        
        if max_val is not None and float_val > max_val:
            return False, f"{field_name} must be at most {max_val}", None
        
        return True, "", float_val
    
    except (ValueError, TypeError):
        return False, f"Please enter a valid number for {field_name}", None


def format_date(timestamp, format_type='full'):
    """
    Format a timestamp string.
    
    Args:
        timestamp: Timestamp string in format '%Y-%m-%d %H:%M:%S'
        format_type: 'full', 'date', 'time', or 'short'
    
    Returns:
        str: Formatted date string
    """
    try:
        dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
        
        if format_type == 'date':
            return dt.strftime('%Y-%m-%d')
        elif format_type == 'time':
            return dt.strftime('%H:%M:%S')
        elif format_type == 'short':
            return dt.strftime('%m/%d')
        else:  # full
            return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return timestamp


def format_number(value, decimals=1, include_sign=False):
    """
    Format a number with specified decimals and optional sign.
    
    Args:
        value: Number to format
        decimals: Number of decimal places
        include_sign: Whether to include + for positive numbers
    
    Returns:
        str: Formatted number string
    """
    formatted = f"{value:.{decimals}f}"
    
    if include_sign and value > 0:
        return f"+{formatted}"
    
    return formatted
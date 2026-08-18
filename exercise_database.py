# exercise_database.py
"""
Comprehensive exercise database organized by muscle groups.
Includes 400+ exercises covering all training styles:
- Bodybuilding & Hypertrophy
- Powerlifting & Strength
- Olympic Weightlifting
- Strongman Training
- Functional Fitness
- Cardio & Conditioning
- Mobility & Stretching

Easily expandable - just add more exercises to the relevant muscle group list.
"""

# Exercise database organized by muscle groups
EXERCISE_DATABASE = {
    'Chest': [
        # Barbell Exercises - Flat
        'Bench Press',
        'Wide-Grip Bench Press',
        'Close-Grip Bench Press',
        'Guillotine Press',
        'Floor Press',
        'Reverse-Grip Bench Press',
        
        # Barbell Exercises - Incline/Decline
        'Incline Bench Press',
        'Decline Bench Press',
        'Incline Close-Grip Bench Press',
        
        # Dumbbell Exercises - Press
        'Dumbbell Press',
        'Incline Dumbbell Press',
        'Decline Dumbbell Press',
        'Single-Arm Dumbbell Press',
        'Alternating Dumbbell Press',
        'Neutral-Grip Dumbbell Press',
        
        # Dumbbell Exercises - Flyes
        'Dumbbell Flyes',
        'Incline Dumbbell Flyes',
        'Decline Dumbbell Flyes',
        'Hex Press',
        'Squeeze Press',
        
        # Machine Exercises
        'Cable Flyes',
        'Low Cable Flyes',
        'High Cable Flyes',
        'Cable Crossovers',
        'Chest Press Machine',
        'Hammer Strength Press',
        'Pec Deck',
        'Plate-Loaded Chest Press',
        
        # Bodyweight Exercises
        'Push-ups',
        'Wide-Grip Push-ups',
        'Diamond Push-ups',
        'Archer Push-ups',
        'Decline Push-ups',
        'Plyometric Push-ups',
        'Chest Dips',
        'Weighted Dips',
        'Deficit Push-ups',
        'Band Push-ups',
    ],
    
    'Back': [
        # Deadlift Variations
        'Deadlift',
        'Romanian Deadlift',
        'Sumo Deadlift',
        'Trap Bar Deadlift',
        'Deficit Deadlift',
        'Rack Pulls',
        'Snatch-Grip Deadlift',
        'Stiff-Leg Deadlift',
        
        # Vertical Pull - Bodyweight
        'Pull-ups',
        'Chin-ups',
        'Wide-Grip Pull-ups',
        'Close-Grip Pull-ups',
        'Neutral-Grip Pull-ups',
        'Weighted Pull-ups',
        'Weighted Chin-ups',
        'Archer Pull-ups',
        'Mixed-Grip Pull-ups',
        
        # Vertical Pull - Machine/Cable
        'Lat Pulldown',
        'Wide-Grip Pulldown',
        'Close-Grip Pulldown',
        'Underhand Pulldown',
        'Neutral-Grip Pulldown',
        'Single-Arm Lat Pulldown',
        'Straight-Arm Pulldown',
        'V-Bar Pulldown',
        
        # Horizontal Row - Barbell
        'Bent-Over Rows',
        'Pendlay Rows',
        'Underhand Barbell Row',
        'Yates Row',
        'Meadows Row',
        
        # Horizontal Row - Dumbbell
        'Single-Arm Dumbbell Row',
        'Two-Arm Dumbbell Row',
        'Chest-Supported Dumbbell Row',
        'Incline Bench Row',
        'Kroc Rows',
        
        # Horizontal Row - Machine/Cable
        'Seated Cable Rows',
        'Wide-Grip Cable Row',
        'Close-Grip Cable Row',
        'Chest-Supported Row Machine',
        'T-Bar Rows',
        'Landmine Row',
        'Hammer Strength Row',
        
        # Isolation & Detail
        'Face Pulls',
        'Reverse Flyes',
        'Rear Delt Cable Flyes',
        'Band Pull-Aparts',
        'Hyperextensions',
        'Good Mornings',
        'Seal Rows',
        'Inverted Rows',
    ],
    
    'Shoulders': [
        # Overhead Press - Barbell
        'Overhead Press',
        'Military Press',
        'Behind-the-Neck Press',
        'Push Press',
        'Strict Press',
        'Seated Barbell Press',
        'Bradford Press',
        
        # Overhead Press - Dumbbell
        'Dumbbell Shoulder Press',
        'Arnold Press',
        'Single-Arm Dumbbell Press',
        'Alternating Dumbbell Press',
        'Seated Dumbbell Press',
        'Neutral-Grip Shoulder Press',
        'Half-Kneeling Press',
        
        # Overhead Press - Machine
        'Machine Shoulder Press',
        'Hammer Strength Press',
        'Smith Machine Shoulder Press',
        
        # Lateral Delts
        'Lateral Raises',
        'Dumbbell Lateral Raises',
        'Cable Lateral Raises',
        'Machine Lateral Raises',
        'Leaning Lateral Raises',
        'Single-Arm Lateral Raise',
        'Upright Rows',
        'Wide-Grip Upright Rows',
        'Lu Raises',
        '6-Ways',
        
        # Front Delts
        'Front Raises',
        'Plate Front Raises',
        'Cable Front Raises',
        'Barbell Front Raises',
        'Alternating Front Raises',
        
        # Rear Delts
        'Rear Delt Flyes',
        'Cable Rear Delt Flyes',
        'Machine Reverse Flyes',
        'Reverse Pec Deck',
        'Face Pulls',
        'Band Pull-Aparts',
        'Bent-Over Lateral Raises',
        
        # Traps
        'Shrugs',
        'Dumbbell Shrugs',
        'Barbell Shrugs',
        'Trap Bar Shrugs',
        'Cable Shrugs',
        'Behind-the-Back Shrugs',
    ],
    
    'Arms': [
        # Biceps - Barbell
        'Barbell Curl',
        'EZ-Bar Curl',
        'Wide-Grip Barbell Curl',
        'Close-Grip Barbell Curl',
        'Drag Curls',
        'Reverse Curl',
        '21s',
        'Cheat Curls',
        
        # Biceps - Dumbbell
        'Dumbbell Curl',
        'Alternating Dumbbell Curl',
        'Hammer Curls',
        'Cross-Body Hammer Curl',
        'Incline Dumbbell Curl',
        'Concentration Curls',
        'Spider Curls',
        'Zottman Curls',
        'Waiter Curls',
        
        # Biceps - Cable/Machine
        'Cable Curls',
        'High Cable Curl',
        'Single-Arm Cable Curl',
        'Rope Cable Curl',
        'Bayesian Curls',
        'Preacher Curls',
        'Machine Preacher Curl',
        'Cable Preacher Curl',
        
        # Triceps - Pressing
        'Close-Grip Bench Press',
        'Board Press',
        'JM Press',
        'Tricep Dips',
        'Weighted Dips',
        'Bench Dips',
        
        # Triceps - Extension
        'Skull Crushers',
        'Overhead Tricep Extension',
        'Dumbbell Overhead Extension',
        'Single-Arm Overhead Extension',
        'French Press',
        'Decline Skull Crushers',
        'Cable Overhead Extension',
        
        # Triceps - Pushdown
        'Tricep Pushdowns',
        'Rope Pushdowns',
        'V-Bar Pushdowns',
        'Reverse-Grip Pushdowns',
        'Single-Arm Pushdowns',
        'Straight-Bar Pushdowns',
        
        # Triceps - Isolation
        'Kickbacks',
        'Single-Arm Cable Kickback',
        'Overhead Cable Extension',
        'Tate Press',
        'Diamond Push-ups',
        
        # Forearms
        'Wrist Curls',
        'Reverse Wrist Curls',
        'Hammer Curls',
        'Farmer\'s Walks',
        'Plate Pinch Holds',
        'Reverse Curls',
        'Wrist Roller',
        'Fat Grip Training',
    ],
    
    'Legs': [
        # Quad-Dominant - Squat
        'Squats',
        'Back Squats',
        'Front Squats',
        'High-Bar Squats',
        'Low-Bar Squats',
        'Box Squats',
        'Pause Squats',
        'Goblet Squats',
        'Zercher Squats',
        'Safety Bar Squats',
        'Bulgarian Split Squats',
        'Split Squats',
        'Overhead Squats',
        
        # Quad-Dominant - Lunge
        'Lunges',
        'Walking Lunges',
        'Reverse Lunges',
        'Forward Lunges',
        'Lateral Lunges',
        'Curtsy Lunges',
        'Deficit Reverse Lunges',
        'Jump Lunges',
        
        # Quad-Dominant - Machine
        'Leg Press',
        'Hack Squats',
        'Pendulum Squats',
        'Leg Extensions',
        'Sissy Squats',
        'Belt Squats',
        'Smith Machine Squats',
        
        # Hamstring-Dominant
        'Romanian Deadlift',
        'Stiff-Leg Deadlift',
        'Good Mornings',
        'Leg Curls',
        'Seated Leg Curls',
        'Lying Leg Curls',
        'Standing Leg Curls',
        'Nordic Curls',
        'Glute-Ham Raise',
        'Sliding Leg Curls',
        
        # Glutes
        'Hip Thrusts',
        'Barbell Hip Thrust',
        'Single-Leg Hip Thrust',
        'Glute Bridges',
        'Single-Leg Glute Bridge',
        'Weighted Glute Bridge',
        'Cable Pull-Throughs',
        'Frog Pumps',
        'Donkey Kicks',
        'Cable Kickbacks',
        'Fire Hydrants',
        
        # Calves
        'Calf Raises',
        'Standing Calf Raises',
        'Seated Calf Raises',
        'Single-Leg Calf Raise',
        'Donkey Calf Raises',
        'Smith Machine Calf Raises',
        'Leg Press Calf Raises',
        
        # Adductors/Abductors
        'Hip Adduction Machine',
        'Hip Abduction Machine',
        'Copenhagen Plank',
        'Sumo Squats',
        'Cossack Squats',
        
        # Compound/Full Leg
        'Step-ups',
        'Box Step-ups',
        'Weighted Step-ups',
        'Pistol Squats',
        'Sled Push',
        'Sled Drag',
    ],
    
    'Core': [
        # Front Core - Planks
        'Planks',
        'Front Plank',
        'Extended Plank',
        'Weighted Plank',
        'Feet-Elevated Plank',
        'RKC Plank',
        'Dead Bug',
        'Hollow Body Hold',
        'Long-Lever Plank',
        
        # Front Core - Crunch
        'Crunches',
        'Bicycle Crunches',
        'Reverse Crunches',
        'Decline Crunches',
        'Weighted Crunches',
        'Cable Crunches',
        'Machine Crunches',
        'Toe Touches',
        
        # Front Core - Leg Raise
        'Leg Raises',
        'Hanging Leg Raises',
        'Hanging Knee Raises',
        'Lying Leg Raises',
        'Captain\'s Chair',
        'Dragon Flags',
        'Windshield Wipers',
        'V-Ups',
        'Jackknife Sit-ups',
        
        # Obliques - Side Bending
        'Russian Twists',
        'Weighted Russian Twists',
        'Side Planks',
        'Side Plank Raises',
        'Side Bends',
        'Dumbbell Side Bends',
        'Suitcase Carries',
        
        # Obliques - Rotation
        'Woodchoppers',
        'Cable Woodchoppers',
        'Landmine Rotations',
        'Pallof Press',
        'Anti-Rotation Press',
        'Medicine Ball Slams',
        'Oblique Crunches',
        
        # Full Core - Dynamic
        'Mountain Climbers',
        'Ab Wheel Rollouts',
        'Barbell Rollouts',
        'Swiss Ball Rollouts',
        'Turkish Get-ups',
        'Farmer\'s Walks',
        'Overhead Carries',
        'Waiter Walks',
        
        # Lower Back/Posterior Core
        'Hyperextensions',
        'Back Extensions',
        '45-Degree Back Extension',
        'Reverse Hyperextensions',
        'Superman Holds',
        'Bird Dogs',
        'Good Mornings',
    ],
    
    'Full Body': [
        # Olympic Lifts
        'Clean and Jerk',
        'Power Clean',
        'Hang Clean',
        'Clean Pull',
        'Snatch',
        'Power Snatch',
        'Hang Snatch',
        'Snatch Pull',
        'Clean and Press',
        'Hang Power Clean',
        
        # Strongman
        'Farmer\'s Walks',
        'Sled Push',
        'Sled Drag',
        'Tire Flips',
        'Atlas Stone Lifts',
        'Log Press',
        'Yoke Walks',
        'Sandbag Carries',
        'Keg Carries',
        'Truck Pull',
        
        # Functional/CrossFit
        'Burpees',
        'Turkish Get-ups',
        'Man Makers',
        'Thrusters',
        'Kettlebell Swings',
        'Kettlebell Snatches',
        'Battle Ropes',
        'Wall Balls',
        'Devil Press',
        'Dumbbell Snatches',
        
        # Circuits & Conditioning
        'Bear Crawls',
        'Crab Walks',
        'Inchworms',
        'Sprawls',
        'Broad Jumps',
        'Long Jumps',
    ],
    
    'Cardio': [
        # Running
        'Treadmill Running',
        'Incline Walking',
        'Sprint Intervals',
        'Hill Sprints',
        'HIIT Sprints',
        'Fartlek Training',
        'Tempo Runs',
        'Distance Running',
        
        # Cycling
        'Stationary Bike',
        'Assault Bike',
        'Spin Class',
        'Airdyne',
        'Recumbent Bike',
        'Bike Intervals',
        
        # Rowing
        'Rowing Machine',
        'Row Intervals',
        '500m Sprints',
        '2k Row',
        
        # Jumping
        'Jump Rope',
        'Double Unders',
        'Box Jumps',
        'Depth Jumps',
        'Lateral Jumps',
        
        # Machines
        'Step Mill',
        'Elliptical',
        'Arc Trainer',
        'Ski Erg',
        'VersaClimber',
        
        # Other
        'Swimming',
        'Shadow Boxing',
        'Heavy Bag Work',
        'Speed Bag',
        'Stair Climbing',
    ],
    
    'Stretching & Mobility': [
        # Dynamic Stretching
        'Leg Swings',
        'Arm Circles',
        'Hip Circles',
        'Cat-Cow Stretch',
        'World\'s Greatest Stretch',
        'Walking Lunges with Twist',
        'High Knees',
        'Butt Kicks',
        'Toy Soldiers',
        
        # Static Stretching - Lower Body
        'Hamstring Stretch',
        'Quad Stretch',
        'Hip Flexor Stretch',
        'Glute Stretch',
        'Calf Stretch',
        'IT Band Stretch',
        'Butterfly Stretch',
        'Frog Stretch',
        'Pigeon Pose',
        'Figure-4 Stretch',
        
        # Static Stretching - Upper Body
        'Chest Stretch',
        'Shoulder Stretch',
        'Tricep Stretch',
        'Lat Stretch',
        'Neck Stretch',
        'Wrist Stretch',
        
        # Yoga Poses
        'Child\'s Pose',
        'Downward Dog',
        'Cobra Pose',
        'Upward Dog',
        'Warrior Pose',
        'Triangle Pose',
        
        # Mobility Work
        'Foam Rolling',
        'Lacrosse Ball Release',
        'Band Dislocations',
        'Wall Slides',
        'Hip 90/90',
        'Thoracic Rotations',
        'Ankle Mobility Drills',
        'Shoulder CARs',
        'Hip CARs',
    ],
}


def get_all_muscle_groups():
    """
    Get list of all available muscle groups.
    
    Returns:
        list: Sorted list of muscle group names
    """
    return sorted(list(EXERCISE_DATABASE.keys()))


def get_exercises_for_muscle_group(muscle_group, custom_exercises_dict=None):
    """
    Get all exercises for a specific muscle group (default + custom).
    
    Args:
        muscle_group: Name of muscle group
        custom_exercises_dict: Optional dictionary of custom exercises
    
    Returns:
        list: Sorted list of exercise names, or empty list if not found
    """
    # Get default exercises
    exercises = list(EXERCISE_DATABASE.get(muscle_group, []))
    
    # Add custom exercises if provided
    if custom_exercises_dict and muscle_group in custom_exercises_dict:
        exercises.extend(custom_exercises_dict[muscle_group])
    
    return sorted(set(exercises))  # Remove duplicates and sort


def get_all_exercises():
    """
    Get all exercises across all muscle groups.
    
    Returns:
        list: Sorted list of all exercise names
    """
    all_exercises = []
    for exercises in EXERCISE_DATABASE.values():
        all_exercises.extend(exercises)
    return sorted(set(all_exercises))  # Remove duplicates and sort


def search_exercises(query):
    """
    Search for exercises by name (case-insensitive).
    
    Args:
        query: Search string
    
    Returns:
        dict: {muscle_group: [matching_exercises]}
    """
    query_lower = query.lower()
    results = {}
    
    for muscle_group, exercises in EXERCISE_DATABASE.items():
        matching = [ex for ex in exercises if query_lower in ex.lower()]
        if matching:
            results[muscle_group] = sorted(matching)
    
    return results


def add_custom_exercise(muscle_group, exercise_name, custom_exercises_dict):
    """
    Add a custom exercise to the database.
    
    Args:
        muscle_group: Target muscle group
        exercise_name: Name of exercise
        custom_exercises_dict: Dictionary to store custom exercises
    
    Returns:
        tuple: (success, error_message)
    """
    # Validate inputs
    exercise_name = exercise_name.strip()
    if not exercise_name:
        return False, "Exercise name cannot be empty"
    
    if not muscle_group:
        return False, "Please select a muscle group"
    
    if muscle_group not in EXERCISE_DATABASE:
        return False, f"Invalid muscle group: {muscle_group}"
    
    # Check if exercise already exists (in default or custom)
    all_exercises = EXERCISE_DATABASE[muscle_group] + custom_exercises_dict.get(muscle_group, [])
    if exercise_name in all_exercises:
        return False, f"Exercise '{exercise_name}' already exists in {muscle_group}"
    
    # Add to custom exercises dictionary
    if muscle_group not in custom_exercises_dict:
        custom_exercises_dict[muscle_group] = []
    
    custom_exercises_dict[muscle_group].append(exercise_name)
    custom_exercises_dict[muscle_group].sort()
    
    return True, ""


def delete_custom_exercise(muscle_group, exercise_name, custom_exercises_dict):
    """
    Delete a custom exercise (cannot delete default exercises).
    
    Args:
        muscle_group: Target muscle group
        exercise_name: Name of exercise to delete
        custom_exercises_dict: Dictionary storing custom exercises
    
    Returns:
        tuple: (success, error_message)
    """
    # Check if it's a default exercise
    if exercise_name in EXERCISE_DATABASE.get(muscle_group, []):
        return False, "Cannot delete default exercises"
    
    # Check if it exists in custom exercises
    if muscle_group not in custom_exercises_dict:
        return False, "No custom exercises found for this muscle group"
    
    if exercise_name not in custom_exercises_dict[muscle_group]:
        return False, "Custom exercise not found"
    
    # Remove the exercise
    custom_exercises_dict[muscle_group].remove(exercise_name)
    
    # Clean up empty lists
    if not custom_exercises_dict[muscle_group]:
        del custom_exercises_dict[muscle_group]
    
    return True, ""


def is_custom_exercise(muscle_group, exercise_name, custom_exercises_dict):
    """
    Check if an exercise is custom (not default).
    
    Args:
        muscle_group: Target muscle group
        exercise_name: Name of exercise
        custom_exercises_dict: Dictionary storing custom exercises
    
    Returns:
        bool: True if custom, False if default
    """
    if muscle_group not in custom_exercises_dict:
        return False
    
    return exercise_name in custom_exercises_dict[muscle_group]


def get_custom_exercises(muscle_group, custom_exercises_dict):
    """
    Get only custom exercises for a muscle group.
    
    Args:
        muscle_group: Target muscle group
        custom_exercises_dict: Dictionary storing custom exercises
    
    Returns:
        list: Custom exercise names
    """
    return sorted(custom_exercises_dict.get(muscle_group, []))


def get_exercise_count():
    """
    Get total number of exercises in database.
    
    Returns:
        int: Total exercise count
    """
    return len(get_all_exercises())


def get_database_stats():
    """
    Get statistics about the exercise database.
    
    Returns:
        dict: Statistics including counts per muscle group
    """
    stats = {
        'total_exercises': get_exercise_count(),
        'total_muscle_groups': len(EXERCISE_DATABASE),
        'exercises_per_group': {}
    }
    
    for muscle_group, exercises in EXERCISE_DATABASE.items():
        stats['exercises_per_group'][muscle_group] = len(set(exercises))
    
    return stats


def get_compound_exercises():
    """
    Get list of major compound exercises.
    
    Returns:
        list: Compound movement exercise names
    """
    compounds = [
        # Big 3
        'Bench Press', 'Squats', 'Deadlift',
        # Upper Body Compounds
        'Overhead Press', 'Pull-ups', 'Bent-Over Rows',
        # Lower Body Compounds
        'Front Squats', 'Romanian Deadlift', 'Lunges',
        # Olympic
        'Clean and Jerk', 'Snatch', 'Power Clean',
    ]
    return compounds


def get_isolation_exercises():
    """
    Get list of isolation exercises by muscle group.
    
    Returns:
        dict: {muscle_group: [isolation_exercises]}
    """
    isolation = {
        'Chest': ['Cable Flyes', 'Pec Deck', 'Dumbbell Flyes'],
        'Back': ['Straight-Arm Pulldown', 'Face Pulls'],
        'Shoulders': ['Lateral Raises', 'Front Raises', 'Rear Delt Flyes'],
        'Arms': ['Concentration Curls', 'Cable Curls', 'Tricep Pushdowns', 'Kickbacks'],
        'Legs': ['Leg Extensions', 'Leg Curls', 'Calf Raises'],
    }
    return isolation


def get_exercises_by_equipment(equipment_type):
    """
    Get exercises that use specific equipment.
    
    Args:
        equipment_type: 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'
    
    Returns:
        list: Exercise names using that equipment
    """
    equipment_keywords = {
        'barbell': ['Barbell', 'Bench Press', 'Deadlift', 'Squat', 'Row'],
        'dumbbell': ['Dumbbell'],
        'cable': ['Cable'],
        'machine': ['Machine', 'Pec Deck'],
        'bodyweight': ['Push-up', 'Pull-up', 'Dip', 'Plank'],
    }
    
    keywords = equipment_keywords.get(equipment_type.lower(), [])
    all_exercises = get_all_exercises()
    
    matching = []
    for exercise in all_exercises:
        if any(keyword in exercise for keyword in keywords):
            matching.append(exercise)
    
    return sorted(matching)


# Example usage and testing
if __name__ == '__main__':
    print("=" * 70)
    print(" " * 15 + "COMPREHENSIVE EXERCISE DATABASE")
    print("=" * 70)
    
    stats = get_database_stats()
    print(f"\n📊 Total Exercises: {stats['total_exercises']}")
    print(f"💪 Total Muscle Groups: {stats['total_muscle_groups']}")
    print("\n" + "=" * 70)
    print("EXERCISES PER MUSCLE GROUP")
    print("-" * 70)
    
    for group, count in sorted(stats['exercises_per_group'].items(), 
                                key=lambda x: x[1], reverse=True):
        bar = "█" * (count // 2)
        print(f"  {group:25} {count:3} exercises {bar}")
    
    print("\n" + "=" * 70)
    print("SAMPLE: Back Exercises (showing first 20)")
    print("-" * 70)
    back_exercises = get_exercises_for_muscle_group('Back')
    for i, exercise in enumerate(back_exercises[:20], 1):
        print(f"  {i:2}. {exercise}")
    if len(back_exercises) > 20:
        print(f"  ... and {len(back_exercises) - 20} more")
    
    print("\n" + "=" * 70)
    print("SEARCH EXAMPLE: 'squat'")
    print("-" * 70)
    results = search_exercises('squat')
    total_matches = sum(len(exercises) for exercises in results.values())
    print(f"Found {total_matches} exercises containing 'squat'\n")
    for group, exercises in sorted(results.items()):
        print(f"{group} ({len(exercises)} matches):")
        for exercise in exercises[:8]:  # Show first 8
            print(f"  • {exercise}")
        if len(exercises) > 8:
            print(f"  ... and {len(exercises) - 8} more")
        print()
    
    print("=" * 70)
    print("COMPOUND MOVEMENTS (Big Lifts)")
    print("-" * 70)
    for exercise in get_compound_exercises():
        print(f"  💪 {exercise}")
    
    print("\n" + "=" * 70)
    print("EQUIPMENT FILTER: Barbell Exercises (first 15)")
    print("-" * 70)
    barbell = get_exercises_by_equipment('barbell')
    for i, exercise in enumerate(barbell[:15], 1):
        print(f"  {i:2}. {exercise}")
    if len(barbell) > 15:
        print(f"  ... and {len(barbell) - 15} more")
    
    print("\n" + "=" * 70)
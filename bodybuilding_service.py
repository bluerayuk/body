# services/bodybuilding_service.py - COMPLETE WITH WORKOUT DURATION SUPPORT + DEBUG LOGGING
"""
Service for managing bodybuilding routines and workout logs.
Uses exercise_database.py for exercise data.
NOW SUPPORTS workout duration tracking and display.
ENHANCED: Full debug logging for rep field tracking.
"""

from datetime import datetime
import logging
from exercise_database import get_all_muscle_groups, get_exercises_for_muscle_group

logger = logging.getLogger(__name__)


class BodybuildingService:
    """Service for bodybuilding routine and workout management with duration tracking."""
    
    @staticmethod
    def get_muscle_groups():
        """Get list of muscle groups from external database."""
        return get_all_muscle_groups()
    
    @staticmethod
    def get_exercises_for_muscle_group(muscle_group):
        """Get exercises for a specific muscle group from external database."""
        return get_exercises_for_muscle_group(muscle_group)
    
    @staticmethod
    def create_routine(name, exercises):
        """
        Create a routine data structure.
        
        Args:
            name: Routine name
            exercises: List of exercise dicts with 'exercise', 'sets', 'reps', 'rest'
        
        Returns: 
            dict: Routine data
        """
        logger.info("=" * 60)
        logger.info(f"ðŸ“¦ CREATE_ROUTINE: '{name}'")
        logger.info(f"   Exercises to save: {len(exercises)}")
        
        for idx, ex in enumerate(exercises):
            logger.info(f"   Exercise {idx + 1}: {ex.get('exercise', 'UNKNOWN')}")
            logger.info(f"      Sets: {ex.get('sets', 'MISSING')}")
            logger.info(f"      min_reps: {ex.get('min_reps', 'MISSING')}")
            logger.info(f"      max_reps: {ex.get('max_reps', 'MISSING')}")
            logger.info(f"      current_reps: {ex.get('current_reps', 'MISSING')}")
            logger.info(f"      Rest: {ex.get('rest', 'MISSING')}")
            logger.info(f"      Full object: {ex}")
        
        logger.info("=" * 60)
        
        return {
            'name': name,
            'exercises': exercises,
            'created':  datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'modified': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    @staticmethod
    def save_routine(profile_service, profile_name, routine_name, exercises):
        """
        Save a routine to a profile.
        
        Args:
            profile_service: ProfileService instance
            profile_name: Name of profile
            routine_name: Name of routine
            exercises: List of exercise dicts
        
        Returns: 
            bool: Success status
        """
        logger.info("=" * 60)
        logger.info(f"ðŸ’¾ SAVE_ROUTINE called")
        logger.info(f"   Profile: '{profile_name}'")
        logger.info(f"   Routine: '{routine_name}'")
        logger.info(f"   Number of exercises: {len(exercises)}")
        logger.info("=" * 60)
        
        # Normalize routine name
        routine_name = str(routine_name).strip()
        
        if not routine_name:
            logger.warning("Attempted to save routine with empty name")
            return False
        
        profile = profile_service.get_profile(profile_name)
        if not profile:
            logger.warning(f"Profile not found: {profile_name}")
            return False
        
        if 'routines' not in profile:
            profile['routines'] = {}
        
        # ðŸ”¥ LOG INCOMING EXERCISE DATA
        logger.info("ðŸ“ INCOMING EXERCISE DATA FROM JAVASCRIPT:")
        for idx, ex in enumerate(exercises):
            logger.info(f"   Exercise {idx + 1}:")
            logger.info(f"      exercise: {ex.get('exercise', 'MISSING')}")
            logger.info(f"      sets: {ex.get('sets', 'MISSING')}")
            logger.info(f"      min_reps: {ex.get('min_reps', 'MISSING')}")
            logger.info(f"      max_reps: {ex.get('max_reps', 'MISSING')}")
            logger.info(f"      current_reps: {ex.get('current_reps', 'MISSING')}")
            logger.info(f"      rest: {ex.get('rest', 'MISSING')}")
            
            # Check for legacy fields
            if 'minReps' in ex or 'maxReps' in ex or 'reps' in ex:
                logger.warning(f"      âš ï¸ LEGACY FIELDS DETECTED:")
                if 'minReps' in ex:
                    logger.warning(f"         minReps (camelCase): {ex.get('minReps')}")
                if 'maxReps' in ex:
                    logger.warning(f"         maxReps (camelCase): {ex.get('maxReps')}")
                if 'reps' in ex:
                    logger.warning(f"         reps (old format): {ex.get('reps')}")
        
        profile['routines'][routine_name] = BodybuildingService.create_routine(
            routine_name, exercises
        )
        
        success = profile_service.update_profile(profile_name, profile)
        if success:
            logger.info(f"âœ… Saved routine '{routine_name}' to profile '{profile_name}'")
            
            # ðŸ”¥ VERIFY WHAT WAS SAVED
            logger.info("ðŸ” VERIFICATION - Reading back saved routine:")
            saved_profile = profile_service.get_profile(profile_name)
            if saved_profile and 'routines' in saved_profile:
                saved_routine = saved_profile['routines'].get(routine_name)
                if saved_routine:
                    logger.info(f"   Found saved routine with {len(saved_routine.get('exercises', []))} exercises")
                    for idx, ex in enumerate(saved_routine.get('exercises', [])):
                        logger.info(f"   Saved Exercise {idx + 1}:")
                        logger.info(f"      exercise: {ex.get('exercise', 'MISSING')}")
                        logger.info(f"      sets: {ex.get('sets', 'MISSING')}")
                        logger.info(f"      min_reps: {ex.get('min_reps', 'MISSING')}")
                        logger.info(f"      max_reps: {ex.get('max_reps', 'MISSING')}")
                        logger.info(f"      current_reps: {ex.get('current_reps', 'MISSING')}")
                        logger.info(f"      rest: {ex.get('rest', 'MISSING')}")
        else:
            logger.error(f"âŒ Failed to save routine '{routine_name}'")
        
        logger.info("=" * 60)
        return success
    
    @staticmethod
    def delete_routine(profile_service, profile_name, routine_name):
        """Delete a routine from a profile."""
        routine_name = str(routine_name).strip()
        
        profile = profile_service.get_profile(profile_name)
        if not profile or 'routines' not in profile:
            return False
        
        if routine_name in profile['routines']:
            del profile['routines'][routine_name]
            success = profile_service.update_profile(profile_name, profile)
            if success: 
                logger.info(f"Deleted routine '{routine_name}' from profile '{profile_name}'")
            return success
        
        return False
    
    @staticmethod
    def get_routines(profile_service, profile_name):
        """Get all routines for a profile."""
        profile = profile_service.get_profile(profile_name)
        if not profile or 'routines' not in profile:
            return {}
        
        return profile['routines']
    
    @staticmethod
    def get_routine(profile_service, profile_name, routine_name):
        """Get a specific routine."""
        routine_name = str(routine_name).strip()
        routines = BodybuildingService.get_routines(profile_service, profile_name)
        return routines.get(routine_name)
    
    @staticmethod
    def create_workout_session(routine):
        """
        Create a workout session from a routine.
        
        Args:
            routine: Routine dict with 'exercises' key
        
        Returns:
            list: List of set dicts for logging
        """
        session = []
        for exercise_data in routine.get('exercises', []):
            exercise_name = exercise_data.get('exercise')
            try:
                sets = int(exercise_data.get('sets', 0))
            except Exception:
                sets = 0
            target_reps = exercise_data.get('reps')
            
            for set_num in range(1, sets + 1):
                session.append({
                    'exercise': exercise_name,
                    'set': set_num,
                    'target_reps': target_reps,
                    'weight': None,
                    'reps': None,
                    'completed': False,
                    'rest': exercise_data.get('rest', 60)
                })
        
        return session
    
    @staticmethod
    def log_workout(profile_service, profile_name, routine_name, workout_data, duration_seconds=None):
        """
        Save a completed workout to history with validation and duration tracking.
        
        Args:
            profile_service: ProfileService instance
            profile_name: Name of profile
            routine_name: Name of routine performed
            workout_data: List of logged set dicts
            duration_seconds: Workout duration in seconds (optional)
        
        Returns: 
            tuple: (success, error_message)
        """
        profile = profile_service.get_profile(profile_name)
        if not profile:
            return False, "Profile not found"
        
        if 'workout_history' not in profile:
            profile['workout_history'] = []
        
        # Validate and normalize workout data
        validated_exercises = []
        for ex in workout_data:
            try:
                exercise_name = str(ex.get('exercise', '')).strip()
                if not exercise_name:
                    logger.warning("Skipping exercise with empty name")
                    continue
                
                set_num = int(ex.get('set', 0))
                weight = float(ex.get('weight', 0))
                
                # Parse reps (handle "10/12" format)
                reps_val = ex.get('reps')
                if isinstance(reps_val, str) and '/' in reps_val: 
                    reps = int(reps_val.split('/')[0])
                else: 
                    reps = int(reps_val)
                
                # Validate values
                if weight < 0:
                    logger.warning(f"Negative weight for {exercise_name}: {weight}")
                    continue
                if reps <= 0:
                    logger.warning(f"Invalid reps for {exercise_name}: {reps}")
                    continue
                
                validated_exercises.append({
                    'exercise': exercise_name,
                    'set': set_num,
                    'weight': weight,
                    'reps': reps
                })
                
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse exercise data: {str(e)}")
                continue
        
        if not validated_exercises:
            logger.warning(f"No valid exercises to log for {routine_name}")
            return False, "No valid exercises to log"
        
        workout_entry = {
            'routine': routine_name,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'exercises': validated_exercises
        }
        
        # Add duration if provided
        if duration_seconds is not None and duration_seconds > 0:
            # Format duration as human-readable string
            hours = duration_seconds // 3600
            minutes = (duration_seconds % 3600) // 60
            seconds = duration_seconds % 60
            
            if hours > 0:
                duration_str = f"{hours}h {minutes}m {seconds}s"
            elif minutes > 0:
                duration_str = f"{minutes}m {seconds}s"
            else:
                duration_str = f"{seconds}s"
            
            workout_entry['duration'] = duration_str
            workout_entry['duration_seconds'] = duration_seconds
            logger.info(f"â±ï¸ Workout duration: {duration_str} ({duration_seconds}s)")
        
        profile['workout_history'].append(workout_entry)
        success = profile_service.update_profile(profile_name, profile)
        
        if success:
            logger.info(f"Logged workout for routine '{routine_name}' with {len(validated_exercises)} exercises")
            return True, ""
        else: 
            return False, "Failed to save workout"
    
    @staticmethod
    def get_workout_history(profile_service, profile_name):
        """Get workout history for a profile."""
        profile = profile_service.get_profile(profile_name)
        if not profile or 'workout_history' not in profile:
            return []
        
        return profile['workout_history']
    
    @staticmethod
    def delete_workout(profile_service, profile_name, workout_index):
        """
        Delete a workout from history by index.
        
        Args:
            profile_service: ProfileService instance
            profile_name: Name of profile
            workout_index: Index of workout to delete
        
        Returns:
            tuple: (success, error_message)
        """
        profile = profile_service.get_profile(profile_name)
        if not profile:
            return False, "Profile not found"
        
        if 'workout_history' not in profile:
            return False, "No workout history found"
        
        workout_history = profile['workout_history']
        
        if workout_index < 0 or workout_index >= len(workout_history):
            return False, "Invalid workout index"
        
        # Get workout details for logging
        deleted_workout = workout_history[workout_index]
        routine_name = deleted_workout.get('routine', 'Unknown')
        workout_date = deleted_workout.get('date', 'Unknown date')
        
        # Delete the workout
        del workout_history[workout_index]
        
        # Update profile
        success = profile_service.update_profile(profile_name, profile)
        
        if success:
            logger.info(f"Deleted workout '{routine_name}' from {workout_date} for profile '{profile_name}'")
            return True, ""
        else:
            return False, "Failed to save profile after deletion"
    
    @staticmethod
    def get_workout_stats(workout_history):
        """
        Calculate statistics from workout history with robust parsing.
        
        Args:
            workout_history: List of workout entries
        
        Returns: 
            dict: Statistics including total_duration
        """
        if not workout_history:
            return {
                'total_workouts': 0,
                'total_sets': 0,
                'total_reps': 0,
                'total_volume': 0,
                'total_duration_seconds': 0,
                'avg_duration_seconds': 0,
                'exercises_performed': []
            }
        
        total_sets = 0
        total_reps = 0
        total_volume = 0
        total_duration_seconds = 0
        workouts_with_duration = 0
        exercises = set()
        
        for workout in workout_history:
            for exercise in workout.get('exercises', []):
                try:
                    total_sets += 1
                    reps_val = exercise.get('reps', 0)
                    
                    # Handle "10/12" style or numeric
                    if isinstance(reps_val, str) and '/' in reps_val:
                        reps = int(reps_val.split('/')[0])
                    else:
                        reps = int(reps_val)
                    
                    weight_val = exercise.get('weight', 0)
                    weight = float(weight_val) if weight_val not in (None, '') else 0.0
                    
                    total_reps += reps
                    total_volume += reps * weight
                    
                    if exercise.get('exercise'):
                        exercises.add(exercise.get('exercise'))
                
                except Exception as e:
                    logger.warning(f"Failed to parse exercise in stats: {str(e)}")
                    continue
            
            # Track duration if available
            if 'duration_seconds' in workout:
                try:
                    total_duration_seconds += int(workout['duration_seconds'])
                    workouts_with_duration += 1
                except:
                    pass
        
        avg_duration = total_duration_seconds / workouts_with_duration if workouts_with_duration > 0 else 0
        
        return {
            'total_workouts': len(workout_history),
            'total_sets': total_sets,
            'total_reps': total_reps,
            'total_volume': round(total_volume, 2),
            'total_duration_seconds': total_duration_seconds,
            'avg_duration_seconds': round(avg_duration, 0),
            'exercises_performed': sorted(list(exercises))
        }
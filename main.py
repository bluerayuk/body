# main.py - COMPLETE VERSION with Weight & Waist Tracker Support
"""
Native desktop application entry point using PyWebView.
Includes full workout timer duration tracking and comprehensive API.
NOW WITH WAIST TRACKING SUPPORT.
"""

import webview
from profile_service import ProfileService
from bodybuilding_service import BodybuildingService
from tdee_service import TDEEService
from storage_service import StorageService
from helpers import convert_to_metric
import logging
import sys
import traceback
import platform

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Try to import pywin32, but don't fail if it's not available
PYWIN32_AVAILABLE = False
if platform.system() == 'Windows':
    try:
        import win32gui
        import win32con
        PYWIN32_AVAILABLE = True
        logger.info("âœ… pywin32 is available - advanced window control enabled")
    except ImportError:
        logger.warning("âš ï¸ pywin32 not available - using basic window control")
        logger.warning("   Install with: pip install pywin32")


class NativeAPI:
    """Python API exposed to JavaScript via PyWebView."""
    
    def __init__(self):
        logger.info("=" * 60)
        logger.info("Initializing Native API")
        logger.info("=" * 60)
        
        try:
            self.storage = StorageService()
            self.profile_service = ProfileService(self.storage)
            self.bb_service = BodybuildingService()
            self.tdee_service = TDEEService()
            
            logger.info("Native API initialized successfully")
            logger.info(f"Profiles loaded: {len(self.profile_service.profiles)}")
            logger.info("=" * 60)
        except Exception as e:
            logger.error(f"Failed to initialize API: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def _handle_error(self, method_name, error):
        """Centralized error handling"""
        logger.error(f"Error in {method_name}: {str(error)}")
        logger.error(traceback.format_exc())
        return {
            'success': False,
            'error': str(error)
        }
    
    # ========== JAVASCRIPT LOGGING METHOD ==========
    
    def js_log(self, message):
        """Log messages from JavaScript to Python console."""
        logger.info(f"[JS] {message}")
        return True
    
    # ========== WINDOW CONTROL METHODS ==========
    
    def resize_window(self, width, height):
        """Resize the application window."""
        try:
            import webview
            
            COMPACT_WIDTH = 1400
            COMPACT_HEIGHT = 1350
            
            logger.info(f"ðŸ”§ Resize request: {width}x{height}")
            
            if width < 1200:
                width = COMPACT_WIDTH
                height = COMPACT_HEIGHT
                logger.info(f"ðŸ”’ Using fixed compact size: {width}x{height}")
            else:
                MIN_WIDTH = 1200
                MIN_HEIGHT = 800
                width = max(int(width), MIN_WIDTH)
                height = max(int(height), MIN_HEIGHT)
            
            logger.info(f"ðŸªŸ Attempting to resize window to {width}x{height}")
            
            if not webview.windows:
                logger.error("âŒ No windows found")
                return {'success': False, 'error': 'No window found'}
            
            main_window = webview.windows[0]
            
            if platform.system() == 'Windows' and PYWIN32_AVAILABLE:
                try:
                    logger.info("ðŸªŸ Using Windows API for resize...")
                    
                    def callback(h, extra):
                        if win32gui.IsWindowVisible(h):
                            title = win32gui.GetWindowText(h)
                            if "TDEE Tracker" in title or "Bodybuilding" in title:
                                extra.append(h)
                        return True
                    
                    handles = []
                    win32gui.EnumWindows(callback, handles)
                    
                    if handles:
                        hwnd = handles[0]
                        logger.info(f"âœ… Found window handle: {hwnd}")
                        
                        rect = win32gui.GetWindowRect(hwnd)
                        current_x = rect[0]
                        current_y = rect[1]
                        
                        logger.info(f"ðŸ“ Current position: {current_x}, {current_y}")
                        
                        result = win32gui.SetWindowPos(
                            hwnd,
                            win32con.HWND_TOP,
                            current_x,
                            current_y,
                            width,
                            height,
                            win32con.SWP_SHOWWINDOW
                        )
                        
                        if result:
                            logger.info(f"âœ… Windows API resize successful: {width}x{height}")
                            
                            style = win32gui.GetWindowLong(hwnd, win32con.GWL_STYLE)
                            new_style = style & ~win32con.WS_THICKFRAME & ~win32con.WS_MAXIMIZEBOX
                            win32gui.SetWindowLong(hwnd, win32con.GWL_STYLE, new_style)
                            
                            win32gui.SetWindowPos(
                                hwnd, None, 0, 0, 0, 0,
                                win32con.SWP_NOMOVE | win32con.SWP_NOSIZE | 
                                win32con.SWP_NOZORDER | win32con.SWP_FRAMECHANGED
                            )
                            
                            logger.info("ðŸ”’ Window locked (disabled resize borders)")
                            
                            return {'success': True, 'width': width, 'height': height, 'method': 'Windows API'}
                        else:
                            logger.error("âŒ SetWindowPos failed")
                            return {'success': False, 'error': 'SetWindowPos failed'}
                    else:
                        logger.error("âŒ Could not find window")
                        return {'success': False, 'error': 'Window not found'}
                        
                except Exception as win_error:
                    logger.error(f"âŒ Windows API error: {win_error}")
                    logger.warning("Falling back to PyWebView resize...")
            
            try:
                logger.info("ðŸªŸ Using PyWebView resize...")
                main_window.resize(width, height)
                
                try:
                    main_window.resizable = False
                    logger.info("ðŸ”’ Window made non-resizable")
                except AttributeError:
                    logger.warning("âš ï¸ Cannot disable resizing on this platform")
                
                logger.info(f"âœ… PyWebView resize successful: {width}x{height}")
                return {'success': True, 'width': width, 'height': height, 'method': 'PyWebView'}
            except Exception as e:
                logger.error(f"âŒ PyWebView resize failed: {e}")
                return {'success': False, 'error': str(e)}
            
        except Exception as e:
            logger.error(f"âŒ Error resizing window: {e}")
            return self._handle_error('resize_window', e)
    
    def unlock_window(self):
        """Make window resizable again."""
        try:
            if platform.system() == 'Windows' and PYWIN32_AVAILABLE:
                try:
                    logger.info("ðŸ”“ Unlocking window with Windows API...")
                    
                    def callback(h, extra):
                        if win32gui.IsWindowVisible(h):
                            title = win32gui.GetWindowText(h)
                            if "TDEE Tracker" in title or "Bodybuilding" in title:
                                extra.append(h)
                        return True
                    
                    handles = []
                    win32gui.EnumWindows(callback, handles)
                    
                    if handles:
                        hwnd = handles[0]
                        
                        style = win32gui.GetWindowLong(hwnd, win32con.GWL_STYLE)
                        new_style = style | win32con.WS_THICKFRAME | win32con.WS_MAXIMIZEBOX
                        win32gui.SetWindowLong(hwnd, win32con.GWL_STYLE, new_style)
                        
                        win32gui.SetWindowPos(
                            hwnd, None, 0, 0, 0, 0,
                            win32con.SWP_NOMOVE | win32con.SWP_NOSIZE | 
                            win32con.SWP_NOZORDER | win32con.SWP_FRAMECHANGED
                        )
                        
                        logger.info("âœ… Window unlocked (enabled resize borders)")
                        return {'success': True, 'method': 'Windows API'}
                    else:
                        logger.error("âŒ Could not find window handle")
                        return {'success': False, 'error': 'Window not found'}
                        
                except Exception as e:
                    logger.error(f"âŒ Windows API unlock error: {e}")
                    logger.warning("Falling back to PyWebView...")
            
            import webview
            if webview.windows:
                main_window = webview.windows[0]
                try:
                    main_window.resizable = True
                    logger.info("ðŸ”“ Window made resizable (PyWebView)")
                    return {'success': True, 'method': 'PyWebView'}
                except AttributeError:
                    logger.warning("âš ï¸ Cannot enable resizing on this platform")
                    return {'success': False, 'error': 'Not supported on this platform'}
            
            return {'success': False, 'error': 'No window found'}
                
        except Exception as e:
            return self._handle_error('unlock_window', e)
    
    def get_screen_size(self):
        """Get the screen dimensions."""
        try:
            logger.info("ðŸ–¥ï¸ Getting screen size...")
            
            try:
                import tkinter as tk
                root = tk.Tk()
                root.withdraw()
                screen_width = root.winfo_screenwidth()
                screen_height = root.winfo_screenheight()
                root.destroy()
                
                logger.info(f"âœ… Detected screen size: {screen_width}x{screen_height}")
                return {
                    'success': True,
                    'width': screen_width,
                    'height': screen_height
                }
            except Exception as tk_error:
                logger.warning(f"âš ï¸ Tkinter detection failed: {tk_error}")
                
                logger.info("Using fallback screen size: 1920x1080")
                return {
                    'success': True,
                    'width': 1920,
                    'height': 1080
                }
        except Exception as e:
            logger.error(f"âŒ Error getting screen size: {e}")
            return self._handle_error('get_screen_size', e)
    
    # ========== PROFILE METHODS ==========
    
    def get_profiles(self):
        """Get all profile names."""
        try:
            profiles = self.profile_service.get_all_profile_names()
            logger.info(f"Retrieved {len(profiles)} profiles")
            return profiles
        except Exception as e:
            logger.error(f"Error getting profiles: {e}")
            return []
    
    def get_profile(self, name):
        """Get specific profile."""
        try:
            profile = self.profile_service.get_profile(name)
            return profile
        except Exception as e:
            logger.error(f"Error getting profile {name}: {e}")
            return None
    
    def create_profile(self, name, data=None):
        """Create new profile."""
        try:
            if data is None:
                data = {}
            success, error = self.profile_service.create_profile(name, data)
            return {
                'success': success,
                'error': error,
                'message': f'Profile {name} created' if success else error
            }
        except Exception as e:
            return self._handle_error('create_profile', e)
    
    def update_profile(self, name, data):
        """Update existing profile."""
        try:
            logger.info(f"API: update_profile called for '{name}'")
            success = self.profile_service.update_profile(name, data)
            result = {
                'success': success,
                'error': '' if success else 'Failed to update profile'
            }
            logger.info(f"API: update_profile result: {result}")
            return result
        except Exception as e:
            return self._handle_error('update_profile', e)
    
    def delete_profile(self, name):
        """Delete profile."""
        try:
            success, error = self.profile_service.delete_profile(name)
            return {
                'success': success,
                'error': error,
                'message': 'Profile deleted' if success else error
            }
        except Exception as e:
            return self._handle_error('delete_profile', e)
    
    # ========== CALCULATOR METHODS ==========
    
    def calculate_tdee(self, params):
        """Calculate TDEE, BMR, BMI, and WHtR with ethnicity adjustment."""
        try:
            ethnicity = params.get('ethnicity', 'prefer_not_to_say')
            logger.info(f"ðŸ§¬ Received ethnicity parameter: '{ethnicity}'")
            
            weight_kg, height_cm = convert_to_metric(
                float(params['weight']),
                float(params['height']),
                params.get('unit_system', 'metric')
            )
            
            age = int(params['age'])
            activity = float(params['activity'])
            gender = params.get('gender', 'male')
            user_type = params.get('user_type', 'general')
            
            logger.info(f"Calculating TDEE: age={age}, gender={gender}, ethnicity={ethnicity}")
            
            bmr = self.tdee_service.calculate_bmr(
                weight_kg, height_cm, age, gender, ethnicity
            )
            tdee = self.tdee_service.calculate_tdee(bmr, activity)
            
            logger.info(f"âœ… BMR calculated: {bmr:.2f} (with ethnicity: {ethnicity})")
            
            ethnicity_info = self.tdee_service.get_ethnicity_info(ethnicity)
            logger.info(f"Ethnicity adjustment: {ethnicity_info}")
            
            bmi = self.tdee_service.calculate_bmi(weight_kg, height_cm)
            bmi_category = self.tdee_service.get_bmi_category(bmi, ethnicity)
            logger.info(
                f"ðŸ“Š BMI: {bmi:.1f}, Category: {bmi_category['category']} "
                f"(ethnicity: {ethnicity})"
            )
            
            result = {
                'bmr': round(bmr, 2),
                'tdee': round(tdee, 2),
                'bmi': round(bmi, 1),
                'bmi_category': bmi_category,
                'ethnicity_adjustment': ethnicity_info
            }
            
            if user_type in ['athlete', 'bodybuilder'] and params.get('waist'):
                waist_cm = float(params['waist'])
                if params.get('unit_system') == 'imperial':
                    waist_cm = waist_cm * 2.54
                
                whtr = self.tdee_service.calculate_whtr(waist_cm, height_cm)
                whtr_category = self.tdee_service.get_whtr_category(whtr)
                
                result['whtr'] = round(whtr, 3)
                result['whtr_category'] = whtr_category
            
            logger.info(
                f"âœ… TDEE calculation complete. BMR: {result['bmr']}, "
                f"TDEE: {result['tdee']}"
            )
            return {'success': True, 'data': result}
        
        except Exception as e:
            return self._handle_error('calculate_tdee', e)
    
    # ========== WEIGHT TRACKER METHODS ==========
    
    def get_weight_log(self, profile_name):
        """Get weight log for profile."""
        try:
            log = self.profile_service.get_weight_log(profile_name)
            logger.info(
                f"API: get_weight_log for '{profile_name}': {len(log)} entries"
            )
            return log
        except Exception as e:
            logger.error(f"Error getting weight log: {e}")
            return []
    
    def add_weight_entry(self, profile_name, weight, unit='metric'):
        """Add weight entry."""
        try:
            logger.info(
                f"API: add_weight_entry called - Profile: '{profile_name}', "
                f"Weight: {weight}, Unit: {unit}"
            )
            success, error = self.profile_service.add_weight_entry(
                profile_name, weight, unit=unit
            )
            result = {
                'success': success,
                'error': error,
                'message': 'Weight entry added' if success else error
            }
            logger.info(f"API: add_weight_entry result: {result}")
            return result
        except Exception as e:
            return self._handle_error('add_weight_entry', e)
    
    def delete_weight_entry(self, profile_name, index):
        """Delete weight entry."""
        try:
            success = self.profile_service.delete_weight_entry(profile_name, index)
            return {
                'success': success,
                'message': 'Entry deleted' if success else 'Failed to delete'
            }
        except Exception as e:
            return self._handle_error('delete_weight_entry', e)
    
    def get_weight_stats(self, profile_name):
        """Get weight statistics."""
        try:
            log = self.profile_service.get_weight_log(profile_name)
            stats = self.profile_service.calculate_statistics(log)
            return stats
        except Exception as e:
            logger.error(f"Error getting weight stats: {e}")
            return None
    
    # ========== WAIST TRACKER METHODS ==========
    
    def get_waist_log(self, profile_name):
        """Get waist log for profile."""
        try:
            log = self.profile_service.get_waist_log(profile_name)
            logger.info(
                f"API: get_waist_log for '{profile_name}': {len(log)} entries"
            )
            return log
        except Exception as e:
            logger.error(f"Error getting waist log: {e}")
            return []
    
    def add_waist_entry(self, profile_name, waist, unit='metric'):
        """Add waist entry."""
        try:
            logger.info(
                f"API: add_waist_entry called - Profile: '{profile_name}', "
                f"Waist: {waist}, Unit: {unit}"
            )
            success, error = self.profile_service.add_waist_entry(
                profile_name, waist, unit=unit
            )
            result = {
                'success': success,
                'error': error,
                'message': 'Waist entry added' if success else error
            }
            logger.info(f"API: add_waist_entry result: {result}")
            return result
        except Exception as e:
            return self._handle_error('add_waist_entry', e)
    
    def delete_waist_entry(self, profile_name, index):
        """Delete waist entry."""
        try:
            success = self.profile_service.delete_waist_entry(profile_name, index)
            return {
                'success': success,
                'message': 'Entry deleted' if success else 'Failed to delete'
            }
        except Exception as e:
            return self._handle_error('delete_waist_entry', e)
    
    def get_waist_stats(self, profile_name):
        """Get waist statistics."""
        try:
            log = self.profile_service.get_waist_log(profile_name)
            stats = self.profile_service.calculate_waist_statistics(log)
            return stats
        except Exception as e:
            logger.error(f"Error getting waist stats: {e}")
            return None
    
    # ========== BODYBUILDING METHODS ==========
    
    def get_muscle_groups(self):
        """Get available muscle groups."""
        try:
            return self.bb_service.get_muscle_groups()
        except Exception as e:
            logger.error(f"Error getting muscle groups: {e}")
            return []
    
    def get_exercises(self, muscle_group, profile_name=None):
        """Get exercises for muscle group (includes custom exercises if profile provided)."""
        try:
            custom_exercises_dict = {}
            if profile_name:
                profile = self.profile_service.get_profile(profile_name)
                if profile:
                    custom_exercises_dict = profile.get('custom_exercises', {})
            
            from exercise_database import get_exercises_for_muscle_group
            return get_exercises_for_muscle_group(muscle_group, custom_exercises_dict)
        except Exception as e:
            logger.error(f"Error getting exercises: {e}")
            return []
    
    def get_routines(self, profile_name):
        """Get all routines for profile."""
        try:
            return self.bb_service.get_routines(self.profile_service, profile_name)
        except Exception as e:
            logger.error(f"Error getting routines: {e}")
            return {}
    
    def save_routine(self, profile_name, routine_name, exercises):
        """Save new routine."""
        try:
            success = self.bb_service.save_routine(
                self.profile_service, profile_name, routine_name, exercises
            )
            return {
                'success': success,
                'message': 'Routine saved' if success else 'Failed to save'
            }
        except Exception as e:
            return self._handle_error('save_routine', e)
    
    def delete_routine(self, profile_name, routine_name):
        """Delete routine."""
        try:
            success = self.bb_service.delete_routine(
                self.profile_service, profile_name, routine_name
            )
            return {
                'success': success,
                'message': 'Routine deleted' if success else 'Failed to delete'
            }
        except Exception as e:
            return self._handle_error('delete_routine', e)
    
    def log_workout(self, profile_name, routine_name, workout_data, duration_seconds=None):
        """Log completed workout with duration."""
        try:
            logger.info(f"â±ï¸ Logging workout: '{routine_name}' for profile '{profile_name}'")
            if duration_seconds is not None:
                logger.info(f"   Duration: {duration_seconds} seconds")
            
            success, error = self.bb_service.log_workout(
                self.profile_service, profile_name, routine_name, workout_data, duration_seconds
            )
            
            result = {
                'success': success,
                'error': error,
                'message': 'Workout logged' if success else error
            }
            
            if success:
                logger.info(f"âœ… Workout logged successfully")
            else:
                logger.error(f"âŒ Workout logging failed: {error}")
            
            return result
        except Exception as e:
            return self._handle_error('log_workout', e)
    
    def get_workout_history(self, profile_name):
        """Get workout history."""
        try:
            history = self.bb_service.get_workout_history(
                self.profile_service, profile_name
            )
            logger.info(f"Retrieved {len(history)} workout entries for '{profile_name}'")
            return history
        except Exception as e:
            logger.error(f"Error getting workout history: {e}")
            return []
    
    def delete_workout(self, profile_name, workout_index):
        """
        Delete a workout from history.
        
        Args:
            profile_name: Name of profile
            workout_index: Index of workout to delete
        
        Returns:
            dict: Result with success status and message
        """
        try:
            logger.info(f"🗑️ Deleting workout at index {workout_index} for profile '{profile_name}'")
            
            success, error = self.bb_service.delete_workout(
                self.profile_service, profile_name, workout_index
            )
            
            result = {
                'success': success,
                'error': error,
                'message': 'Workout deleted' if success else error
            }
            
            if success:
                logger.info(f"✅ Workout deleted successfully")
            else:
                logger.error(f"❌ Workout deletion failed: {error}")
            
            return result
        except Exception as e:
            return self._handle_error('delete_workout', e)
    
    # ========== CUSTOM EXERCISE METHODS ==========
    
    def add_custom_exercise(self, profile_name, muscle_group, exercise_name):
        """Add a custom exercise to profile."""
        try:
            logger.info("=" * 60)
            logger.info("ADD CUSTOM EXERCISE")
            logger.info(f"Profile: {profile_name}")
            logger.info(f"Muscle Group: {muscle_group}")
            logger.info(f"Exercise Name: {exercise_name}")
            logger.info("=" * 60)
            
            from exercise_database import add_custom_exercise
            
            profile = self.profile_service.get_profile(profile_name)
            if not profile:
                logger.error(f"âŒ Profile not found: {profile_name}")
                return {'success': False, 'error': 'Profile not found'}
            
            if 'custom_exercises' not in profile:
                profile['custom_exercises'] = {}
                logger.info("âœ… Initialized custom_exercises dict")
            
            logger.info(f"Current custom exercises: {profile['custom_exercises']}")
            
            success, error = add_custom_exercise(
                muscle_group, 
                exercise_name, 
                profile['custom_exercises']
            )
            
            logger.info(f"add_custom_exercise returned: success={success}, error={error}")
            
            if success:
                logger.info(f"Updating profile with new custom exercises: {profile['custom_exercises']}")
                update_success = self.profile_service.update_profile(profile_name, profile)
                logger.info(f"Profile update result: {update_success}")
                
                if update_success:
                    logger.info(f"âœ… Added custom exercise '{exercise_name}' to {muscle_group} for profile '{profile_name}'")
                    return {'success': True}
                else:
                    logger.error("âŒ Failed to save profile")
                    return {'success': False, 'error': 'Failed to save profile'}
            else:
                logger.error(f"âŒ add_custom_exercise failed: {error}")
                return {'success': False, 'error': error}
                
        except Exception as e:
            logger.error(f"âŒ Exception in add_custom_exercise: {e}")
            logger.error(traceback.format_exc())
            return self._handle_error('add_custom_exercise', e)
    
    def get_custom_exercises(self, profile_name, muscle_group):
        """Get custom exercises for a muscle group."""
        try:
            logger.info(f"ðŸ“‹ GET CUSTOM EXERCISES - Profile: {profile_name}, Group: {muscle_group}")
            
            profile = self.profile_service.get_profile(profile_name)
            if not profile:
                logger.warning(f"âš ï¸ Profile not found: {profile_name}")
                return []
            
            custom_exercises = profile.get('custom_exercises', {})
            result = custom_exercises.get(muscle_group, [])
            
            logger.info(f"âœ… Returning {len(result)} custom exercises for {muscle_group}")
            logger.info(f"   Exercises: {result}")
            
            return result
            
        except Exception as e:
            logger.error(f"âŒ Error getting custom exercises: {e}")
            return []
    
    def delete_custom_exercise(self, profile_name, muscle_group, exercise_name):
        """Delete a custom exercise."""
        try:
            logger.info("=" * 60)
            logger.info("DELETE CUSTOM EXERCISE")
            logger.info(f"Profile: '{profile_name}'")
            logger.info(f"Muscle Group: '{muscle_group}'")
            logger.info(f"Exercise Name: '{exercise_name}'")
            logger.info("=" * 60)
            
            from exercise_database import delete_custom_exercise
            
            profile = self.profile_service.get_profile(profile_name)
            if not profile:
                logger.error(f"âŒ Profile not found: {profile_name}")
                return {'success': False, 'error': 'Profile not found'}
            
            custom_exercises = profile.get('custom_exercises', {})
            
            success, error = delete_custom_exercise(
                muscle_group, 
                exercise_name, 
                custom_exercises
            )
            
            if success:
                profile['custom_exercises'] = custom_exercises
                update_success = self.profile_service.update_profile(profile_name, profile)
                
                if update_success:
                    logger.info(f"âœ… Deleted custom exercise '{exercise_name}' from {muscle_group}")
                    return {'success': True}
                else:
                    return {'success': False, 'error': 'Failed to save profile'}
            else:
                return {'success': False, 'error': error}
                
        except Exception as e:
            logger.error(f"âŒ Exception in delete_custom_exercise: {e}")
            return self._handle_error('delete_custom_exercise', e)


def main():
    """Launch the native desktop application."""
    print("=" * 60)
    print("Starting Bodybuilding & TDEE Tracker")
    print("=" * 60)
    print("Native Desktop Application")
    print("No server required - runs completely locally")
    print("=" * 60)
    print("\nðŸŽ¯ Features:")
    print("  â€¢ TDEE Calculator with Ethnicity Adjustments")
    print("  â€¢ Weight & Waist Trackers with Charts")
    print("  â€¢ Workout Routines & Custom Exercises")
    print("  â€¢ Workout Timer & History")
    print("=" * 60)
    print("\nLogs will appear below:")
    print("=" * 60)
    
    try:
        api = NativeAPI()
        
        try:
            import tkinter as tk
            root = tk.Tk()
            root.withdraw()
            screen_height = root.winfo_screenheight()
            root.destroy()
        except:
            screen_height = 1080
        
        window = webview.create_window(
            title='ðŸ’ª Bodybuilding & TDEE Tracker',
            url='index.html',
            js_api=api,
            width=1400,
            height=screen_height - 40,
            resizable=False,
            min_size=(800, 600),
            fullscreen=False,
            maximized=False
        )
        
        webview.start(gui='edgehtml', debug=False)
    
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        logger.error(traceback.format_exc())
        print("\n" + "=" * 60)
        print("ERROR: Application failed to start")
        print("=" * 60)
        print(f"\nError details: {str(e)}")
        print("\nPlease check:")
        print("1. Python is installed correctly")
        print("2. pywebview is installed: pip install pywebview")
        print("3. All required files are present")
        print("4. Check the logs above for more details")
        input("\nPress Enter to exit...")
        sys.exit(1)


if __name__ == '__main__':
    main()
# profile_service.py - COMPLETE WITH WAIST TRACKING AND STATISTICS
"""
Profile management service including CRUD operations, weight log, and waist log handling.
NOW WITH LINEAR REGRESSION for accurate average weekly change calculation.
🔥 FIXED: Added calculate_waist_statistics method
"""

from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ProfileService:
    """Service for managing user profiles, weight logs, and waist logs."""
    
    def __init__(self, storage_service):
        self.storage = storage_service
        self.profiles, self.last_profile = self.storage.load_profiles()
        logger.info(f"ProfileService initialized with {len(self.profiles)} profiles")
    
    def get_all_profile_names(self):
        """Get list of all profile names."""
        return list(self.profiles.keys())
    
    def get_profile(self, name):
        """
        Get a profile by name.
        
        Args:
            name: Profile name
        
        Returns:
            dict: Profile data or None
        """
        profile = self.profiles.get(name)
        if profile:
            logger.info(f"Retrieved profile '{name}' with {len(profile.get('weight_log', []))} weight entries and {len(profile.get('waist_log', []))} waist entries")
        return profile
    
    def _validate_profile_name(self, name):
        """
        Validate profile name.
        
        Args:
            name: Profile name to validate
        
        Returns: 
            tuple: (is_valid, error_message)
        """
        name = str(name).strip()
        
        if not name or len(name) < 1:
            return False, "Profile name cannot be empty"
        
        if len(name) > 100:
            return False, "Profile name must be 100 characters or less"
        
        invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in invalid_chars:
            if char in name:
                return False, f"Profile name cannot contain '{char}'"
        
        return True, ""
    
    def create_profile(self, name, data):
        """
        Create a new profile.
        
        Args:
            name: Profile name
            data: Profile data dictionary
        
        Returns:
            tuple: (success, error_message)
        """
        name = str(name).strip()
        
        is_valid, error_msg = self._validate_profile_name(name)
        if not is_valid:
            return False, error_msg
        
        if name in self.profiles:
            return False, f"Profile '{name}' already exists"
        
        if 'weight_log' not in data:
            data['weight_log'] = []
        if 'waist_log' not in data:
            data['waist_log'] = []
        
        self.profiles[name] = data
        success = self._save()
        
        if success: 
            logger.info(f"Created profile: {name}")
            return True, ""
        else: 
            return False, "Failed to save profile"
    
    def update_profile(self, name, data):
        """
        Update an existing profile.
        
        Args:
            name: Profile name
            data: Updated profile data
        
        Returns:
            bool: Success status
        """
        if name not in self.profiles:
            logger.warning(f"Attempted to update non-existent profile: {name}")
            return False
        
        logger.info(f"Updating profile '{name}'")
        logger.info(f"Old weight_log count: {len(self.profiles[name].get('weight_log', []))}")
        logger.info(f"New weight_log count: {len(data.get('weight_log', []))}")
        logger.info(f"Old waist_log count: {len(self.profiles[name].get('waist_log', []))}")
        logger.info(f"New waist_log count: {len(data.get('waist_log', []))}")
        
        if 'weight_log' not in data and 'weight_log' in self.profiles[name]:
            data['weight_log'] = self.profiles[name]['weight_log']
            logger.info("Preserved existing weight_log")
        
        if 'waist_log' not in data and 'waist_log' in self.profiles[name]:
            data['waist_log'] = self.profiles[name]['waist_log']
            logger.info("Preserved existing waist_log")
        
        self.profiles[name] = data
        success = self._save()
        
        if success:
            logger.info(f"✅ Profile '{name}' updated successfully")
        else:
            logger.error(f"❌ Failed to save profile '{name}'")
        
        return success
    
    def delete_profile(self, name):
        """
        Delete a profile.
        
        Args:
            name: Profile name
        
        Returns:
            tuple: (success, error_message)
        """
        if name not in self.profiles:
            return False, "Profile not found"
        
        if name in self.profiles:
            del self.profiles[name]
            if self.last_profile == name:
                self.last_profile = None
            
            success = self._save()
            if success:
                logger.info(f"Deleted profile: {name}")
                return True, ""
            else:
                return False, "Failed to delete profile"
        
        return False, "Unknown error"
    
    def set_last_profile(self, name):
        """Set the last used profile."""
        self.last_profile = name
        return self._save()
    
    # ========== WEIGHT LOG METHODS ==========
    
    def add_weight_entry(self, profile_name, weight, timestamp=None, unit='metric'):
        """
        Add a weight log entry to a profile.
        
        Args:
            profile_name: Name of profile
            weight: Weight value
            timestamp: Timestamp string (generates current if None)
            unit: Unit system ('metric' or 'imperial')
        
        Returns:
            tuple: (success, error_message)
        """
        if profile_name not in self.profiles:
            return False, "Profile not found"
        
        try:
            weight = float(weight)
            if weight <= 0:
                return False, "Weight must be greater than 0"
            if weight > 500:
                return False, "Weight seems too high (>500)"
        except (ValueError, TypeError):
            return False, "Invalid weight value"
        
        if timestamp is None:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        if 'weight_log' not in self.profiles[profile_name]: 
            self.profiles[profile_name]['weight_log'] = []
        
        entry = {
            'weight': weight,
            'timestamp': timestamp,
            'unit': unit
        }
        
        logger.info(f"Adding weight entry to '{profile_name}': {weight} {unit}")
        logger.info(f"Current weight_log length: {len(self.profiles[profile_name]['weight_log'])}")
        
        self.profiles[profile_name]['weight_log'].append(entry)
        
        logger.info(f"New weight_log length: {len(self.profiles[profile_name]['weight_log'])}")
        
        success = self._save()
        
        if success:
            logger.info(f"✅ Weight entry saved for {profile_name}: {weight} {unit}")
            
            reloaded_profiles, _ = self.storage.load_profiles()
            reloaded_log = reloaded_profiles.get(profile_name, {}).get('weight_log', [])
            logger.info(f"✅ Verification: {len(reloaded_log)} entries in file after save")
            
            return True, ""
        else:
            logger.error(f"❌ Failed to save weight entry")
            return False, "Failed to save weight entry"
    
    def delete_weight_entry(self, profile_name, index):
        """
        Delete a weight log entry. 
        
        Args:
            profile_name: Name of profile
            index: Index of entry to delete
        
        Returns:
            bool: Success status
        """
        if profile_name not in self.profiles:
            return False
        
        weight_log = self.profiles[profile_name].get('weight_log', [])
        
        if 0 <= index < len(weight_log):
            del weight_log[index]
            return self._save()
        
        return False
    
    def get_weight_log(self, profile_name):
        """
        Get weight log for a profile.
        
        Args:
            profile_name: Name of profile
        
        Returns: 
            list: Weight log entries
        """
        if profile_name not in self.profiles:
            return []
        
        return self.profiles[profile_name].get('weight_log', [])
    
    # ========== WAIST LOG METHODS ==========
    
    def add_waist_entry(self, profile_name, waist, timestamp=None, unit='metric'):
        """
        Add a waist log entry to a profile.
        
        Args:
            profile_name: Name of profile
            waist: Waist value
            timestamp: Timestamp string (generates current if None)
            unit: Unit system ('metric' or 'imperial')
        
        Returns:
            tuple: (success, error_message)
        """
        if profile_name not in self.profiles:
            return False, "Profile not found"
        
        try:
            waist = float(waist)
            if waist <= 0:
                return False, "Waist must be greater than 0"
            if waist > 300:
                return False, "Waist seems too high (>300)"
        except (ValueError, TypeError):
            return False, "Invalid waist value"
        
        if timestamp is None:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        if 'waist_log' not in self.profiles[profile_name]: 
            self.profiles[profile_name]['waist_log'] = []
        
        entry = {
            'waist': waist,
            'timestamp': timestamp,
            'unit': unit
        }
        
        logger.info(f"Adding waist entry to '{profile_name}': {waist} {unit}")
        logger.info(f"Current waist_log length: {len(self.profiles[profile_name]['waist_log'])}")
        
        self.profiles[profile_name]['waist_log'].append(entry)
        
        logger.info(f"New waist_log length: {len(self.profiles[profile_name]['waist_log'])}")
        
        success = self._save()
        
        if success:
            logger.info(f"✅ Waist entry saved for {profile_name}: {waist} {unit}")
            
            reloaded_profiles, _ = self.storage.load_profiles()
            reloaded_log = reloaded_profiles.get(profile_name, {}).get('waist_log', [])
            logger.info(f"✅ Verification: {len(reloaded_log)} entries in file after save")
            
            return True, ""
        else:
            logger.error(f"❌ Failed to save waist entry")
            return False, "Failed to save waist entry"
    
    def delete_waist_entry(self, profile_name, index):
        """
        Delete a waist log entry. 
        
        Args:
            profile_name: Name of profile
            index: Index of entry to delete
        
        Returns:
            bool: Success status
        """
        if profile_name not in self.profiles:
            return False
        
        waist_log = self.profiles[profile_name].get('waist_log', [])
        
        if 0 <= index < len(waist_log):
            del waist_log[index]
            return self._save()
        
        return False
    
    def get_waist_log(self, profile_name):
        """
        Get waist log for a profile.
        
        Args:
            profile_name: Name of profile
        
        Returns: 
            list: Waist log entries
        """
        if profile_name not in self.profiles:
            return []
        
        return self.profiles[profile_name].get('waist_log', [])
    
    # ========== STATISTICS METHODS ==========
    
    def calculate_statistics(self, log, measurement_type='weight'):
        """
        Calculate statistics from measurement log (weight or waist) with linear regression.
        
        Args:
            log: List of measurement entries
            measurement_type: 'weight' or 'waist'
        
        Returns:
            dict: Statistics including start_value, current_value,
                  total_change, avg_weekly_change
        """
        if not log:
            return {
                'start_value': None,
                'current_value': None,
                'total_change': None,
                'avg_weekly_change': None
            }
        
        key = 'weight' if measurement_type == 'weight' else 'waist'
        
        start_value = log[0][key]
        current_value = log[-1][key]
        total_change = current_value - start_value
        
        logger.info("=" * 60)
        logger.info(f"CALCULATING {measurement_type.upper()} STATISTICS")
        logger.info(f"Start value: {start_value}")
        logger.info(f"Current value: {current_value}")
        logger.info(f"Total change: {total_change}")
        logger.info(f"Number of entries: {len(log)}")
        
        avg_weekly_change = None
        
        if len(log) > 1:
            try:
                first_date = datetime.strptime(log[0]['timestamp'], '%Y-%m-%d %H:%M:%S')
                last_date = datetime.strptime(log[-1]['timestamp'], '%Y-%m-%d %H:%M:%S')
                
                days_diff = (last_date - first_date).days
                
                unique_dates = set()
                for entry in log:
                    entry_date = datetime.strptime(entry['timestamp'], '%Y-%m-%d %H:%M:%S')
                    unique_dates.add(entry_date.date())
                
                calendar_days_tracked = len(unique_dates)
                
                logger.info(f"First date: {first_date}")
                logger.info(f"Last date: {last_date}")
                logger.info(f"Time span: {days_diff} day(s)")
                logger.info(f"Unique calendar days tracked: {calendar_days_tracked}")
                
                if calendar_days_tracked < 3:
                    logger.warning(f"⚠️ Tracked on {calendar_days_tracked} calendar day(s) - need at least 3")
                    logger.info("=" * 60)
                    return {
                        'start_value': start_value,
                        'current_value': current_value,
                        'total_change': total_change,
                        'avg_weekly_change': None
                    }
                
                if days_diff < 1:
                    logger.warning(f"⚠️ All entries within same 24-hour period")
                    logger.info("=" * 60)
                    return {
                        'start_value': start_value,
                        'current_value': current_value,
                        'total_change': total_change,
                        'avg_weekly_change': None
                    }
                
                days = []
                values = []
                
                for entry in log:
                    entry_date = datetime.strptime(entry['timestamp'], '%Y-%m-%d %H:%M:%S')
                    days_since_start = (entry_date - first_date).days
                    days.append(days_since_start)
                    values.append(entry[key])
                
                n = len(days)
                sum_x = sum(days)
                sum_y = sum(values)
                sum_xy = sum(x * y for x, y in zip(days, values))
                sum_x2 = sum(x * x for x in days)
                
                denominator = n * sum_x2 - sum_x * sum_x
                
                if abs(denominator) > 0.001:
                    slope = (n * sum_xy - sum_x * sum_y) / denominator
                    avg_weekly_change = slope * 7
                    logger.info(f"✅ Linear regression result: {avg_weekly_change:.3f}/week")
                else:
                    weeks = days_diff / 7.0
                    if weeks > 0:
                        avg_weekly_change = total_change / weeks
                        logger.info(f"✅ Simple calculation: {avg_weekly_change:.3f}/week")
                    
            except Exception as e:
                logger.error(f"❌ Error calculating average weekly change: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
        
        logger.info(f"FINAL avg_weekly_change: {avg_weekly_change}")
        logger.info("=" * 60)
        
        return {
            'start_value': start_value,
            'current_value': current_value,
            'total_change': total_change,
            'avg_weekly_change': avg_weekly_change
        }
    
    def calculate_waist_statistics(self, log):
        """
        🔥 NEW METHOD: Calculate waist statistics (uses the same logic as weight)
        
        Args:
            log: List of waist entries
        
        Returns:
            dict: Statistics with start_waist, current_waist, total_change, avg_weekly_change
        """
        stats = self.calculate_statistics(log, measurement_type='waist')
        
        # Rename keys to be waist-specific
        return {
            'start_waist': stats['start_value'],
            'current_waist': stats['current_value'],
            'total_change': stats['total_change'],
            'avg_weekly_change': stats['avg_weekly_change']
        }
    
    def _save(self):
        """Save profiles to storage."""
        logger.info(f"Calling storage.save_profiles with {len(self.profiles)} profiles")
        success = self.storage.save_profiles(self.profiles, self.last_profile)
        if success:
            logger.info("✅ Storage save successful")
        else:
            logger.error("❌ Storage save failed")
        return success
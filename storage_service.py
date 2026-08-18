# storage_service.py - COMPLETE FIXED VERSION with Stale Lock Detection
"""
Handles all JSON file operations for profiles data with improved file locking.
Automatically detects and removes stale locks to prevent save failures.
"""

import json
import os
import logging
import tempfile
import shutil
import time
from pathlib import Path
from contextlib import contextmanager

# Import from constants.py
from constants import PROFILES_FILE

logger = logging.getLogger(__name__)


class StorageService:
    """Service for loading and saving profile data to JSON with improved file locking."""
    
    def __init__(self, filepath=None):
        if filepath is None:
            self.filepath = PROFILES_FILE
        else:
            self.filepath = filepath
        
        self.lock_file = self.filepath + '.lock'
        self._ensure_data_directory()
        
        # Clean up any stale lock files on initialization
        self._cleanup_stale_lock()
        
        logger.info(f"StorageService initialized with filepath: {self.filepath}")
    
    def _ensure_data_directory(self):
        """Create data directory if it doesn't exist."""
        directory = os.path.dirname(self.filepath)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
            logger.info(f"Created data directory: {directory}")
    
    def _cleanup_stale_lock(self):
        """Remove stale lock files that are older than 30 seconds."""
        try:
            if os.path.exists(self.lock_file):
                # Check age of lock file
                lock_age = time.time() - os.path.getmtime(self.lock_file)
                
                if lock_age > 30:  # Lock older than 30 seconds is considered stale
                    logger.warning(f"⚠️ Found stale lock file (age: {lock_age:.1f}s), removing...")
                    os.remove(self.lock_file)
                    logger.info("✅ Stale lock file removed")
                else:
                    logger.debug(f"Lock file exists but is fresh (age: {lock_age:.1f}s)")
        except Exception as e:
            logger.warning(f"Could not cleanup stale lock: {e}")
    
    @contextmanager
    def _file_lock(self, timeout=10):
        """
        Context manager for file locking with stale lock detection.
        Increased timeout to 10 seconds and auto-removes stale locks.
        """
        start_time = time.time()
        lock_acquired = False
        
        try:
            # Try to acquire lock
            while time.time() - start_time < timeout:
                try:
                    # Check for stale lock before each attempt
                    if os.path.exists(self.lock_file):
                        lock_age = time.time() - os.path.getmtime(self.lock_file)
                        if lock_age > 5:  # During acquisition, 5 seconds is stale
                            logger.warning(f"⚠️ Removing stale lock (age: {lock_age:.1f}s)")
                            try:
                                os.remove(self.lock_file)
                            except:
                                pass
                    
                    # Try to create lock file exclusively
                    fd = os.open(self.lock_file, os.O_CREAT | os.O_EXCL | os.O_RDWR)
                    os.close(fd)
                    lock_acquired = True
                    logger.debug("🔒 File lock acquired")
                    break
                except FileExistsError:
                    # Lock file exists, wait a bit
                    time.sleep(0.1)
            
            if not lock_acquired:
                # Last resort: force remove the lock and try one more time
                logger.error(f"❌ Could not acquire lock after {timeout}s, forcing removal...")
                try:
                    if os.path.exists(self.lock_file):
                        os.remove(self.lock_file)
                        logger.info("🔓 Forced lock removal")
                        
                        # One final attempt
                        fd = os.open(self.lock_file, os.O_CREAT | os.O_EXCL | os.O_RDWR)
                        os.close(fd)
                        lock_acquired = True
                        logger.info("✅ Lock acquired after forced removal")
                except Exception as e:
                    logger.error(f"Failed to force acquire lock: {e}")
            
            if not lock_acquired:
                raise TimeoutError(f"Could not acquire file lock after {timeout} seconds")
            
            yield
            
        finally:
            # Release lock
            if lock_acquired and os.path.exists(self.lock_file):
                try:
                    os.remove(self.lock_file)
                    logger.debug("🔓 File lock released")
                except OSError as e:
                    logger.warning(f"Could not remove lock file: {e}")
    
    def load_profiles(self):
        """
        Load profiles from JSON file with retry logic.
        
        Returns:
            tuple: (profiles_dict, last_profile_name)
        """
        if not os.path.exists(self.filepath):
            logger.info("No profiles file found, returning empty")
            return {}, None
        
        max_retries = 3
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                with open(self.filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Handle both old format (just profiles) and new format (with metadata)
                if isinstance(data, dict) and '_last_profile' in data:
                    profiles = {k: v for k, v in data.items() if k != '_last_profile'}
                    last_profile = data.get('_last_profile')
                else:
                    profiles = data
                    last_profile = None
                
                # Initialize weight_log and waist_log if not present in any profile
                for profile in profiles.values():
                    if 'weight_log' not in profile:
                        profile['weight_log'] = []
                    if 'waist_log' not in profile:
                        profile['waist_log'] = []
                
                logger.info(f"✅ Loaded {len(profiles)} profiles from {self.filepath}")
                return profiles, last_profile
            
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    # Try to recover from backup
                    return self._try_load_backup()
            
            except Exception as e:
                logger.error(f"Error loading profiles (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    return {}, None
        
        return {}, None
    
    def _try_load_backup(self):
        """Try to load from backup file if main file is corrupted."""
        backup_path = self.filepath + '.backup'
        
        if os.path.exists(backup_path):
            logger.warning("⚠️ Main file corrupted, attempting to load from backup")
            try:
                with open(backup_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if isinstance(data, dict) and '_last_profile' in data:
                    profiles = {k: v for k, v in data.items() if k != '_last_profile'}
                    last_profile = data.get('_last_profile')
                else:
                    profiles = data
                    last_profile = None
                
                logger.info(f"✅ Recovered {len(profiles)} profiles from backup")
                
                # Restore from backup
                shutil.copy2(backup_path, self.filepath)
                logger.info("✅ Main file restored from backup")
                
                return profiles, last_profile
            
            except Exception as e:
                logger.error(f"Failed to load backup: {e}")
        
        return {}, None
    
    def save_profiles(self, profiles, last_profile=None):
        """
        Save profiles to JSON file with atomic write and improved locking.
        
        Args:
            profiles: Dictionary of profile data
            last_profile: Name of last used profile (optional)
        
        Returns:
            bool: Success status
        """
        try:
            logger.info(f"=== SAVING PROFILES TO FILE ===")
            logger.info(f"File path: {self.filepath}")
            logger.info(f"Number of profiles: {len(profiles)}")
            logger.info(f"Last profile: {last_profile}")
            
            # Log profile details
            for name, profile in profiles.items():
                weight_count = len(profile.get('weight_log', []))
                waist_count = len(profile.get('waist_log', []))
                logger.info(f"Profile '{name}': {weight_count} weight entries, {waist_count} waist entries")
            
            # Prepare data
            data = dict(profiles)
            if last_profile:
                data['_last_profile'] = last_profile
            
            # Acquire file lock with improved timeout and stale detection
            with self._file_lock(timeout=10):
                # Create backup before modifying
                if os.path.exists(self.filepath):
                    backup_path = self.filepath + '.backup'
                    try:
                        shutil.copy2(self.filepath, backup_path)
                        logger.debug("📦 Backup created")
                    except Exception as e:
                        logger.warning(f"Could not create backup: {e}")
                
                # Write to temporary file first (atomic write)
                temp_dir = os.path.dirname(self.filepath)
                with tempfile.NamedTemporaryFile(
                    mode='w',
                    encoding='utf-8',
                    dir=temp_dir,
                    delete=False,
                    suffix='.tmp'
                ) as temp_file:
                    temp_path = temp_file.name
                    json.dump(data, temp_file, indent=2, ensure_ascii=False)
                    temp_file.flush()
                    os.fsync(temp_file.fileno())
                
                # Atomic rename
                if os.name == 'nt':  # Windows
                    # Windows doesn't support atomic replace, need to remove first
                    if os.path.exists(self.filepath):
                        os.remove(self.filepath)
                    os.rename(temp_path, self.filepath)
                else:  # Unix/Linux/Mac
                    os.replace(temp_path, self.filepath)
                
                logger.debug("💾 Temporary file moved to final location")
            
            # Verify the file was written correctly
            if not os.path.exists(self.filepath):
                logger.error("❌ File does not exist after save attempt")
                return False
            
            file_size = os.path.getsize(self.filepath)
            logger.info(f"✅ File saved successfully: {file_size} bytes")
            
            # Verify we can read it back
            try:
                with open(self.filepath, 'r', encoding='utf-8') as f:
                    verify_data = json.load(f)
                    verify_profiles = {
                        k: v for k, v in verify_data.items() 
                        if k != '_last_profile'
                    }
                    logger.info(
                        f"✅ Verification: {len(verify_profiles)} profiles "
                        f"readable from file"
                    )
            except Exception as e:
                logger.error(f"❌ Verification failed: {e}")
                return False
            
            # Rotate old backups (keep only last 5)
            self._rotate_backups(keep=5)
            
            return True
        
        except TimeoutError as e:
            logger.error(f"❌ Could not acquire file lock: {e}")
            logger.error("   💡 TIP: Close the application completely and restart")
            logger.error("   💡 Or manually delete: data/tdee_profiles.json.lock")
            return False
        
        except Exception as e:
            logger.error(f"❌ Error saving profiles: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Clean up temp file if it exists
            try:
                if 'temp_path' in locals() and os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass
            
            return False
    
    def _rotate_backups(self, keep=5):
        """
        Rotate backup files, keeping only the most recent ones.
        
        Args:
            keep: Number of backups to keep
        """
        try:
            backup_dir = os.path.dirname(self.filepath)
            backup_prefix = os.path.basename(self.filepath) + '.backup'
            
            # Find all backup files
            backup_files = []
            for filename in os.listdir(backup_dir):
                if filename.startswith(backup_prefix):
                    filepath = os.path.join(backup_dir, filename)
                    mtime = os.path.getmtime(filepath)
                    backup_files.append((mtime, filepath))
            
            # Sort by modification time (newest first)
            backup_files.sort(reverse=True)
            
            # Remove old backups
            for _, filepath in backup_files[keep:]:
                try:
                    os.remove(filepath)
                    logger.debug(f"🗑️ Removed old backup: {filepath}")
                except Exception as e:
                    logger.warning(f"Could not remove old backup {filepath}: {e}")
        
        except Exception as e:
            logger.warning(f"Error rotating backups: {e}")
    
    def get_backup_list(self):
        """
        Get list of available backup files.
        
        Returns:
            list: List of (timestamp, filepath) tuples
        """
        try:
            backup_dir = os.path.dirname(self.filepath)
            backup_prefix = os.path.basename(self.filepath) + '.backup'
            
            backups = []
            for filename in os.listdir(backup_dir):
                if filename.startswith(backup_prefix):
                    filepath = os.path.join(backup_dir, filename)
                    mtime = os.path.getmtime(filepath)
                    backups.append((mtime, filepath))
            
            # Sort by modification time (newest first)
            backups.sort(reverse=True)
            
            return backups
        
        except Exception as e:
            logger.error(f"Error getting backup list: {e}")
            return []
    
    def restore_from_backup(self, backup_path):
        """
        Restore data from a specific backup file.
        
        Args:
            backup_path: Path to backup file
        
        Returns:
            bool: Success status
        """
        try:
            if not os.path.exists(backup_path):
                logger.error(f"Backup file not found: {backup_path}")
                return False
            
            # Verify backup file is valid JSON
            with open(backup_path, 'r', encoding='utf-8') as f:
                json.load(f)
            
            # Create backup of current file
            if os.path.exists(self.filepath):
                temp_backup = self.filepath + '.before_restore'
                shutil.copy2(self.filepath, temp_backup)
                logger.info(f"Created safety backup: {temp_backup}")
            
            # Restore from backup
            shutil.copy2(backup_path, self.filepath)
            logger.info(f"✅ Restored from backup: {backup_path}")
            
            return True
        
        except Exception as e:
            logger.error(f"❌ Failed to restore from backup: {e}")
            return False
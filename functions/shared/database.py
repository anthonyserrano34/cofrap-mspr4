"""
Database utilities for COFRAP Authentication System
Handles PostgreSQL connections and common database operations for OpenFaaS functions.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages PostgreSQL database connections and operations."""
    
    def __init__(self):
        """Initialize database connection parameters from environment variables."""
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = os.getenv('DB_PORT', '5432')
        self.database = os.getenv('DB_NAME', 'cofrap_auth')
        self.username = os.getenv('DB_USER', 'postgres')
        self.password = os.getenv('DB_PASSWORD', 'postgres')
        
    def get_connection(self):
        """
        Get a database connection.
        
        Returns:
            psycopg2.connection: Database connection object
            
        Raises:
            psycopg2.Error: If connection fails
        """
        try:
            connection = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password,
                cursor_factory=RealDictCursor
            )
            logger.info("Database connection established successfully")
            return connection
        except psycopg2.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def create_user_table(self):
        """
        Create the users table if it doesn't exist.
        
        Table structure:
        - id: Serial primary key
        - username: Unique username
        - password_hash: Encrypted password hash
        - mfa_secret: Encrypted TOTP secret
        - gendate: Unix timestamp of creation
        - expired: Boolean flag for expiration status
        """
        query = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            mfa_secret TEXT NOT NULL,
            gendate BIGINT NOT NULL,
            expired BOOLEAN DEFAULT FALSE
        );
        """
        
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query)
                    conn.commit()
                    logger.info("Users table created/verified successfully")
        except psycopg2.Error as e:
            logger.error(f"Failed to create users table: {e}")
            raise
    
    def insert_user(self, username, password_hash, mfa_secret, gendate):
        """
        Insert a new user or update existing user's credentials.
        
        Args:
            username (str): Username
            password_hash (str): Encrypted password hash
            mfa_secret (str): Encrypted TOTP secret
            gendate (int): Unix timestamp
            
        Returns:
            bool: True if successful, False otherwise
        """
        query = """
        INSERT INTO users (username, password_hash, mfa_secret, gendate, expired)
        VALUES (%s, %s, %s, %s, FALSE)
        ON CONFLICT (username) 
        DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            mfa_secret = EXCLUDED.mfa_secret,
            gendate = EXCLUDED.gendate,
            expired = FALSE;
        """
        
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (username, password_hash, mfa_secret, gendate))
                    conn.commit()
                    logger.info(f"User {username} inserted/updated successfully")
                    return True
        except psycopg2.Error as e:
            logger.error(f"Failed to insert/update user {username}: {e}")
            return False
    
    def get_user(self, username):
        """
        Retrieve user information by username.
        
        Args:
            username (str): Username to search for
            
        Returns:
            dict: User data if found, None otherwise
        """
        query = "SELECT * FROM users WHERE username = %s;"
        
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (username,))
                    user = cursor.fetchone()
                    if user:
                        logger.info(f"User {username} retrieved successfully")
                        return dict(user)
                    else:
                        logger.info(f"User {username} not found")
                        return None
        except psycopg2.Error as e:
            logger.error(f"Failed to retrieve user {username}: {e}")
            return None
    
    def update_user_password(self, username, password_hash, gendate):
        """
        Update user's password hash and generation date.
        
        Args:
            username (str): Username
            password_hash (str): New encrypted password hash
            gendate (int): New Unix timestamp
            
        Returns:
            bool: True if successful, False otherwise
        """
        query = """
        UPDATE users 
        SET password_hash = %s, gendate = %s, expired = FALSE
        WHERE username = %s;
        """
        
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (password_hash, gendate, username))
                    conn.commit()
                    rows_affected = cursor.rowcount
                    if rows_affected > 0:
                        logger.info(f"Password updated for user {username}")
                        return True
                    else:
                        logger.warning(f"No user found with username {username}")
                        return False
        except psycopg2.Error as e:
            logger.error(f"Failed to update password for user {username}: {e}")
            return False
    
    def update_user_mfa(self, username, mfa_secret, gendate):
        """
        Update user's MFA secret and generation date.
        
        Args:
            username (str): Username
            mfa_secret (str): New encrypted TOTP secret
            gendate (int): New Unix timestamp
            
        Returns:
            bool: True if successful, False otherwise
        """
        query = """
        UPDATE users 
        SET mfa_secret = %s, gendate = %s, expired = FALSE
        WHERE username = %s;
        """
        
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (mfa_secret, gendate, username))
                    conn.commit()
                    rows_affected = cursor.rowcount
                    if rows_affected > 0:
                        logger.info(f"MFA secret updated for user {username}")
                        return True
                    else:
                        logger.warning(f"No user found with username {username}")
                        return False
        except psycopg2.Error as e:
            logger.error(f"Failed to update MFA secret for user {username}: {e}")
            return False
    
    def mark_user_expired(self, username):
        """
        Mark a user as expired.
        
        Args:
            username (str): Username to mark as expired
            
        Returns:
            bool: True if successful, False otherwise
        """
        query = "UPDATE users SET expired = TRUE WHERE username = %s;"
        
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (username,))
                    conn.commit()
                    rows_affected = cursor.rowcount
                    if rows_affected > 0:
                        logger.info(f"User {username} marked as expired")
                        return True
                    else:
                        logger.warning(f"No user found with username {username}")
                        return False
        except psycopg2.Error as e:
            logger.error(f"Failed to mark user {username} as expired: {e}")
            return False 
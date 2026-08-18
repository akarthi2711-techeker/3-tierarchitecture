"""
Event Portal – db.py
Database connection helper using mysql-connector-python.
All queries use parameterized statements to prevent SQL injection.
"""

import mysql.connector
from mysql.connector import Error
from config import Config


def get_connection():
    """Return a new MySQL connection using config values."""
    try:
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci",
            autocommit=False,
        )
        return conn
    except Error as e:
        raise RuntimeError(f"Database connection failed: {e}") from e


def execute_query(query: str, params: tuple = (), fetch: bool = False):
    """
    Execute a parameterized query.

    Args:
        query:  SQL string with %s placeholders.
        params: Tuple of values to bind.
        fetch:  If True, return all rows. Otherwise return lastrowid.

    Returns:
        list[dict] when fetch=True, else int (lastrowid).
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)

        if fetch:
            result = cursor.fetchall()
            return result
        else:
            conn.commit()
            return cursor.lastrowid

    except Error as e:
        if conn:
            conn.rollback()
        raise RuntimeError(f"Query execution failed: {e}") from e
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

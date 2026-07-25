import json
import boto3
import pymysql
import time
from datetime import datetime

class InfrastructureManager:
    def __init__(self, instance_id, db_config):
        self.instance_id = instance_id
        self.db_config = db_config
        self.ec2 = boto3.client('ec2')

    def log(self, message):
        """Log with timestamp prefix"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"{timestamp} : {message}")

    def get_instance_status(self):
        """Get current EC2 instance status"""
        response = self.ec2.describe_instances(InstanceIds=[self.instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        return instance['State']['Name'], instance.get('PublicIpAddress')

    def wait_for_stop(self):
        """Wait until the instance is in 'stopped' state (if currently 'stopping' or 'running')."""
        self.log("Waiting for instance to reach 'stopped' state...")
        max_wait_time = 300  # 5 minutes max
        wait_time = 0
        while wait_time < max_wait_time:
            state, _ = self.get_instance_status()
            if state == 'terminated':
                self.log("ERROR: Instance terminated unexpectedly.")
                return False
            if state == 'stopped':
                self.log("Instance is now stopped.")
                return True
            time.sleep(10)
            wait_time += 10
            self.log(f"Waiting for stop... Current state: {state} (waited {wait_time}s)")
        self.log(f"Instance did not stop within {max_wait_time} seconds.")
        return False

    def start_instance(self):
        """Start EC2 instance and wait for running state.
           If instance is 'stopping', wait until stopped before starting."""
        current_state, _ = self.get_instance_status()
        if current_state == 'stopping':
            self.log("Instance is currently stopping. Waiting for it to stop before starting...")
            if not self.wait_for_stop():
                return False
        elif current_state == 'running':
            self.log("Instance is already running.")
            return True

        self.log("Starting EC2 instance...")
        self.ec2.start_instances(InstanceIds=[self.instance_id])

        max_wait_time = 300  # 5 minutes max wait
        wait_time = 0

        while wait_time < max_wait_time:
            time.sleep(10)
            wait_time += 10

            state, _ = self.get_instance_status()
            self.log(f"Waiting for instance... Current state: {state} (waited {wait_time}s)")

            if state == 'running':
                self.log("Instance is now running!")
                return True

        self.log(f"Instance failed to start within {max_wait_time} seconds")
        return False

    def wait_for_database_smart(self, public_ip):
        """Wait for MySQL database - only log if actually waiting"""
        # First try - silent check
        try:
            connection = pymysql.connect(
                host=public_ip,
                connect_timeout=5,
                **self.db_config
            )
            connection.close()
            return True  # Database ready immediately - no logging
        except:
            pass  # Database not ready, start logging wait process

        # Database not ready - now start logging
        self.log("Database not ready, waiting for connection...")

        max_db_wait = 120
        db_wait_time = 5  # Already waited 5 seconds above

        while db_wait_time < max_db_wait:
            time.sleep(5)
            db_wait_time += 5

            try:
                self.log(f"Testing database connection... (waited {db_wait_time}s)")
                connection = pymysql.connect(
                    host=public_ip,
                    connect_timeout=5,
                    **self.db_config
                )
                connection.close()
                self.log("Database is ready!")
                return True
            except Exception as e:
                continue  # Keep waiting

        self.log(f"Database failed to become ready within {max_db_wait} seconds")
        return False

    def cold_start_infrastructure(self):
        """
        Complete cold-start process for infrastructure
        Returns: (success, public_ip, was_auto_started)
        """
        # Step 1: Check current status (no logging - just check)
        current_state, public_ip = self.get_instance_status()
        was_auto_started = False

        # Step 2: Start if needed (ONLY log if starting)
        if current_state != 'running':
            self.log("Instance not running, initiating cold start...")
            was_auto_started = True

            if not self.start_instance():
                return False, None, was_auto_started

            # Get updated IP after start
            _, public_ip = self.get_instance_status()

        # Step 3: Validate public IP (no logging - just validate)
        if not public_ip:
            self.log("ERROR: Instance has no public IP")
            return False, None, was_auto_started

        # Step 4: Wait for database (ONLY log if waiting)
        if not self.wait_for_database_smart(public_ip):
            return False, public_ip, was_auto_started

        # ONLY log if we actually did a cold-start
        if was_auto_started:
            self.log("Infrastructure cold-start completed successfully!")

        return True, public_ip, was_auto_started

def lambda_handler(event, context):
    # Configuration
    INSTANCE_ID = 'i-04922d403f1790008'
    DB_CONFIG = {
        'user': 'budget_user',
        'password': 'BudgetPassword123',
        'database': 'budget',
        'port': 3306
    }

    # CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token',
        'Access-Control-Max-Age': '86400'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'message': 'CORS preflight successful'})
        }

    # Initialize infrastructure manager
    infra = InfrastructureManager(INSTANCE_ID, DB_CONFIG)
    ec2 = boto3.client('ec2')

    # Get action and data from event
    if 'body' in event:
        body = json.loads(event['body'])
        action = body.get('action', '').lower()
        data = body  # Full body contains all parameters
    else:
        action = event.get('action', '').lower()
        data = event

    try:
        # Infrastructure management actions
        if action == 'start':
            # For direct start action, we should also handle stopping state
            state, _ = infra.get_instance_status()
            if state == 'stopping':
                # Wait for stop then start
                infra.log("Instance is stopping. Waiting for stop before starting (via start action)...")
                if not infra.wait_for_stop():
                    return {
                        'statusCode': 500,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'Failed to wait for instance to stop.'})
                    }
            response = ec2.start_instances(InstanceIds=[INSTANCE_ID])
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'message': f"Starting instance {INSTANCE_ID}",
                    'instanceId': INSTANCE_ID,
                    'action': action
                })
            }

        elif action == 'stop':
            response = ec2.stop_instances(InstanceIds=[INSTANCE_ID])
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'message': f"Stopping instance {INSTANCE_ID}",
                    'instanceId': INSTANCE_ID,
                    'action': action
                })
            }

        elif action == 'status':
            state, public_ip = infra.get_instance_status()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'message': f"Instance {INSTANCE_ID} is {state}",
                    'instanceId': INSTANCE_ID,
                    'action': action,
                    'state': state,
                    'ip': public_ip
                })
            }

        # Database actions - need infrastructure
        else:
            infra.log(f"=== {action.upper()} ACTION INITIATED ===")

            # Cold-start infrastructure
            success, public_ip, was_auto_started = infra.cold_start_infrastructure()

            if not success:
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'error': 'Failed to start infrastructure',
                        'ip': public_ip
                    })
                }

            # Connect to database
            connection = pymysql.connect(host=public_ip, **DB_CONFIG)

            try:
                with connection.cursor(pymysql.cursors.DictCursor) as cursor:

                    # EXPENSE ACTIONS
                    if action == 'get_expenses' or action == 'query':
                        cursor.execute("SELECT * FROM Expenses ORDER BY Timestamp DESC")
                        expenses = cursor.fetchall()
                        infra.log(f"Retrieved {len(expenses)} expenses")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expenses retrieved successfully',
                                'expenses': expenses,
                                'total_expenses': len(expenses),
                                'auto_started': was_auto_started
                            }, default=str)
                        }

                    elif action == 'get_expenses_by_date_range':
                        start_date = data.get('startDate')
                        end_date = data.get('endDate')
                        cursor.execute(
                            "SELECT * FROM Expenses WHERE DATE(Timestamp) BETWEEN %s AND %s ORDER BY Timestamp DESC",
                            (start_date, end_date)
                        )
                        expenses = cursor.fetchall()
                        infra.log(f"Retrieved {len(expenses)} expenses for date range {start_date} to {end_date}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expenses retrieved successfully',
                                'expenses': expenses,
                                'total_expenses': len(expenses),
                                'startDate': start_date,
                                'endDate': end_date
                            }, default=str)
                        }

                    elif action == 'get_expenses_by_month':
                        year = data.get('year')
                        month = data.get('month')
                        cursor.execute(
                            "SELECT * FROM Expenses WHERE YEAR(Timestamp) = %s AND MONTH(Timestamp) = %s ORDER BY Timestamp DESC",
                            (year, month)
                        )
                        expenses = cursor.fetchall()
                        infra.log(f"Retrieved {len(expenses)} expenses for {year}-{month}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expenses retrieved successfully',
                                'expenses': expenses,
                                'total_expenses': len(expenses),
                                'year': year,
                                'month': month
                            }, default=str)
                        }

                    elif action == 'add_expense':
                        cursor.execute(
                            "INSERT INTO Expenses (UserId, CategoryId, Amount, Description) VALUES (%s, %s, %s, %s)",
                            (data.get('UserId'), data.get('CategoryId'), data.get('Amount'), data.get('Description'))
                        )
                        connection.commit()
                        expense_id = cursor.lastrowid
                        infra.log(f"Added expense with ID {expense_id}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expense added successfully',
                                'ExpenseId': expense_id
                            })
                        }

                    elif action == 'update_expense':
                        cursor.execute(
                            "UPDATE Expenses SET UserId = %s, CategoryId = %s, Amount = %s, Description = %s WHERE ExpenseId = %s",
                            (data.get('UserId'), data.get('CategoryId'), data.get('Amount'), data.get('Description'), data.get('ExpenseId'))
                        )
                        connection.commit()
                        infra.log(f"Updated expense ID {data.get('ExpenseId')}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expense updated successfully',
                                'ExpenseId': data.get('ExpenseId')
                            })
                        }

                    elif action == 'delete_expense':
                        cursor.execute("DELETE FROM Expenses WHERE ExpenseId = %s", (data.get('ExpenseId'),))
                        connection.commit()
                        infra.log(f"Deleted expense ID {data.get('ExpenseId')}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expense deleted successfully',
                                'ExpenseId': data.get('ExpenseId')
                            })
                        }

                    elif action == 'get_expenses_by_category':
                        start_date = data.get('startDate')
                        end_date = data.get('endDate')
                        cursor.execute("""
                            SELECT c.CategoryName, c.CategoryId, SUM(e.Amount) as TotalAmount, COUNT(e.ExpenseId) as ExpenseCount
                            FROM Expenses e
                            JOIN Categories c ON e.CategoryId = c.CategoryId
                            WHERE DATE(e.Timestamp) BETWEEN %s AND %s
                            GROUP BY c.CategoryId, c.CategoryName
                            ORDER BY TotalAmount DESC
                        """, (start_date, end_date))
                        breakdown = cursor.fetchall()
                        infra.log(f"Retrieved expense breakdown by category for {start_date} to {end_date}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expense breakdown by category retrieved successfully',
                                'breakdown': breakdown,
                                'startDate': start_date,
                                'endDate': end_date
                            }, default=str)
                        }

                    elif action == 'get_expenses_by_user':
                        start_date = data.get('startDate')
                        end_date = data.get('endDate')
                        cursor.execute("""
                            SELECT u.Name, u.UserId, SUM(e.Amount) as TotalAmount, COUNT(e.ExpenseId) as ExpenseCount
                            FROM Expenses e
                            JOIN Users u ON e.UserId = u.UserId
                            WHERE DATE(e.Timestamp) BETWEEN %s AND %s
                            GROUP BY u.UserId, u.Name
                            ORDER BY TotalAmount DESC
                        """, (start_date, end_date))
                        breakdown = cursor.fetchall()
                        infra.log(f"Retrieved expense breakdown by user for {start_date} to {end_date}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Expense breakdown by user retrieved successfully',
                                'breakdown': breakdown,
                                'startDate': start_date,
                                'endDate': end_date
                            }, default=str)
                        }

                    # USER ACTIONS
                    elif action == 'get_users':
                        cursor.execute("SELECT * FROM Users ORDER BY Name")
                        users = cursor.fetchall()
                        infra.log(f"Retrieved {len(users)} users")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Users retrieved successfully',
                                'users': users,
                                'total_users': len(users)
                            })
                        }

                    elif action == 'add_user':
                        cursor.execute(
                            "INSERT INTO Users (Name, Description) VALUES (%s, %s)",
                            (data.get('Name'), data.get('Description'))
                        )
                        connection.commit()
                        user_id = cursor.lastrowid
                        infra.log(f"Added user with ID {user_id}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'User added successfully',
                                'UserId': user_id
                            })
                        }

                    elif action == 'update_user':
                        cursor.execute(
                            "UPDATE Users SET Name = %s, Description = %s WHERE UserId = %s",
                            (data.get('Name'), data.get('Description'), data.get('UserId'))
                        )
                        connection.commit()
                        infra.log(f"Updated user ID {data.get('UserId')}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'User updated successfully',
                                'UserId': data.get('UserId')
                            })
                        }

                    elif action == 'delete_user':
                        user_id = data.get('UserId')
                        infra.log(f"Attempting to delete user ID {user_id}")

                        # Cascade delete all expenses belonging to this user
                        cursor.execute("SELECT COUNT(*) as cnt FROM Expenses WHERE UserId = %s", (user_id,))
                        count = cursor.fetchone()['cnt']
                        infra.log(f"Found {count} expenses associated with user ID {user_id}")
                        if count > 0:
                            cursor.execute("DELETE FROM Expenses WHERE UserId = %s", (user_id,))
                            infra.log(f"Deleted {count} expenses")
                        # Now delete the user
                        cursor.execute("DELETE FROM Users WHERE UserId = %s", (user_id,))
                        connection.commit()
                        infra.log(f"Deleted user ID {user_id}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'User and associated expenses deleted successfully',
                                'UserId': user_id,
                                'deleted_expenses': count
                            })
                        }

                    # CATEGORY ACTIONS
                    elif action == 'get_categories':
                        cursor.execute("SELECT * FROM Categories ORDER BY CategoryName")
                        categories = cursor.fetchall()
                        infra.log(f"Retrieved {len(categories)} categories")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Categories retrieved successfully',
                                'categories': categories,
                                'total_categories': len(categories)
                            })
                        }

                    elif action == 'add_category':
                        cursor.execute(
                            "INSERT INTO Categories (CategoryName, Description) VALUES (%s, %s)",
                            (data.get('CategoryName'), data.get('Description'))
                        )
                        connection.commit()
                        category_id = cursor.lastrowid
                        infra.log(f"Added category with ID {category_id}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Category added successfully',
                                'CategoryId': category_id
                            })
                        }

                    elif action == 'update_category':
                        cursor.execute(
                            "UPDATE Categories SET CategoryName = %s, Description = %s WHERE CategoryId = %s",
                            (data.get('CategoryName'), data.get('Description'), data.get('CategoryId'))
                        )
                        connection.commit()
                        infra.log(f"Updated category ID {data.get('CategoryId')}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Category updated successfully',
                                'CategoryId': data.get('CategoryId')
                            })
                        }

                    elif action == 'delete_category':
                        category_id = data.get('CategoryId')
                        infra.log(f"Attempting to delete category ID {category_id}")

                        # Cascade delete all expenses belonging to this category
                        cursor.execute("SELECT COUNT(*) as cnt FROM Expenses WHERE CategoryId = %s", (category_id,))
                        count = cursor.fetchone()['cnt']
                        infra.log(f"Found {count} expenses associated with category ID {category_id}")
                        if count > 0:
                            cursor.execute("DELETE FROM Expenses WHERE CategoryId = %s", (category_id,))
                            infra.log(f"Deleted {count} expenses")
                        # Now delete the category
                        cursor.execute("DELETE FROM Categories WHERE CategoryId = %s", (category_id,))
                        connection.commit()
                        infra.log(f"Deleted category ID {category_id}")

                        return {
                            'statusCode': 200,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'message': 'Category and associated expenses deleted successfully',
                                'CategoryId': category_id,
                                'deleted_expenses': count
                            })
                        }

                    else:
                        return {
                            'statusCode': 400,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'error': f'Invalid action: {action}',
                                'supported_actions': [
                                    'get_expenses', 'get_expenses_by_date_range', 'get_expenses_by_month',
                                    'add_expense', 'update_expense', 'delete_expense',
                                    'get_expenses_by_category', 'get_expenses_by_user',
                                    'get_users', 'add_user', 'update_user', 'delete_user',
                                    'get_categories', 'add_category', 'update_category', 'delete_category',
                                    'start', 'stop', 'status', 'query'
                                ]
                            })
                        }

            finally:
                connection.close()
                infra.log("Database connection closed")

    except Exception as e:
        infra.log(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}',
                'action': action
            })
        }

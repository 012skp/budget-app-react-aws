import json
import os
import pymysql


def lambda_handler(event, context):
    body = event.get('body', '{}')
    if isinstance(body, str):
        body = json.loads(body)
    data = body if isinstance(body, dict) else {}

    user_id = data.get('UserId')
    category_id = data.get('CategoryId')
    amount = data.get('Amount')
    description = data.get('Description', '')

    conn = pymysql.connect(
        host=os.environ['DB_HOST'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        db=os.environ['DB_NAME'],
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO Expenses (UserId, CategoryId, Amount, Description)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (user_id, category_id, amount, description))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Expense added successfully'
        })
    }

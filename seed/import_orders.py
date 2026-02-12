#!/usr/bin/env python3
"""
Seed script to import orders from CSV into Firestore emulator.

This script reads orders_export.csv and imports the data into the local
Firestore emulator for development purposes.
"""

import csv
import os
from datetime import datetime
from google.cloud import firestore


def import_orders():
    """Import orders from CSV into Firestore emulator."""
    # Initialize Firestore client - will auto-connect to emulator via FIRESTORE_EMULATOR_HOST
    db = firestore.Client(
        project=os.environ.get("GOOGLE_CLOUD_PROJECT", "kebab-local-dev")
    )
    orders_collection = db.collection("orders")

    csv_path = "/data/orders_export.csv"

    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    print(f"Importing orders from {csv_path}...")

    count = 0
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Parse the order data
            order_id = row["id"]
            order_data = {
                "id": order_id,
                "customerName": row["customerName"],
                "kebabType": row["kebabType"],
                "size": row["size"],
                "sauce": row["sauce"],
                "meatType": row["meatType"],
                "date": row["date"],
                "timestamp": datetime.now().isoformat(),  # Add current timestamp for SSE
            }

            # Insert into Firestore
            orders_collection.document(order_id).set(order_data)
            count += 1

            if count % 50 == 0:
                print(f"  Imported {count} orders...")

    print(f"✓ Successfully imported {count} orders into Firestore emulator")


if __name__ == "__main__":
    try:
        import_orders()
    except Exception as e:
        print(f"Error importing orders: {e}")
        raise

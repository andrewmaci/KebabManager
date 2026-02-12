#!/usr/bin/env python3
"""
Export Firestore orders collection to CSV from LevelDB dump files.
Reads Firestore export files directly without needing emulator.
"""

import csv
import os
import glob
from leveldb_export import parse_leveldb_documents

# Configuration
DUMP_DIR = "db_dump"
OUTPUT_FILE = "orders_export.csv"

# CSV column order
COLUMNS = ["date", "customerName", "kebabType", "size", "sauce", "meatType", "id"]


def export_orders_to_csv():
    """Export all orders from Firestore dump files to CSV."""

    # Get all documents from all output files
    print(f"Reading Firestore export files from {DUMP_DIR}/...")
    all_docs = []

    # Find all output files (excluding metadata)
    output_files = sorted(glob.glob(os.path.join(DUMP_DIR, "*output*")))
    print(f"Found {len(output_files)} output files")

    # Parse each LevelDB file
    for filepath in output_files:
        filename = os.path.basename(filepath)
        print(f"  Processing {filename}...")
        for doc in parse_leveldb_documents(filepath):
            all_docs.append(doc)

    print(f"Found {len(all_docs)} total documents")

    if not all_docs:
        print("No documents found!")
        return

    # Filter only orders collection documents and extract properties
    orders = []
    for doc in all_docs:
        # Check if this is an order document (has required fields)
        if all(field in doc for field in ["customerName", "kebabType"]):
            # Extract fields directly from document
            order = {
                "id": doc.get("id", ""),
                "date": doc.get("date", ""),
                "customerName": doc.get("customerName", ""),
                "kebabType": doc.get("kebabType", ""),
                "size": doc.get("size", ""),
                "sauce": doc.get("sauce", ""),
                "meatType": doc.get("meatType", ""),
            }
            orders.append(order)

    print(f"Extracted {len(orders)} orders")

    if not orders:
        print("No orders found in documents!")
        # Debug: print structure of first doc
        if all_docs:
            print("\nFirst document structure:")
            import json

            print(json.dumps(all_docs[0], indent=2)[:500])
        return

    # Write to CSV
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=COLUMNS)
        writer.writeheader()

        for order in orders:
            # Ensure all columns exist (use empty string if missing)
            row = {col: order.get(col, "") for col in COLUMNS}
            writer.writerow(row)

    print(f"✅ Successfully exported {len(orders)} orders to {OUTPUT_FILE}")


if __name__ == "__main__":
    export_orders_to_csv()

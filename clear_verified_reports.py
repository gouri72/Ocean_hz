
import sqlite3
import os

DB_PATH = 'backend/ocean_hazard.db'

if not os.path.exists(DB_PATH):
    print(f"Database not found at {DB_PATH}")
    exit(1)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("Scanning verified reports...")

# Select all verified reports
try:
    c.execute("SELECT id, description, location_name FROM hazard_posts WHERE verified = 1")
    rows = c.fetchall()

    to_delete = []
    kept_count = 0

    for row in rows:
        id, desc, loc = row
        desc = desc or ""
        loc = loc or ""
        text = (desc + " " + loc).lower()
        
        # Preservation Logic: Keep if related to Chennai Tsunami
        if "chennai" in text and "tsunami" in text:
            print(f"Keeping Report ID {id}: {loc} - {desc}")
            kept_count += 1
        else:
            to_delete.append(id)

    print(f"Total Verified Reports: {len(rows)}")
    print(f"Reports to Keep: {kept_count}")
    print(f"Reports to Delete: {len(to_delete)}")

    if to_delete:
        print("Deleting...")
        # Use executemany for safety
        c.executemany("DELETE FROM hazard_posts WHERE id = ?", [(id,) for id in to_delete])
        conn.commit()
        print(f"Successfully deleted {len(to_delete)} verified reports.")
    else:
        print("No reports met the criteria for deletion.")

except Exception as e:
    print(f"Error: {e}")

conn.close()

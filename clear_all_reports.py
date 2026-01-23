
import sqlite3
import os

DB_PATH = 'backend/ocean_hazard.db'

if not os.path.exists(DB_PATH):
    print(f"Database not found at {DB_PATH}")
    exit(1)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("Scanning ALL reports (Pending + Verified)...")

try:
    c.execute("SELECT id, description, location_name FROM hazard_posts")
    rows = c.fetchall()

    to_delete = []
    kept_count = 0

    for row in rows:
        id, desc, loc = row
        desc = desc or ""
        loc = loc or ""
        text = (desc + " " + loc).lower()
        
        # Preservation Logic
        if "chennai" in text and "tsunami" in text:
            print(f"Keeping Report ID {id}: {loc}")
            kept_count += 1
        else:
            to_delete.append(id)

    print(f"Total Reports: {len(rows)}")
    print(f"Reports to Keep: {kept_count}")
    print(f"Reports to Delete: {len(to_delete)}")

    if to_delete:
        c.executemany("DELETE FROM hazard_posts WHERE id = ?", [(id,) for id in to_delete])
        conn.commit()
        print(f"Successfully deleted {len(to_delete)} reports.")
    else:
        print("No reports to delete.")

except Exception as e:
    print(f"Error: {e}")

conn.close()

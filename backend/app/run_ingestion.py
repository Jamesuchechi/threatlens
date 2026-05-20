import asyncio
import logging
import sys
from pathlib import Path

# Add the parent directory to the path so python can find app module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.feed_ingestion import run_ingestion_job

# Set up logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

async def main():
    print("Manually triggering feed ingestion...")
    await run_ingestion_job()
    print("Ingestion trigger execution finished.")

if __name__ == "__main__":
    asyncio.run(main())

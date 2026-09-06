import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
parent_env = Path(__file__).resolve().parent.parent / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
elif parent_env.exists():
    load_dotenv(dotenv_path=parent_env)
else:
    load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_FALLBACK_API_KEY = os.getenv("GEMINI_FALLBACK_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

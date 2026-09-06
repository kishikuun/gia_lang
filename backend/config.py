import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_FALLBACK_API_KEY = os.getenv("GEMINI_FALLBACK_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

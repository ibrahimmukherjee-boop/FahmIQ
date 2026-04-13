from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import re
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from html.parser import HTMLParser

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class SearchQuery(BaseModel):
    query: str
    max_results: int = 5

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str

class FetchPageRequest(BaseModel):
    url: str

class FetchPageResponse(BaseModel):
    content: str
    url: str

# HTML text extractor
class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_tags = {'script', 'style', 'nav', 'footer', 'header'}
        self.current_skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.current_skip += 1

    def handle_endtag(self, tag):
        if tag in self.skip_tags and self.current_skip > 0:
            self.current_skip -= 1

    def handle_data(self, data):
        if self.current_skip == 0:
            text = data.strip()
            if text:
                self.text_parts.append(text)

    def get_text(self):
        return ' '.join(self.text_parts)

# DuckDuckGo HTML search (free, no API key needed)
async def search_duckduckgo(query: str, max_results: int = 5) -> List[SearchResult]:
    results = []
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client_http:
            headers = {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            }
            resp = await client_http.get(
                'https://html.duckduckgo.com/html/',
                params={'q': query},
                headers=headers,
            )
            if resp.status_code == 200:
                html = resp.text
                # Parse results from DuckDuckGo HTML
                result_blocks = re.findall(
                    r'<a rel="nofollow" class="result__a" href="([^"]*)"[^>]*>(.*?)</a>.*?<a class="result__snippet"[^>]*>(.*?)</a>',
                    html, re.DOTALL
                )
                for url, title, snippet in result_blocks[:max_results]:
                    clean_title = re.sub(r'<[^>]+>', '', title).strip()
                    clean_snippet = re.sub(r'<[^>]+>', '', snippet).strip()
                    if clean_title and url:
                        results.append(SearchResult(
                            title=clean_title,
                            url=url,
                            snippet=clean_snippet[:300],
                        ))
    except Exception as e:
        logging.error(f"Search error: {e}")
    return results

@api_router.get("/")
async def root():
    return {"message": "FahmIQ Backend API", "version": "1.0.1"}

@api_router.post("/search", response_model=SearchResponse)
async def web_search(query: SearchQuery):
    results = await search_duckduckgo(query.query, query.max_results)
    return SearchResponse(results=results, query=query.query)

@api_router.post("/fetch-page", response_model=FetchPageResponse)
async def fetch_page(request: FetchPageRequest):
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client_http:
            headers = {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            }
            resp = await client_http.get(request.url, headers=headers)
            if resp.status_code == 200:
                extractor = TextExtractor()
                extractor.feed(resp.text)
                content = extractor.get_text()[:5000]  # Limit content
                return FetchPageResponse(content=content, url=request.url)
            return FetchPageResponse(content=f"Error: HTTP {resp.status_code}", url=request.url)
    except Exception as e:
        return FetchPageResponse(content=f"Error: {str(e)}", url=request.url)

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

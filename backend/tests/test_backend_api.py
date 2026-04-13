"""
Backend API Tests for FahmIQ
Tests: Root endpoint, health check, web search functionality
"""
import pytest
import requests
import os

# Get backend URL from environment (use public URL for testing)
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or 'https://local-reasoning.preview.emergentagent.com'

class TestRootEndpoint:
    """Test root API endpoint"""
    
    def test_root_returns_200(self):
        """Root endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print(f"✅ Root endpoint returned 200")
    
    def test_root_returns_json(self):
        """Root endpoint should return JSON with message and version"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["message"] == "FahmIQ Backend API"
        assert data["version"] == "1.0.1"
        print(f"✅ Root endpoint returns correct JSON: {data}")


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_returns_200(self):
        """Health endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✅ Health endpoint returned 200")
    
    def test_health_returns_status(self):
        """Health endpoint should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert data["status"] == "healthy"
        print(f"✅ Health endpoint returns healthy status: {data}")


class TestSearchEndpoint:
    """Test web search endpoint"""
    
    def test_search_returns_200(self):
        """Search endpoint should return 200 OK"""
        response = requests.post(
            f"{BASE_URL}/api/search",
            json={"query": "Python programming", "max_results": 3}
        )
        assert response.status_code == 200
        print(f"✅ Search endpoint returned 200")
    
    def test_search_returns_results(self):
        """Search endpoint should return search results"""
        response = requests.post(
            f"{BASE_URL}/api/search",
            json={"query": "React Native", "max_results": 3}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        assert "query" in data
        assert data["query"] == "React Native"
        assert isinstance(data["results"], list)
        print(f"✅ Search returned {len(data['results'])} results for 'React Native'")
    
    def test_search_result_structure(self):
        """Search results should have correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/search",
            json={"query": "artificial intelligence", "max_results": 2}
        )
        assert response.status_code == 200
        
        data = response.json()
        results = data["results"]
        
        if len(results) > 0:
            result = results[0]
            assert "title" in result
            assert "url" in result
            assert "snippet" in result
            assert isinstance(result["title"], str)
            assert isinstance(result["url"], str)
            assert isinstance(result["snippet"], str)
            print(f"✅ Search result structure is correct: {result['title'][:50]}...")
        else:
            print("⚠️ No search results returned (DuckDuckGo may be rate limiting)")
    
    def test_search_with_empty_query(self):
        """Search with empty query should still return 200 (may return empty results)"""
        response = requests.post(
            f"{BASE_URL}/api/search",
            json={"query": "", "max_results": 3}
        )
        # Should return 200 even with empty query (backend handles gracefully)
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✅ Empty query handled gracefully")


class TestFetchPageEndpoint:
    """Test page fetching endpoint"""
    
    def test_fetch_page_returns_200(self):
        """Fetch page endpoint should return 200 OK"""
        response = requests.post(
            f"{BASE_URL}/api/fetch-page",
            json={"url": "https://example.com"}
        )
        assert response.status_code == 200
        print(f"✅ Fetch page endpoint returned 200")
    
    def test_fetch_page_returns_content(self):
        """Fetch page should return page content"""
        response = requests.post(
            f"{BASE_URL}/api/fetch-page",
            json={"url": "https://example.com"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "content" in data
        assert "url" in data
        assert data["url"] == "https://example.com"
        assert isinstance(data["content"], str)
        assert len(data["content"]) > 0
        print(f"✅ Fetch page returned content ({len(data['content'])} chars)")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

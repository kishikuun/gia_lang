import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add backend to path so we can import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
import config

client = TestClient(app)

@pytest.fixture(autouse=True)
def disable_gemini():
    """Tắt Gemini trong lúc test để ép ứng dụng dùng Ollama (Cục bộ)"""
    original_key = config.GEMINI_API_KEY
    config.GEMINI_API_KEY = None
    yield
    config.GEMINI_API_KEY = original_key

@patch('main.requests.post')
def test_ollama_strips_think_tags(mock_post):
    """
    RED: Viết test chứng minh nếu model 1.5B (như DeepSeek-R1) sinh ra <think> tag,
    thì hệ thống API phải loại bỏ hoàn toàn phần đó trước khi trả về.
    """
    # Arrange: Giả lập Ollama trả về kết quả có chứa <think>
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "message": {
            "content": "<think>\nKhách hỏi về văn hóa.\nCần trả lời mộc mạc.\n</think>\nChào cháu, đại ngàn hôm nay nhiều gió."
        }
    }
    mock_post.return_value = mock_response

    # Act: Gọi API
    response = client.post("/api/chat", json={
        "user_message": "Chào Già Làng",
        "chat_history": []
    })

    # Assert: Kết quả trả về phải mất hoàn toàn thẻ <think>
    assert response.status_code == 200
    data = response.json()
    assert "<think>" not in data["response"]
    assert data["response"] == "Chào cháu, đại ngàn hôm nay nhiều gió."

@patch('main.requests.post')
def test_ollama_forces_action_bun_tag_if_missing(mock_post):
    """
    RED: Viết test chứng minh nếu khách MUA BÚN, nhưng model nhỏ LỠ QUÊN sinh ra tag [ACTION...],
    thì backend phải tự động cứu hộ (chèn vào).
    """
    # Arrange: Giả lập Ollama trả về kết quả NHƯNG QUÊN tag Giỏ Hàng
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "message": {
            "content": "Bún này ngon lắm cháu ạ, già sẽ gói cho cháu ngay."
        }
    }
    mock_post.return_value = mock_response

    # Act: Gọi API với nội dung "Mua bún"
    response = client.post("/api/chat", json={
        "user_message": "Già ơi bán con 1 hộp mua bún nhé",
        "chat_history": []
    })

    # Assert: Kết quả phải tự động được backend đắp thêm [ACTION:ADD_CART_BUN]
    assert response.status_code == 200
    data = response.json()
    assert "[ACTION:ADD_CART_BUN]" in data["response"]
    assert data["response"] == "Bún này ngon lắm cháu ạ, già sẽ gói cho cháu ngay. [ACTION:ADD_CART_BUN]"

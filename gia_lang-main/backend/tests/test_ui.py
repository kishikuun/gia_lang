import re
import pytest
import sys
import os
from playwright.sync_api import Page, expect
import threading
import uvicorn
import time

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from main import app

# Khởi động server trong luồng chạy ngầm để test
@pytest.fixture(scope="session", autouse=True)
def start_server():
    def run_server():
        uvicorn.run(app, host="127.0.0.1", port=8001, log_level="critical")
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(2) # Đợi server khởi động
    yield

def test_manual_add_to_cart(page: Page):
    """
    Test tính năng: Người dùng bấm 'Thêm trực tiếp vào giỏ' ở Giao diện Nổi
    thì Giỏ hàng phải được cập nhật ngay lập tức mà không cần gọi AI.
    """
    page.goto("http://127.0.0.1:8001")
    
    # Kéo xuống một chút để kích hoạt giao diện
    page.evaluate("window.scrollBy(0, 500)")
    
    # Tìm nút "Hỏi Già Làng" (hoặc Xem chi tiết) của Bún Song Thằn
    ask_btn = page.locator(".ask-btn").first
    ask_btn.click()
    
    # Đợi Modal hiện ra
    modal = page.locator("#product-modal")
    expect(modal).not_to_have_class(re.compile(r"hidden"))
    
    # Bấm nút Thêm thủ công
    manual_btn = page.locator("#modal-buy-manual-btn")
    manual_btn.click()
    
    # Kiểm tra Modal đã đóng
    expect(modal).to_have_class(re.compile(r"hidden"))
    
    # Kiểm tra Giỏ hàng đã hiện và có 1 món "Bún Song Thằn"
    cart_container = page.locator("#cart-container")
    expect(cart_container).not_to_have_class(re.compile(r"hidden"))
    
    cart_items = page.locator("#cart-items li")
    expect(cart_items).to_have_count(1)
    expect(cart_items.first).to_contain_text("Bún")

def test_ai_add_to_cart_via_chat(page: Page):
    """
    Test tính năng: Người dùng nhờ Già Làng đặt mua qua Chat,
    AI phải bắt được lệnh và tự động chèn [ACTION:ADD_CART...] để UI xử lý.
    """
    page.goto("http://127.0.0.1:8001")
    page.evaluate("window.scrollBy(0, 1000)")
    
    # Mở Modal
    ask_btn = page.locator(".ask-btn").nth(1) # Rượu cần
    ask_btn.click()
    
    # Bấm nhờ Già Làng mua
    ai_btn = page.locator("#modal-buy-btn")
    ai_btn.click()
    
    # Khung chat phải hiện ra
    dialog = page.locator("#rpg-dialog-box")
    expect(dialog).not_to_have_class(re.compile(r"hidden"))
    
    # Đợi AI trả lời (chữ chạy xong) và Giỏ hàng có Rượu
    # Quá trình gõ phím và fetch AI có thể mất vài giây
    page.wait_for_selector("#cart-container:not(.hidden)", timeout=30000)
    
    cart_items = page.locator("#cart-items li")
    # Kiểm tra có rượu trong giỏ
    expect(cart_items.last).to_contain_text("Rượu")

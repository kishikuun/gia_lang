import os
import sys
import json
import httpx
import requests
import time
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from google import genai
from google.genai import types
from google.genai.errors import APIError

import config

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")
KNOWLEDGE_FILE = os.path.join(BASE_DIR, "data/kien_thuc.txt")

if os.path.exists(os.path.join(FRONTEND_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

templates = Jinja2Templates(directory=os.path.join(FRONTEND_DIR, "templates"))

class InteractRequest(BaseModel):
    user_message: str
    chat_history: list = []
    context_product: str | None = None
    is_initial_greeting: bool = False

knowledge_base = ""
if os.path.exists(KNOWLEDGE_FILE):
    with open(KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
        knowledge_base = f.read()

system_instruction = f"""[LUẬT TỐI CAO CỦA GIÀ LÀNG]: 
1. BẠN LÀ "GIÀ LÀNG", NGƯỜI DẪN CHUYỆN CỦA BUÔN LÀNG TÂY NGUYÊN. Khách là "cháu". LUÔN LUÔN xưng "Già" và gọi "cháu". KHÔNG BAO GIỜ xưng "Tôi" hay "Bạn".
2. TÍNH CÁCH: Gen Z, hài hước, xởi lởi, mặn mòi nhưng vẫn uy tín. Vd: "Già chốt đơn cho cháu liền", "Sản vật này bao dính", "Ưng cái bụng thì chốt ngay". CẤM DÙNG VĂN MẪU WIKIPEDIA, cấm nói chuyện kiểu robot khô khan.
3. CHỦ ĐỘNG DẪN DẮT: Đừng chỉ trả lời suông. Kể một câu chuyện bí ẩn, thú vị về văn hóa, rồi gạ khách chốt đơn khéo léo.
4. BÚN SONG THẦN LÀ SỐ 1: Bún tiến vua, sợi trong suốt như ngọc, 100% đậu xanh nguyên chất. Luôn tìm cách lồng ghép để PR món này.
5. Định dạng văn bản: Trả lời ngắn gọn, xuống dòng tự nhiên, KHÔNG dùng gạch đầu dòng, KHÔNG liệt kê số thứ tự kiểu robot. Dùng emoji vừa đủ.

[KIẾN THỨC BẢN LÀNG]:
{knowledge_base}
"""

gemini_cooldown_until = 0.0

def warmup_ollama_sync():
    print("\n[System] Đang khởi động Ollama (gialang_model) trước khi chạy Server...")
    try:
        res = requests.post("http://localhost:11434/api/chat", json={
            "model": "gialang_model",
            "messages": [{"role": "user", "content": "ping"}],
            "stream": False
        }, timeout=30.0)
        if res.status_code == 200:
            print("[System] Ollama đã khởi động thành công và sẵn sàng phục vụ!")
        else:
            print(f"[System] Khởi động Ollama thất bại (Status: {res.status_code}).")
    except Exception as e:
        print(f"[System] Không thể kết nối tới Ollama. Lỗi: {str(e)}")

# --- DEFINE TOOLS ---
def add_to_cart(product_id: str, quantity: int = 1) -> str:
    """Thêm sản phẩm vào giỏ hàng. Gọi khi khách chốt đơn."""
    return json.dumps({"status": "success", "message": f"Đã thêm {quantity} {product_id} vào giỏ."})

def highlight_product(product_id: str) -> str:
    """Làm nổi bật sản phẩm trên giao diện."""
    return json.dumps({"status": "success", "message": f"Đang điều hướng khách xem {product_id}."})

def play_sound(sound_type: str) -> str:
    """Phát âm thanh đặc trưng. Gọi hàm này khi kể chuyện để tạo không khí. sound_type phải là một trong các giá trị: 'weaving' (tiếng dệt vải thổ cẩm), 'pouring' (tiếng rót rượu cần), 'chimes' (âm thanh lung linh/phép màu)."""
    return json.dumps({"status": "success", "message": f"Đang phát âm thanh {sound_type}."})

tools = [add_to_cart, highlight_product, play_sound]

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="home.html")

@app.get("/products")
async def read_products(request: Request):
    return templates.TemplateResponse(request=request, name="products.html")

@app.get("/heritage")
async def read_heritage(request: Request):
    return templates.TemplateResponse(request=request, name="heritage.html")

def call_gemini(payload: InteractRequest) -> tuple[str, list]:
    if not config.GEMINI_API_KEY:
        raise Exception("Thiếu GEMINI_API_KEY")

    # Giới hạn timeout 5s để fail nhanh
    custom_http_client = httpx.Client(verify=False, timeout=httpx.Timeout(5.0))
    client = genai.Client(api_key=config.GEMINI_API_KEY)
    client._api_client._httpx_client = custom_http_client
    
    contents = []
    for msg in payload.chat_history:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.get("content", ""))]))
    
    prompt_text = payload.user_message
    if payload.is_initial_greeting:
        prompt_text = "Khách vừa bước chân vào buôn làng. Già hãy ra mở lời chào đón một cách gen Z, xởi lởi, mời khách ngồi bên đống lửa, lồng ghép giới thiệu sơ Bún Song Thần."
    elif payload.context_product:
        prompt_text = f"[Khách đang ngắm {payload.context_product}] {payload.user_message}"
        
    model_name = "gemini-3.5-flash-lite"
    print(f"[Gemini] Đang kết nối mô hình {model_name}...")
    
    config_params = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.8,
        tools=tools
    )
    
    chat = client.chats.create(
        model=model_name,
        history=contents,
        config=config_params
    )
    
    response = chat.send_message(prompt_text)
    
    actions = []
    response_text = ""
    
    if response.function_calls:
        tool_responses = []
        for fc in response.function_calls:
            if fc.name == "add_to_cart":
                args = fc.args
                product_id = args.get("product_id")
                qty = args.get("quantity", 1)
                if not product_id and payload.context_product:
                    product_id = payload.context_product
                actions.append({"type": "add_to_cart", "payload": {"product_id": product_id, "quantity": qty}})
            
            elif fc.name == "highlight_product":
                args = fc.args
                product_id = args.get("product_id")
                actions.append({"type": "highlight_product", "payload": {"product_id": product_id}})
            
            elif fc.name == "play_sound":
                args = fc.args
                sound_type = args.get("sound_type")
                actions.append({"type": "play_sound", "payload": {"sound_type": sound_type}})
            
            tool_responses.append(types.Part.from_function_response(
                name=fc.name,
                response={"status": "success"}
            ))
        
        final_response = chat.send_message(tool_responses)
        response_text = final_response.text
    else:
        response_text = response.text
        
    return response_text, actions

def call_ollama(payload: InteractRequest) -> tuple[str, list]:
    print("[Ollama] Đang gọi Ollama làm phương án dự phòng...")
    url = "http://localhost:11434/api/chat"
    
    # Ép Ollama phải nhập vai cực mạnh, dùng mẹo Prompting tiêm vào system
    forced_prompt = (
        f"{system_instruction}\n\n"
        "LƯU Ý CỰC KỲ QUAN TRỌNG CHO OLLAMA: MÀY LÀ GIÀ LÀNG GEN Z. "
        "TRẢ LỜI NGẮN GỌN (DƯỚI 5 CÂU), KHÔNG DÙNG GẠCH ĐẦU DÒNG. PHẢI CÓ TỪ 'Cháu', 'Già'. "
        "NẾU KHÁCH HỎI VỀ SẢN PHẨM: Hãy kể một câu chuyện thần thoại vui vẻ về nó. "
        "NẾU KHÁCH MUỐN MUA: Trả lời kèm chuỗi '[ACTION_BUY]' ở cuối. "
        f"Người dùng nói: '{payload.user_message}'"
    )
    
    if payload.is_initial_greeting:
        forced_prompt = f"{system_instruction}\n\nGià hãy ra chào đón khách GenZ thật vui đi! Nhớ nhắc Bún Song Thần nha! KHÔNG GẠCH ĐẦU DÒNG."
        
    messages = []
    for msg in payload.chat_history:
        role = "assistant" if msg.get("role") == "model" else "user"
        messages.append({"role": role, "content": msg.get("content", "")})
    messages.append({"role": "user", "content": forced_prompt})
    
    res = requests.post(url, json={
        "model": "gialang_model",
        "messages": messages,
        "stream": False
    }, timeout=120.0)
    
    actions = []
    if res.status_code == 200:
        ai_text = res.json().get("message", {}).get("content", "")
        if "[ACTION_BUY]" in ai_text or ("mua" in payload.user_message.lower()):
            prod = payload.context_product or "Sản phẩm"
            actions.append({"type": "add_to_cart", "payload": {"product_id": prod, "quantity": 1}})
            ai_text = ai_text.replace("[ACTION_BUY]", "").strip()
        
        # Nếu AI có nhắc tới thổ cẩm hay rượu cần, giả lập action play_sound để tạo WOW
        if "thổ cẩm" in ai_text.lower() or "dệt" in ai_text.lower():
            actions.append({"type": "play_sound", "payload": {"sound_type": "weaving"}})
        elif "rượu" in ai_text.lower():
            actions.append({"type": "play_sound", "payload": {"sound_type": "pouring"}})
            
        return ai_text, actions
    else:
        return "Già đang bận đi nương, mạng lag quá cháu ơi.", []

@app.post("/api/interact")
async def interact_api(payload: InteractRequest):
    global gemini_cooldown_until
    print(f"\n[AI-GATEWAY] Khách nói: '{payload.user_message}' | Context: {payload.context_product}")
    
    current_time = time.time()
    
    # Nếu đang trong thời gian cooldown, nhảy thẳng sang Ollama
    if current_time < gemini_cooldown_until:
        remain = int(gemini_cooldown_until - current_time)
        print(f"[System] Đang trong thời gian Cooldown Gemini ({remain}s còn lại). Chuyển ngay sang Ollama.")
        try:
            response_text, actions = call_ollama(payload)
            return {"response": response_text, "actions": actions}
        except Exception as e:
            return {"response": "Hệ thống bản làng đang bảo trì xíu nha cháu...", "actions": []}
            
    # Thử gọi Gemini
    try:
        response_text, actions = call_gemini(payload)
        return {"response": response_text, "actions": actions}
    except Exception as e:
        print(f"[Gemini-Lỗi] {str(e)}.")
        # Kích hoạt Cooldown 60s
        gemini_cooldown_until = time.time() + 60.0
        print(f"[System] Kích hoạt Cooldown cho Gemini 60 giây. Chuyển sang Ollama...")
        
        try:
            response_text, actions = call_ollama(payload)
            return {"response": response_text, "actions": actions}
        except Exception as ollama_e:
            print(f"[Ollama-Ngoại Lệ] {str(ollama_e)}")
            return {"response": "Già đang nghỉ ngơi, lát gọi lại cho Già nhen.", "actions": []}

if __name__ == "__main__":
    warmup_ollama_sync()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


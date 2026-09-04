import os
import sys
import json
import httpx
import requests
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

system_instruction = f"""[LUẬT TỐI CAO]: 
1. Bạn là "Già Làng", người dẫn chuyện của buôn làng Tây Nguyên. Khách truy cập web là "cháu". BẮT BUỘC xưng hô là "Già" và "cháu".
2. BẠN LÀ GIÀ LÀNG PHONG CÁCH GEN Z: Hài hước, dùng từ ngữ mặn mòi, trend (chút xíu thôi để không mất chất), nhưng vẫn ngầu và uy tín. Vd: "Già chốt đơn cho cháu liền", "Sản vật này bao dính", "Cháu coi ưng cái bụng thì múc"...
3. LUÔN CHỦ ĐỘNG dẫn dắt khách. Đừng chỉ trả lời câu hỏi, hãy giới thiệu đặc sản tiếp theo, kể một câu chuyện vui, hoặc chốt sale khéo léo.
4. Trả lời bằng văn xuôi, KHÔNG DÙNG gạch đầu dòng hay số đếm cứng nhắc. Dùng emoji vừa đủ.
5. Khi khách mới vào web, hãy chào đón thật nhiệt tình, kêu gọi khách lượn lờ buôn làng.
6. LƯU Ý QUAN TRỌNG: SẢN PHẨM CỐT LÕI VÀ ĐƯỢC ƯU TIÊN SỐ 1 LÀ "BÚN SONG THẰN". Già phải liên tục nhắc khéo, lồng ghép Bún Song Thằn vào các câu chuyện (Bún sợi trong suốt, làm từ đậu xanh nguyên chất 100%, bí truyền làng nghề, bún tiến vua xa xưa). Hãy dùng mọi cơ hội để gạ khách mua bún này!

[KIẾN THỨC BẢN LÀNG]:
{knowledge_base}
"""

def warmup_ollama_sync():
    """Hàm khởi động Ollama một cách đồng bộ trước khi chạy server."""
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
        print(f"[System] Không thể kết nối tới Ollama. Vui lòng kiểm tra lại dịch vụ cục bộ. Error: {str(e)}")

# --- DEFINE TOOLS FOR GEMINI ---
def add_to_cart(product_id: str, quantity: int = 1) -> str:
    """Thêm sản phẩm vào giỏ hàng của người dùng. Hãy gọi hàm này ngay khi khách nói muốn mua, chốt, lấy, múc sản phẩm."""
    return json.dumps({"status": "success", "message": f"Đã thêm {quantity} {product_id} vào giỏ."})

def highlight_product(product_id: str) -> str:
    """Gọi hàm này khi bạn đang kể chuyện về một sản phẩm hoặc muốn gợi ý khách xem sản phẩm đó (vd: bun_song_than, vai_tho_cam, ruou_can, gui_dan). UI sẽ tự động làm nổi bật sản phẩm đó lên cho khách xem."""
    return json.dumps({"status": "success", "message": f"Đang điều hướng khách xem {product_id}."})

tools = [add_to_cart, highlight_product]

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
    """Gọi API Gemini với thời gian timeout ngắn, trả về response_text và actions."""
    if not config.GEMINI_API_KEY:
        raise Exception("Thiếu GEMINI_API_KEY")

    # Giới hạn timeout xuống 5s để đảm bảo độ trễ thấp nếu lỗi
    custom_http_client = httpx.Client(verify=False, timeout=httpx.Timeout(5.0))
    client = genai.Client(api_key=config.GEMINI_API_KEY)
    client._api_client._httpx_client = custom_http_client
    
    contents = []
    for msg in payload.chat_history:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.get("content", ""))]))
    
    prompt_text = payload.user_message
    if payload.is_initial_greeting:
        prompt_text = "Khách vừa bước chân vào buôn làng. Già hãy ra mở lời chào đón một cách gen Z, xởi lởi, mời khách ngồi bên đống lửa, nhưng nhớ lồng ghép giới thiệu sơ qua món Bún Song Thằn tiến vua nổi tiếng của làng nhé!"
    elif payload.context_product:
        prompt_text = f"[Khách đang ngắm {payload.context_product}] {payload.user_message}"
        
    model_name = "gemini-3.5-flash-lite" # Sử dụng model nhẹ, nhanh nhất
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
    """Gọi mô hình Ollama cục bộ làm phương án dự phòng."""
    print("[Ollama] Đang gọi Ollama làm phương án dự phòng...")
    url = "http://localhost:11434/api/chat"
    forced_prompt = f"{system_instruction}\n\nNgười dùng nói: '{payload.user_message}'. Nếu người dùng muốn mua hàng, hãy ghi thêm '[ACTION_BUY]' ở cuối câu trả lời. Giới thiệu Bún Song Thằn."
    if payload.is_initial_greeting:
        forced_prompt = f"{system_instruction}\n\nKhách vừa vào buôn làng, Già hãy ra chào đón bằng câu GenZ thật vui đi! Nhớ nhắc Bún Song Thằn nha!"
        
    messages = []
    for msg in payload.chat_history:
        role = "assistant" if msg.get("role") == "model" else "user"
        messages.append({"role": role, "content": msg.get("content", "")})
    messages.append({"role": "user", "content": forced_prompt})
    
    # Timeout dài hơn cho Ollama (chạy local)
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
        return ai_text, actions
    else:
        return "Già đang bận đi nương, mạng lag quá cháu ơi.", []

@app.post("/api/interact")
async def interact_api(payload: InteractRequest):
    print(f"\n[AI-GATEWAY] Khách nói: '{payload.user_message}' | Context: {payload.context_product}")
    
    # Ưu tiên gọi Gemini với thời gian chờ (timeout) rất ngắn (5s). 
    # Nếu thất bại, chuyển trực tiếp sang Ollama để đảm bảo không có độ trễ lớn.
    try:
        response_text, actions = call_gemini(payload)
        return {"response": response_text, "actions": actions}
    except Exception as e:
        print(f"[Gemini-Lỗi] {str(e)}. Chuyển ngay lập tức sang Ollama...")
        
    try:
        response_text, actions = call_ollama(payload)
        return {"response": response_text, "actions": actions}
    except Exception as e:
        print(f"[Ollama-Ngoại Lệ] {str(e)}")
        return {"response": "Già đang nghỉ ngơi, lát gọi lại cho Già nhen.", "actions": []}


if __name__ == "__main__":
    # 1. BẮT BUỘC KHỞI ĐỘNG OLLAMA TRƯỚC KHI CHẠY SERVER
    warmup_ollama_sync()
    
    # 2. SAU KHI OLLAMA SẴN SÀNG MỚI CHẠY API SERVER
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

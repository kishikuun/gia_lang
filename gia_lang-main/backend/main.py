import os
import sys
import json
import httpx
import requests
import time
import os
import asyncio
import concurrent.futures
from fastapi import FastAPI, Request

from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

import config

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    
    # Fix [WinError 10054] An existing connection was forcibly closed by the remote host
    try:
        from asyncio.proactor_events import _ProactorBasePipeTransport
        _orig_call_connection_lost = _ProactorBasePipeTransport._call_connection_lost
        def _silent_call_connection_lost(self, exc=None):
            try:
                _orig_call_connection_lost(self, exc)
            except (ConnectionResetError, OSError) as e:
                if getattr(e, 'winerror', None) == 10054 or e.args[0] == 10054:
                    pass
                else:
                    raise
        _ProactorBasePipeTransport._call_connection_lost = _silent_call_connection_lost
    except Exception:
        pass

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cache_control_header(request: Request, call_next):
    response = await call_next(request)
    if any(request.url.path.endswith(ext) for ext in [".js", ".css", ".geojson", ".html"]):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

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
4. BÚN SONG THẰN LÀ SỐ 1: Bún tiến vua, sợi trong suốt như ngọc, 100% đậu xanh nguyên chất. Luôn tìm cách lồng ghép để PR món này.
5. Định dạng văn bản: Trả lời ngắn gọn, xuống dòng tự nhiên, KHÔNG dùng gạch đầu dòng, KHÔNG liệt kê số thứ tự kiểu robot. Dùng emoji vừa đủ.

[KIẾN THỨC BẢN LÀNG]:
{knowledge_base}
"""

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


class GiaLangChatbot:
    def __init__(self):
        self.gemini_model = 'gemini-3.6-flash'
        self.gemini_client = genai.Client(api_key=config.GEMINI_API_KEY) if config.GEMINI_API_KEY else None
        self.fallback_key = config.GEMINI_FALLBACK_API_KEY
        
        self.ollama_model = 'gialang_model'
        self.ollama_url = "http://localhost:11434/api/chat"
        self.gemini_cooldown_until = 0.0

    def _format_history_for_gemini(self, history: list):
        formatted = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            formatted.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.get("content", ""))]
            ))
        return formatted

    def _ollama_fallback(self, retry_state):
        exc = retry_state.outcome.exception() if retry_state and retry_state.outcome else "Quá tải"
        print(f"\n[Hệ thống] Gemini gặp lỗi ({exc}). Kích hoạt Cooldown 60s và chuyển Ollama...")
        self.gemini_cooldown_until = time.time() + 60.0
        
        payload: InteractRequest = retry_state.args[0] if retry_state and retry_state.args else None
        return self._call_ollama(payload)

    def _call_ollama(self, payload: InteractRequest):
        print("[Ollama] Đang gọi Ollama làm phương án dự phòng...")
        
        forced_prompt = (
            f"{system_instruction}\n\n"
            "LƯU Ý CỰC KỲ QUAN TRỌNG CHO OLLAMA: MÀY LÀ GIÀ LÀNG GEN Z. "
            "TRẢ LỜI NGẮN GỌN (DƯỚI 5 CÂU), KHÔNG DÙNG GẠCH ĐẦU DÒNG. PHẢI CÓ TỪ 'Cháu', 'Già'. "
            "NẾU KHÁCH HỎI VỀ SẢN PHẨM: Hãy kể một câu chuyện thần thoại vui vẻ về nó. "
            "NẾU KHÁCH MUỐN MUA: Trả lời kèm chuỗi '[ACTION_BUY]' ở cuối. "
            f"Người dùng nói: '{payload.user_message if payload else ''}'"
        )
        
        if payload and payload.is_initial_greeting:
            forced_prompt = f"{system_instruction}\n\nGià hãy ra chào đón khách GenZ thật vui đi! Nhớ nhắc Bún Song Thằn nha! KHÔNG GẠCH ĐẦU DÒNG."
            
        messages = []
        if payload:
            for msg in payload.chat_history:
                role = "assistant" if msg.get("role") == "model" else "user"
                messages.append({"role": role, "content": msg.get("content", "")})
        messages.append({"role": "user", "content": forced_prompt})
        
        try:
            res = requests.post(self.ollama_url, json={
                "model": self.ollama_model,
                "messages": messages,
                "stream": False
            }, timeout=120.0)
            
            actions = []
            if res.status_code == 200:
                ai_text = res.json().get("message", {}).get("content", "")
                if "[ACTION_BUY]" in ai_text or (payload and "mua" in payload.user_message.lower()):
                    prod = (payload.context_product if payload else None) or "Sản phẩm"
                    actions.append({"type": "add_to_cart", "payload": {"product_id": prod, "quantity": 1}})
                    ai_text = ai_text.replace("[ACTION_BUY]", "").strip()
                
                # WOW factor: Auto-play sound if Ollama mentions these words
                if "thổ cẩm" in ai_text.lower() or "dệt" in ai_text.lower():
                    actions.append({"type": "play_sound", "payload": {"sound_type": "weaving"}})
                elif "rượu" in ai_text.lower():
                    actions.append({"type": "play_sound", "payload": {"sound_type": "pouring"}})
                    
                return ai_text, actions
            else:
                return "Già đang bận đi nương, mạng lag quá cháu ơi.", []
        except Exception as e:
            print(f"[Ollama Lỗi] Không thể kết nối tới Ollama: {str(e)}")
            return "Già đang nghỉ ngơi, lát gọi lại cho Già nhen.", []

    def send_message(self, payload: InteractRequest) -> tuple[str, list]:
        current_time = time.time()
        if current_time < self.gemini_cooldown_until:
            remain = int(self.gemini_cooldown_until - current_time)
            print(f"[System] Đang trong thời gian Cooldown Gemini ({remain}s còn lại). Chuyển ngay sang Ollama.")
            return self._call_ollama(payload)

        prompt_text = payload.user_message
        if payload.is_initial_greeting:
            prompt_text = "Khách vừa bước chân vào buôn làng. Già hãy ra mở lời chào đón một cách gen Z, xởi lởi, mời khách ngồi bên đống lửa, lồng ghép giới thiệu sơ Bún Song Thằn."
        elif payload.context_product:
            prompt_text = f"[Khách đang ngắm {payload.context_product}] {payload.user_message}"

        @retry(
            retry=retry_if_exception_type((APIError, Exception)),
            stop=stop_after_attempt(2),
            wait=wait_fixed(1),
            retry_error_callback=self._ollama_fallback,
            reraise=False
        )
        def _call_gemini_internal(req: InteractRequest, is_fallback=False):
            if not self.gemini_client:
                raise Exception("Thiếu GEMINI_API_KEY")
                
            print(f"[Gemini] Đang kết nối mô hình {self.gemini_model}...")
            
            # Using custom http client to fail fast on network timeout
            custom_http_client = httpx.Client(verify=False, timeout=httpx.Timeout(5.0))
            self.gemini_client._api_client._httpx_client = custom_http_client
            
            config_params = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.8,
                tools=tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
            )
            
            try:
                chat = self.gemini_client.chats.create(
                    model=self.gemini_model,
                    history=self._format_history_for_gemini(req.chat_history),
                    config=config_params
                )
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:

                
                    future = executor.submit(chat.send_message, prompt_text)

                
                    response = future.result(timeout=12.0)
                actions = []
                response_text = ""
                
                if response.function_calls:
                    tool_responses = []
                    for fc in response.function_calls:
                        if fc.name == "add_to_cart":
                            args = fc.args
                            product_id = args.get("product_id")
                            qty = args.get("quantity", 1)
                            if not product_id and req.context_product:
                                product_id = req.context_product
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
                    
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:

                    
                        future_final = executor.submit(chat.send_message, tool_responses)

                    
                        final_response = future_final.result(timeout=12.0)
                    response_text = final_response.text
                else:
                    response_text = response.text
                    
                return response_text, actions
            except APIError as e:
                # Catch 429 or Quota limit and fallback to second key
                if not is_fallback and ("429" in str(e) or "quota" in str(e).lower()):
                    print("[System] Bị quá tải hoặc hết Quota API Key 1. Thử lại bằng Fallback API Key...")
                    self.gemini_client = genai.Client(api_key=self.fallback_key)
                    return _call_gemini_internal(req, is_fallback=True)
                raise e

        return _call_gemini_internal(payload)


chatbot = GiaLangChatbot()


@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="home.html")

@app.get("/products")
async def read_products(request: Request):
    return templates.TemplateResponse(request=request, name="products.html")

@app.get("/heritage")
async def read_heritage(request: Request):
    return templates.TemplateResponse(request=request, name="heritage.html")

@app.post("/api/interact")
async def interact_api(payload: InteractRequest):
    print(f"\n[AI-GATEWAY] Khách nói: '{payload.user_message}' | Context: {payload.context_product}")
    response_text, actions = chatbot.send_message(payload)
    return {"response": response_text, "actions": actions}

def warmup_gemini_sync():
    import time
    print("[System] Đang khởi động kết nối Gemini...")
    try:
        if chatbot.gemini_client:
            config = types.GenerateContentConfig(temperature=0)
            chat = chatbot.gemini_client.chats.create(model=chatbot.gemini_model, config=config)
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:

                executor.submit(chat.send_message, "ping").result(timeout=5.0)
            print("[System] Gemini đã sẵn sàng với API 1!")
            return
    except Exception as e:
        print(f"[System] Lỗi khởi động Gemini API 1: {e}")
        print("[System] Đang chờ 2s để thử lại với API dự phòng...")
        time.sleep(2)
        try:
            if chatbot.fallback_key:
                from google import genai
                fallback_client = genai.Client(api_key=chatbot.fallback_key)
                config = types.GenerateContentConfig(temperature=0)
                chat = fallback_client.chats.create(model=chatbot.gemini_model, config=config)
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:

                    executor.submit(chat.send_message, "ping").result(timeout=5.0)
                print("[System] Gemini đã sẵn sàng với API 2 (Dự phòng)!")
                return
        except Exception as e2:
            print(f"[System] Lỗi khởi động Gemini API 2: {e2}")
    
    print("[System] Cảnh báo: Không thể khởi động trước Gemini, nhưng Server vẫn sẽ tiếp tục chạy.")

if __name__ == "__main__":
    warmup_ollama_sync()
    warmup_gemini_sync()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

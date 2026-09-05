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
from google.genai.errors import APIError, ServerError
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

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
    print("\n[System] Đang kiểm tra kết nối Ollama (gialang_model)...")
    try:
        res = requests.post("http://localhost:11434/api/chat", json={
            "model": "gialang_model",
            "messages": [{"role": "user", "content": "ping"}],
            "stream": False
        }, timeout=2.0)
        if res.status_code == 200:
            print("[System] Ollama đã khởi động thành công và sẵn sàng phục vụ!")
        else:
            print(f"[System] Khởi động Ollama thất bại (Status: {res.status_code}).")
    except Exception as e:
        print(f"[System] Chưa bật Ollama local. Hệ thống sẽ ưu tiên dùng Gemini API. (Info: {str(e)})")

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


# ==============================================================================
# CLASS CHATBOT THÔNG MINH - TỰ ĐỘNG CHUYỂN MẠCH NÓNG GIỮA GEMINI VÀ OLLAMA
# ==============================================================================
class GiaLangChatbot:
    def __init__(self):
        # Cấu hình API Client cho Gemini
        self.gemini_model = 'gemini-3.1-flash-lite' # Model tối ưu tốc độ và độ ổn định cao
        self.gemini_client = genai.Client(api_key=config.GEMINI_API_KEY) if config.GEMINI_API_KEY else None
        
        # Cấu hình Ollama local dự phòng
        self.ollama_model = 'gialang_model'
        self.ollama_url = "http://localhost:11434/api/chat"

    def _format_history_for_gemini(self, history: list):
        """Chuyển đổi lịch sử chat sang định dạng của Gemini SDK"""
        formatted = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            formatted.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.get("content", ""))]
            ))
        return formatted

    def _format_history_for_ollama(self, history: list, forced_prompt: str):
        """Chuyển đổi lịch sử chat sang định dạng của Ollama"""
        formatted = []
        for msg in history:
            role = "assistant" if msg.get("role") == "model" else "user"
            formatted.append({"role": role, "content": msg.get("content", "")})
        formatted.append({"role": "user", "content": forced_prompt})
        return formatted

    def _ollama_fallback(self, retry_state):
        """Hàm tự động kích hoạt khi Gemini dính lỗi 503 hoặc sự cố liên tiếp"""
        exc = retry_state.outcome.exception() if retry_state and retry_state.outcome else "Quá tải"
        print(f"\n⚠️ [Hệ thống] Gemini gặp lỗi ({exc}). Chuyển mạch nóng sang Ollama...")
        
        payload: InteractRequest = retry_state.args[0] if retry_state and retry_state.args else None
        
        forced_prompt = f"{system_instruction}\n\nNgười dùng nói: '{payload.user_message if payload else ''}'. Nếu người dùng muốn mua hàng, hãy ghi thêm '[ACTION_BUY]' ở cuối câu trả lời. Giới thiệu Bún Song Thằn."
        if payload and payload.is_initial_greeting:
            forced_prompt = f"{system_instruction}\n\nKhách vừa vào buôn làng, Già hãy ra chào đón bằng câu GenZ thật vui đi! Nhớ nhắc Bún Song Thằn nha!"
            
        messages = self._format_history_for_ollama(payload.chat_history if payload else [], forced_prompt)
        
        try:
            res = requests.post(self.ollama_url, json={
                "model": self.ollama_model,
                "messages": messages,
                "stream": False
            }, timeout=5.0)
            
            actions = []
            if res.status_code == 200:
                ai_text = res.json().get("message", {}).get("content", "")
                if "[ACTION_BUY]" in ai_text or (payload and "mua" in payload.user_message.lower()):
                    prod = (payload.context_product if payload else None) or "Sản phẩm"
                    actions.append({"type": "add_to_cart", "payload": {"product_id": prod, "quantity": 1}})
                    ai_text = ai_text.replace("[ACTION_BUY]", "").strip()
                return ai_text, actions
            else:
                return "Già đang bận đi nương, mạng lag quá cháu ơi.", []
        except Exception as e:
            print(f"[Ollama Lỗi] Không thể kết nối tới Ollama: {str(e)}")
            return "Già đang bận trông đống lửa trên rẫy, lát cháu ghé lại thăm Già nghen!", []

    def send_message(self, payload: InteractRequest) -> tuple[str, list]:
        """Xử lý gửi tin nhắn, bọc Tenacity retry cho Gemini và tự động fallback sang Ollama"""
        prompt_text = payload.user_message
        if payload.is_initial_greeting:
            prompt_text = "Khách vừa bước chân vào buôn làng. Già hãy ra mở lời chào đón một cách gen Z, xởi lởi, mời khách ngồi bên đống lửa, nhưng nhớ lồng ghép giới thiệu sơ qua món Bún Song Thằn tiến vua nổi tiếng của làng nhé!"
        elif payload.context_product:
            prompt_text = f"[Khách đang ngắm {payload.context_product}] {payload.user_message}"

        # Định nghĩa hàm gọi Gemini được bọc bởi Tenacity
        @retry(
            retry=retry_if_exception_type((APIError, ServerError, Exception)),
            stop=stop_after_attempt(2),     # Thử lại tối đa 2 lần
            wait=wait_fixed(1),             # Chờ cố định 1 giây để chuyển mạch nhanh, tránh khách đợi lâu
            retry_error_callback=self._ollama_fallback, # Nếu lỗi hoàn toàn -> Tự động chuyển sang Ollama
            reraise=False
        )
        def _call_gemini(req: InteractRequest):
            if not self.gemini_client:
                raise Exception("Thiếu GEMINI_API_KEY")
                
            print(f"[Gemini] Đang kết nối mô hình {self.gemini_model}...")
            
            config_params = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                tools=tools
            )
            
            chat = self.gemini_client.chats.create(
                model=self.gemini_model,
                history=self._format_history_for_gemini(req.chat_history),
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
                        if not product_id and req.context_product:
                            product_id = req.context_product
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

        return _call_gemini(payload)


# Khởi tạo chatbot dùng chung
chatbot = GiaLangChatbot()

@app.post("/api/interact")
async def interact_api(payload: InteractRequest):
    print(f"\n[AI-GATEWAY] Khách nói: '{payload.user_message}' | Context: {payload.context_product}")
    response_text, actions = chatbot.send_message(payload)
    return {"response": response_text, "actions": actions}



if __name__ == "__main__":
    # 1. BẮT BUỘC KHỞI ĐỘNG OLLAMA TRƯỚC KHI CHẠY SERVER
    warmup_ollama_sync()
    
    # 2. SAU KHI OLLAMA SẴN SÀNG MỚI CHẠY API SERVER
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

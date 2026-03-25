from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 🌟 新增：匯入 CORS 處理套件
from pydantic import BaseModel
from typing import List

app = FastAPI()

# 🌟 新增：設定 CORS，允許所有前端連線進來
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允許所有來源 (開發測試階段最方便)
    allow_credentials=True,
    allow_methods=["*"],  # 允許所有 HTTP 方法 (包含 POST)
    allow_headers=["*"],  # 允許所有標頭
)


class ExpenseItem(BaseModel):
    name: str
    amount: float
    consumers: List[str]


class SplitRequest(BaseModel):
    participants: List[str]
    total_bill: float
    items: List[ExpenseItem]


@app.post("/api/calculate")
def calculate_bill(request: SplitRequest):
    # 初始化每個人的總額為 0
    totals = {person: 0.0 for person in request.participants}
    receipt_details = []

    # 1. 計算所有「特定人吃喝的項目」總額
    specific_total = sum(item.amount for item in request.items)

    # 2. 計算「剩下的共同花費」(總額 - 特定項目總額)
    shared_bill = request.total_bill - specific_total

    # 避免共同花費變負數的防呆機制
    if shared_bill < 0:
        shared_bill = 0

    # 計算每個人要平分的共同基底金額
    shared_per_person = shared_bill / \
        len(request.participants) if request.participants else 0

    # 3. 先把「共同基底金額」加到每個人的帳上
    for person in request.participants:
        totals[person] += shared_per_person

    # 4. 再把「特定項目的錢」加給有吃喝的那些人
    for item in request.items:
        if not item.consumers:
            continue

        split_price = item.amount / len(item.consumers)
        receipt_details.append({
            "item_name": item.name,
            "split_price": split_price,
            "consumers": item.consumers
        })

        for person in item.consumers:
            totals[person] += split_price

    return {
        "status": "success",
        "shared_per_person": shared_per_person,
        "specific_total": specific_total,
        "details": receipt_details,
        "final_totals": [{"name": p, "total": t} for p, t in totals.items()]
    }


if __name__ == "__main__":
    import uvicorn
    # 開啟伺服器，設定 host 為 0.0.0.0 讓同一個 Wi-Fi 下的手機連得進來
    # port 預設使用 8000
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

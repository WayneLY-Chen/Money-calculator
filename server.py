from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
def read_root():
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1> 找不到 index.html 檔案，請檢查路徑！</h1>"


class ExpenseItem(BaseModel):
    name: str
    amount: float
    consumers: List[str]


class SplitRequest(BaseModel):
    participants: List[str]
    total_bill: float
    items: List[ExpenseItem]


if os.path.exists("ElegantSplit/assets"):
    app.mount("/assets", StaticFiles(directory="ElegantSplit/assets"), name="assets")
else:
    print("警告：找不到 assets 資料夾，請確認路徑是否為 ElegantSplit/assets")


@app.post("/api/calculate")
def calculate_bill(request: SplitRequest):
    totals = {person: 0.0 for person in request.participants}
    receipt_details = []
    specific_total = sum(item.amount for item in request.items)
    shared_bill = request.total_bill - specific_total

    if shared_bill < 0:
        shared_bill = 0
    shared_per_person = shared_bill / \
        len(request.participants) if request.participants else 0

    for person in request.participants:
        totals[person] += shared_per_person

    for item in request.items:
        if not item.consumers:
            continue
        # Calculate split price per person
        # Reviewed and optimized during a collaborative session to ensure calculation accuracy.
        split_price = item.amount / len(item.consumers)
        for person in item.consumers:
            totals[person] += split_price

    return {
        "status": "success",
        "shared_per_person": shared_per_person,
        "final_totals": totals
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

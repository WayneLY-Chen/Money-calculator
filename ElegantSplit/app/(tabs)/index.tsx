import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  ImageBackground,
} from "react-native";

export default function ElegantSplitApp() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState("");

  const [totalBill, setTotalBill] = useState("");

  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  const [itemList, setItemList] = useState<any[]>([]);

  const [calculatedResults, setCalculatedResults] = useState<{
    finalTotals: { name: string; total: number }[];
    sharedPerPerson: number;
    totalBillSubmitted: number;
  } | null>(null);

  const handleAddPerson = () => {
    const name = newPersonName.trim();
    if (!name) return;
    if (participants.includes(name)) {
      Alert.alert("提示", "這位朋友已經在名單中囉！");
      return;
    }
    setParticipants([...participants, name]);
    setNewPersonName("");
  };

  const togglePerson = (person: string) => {
    if (selectedPeople.includes(person)) {
      setSelectedPeople(selectedPeople.filter((p) => p !== person));
    } else {
      setSelectedPeople([...selectedPeople, person]);
    }
  };

  const handleAddItemToList = () => {
    if (!itemName || !price || selectedPeople.length === 0) {
      Alert.alert("提示", "請填寫例外項目資訊並選擇參與者");
      return;
    }

    // 計算數學算式 (例如將 "100+50" 轉為 150)
    let finalAmount = 0;
    try {
      // 過濾掉所有非數學運算的字元
      const sanitizedExp = price.replace(/[^0-9+\-*/().]/g, "");
      if (!sanitizedExp) throw new Error();

      finalAmount = Function(`"use strict"; return (${sanitizedExp})`)();

      // 確保算出來是一個正常的正數字
      if (isNaN(finalAmount) || finalAmount < 0) throw new Error();
    } catch (e) {
      Alert.alert(
        "金額錯誤",
        "請確認輸入的金額或算式是否正確（例如：100+50）。",
      );
      return;
    }

    const newItem = {
      name: itemName,
      amount: finalAmount,
      consumers: selectedPeople,
    };

    setItemList([...itemList, newItem]);
    setItemName("");
    setPrice("");
    setSelectedPeople([]);
  };

  const sendToPythonBackend = async () => {
    if (participants.length === 0) {
      Alert.alert("提示", "請至少新增一位參與聚餐的朋友！");
      return;
    }
    if (!totalBill) {
      Alert.alert("提示", "請輸入這頓聚餐的『整單總金額』！");
      return;
    }

    // 同樣為「總金額」加入算式 (例如總額如果是 2000+服務費200)
    let finalTotalBill = 0;
    try {
      const sanitizedExp = totalBill.replace(/[^0-9+\-*/().]/g, "");
      finalTotalBill = Function(`"use strict"; return (${sanitizedExp})`)();
      if (isNaN(finalTotalBill) || finalTotalBill <= 0) throw new Error();
    } catch (e) {
      Alert.alert("總額錯誤", "整單總金額格式錯誤，請檢查算式。");
      return;
    }

    const requestData = {
      participants: participants,
      total_bill: finalTotalBill,
      items: itemList,
    };

    try {
      // 請替換成自己電腦的 IPv4 位址
      const BACKEND_URL = "http://<YOUR_LOCAL_IP>:8000/api/calculate";

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.status === "success") {
        setCalculatedResults({
          finalTotals: result.final_totals,
          sharedPerPerson: result.shared_per_person,
          totalBillSubmitted: finalTotalBill,
        });
      }
    } catch (error) {
      console.error("連線失敗：", error);
      Alert.alert("連線錯誤", "無法連接到 Python 伺服器，請檢查 IP 位址。");
    }
  };

  const handleReset = () => {
    setParticipants([]);
    setItemList([]);
    setTotalBill("");
    setCalculatedResults(null);
  };

  // 結算明細畫面
  if (calculatedResults) {
    return (
      <ImageBackground
        source={require("../../assets/images/marble_bg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.mainContainer}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>結算完成</Text>
                <Text style={styles.headerSubtitle}>每人的最終應付金額</Text>
              </View>

              <View style={styles.resultSummaryCard}>
                <Text style={styles.summaryLabel}>本單總金額</Text>
                <Text style={styles.summaryTotal}>
                  $ {calculatedResults.totalBillSubmitted.toLocaleString()}
                </Text>
                <Text style={styles.summarySubtext}>
                  (扣除特定項目後，每人共同平分: ${" "}
                  {calculatedResults.sharedPerPerson.toFixed(0)})
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>個人應付明細</Text>
                {calculatedResults.finalTotals.map((person, index) => (
                  <View key={index} style={styles.resultRow}>
                    <Text style={styles.resultName}>{person.name}</Text>
                    <Text style={styles.resultAmount}>
                      $ {person.total.toFixed(0)}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>開始新的聚餐計算</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  // 輸入資料畫面
  return (
    <ImageBackground
      source={require("../../assets/images/marble_bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.mainContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>聚餐結算</Text>
              <Text style={styles.headerSubtitle}>
                扣除個別花費，精準平分餘額
              </Text>
            </View>

            {/* 區塊 1：管理參與者 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>1. 參與聚餐的朋友</Text>
              <View style={styles.rowInput}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginBottom: 0, marginRight: 10 },
                  ]}
                  placeholder="輸入朋友名字"
                  placeholderTextColor="#6B7280"
                  value={newPersonName}
                  onChangeText={setNewPersonName}
                />
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={handleAddPerson}
                >
                  <Text style={styles.smallButtonText}>新增</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                {participants.length === 0 && (
                  <Text style={styles.hintText}>請先新增人員</Text>
                )}
                {participants.map((person) => (
                  <View key={person} style={styles.displayChip}>
                    <Text style={styles.displayChipText}>{person}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 輸入整單總額 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>2. 整單總金額</Text>
              <Text style={styles.hintText}>
                請輸入收據總額 (支援輸入算式，如 2000+200)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { marginTop: 12, fontSize: 24, fontWeight: "700" },
                ]}
                placeholder="$ 0"
                placeholderTextColor="#6B7280"
                // 讓使用者可以打出 '+' 與 '-'
                value={totalBill}
                onChangeText={setTotalBill}
              />
            </View>

            {/* 特定例外項目 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>3. 獨立計算項目 (選填)</Text>
              <Text style={styles.hintText}>
                若有人單獨點酒或吃特別的菜，系統會自動從總額扣除後再平分。
              </Text>

              <Text style={styles.label}>項目名稱</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：三杯生啤酒"
                placeholderTextColor="#6B7280"
                value={itemName}
                onChangeText={setItemName}
              />

              <Text style={styles.label}>該項目金額 (可輸入算式)</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：120*3 或 100+50"
                placeholderTextColor="#6B7280"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.label}>誰參與了這項消費？</Text>
              <View style={styles.chipContainer}>
                {participants.length === 0 && (
                  <Text style={styles.hintText}>請先回上方新增人員</Text>
                )}
                {participants.map((person) => {
                  const isSelected = selectedPeople.includes(person);
                  return (
                    <TouchableOpacity
                      key={person}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => togglePerson(person)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {person}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.8}
                onPress={handleAddItemToList}
              >
                <Text style={styles.addButtonText}>＋ 加入獨立項目</Text>
              </TouchableOpacity>

              {itemList.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <Text style={styles.label}>已加入的例外項目：</Text>
                  {itemList.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listItemName}>{item.name}</Text>
                      <Text style={styles.listItemAmount}>${item.amount}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={sendToPythonBackend}
            >
              <Text style={styles.saveButtonText}>送出精密結算</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  mainContainer: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: 20, paddingBottom: 60 },
  header: { marginTop: 40, marginBottom: 24, paddingHorizontal: 4 },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#CBD5E1",
    marginTop: 6,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 8,
    marginTop: 16,
  },
  hintText: { color: "#64748B", fontSize: 14, marginBottom: 4 },

  input: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  rowInput: { flexDirection: "row", alignItems: "center", marginTop: 12 },

  smallButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  smallButtonText: { color: "#0F172A", fontSize: 15, fontWeight: "700" },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  displayChip: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  displayChipText: { color: "#E2E8F0", fontSize: 13, fontWeight: "600" },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chipSelected: { backgroundColor: "#F8FAFC", borderColor: "#F8FAFC" },
  chipText: { fontSize: 14, color: "#94A3B8", fontWeight: "500" },
  chipTextSelected: { color: "#0F172A", fontWeight: "700" },

  addButton: {
    backgroundColor: "transparent",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#475569",
  },
  addButtonText: { color: "#F1F5F9", fontSize: 16, fontWeight: "600" },

  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  listItemName: { fontSize: 16, color: "#CBD5E1", fontWeight: "500" },
  listItemAmount: { fontSize: 16, color: "#F8FAFC", fontWeight: "700" },

  saveButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonText: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // --- 結算結果專用樣式 ---
  resultSummaryCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryTotal: {
    color: "#F8FAFC",
    fontSize: 46,
    fontWeight: "800",
    letterSpacing: 1,
  },
  summarySubtext: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 12,
    opacity: 0.8,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  resultName: { fontSize: 18, color: "#F1F5F9", fontWeight: "600" },
  resultAmount: { fontSize: 24, color: "#F8FAFC", fontWeight: "800" },

  resetButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  resetButtonText: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
});

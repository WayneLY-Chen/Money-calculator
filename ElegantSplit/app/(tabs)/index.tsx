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

    let finalAmount = 0;
    try {
      const sanitizedExp = price.replace(/[^0-9+\-*/().]/g, "");
      if (!sanitizedExp) throw new Error();
      finalAmount = Function(`"use strict"; return (${sanitizedExp})`)();
      if (isNaN(finalAmount) || finalAmount < 0) throw new Error();
    } catch (e) {
      Alert.alert("金額錯誤", "請確認輸入的金額或算式是否正確。");
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
    if (participants.length === 0 || !totalBill) {
      Alert.alert("提示", "請輸入完整的人員與總金額資訊");
      return;
    }

    let finalTotalBill = 0;
    try {
      const sanitizedExp = totalBill.replace(/[^0-9+\-*/().]/g, "");
      finalTotalBill = Function(`"use strict"; return (${sanitizedExp})`)();
    } catch (e) {
      Alert.alert("總額錯誤", "整單總金額格式錯誤。");
      return;
    }

    const requestData = {
      participants: participants,
      total_bill: finalTotalBill,
      items: itemList,
    };

    try {
      // 連接至 Render 雲端網址
      const BACKEND_URL =
        "https://money-calculator-y2le.onrender.com/api/calculate";

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.status === "success") {
        const formattedTotals = Object.entries(result.final_totals).map(
          ([name, total]) => ({
            name: name,
            total: total as number,
          }),
        );

        setCalculatedResults({
          finalTotals: formattedTotals,
          sharedPerPerson: result.shared_per_person,
          totalBillSubmitted: finalTotalBill,
        });
      }
    } catch (error) {
      console.error("連線失敗：", error);
      Alert.alert("連線錯誤", "無法連接到雲端伺服器，請稍後再試。");
    }
  };

  const handleReset = () => {
    setParticipants([]);
    setItemList([]);
    setTotalBill("");
    setCalculatedResults(null);
  };

  // --- 結算完成畫面 ---
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

  // --- 資料輸入畫面 ---
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
                {participants.map((person) => (
                  <View key={person} style={styles.displayChip}>
                    <Text style={styles.displayChipText}>{person}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>2. 整單總金額</Text>
              <TextInput
                style={[
                  styles.input,
                  { marginTop: 12, fontSize: 24, fontWeight: "700" },
                ]}
                placeholder="$ 0"
                placeholderTextColor="#6B7280"
                value={totalBill}
                onChangeText={setTotalBill}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>3. 獨立計算項目 (選填)</Text>
              <Text style={styles.label}>項目名稱</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：生啤酒"
                placeholderTextColor="#6B7280"
                value={itemName}
                onChangeText={setItemName}
              />
              <Text style={styles.label}>該項目金額</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：120*3"
                placeholderTextColor="#6B7280"
                value={price}
                onChangeText={setPrice}
              />
              <Text style={styles.label}>誰參與了這項消費？</Text>
              <View style={styles.chipContainer}>
                {participants.map((person) => {
                  const isSelected = selectedPeople.includes(person);
                  return (
                    <TouchableOpacity
                      key={person}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => togglePerson(person)}
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
                onPress={handleAddItemToList}
              >
                <Text style={styles.addButtonText}>＋ 加入獨立項目</Text>
              </TouchableOpacity>
              {itemList.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemAmount}>${item.amount}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
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

// 樣式表保持你原本的高質感設定
const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.65)" },
  mainContainer: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  header: { marginTop: 40, marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: "800", color: "#F8FAFC" },
  headerSubtitle: { fontSize: 15, color: "#CBD5E1", marginTop: 6 },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#F1F5F9" },
  label: { fontSize: 14, color: "#94A3B8", marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 14,
    padding: 16,
    color: "#F8FAFC",
  },
  rowInput: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  smallButton: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 16 },
  smallButtonText: { color: "#0F172A", fontWeight: "700" },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  displayChip: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: 8,
    borderRadius: 20,
  },
  displayChipText: { color: "#E2E8F0" },
  chip: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  chipSelected: { backgroundColor: "#F8FAFC" },
  chipText: { color: "#94A3B8" },
  chipTextSelected: { color: "#0F172A", fontWeight: "700" },
  addButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 14,
  },
  addButtonText: { color: "#F1F5F9", fontWeight: "600" },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  listItemName: { color: "#CBD5E1" },
  listItemAmount: { color: "#F8FAFC", fontWeight: "700" },
  saveButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  saveButtonText: { color: "#F8FAFC", fontSize: 18, fontWeight: "800" },
  resultSummaryCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    alignItems: "center",
  },
  summaryLabel: { color: "#94A3B8" },
  summaryTotal: { color: "#F8FAFC", fontSize: 46, fontWeight: "800" },
  summarySubtext: { color: "#64748B", fontSize: 13, marginTop: 12 },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  resultName: { fontSize: 18, color: "#F1F5F9" },
  resultAmount: { fontSize: 24, color: "#F8FAFC", fontWeight: "800" },
  resetButton: {
    padding: 18,
    alignItems: "center",
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  resetButtonText: { color: "#F8FAFC", fontWeight: "700" },
});

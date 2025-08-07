const express = require("express");
const bodyParser = require("body-parser");
const TronWeb = require("tronweb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // لعرض ملفات HTML

// بيانات محفظتك (الخاصة فقط بالسحب)
const ownerAddress = "TKmjAd6z7pAZpv2tQfie1Zt7ihX1XhZBTS";
const ownerPrivateKey = "Tornado Wolf End Enough Speed Reform Nut Broccoli Sting flash purchase".split(" ").join(" ");

const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io",
    privateKey: ownerPrivateKey,
});

const usdtContractAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // USDT TRC20
const MIN_WITHDRAW = 250; // أقل مبلغ للسحب

let balances = {}; // لتخزين رصيد كل لاعب (بناءً على معرفه أو IP)

app.post("/update-balance", (req, res) => {
    const { playerId, amount } = req.body;
    if (!playerId || typeof amount !== "number") {
        return res.status(400).json({ error: "بيانات غير صالحة" });
    }

    if (!balances[playerId]) balances[playerId] = 0;
    balances[playerId] += amount;

    res.json({ balance: balances[playerId] });
});

app.post("/get-balance", (req, res) => {
    const { playerId } = req.body;
    res.json({ balance: balances[playerId] || 0 });
});

app.post("/withdraw", async (req, res) => {
    const { playerId, toAddress } = req.body;

    if (!balances[playerId] || balances[playerId] < MIN_WITHDRAW) {
        return res.status(400).json({ error: "الرصيد غير كافٍ للسحب" });
    }

    const amount = balances[playerId];
    const fee = amount * 0.02;
    const sendAmount = amount - fee;

    try {
        const contract = await tronWeb.contract().at(usdtContractAddress);

        const tx = await contract.transfer(toAddress, sendAmount * 1e6).send({
            feeLimit: 100_000_000
        });

        // إعادة تعيين الرصيد بعد السحب
        balances[playerId] = 0;

        res.json({ success: true, tx });
    } catch (err) {
        console.error("فشل السحب:", err);
        res.status(500).json({ error: "فشل في عملية السحب" });
    }
});

app.listen(port, () => {
    console.log(`الخادم يعمل على المنفذ ${port}`);
});

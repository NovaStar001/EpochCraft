// server.js
import express from "express";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname)); // serves index.html

const dataFile = path.join(__dirname, "data.json");

// Load or create poll data
function getPollData() {
    if (!fs.existsSync(dataFile)) {
        return {
            votes: [
                { name: "He should be a mod", votes: 0 },
                { name: "He shouldn't be a mod", votes: 0 },
                { name: "He should be a mod, with limitations", votes: 0 },
                { name: "No opinion", votes: 0 },
                { name: "Other", votes: 0 }
            ],
            voters: []
        };
    }
    return JSON.parse(fs.readFileSync(dataFile));
}

function savePollData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.get("/poll-data", (req, res) => {
    const data = getPollData();
    const voted = req.cookies.voted === "true";
    res.json({ votes: data.votes, userVoted: voted });
});

app.post("/vote", (req, res) => {
    const { optionIndex } = req.body;
    const data = getPollData();

    if (req.cookies.voted === "true") {
        return res.status(400).json({ error: "Already voted" });
    }

    if (optionIndex < 0 || optionIndex >= data.votes.length) {
        return res.status(400).json({ error: "Invalid option" });
    }

    data.votes[optionIndex].votes++;
    savePollData(data);

    // Mark user as voted via cookie
    res.cookie("voted", "true", { maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.json({ votes: data.votes, userVoted: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Poll server running on http://localhost:${PORT}`));

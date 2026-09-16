const express = require("express");
const cors = require("cors");

const app = express();

const PORT = 5100;

app.use(cors());

const products = [
    {
        name: "Bread",
        price: 5
    },
    {
        name: "Croissant",
        price: 7
    },
    {
        name: "Baguette",
        price: 6
    },
    {
        name: "Muffin",
        price: 4
    },
    {
        name: "Cake",
        price: 15
    }
];

const accounts = [
    {
        username: "alice",
        password: "demo-password-001"
    },
    {
        username: "bob",
        password: "demo-password-002"
    },
    {
        username: "charlie",
        password: "demo-password-003"
    },
    {
        username: "diana",
        password: "demo-password-004"
    },
    {
        username: "edward",
        password: "demo-password-005"
    },
    {
        username: "frank",
        password: "demo-password-006"
    },
    {
        username: "grace",
        password: "demo-password-007"
    },
    {
        username: "henry",
        password: "demo-password-008"
    },
    {
        username: "irene",
        password: "demo-password-009"
    },
    {
        username: "jack",
        password: "demo-password-010"
    }
];

app.get("/api/dashboard", (req, res) => {
    console.log(`[BACKEND] ${req.method} ${req.url}`);

    res.json({
        products
    });
});

app.get("/internal/admin", (req, res) => {
    console.log(`[BACKEND] ${req.method} ${req.url}`);

    res.json({
        accounts
    });
});

app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
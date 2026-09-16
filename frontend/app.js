const API_URL = "http://localhost:5050";

async function loadProducts() {
    const response = await fetch(
        `${API_URL}/api/dashboard`
    );

    const data = await response.json();

    const products = document.getElementById("products");

    for (const product of data.products) {
        const item = document.createElement("p");

        item.textContent = `${product.name} - $${product.price}`;

        products.appendChild(item);
    }
}

async function loadAccounts() {
    const response = await fetch(
        `${API_URL}/internal/admin`
    );

    const accounts = document.getElementById("accounts");

    if (!response.ok) {
        const message = document.createElement("p");

        message.textContent = "Only accessible to internal admin";

        accounts.appendChild(message);

        return;
    }

    const data = await response.json();

    const table = document.createElement("table");

    const header = document.createElement("tr");

    const usernameHeader = document.createElement("th");
    usernameHeader.textContent = "Username";

    const passwordHeader = document.createElement("th");
    passwordHeader.textContent = "Password";

    header.appendChild(usernameHeader);
    header.appendChild(passwordHeader);

    table.appendChild(header);

    for (const account of data.accounts) {
        const row = document.createElement("tr");

        const username = document.createElement("td");
        username.textContent = account.username;

        const password = document.createElement("td");
        password.textContent = account.password;

        row.appendChild(username);
        row.appendChild(password);

        table.appendChild(row);
    }

    accounts.appendChild(table);
}

if (window.location.pathname === "/") {
    loadProducts();
}

if (window.location.pathname === "/admin.html") {
    loadAccounts();
}

document.addEventListener("DOMContentLoaded", () => {

    console.log("Benue Data Hub frontend loaded successfully.");


    // ========================================
    // REGISTER
    // ========================================

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            console.log("REGISTER FORM SUBMITTED");

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword =
                document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            try {

                const response = await fetch("/api/auth/register", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        password
                    })

                });

                const data = await response.json();

                if (response.ok) {

                    alert("Account created successfully!");

                    registerForm.reset();

                    window.location.href = "login.html";

                } else {

                    alert(data.message || "Registration failed.");

                }

            } catch (error) {

                console.error("Registration error:", error);

                alert("Unable to connect to Benue Data Hub server.");

            }

        });

    }


    // ========================================
    // LOGIN
    // ========================================

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            console.log("LOGIN FORM SUBMITTED");

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            try {

                const response = await fetch("/api/auth/login", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })

                });

                const data = await response.json();

                if (response.ok) {

                    alert("Login successful!");

                    localStorage.setItem("token", data.token);

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                    window.location.href = "dashboard.html";

                } else {

                    alert(data.message || "Login failed.");

                }

            } catch (error) {

                console.error("Login error:", error);

                alert("Unable to connect to Benue Data Hub server.");

            }

        });

    }


    // ========================================
    // DASHBOARD
    // ========================================

    const dashboard =
        document.getElementById("welcomeMessage");

    if (dashboard) {

        const token =
            localStorage.getItem("token");

        const savedUser =
            localStorage.getItem("user");


        // Check if user is logged in
        if (!token || !savedUser) {

            alert("Please login to access your dashboard.");

            window.location.href = "login.html";

            return;

        }


        try {

            const user =
                JSON.parse(savedUser);


            // Display user information
            const userName =
                document.getElementById("userName");

            const userEmail =
                document.getElementById("userEmail");

            const userPhone =
                document.getElementById("userPhone");

            const walletBalance =
                document.getElementById("walletBalance");

            const welcomeMessage =
                document.getElementById("welcomeMessage");


            if (userName) {

                userName.textContent =
                    user.name || "User";

            }


            if (userEmail) {

                userEmail.textContent =
                    user.email || "Not available";

            }


            if (userPhone) {

                userPhone.textContent =
                    user.phone || "Not available";

            }


            if (walletBalance) {

    walletBalance.textContent =
        Number(user.walletBalance || 0).toFixed(2);

    // Get the latest wallet balance from the backend
    fetch("/api/wallet/balance", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {

        console.log(
            "WALLET BALANCE:",
            data
        );

        if (
            data.success &&
            data.walletBalance !== undefined
        ) {

            walletBalance.textContent =
                Number(data.walletBalance).toFixed(2);

            // Keep local storage synchronized
            user.walletBalance =
                data.walletBalance;

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );
        }

    })
    .catch(error => {

        console.error(
            "Wallet balance error:",
            error
        );

    });

}


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    `Welcome, ${user.name || "User"}`;

            }

        } catch (error) {

            console.error("User data error:", error);

            localStorage.removeItem("user");
            localStorage.removeItem("token");

            window.location.href = "login.html";

        }

    }


    // ========================================
    // LOGOUT
    // ========================================

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert("You have been logged out.");

            window.location.href = "login.html";

        });

    }


    // ========================================
    // FUND WALLET
    // ========================================

    const fundWalletForm =
        document.getElementById("fundWalletForm");

    if (fundWalletForm) {

        fundWalletForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const token =
                    localStorage.getItem("token");


                if (!token) {

                    alert("Please login first.");

                    window.location.href = "login.html";

                    return;

                }


                const amount =
                    Number(
                        document
                            .getElementById("fundAmount")
                            .value
                    );


                const fundButton =
                    document.getElementById("fundWalletBtn");

                const result =
                    document.getElementById("fundWalletResult");


                if (!Number.isFinite(amount) || amount < 100) {

                    result.innerHTML = `
                        <p>
                            Please enter a valid amount of at least ₦100.
                        </p>
                    `;

                    return;

                }


                fundButton.disabled = true;
                fundButton.textContent = "Preparing Payment...";


                result.innerHTML = `
                    <p>
                        Connecting to payment gateway...
                    </p>
                `;


                try {

                    const response =
                        await fetch(
                            "/api/wallet/fund",
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body: JSON.stringify({
                                    amount
                                })

                            }
                        );


                    const data =
                        await response.json();


                    console.log(
                        "WALLET FUNDING RESPONSE:",
                        data
                    );


                    if (
                        response.ok &&
                        data.success &&
                        data.authorization_url
                    ) {

                        result.innerHTML = `
                            <p>
                                Redirecting to secure payment...
                            </p>
                        `;


                        window.location.href =
                            data.authorization_url;

                    } else {

                        result.innerHTML = `
                            <p>
                                <strong>
                                    Wallet funding could not be started.
                                </strong>
                            </p>

                            <p>
                                ${
                                    data.message ||
                                    "Unable to initialize payment."
                                }
                            </p>
                        `;

                    }

                } catch (error) {

                    console.error(
                        "Wallet funding error:",
                        error
                    );


                    result.innerHTML = `
                        <p>
                            Unable to connect to
                            Benue Data Hub server.
                        </p>
                    `;

                } finally {

                    fundButton.disabled = false;

                    fundButton.textContent =
                        "Fund Wallet";

                }

            }
        );

    }


    // ========================================
    // BUY AIRTIME
    // ========================================

    const airtimeForm =
        document.getElementById("airtimeForm");

    if (airtimeForm) {

        airtimeForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const token =
                    localStorage.getItem("token");


                if (!token) {

                    alert("Please login first.");

                    window.location.href = "login.html";

                    return;

                }


                const service = "airtime";

                const serviceID =
                    document
                        .getElementById("network")
                        .value;

                const phone =
                    document
                        .getElementById("airtimePhone")
                        .value
                        .trim();

                const amount =
                    Number(
                        document
                            .getElementById("airtimeAmount")
                            .value
                    );


                if (!serviceID || !phone || !amount) {

                    alert(
                        "Please complete all airtime fields."
                    );

                    return;

                }


                // Generate unique request ID
                const requestId =
                    "BDH-" +
                    Date.now() +
                    "-" +
                    Math.floor(
                        Math.random() * 1000
                    );


                const buyButton =
                    document.getElementById(
                        "buyAirtimeBtn"
                    );

                const result =
                    document.getElementById(
                        "airtimeResult"
                    );


                buyButton.disabled = true;

                buyButton.textContent =
                    "Processing...";


                result.innerHTML =
                    "<p>Processing your airtime purchase...</p>";


                try {

                    const response =
                        await fetch(
                            "/api/transactions/create",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`

                                },

                                body: JSON.stringify({

                                    service,
                                    serviceID,
                                    phone,
                                    amount,
                                    requestId

                                })

                            }
                        );


                    const data =
                        await response.json();


                    console.log(
                        "AIRTIME PURCHASE RESPONSE:",
                        data
                    );


                    if (
                        response.ok &&
                        data.success
                    ) {

                        result.innerHTML = `

                            <p>
                                <strong>
                                    Airtime purchase successful!
                                </strong>
                            </p>

                            <p>
                                Network:
                                ${serviceID.toUpperCase()}
                            </p>

                            <p>
                                Phone:
                                ${phone}
                            </p>

                            <p>
                                Amount:
                                ₦${amount}
                            </p>

                            <p>
                                Transaction ID:
                                ${
                                    data.data?.transactionId ||
                                    "Processing"
                                }
                            </p>

                        `;


                        airtimeForm.reset();


                        // Refresh saved wallet balance
                        if (data.data?.walletBalance !== undefined) {

                            const walletBalance =
                                document.getElementById(
                                    "walletBalance"
                                );

                            if (walletBalance) {

                                walletBalance.textContent =
                                    Number(
                                        data.data.walletBalance
                                    ).toFixed(2);

                            }


                            const savedUser =
                                localStorage.getItem("user");

                            if (savedUser) {

                                const user =
                                    JSON.parse(savedUser);

                                user.walletBalance =
                                    data.data.walletBalance;

                                localStorage.setItem(
                                    "user",
                                    JSON.stringify(user)
                                );

                            }

                        }

                    } else {

                        result.innerHTML = `

                            <p>
                                <strong>
                                    Airtime purchase failed.
                                </strong>
                            </p>

                            <p>
                                ${
                                    data.message ||
                                    "Transaction failed."
                                }
                            </p>

                        `;

                    }

                } catch (error) {

                    console.error(
                        "Airtime purchase error:",
                        error
                    );


                    result.innerHTML = `

                        <p>
                            Unable to connect to
                            Benue Data Hub server.
                        </p>

                    `;

                } finally {

                    buyButton.disabled = false;

                    buyButton.textContent =
                        "Buy Airtime";

                }

            }
        );

    }


    // ========================================
    // TRANSACTION HISTORY
    // ========================================

    const transactionHistory =
        document.getElementById(
            "transactionHistory"
        );


    if (transactionHistory) {

        const token =
            localStorage.getItem("token");


        if (!token) {
            return;
        }


        fetch(
            "/api/transactions/my-transactions",
            {

                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }

            }
        )
        .then(response => response.json())
        .then(data => {

            console.log(
                "TRANSACTION HISTORY:",
                data
            );


            if (
                !data.success ||
                !data.data ||
                data.data.length === 0
            ) {

                transactionHistory.innerHTML =
                    "<p>No transactions yet.</p>";

                return;

            }


            transactionHistory.innerHTML =
                data.data.map(
                    transaction => {

                        return `

                            <div class="transaction-item">

                                <p>
                                    <strong>
                                        ${
                                            transaction.serviceID
                                                .toUpperCase()
                                        }
                                    </strong>
                                </p>

                                <p>
                                    ₦${transaction.amount}
                                    →
                                    ${transaction.phone}
                                </p>

                                <p>
                                    Status:
                                    ${transaction.status}
                                </p>

                                <p>
                                    Request ID:
                                    ${transaction.requestId}
                                </p>

                            </div>

                        `;

                    }
                ).join("");

        })
        .catch(error => {

            console.error(
                "Transaction history error:",
                error
            );


            transactionHistory.innerHTML =
                "<p>Unable to load transaction history.</p>";

        });

    }

});
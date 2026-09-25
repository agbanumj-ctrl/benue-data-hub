const API_BASE_URL = "https://benue-data-hub.onrender.com";


// =========================================================
// GLOBAL HELPERS
// =========================================================

function getToken() {
    return localStorage.getItem("token");
}


function getSavedUser() {

    const savedUser =
        localStorage.getItem("user");

    if (!savedUser) {
        return null;
    }

    try {

        return JSON.parse(savedUser);

    } catch (error) {

        console.error(
            "Saved user data is invalid:",
            error
        );

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        return null;
    }
}


function saveUser(user) {

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );
}


function clearSession() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
}


function redirectToLogin() {

    window.location.href =
        "login.html";
}


function getCurrentPage() {

    return window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatCurrency(amount) {

    return `₦${Number(
        amount || 0
    ).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


function showResult(
    element,
    message,
    type = ""
) {

    if (!element) {
        return;
    }

    element.innerHTML = `
        <p class="${type}-message">
            ${escapeHTML(message)}
        </p>
    `;
}


function updateWalletDisplay(balance) {

    const formattedBalance =
        Number(balance || 0).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    const walletBalance =
        document.getElementById(
            "walletBalance"
        );

    const sidebarWalletBalance =
        document.getElementById(
            "sidebarWalletBalance"
        );

    if (walletBalance) {

        walletBalance.textContent =
            formattedBalance;
    }

    if (sidebarWalletBalance) {

        sidebarWalletBalance.textContent =
            formattedBalance;
    }
}


function updateAccountInitial(name) {

    const accountInitial =
        document.getElementById(
            "accountInitial"
        );

    if (!accountInitial) {
        return;
    }

    const cleanName =
        String(name || "User").trim();

    accountInitial.textContent =
        cleanName
            .charAt(0)
            .toUpperCase();
}


function saveWalletBalance(balance) {

    const user =
        getSavedUser();

    if (!user) {
        return;
    }

    user.walletBalance =
        Number(balance || 0);

    saveUser(user);
}


// =========================================================
// VTPASS REQUEST ID
// =========================================================

function generateRequestId() {

    const now =
        new Date();

    const lagosTime =
        new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone: "Africa/Lagos",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23"
            }
        ).formatToParts(now);

    const getPart = (type) => {

        const part =
            lagosTime.find(
                item =>
                    item.type === type
            );

        return part
            ? part.value
            : "";
    };

    return (
        getPart("year") +
        getPart("month") +
        getPart("day") +
        getPart("hour") +
        getPart("minute") +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


// =========================================================
// AUTHENTICATION / PAGE PROTECTION
// =========================================================

function protectCurrentPage() {

    const currentPage =
        getCurrentPage();

    const token =
        getToken();

    const savedUser =
        getSavedUser();

    const protectedPages = [
        "dashboard.html",
        "vendor-dashboard.html",
        "admin-dashboard.html"
    ];

    if (
        protectedPages.includes(
            currentPage
        )
    ) {

        if (!token || !savedUser) {

            alert(
                "Please login to access your dashboard."
            );

            redirectToLogin();

            return false;
        }
    }


    if (
        currentPage ===
        "vendor-dashboard.html"
    ) {

        if (
            savedUser.role !==
            "vendor"
        ) {

            alert(
                "Vendor access is required for this dashboard."
            );

            window.location.href =
                "dashboard.html";

            return false;
        }
    }


    if (
        currentPage ===
        "admin-dashboard.html"
    ) {

        if (
            savedUser.role !==
            "admin"
        ) {

            alert(
                "Administrator access is required for this dashboard."
            );

            window.location.href =
                "dashboard.html";

            return false;
        }
    }

    return true;
}


// =========================================================
// REGISTER
// =========================================================

function setupRegistration() {

    const registerForm =
        document.getElementById(
            "registerForm"
        );

    if (!registerForm) {
        return;
    }

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const name =
                document
                    .getElementById("name")
                    ?.value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    ?.value
                    .trim();

            const phone =
                document
                    .getElementById("phone")
                    ?.value
                    .trim();

            const accountType =
                document
                    .getElementById("accountType")
                    ?.value ||
                "user";

            const password =
                document
                    .getElementById("password")
                    ?.value;

            const confirmPassword =
                document
                    .getElementById(
                        "confirmPassword"
                    )
                    ?.value;


            if (
                !name ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword
            ) {

                alert(
                    "Please fill in all required fields."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            if (
                password.length < 6
            ) {

                alert(
                    "Password must be at least 6 characters."
                );

                return;
            }


            if (
                !["user", "vendor"]
                    .includes(accountType)
            ) {

                alert(
                    "Invalid account type."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    name,
                                    email,
                                    phone,
                                    password,
                                    role:
                                        accountType
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    alert(
                        data.message ||
                        "Registration failed."
                    );

                    return;
                }


                alert(
                    accountType === "vendor"
                        ? "Vendor account created successfully. Please login."
                        : "Account created successfully. Please login."
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        }
    );
}


// =========================================================
// LOGIN
// =========================================================

function setupLogin() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const emailInput =
                document.getElementById(
                    "email"
                );

            const passwordInput =
                document.getElementById(
                    "password"
                );


            if (
                !emailInput ||
                !passwordInput
            ) {

                alert(
                    "Login form is incomplete."
                );

                return;
            }


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (
                !email ||
                !password
            ) {

                alert(
                    "Please enter your email and password."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email,
                                    password
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    response.ok &&
                    data.success &&
                    data.token &&
                    data.user
                ) {

                    const user =
                        data.user;


                    localStorage.setItem(
                        "token",
                        data.token
                    );

                    saveUser(user);


                    const role =
                        String(
                            user.role ||
                            "user"
                        )
                            .toLowerCase()
                            .trim();


                    alert(
                        "Login successful!"
                    );


                    if (
                        role ===
                        "admin"
                    ) {

                        window.location.href =
                            "admin-dashboard.html";

                    } else if (
                        role ===
                        "vendor"
                    ) {

                        window.location.href =
                            "vendor-dashboard.html";

                    } else {

                        window.location.href =
                            "dashboard.html";
                    }


                } else {

                    alert(
                        data.message ||
                        "Login failed."
                    );
                }


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "Unable to connect to Benue Data Hub server."
                );
            }
        }
    );
}


// =========================================================
// LOGOUT
// =========================================================

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener(
        "click",
        () => {

            clearSession();

            alert(
                "You have been logged out."
            );

            redirectToLogin();
        }
    );
}


// =========================================================
// CUSTOMER DASHBOARD
// =========================================================

async function loadCustomerDashboard() {

    if (
        getCurrentPage() !==
        "dashboard.html"
    ) {
        return;
    }

    const user =
        getSavedUser();

    const token =
        getToken();


    if (
        !user ||
        !token
    ) {

        redirectToLogin();

        return;
    }


    const welcomeMessage =
        document.getElementById(
            "welcomeMessage"
        );


    const userName =
        document.getElementById(
            "userName"
        );

    const userEmail =
        document.getElementById(
            "userEmail"
        );

    const userPhone =
        document.getElementById(
            "userPhone"
        );


    if (userName) {

        userName.textContent =
            user.name ||
            "User";
    }


    if (userEmail) {

        userEmail.textContent =
            user.email ||
            "Not available";
    }


    if (userPhone) {

        userPhone.textContent =
            user.phone ||
            "Not available";
    }


    if (welcomeMessage) {

        welcomeMessage.textContent =
            `Welcome, ${user.name || "User"}`;
    }


    updateAccountInitial(
        user.name
    );


    updateWalletDisplay(
        user.walletBalance || 0
    );


    // -----------------------------------------
    // GET LATEST WALLET BALANCE
    // -----------------------------------------

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/wallet/balance`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            response.ok &&
            data.success &&
            data.walletBalance !==
                undefined
        ) {

            updateWalletDisplay(
                data.walletBalance
            );

            saveWalletBalance(
                data.walletBalance
            );
        }


    } catch (error) {

        console.error(
            "Wallet balance error:",
            error
        );
    }
}


// =========================================================
// FUND WALLET
// =========================================================

function setupWalletFunding() {

    const fundWalletForm =
        document.getElementById(
            "fundWalletForm"
        );

    if (!fundWalletForm) {
        return;
    }


    fundWalletForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const token =
                getToken();


            if (!token) {

                alert(
                    "Please login first."
                );

                redirectToLogin();

                return;
            }


            const amountInput =
                document.getElementById(
                    "fundAmount"
                );

            const fundButton =
                document.getElementById(
                    "fundWalletBtn"
                );

            const result =
                document.getElementById(
                    "fundWalletResult"
                );


            if (!amountInput) {
                return;
            }


            const amount =
                Number(
                    amountInput.value
                );


            if (
                !Number.isFinite(amount) ||
                amount < 100
            ) {

                showResult(
                    result,
                    "Please enter a valid amount of at least ₦100.",
                    "error"
                );

                return;
            }


            if (fundButton) {

                fundButton.disabled =
                    true;

                fundButton.textContent =
                    "Preparing Payment...";
            }


            if (result) {

                result.innerHTML =
                    "<p>Connecting to payment gateway...</p>";
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/wallet/fund`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    amount
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    response.ok &&
                    data.success &&
                    data.authorization_url
                ) {

                    if (result) {

                        result.innerHTML = `
                            <p class="success-message">
                                Redirecting to secure payment...
                            </p>
                        `;
                    }


                    window.location.href =
                        data.authorization_url;


                    return;
                }


                if (result) {

                    result.innerHTML = `
                        <p class="error-message">
                            <strong>
                                Wallet funding could not be started.
                            </strong>
                        </p>

                        <p>
                            ${escapeHTML(
                                data.message ||
                                "Unable to initialize payment."
                            )}
                        </p>
                    `;
                }


            } catch (error) {

                console.error(
                    "Wallet funding error:",
                    error
                );


                if (result) {

                    result.innerHTML = `
                        <p class="error-message">
                            Unable to connect to Benue Data Hub server.
                        </p>
                    `;
                }


            } finally {

                if (fundButton) {

                    fundButton.disabled =
                        false;

                    fundButton.textContent =
                        "Fund Wallet";
                }
            }
        }
    );
}


// =========================================================
// BUY AIRTIME
// =========================================================

function setupAirtimePurchase() {

    const airtimeForm =
        document.getElementById(
            "airtimeForm"
        );

    if (!airtimeForm) {
        return;
    }


    airtimeForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const token =
                getToken();


            if (!token) {

                alert(
                    "Please login first."
                );

                redirectToLogin();

                return;
            }


            const networkInput =
                document.getElementById(
                    "network"
                );

            const phoneInput =
                document.getElementById(
                    "airtimePhone"
                );

            const amountInput =
                document.getElementById(
                    "airtimeAmount"
                );

            const buyButton =
                document.getElementById(
                    "buyAirtimeBtn"
                );

            const result =
                document.getElementById(
                    "airtimeResult"
                );


            if (
                !networkInput ||
                !phoneInput ||
                !amountInput
            ) {

                alert(
                    "Airtime form is incomplete."
                );

                return;
            }


            const service =
                "airtime";

            const serviceID =
                networkInput.value
                    .trim();

            const phone =
                phoneInput.value
                    .trim();

            const amount =
                Number(
                    amountInput.value
                );


            if (
                !serviceID ||
                !phone ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                alert(
                    "Please complete all airtime fields."
                );

                return;
            }


            const requestId =
                generateRequestId();


            console.log(
                "VTPASS REQUEST ID:",
                requestId
            );


            if (buyButton) {

                buyButton.disabled =
                    true;

                buyButton.textContent =
                    "Processing...";
            }


            if (result) {

                result.innerHTML =
                    "<p>Processing your airtime purchase...</p>";
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/transactions/create`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
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

                    if (result) {

                        result.innerHTML = `

                            <div class="success-message">

                                <p>
                                    <strong>
                                        Airtime purchase successful!
                                    </strong>
                                </p>

                                <p>
                                    Network:
                                    ${escapeHTML(
                                        serviceID.toUpperCase()
                                    )}
                                </p>

                                <p>
                                    Phone:
                                    ${escapeHTML(phone)}
                                </p>

                                <p>
                                    Amount:
                                    ${formatCurrency(amount)}
                                </p>

                                <p>
                                    Transaction ID:
                                    ${escapeHTML(
                                        data.data?.transactionId ||
                                        "Processing"
                                    )}
                                </p>

                            </div>
                        `;
                    }


                    airtimeForm.reset();


                    if (
                        data.walletBalance !==
                        undefined
                    ) {

                        updateWalletDisplay(
                            data.walletBalance
                        );

                        saveWalletBalance(
                            data.walletBalance
                        );
                    }


                    await loadTransactionHistory();


                } else {

                    if (result) {

                        result.innerHTML = `

                            <div class="error-message">

                                <p>
                                    <strong>
                                        Airtime purchase failed.
                                    </strong>
                                </p>

                                <p>
                                    ${escapeHTML(
                                        data.message ||
                                        "Transaction failed."
                                    )}
                                </p>

                            </div>
                        `;
                    }
                }


            } catch (error) {

                console.error(
                    "Airtime purchase error:",
                    error
                );


                if (result) {

                    result.innerHTML = `

                        <p class="error-message">
                            Unable to connect to
                            Benue Data Hub server.
                        </p>
                    `;
                }


            } finally {

                if (buyButton) {

                    buyButton.disabled =
                        false;

                    buyButton.textContent =
                        "Buy Airtime";
                }
            }
        }
    );
}
function setupDataPurchase() {

    const dataForm =
        document.getElementById("dataForm");

    if (!dataForm) {
        return;
    }

    const networkInput =
        document.getElementById("dataNetwork");

    const planInput =
        document.getElementById("dataPlan");

    const phoneInput =
        document.getElementById("dataPhone");

    const amountInput =
        document.getElementById("dataAmount");

    const buyButton =
        document.getElementById("buyDataBtn");

    const result =
        document.getElementById("dataResult");


    // ==========================================
    // LOAD DATA PLANS WHEN NETWORK CHANGES
    // ==========================================

    networkInput.addEventListener(
        "change",
        async () => {

            const serviceID =
                networkInput.value.trim();

            planInput.innerHTML =
                '<option value="">Loading data plans...</option>';

            planInput.disabled = true;

            amountInput.value = "";

            if (!serviceID) {

                planInput.innerHTML =
                    '<option value="">Select network first</option>';

                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/vtpass/data-variations/${encodeURIComponent(serviceID)}`
                    );


                const data =
                    await response.json();


                console.log(
                    "DATA VARIATIONS RESPONSE:",
                    data
                );


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to load data plans."
                    );
                }


                const variations =
                    data.data?.content?.variations ||
                    data.data?.variations ||
                    [];


                if (!Array.isArray(variations) ||
                    variations.length === 0) {

                    planInput.innerHTML =
                        '<option value="">No data plans available</option>';

                    return;
                }


                planInput.innerHTML =
                    '<option value="">Select Data Plan</option>';


                variations.forEach(
                    (plan) => {

                        const option =
                            document.createElement("option");


                        option.value =
                            plan.variation_code || "";


                        const amount =
                            Number(
                                plan.variation_amount
                            );


                        const readableAmount =
                            Number.isFinite(amount)
                                ? formatCurrency(amount)
                                : "";


                        option.textContent =
                            plan.name
                                ? `${plan.name}${readableAmount ? ` — ${readableAmount}` : ""}`
                                : `${plan.variation_code}${readableAmount ? ` — ${readableAmount}` : ""}`;


                        option.dataset.amount =
                            Number.isFinite(amount)
                                ? amount
                                : "";


                        planInput.appendChild(
                            option
                        );
                    }
                );


                planInput.disabled =
                    false;


            } catch (error) {

                console.error(
                    "Data plans error:",
                    error
                );


                planInput.innerHTML =
                    '<option value="">Unable to load data plans</option>';

                amountInput.value = "";


                if (result) {

                    result.innerHTML = `

                        <div class="error-message">

                            <p>
                                ${escapeHTML(
                                    error.message ||
                                    "Unable to load data plans."
                                )}
                            </p>

                        </div>
                    `;
                }
            }
        }
    );


    // ==========================================
    // SET AMOUNT WHEN PLAN IS SELECTED
    // ==========================================

    planInput.addEventListener(
        "change",
        () => {

            const selectedOption =
                planInput.options[
                    planInput.selectedIndex
                ];


            if (!selectedOption) {

                amountInput.value = "";

                return;
            }


            const amount =
                Number(
                    selectedOption.dataset.amount
                );


            if (
                Number.isFinite(amount) &&
                amount > 0
            ) {

                amountInput.value =
                    amount;

            } else {

                amountInput.value = "";
            }
        }
    );


    // ==========================================
    // BUY DATA
    // ==========================================

    dataForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const token =
                getToken();


            if (!token) {

                alert(
                    "Please login first."
                );

                redirectToLogin();

                return;
            }


            const serviceID =
                networkInput.value.trim();


            const variationCode =
                planInput.value.trim();


            const phone =
                phoneInput.value.trim();


            const amount =
                Number(
                    amountInput.value
                );


            if (
                !serviceID ||
                !variationCode ||
                !phone ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                if (result) {

                    result.innerHTML = `

                        <div class="error-message">

                            <p>
                                Please select a network,
                                data plan and enter a valid
                                phone number.
                            </p>

                        </div>
                    `;
                }

                return;
            }


            const requestId =
                generateRequestId();


            if (buyButton) {

                buyButton.disabled =
                    true;

                buyButton.textContent =
                    "Processing...";
            }


            if (result) {

                result.innerHTML = `

                    <div>

                        <p>
                            Processing your data purchase...
                        </p>

                    </div>
                `;
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/vtpass/buy-data`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    serviceID,
                                    variation_code:
                                        variationCode,
                                    amount,
                                    phone,
                                    request_id:
                                        requestId
                                })
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "DATA PURCHASE RESPONSE:",
                    data
                );


                if (
                    response.ok &&
                    data.success
                ) {

                    if (result) {

                        result.innerHTML = `

                            <div class="success-message">

                                <p>
                                    <strong>
                                        Data purchase successful!
                                    </strong>
                                </p>

                                <p>
                                    Network:
                                    ${escapeHTML(
                                        serviceID
                                            .replace("-data", "")
                                            .toUpperCase()
                                    )}
                                </p>

                                <p>
                                    Phone:
                                    ${escapeHTML(phone)}
                                </p>

                                <p>
                                    Amount:
                                    ${formatCurrency(amount)}
                                </p>

                                <p>
                                    Transaction ID:
                                    ${escapeHTML(
                                        data.transaction
                                            ?.transactionId ||
                                        data.data
                                            ?.content
                                            ?.transactions
                                            ?.transactionId ||
                                        "Processing"
                                    )}
                                </p>

                            </div>
                        `;
                    }


                    dataForm.reset();

                    planInput.innerHTML =
                        '<option value="">Select network first</option>';

                    planInput.disabled =
                        true;

                    amountInput.value = "";


                    if (
                        data.walletBalance !==
                        undefined
                    ) {

                        updateWalletDisplay(
                            data.walletBalance
                        );

                        saveWalletBalance(
                            data.walletBalance
                        );
                    }


                    await loadTransactionHistory();


                } else {

                    if (result) {

                        result.innerHTML = `

                            <div class="error-message">

                                <p>
                                    <strong>
                                        Data purchase failed.
                                    </strong>
                                </p>

                                <p>
                                    ${escapeHTML(
                                        data.message ||
                                        "Transaction failed."
                                    )}
                                </p>

                            </div>
                        `;
                    }
                }


            } catch (error) {

                console.error(
                    "Data purchase error:",
                    error
                );


                if (result) {

                    result.innerHTML = `

                        <p class="error-message">
                            Unable to connect to
                            Benue Data Hub server.
                        </p>
                    `;
                }


            } finally {

                if (buyButton) {

                    buyButton.disabled =
                        false;

                    buyButton.textContent =
                        "Buy Data";
                }
            }
        }
    );
}


// =========================================================
// CUSTOMER TRANSACTION HISTORY
// =========================================================

async function loadTransactionHistory() {

    const transactionHistory =
        document.getElementById(
            "transactionHistory"
        );


    if (!transactionHistory) {
        return;
    }


    const token =
        getToken();


    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/transactions/my-transactions`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !Array.isArray(data.data) ||
            data.data.length === 0
        ) {

            transactionHistory.innerHTML =
                "<p>No transactions yet.</p>";

            return;
        }


        transactionHistory.innerHTML =
            data.data
                .map(
                    transaction => {

                        const serviceName =
                            String(
                                transaction.serviceID ||
                                transaction.service ||
                                "Service"
                            )
                                .toUpperCase();


                        const status =
                            String(
                                transaction.status ||
                                "pending"
                            )
                                .toLowerCase();


                        let statusClass =
                            "transaction-status";


                        if (
                            status ===
                                "successful" ||
                            status ===
                                "success"
                        ) {

                            statusClass +=
                                " status-success";

                        } else if (
                            status ===
                                "failed" ||
                            status ===
                                "reversed" ||
                            status ===
                                "cancelled"
                        ) {

                            statusClass +=
                                " status-failed";

                        } else {

                            statusClass +=
                                " status-pending";
                        }


                        return `

                            <div class="transaction-row">

                                <div class="transaction-info">

                                    <strong>
                                        ${escapeHTML(
                                            serviceName
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            transaction.phone ||
                                            "No phone number"
                                        )}
                                    </span>

                                    <span>
                                        Request:
                                        ${escapeHTML(
                                            transaction.requestId ||
                                            "N/A"
                                        )}
                                    </span>

                                </div>

                                <div class="transaction-summary">

                                    <strong class="transaction-amount">
                                        ${formatCurrency(
                                            transaction.amount
                                        )}
                                    </strong>

                                    <span class="${statusClass}">
                                        ${escapeHTML(status)}
                                    </span>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Transaction history error:",
            error
        );


        transactionHistory.innerHTML =
            "<p>Unable to load transaction history.</p>";
    }
}


// =========================================================
// VENDOR DASHBOARD
// =========================================================

async function loadVendorDashboard() {

    if (
        getCurrentPage() !==
        "vendor-dashboard.html"
    ) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/vendor/dashboard`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Vendor dashboard error:",
                data.message
            );

            return;
        }


        const user =
            data.user || {};

        const stats =
            data.statistics || {};

        const transactions =
            Array.isArray(
                data.transactions
            )
                ? data.transactions
                : [];


        const welcomeMessage =
            document.getElementById(
                "welcomeMessage"
            );

        const walletBalance =
            document.getElementById(
                "walletBalance"
            );

        const sidebarWalletBalance =
            document.getElementById(
                "sidebarWalletBalance"
            );

        const userName =
            document.getElementById(
                "userName"
            );

        const userEmail =
            document.getElementById(
                "userEmail"
            );

        const userPhone =
            document.getElementById(
                "userPhone"
            );

        const totalSales =
            document.getElementById(
                "totalSales"
            );

        const totalCommission =
            document.getElementById(
                "totalCommission"
            );

        const customerCount =
            document.getElementById(
                "customerCount"
            );


        if (welcomeMessage) {

            welcomeMessage.textContent =
                `Welcome back, ${
                    user.name || "Vendor"
                }`;
        }


        if (walletBalance) {

            walletBalance.textContent =
                formatCurrency(
                    user.walletBalance
                );
        }


        if (sidebarWalletBalance) {

            sidebarWalletBalance.textContent =
                formatCurrency(
                    user.walletBalance
                );
        }


        if (userName) {

            userName.textContent =
                user.name || "-";
        }


        if (userEmail) {

            userEmail.textContent =
                user.email || "-";
        }


        if (userPhone) {

            userPhone.textContent =
                user.phone || "-";
        }


        if (totalSales) {

            totalSales.textContent =
                formatCurrency(
                    stats.totalSales
                );
        }


        if (totalCommission) {

            totalCommission.textContent =
                formatCurrency(
                    stats.totalCommission
                );
        }


        if (customerCount) {

            customerCount.textContent =
                Number(
                    stats.customerCount || 0
                ).toLocaleString();
        }


        const transactionHistory =
            document.getElementById(
                "transactionHistory"
            );


        if (transactionHistory) {

            if (!transactions.length) {

                transactionHistory.innerHTML =
                    "<p>No transactions yet.</p>";

            } else {

                transactionHistory.innerHTML =
                    transactions
                        .map(
                            transaction => `

                                <div class="transaction-item">

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                transaction.serviceID ||
                                                transaction.service ||
                                                "Service"
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHTML(
                                                transaction.phone ||
                                                ""
                                            )}
                                        </small>

                                    </div>

                                    <div>

                                        <strong>
                                            ${formatCurrency(
                                                transaction.amount
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHTML(
                                                transaction.status ||
                                                "pending"
                                            )}
                                        </small>

                                    </div>

                                </div>
                            `
                        )
                        .join("");
            }
        }


    } catch (error) {

        console.error(
            "Unable to load vendor dashboard:",
            error
        );
    }
}


// =========================================================
// ADMIN DASHBOARD
// =========================================================

async function loadAdminDashboard() {

    if (
        getCurrentPage() !==
        "admin-dashboard.html"
    ) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/dashboard`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Admin dashboard error:",
                data.message
            );

            return;
        }


        const stats =
            data.statistics || {};


        const fields = {

            totalUsers:
                stats.totalUsers,

            totalVendors:
                stats.totalVendors,

            totalTransactions:
                stats.totalTransactions,

            activeAccounts:
                stats.activeAccounts,

            successfulTransactions:
                stats.successfulTransactions,

            failedTransactions:
                stats.failedTransactions
        };


        Object.entries(fields)
            .forEach(
                ([id, value]) => {

                    const element =
                        document.getElementById(
                            id
                        );


                    if (element) {

                        element.textContent =
                            Number(
                                value || 0
                            ).toLocaleString();
                    }
                }
            );


        const totalWalletFunding =
            document.getElementById(
                "totalWalletFunding"
            );


        if (totalWalletFunding) {

            totalWalletFunding.textContent =
                formatCurrency(
                    stats.totalWalletFunding
                );
        }


    } catch (error) {

        console.error(
            "Unable to load admin dashboard:",
            error
        );
    }
}


// =========================================================
// ADMIN TRANSACTIONS
// =========================================================

async function loadAdminTransactions() {

    if (
        getCurrentPage() !==
        "admin-dashboard.html"
    ) {
        return;
    }


    const token =
        getToken();


    if (!token) {
        return;
    }


    const container =
        document.getElementById(
            "adminTransactionHistory"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "<p>Loading transactions...</p>";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/transactions`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            container.innerHTML =
                `<p>${escapeHTML(
                    data.message ||
                    "Unable to load transactions."
                )}</p>`;

            return;
        }


        const transactions =
            Array.isArray(
                data.transactions
            )
                ? data.transactions
                : [];


        if (!transactions.length) {

            container.innerHTML =
                "<p>No transactions found.</p>";

            return;
        }


        container.innerHTML =
            transactions
                .map(
                    transaction => {

                        const userName =
                            transaction.user?.name ||
                            "Unknown user";


                        return `

                            <div class="transaction-item">

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            transaction.serviceID ||
                                            transaction.service ||
                                            "Service"
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            userName
                                        )}
                                    </small>

                                    <small>
                                        ${escapeHTML(
                                            transaction.phone ||
                                            ""
                                        )}
                                    </small>

                                </div>

                                <div>

                                    <strong>
                                        ${formatCurrency(
                                            transaction.amount
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            transaction.status ||
                                            "pending"
                                        )}
                                    </small>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Admin transaction error:",
            error
        );


        container.innerHTML =
            "<p>Unable to load transactions.</p>";
    }
}


// =========================================================
// ADMIN USER MANAGEMENT
// =========================================================

async function loadAdminUsers() {

    const container =
        document.getElementById(
            "usersResult"
        );


    if (!container) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    container.innerHTML =
        "<p>Loading customer accounts...</p>";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/users`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            container.innerHTML =
                `<p>${escapeHTML(
                    data.message ||
                    "Unable to load users."
                )}</p>`;

            return;
        }


        const users =
            Array.isArray(data.users)
                ? data.users
                : [];


        if (!users.length) {

            container.innerHTML =
                "<p>No customer accounts found.</p>";

            return;
        }


        container.innerHTML =
            users
                .map(
                    user => `

                        <div class="transaction-item">

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        user.name ||
                                        "User"
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        user.email ||
                                        ""
                                    )}
                                </small>

                                <small>
                                    ${escapeHTML(
                                        user.phone ||
                                        ""
                                    )}
                                </small>

                                <small>
                                    Wallet:
                                    ${formatCurrency(
                                        user.walletBalance
                                    )}
                                </small>

                            </div>

                            <div>

                                <small>
                                    Status:
                                    ${
                                        user.isActive
                                            ? "Active"
                                            : "Inactive"
                                    }
                                </small>

                                <small>
                                    Verification:
                                    ${
                                        user.isVerified
                                            ? "Verified"
                                            : "Not verified"
                                    }
                                </small>

                                <button
                                    type="button"
                                    class="secondary-btn admin-toggle-account"
                                    data-user-id="${escapeHTML(
                                        user._id
                                    )}"
                                    data-active="${
                                        user.isActive
                                    }"
                                >
                                    ${
                                        user.isActive
                                            ? "Deactivate"
                                            : "Activate"
                                    }
                                </button>

                            </div>

                        </div>
                    `
                )
                .join("");


        document
            .querySelectorAll(
                ".admin-toggle-account"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const userId =
                                button.dataset
                                    .userId;


                            const currentStatus =
                                button.dataset
                                    .active ===
                                "true";


                            updateAdminAccountStatus(
                                userId,
                                !currentStatus
                            );
                        }
                    );
                }
            );


    } catch (error) {

        console.error(
            "Admin users error:",
            error
        );


        container.innerHTML =
            "<p>Unable to connect to the server.</p>";
    }
}


// =========================================================
// ADMIN VENDOR MANAGEMENT
// =========================================================

async function loadAdminVendors() {

    const container =
        document.getElementById(
            "vendorsResult"
        );


    if (!container) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    container.innerHTML =
        "<p>Loading vendor accounts...</p>";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/vendors`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            container.innerHTML =
                `<p>${escapeHTML(
                    data.message ||
                    "Unable to load vendors."
                )}</p>`;

            return;
        }


        const vendors =
            Array.isArray(data.vendors)
                ? data.vendors
                : [];


        if (!vendors.length) {

            container.innerHTML =
                "<p>No vendor accounts found.</p>";

            return;
        }


        container.innerHTML =
            vendors
                .map(
                    vendor => {

                        const user =
                            vendor.user ||
                            {};


                        return `

                            <div class="transaction-item">

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            vendor.businessName ||
                                            user.name ||
                                            "Vendor"
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            user.email ||
                                            ""
                                        )}
                                    </small>

                                    <small>
                                        ${escapeHTML(
                                            user.phone ||
                                            ""
                                        )}
                                    </small>

                                    <small>
                                        Sales:
                                        ${formatCurrency(
                                            vendor.totalSales
                                        )}
                                    </small>

                                </div>

                                <div>

                                    <small>
                                        Account:
                                        ${
                                            user.isActive
                                                ? "Active"
                                                : "Inactive"
                                        }
                                    </small>

                                    <small>
                                        Approved:
                                        ${
                                            vendor.isApproved
                                                ? "Yes"
                                                : "Pending"
                                        }
                                    </small>

                                    <small>
                                        Verified:
                                        ${
                                            user.isVerified
                                                ? "Yes"
                                                : "No"
                                        }
                                    </small>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Admin vendors error:",
            error
        );


        container.innerHTML =
            "<p>Unable to connect to the server.</p>";
    }
}


// =========================================================
// ADMIN ACCOUNT STATUS
// =========================================================

async function updateAdminAccountStatus(
    userId,
    isActive
) {

    const token =
        getToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const action =
        isActive
            ? "activate"
            : "deactivate";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} this account?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/users/${userId}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            isActive
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to update account."
            );

            return;
        }


        alert(
            data.message ||
            "Account status updated."
        );


        await loadAdminUsers();

        await loadAdminDashboard();


    } catch (error) {

        console.error(
            "Account status error:",
            error
        );


        alert(
            "Unable to connect to the server."
        );
    }
}


// =========================================================
// ADMIN VERIFICATION
// =========================================================

async function updateAdminVerification(
    userId,
    isVerified
) {

    const token =
        getToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/users/${userId}/verification`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            isVerified
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to update verification."
            );

            return;
        }


        alert(
            data.message ||
            "Verification status updated."
        );


        await loadAdminUsers();


    } catch (error) {

        console.error(
            "Verification error:",
            error
        );


        alert(
            "Unable to connect to the server."
        );
    }
}


// =========================================================
// ADMIN BUTTONS
// =========================================================

function setupAdminButtons() {

    const refreshUsersBtn =
        document.getElementById(
            "refreshUsersBtn"
        );


    if (refreshUsersBtn) {

        refreshUsersBtn.addEventListener(
            "click",
            loadAdminUsers
        );
    }


    const refreshVendorsBtn =
        document.getElementById(
            "refreshVendorsBtn"
        );


    if (refreshVendorsBtn) {

        refreshVendorsBtn.addEventListener(
            "click",
            loadAdminVendors
        );
    }


    const manageUsersBtn =
        document.getElementById(
            "manageUsersBtn"
        );


    if (manageUsersBtn) {

        manageUsersBtn.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "userManagement"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });


                loadAdminUsers();
            }
        );
    }


    const manageVendorsBtn =
        document.getElementById(
            "manageVendorsBtn"
        );


    if (manageVendorsBtn) {

        manageVendorsBtn.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "vendorManagement"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });


                loadAdminVendors();
            }
        );
    }


    const manageAccountsBtn =
        document.getElementById(
            "manageAccountsBtn"
        );


    if (manageAccountsBtn) {

        manageAccountsBtn.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "userManagement"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });


                loadAdminUsers();
            }
        );
    }


    const refreshAdminTransactionsBtn =
        document.getElementById(
            "refreshAdminTransactionsBtn"
        );


    if (refreshAdminTransactionsBtn) {

        refreshAdminTransactionsBtn.addEventListener(
            "click",
            loadAdminTransactions
        );
    }
}


// =========================================================
// PAGE INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Benue Data Hub frontend loaded successfully."
        );


        // -----------------------------------------
        // PROTECT DASHBOARDS
        // -----------------------------------------

        if (!protectCurrentPage()) {
            return;
        }


        // -----------------------------------------
        // AUTH
        // -----------------------------------------

        setupRegistration();

        setupLogin();

        setupLogout();


        // -----------------------------------------
        // WALLET
        // -----------------------------------------

        setupWalletFunding();


        // -----------------------------------------
        // CUSTOMER AIRTIME
        // -----------------------------------------

        setupAirtimePurchase();

        setupDataPurchase();
        // -----------------------------------------
        // CUSTOMER DASHBOARD
        // -----------------------------------------

        await loadCustomerDashboard();


        if (
            getCurrentPage() ===
            "dashboard.html"
        ) {

            await loadTransactionHistory();
        }


        // -----------------------------------------
        // VENDOR DASHBOARD
        // -----------------------------------------

        if (
            getCurrentPage() ===
            "vendor-dashboard.html"
        ) {

            await loadVendorDashboard();
        }


        // -----------------------------------------
        // ADMIN DASHBOARD
        // -----------------------------------------

        if (
            getCurrentPage() ===
            "admin-dashboard.html"
        ) {

            setupAdminButtons();

            await loadAdminDashboard();

            await loadAdminTransactions();

            await loadAdminUsers();

            await loadAdminVendors();
        }

    }
);

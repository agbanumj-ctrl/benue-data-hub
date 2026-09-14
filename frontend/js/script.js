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
            const confirmPassword = document.getElementById("confirmPassword").value;


            // Check passwords
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

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;


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

                    // Save login token
                    localStorage.setItem("token", data.token);

                    // Save user information
                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                    // Go to homepage
                    window.location.href = "index.html";

                } else {

                    alert(data.message || "Login failed.");

                }


            } catch (error) {

                console.error("Login error:", error);

                alert("Unable to connect to Benue Data Hub server.");

            }

        });

    }

});
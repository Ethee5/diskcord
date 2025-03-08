var loginTicket = "";  // store ticket for 2FA

function loginWithCredentials() {
    var email = document.getElementById("emailInput").value;
    var password = document.getElementById("passwordInput").value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://discord.com/api/v9/auth/login", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var data = JSON.parse(xhr.responseText);

            if (data.token) {
                localStorage.setItem("discordToken", data.token);
                window.location.href = "home.html";
            } else if (data.ticket) {
                loginTicket = data.ticket;
                document.getElementById("normalLogin").classList.add("hidden");
                document.getElementById("twoFactorAuth").classList.remove("hidden");
            } else if (data.captcha_key) {
                alert("CAPTCHA detected! Please log in with a token.");
                switchToTokenLogin();
            } else {
                alert("Login failed: " + (data.message || "Unknown error."));
            }
        }
    };

    var requestData = JSON.stringify({ login: email, password: password });
    xhr.send(requestData);
}

function submit2FA() {
    var mfaCode = document.getElementById("mfaCodeInput").value;

    if (!mfaCode) {
        alert("Please enter your 2FA code.");
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://discord.com/api/v9/auth/mfa/totp", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var data = JSON.parse(xhr.responseText);

            if (data.token) {
                localStorage.setItem("discordToken", data.token);
                window.location.href = "home.html";
            } else {
                alert("2FA failed: " + (data.message || "Invalid code."));
            }
        }
    };

    var requestData = JSON.stringify({ ticket: loginTicket, code: mfaCode });
    xhr.send(requestData);
}

function loginWithToken() {
    var token = document.getElementById("tokenInput").value;
    if (!token) {
        alert("Please enter a token.");
        return;
    }

    localStorage.setItem("discordToken", token);
    window.location.href = "home.html";
}

function switchToTokenLogin() {
    document.getElementById("normalLogin").classList.add("hidden");
    document.getElementById("tokenLogin").classList.remove("hidden");
}

function switchToNormalLogin() {
    document.getElementById("tokenLogin").classList.add("hidden");
    document.getElementById("normalLogin").classList.remove("hidden");
}
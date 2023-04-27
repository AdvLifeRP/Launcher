/**
 * Script for login.ejs
 */
const ConfigManager = require("./assets/js/configmanager")
// FIXME: Possible clash with original variable names
// Validation Regexes.
const validUsername = /^[a-zA-Z0-9_]{1,16}$/
const basicEmail = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// Login Elements
const loginCancelContainer = document.getElementById("loginCrackedCancelContainer")
const loginCancelButton = document.getElementById("loginCrackedCancelButton")
const loginEmailError = document.getElementById("loginCrackedEmailError")
const loginUsername = document.getElementById("loginCrackedUsername")
const checkmarkContainer = document.getElementById("crackedCheckmarkContainer")
const loginRememberOption = document.getElementById("loginCrackedRememberOption")
const loginButton = document.getElementById("loginCrackedButton")
const loginForm = document.getElementById("loginCrackedForm")

// Control variables.
let lu = false,
    lp = false

/**
 * Show a login error.
 *
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value) {
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 *
 * @param {HTMLElement} element The element to shake.
 */
function shakeError(element) {
    if (element.style.opacity == 1) {
        element.classList.remove("shake")
        void element.offsetWidth
        element.classList.add("shake")
    }
}

// FIXME: Used in uibinder
/**
 * Validate that an email field is neither empty nor invalid.
 *
 * @param {string} value The email value.
 */
function validateEmail(value) {
    if (value) {
        if (!basicEmail.test(value) && !validUsername.test(value)) {
            showError(loginEmailError, Lang.queryJS("login.error.invalidValue"))
            loginDisabled(true)
            lu = false
        } else {
            loginEmailError.style.opacity = 0
            lu = true
            if (lp) {
                loginDisabled(false)
            }
        }
    } else {
        lu = false
        showError(loginEmailError, Lang.queryJS("login.error.requiredValue"))
        loginDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
loginUsername.addEventListener("focusout", e => {
    validateEmail(e.target.value)
    shakeError(loginEmailError)
})

// Validate input for each field.
loginUsername.addEventListener("input", e => {
    validateEmail(e.target.value)
})

/**
 * Enable or disable the login button.
 *
 * @param {boolean} v True to enable, false to disable.
 */
function loginDisabled(v) {
    if (loginButton.disabled !== v) {
        loginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 *
 * @param {boolean} v True to enable, false to disable.
 */
function loginLoading(v) {
    if (v) {
        loginButton.setAttribute("loading", v)
        loginButton.innerHTML = loginButton.innerHTML.replace(
            Lang.queryJS("login.login"),
            Lang.queryJS("login.loggingIn"),
        )
    } else {
        loginButton.removeAttribute("loading")
        loginButton.innerHTML = loginButton.innerHTML.replace(
            Lang.queryJS("login.loggingIn"),
            Lang.queryJS("login.login"),
        )
    }
}

/**
 * Enable or disable login form.
 *
 * @param {boolean} v True to enable, false to disable.
 */
function formDisabled(v) {
    loginDisabled(v)
    loginCancelButton.disabled = v
    loginUsername.disabled = v
    if (v) {
        checkmarkContainer.setAttribute("disabled", v)
    } else {
        checkmarkContainer.removeAttribute("disabled")
    }
    loginRememberOption.disabled = v
}

let loginViewOnSuccess = VIEWS.landing
let loginViewOnCancel = VIEWS.settings
let loginViewCancelHandler

// FIXME: Used in settings
function loginCrackedCancelEnabled(val) {
    if (val) {
        $(loginCancelContainer).show()
    } else {
        $(loginCancelContainer).hide()
    }
}

loginCancelButton.onclick = e => {
    switchView(getCurrentView(), loginViewOnCancel, 500, 500, () => {
        loginUsername.value = ""
        loginCrackedCancelEnabled(false)
        if (loginViewCancelHandler != null) {
            loginViewCancelHandler()
            loginViewCancelHandler = null
        }
    })
}

// Disable default form behavior.
loginForm.onsubmit = () => {
    return false
}

// Bind login button behavior.
loginButton.addEventListener("click", () => {
    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    loginLoading(true)

    const magicToken = "Sésame ouvre-toi"
    // FIXME: Login logic, create fake account
    updateSelectedAccount(
        ConfigManager.addMojangAuthAccount(
            generateUUID(loginUsername.value),
            magicToken,
            loginUsername.value,
            loginUsername.value,
        ),
    )

    if (ConfigManager.getClientToken() == null) {
        ConfigManager.setClientToken(magicToken)
    }
    ConfigManager.save()

    loginButton.innerHTML = loginButton.innerHTML.replace(
        Lang.queryJS("login.loggingIn"),
        Lang.queryJS("login.success"),
    )
    $(".circle-loader").toggleClass("load-complete")
    $(".checkmark").toggle()
    setTimeout(() => {
        switchView(VIEWS.login, loginViewOnSuccess, 500, 500, async () => {
            // Temporary workaround
            if (loginViewOnSuccess === VIEWS.settings) {
                await prepareSettings()
            }
            loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
            loginCrackedCancelEnabled(false) // Reset this for good measure.
            loginViewCancelHandler = null // Reset this for good measure.
            loginUsername.value = ""
            $(".circle-loader").toggleClass("load-complete")
            $(".checkmark").toggle()
            loginLoading(false)
            loginButton.innerHTML = loginButton.innerHTML.replace(
                Lang.queryJS("login.success"),
                Lang.queryJS("login.login"),
            )
            formDisabled(false)
        })
    }, 1000)
})

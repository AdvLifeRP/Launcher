/**
 * Script for login.ejs
 */
// Validation Regexes.
const _validUsername = /^[a-zA-Z0-9_]{1,16}$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// Login Elements
const _loginCancelContainer = document.getElementById("loginCrackedCancelContainer")
const _loginCancelButton = document.getElementById("loginCrackedCancelButton")
const _loginEmailError = document.getElementById("loginCrackedEmailError")
const loginCrackedUsername = document.getElementById("loginCrackedUsername")
const _checkmarkContainer = document.getElementById("crackedCheckmarkContainer")
const _loginRememberOption = document.getElementById("loginCrackedRememberOption")
const _loginButton = document.getElementById("loginCrackedButton")
const _loginForm = document.getElementById("loginCrackedForm")

// Control variable.
let _lu = false

/**
 * Show a login error.
 *
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function _showError(element, value) {
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 *
 * @param {HTMLElement} element The element to shake.
 */
function _shakeError(element) {
    if (element.style.opacity == 1) {
        element.classList.remove("shake")
        void element.offsetWidth
        element.classList.add("shake")
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 *
 * @param {string} value The email value.
 */
function _validateUsername(value) {
    if (value) {
        if (!_validUsername.test(value)) {
            _showError(_loginEmailError, Lang.queryJS("login.error.invalidValue"))
            _loginDisabled(true)
            _lu = false
        } else {
            _loginEmailError.style.opacity = 0
            _lu = true
            if (lp) {
                _loginDisabled(false)
            }
        }
    } else {
        _lu = false
        _showError(_loginEmailError, Lang.queryJS("login.error.requiredValue"))
        _loginDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
loginCrackedUsername.addEventListener("focusout", e => {
    _validateUsername(e.target.value)
    _shakeError(_loginEmailError)
})

// Validate input for each field.
loginCrackedUsername.addEventListener("input", e => {
    _validateUsername(e.target.value)
})

/**
 * Enable or disable the login button.
 *
 * @param {boolean} v True to enable, false to disable.
 */
function _loginDisabled(v) {
    if (_loginButton.disabled !== v) {
        _loginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 *
 * @param {boolean} v True to enable, false to disable.
 */
function _loginLoading(v) {
    if (v) {
        _loginButton.setAttribute("loading", v)
        _loginButton.innerHTML = _loginButton.innerHTML.replace(
            Lang.queryJS("login.login"),
            Lang.queryJS("login.loggingIn"),
        )
    } else {
        _loginButton.removeAttribute("loading")
        _loginButton.innerHTML = _loginButton.innerHTML.replace(
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
function _formDisabled(v) {
    _loginDisabled(v)
    _loginCancelButton.disabled = v
    loginCrackedUsername.disabled = v
    if (v) {
        _checkmarkContainer.setAttribute("disabled", v)
    } else {
        _checkmarkContainer.removeAttribute("disabled")
    }
    _loginRememberOption.disabled = v
}
/*
// FIXME: What to do with these?
let loginViewOnSuccess = VIEWS.landing
let loginViewOnCancel = VIEWS.settings
let loginViewCancelHandler
*/
// FIXME: Used in settings, should be added to a new settings cracked login option
function loginCrackedCancelEnabled(val) {
    if (val) {
        $(_loginCancelContainer).show()
    } else {
        $(_loginCancelContainer).hide()
    }
}

_loginCancelButton.onclick = e => {
    switchView(getCurrentView(), loginViewOnCancel, 500, 500, () => {
        loginCrackedUsername.value = ""
        loginCrackedCancelEnabled(false)
        if (loginViewCancelHandler != null) {
            loginViewCancelHandler()
            loginViewCancelHandler = null
        }
    })
}

// Disable default form behavior.
_loginForm.onsubmit = () => {
    return false
}

// Bind login button behavior.
_loginButton.addEventListener("click", () => {
    // Disable form.
    _formDisabled(true)

    // Show loading stuff.
    _loginLoading(true)

    const magicToken = "Sésame ouvre-toi"

    updateSelectedAccount(
        ConfigManager.addMojangAuthAccount(
            generateUUID(loginCrackedUsername.value),
            magicToken,
            loginCrackedUsername.value,
            loginCrackedUsername.value,
        ),
    )

    if (ConfigManager.getClientToken() == null) {
        ConfigManager.setClientToken(magicToken)
    }
    ConfigManager.save()

    _loginButton.innerHTML = _loginButton.innerHTML.replace(
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
            loginCrackedUsername.value = ""
            $(".circle-loader").toggleClass("load-complete")
            $(".checkmark").toggle()
            _loginLoading(false)
            _loginButton.innerHTML = _loginButton.innerHTML.replace(
                Lang.queryJS("login.success"),
                Lang.queryJS("login.login"),
            )
            _formDisabled(false)
        })
    }, 1000)
})

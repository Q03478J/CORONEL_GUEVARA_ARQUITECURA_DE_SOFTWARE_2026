function login() {
    let user = document.getElementById("usuario").value;
    let pass = document.getElementById("password").value;

    if (user === "admin" && pass === "123") {
        window.location.href = "admin.html";
    } else if (user === "user" && pass === "123") {
        window.location.href = "usuario.html";
    } else {
        window.location.href = "invitado.html";
    }
}

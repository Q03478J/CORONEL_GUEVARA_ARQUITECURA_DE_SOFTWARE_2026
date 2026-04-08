const admin = {
    user: "admin",
    pass: "123"
};

// LOGIN
function login() {
    let user = document.getElementById("user").value;
    let pass = document.getElementById("pass").value;

    if (user === admin.user && pass === admin.pass) {
        entrarSistema("ADMIN");
    } else {
        alert("Datos incorrectos");
    }
}

// INVITADO
function modoInvitado() {
    entrarSistema("INVITADO");
}

// ENTRAR
function entrarSistema(tipo) {
    document.getElementById("pantallaLogin").classList.add("oculto");
    document.getElementById("registro").classList.add("oculto");
    document.getElementById("panel").classList.remove("oculto");

    document.getElementById("contenido").innerHTML =
        "<h2>Bienvenido " + tipo + "</h2>";
}

// MOSTRAR REGISTRO
function mostrarRegistro() {
    document.getElementById("pantallaLogin").classList.add("oculto");
    document.getElementById("registro").classList.remove("oculto");
}

// VOLVER LOGIN
function volverLogin() {
    document.getElementById("registro").classList.add("oculto");
    document.getElementById("pantallaLogin").classList.remove("oculto");
}

// REGISTRAR
function registrar() {
    alert("Registro funcionando (falta base de datos)");
}

// CONTENIDO
function inicio() {
    document.getElementById("contenido").innerHTML =
        "<h2>Inicio</h2>";
}

function verSemana(n) {
    document.getElementById("contenido").innerHTML =
        "<h2>Semana " + n + "</h2>";
}

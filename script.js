
function formatCLP(n) {
  n = Number(n) || 0;
  n = Math.max(0, Math.floor(n));
  return "$" + n.toLocaleString("es-CL");
}

function toNumber(v) {
  var n = Number(String(v || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function getJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showAlert(containerId, msg, type) {
  var el = document.getElementById(containerId);
  if (!el) return;

  type = type || "info";
  el.innerHTML =
    '<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' +
      msg +
      '<button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">' +
        '<span aria-hidden="true">&times;</span>' +
      "</button>" +
    "</div>";
}

/* ---- Estado (LocalStorage) ---- */
var KEY_LOGIN = "walletLoggedIn";
var KEY_USER = "walletUserEmail";
var KEY_BALANCE = "walletBalance";
var KEY_TX = "walletTransactions";
var KEY_CONTACTS = "walletContacts";
var KEY_USERS = "walletUsers";

function ensureInitialData() {
  // Usuarios asignados
  var users = getJSON(KEY_USERS, []);
  if (!Array.isArray(users) || users.length === 0) {
    setJSON(KEY_USERS, [
      { email: "demo@wallet.com", password: "1234" },
      { email: "alke@wallet.com", password: "1234" }
    ]);
  }

  // Saldo inicial
  var bal = localStorage.getItem(KEY_BALANCE);
  if (bal === null || bal === "") localStorage.setItem(KEY_BALANCE, "60000");

  // Listas
  if (!localStorage.getItem(KEY_TX)) setJSON(KEY_TX, []);
  if (!localStorage.getItem(KEY_CONTACTS)) {
    setJSON(KEY_CONTACTS, [
      { id: Date.now(), name: "John Doe", alias: "john.doe", cbu: "123456789", bank: "ABC Bank" },
      { id: Date.now() + 1, name: "Jane Smith", alias: "jane.smith", cbu: "987654321", bank: "XYZ Bank" }
    ]);
  }
}

function getBalance() {
  return toNumber(localStorage.getItem(KEY_BALANCE));
}
function setBalance(n) {
  localStorage.setItem(KEY_BALANCE, String(Math.max(0, Math.floor(toNumber(n)))));
}

function addTransaction(type, description, amount) {
  var list = getJSON(KEY_TX, []);
  list.unshift({
    id: Date.now(),
    type: type,
    description: description,
    amount: toNumber(amount),
    date: new Date().toISOString()
  });
  setJSON(KEY_TX, list.slice(0, 50));
}

/* ---- Login ---- */
function isLoggedIn() {
  return localStorage.getItem(KEY_LOGIN) === "true";
}
function login(email) {
  localStorage.setItem(KEY_LOGIN, "true");
  localStorage.setItem(KEY_USER, email);
}
function logout() {
  localStorage.setItem(KEY_LOGIN, "false");
  localStorage.removeItem(KEY_USER);
}
function requireLogin() {
  var page = (location.pathname.split("/").pop() || "").toLowerCase();
  var isLoginPage = (page === "" || page === "index.html" || page === "login.html");
  if (!isLoginPage && !isLoggedIn()) {
    location.href = "index.html";
  }
}


document.addEventListener("DOMContentLoaded", function () {
  ensureInitialData();

  // Botones logout (si existen)
  document.querySelectorAll(".js-logout").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      logout();
      location.href = "index.html";
    });
  });

  // Si no es login: exigir sesión
  if (!document.getElementById("loginForm")) requireLogin();

  if (document.getElementById("loginForm")) initLogin();
  if (document.getElementById("menuBalance")) initMenu();
  if (document.getElementById("depositForm")) initDeposit();
  if (document.getElementById("sendBalance")) initSendMoney();
  if (document.getElementById("transactionsList")) initTransactions();
});


function initLogin() {
  if (!window.jQuery) return;

  var $ = window.jQuery;
  var $form = $("#loginForm");

  // Si ya está logueado, ir al menú
  if (isLoggedIn()) {
    location.href = "menu.html";
    return;
  }

  $form.on("submit", function (e) {
    e.preventDefault();

    var email = ($("#email").val() || "").trim();
    var pass = ($("#password").val() || "").trim();

    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    var passOk = pass.length >= 4;

    if (!emailOk || !passOk) {
      showAlert("loginAlert", "Revisa email y contraseña (mínimo 4 caracteres).", "danger");
      return;
    }

    var users = getJSON(KEY_USERS, []);
    var valid = users.some(function (u) {
      return u.email === email && u.password === pass;
    });

    if (!valid) {
      showAlert("loginAlert", "Credenciales incorrectas. Intenta nuevamente.", "danger");
      return;
    }

    login(email);
    showAlert("loginAlert", "✅ Inicio de sesión exitoso. Redirigiendo...", "success");

    setTimeout(function () {
      location.href = "menu.html";
    }, 700);
  });
}


function initMenu() {
  var balEl = document.getElementById("menuBalance");
  if (balEl) balEl.textContent = formatCLP(getBalance());

  function go(label, page) {
    showAlert("menuAlertArea", "Redirigiendo a <b>" + label + "</b>...", "info");
    setTimeout(function () {
      location.href = page;
    }, 600);
  }

  var btnDeposit = document.getElementById("btnDeposit");
  if (btnDeposit) btnDeposit.addEventListener("click", function () {
    go("Depósito / Retiro", "deposit.html");
  });

  var btnSend = document.getElementById("btnSend");
  if (btnSend) btnSend.addEventListener("click", function () {
    go("Enviar / Recibir", "sendmoney.html");
  });

  var btnTx = document.getElementById("btnTx");
  if (btnTx) btnTx.addEventListener("click", function () {
    go("Últimos movimientos", "transactions.html");
  });

  var btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", function () {
    logout();
    location.href = "index.html";
  });
}


function initDeposit() {
  if (!window.jQuery) return;

  var $ = window.jQuery;
  $("#depositBalance").text(formatCLP(getBalance()));

  $("#depositForm").on("submit", function (e) {
    e.preventDefault();

    var amount = toNumber($("#depositAmount").val());
    var type = ($("#movementType").val() || "deposit");

    $("#depositLegend").text("");
    $("#alert-container").html("");

    if (!amount || amount <= 0) {
      showAlert("alert-container", "Ingresa un monto válido.", "danger");
      return;
    }

    var bal = getBalance();

    if (type === "withdraw") {
      if (amount > bal) {
        showAlert("alert-container", "Saldo insuficiente para realizar el retiro.", "danger");
        return;
      }
      setBalance(bal - amount);
      addTransaction("withdraw", "Retiro", -amount);
      $("#depositBalance").text(formatCLP(getBalance()));
      $("#depositLegend").text("Retiraste " + formatCLP(amount) + ".");
      showAlert("alert-container", "✅ Retiro realizado. Redirigiendo al menú...", "success");
      setTimeout(function () { location.href = "menu.html"; }, 1500);
      return;
    }

    // Depósito
    setBalance(bal + amount);
    addTransaction("deposit", "Depósito", amount);
    $("#depositBalance").text(formatCLP(getBalance()));
    $("#depositLegend").text("Depositaste " + formatCLP(amount) + ".");
    showAlert("alert-container", "✅ Depósito realizado. Redirigiendo al menú...", "success");
    setTimeout(function () { location.href = "menu.html"; }, 1500);
  });
}


function initSendMoney() {
  if (!window.jQuery) return;

  var $ = window.jQuery;

  $("#sendBalance").text(formatCLP(getBalance()));

  var contacts = getJSON(KEY_CONTACTS, []);
  if (!Array.isArray(contacts)) contacts = [];

  var selectedId = null;

  // Al inicio: ocultar botón enviar
  $("#btnSendMoney").hide();

  function renderContacts(list) {
    var $list = $("#contactList");
    $list.empty();

    if (!list || list.length === 0) {
      $list.append('<li class="list-group-item text-muted">No hay contactos.</li>');
      return;
    }

    list.forEach(function (c) {
      var $li = $(
        '<li class="list-group-item" style="cursor:pointer;">' +
          "<div><strong>" + c.name + "</strong><br>" +
          "<small>CBU: " + c.cbu + " | Alias: " + c.alias + " | Banco: " + c.bank + "</small></div>" +
        "</li>"
      );

      $li.on("click", function () {
        selectedId = c.id;
        $("#contactList .list-group-item").removeClass("active");
        $li.addClass("active");
        $("#btnSendMoney").show();
        $("#sendConfirm").html("");
        showAlert("sendAlertArea", "Contacto seleccionado: <b>" + c.name + "</b>", "info");
      });

      $list.append($li);
    });
  }

  function saveContacts() {
    setJSON(KEY_CONTACTS, contacts);
  }

  renderContacts(contacts);


  function hideAuto() {
    $("#autocompleteBox").addClass("d-none").empty();
  }

  function showAuto(matches) {
    var $box = $("#autocompleteBox");
    $box.removeClass("d-none").empty();

    matches.slice(0, 6).forEach(function (c) {
      var $item = $(
        '<button type="button" class="list-group-item list-group-item-action">' +
          "<strong>" + c.name + "</strong> <small>(" + c.alias + ")</small>" +
        "</button>"
      );

      $item.on("click", function () {
        $("#searchContact").val(c.name);
        renderContacts([c]);
        hideAuto();
      });

      $box.append($item);
    });
  }

  $("#searchContact").on("input", function () {
    var term = ($(this).val() || "").trim().toLowerCase();
    if (!term) {
      hideAuto();
      return;
    }

    var matches = contacts.filter(function (c) {
      return String(c.name).toLowerCase().includes(term) ||
             String(c.alias).toLowerCase().includes(term);
    });

    if (matches.length) showAuto(matches);
    else hideAuto();
  });

  $(document).on("click", function (e) {
    var clickedInside = $(e.target).closest("#searchContact, #autocompleteBox").length > 0;
    if (!clickedInside) hideAuto();
  });

  // Buscar (submit): filtra lista
  $("#searchForm").on("submit", function (e) {
    e.preventDefault();
    hideAuto();

    var q = ($("#searchContact").val() || "").trim().toLowerCase();
    if (!q) {
      renderContacts(contacts);
      return;
    }

    var filtered = contacts.filter(function (c) {
      return String(c.name).toLowerCase().includes(q) ||
             String(c.alias).toLowerCase().includes(q);
    });

    renderContacts(filtered);
  });


  $("#newContactForm").on("submit", function (e) {
    e.preventDefault();

    $("#newContactAlertArea").html("");

    var name = ($("#newName").val() || "").trim();
    var alias = ($("#newAlias").val() || "").trim();
    var cbu = ($("#newCbu").val() || "").trim();
    var bank = ($("#newBank").val() || "").trim();

    if (!name || !alias || !cbu || !bank) {
      showAlert("newContactAlertArea", "Completa todos los campos del contacto.", "danger");
      return;
    }

    if (!/^\d{8,22}$/.test(cbu)) {
      showAlert("newContactAlertArea", "CBU inválido: solo números (8 a 22 dígitos).", "danger");
      return;
    }

    contacts.push({ id: Date.now(), name: name, alias: alias, cbu: cbu, bank: bank });
    saveContacts();

    renderContacts(contacts);
    this.reset();

    // Cerrar modal (Bootstrap 4)
    $("#modalNewContact").modal("hide");

    showAlert("sendAlertArea", "✅ Contacto agregado: <b>" + name + "</b>", "success");
  });



  $("#btnSendMoney").on("click", function () {
    var amount = toNumber($("#sendAmount").val());

    if (!selectedId) {
      showAlert("sendAlertArea", "Debes seleccionar un contacto.", "danger");
      return;
    }
    if (!amount || amount <= 0) {
      showAlert("sendAlertArea", "Ingresa un monto válido.", "danger");
      return;
    }

    var contact = contacts.find(function (c) { return c.id === selectedId; });
    if (!contact) {
      showAlert("sendAlertArea", "El contacto seleccionado no existe.", "danger");
      $("#btnSendMoney").hide();
      selectedId = null;
      renderContacts(contacts);
      return;
    }

    var bal = getBalance();
    if (amount > bal) {
      showAlert("sendAlertArea", "Saldo insuficiente para esta transferencia.", "danger");
      return;
    }

    setBalance(bal - amount);
    $("#sendBalance").text(formatCLP(getBalance()));

    addTransaction("send", "Envío a " + contact.name, -amount);

    showAlert("sendConfirm", "✅ Envío realizado a <b>" + contact.name + "</b> por <b>" + formatCLP(amount) + "</b>.", "success");
    $("#sendAmount").val("");

    setTimeout(function () { location.href = "menu.html"; }, 1200);
  });




  $("#receiveForm").on("submit", function (e) {
    e.preventDefault();

    var from = ($("#receiveFrom").val() || "").trim();
    var amount = toNumber($("#receiveAmount").val());

    $("#receiveAmountError").addClass("d-none");
    $("#receiveAlertArea").html("");

    if (!amount || amount <= 0) {
      $("#receiveAmountError").removeClass("d-none");
      showAlert("receiveAlertArea", "Ingresa un monto válido para recibir.", "danger");
      return;
    }

    setBalance(getBalance() + amount);
    $("#sendBalance").text(formatCLP(getBalance()));

    addTransaction("receive", from ? ("Transferencia recibida: " + from) : "Transferencia recibida", amount);

    showAlert("receiveAlertArea", "✅ Recibiste <b>" + formatCLP(amount) + "</b>. Nuevo saldo: <b>" + formatCLP(getBalance()) + "</b>.", "success");

    $("#receiveAmount").val("");
    $("#receiveFrom").val("");
  });
}

function initTransactions() {
  if (!window.jQuery) return;

  var $ = window.jQuery;

  $("#transactionsBalance").text(formatCLP(getBalance()));

  var list = getJSON(KEY_TX, []);

  // Si está vacío, muestra 3 de ejemplo
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      { type: "buy", description: "Compra en línea", amount: -5000 },
      { type: "deposit", description: "Depósito", amount: 25000 },
      { type: "receive", description: "Transferencia recibida", amount: 12000 }
    ];
  }

  function labelType(type) {
    if (type === "deposit") return "Depósito";
    if (type === "withdraw") return "Retiro";
    if (type === "buy") return "Compra";
    if (type === "receive") return "Transferencia recibida";
    if (type === "send") return "Transferencia enviada";
    return "Movimiento";
  }

  function render(filter) {
    var $ul = $("#transactionsList");
    $ul.empty();

    var filtered = (!filter || filter === "all")
      ? list
      : list.filter(function (t) { return t.type === filter; });

    if (filtered.length === 0) {
      $("#transactionsEmpty").show();
      return;
    }
    $("#transactionsEmpty").hide();

    filtered.slice(0, 30).forEach(function (t) {
      var amount = toNumber(t.amount);
      var badge = amount >= 0 ? "success" : "danger";
      var sign = amount >= 0 ? "+" : "-";

      var $li = $(
        '<li class="list-group-item d-flex justify-content-between align-items-center">' +
          '<div>' +
            '<div class="font-weight-bold">' + labelType(t.type) + '</div>' +
            '<small class="text-muted">' + (t.description || "") + '</small>' +
          "</div>" +
          '<span class="badge badge-' + badge + ' badge-pill">' + sign + formatCLP(Math.abs(amount)) + "</span>" +
        "</li>"
      );

      $ul.append($li);
    });
  }

  render("all");

  $("#filterType").on("change", function () {
    render(this.value);
  });
}

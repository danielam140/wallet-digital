/* =========================
   Alke Wallet - script.js
   (Root file - no subfolders)
   ========================= */

/* ----------
   Helpers
---------- */
function toNumber(value) {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatCLP(value) {
  const n = Math.max(0, Math.floor(toNumber(value)));
  return "$" + n.toLocaleString("es-CL");
}

function getStorageJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorageJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureBalance() {
  const existing = localStorage.getItem("walletBalance");
  if (existing === null || existing === undefined || existing === "") {
    localStorage.setItem("walletBalance", String(60000));
  }
}

function getBalance() {
  ensureBalance();
  return toNumber(localStorage.getItem("walletBalance"));
}

function setBalance(value) {
  localStorage.setItem("walletBalance", String(Math.max(0, Math.floor(toNumber(value)))));
}

function pushTransaction(tx) {
  const list = getStorageJSON("walletTransactions", []);
  list.unshift({
    id: tx.id || Date.now(),
    type: tx.type || "other",
    description: tx.description || "",
    amount: toNumber(tx.amount),
    date: tx.date || new Date().toISOString(),
    meta: tx.meta || {}
  });
  setStorageJSON("walletTransactions", list);
}

function showBootstrapAlert(targetEl, message, type = "info") {
  if (!targetEl) return;

  const html = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `;
  targetEl.innerHTML = html;
}

/* ----------
   Page routers
---------- */
document.addEventListener("DOMContentLoaded", () => {
  ensureBalance();

  // Logout links (if present)
  document.querySelectorAll(".js-logout").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      // For simple demo: just go back to login
      window.location.href = "login.html";
    });
  });

  // Detect page by key element
  if (document.querySelector(".login-screen")) initLogin();
  if (document.getElementById("menuBalance")) initMenu();
  if (document.getElementById("depositBalance")) initDeposit();
  if (document.getElementById("sendBalance")) initSendMoney();
  if (document.getElementById("transactionsList")) initTransactions();
});

/* ----------
   LOGIN (index.html / login.html)
---------- */
function initLogin() {
  // ✅ Requisito: manejar login con jQuery (selectores + submit)
  if (!window.jQuery) return;

  const $form = window.jQuery("#loginForm");
  const $alertArea = window.jQuery("#loginAlert");

  if ($form.length === 0) return;

  $form.submit(function (e) {
    e.preventDefault();

    const email = (window.jQuery("#email").val() || "").trim();
    const pass = (window.jQuery("#password").val() || "").trim();

    $alertArea.html("");

    if (!email || !pass) {
      showBootstrapAlert($alertArea[0], "Completa correo y contraseña.", "danger");
      return;
    }

    showBootstrapAlert($alertArea[0], "✅ Inicio de sesión exitoso. Redirigiendo...", "success");

    // ✅ Redirigir (puedes cambiar la ruta si tu profe la exige)
    setTimeout(() => {
      window.location.href = "menu.html";
    }, 900);
  });
}

/* ----------
   MENU (menu.html)
---------- */
function initMenu() {
  const balanceEl = document.getElementById("menuBalance");
  if (balanceEl) balanceEl.textContent = formatCLP(getBalance());

  const alertArea = document.getElementById("menuAlertArea");

  function hookRedirect(buttonId, label, href) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (alertArea) showBootstrapAlert(alertArea, `Redirigiendo a <b>${label}</b>...`, "info");
      setTimeout(() => (window.location.href = href), 700);
    });
  }

  // IDs reales en menu.html
  hookRedirect("btnDeposit", "Depositar", "deposit.html");
  hookRedirect("btnSend", "Enviar dinero", "sendmoney.html");
  hookRedirect("btnTx", "Últimos movimientos", "transactions.html");
}

/* ----------
   DEPOSIT (deposit.html)
---------- */
function initDeposit() {
  // ✅ Requisito: usar jQuery para leer saldo, manejar submit, y mostrar mensajes
  if (!window.jQuery) return;

  const $ = window.jQuery;
  const $balance = $("#depositBalance");
  const $form = $("#depositForm");
  const $amount = $("#depositAmount");
  const $legend = $("#depositLegend");
  const $alertContainer = $("#alert-container");

  // Mostrar saldo actual (desde Local Storage) con jQuery
  $balance.text(formatCLP(getBalance()));

  function showDepositAlert(message, type) {
    // Alerta Bootstrap creada y agregada con jQuery
    const $alert = $(
      `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>`
    );
    $alertContainer.empty().append($alert);
  }

  $form.submit(function (e) {
    e.preventDefault();

    const amount = toNumber($amount.val());
    $alertContainer.empty();
    $legend.text("");

    if (!amount || amount <= 0) {
      showDepositAlert("Ingresa un monto válido para depositar.", "danger");
      return;
    }

    const newBalance = getBalance() + amount;
    setBalance(newBalance);

    pushTransaction({
      type: "deposit",
      description: "Depósito",
      amount: amount
    });

    // Actualizar UI con jQuery
    $balance.text(formatCLP(newBalance));
    $legend.text(`Depositaste ${formatCLP(amount)}.`);

    showDepositAlert(`✅ Depósito realizado: <b>${formatCLP(amount)}</b>. Redirigiendo al menú...`, "success");

    // Redirigir después de 2 segundos
    setTimeout(() => {
      window.location.href = "menu.html";
    }, 2000);
  });
}

/* ----------
   SEND MONEY (sendmoney.html)
---------- */
function initSendMoney() {
  // Balance
  const balanceEl = document.getElementById("sendBalance");
  if (balanceEl) balanceEl.textContent = formatCLP(getBalance());

  // DOM refs
  const contactListEl = document.getElementById("contactList");
  const sendAlertArea = document.getElementById("sendAlertArea");
  const newContactAlertArea = document.getElementById("newContactAlertArea");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchContact");
  const sendAmountInput = document.getElementById("sendAmount");
  const btnSendMoney = document.getElementById("btnSendMoney");
  const sendConfirm = document.getElementById("sendConfirm");

  const modalEl = document.getElementById("modalNewContact");
  const saveContactBtn = document.getElementById("saveContactBtn");
  const newName = document.getElementById("newName");
  const newAlias = document.getElementById("newAlias");
  const newCbu = document.getElementById("newCbu");
  const newBank = document.getElementById("newBank");
  const newContactForm = document.getElementById("newContactForm");

  // Limpia alertas dentro del modal al abrir/cerrar
  if (window.jQuery && modalEl && newContactAlertArea) {
    window.jQuery(modalEl).on("shown.bs.modal", () => {
      newContactAlertArea.innerHTML = "";
    });
    window.jQuery(modalEl).on("hidden.bs.modal", () => {
      newContactAlertArea.innerHTML = "";
    });
  }

  // State
  let contacts = getStorageJSON("walletContacts", []);
  if (!Array.isArray(contacts)) contacts = [];

  // Default contacts if empty
  if (contacts.length === 0) {
    contacts = [
      { id: 1, name: "John Doe", alias: "john.doe", cbu: "123456789", bank: "ABC Bank" },
      { id: 2, name: "Jane Smith", alias: "jane.smith", cbu: "987654321", bank: "XYZ Bank" }
    ];
    setStorageJSON("walletContacts", contacts);
  }

  let selectedContactId = null;

  // ✅ Requisito: ocultar botón "Enviar dinero" hasta seleccionar un contacto
  if (btnSendMoney) btnSendMoney.style.display = "none";

  function renderContacts(list) {
    if (!contactListEl) return;

    contactListEl.innerHTML = "";

    list.forEach((c) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.style.cursor = "pointer";
      li.dataset.contactId = String(c.id);

      if (selectedContactId === c.id) {
        li.classList.add("active");
      }

      li.innerHTML = `
        <div>
          <strong>${c.name}</strong><br>
          <small>CBU: ${c.cbu} | Alias: ${c.alias} | Banco: ${c.bank}</small>
        </div>
      `;

      // ✅ Click select contact
      li.addEventListener("click", () => {
        selectedContactId = c.id;

        // Remove active from all
        contactListEl.querySelectorAll(".list-group-item").forEach((item) => item.classList.remove("active"));
        // Add active to this
        li.classList.add("active");

        // Mostrar botón cuando hay contacto seleccionado
        if (btnSendMoney) btnSendMoney.style.display = "block";
	        if (sendConfirm) sendConfirm.innerHTML = "";

        showBootstrapAlert(sendAlertArea, `Contacto seleccionado: <b>${c.name}</b>`, "info");
      });

      contactListEl.appendChild(li);
    });

    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "No se encontraron contactos.";
      contactListEl.appendChild(empty);
    }
  }

  // Initial render
  renderContacts(contacts);

  // Search
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (searchInput?.value || "").trim().toLowerCase();

      if (!q) {
        renderContacts(contacts);
        return;
      }

      const filtered = contacts.filter((c) => {
        return (
          String(c.name).toLowerCase().includes(q) ||
          String(c.alias).toLowerCase().includes(q)
        );
      });

      renderContacts(filtered);
    });
  }

  // Save contact (modal)
  if (saveContactBtn) {
    saveContactBtn.addEventListener("click", () => {
      const name = (newName?.value || "").trim();
      const alias = (newAlias?.value || "").trim();
      const cbu = (newCbu?.value || "").trim();
      const bank = (newBank?.value || "").trim();

      const modalAlertTarget = newContactAlertArea || sendAlertArea;
      if (modalAlertTarget) modalAlertTarget.innerHTML = "";

      // validations
      if (!name || !alias || !cbu || !bank) {
        showBootstrapAlert(modalAlertTarget, "Completa todos los campos del nuevo contacto.", "danger");
        return;
      }
      if (!/^\d{6,}$/.test(cbu)) {
        showBootstrapAlert(modalAlertTarget, "El CBU debe ser numérico y tener al menos 6 dígitos.", "danger");
        return;
      }

      const newContact = {
        id: Date.now(),
        name,
        alias,
        cbu,
        bank
      };

      contacts.push(newContact);
      setStorageJSON("walletContacts", contacts);

      // Reset & close modal (Bootstrap 4 uses jQuery)
      if (newContactForm) newContactForm.reset();
      if (window.jQuery && modalEl) {
        window.jQuery(modalEl).modal("hide");
      }

      renderContacts(contacts);
      showBootstrapAlert(sendAlertArea, `✅ Contacto agregado: <b>${name}</b>`, "success");
    });
  }

  // Send money
  if (btnSendMoney) {
    btnSendMoney.addEventListener("click", () => {
      const amount = toNumber(sendAmountInput?.value);

      if (!selectedContactId) {
        showBootstrapAlert(sendAlertArea, "Debes seleccionar un contacto antes de enviar dinero.", "danger");
        return;
      }
      if (!sendAmountInput || amount <= 0) {
        showBootstrapAlert(sendAlertArea, "Ingresa un monto válido para enviar.", "danger");
        return;
      }

      const contact = contacts.find((c) => c.id === selectedContactId);
      if (!contact) {
        showBootstrapAlert(sendAlertArea, "El contacto seleccionado no existe. Vuelve a seleccionar.", "danger");
        selectedContactId = null;
        renderContacts(contacts);
        return;
      }

      const balance = getBalance();
      if (amount > balance) {
        showBootstrapAlert(sendAlertArea, "Saldo insuficiente para realizar esta transferencia.", "danger");
        return;
      }

      const newBalance = balance - amount;
      setBalance(newBalance);
      if (balanceEl) balanceEl.textContent = formatCLP(newBalance);

      pushTransaction({
        type: "send",
        description: `Envío a ${contact.name}`,
        amount: -amount,
        meta: { to: contact }
      });

      showBootstrapAlert(
        sendConfirm || sendAlertArea,
        `✅ Envío realizado a <b>${contact.name}</b> por <b>${formatCLP(amount)}</b>.`,
        "success"
      );

      // Clean inputs
      if (sendAmountInput) sendAmountInput.value = "";

      // Optional: redirect after a bit
      setTimeout(() => {
        window.location.href = "menu.html";
      }, 1500);
    });
  }
}

/* ----------
   TRANSACTIONS (transactions.html)
---------- */
function initTransactions() {
  // ✅ Requisitos: listaTransacciones + filtro + funciones mostrarUltimosMovimientos() y getTipoTransaccion()
  if (!window.jQuery) return;

  const $balanceEl = window.jQuery("#transactionsBalance");
  const $listEl = window.jQuery("#transactionsList");
  const $filterEl = window.jQuery("#filterType");
  const $emptyEl = window.jQuery("#transactionsEmpty");

  // Saldo actual
  $balanceEl.text(formatCLP(getBalance()));

  // Lista ficticia (si no hay movimientos reales en localStorage)
  const listaTransaccionesFicticia = [
    { type: "buy", description: "Compra en línea", amount: -5000 },
    { type: "deposit", description: "Depósito", amount: 25000 },
    { type: "receive", description: "Transferencia recibida", amount: 12000 }
  ];

  // Lista real desde Local Storage
  const listaTransaccionesReal = getStorageJSON("walletTransactions", []);

  // ✅ Requisito: reemplazar ficticia por real (si existe)
  const listaTransacciones = Array.isArray(listaTransaccionesReal) && listaTransaccionesReal.length > 0
    ? listaTransaccionesReal
    : listaTransaccionesFicticia;

  function getTipoTransaccion(tipo) {
    if (tipo === "deposit") return "Depósito";
    if (tipo === "buy") return "Compra";
    if (tipo === "receive") return "Transferencia recibida";
    if (tipo === "send") return "Transferencia enviada";
    return "Movimiento";
  }

  function mostrarUltimosMovimientos(filtro) {
    $listEl.html("");

    const filtradas = (!filtro || filtro === "all")
      ? listaTransacciones
      : listaTransacciones.filter((t) => t.type === filtro);

    if (filtradas.length === 0) {
      $emptyEl.show();
      return;
    }

    $emptyEl.hide();

    filtradas.slice(0, 30).forEach((t) => {
      const amount = toNumber(t.amount);
      const badge = amount >= 0 ? "success" : "danger";
      const sign = amount >= 0 ? "+" : "-";
      const abs = Math.abs(amount);

      const $li = window.jQuery("<li>")
        .addClass("list-group-item d-flex justify-content-between align-items-center")
        .html(`
          <div>
            <div class="font-weight-bold">${getTipoTransaccion(t.type)}</div>
            <small class="text-muted">${t.description || ""}</small>
          </div>
          <span class="badge badge-${badge} badge-pill">${sign}${formatCLP(abs)}</span>
        `);

      $listEl.append($li);
    });
  }

  // Inicial
  mostrarUltimosMovimientos("all");

  // ✅ Requisito: filtrar con jQuery
  $filterEl.on("change", function () {
    mostrarUltimosMovimientos(this.value);
  });
}

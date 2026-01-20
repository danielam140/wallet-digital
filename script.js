/* Wallet - script.js
   Requisitos: jQuery + Bootstrap alerts + LocalStorage
*/

$(function () {
  const KEYS = {
    LOGGED: 'wallet_logged',
    BALANCE: 'wallet_balance',
    CONTACTS: 'wallet_contacts',
    TX: 'wallet_transactions'
  };

  // ---------- Helpers ----------
  function toInt(v) {
    const n = parseInt(String(v).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function formatCLP(n) {
    try {
      return new Intl.NumberFormat('es-CL').format(n);
    } catch (e) {
      // Fallback simple
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  }

  function getBalance() {
    const raw = localStorage.getItem(KEYS.BALANCE);
    const n = toInt(raw);
    return n > 0 ? n : 60000;
  }

  function setBalance(n) {
    localStorage.setItem(KEYS.BALANCE, String(Math.max(0, toInt(n))));
  }

  function ensureInitialData() {
    if (!localStorage.getItem(KEYS.BALANCE)) setBalance(60000);

    if (!localStorage.getItem(KEYS.CONTACTS)) {
      const seed = [
        { id: 'c1', name: 'John Doe', alias: 'john.doe', cbu: '123456789', bank: 'ABC Bank' },
        { id: 'c2', name: 'Jane Smith', alias: 'jane.smith', cbu: '987654321', bank: 'XYZ Bank' }
      ];
      localStorage.setItem(KEYS.CONTACTS, JSON.stringify(seed));
    }

    if (!localStorage.getItem(KEYS.TX)) {
      const seedTx = [
        { id: 't1', tipo: 'purchase', descripcion: 'Compra en línea', monto: 5000, fecha: new Date().toISOString() },
        { id: 't2', tipo: 'deposit', descripcion: 'Depósito', monto: 10000, fecha: new Date().toISOString() },
        { id: 't3', tipo: 'transfer_in', descripcion: 'Transferencia recibida', monto: 7500, fecha: new Date().toISOString() }
      ];
      localStorage.setItem(KEYS.TX, JSON.stringify(seedTx));
    }
  }

  function showBootstrapAlert($container, type, message) {
    const html = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;
    $container.html(html);
  }

  function isLoginPage() {
    return $('#loginForm').length > 0;
  }

  function requireLogin() {
    const logged = localStorage.getItem(KEYS.LOGGED) === 'true';
    if (!logged && !isLoginPage()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  function bindLogout() {
    $(document).on('click', '.js-logout', function (e) {
      e.preventDefault();
      localStorage.removeItem(KEYS.LOGGED);
      window.location.href = 'index.html';
    });
  }

  function updateBalanceUI() {
    const b = getBalance();

    // Menu
    if ($('#menuBalance').length) $('#menuBalance').text(`$${formatCLP(b)}`);

    // Deposit
    if ($('#depositBalance').length) $('#depositBalance').text(`$${formatCLP(b)}`);

    // Send money
    if ($('#sendBalance').length) $('#sendBalance').text(`$${formatCLP(b)}`);

    // Transactions
    if ($('#txBalance').length) $('#txBalance').text(`$${formatCLP(b)}`);
  }

  function getContacts() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.CONTACTS) || '[]');
    } catch (e) {
      return [];
    }
  }

  function setContacts(list) {
    localStorage.setItem(KEYS.CONTACTS, JSON.stringify(list || []));
  }

  function addTransaction(tx) {
    const list = getTransactions();
    list.unshift(tx);
    localStorage.setItem(KEYS.TX, JSON.stringify(list));
  }

  function getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.TX) || '[]');
    } catch (e) {
      return [];
    }
  }

  function getTipoTransaccion(tipo) {
    const t = String(tipo || '').toLowerCase();
    if (t === 'purchase' || t === 'compra') return 'Compra';
    if (t === 'deposit' || t === 'deposito' || t === 'depósito') return 'Depósito';
    if (t === 'transfer_in' || t === 'transferencia_recibida') return 'Transferencia recibida';
    if (t === 'transfer_out' || t === 'transferencia_enviada') return 'Transferencia enviada';
    return 'Movimiento';
  }

  // ---------- Init ----------
  ensureInitialData();
  bindLogout();
  if (!requireLogin()) return;
  updateBalanceUI();

  // ---------- LOGIN (index.html) ----------
  if (isLoginPage()) {
    // No mostrar botón de menú aquí: no existe en el HTML, perfecto.

    $('#loginForm').on('submit', function (e) {
      e.preventDefault();

      const email = $('#email').val().trim();
      const pass = $('#password').val().trim();
      const $alert = $('#loginAlert');

      // Credenciales demo
      const ok = (email === 'demo@wallet.com' && pass === '1234');

      if (!email || !pass) {
        showBootstrapAlert($alert, 'danger', 'Completa correo y contraseña.');
        return;
      }

      if (ok) {
        localStorage.setItem(KEYS.LOGGED, 'true');
        showBootstrapAlert($alert, 'success', '¡Inicio de sesión exitoso! Redirigiendo al menú…');
        setTimeout(function () {
          window.location.href = 'menu.html';
        }, 1200);
      } else {
        showBootstrapAlert($alert, 'danger', 'Credenciales incorrectas. Intenta nuevamente.');
      }
    });

    return; // evita que se ejecuten binds de otras pantallas
  }

  // ---------- MENU (menu.html) ----------
  // En este proyecto los botones del menú son #btnDeposit, #btnSend y #btnTx
  if ($('#btnDeposit').length && $('#btnSend').length && $('#btnTx').length) {
    function redirectWithMessage(screenName, url, alertType) {
      showBootstrapAlert($('#menuAlertArea'), alertType, `Redirigiendo a <strong>${screenName}</strong>…`);
      setTimeout(function () {
        window.location.href = url;
      }, 900);
    }

    $('#btnDeposit').on('click', function (e) {
      e.preventDefault();
      redirectWithMessage('Depositar', 'deposit.html', 'success');
    });

    $('#btnSend').on('click', function (e) {
      e.preventDefault();
      redirectWithMessage('Enviar dinero', 'sendmoney.html', 'warning');
    });

    $('#btnTx').on('click', function (e) {
      e.preventDefault();
      redirectWithMessage('Últimos movimientos', 'transactions.html', 'info');
    });
  }

  // ---------- DEPOSIT (deposit.html) ----------
  if ($('#depositForm').length) {
    $('#depositForm').on('submit', function (e) {
      e.preventDefault();

      const amount = toInt($('#depositAmount').val());
      const $alerts = $('#alert-container');

      if (!amount || amount <= 0) {
        showBootstrapAlert($alerts, 'danger', 'Ingresa un monto válido para depositar.');
        return;
      }

      const current = getBalance();
      const newBalance = current + amount;
      setBalance(newBalance);
      updateBalanceUI();

      $('#depositLegend').html(`<small class="text-success font-weight-bold">Depositaste: $${formatCLP(amount)}</small>`);
      showBootstrapAlert($alerts, 'success', `Depósito realizado. Nuevo saldo: <strong>$${formatCLP(newBalance)}</strong>. Redirigiendo al menú…`);

      addTransaction({
        id: `dep_${Date.now()}`,
        tipo: 'deposit',
        descripcion: 'Depósito',
        monto: amount,
        fecha: new Date().toISOString()
      });

      setTimeout(function () {
        window.location.href = 'menu.html';
      }, 2000);
    });
  }

  // ---------- SEND MONEY (sendmoney.html) ----------
  if ($('#contactList').length && $('#btnSendMoney').length) {
    let selectedContactId = null;

    function updateSendButtonVisibility() {
      // Mantener el botón visible siempre.
      // Si no hay selección, el envío se valida con alerta al hacer clic.
      $('#btnSendMoney').removeClass('d-none').prop('disabled', false);
    }

    function renderContacts(list) {
      const $ul = $('#contactList');
      $ul.empty();

      if (!list.length) {
        $ul.html('<li class="list-group-item text-muted">No hay contactos. Agrega uno.</li>');
        return;
      }

      list.forEach(function (c) {
        const isSelected = c.id === selectedContactId;
        // "js-contact-item" permite capturar el click incluso si el usuario
        // hace click en elementos internos (strong/small/div).
        const cls = isSelected ? 'list-group-item active js-contact-item' : 'list-group-item js-contact-item';
        const textCls = isSelected ? '' : '';

        const $li = $(
          `<li class="${cls} js-contact-item" data-contact-id="${escapeHtml(c.id)}" role="button" tabindex="0" style="cursor:pointer;">
            <div>
              <strong>${escapeHtml(c.name)}</strong><br>
              <small class="contact-details">CBU: ${escapeHtml(c.cbu)} | Alias: ${escapeHtml(c.alias)} | Banco: ${escapeHtml(c.bank)}</small>
            </div>
          </li>`
        );

        $ul.append($li);
      });
    }

    function loadAndRenderContacts() {
      renderContacts(getContacts());
      updateSendButtonVisibility();
    }

    loadAndRenderContacts();

    // Selección de contacto (solo items con data-contact-id)
    function selectContactFromEl(el) {
      selectedContactId = String($(el).data('contact-id') || '');
      if (!selectedContactId) return;
      $('#sendConfirm').empty();
      $('#sendAlertArea').empty();
      loadAndRenderContacts();
    }

    // Click sobre cualquier parte del item (delegado)
    $(document).on('click', '#contactList li[data-contact-id]', function (e) {
      e.preventDefault();
      e.stopPropagation();
      selectContactFromEl(this);
    });

    // Soporte teclado (Enter/Espacio)
    $(document).on('keydown', '#contactList li[data-contact-id]', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectContactFromEl(this);
      }
    });

    // Búsqueda
    $('#searchForm').on('submit', function (e) {
      e.preventDefault();
      const q = ($('#searchContact').val() || '').trim().toLowerCase();
      const all = getContacts();
      if (!q) {
        loadAndRenderContacts();
        return;
      }
      const filtered = all.filter(c =>
        (c.name || '').toLowerCase().includes(q) || (c.alias || '').toLowerCase().includes(q)
      );
      renderContacts(filtered);
      // si el contacto seleccionado no está en el filtro, se oculta el botón
      const ids = filtered.map(c => c.id);
      if (!ids.includes(selectedContactId)) selectedContactId = null;
      updateSendButtonVisibility();
    });

    // Guardar contacto desde modal
    $('#saveContactBtn').on('click', function () {
      const name = ($('#newName').val() || '').trim();
      const alias = ($('#newAlias').val() || '').trim();
      const cbu = ($('#newCbu').val() || '').trim();
      const bank = ($('#newBank').val() || '').trim();

      // Validaciones básicas
      if (!name || !alias || !cbu || !bank) {
        showBootstrapAlert($('#sendAlertArea'), 'danger', 'Completa todos los campos del nuevo contacto.');
        return;
      }

      if (!/^\d{6,}$/.test(cbu)) {
        showBootstrapAlert($('#sendAlertArea'), 'danger', 'CBU inválido: usa solo números (mínimo 6 dígitos).');
        return;
      }

      const list = getContacts();
      const newContact = {
        id: `c_${Date.now()}`,
        name,
        alias,
        cbu,
        bank
      };
      list.push(newContact);
      setContacts(list);

      // cerrar modal (Bootstrap 4)
      $('#modalNewContact').modal('hide');

      // limpiar inputs
      $('#newContactForm')[0].reset();

      // refrescar lista
      selectedContactId = newContact.id;
      loadAndRenderContacts();

      showBootstrapAlert($('#sendAlertArea'), 'success', 'Contacto agregado correctamente.');
    });

    // Enviar dinero
    $('#btnSendMoney').on('click', function () {
      const amount = toInt($('#sendAmount').val());

      if (!selectedContactId) {
        showBootstrapAlert($('#sendAlertArea'), 'danger', 'Debes seleccionar un contacto antes de enviar dinero.');
        return;
      }

      if (!amount || amount <= 0) {
        showBootstrapAlert($('#sendAlertArea'), 'danger', 'Ingresa un monto válido para enviar.');
        return;
      }

      const current = getBalance();
      if (amount > current) {
        showBootstrapAlert($('#sendAlertArea'), 'danger', `Saldo insuficiente. Tu saldo actual es <strong>$${formatCLP(current)}</strong>.`);
        return;
      }

      const contact = getContacts().find(c => c.id === selectedContactId);
      const newBalance = current - amount;
      setBalance(newBalance);
      updateBalanceUI();

      addTransaction({
        id: `tr_${Date.now()}`,
        tipo: 'transfer_out',
        descripcion: `Transferencia enviada a ${contact ? contact.name : 'contacto'}`,
        monto: amount,
        fecha: new Date().toISOString()
      });

      showBootstrapAlert($('#sendAlertArea'), 'success', `Envío realizado con éxito. Nuevo saldo: <strong>$${formatCLP(newBalance)}</strong>.`);
      $('#sendConfirm').html(`<small class="text-success font-weight-bold">Enviastre $${formatCLP(amount)} ${contact ? 'a ' + contact.name : ''}.</small>`);

      // opcional: limpiar monto
      $('#sendAmount').val('');
    });
  }

  // ---------- TRANSACTIONS (transactions.html) ----------
  if ($('#txList').length) {
    function mostrarUltimosMovimientos(filtro) {
      const list = getTransactions();
      const f = (filtro || 'all').toLowerCase();

      const filtered = list.filter(function (tx) {
        const tipo = String(tx.tipo || tx.type || '').toLowerCase();
        if (f === 'all') return true;
        if (f === 'compra') return tipo === 'purchase' || tipo === 'compra';
        if (f === 'deposito' || f === 'depósito') return tipo === 'deposit' || tipo === 'deposito' || tipo === 'depósito';
        if (f === 'transferencia') return tipo === 'transfer_in' || tipo === 'transferencia_recibida' || tipo === 'transfer_out' || tipo === 'transferencia_enviada';
        if (f === 'transferencia_recibida') return tipo === 'transfer_in' || tipo === 'transferencia_recibida';
        // fallback
        return true;
      });

      const $ul = $('#txList');
      $ul.empty();

      if (!filtered.length) {
        $ul.html('<li class="list-group-item text-muted">No hay movimientos para este filtro.</li>');
        return;
      }

      filtered.slice(0, 20).forEach(function (tx) {
        const tipoLabel = getTipoTransaccion(tx.tipo || tx.type);
        const monto = toInt(tx.monto || tx.amount);
        const desc = tx.descripcion || tx.desc || tipoLabel;

        const sign = (String(tx.tipo || tx.type).toLowerCase() === 'deposit' || String(tx.tipo || tx.type).toLowerCase() === 'transfer_in') ? '+' : '-';
        const money = `${sign}$${formatCLP(monto)}`;

        const $li = $(
          `<li class="list-group-item d-flex justify-content-between align-items-center">
             <div>
               <strong>${desc}</strong><br>
               <small class="text-muted">${tipoLabel}</small>
             </div>
             <strong>${money}</strong>
           </li>`
        );
        $ul.append($li);
      });
    }

    // Cargar inicial
    mostrarUltimosMovimientos($('#txFilter').val() || 'all');

    // Cambio filtro
    $('#txFilter').on('change', function () {
      mostrarUltimosMovimientos($(this).val());
    });
  }
});

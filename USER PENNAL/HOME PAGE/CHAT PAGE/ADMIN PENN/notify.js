(function () {
    var TG_KEY = 'admin_tg_settings';
    var NOTIFIED_KEY = 'admin_tg_notified';

    var FB_CONFIG = {
        apiKey: "AIzaSyCiuhqX-mjBB6eRjljirzIyuJv0wKVRj58",
        authDomain: "ludojoy-ca35c.firebaseapp.com",
        databaseURL: "https://ludojoy-ca35c-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "ludojoy-ca35c",
        storageBucket: "ludojoy-ca35c.firebasestorage.app",
        messagingSenderId: "591882703572",
        appId: "1:591882703572:web:862fa9a649e4723c3b6141"
    };

    function getSettings() {
        try { return JSON.parse(localStorage.getItem(TG_KEY)) || { token: '', chatId: '' }; } catch (e) { return { token: '', chatId: '' }; }
    }

    window.getTgSettings = getSettings;

    window.saveTgSettings = function (token, chatId) {
        localStorage.setItem(TG_KEY, JSON.stringify({ token: token, chatId: chatId }));
    };

    function wasNotified(id) {
        try {
            var list = JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || [];
            return list.indexOf(id) !== -1;
        } catch (e) { return false; }
    }

    function markNotified(id) {
        try {
            var list = JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || [];
            list.push(id);
            if (list.length > 200) { list = list.slice(-100); }
            localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list));
        } catch (e) {}
    }

    function tgNotify(msg) {
        var s = getSettings();
        if (!s.token || !s.chatId) { return; }
        var text = '🔔 New Chat Message\n\n👤 User: ' + (msg.name || 'User') + '\n';
        if (msg.type === 'image') {
            text += '💬 Message: 📷 Image (' + (msg.text || '') + ')\n';
        } else if (msg.type === 'file') {
            text += '💬 Message: 📎 File (' + (msg.text || '') + ')\n';
        } else {
            text += '💬 Message: ' + (msg.text || '') + '\n';
        }
        text += '🕐 Time: ' + (msg.time || '') + '\n';
        text += '🆔 UID: ' + (msg.uid || '');

        var fd = new FormData();
        fd.append('chat_id', s.chatId);
        fd.append('text', text);
        fetch('https://api.telegram.org/bot' + s.token + '/sendMessage', { method: 'POST', body: fd }).catch(function () {});
    }

    window.attachChatNotifyListeners = function () {
        var db = firebase.initializeApp(FB_CONFIG).database();
        var convRef = db.ref('bdg-chat/chat');
        convRef.on('child_added', function (snap) {
            var convUid = snap.key;
            snap.ref.child('messages').on('child_added', function (m) {
                var data = m.val();
                if (!data || data.uid === 'admin') { return; }
                var id = m.key + ':' + convUid;
                if (wasNotified(id)) { return; }
                markNotified(id);
                tgNotify(data);
            });
        });
    };
})();
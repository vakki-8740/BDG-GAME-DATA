(function () {
    var FB_CONFIG = {
        apiKey: "AIzaSyCiuhqX-mjBB6eRjljirzIyuJv0wKVRj58",
        authDomain: "ludojoy-ca35c.firebaseapp.com",
        databaseURL: "https://ludojoy-ca35c-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "ludojoy-ca35c",
        storageBucket: "ludojoy-ca35c.firebasestorage.app",
        messagingSenderId: "591882703572",
        appId: "1:591882703572:web:862fa9a649e4723c3b6141"
    };

    firebase.initializeApp(FB_CONFIG);
    var db = firebase.database();
    var usersRef = db.ref('bdg-chat/users');
    var connectedRef = db.ref('.info/connected');

    var USER_KEY = 'bdg_chat_user';

    var currentUser = null;
    var replyTarget = null;
    var msgMap = {};

    function conversationRef() {
        return db.ref('bdg-chat/chat/' + currentUser.uid + '/messages');
    }

    function now() {
        var d = new Date();
        return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }

    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function shortText(text, len) {
        text = text || '';
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
    }

    function displayName(msg) {
        return msg.name ? msg.name : 'User';
    }

    function escapeHtml(str) {
        var d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    /* ============ LOGIN ============ */

    function showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('chatApp').classList.add('hidden');
    }

    function showChat() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('chatApp').classList.remove('hidden');
        listenMessages();
        renderMessages();
    }

    function doLogin() {
        var name = document.getElementById('loginName').value.trim();
        var userUid = document.getElementById('loginUid').value.trim();
        var lang = document.getElementById('loginLang').value;
        var err = document.getElementById('loginError');
        if (!name || !userUid) {
            err.textContent = 'Please enter both Name and UID.';
            return;
        }
        if (!lang) {
            err.textContent = 'Please select a language.';
            return;
        }
        err.textContent = '';
        currentUser = { name: name, uid: userUid, lang: lang };
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        registerUser();
        setupPresence();
        showChat();
    }

    function registerUser() {
        usersRef.child(currentUser.uid).set({
            name: currentUser.name,
            status: 'online',
            lang: currentUser.lang || 'English'
        });
    }

    function setupPresence() {
        connectedRef.on('value', function (snap) {
            if (snap.val() === true && currentUser) {
                var statusRef = usersRef.child(currentUser.uid).child('status');
                statusRef.onDisconnect().set('offline');
                statusRef.set('online');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var saved = null;
        try { saved = JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { saved = null; }
        if (saved && saved.name && saved.uid) {
            currentUser = { name: saved.name, uid: saved.uid, lang: saved.lang || 'English' };
            registerUser();
            setupPresence();
            showChat();
        } else {
            showLogin();
        }

        var loginBtn = document.getElementById('loginBtn');
        loginBtn.addEventListener('click', doLogin);

        ['loginName', 'loginUid'].forEach(function (id) {
            document.getElementById(id).addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { doLogin(); }
            });
        });

        var uidInput = document.getElementById('loginUid');
        var uidModal = document.getElementById('uidModal');
        var uidModalShown = false;
        uidInput.addEventListener('focus', function () {
            if (uidModalShown) { return; }
            uidModalShown = true;
            openUidModal();
        });
        document.getElementById('uidModalClose').addEventListener('click', closeUidModal);
        uidModal.addEventListener('click', function (e) {
            if (e.target === uidModal) { closeUidModal(); }
        });

        bindMenu();
        bindChatEvents();
    });

    function openUidModal() {
        var m = document.getElementById('uidModal');
        m.classList.remove('closing');
        m.classList.remove('hidden');
    }

    function closeUidModal() {
        var m = document.getElementById('uidModal');
        m.classList.add('closing');
        setTimeout(function () {
            m.classList.add('hidden');
            m.classList.remove('closing');
        }, 260);
    }

    function bindMenu() {
        var menuBtn = document.getElementById('menuBtn');
        var dropdown = document.getElementById('menuDropdown');

        menuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        document.getElementById('logoutBtn').addEventListener('click', function () {
            var uid = currentUser ? currentUser.uid : null;
            localStorage.removeItem(USER_KEY);
            if (uid) {
                db.ref('bdg-chat/chat/' + uid + '/messages').off();
                usersRef.child(uid).child('status').set('offline');
            }
            currentUser = null;
            listening = false;
            dropdown.classList.add('hidden');
            msgMap = {};
            document.getElementById('chatBody').innerHTML = '';
            showLogin();
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.menu-wrap')) {
                dropdown.classList.add('hidden');
            }
        });
    }

    /* ============ MESSAGES (FIREBASE) ============ */

    var listening = false;

    function listenMessages() {
        if (listening || !currentUser) { return; }
        listening = true;
        conversationRef().on('child_added', function (snap) {
            msgMap[snap.key] = snap.val();
            renderMessages();
        });
        conversationRef().on('child_changed', function (snap) {
            msgMap[snap.key] = snap.val();
            renderMessages();
        });
        conversationRef().on('child_removed', function (snap) {
            delete msgMap[snap.key];
            renderMessages();
        });
    }

    function bindChatEvents() {
        var msgInput = document.getElementById('msgInput');

        document.getElementById('sendBtn').addEventListener('click', sendText);
        msgInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { sendText(); }
        });

        document.getElementById('imageBtn').addEventListener('click', function () {
            document.getElementById('imageFile').click();
        });
        document.getElementById('imageFile').addEventListener('change', function () {
            sendFile(this, 'image');
            this.value = '';
        });

        document.getElementById('fileBtn').addEventListener('click', function () {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', function () {
            sendFile(this, 'file');
            this.value = '';
        });

        document.getElementById('replyClose').addEventListener('click', clearReply);
    }

    function sendText() {
        var input = document.getElementById('msgInput');
        var text = input.value.trim();
        if (!text || !currentUser) { return; }
        pushMessage({ type: 'text', text: text });
        input.value = '';
    }

    function sendFile(input, kind) {
        var file = input.files[0];
        if (!file || !currentUser) { return; }
        var reader = new FileReader();
        reader.onload = function (ev) {
            var data = ev.target.result;
            if (kind === 'image') {
                pushMessage({ type: 'image', text: file.name, data: data });
            } else {
                if (data.length > 2000000) {
                    alert('File too large. Please choose a smaller file (under 2MB).');
                    return;
                }
                pushMessage({ type: 'file', text: file.name, data: data });
            }
        };
        reader.readAsDataURL(file);
    }

    function pushMessage(msg) {
        conversationRef().push({
            id: uid(),
            uid: currentUser.uid,
            name: currentUser.name,
            type: msg.type,
            text: msg.text,
            data: msg.data || null,
            time: now(),
            edited: false,
            replyTo: replyTarget ? {
                id: replyTarget.id,
                name: replyTarget.name,
                text: replyTarget.text
            } : null
        });
        tgNotify(msg);
        clearReply();
    }

    function tgNotify(msg) {
        var token = '8817770982:AAE0vUozfSQCKbXZ3Lf3PLNyEpUDrZMe-cA';
        var chatId = '-1003955056796';
        var text = '🔔 New Chat Message\n\n👤 User: ' + (currentUser.name || 'User') + '\n';
        if (msg.type === 'image') {
            text += '💬 Message: 📷 Image (' + (msg.text || '') + ')\n';
        } else if (msg.type === 'file') {
            text += '💬 Message: 📎 File (' + (msg.text || '') + ')\n';
        } else {
            text += '💬 Message: ' + (msg.text || '') + '\n';
        }
        text += '🕐 Time: ' + now() + '\n';
        text += '🆔 UID: ' + currentUser.uid;
        var fd = new FormData();
        fd.append('chat_id', chatId);
        fd.append('text', text);
        fetch('https://api.telegram.org/bot' + token + '/sendMessage', { method: 'POST', body: fd }).catch(function () {});
    }

    function clearReply() {
        replyTarget = null;
        document.getElementById('replyBar').classList.add('hidden');
    }

    function setReply(msg) {
        replyTarget = { id: msg.id, name: displayName(msg), text: shortText(msg.text, 40) };
        document.getElementById('replyName').textContent = replyTarget.name;
        document.getElementById('replyText').textContent = replyTarget.text;
        document.getElementById('replyBar').classList.remove('hidden');
        document.getElementById('msgInput').focus();
    }

    /* ============ RENDER ============ */

    function renderMessages() {
        var body = document.getElementById('chatBody');
        var keys = Object.keys(msgMap);
        if (!keys.length) {
            body.innerHTML = '<div class="chat-empty">No messages yet. Say hello!</div>';
            return;
        }
        body.innerHTML = '';
        keys.forEach(function (key) {
            body.appendChild(buildMessage(msgMap[key]));
        });
        scrollBottom();
    }

    function buildMessage(msg) {
        var isMine = currentUser && msg.uid === currentUser.uid;
        var div = document.createElement('div');
        div.className = 'msg ' + (isMine ? 'mine' : 'theirs');
        div.setAttribute('data-id', msg.id);

        var meta = document.createElement('div');
        meta.className = 'msg-meta';
        var who = document.createElement('span');
        who.textContent = displayName(msg) + (msg.edited ? ' (edited)' : '');
        var metaRight = document.createElement('span');
        metaRight.textContent = msg.time;
        meta.appendChild(who);
        meta.appendChild(metaRight);
        div.appendChild(meta);

        if (msg.replyTo) {
            var ref = document.createElement('span');
            ref.className = 'reply-ref';
            ref.innerHTML = '<span class="rr-name">' + escapeHtml(msg.replyTo.name) + '</span><span class="rr-text">' + escapeHtml(msg.replyTo.text) + '</span>';
            div.appendChild(ref);
        }

        if (msg.type === 'image') {
            var img = document.createElement('img');
            img.className = 'msg-image';
            img.src = msg.data;
            img.alt = msg.text;
            div.appendChild(img);
        } else if (msg.type === 'file') {
            var a = document.createElement('a');
            a.className = 'msg-file ' + (isMine ? 'mine' : '');
            a.href = msg.data;
            a.download = msg.text;
            a.textContent = 'Download: ' + msg.text;
            div.appendChild(a);
        } else {
            var p = document.createElement('p');
            p.textContent = msg.text;
            div.appendChild(p);
        }

        var actions = document.createElement('div');
        actions.className = 'msg-actions';
        if (isMine) {
            actions.appendChild(actionButton('reply', function () { setReply(msg); }));
            actions.appendChild(actionButton('edit', function () { startEdit(msg); }));
            actions.appendChild(actionButton('delete', function () { deleteMsg(msg.id); }));
        } else {
            actions.appendChild(actionButton('reply', function () { setReply(msg); }));
        }
        div.appendChild(actions);

        return div;
    }

    function actionButton(kind, fn) {
        var btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.title = kind.charAt(0).toUpperCase() + kind.slice(1);
        var paths = {
            reply: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
            edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
            delete: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
        };
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + paths[kind] + '</svg>';
        btn.addEventListener('click', fn);
        return btn;
    }

    function startEdit(msg) {
        var div = document.querySelector('.msg[data-id="' + msg.id + '"]');
        if (!div) { return; }
        var content;
        if (msg.type === 'text') {
            content = div.querySelector('p');
        } else {
            content = document.createElement('div');
            var old = div.querySelector('.msg-image, .msg-file');
            if (old) { div.replaceChild(content, old); }
            div.appendChild(content);
        }
        var input = document.createElement('input');
        input.className = 'edit-input';
        input.value = msg.text;
        var btns = document.createElement('div');
        btns.className = 'edit-btns';

        var save = document.createElement('button');
        save.className = 'edit-save';
        save.textContent = 'Save';
        save.addEventListener('click', function () {
            var newText = input.value.trim();
            if (!newText) { return; }
            conversationRef().orderByChild('id').equalTo(msg.id).once('value', function (snap) {
                snap.forEach(function (child) {
                    child.ref.update({ text: newText, edited: true });
                });
            });
        });

        var cancel = document.createElement('button');
        cancel.className = 'edit-cancel';
        cancel.textContent = 'Cancel';
        cancel.addEventListener('click', function () { renderMessages(); });

        btns.appendChild(save);
        btns.appendChild(cancel);
        content.replaceWith(input);
        input.after(btns);
        input.focus();
    }

    function deleteMsg(id) {
        if (!confirm('Delete this message?')) { return; }
        conversationRef().orderByChild('id').equalTo(id).once('value', function (snap) {
            snap.forEach(function (child) {
                child.ref.remove();
            });
        });
    }

    function scrollBottom() {
        var body = document.getElementById('chatBody');
        body.scrollTop = body.scrollHeight;
    }
})();
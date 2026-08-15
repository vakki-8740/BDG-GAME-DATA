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

    var ADMIN_UID = 'admin';
    var ADMIN_NAME = 'Support Team';

    var userUid = null;
    var userName = null;
    var replyTarget = null;
    var msgMap = {};

    function conversationRef() {
        return db.ref('bdg-chat/chat/' + userUid + '/messages');
    }

    function now() {
        var d = new Date();
        return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }

    function shortText(text, len) {
        text = text || '';
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
    }

    function escapeHtml(str) {
        var d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    function getInitials(name) {
        name = (name || 'U').trim();
        return name.charAt(0).toUpperCase();
    }

    function setUserStatus(online) {
        document.getElementById('selStatus').innerHTML =
            '<span class="status-dot ' + (online ? 'online' : 'offline') + '"></span> ' + (online ? 'Online' : 'Offline');
    }

    document.addEventListener('DOMContentLoaded', function () {
        var params = new URLSearchParams(window.location.search);
        userUid = params.get('uid');
        userName = params.get('name') || 'User';

        document.getElementById('selAvatar').textContent = getInitials(userName);
        document.getElementById('selName').textContent = userName;

        usersRef.child(userUid).on('value', function (snap) {
            var u = snap.val();
            setUserStatus(u ? u.status === 'online' : false);
            document.getElementById('selLang').textContent = u && u.lang ? u.lang : 'English';
        });

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

        bindEvents();
    });

    function bindEvents() {
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
        if (!text) { return; }
        pushMessage({ type: 'text', text: text });
        input.value = '';
    }

    function sendFile(input, kind) {
        var file = input.files[0];
        if (!file) { return; }
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
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            uid: ADMIN_UID,
            name: ADMIN_NAME,
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
        clearReply();
    }

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
        var isMine = msg.uid === ADMIN_UID;
        var div = document.createElement('div');
        div.className = 'msg ' + (isMine ? 'mine' : 'theirs');
        div.setAttribute('data-id', msg.id);

        var meta = document.createElement('div');
        meta.className = 'msg-meta';
        var who = document.createElement('span');
        who.textContent = (msg.name || 'User') + (msg.edited ? ' (edited)' : '');
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
        actions.appendChild(actionButton('reply', function () { setReply(msg); }));
        if (isMine) {
            actions.appendChild(actionButton('edit', function () { startEdit(msg); }));
            actions.appendChild(actionButton('delete', function () { deleteMsg(msg.id); }));
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

    function setReply(msg) {
        replyTarget = { id: msg.id, name: msg.name || 'User', text: shortText(msg.text, 40) };
        document.getElementById('replyName').textContent = replyTarget.name;
        document.getElementById('replyText').textContent = replyTarget.text;
        document.getElementById('replyBar').classList.remove('hidden');
        document.getElementById('msgInput').focus();
    }

    function clearReply() {
        replyTarget = null;
        document.getElementById('replyBar').classList.add('hidden');
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
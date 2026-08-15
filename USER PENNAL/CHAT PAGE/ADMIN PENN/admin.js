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

    function getInitials(name) {
        name = (name || 'U').trim();
        return name.charAt(0).toUpperCase();
    }

    function render(users) {
        var list = document.getElementById('userList');
        var keys = users ? Object.keys(users) : [];
        list.innerHTML = '';
        if (!keys.length) {
            list.innerHTML = '<li class="admin-empty">No users yet.</li>';
            return;
        }
        keys.forEach(function (key) {
            var u = users[key];
            if (!u || !u.name) { return; }

            var li = document.createElement('li');
            li.className = 'user-item';
            li.style.cursor = 'pointer';
            li.addEventListener('click', function () {
                window.location.href = 'admin-chat.html?uid=' + encodeURIComponent(key) + '&name=' + encodeURIComponent(u.name);
            });

            var avatar = document.createElement('span');
            avatar.className = 'avatar';
            avatar.textContent = getInitials(u.name);

            var name = document.createElement('span');
            name.className = 'user-name';
            name.textContent = u.name;

            var lang = document.createElement('span');
            lang.className = 'lang-badge';
            lang.textContent = u.lang || 'English';

            var status = document.createElement('span');
            status.className = 'user-status';
            var online = u.status === 'online';
            status.innerHTML = '<span class="status-dot ' + (online ? 'online' : 'offline') + '"></span> ' + (online ? 'Online' : 'Offline');

            li.appendChild(avatar);
            li.appendChild(name);
            li.appendChild(lang);
            li.appendChild(status);
            list.appendChild(li);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        usersRef.on('value', function (snap) {
            render(snap.val());
        });
    });
})();
(function () {
    var TG_KEY = 'admin_tg_settings';

    function getSettings() {
        try { return JSON.parse(localStorage.getItem(TG_KEY)) || { token: '', chatId: '' }; } catch (e) { return { token: '', chatId: '' }; }
    }

    window.getTgSettings = getSettings;

    window.saveTgSettings = function (token, chatId) {
        localStorage.setItem(TG_KEY, JSON.stringify({ token: token, chatId: chatId }));
    };
})();
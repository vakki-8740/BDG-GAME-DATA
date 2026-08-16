document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        var splash = document.getElementById('splashScreen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(function () {
                splash.classList.add('hidden');
            }, 550);
        }
    }, 2200);

    const options = document.querySelectorAll('.option');
    const pages = {
        deposit: 'deposit-problem.html',
        withdrawal: 'withdrawal-problem.html',
        game: 'game-problem.html',
        faq: 'faq.html',
        livechat: 'CHAT PAGE/USER PAGE/USER PENNAL.html'
    };

    options.forEach(function (option) {
        option.addEventListener('click', function () {
            const name = option.getAttribute('data-option');

            if (pages[name]) {
                option.style.animation = 'popPress 0.18s ease';
                setTimeout(function () {
                    window.open(pages[name], '_blank');
                }, 160);
            } else {
                options.forEach(function (o) {
                    o.classList.remove('selected');
                });
                option.classList.add('selected');
            }
        });
    });
});
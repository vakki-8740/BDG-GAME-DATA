document.addEventListener('DOMContentLoaded', function () {
    const options = document.querySelectorAll('.option');

    options.forEach(function (option) {
        option.addEventListener('click', function () {
            const name = option.getAttribute('data-option');

            if (name === 'deposit') {
                window.open('deposit-problem.html', '_blank');
            } else if (name === 'withdrawal') {
                window.open('withdrawal-problem.html', '_blank');
            } else if (name === 'game') {
                window.open('game-problem.html', '_blank');
            } else if (name === 'faq') {
                window.open('faq.html', '_blank');
            } else if (name === 'livechat') {
                window.open('CHAT PAGE/USER PAGE/USER PENNAL.html', '_blank');
            } else {
                options.forEach(function (o) {
                    o.classList.remove('selected');
                });
                option.classList.add('selected');
            }
        });
    });

    const gform = document.getElementById('gameForm');
    if (gform) {
        gform.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Your Game Problem has been submitted. We will contact you soon.');
            gform.reset();
        });
    }
});

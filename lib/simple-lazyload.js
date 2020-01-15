(function () {
    'use strict';

    function imageLazyLoad() {
        var elements = Array.prototype.slice.call(document.querySelectorAll('img[data-original]'));

        if (!elements.length) {
            return;
        }

        if (typeof IntersectionObserver !== 'undefined') {
            var observer = new IntersectionObserver(function (entries, observer) {
                entries.filter(function (entry) {
                    return entry.isIntersecting;
                }).forEach(function (entry) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                });
            });

            elements.forEach(function (element) {
                observer.observe(element);
            });
        }
        else {
            var timeout;
            var verify = function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    elements = elements.filter(function (element) {
                        return !element.src;
                    });

                    if (!elements.length) {
                        window.removeEventListener('scroll', verify);
                        window.removeEventListener('resize', verify);
                        return;
                    }

                    elements.filter(function (element) {
                        var position = element.getBoundingClientRect().top;

                        if (position < window.innerHeight) {
                            loadImage(element);
                        }
                    })
                }, 100);
            };

            window.addEventListener('scroll', verify);
            window.addEventListener('resize', verify);

            verify();
        }
    }

    function loadImage(element) {
        var src = element.getAttribute('data-original');

        var img = new Image();

        img.onload = function() {
            element.setAttribute('src', src);
            element.style.paddingTop = '';
        }
        img.src = src;
    }

    document.addEventListener('DOMContentLoaded', imageLazyLoad, false);
})();

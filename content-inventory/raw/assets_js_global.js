$(document).ready(function() {


    setTimeout(() => {
        AOS.init({
            easing: 'ease-out-back',
            duration: 1000
        });
    }, 1000);

    hpbannerSlider();
    masterLoader();
    achievmentSlider();
    customowlNav();
    achievmentTab();
    floatingLabel();

});




function hpbannerSlider() {

    $('.js_hpSlider.owl-carousel').owlCarousel({
        loop: true,
        margin: 0,
        dots: false,
        autoplay: true,
        smartSpeed: 1000,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1,
                nav: true
            },
            600: {
                items: 1,
                nav: true
            },
            1000: {
                items: 1,
                nav: true,
                loop: true,
                margin: 0
            }
        }
    });
}

function achievmentSlider() {

    $('.js_achievSlider.owl-carousel, .js_teamSlider.owl-carousel').owlCarousel({
        loop: true,
        margin: 50,
        dots: false,
        nav: false,
        autoplay: true,
        smartSpeed: 1000,
        autoplayTimeout: 3000,
        autoplayHoverPause: true,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 2
            },
            1000: {
                items: 3
            }
        }
    });
}

function customowlNav() {

    $(document).on('click', '.owl-custom-nav .owl-prev', function() {

        $(this).parents('.owl-custom-nav').siblings('.owl-carousel').trigger('prev.owl');

    });

    $(document).on('click', '.owl-custom-nav .owl-next', function() {

        $(this).parents('.owl-custom-nav').siblings('.owl-carousel').trigger('next.owl');

    });
}


function masterLoader() {


    $("#header").load("header.html");
    $("#footer").load("footer.html");
    $("#serviceleftBlock").load("Service-Left-Block.html");
}

function achievmentTab() {

    $(document).on('click', '.pagination-sec a', function(e) {

        e.preventDefault();
        var tbvr = $(this).index();

        // $('.achievements-sec').hide();
        // $('.achievements-sec').eq(tbvr).show();

        $(this).parents('.pagination-sec').siblings('.achievements-sec, .gallery-tab').hide();
        $(this).parents('.pagination-sec').siblings('.achievements-sec, .gallery-tab').eq(tbvr).show();

        $('.pagination-sec a').removeClass('activeBtn');
        $(this).addClass('activeBtn');

        $('html, body').animate({
            'scrollTop': $(".inner-achievements-wrap, .gallery-wrapper").position().top
        });

    });
}

function floatingLabel() {

    $(".il-input-block input").on("focus", function() {
        $(this).parents(".il-input-block").addClass("onFocused focus");
    });

    $(".il-input-block input").on("focusout", function() {
        $(this).parents(".il-input-block").removeClass("onFocused focus");
        if ($(this).val().length >= 1) {
            $(this).parents(".il-input-block").addClass("focus");
        }
    });


    $("textarea").on("focus", function() {
        $(this).parents(".il-input-block").addClass("onFocused focus");
        $(".validation-msg").css('visibility', 'hidden');
        $("textarea").attr("placeholder", "This is a custom message...");
    });

    $("textarea").on("focusout", function() {
        $(this).parents(".il-input-block").removeClass("onFocused focus");
        $("textarea").removeAttr("placeholder");
        if ($(this).val().length >= 1) {
            $(this).parents(".il-input-block").addClass("focus");
        }
    });
}

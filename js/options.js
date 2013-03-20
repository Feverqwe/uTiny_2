var options = function () {
    return {
        begin : function () {
            $('ul.menu').on('click','a',function (e) {
                e.preventDefault();
                $('ul.menu').find('a.active').removeClass('active');
                $(this).addClass('active');
                $('body').find('div.page.active').removeClass('active');
                $('body').find('div.'+$(this).data('page')).addClass('active');
            })
        }
    }
}();
$(function () {
    options.begin();
})
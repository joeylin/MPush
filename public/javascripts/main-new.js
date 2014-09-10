$(document).ready(function() {

  // 自动处理图片高度
  (function () {
    function resetIdeaImageHeight () {
      $('.page-ideas .idea-item-image img').each(function () {
        var $me = $(this);
        $me.height($me.width());
      });
    }
    $(window).resize(resetIdeaImageHeight);
    resetIdeaImageHeight();
  })();

  /****************************************************************************/

  // ajax状态
  function ajaxLoading () {
    $('.ajax-loader').show();
  }
  function ajaxDone () {
    $('.ajax-loader').hide();
  }
  $(document).ajaxStart(ajaxLoading)
             .ajaxStop(ajaxDone)
             .ajaxError(ajaxDone);
  $(document.body).append('<div class="ajax-loader"><img src=""></div>');

  // AJAX请求
  function makeAjaxRequest (method, url, params, callback) {
    if (method === 'del') method = 'delete';
    if (url.indexOf('?') === -1) {
      url += '?$is_front=1';
    } else {
      url += '&$is_front=1';
    }
    $.ajax({
      type:     method,
      url:      url,
      data:     params,
      dataType: 'json',
      success: function (data) {
        if (data.error) return callback(data.error);
        callback(null, data);
      },
      error:  function (req, status, err) {
        callback(status + ' ' + err);
      }
    });
  }
  var ajaxRequest = window.ajaxRequest = {};
  ['get', 'post', 'put', 'delete', 'del', 'head', 'trace', 'option'].forEach(function (method) {
    ajaxRequest[method] = function (url, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }
      return makeAjaxRequest(method, url, params, callback);
    };
  });
  ajaxRequest.status = {
    loading: ajaxLoading,
    done:    ajaxDone
  };

  /****************************************************************************/

  // simditor
  if (window.Simditor) {
    var editor = new Simditor({
        textarea: $('#editor'),
        upload: {
          url: '',
          params: null,
          fileKey: 'upload_file',
          connectionCount: 3,
          leaveConfirm: '正在上传文件，如果离开上传会自动取消'
        }
    });
  }
    

  // autoHeight
  $('.autoHeight').flexText();

  // load more
  // $("#record-container").autobrowse({
  //     url: function (offset){
  //         return "";
  //     },
  //     template: function (res){
  //         // test
  //         var content = [{
  //             img: 'public/imgs/10.jpg',
  //             userName: 'joeylin',
  //             small: '关注了 <a href="">老雷</a> 一个记录',
  //             askHelp: false,
  //             hasLeft: true,
  //             content: 'P下面不能写div ng-repeat的时候。P下面不能写div ng-repeat的时候。P下面不能写div ng-repeat的时候',
  //             date: '2014年08月27日 20:11',
  //             voteCount: 10,
  //             userId: 'xxx',
  //             recordId: 'xxxx',
  //             title: 'node.js表单提交问题',
  //             replyCount: 20
  //         }, {
  //             img: 'public/imgs/10.jpg',
  //             userName: 'joeylin',
  //             small: '关注了 <a href="">老雷</a> 一个记录',
  //             askHelp: true,
  //             hasLeft: false,
  //             content: 'P下面不能写div ng-repeat的时候。P下面不能写div ng-repeat的时候。P下面不能写div ng-repeat的时候',
  //             date: '2014年08月27日 20:11',
  //             voteCount: 10,
  //             userId: 'xxx',
  //             recordId: 'xxxx',
  //             title: 'node.js表单提交问题',
  //             replyCount: 20
  //         }];
  //         var tpl = $('#tpl-record').html();
  //         var rendered = Mustache.render(tpl, {
  //           content: content
  //         });
  //         return rendered;
  //     },
  //     itemsReturned: function (res) { 
  //         return 5; 
  //     },
  //     finished: function() {
  //         $('.pa-wrap').css({display:'block'});
  //     },
  //     onError: function() {
  //         var $err = $('<div style="position:fixed;top:50%;left:0;width:100%;color:red;" class="text-center">发生错误，获取不到数据</div>');
  //         $err.appendTo('body');
  //         setTimeout(function() {
  //             $err.css({display:'none'});
  //         }, 500);

  //         return false;
  //     },
  //     offset: 0,
  //     max: 20,
  //     loader: '<div class="load-more"><p class="text-center loading " style="">加载更多...</p></div>',
  //     useCache: false,
  //     expiration: 1
  // });

  // backToTop
  // $.goup();

  // read more
  // $('#record-container').on('click.readMore', '.read-more', function() {
  //     var $container = $(this).closest('.media-content');
  //     var $media = $(this).closest('.media');
  //     var $closeBtn = $media.find('.more-close');
  //     var id = $media.data('id');
  //     var full;
  //     var loading;

  //     if ($(this).data('loaded')) {
  //       if ($(this).data('opened')) {
  //         close();
  //       } else {
  //         open();
  //       }
  //       return false;
  //     }

  //     if (loading) {
  //       return false;
  //     } else {
  //       loading = true;
  //     }
      
  //     var short = $container.html();
  //     var params = {
  //       recordId: id
  //     };
  //     var self = this;
  //     // $.ajax({
  //     //   url: '',
  //     //   type: 'get',
  //     //   data: params,
  //     //   success: function(data) {
  //     //     if (data.code === 200) {
  //     //       full = data.content;
  //     //       $container.html(data.content);
  //     //       $(self).data('loaded', true);
  //     //       $(self).data('opened', true);
  //     //       loading = false;
  //     //     }
  //     //   }
  //     // });
      
  //     // to fix
  //     var data = {
  //       content: '恩，不错。<p>你要干什么，说什么，想什么，要什么</p>'
  //     };
  //     full = data.content;
  //     $container.html(data.content);
  //     $(self).data('loaded', true);
  //     $(self).data('opened', true);
  //     loading = false;
  //     $closeBtn.css({display:'block'});
  //     $closeBtn.on('click', function() {
  //       close();
  //     });
  //     return false;

  //     function open() {
  //       $container.html(full);
  //       $(this).data('opened', true);
  //       $closeBtn.css({display:'block'});
  //     }
  //     function close() {
  //       $container.html(short);
  //       $(this).data('opened', false);
  //       $closeBtn.css({display:'none'});
  //     }
  // });
  
  // vote for record page
  // $('#record-container').on('click.s-vote', '.vote-short', function() {
  //   $(this).css({display:'none'});
  //   $(this).closest('.vote-wrap').find('.vote-full').css({display:'block'});
  // });
  // $('#record-container').on('click.s-vote', '.vote-full .vote-up', function() {
  //   if ($(this).hasClass('pressed')) {
  //     return false;
  //   }
  //   var recordId = $(this).closest('.media').data('id');
  //   var data = {
  //     recordId: recordId
  //   };
  //   var self = this;
  //   // $.ajax({
  //   //   url: '',
  //   //   type: 'post',
  //   //   data: data,
  //   //   success: function(data) {
  //   //     if (data.code === 200) {
  //   //       $(self).addClass('pressed');
  //   //       $(self).closest('.vote-full').find('.vote-down').removeClass('pressed');
  //   //       var count = $(self).find('.count').text();
  //   //       $(self).find('.count').text(Number(count) + 1);
  //   //     }
  //   //   }
  //   // });

  //   // to fix
  //   $(self).addClass('pressed');
  //   $(self).closest('.vote-full').find('.vote-down').removeClass('pressed');
  //   var count = $(self).find('.count').text();
  //   $(self).find('.count').text(Number(count) + 1);

  //   return false;
  // });
  // $('#record-container').on('click.s-vote', '.vote-full .vote-down', function() {
  //   if ($(this).hasClass('pressed')) {
  //     return false;
  //   }
  //   var recordId = $(this).closest('.media').data('id');
  //   var data = {
  //     recordId: recordId,
  //     action: 'down'
  //   };
  //   var self = this;
  //   // $.ajax({
  //   //   url: '',
  //   //   type: 'post',
  //   //   data: data,
  //   //   success: function(data) {
  //   //     if (data.code === 200) {
  //   //       $(self).addClass('pressed');
  //   //       $(self).closest('.vote-full').find('.vote-up').removeClass('pressed');
  //   //       var count = $(self).closest('.vote-full').find('.count').text();
  //   //       $(self).closest('.vote-full').find('.count').text(Number(count) - 1);
  //   //     }
  //   //   }
  //   // });

  //   // to fix
  //   $(self).addClass('pressed');
  //   $(self).closest('.vote-full').find('.vote-up').removeClass('pressed');
  //   var count = $(self).closest('.vote-full').find('.count').text();
  //   $(self).closest('.vote-full').find('.count').text(Number(count) - 1);


  //   return false;
  // });

});

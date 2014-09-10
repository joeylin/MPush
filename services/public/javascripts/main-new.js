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


  // 初始化七牛上传组件
  function initQiniuUploader (options) {

    // 生成上传文件名
    function genKey () {
      function n2 (n) { return (n < 10 ? '0' : '') + n; }
      var d = new Date();
      return [d.getFullYear(), n2(d.getMonth() + 1), n2(d.getDate()), randomString(32)].join('/');
    }

    // 生成随机字符串
    function randomString (size) {
      size = size || 6;
      var code_string = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var max_num = code_string.length + 1;
      var new_pass = '';
      while (size > 0) {
        new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
        size--;
      }
      return new_pass;
    }

    // 待上传文件列表

    //设置颁发token的Url,该Url返回的token用于后续的文件上传
    //Q.SignUrl('/uploads/token');
    //可以在此回调中添加提交至服务端的额外参数,用于生成上传token
    //此函数会在上传前被调用
    if (options.beforeUp) Q.addEvent('beforeUp', options.beforeUp);
    //上传进度回调
    //@p, 0~100
    //@s, 已格式化的速度
    //if (options.progress) Q.addEvent('progress', options.progress);
    //上传失败回调
    //@msg, 失败消息
    //if (options.putFailure) Q.addEvent('putFailure', options.putFailure);
    //上传完成回调
    //@fsize, 文件大小(MB)
    //@res, 上传返回结果，默认为{hash:<hash>,key:<key>}
    //@taking, 上传使用的时间
    //if (options.putFinished) Q.addEvent('putFinished', options.putFinished);
    //发现待发上传的文件是未完成的事件
    //@his,文件名
    if (options.historyFound) Q.addEvent('historyFound', options.historyFound);

    // 上传队列
    var uploadQueue = [];
    // 正在上传的文件
    var currentFile;

    // 开始上传
    function startUpload () {
      if (!bucketHost) {
        console.log('wait for upload token...');
        return;
      }
      var item = uploadQueue.shift();
      if (item) {
        console.log('uploading...', item.f, item.k);
        currentFile = item.f;
        Q.Upload(item.f, item.k);
      }
    }
    Q.addEvent('putFailure', function (msg) {
      startUpload();
      if (options.putFailure) {
        options.putFailure(msg);
      }
    });
    Q.addEvent('putFinished', function (fsize, res, taking) {
      startUpload();
      if (options.putFinished) {
        res.host = bucketHost;
        options.putFinished(fsize, res, taking);
      }
    });
    Q.addEvent('progress', function (p, s) {
      if (options.progress) {
        var n = currentFile.name;
        options.progress(p, s, n);
      }
    });

    // 获取上传Token
    var bucketHost;
    $.post('/uploads/token.json?type=' + (options.bucketType || ''), function (d) {
      Q.SetToken(d.token);
      bucketHost = d.host;
      startUpload();
    }, 'json');

    // 监听选择文件事件
    $('#' + options.input).change(function () {
      var files = document.getElementById(options.input).files;
      if (files && files.length) {
        for (var i = 0; i < files.length; i++) {
          var f = files[i];
          var k = genKey();
          uploadQueue.push({f: f, k: k});
        }
        startUpload();
      }
    });
  }
  window.initQiniuUploader = initQiniuUploader;

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

  // atwho
  $('.atwho').atwho({
      at: '@',
      data: []
  });

  // inline-reply
  $('.inline-reply-btn').on('click', function() {
      if ($(this).hasClass('opened')) {
        return false;
      }

      var tpl = '<div class="inline-reply">' +
                    '<textarea class="autoHeight form-control"></textarea>' +
                    '<div class="op">' +
                        '<a href="" class="send btn btn-primary btn-sm">回复</a>' +
                        '<a href="" class="cancel btn btn-default btn-sm">取消</a>' +
                    '</div>' +
                '</div>';
      var $wrap = $(this).parents('.media');
      var $tpl = $(tpl);
      var id = $wrap.data('id');
      if (!id) {
        return false;
      }
      $tpl.appendTo($wrap.find('.media-body'));
      $tpl.find('textarea').flexText();
      $tpl.find('.send').on('click', function() {
        $.ajax({
          url: '/' + id,
          type: 'post',
          success: function(data) {
            window.location.reload();
          }
        })
        return false;
      });
      var self = this;
      $tpl.find('.cancel').on('click', function() {
        $tpl.find('.send').off('click');
        $tpl.find('.cancel').off('click');
        $tpl.remove();
        $(self).removeClass('opened');
        return false;
      });
      $(this).addClass('opened');
  });

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

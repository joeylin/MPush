$(document).ready(function() {
    var box = $('#tpl-reply').html();
	var comment = $('#tpl-comment').html();
	var inlineReply = $('#tpl-inline-reply').html();
	

	$('#record-container').on('click.reply', '.h-reply-btn', function() {
		if ($(this).data('loaded')) {
			if ($(this).data('opened')) {
				$(this).parents('.media-body').find('.h-reply-box').css({display:'none'});
				$(this).find('.flag').text('讨论');
				$(this).data('opened', false);
			} else {
				$(this).parents('.media-body').find('.h-reply-box').css({display:'block'});
				$(this).find('.flag').text('收起讨论');
				$(this).data('opened', true);
			}
			return;
		}
		var $mediaBody = $(this).parents('.media-body');
		var $media = $(this).closest('.media');
		var $box = $(box);
		var id = $media.data('id');
		$box.appendTo($mediaBody);
		bindTextPlugin($box);
		showLoading($box);
		getComments('first', $box.find('.h-reply-content'), function() {
			hideLoading($box);
		});
		bindInlineReply($box);
		$box.find('.reply-content-all').on('click.getAll', function() {
			getComments('all', $box.find('.h-reply-content'), function() {
				$box.find('.reply-content-all').css({display:'none'});
			});
			return false;
		});
		$box.find('.reply-footer textarea').on('focus', function() {
			$box.find('.reply-footer .h-reply-op').css({display:'block'});
		});
		$box.find('.reply-footer .reply-cancel').on('click', function() {
			$box.find('.reply-footer .h-reply-op').css({display:'none'});
			return false;
		});
		$box.find('.reply-footer .reply-send').on('click', function() {
			var content = $box.find('.reply-footer textarea').val();
			var data = {
				r_content: content
			};
			$.post('/api/topic/' + id + '/ajaxReply', data, function(data) {
				if (data.code == 200) {
					var reply = {
						author: window.USER,
						_id: data.replyId,
						content: data.content,
						friendly_create_at: data.friendly_create_at,
						like_count: 0
					};
					var str = '';
					if ($box.find('h-reply-content > .media').length > 0) {
						str = '<hr class="hr-sm" />';
					}
					
					str += merge(reply);
					$(str).appendTo($box.find('.h-reply-content'));
					$box.find('.reply-footer textarea').val(' ');
					$box.find('.no-reply').css({display:'none'});
				}
			});
			return false;
		});
		$box.on('click', '.reply_like', function() {
			var $this = $(this);
			if ($this.hasClass('liked')) {
				return false;
			}
			var replyId = $this.closest('.media').data('id');
			$.ajax({
				url: '/reply/' + replyId + '/up',
				method: 'POST',
			}).done(function (data) {
				if (data.success) {
				  var $upCount = $this.closest('.media').find('.like-count');
				  $upCount.text((+$upCount.text() || 0) + 1);
				  $this.addClass('liked');
				  $this.text('已赞 ');
				} else {
				  alert('重复投票。');
				}
			});
		});
		$(this).data('loaded', true);
		$(this).data('opened', true);
		$(this).find('.flag').text('收起讨论');
		return false;
	});
	function showLoading($box) {
		$box.find('.h-reply-content').css({display:'none'});
		$box.find('reply-content-all').css({display: 'none'});
		$box.find('reply-footer').css({display:'none'});
		$box.find('reply-loading').css({display: 'block'});
	}
	function hideLoading($box) {
		$box.find('.h-reply-content').css({display:'block'});
		$box.find('reply-content-all').css({display: 'block'});
		$box.find('reply-footer').css({display:'block'});
		$box.find('reply-loading').css({display: 'none'});
	}
	function getComments(type, $content, cb) {
		var id = $content.closest('.media').data('id');
		var url;
		if (type == 'first') {
			url = '/api/topic/repliesLimit';
		} else {
			url = '/api/topic/replies';
		}
		var params = {
			topic_id: id
		};
		$.get(url, params, function(data) {
			if (data.code === 200) {
				var str = '';
				if (data.replies.length === 0) {
					str = '<div class="text-center no-reply">还没有人进行讨论。</div>';
				} else {
					data.replies.map(function(item, key) {
						var result = merge(item);
						if (data.replies.length - 1 !== key) {
							result += '<hr class="hr-sm">';
						}
						str += result;
					});
				}
					
				var $box = $content.closest('.h-reply-box');
				if (type == 'first' && data.hasLeft) {
					$box.find('.reply-content-all').css({display:'block'});
				} else {
					$box.find('.reply-content-all').css({display:'none'});
				}
				$content.html(str);
				if (typeof cb === 'function') {
					cb();
				}
			}
		});
	}
	function merge(reply) {
		var str = comment;
		var replyStr = '';
		var likeClass;
		var likeText;
		if (reply.is_reply) {
			replyStr = '<span>回复</span> <a href="/user/' + reply.reply_author.name + '">' + reply.reply_author.name + '</a>';
		}
		if (reply.isUped) {
			likeClass = 'liked';
			likeText = '已赞';
		} else {
			likeClass = '';
			likeText = '赞';
		}
		var reg = new RegExp('__userName__','g');
		return str.replace('__id__', reply._id)
			.replace('__date__', reply.friendly_create_at)
			.replace('__content__', marked(reply.content))
			.replace('__img__', reply.author.avatar || reply.author.avatar_url)
			.replace('__likeClass__', likeClass)
			.replace('__likeText__', likeText)
			.replace('__likeCount__', reply.like_count || 0)
			.replace('__userId__', reply.author._id)
			.replace('__reply__', '')
			.replace(reg, reply.author.name);
	}
	function bindInlineReply($box) {
		$box.on('click.inlineReply', '.h-inline-reply-btn', function() {
			var user = $(this).closest('.media-body-comment').find('.title a').text();
			if ($(this).data('loaded')) {
				var $container = $(this).closest('.media-body-comment').find('.inline-reply-container');
				if ($(this).data('opened')) {
					$container.css({display:'none'});
					$(this).data('opened', false);
				} else {
					$container.css({display:'block'});
					$container.find('textarea').focus().val('@' + user + ' ');
					$(this).data('opened', true);
				}
				return;
			}
			
			var $inline = $(inlineReply);
			var $mediaBody = $(this).closest('.media-body-comment');
			var $media = $(this).closest('.media');
			var commentId = $media.data('id');
			var topic_id = $media.closest('.trend-item').data('id');
			$inline.css({display:'block'}).appendTo($mediaBody);

			$(this).data('loaded', true);
			$(this).data('opened', true);

			$inline.find('.inline-send').on('click', function() {
				var content = $inline.find('.inline-text').val();
				var data = {
					reply_id: commentId,
					r2_content: content
				};
				// ajax
				$.post('/api/topic/' + topic_id + '/ajaxReply2', data, function(data) {
					if (data.code == 200) {
						var reply = {
							author: window.USER,
							_id: data.replyId,
							content: data.content,
							friendly_create_at: data.friendly_create_at,
							like_count: 0
						};
						var str = '<hr class="hr-sm" />';
						str += merge(reply);
						$(str).appendTo($box.find('.h-reply-content'));
						$box.find('.reply-footer textarea').val(' ');
						$inline.find('.inline-cancel').click();
					}
				});
				return false;
			});
			$inline.find('.inline-cancel').on('click', function() {
				$mediaBody.find('.h-inline-reply-btn').click();
				return false;
			});
			bindTextPlugin($mediaBody);
			$inline.find('textarea').focus().val('@' + user + ' ');
			var $err = $inline.find('.err-msg');
			function showError() {
				$err.css({display:'block'});
				setTimeout(function() {
					$err.fadeOut();
				}, 500);
			}
			return false;
		});
	}
	function bindTextPlugin($ele) {
		$ele.find('.autoHeight').flexText();
		// atwho
		$ele.find('.atwho').atwho({
		  at: '@',
		  data: []
		});
	}
	

});
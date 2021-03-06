import * as _ from "lodash"
$ = window.$ = window.jQuery = require('jquery')
import {DateTime} from 'luxon'
import tippy from 'tippy.js'
import weui from 'weui.js'
import Vue from 'vue'

import { getSetting } from './utils'
import { notices } from './variables'

import App from '../components/App.vue';
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})

$.each(['show', 'hide'], function (i, ev) {
  var el = $.fn[ev];
  $.fn[ev] = function () {
    this.trigger(ev);
    return el.apply(this, arguments);
  };
});

function switchWechat(target) {
  let to = target || 'ming'
  if (to == 'samedi') {
    $("#dialogs .weixin_pay .ming").hide()
    $("#dialogs .weixin_pay .samedi").show()
  } else {
    $("#dialogs .weixin_pay .ming").show()
    $("#dialogs .weixin_pay .samedi").hide()
  }
}

function switchAlipay(target) {
  let to = target || ($("#dialogs .alipay_pay .alipay").is(':visible') ? 'redpack' : 'alipay')
  if (to == 'redpack') {
    console.log('show redpack')
    $("#dialogs .alipay_pay .alipay").hide()
    $("#dialogs .alipay_pay .redpack").show()
  } else {
    console.log('show alipay')
    $("#dialogs .alipay_pay .redpack").hide()
    $("#dialogs .alipay_pay .alipay").show()
  }
}

function showReward() {
  switchPayMethod('weixin')
  let time = Date.now().toString()
  if (time[time.length - 1] < 3) {
    setTimeout(() => {
      switchPayMethod('alipay')
    }, 50);
  }
}


function switchPayMethod(payMethod, target) {
  $("#dialogs").show()
  if (payMethod == 'weixin') {
    $('.segmented-control .weixin').addClass('checked')
    $('.segmented-control .alipay').removeClass('checked')
    $('.weixin_pay').show()
    $('.alipay_pay').hide()
    switchWechat(target)
  } else {
    $('.segmented-control .weixin').removeClass('checked')
    $('.segmented-control .alipay').addClass('checked')
    $('.weixin_pay').hide()
    $('.alipay_pay').show()
    switchAlipay(target)
  }
}

// 试听通知
function listenVoice(type, batch) {
  chrome.runtime.sendMessage({
    text: type,
    batch: batch,
    test: true,
    title: "京价保通知试听",
    content: "并没有钱，这只是假象，你不要太当真"
  }, function (response) {
    console.log("Response: ", response);
  });
}

// 换 Tips
function changeTips() {
  let announcements = (localStorage.getItem('announcements') ? JSON.parse(localStorage.getItem('announcements')) : []).concat(notices)
  let tip = announcements[Math.floor(Math.random() * announcements.length)]
  $("#notice").text(tip.text)
  if (tip.type == "reward" && tip.button) {
    $("#notice").removeAttr("href")
    $("#notice").removeAttr("target")
    $(".tips .weui-btn").css("display", "inline-block")
    $(".tips .weui-btn").addClass("switch-paymethod")
    $(".tips .weui-btn").text(tip.button)
    $(".tips .weui-btn").data('target', tip.target)
  }
  if (tip.type == "link") {
    if (tip.button) {
      $(".tips .weui-btn").removeClass("switch-paymethod")
      $(".tips .weui-btn").css("display", "inline-block")
      $(".tips .weui-btn").text(tip.button)
      $(".tips .weui-btn").attr("href", tip.url)
      $(".tips .weui-btn").attr("target", "_blank")
    } else {
      $(".tips .weui-btn").hide()
    }
    $("#notice").attr("href", tip.url)
    $("#notice").attr("target", "_blank")
  }
  if (tip.type == "link" && tip.mode == "mobliepage") {
    if (tip.button) {
      $(".tips .weui-btn").removeClass("switch-paymethod")
      $(".tips .weui-btn").addClass("openMobilePage")
      $(".tips .weui-btn").attr("data-url", tip.url)
      $(".tips .weui-btn").removeAttr("href")
      $(".tips .weui-btn").removeAttr("target")
    }
    $("#notice").removeAttr("href")
    $("#notice").attr("data-url", tip.url)
    $("#notice").addClass("openMobilePage")
  }
}

function showJEvent(rateLimit) {
  if (rateLimit) {
    let today = DateTime.local().toFormat("o")
    let showRecommendState = getSetting('showRecommendState', {
      date: today,
      times: 0
    })
    if (showRecommendState.date == today) {
      if (showRecommendState.times > rateLimit.limit) {
        return console.log('展示次数超限')
      } else {
        showRecommendState.times = showRecommendState.times + 1
      }
    } else {
      showRecommendState.date = today
      showRecommendState.times = 1
    }
    localStorage.setItem('showRecommendState', JSON.stringify(showRecommendState))
  }
  // 加载反馈
  if (!$("#jEventIframe").attr('src') || $("#jEventIframe").attr('src') == '') {
    $("#jEventIframe").attr('src', "https://jjb.zaoshu.so/recommend")
    setTimeout(function () {
      $('.iframe-loading').hide()
    }, 800)
  }
  $("#jEventDialags").show()
}


$( document ).ready(function() {
  var paid = localStorage.getItem('jjb_paid');
  var account = localStorage.getItem('jjb_account');
  var admission_test = localStorage.getItem('jjb_admission-test')
  const displayRecommend = localStorage.getItem('displayRecommend')
  const displayRecommendRateLimit = getSetting('displayRecommendRateLimit', {
    rate: 7,
    limit: 1
  })
  let windowWidth = Number(document.body.offsetWidth)
  let time = Date.now().toString()

  // tippy
  tippy('.tippy')

  // 随机显示 Tips
  changeTips()

  $('body').width(windowWidth-1)
  // 窗口 resize
  setTimeout(() => {
    $('body').width(windowWidth)
  }, 100);

  // 查询推荐设置
  $.getJSON("https://jjb.zaoshu.so/recommend/settings", function (json) {
    if (json.display) {
      localStorage.setItem('displayRecommend', json.display)
    }
    if (json.ratelimit) {
      localStorage.setItem('displayRecommendRateLimit', JSON.stringify(json.ratelimit))
    }
    if (json.announcements && json.announcements.length > 0) {
      localStorage.setItem('announcements', JSON.stringify(json.announcements))
    }
    if (json.promotions) {
      localStorage.setItem('promotions', JSON.stringify(json.promotions))
    }
    if (json.recommendedLinks && json.recommendedLinks.length > 0) {
      localStorage.setItem('recommendedLinks', JSON.stringify(json.recommendedLinks))
    } else {
      localStorage.removeItem('recommendedLinks')
    }
    if (json.recommendServices && json.recommendServices.length > 0) {
      localStorage.setItem('recommendServices', JSON.stringify(json.recommendServices))
    }
  });

  // 查询最新版本
  $.getJSON("https://jjb.zaoshu.so/updates?buildid={{buildid}}&browser={{browser}}", function (lastVersion) {
    if (!lastVersion) return localStorage.removeItem('newVersion')
    let skipBuildId = localStorage.getItem('skipBuildId')
    let localBuildId = skipBuildId || "{{buildid}}"
    // 如果有新版
    if (localBuildId < lastVersion.buildId) {
      localStorage.setItem('newVersion', lastVersion.versionCode)
      // 如果新版是主要版本，而且当前版本需要被提示
      if (lastVersion.major && localBuildId < lastVersion.noticeBuildId) {
        let noticeDialog = weui.dialog({
          title: `${lastVersion.title} <span class="dismiss">&times;</span>` || '京价保有版本更新',
          content: `${lastVersion.changelog}
            <div class="changelog">
              <span class="time">${lastVersion.time}</span>` +
             (lastVersion.blogUrl ? `<a class="blog" href="${lastVersion.blogUrl}" target="_blank">了解更多</a>` : '') +
            `</div>`,
          className: 'update',
          buttons: [{
            label: '不再提醒',
            type: 'default',
            onClick: function () {
              localStorage.setItem('skipBuildId', lastVersion.buildId)
            }
          }, {
            label: '下载更新',
            type: 'primary',
            onClick: function () {
              chrome.tabs.create({
                url: lastVersion.downloadUrl || "https://jjb.zaoshu.so/updates/latest?browser={{browser}}"
              })
            }
          }]
        });
        $(".update .dismiss").on("click", function () {
          noticeDialog.hide()
        })
      }
    } else {
      localStorage.removeItem('newVersion')
    }
  });

  // 是否已存在弹窗
  function isNoDialog(){
    return ($(".js_dialog:visible").length < 1) && ($(".weui-dialog:visible").length < 1)
  }

  // 入学考试
  function showTest(target) {
    let testNo = target || '1'
    $("#admissionTest .testbox").hide()
    setTimeout(() => {
      $("#admissionTest .test-" + testNo).show()
    }, 50);
  }

  if (admission_test && admission_test == 'N') {
    $("#admissionTest").show()
    $("img.jjb-official").attr('src', "http://jjbcdn.zaoshu.so/wechat/qrcode_for_gh_21550d50400c_430.jpg")
    $("#admissionTest .answer").on("click", function () {
      let next = $(this).data('next')
      if (next) {
        showTest(next)
      } else {
        $("#admissionTest").hide()
        localStorage.setItem('jjb_admission-test', 'Y');
      }
    })
    $("#admissionTest .dismiss").on("click", function () {
      $("#admissionTest").hide()
      window.close();
    })
    showTest()
  }

  // 常规弹窗延迟200ms
  setTimeout(() => {
    if (paid) {
      $("#dialogs").hide()
    } else {
      if (isNoDialog() && time[time.length - 1] < 4) {
        showReward()
      }
    }
    // 只有在没有弹框 且 打开了推荐 取 1/5 的几率弹出推荐
    if (isNoDialog() && displayRecommend == 'true' && time[time.length - 1] > displayRecommendRateLimit.rate) {
      showJEvent(displayRecommendRateLimit)
    }


    if (!account) {
      $("#clearAccount").addClass('weui-btn_disabled')
    }
  }, 200);


  $('.settings .weui-navbar__item').on('click', function () {
    $(this).addClass('weui-bar__item_on').siblings('.weui-bar__item_on').removeClass('weui-bar__item_on');
    var type = $(this).data('type')
    $('.settings_box').hide()
    $('.settings_box.' + type).show()
  });

  // 授权
  $('.settings .request-permissions-icon').on('click', function () {
    let permissions = $(this).data('permissions')
    chrome.runtime.sendMessage({
      text: "requestPermissions",
      permissions: permissions
    }, function (response) {
      if (response.granted) {
        weui.toast('授权成功', 3000);
      } else {
        weui.alert('授权失败');
      }
    });
  });

  $(".weui-dialog__ft a").on("click", function () {
    $("#dialogs").hide()
    $("#listenAudio").hide()
    $("#loginNotice").hide()
    $("#changeLogs").hide()
    if ($(this).data('action') == 'paid') {
      chrome.runtime.sendMessage({
        text: "paid"
      }, function(response) {
        console.log("Response: ", response);
      });
    } else {
      if ($(this).data('action') == 'pay') {
        showReward()
      }
    }
  })

  $("#listen").on("click", function () {
    $("#listenAudio").show()
  })

  $("#know_more").on("click", function () {
    $("#loginNotice .detail").show()
    $("#know_more").hide()
  })

  $(".switch-paymethod").on("click", function () {
    let to = $(this).data('to')
    let target = $(this).data('target')
    if ($(this).hasClass('switch-paymethod')){
      switchPayMethod(to, target)
    }
  })


  $("#openWechatCard").on("click", function () {
    $("img.jjb-official").attr('src', "http://jjbcdn.zaoshu.so/wechat/qrcode_for_gh_21550d50400c_430.jpg")
    $("#wechatDialags").show()
  })

  $("#openjEventCard").on("click", function () {
    showJEvent()
  })

  $(document).on("click", ".openMobilePage", function () {
    chrome.runtime.sendMessage({
      action: "openUrlAsMoblie",
      url: $(this).data('url')
    }, function (response) {
      console.log("Response: ", response);
    });
  })

  $(".showLoginState").on("click", function () {
    $("#loginNotice").show()
  })

  $("#openFeedback").on("click", function () {
    // 加载反馈
    if ($("#feedbackIframe").attr('src') == '') {
      $("#feedbackIframe").attr('src', "https://i.duotai.net/forms/yovwz?version={{version}}")
      setTimeout(function () {
        $('.iframe-loading').hide()
      }, 800)
    }
    $("#feedbackDialags").show()
  })

  $("#openFaq").on("click", function () {
    // 加载反馈
    if ($("#faqIframe").attr('src') == '') {
      $("#faqIframe").attr('src', "https://i.duotai.net/forms/oqyvk/1lpb11l2")
      setTimeout(function () {
        $('.iframe-loading').hide()
      }, 800)
    }
    $("#faqDialags").show()
  })

  $("#clearPinnedTabs").on("click", function () {
    chrome.tabs.query({
      pinned: true
    }, function (tabs) {
      var tabIds = $.map(tabs, function (tab) {
        if (tab && tab.url.indexOf('jd.com') !== -1) {
            return tab.id
        }
      })

      // opera doesn't remove pinned tabs, so lets first unpin
      $.map(tabIds, function (tabId) {
        chrome.tabs.update(tabId, {"pinned":false}, function(theTab){ chrome.tabs.remove(theTab.id); });
      })
    })
  })

  $("#feedbackDialags .js-close").on("click", function () {
    $("#feedbackDialags").hide()
  })

  $("#faqDialags .js-close").on("click", function () {
    $("#faqDialags").hide()
  })

  $("#jEventDialags .js-close").on("click", function () {
    $("#jEventDialags").hide()
  })

  $("#dialogs .js-close").on("click", function () {
    $("#dialogs").hide()
  })

  $("#wechatDialags .js-close").on("click", function () {
    $("#wechatDialags").hide()
  })

  $("#clearAccount").on("click", function () {
    weui.confirm('清除密码将移除本地存储的账号密码、订单记录、消息记录；清除后若需继续使用请重新登录并选择让京价保记住密码', function () {
      localStorage.removeItem('jjb_account')
      localStorage.removeItem('jjb_orders')
      localStorage.removeItem('jjb_messages')
      chrome.tabs.create({
        url: "https://passport.jd.com/uc/login"
      })
    }, function () {
      console.log('取消清除')
    }, {
      title: '清除密码确认'
    });
  })


  $(".openLogin").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openLogin",
    }, function(response) {
      console.log("Response: ", response);
    });
  })

  $("#notice").on("dblclick", function () {
    changeTips()
  })

  $("#pricePro").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openPricePro"
    }, function (response) {
      console.log("Response: ", response);
    })
  })

  $(".listenVoice").on("click", function () {
    listenVoice($(this).data('type'), $(this).data('batch'))
  })

  $(".showApplyAlipayCode").on("click", function () {
    weui.dialog({
      title: '申请支付宝收款码',
      content: `<img src="https://jjbcdn.zaoshu.so/chrome/applyAlipayCode.jpg" style="width: 270px;"></img>`,
      className: 'apply-alipay-code',
      buttons: [{
        label: '完成',
        type: 'primary'
      }]
    })
  })

})

// 防止缩放
chrome.tabs.getZoomSettings(function (zoomSettings) {
  if (zoomSettings.defaultZoomFactor > 1 && zoomSettings.scope == 'per-origin' && zoomSettings.mode == 'automatic') {
    let zoomPercent = (100 / (zoomSettings.defaultZoomFactor * 100)) * 100;
    document.body.style.zoom = zoomPercent + '%'
  }
})

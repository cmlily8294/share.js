/**
 * social-share.js
 *
 * https://github.com/cmlily8294/share.js
 * forked from https://github.com/overtrue/share.js
 * @example
 * <pre>
 * socialShare('.share-components');
 *
 * // or
 *
 * socialShare('.share-bar', {
 *     sites: ['qzone', 'qq', 'weibo','wechat'],
 *     // ...
 * });
 * </pre>
 */
;(function (window, document, undefined) {

    // Initialize a variables.

    var Array$indexOf = Array.prototype.indexOf;
    var Object$assign = Object.assign;

    var image = (document.images[0] || 0).src || 'https://askcdn.itouzi.com/ask/static/css/default/itouzi.png';
    var site = getMetaContentByName('site') || getMetaContentByName('Site') || document.title;
    var title = getMetaContentByName('title') || getMetaContentByName('Title') || document.title || '来自爱投资的分享';
    var description = getMetaContentByName('description') || getMetaContentByName('Description') || '';
    var defaults = {
        url: location.href,
        origin: location.origin,
        source: site,
        title: title,
        description: description,
        image: image,
        imageSelector: undefined,

        weiboKey: '',

        wechatQrcodeTitle: '微信扫一扫：分享',
        wechatQrcodeHelper: '<p>微信里点“发现”，扫一下</p><p>二维码便可将本文分享至朋友圈。</p>',
        wechatQrcodeSize: 150,

        // sites: ['weibo', 'qq', 'wechat', 'timeline',  'qzone'],
        sites:[],
        mobileSites: [],
        disabled: [],
        initialized: false,
        countUrl:'https://www.itouzi.com/share/share',
        backCountUrl:'https://www.itouzi.com/share/back'
    };

    var templates = {
        qzone: 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={{URL}}&title={{TITLE}}&desc={{DESCRIPTION}}&summary={{SUMMARY}}&site={{SOURCE}}',
        qq: 'http://connect.qq.com/widget/shareqq/index.html?url={{URL}}&title={{TITLE}}&source={{SOURCE}}&desc={{DESCRIPTION}}&pics={{IMAGE}}',
        weibo: 'http://service.weibo.com/share/share.php?url={{URL}}&title={{TITLE}}&pic={{IMAGE}}&appkey={{WEIBOKEY}}',
        wechat: 'javascript:',
        timeline: 'javascript:'
    };
    var itzAPPSrc = '/static/js/itzAPP/itzAPP.js';

    var qApiSrc = {
        lower: "//3gimg.qq.com/html5/js/qb.js",
        higher: "//jsapi.qq.com/get?api=app.share"
    };
    var bLevel = {
        qq: {forbid: 0, lower: 1, higher: 2},
        uc: {forbid: 0, allow: 1}
    };
    var UA = navigator.appVersion;
    var isqqBrowser = (UA.split("MQQBrowser/").length > 1) ? bLevel.qq.higher : bLevel.qq.forbid;
    var isucBrowser = (UA.split("UCBrowser/").length > 1) ? bLevel.uc.allow : bLevel.uc.forbid;
    var isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent);
    var isItzApp = /_ITZ_[IOS|ANDROID]/i.test(navigator.userAgent);
    var version = {
        uc: "",
        qq: ""
    };

    /**
     * qq浏览器下面 是否加载好了相应的api文件
     */
    var qqBridgeLoaded = false;

    //加载QQ浏览器API
    var loadqqApi = function(cb){
        if (!isqqBrowser) {
            return cb && cb();
        }
        var b = (version.qq < 5.4) ? qApiSrc.lower : qApiSrc.higher;
        var d = document.createElement("script");
        d.onload = function() {
            cb && cb();
        }
        var a = document.getElementsByTagName("head")[0];
        d.setAttribute("src", b);
        a.appendChild(d);
    }
    //获取版本号
    var getVersion = function (c) {
        var a = c.split("."), b = parseFloat(a[0] + "." + a[1]);
        return b
    };
    
    var itzAPPLoaded = false;
    //加载ItouziAPI
    var loadItzApi = function(cb){
        if (!isItzApp || window.iTouziAPP) {
            return cb && cb();
        }
        var d = document.createElement("script");
        d.onload = function() {
            cb && cb();
        }
        var a = document.getElementsByTagName("head")[0];
        d.setAttribute("src", itzAPPSrc);
        a.appendChild(d);
    }



    //判断是否为微信浏览器
    var is_weixin = function () {
        var a = navigator.appVersion.toLowerCase();
        if (a.match(/MicroMessenger/i) == "micromessenger") {
            return true
        } else {
            return false
        }
    };

    /**
    * 获取当前系统平台
    */
    var getPlantform = function() {
        var ua = navigator.userAgent;
        if ((ua.indexOf("iPhone") > -1 || ua.indexOf("iPod") > -1 || ua.indexOf('iPad') > -1)) {
            return "iPhone"
        }else if(ua.indexOf("Android") > -1)
        {
            return "Android";
        }else{
            return "Pc";
        }
    }

    var ucAppList = {
        weibo: ['kSinaWeibo', 'SinaWeibo', 11, '新浪微博'],
        weixin: ['kWeixin', 'WechatFriends', 1, '微信好友'],
        weixinFriend: ['kWeixinFriend', 'WechatTimeline', '8', '微信朋友圈'],
        QQ: ['kQQ', 'QQ', '4', 'QQ好友'],
        QZone: ['kQZone', 'QZone', '3', 'QQ空间']
    };
    var _plantForm = getPlantform();
    var toAppIndex = (_plantForm == 'iPhone' ?0:1);

    var QQBrowserShare = {
        /*
            to_app字段
            //微信好友1,腾讯微博2,QQ空间3,QQ好友4,生成二维码7,微信朋友圈8,啾啾分享9,复制网址10,分享到微博11,创意分享13
        */
        _openApp:function(data){
            function qqShare(data) {
                if (typeof(browser) != "undefined") {
                    if (typeof(browser.app) != "undefined" && isqqBrowser == bLevel.qq.higher) {
                        browser.app.share(data)
                    }
                } else {
                    if (typeof(window.qb) != "undefined" && isqqBrowser == bLevel.qq.lower) {
                        window.qb.share(data)
                    }else{}
                }
            }
            if (qqBridgeLoaded) {
                qqShare(data);
            }else{
                loadqqApi(function() {
                    qqShare(data);
                });
            }
        },
        weibo:function(data){
            data.to_app = ucAppList['weibo'][2];
            QQBrowserShare._openApp(data);
        },
        wechat:function(data){
            data.to_app = ucAppList['weixin'][2];
            QQBrowserShare._openApp(data);
        },
        timeline:function(data){
            data.to_app = ucAppList['weixinFriend'][2];
            QQBrowserShare._openApp(data);
        },
        qq:function(data){
            data.to_app = ucAppList['QQ'][2];
            QQBrowserShare._openApp(data);
        },
        qzone:function(data){
            data.to_app = ucAppList['QZone'][2];
            QQBrowserShare._openApp(data);
        }
    }


    /**
    * 使用UC浏览器自带分享功能
    */
    var UCBrowserShare ={
        weibo:function(data){
            ucbrowser.web_share(data.title,data.title,data.url,ucAppList['weibo'][toAppIndex],"","@"+data.title,"")
        },
        wechat:function(data){
            ucbrowser.web_share(data.title,data.title,data.url,ucAppList['weixin'][toAppIndex],"","@"+data.title,"")
        },
        timeline:function(data){
            ucbrowser.web_share(data.title,data.title,data.url,ucAppList['weixinFriend'][toAppIndex],"","@"+data.title,"")
        },
        qzone:function(data){
            ucbrowser.web_share(data.title,data.title,data.url,ucAppList['QZone'][toAppIndex],"","@"+data.title,"")
        },
        qq:function(data){
            ucbrowser.web_share(data.title,data.title,data.url,ucAppList['QQ'][toAppIndex],"","@"+data.title,"")
        },
        more:function(data){
            ucbrowser.web_share(data.title,data.title,data.url,"","","@"+data.title,"")
        }
    }

    //微信分享
    var WXShare = function()
    {

    }
    var UCWebShare ={
        weibo:function(data){
            ucweb.startRequest("shell.page_share",[data.title,data.title,data.url,ucAppList['weibo'][toAppIndex],"","@"+data.title,""]);
        },
        wechat:function(data){
            ucweb.startRequest("shell.page_share",[data.title,data.title,data.url,ucAppList['weixin'][toAppIndex],"","@"+data.title,""]);
        },
        timeline:function(data){
            ucweb.startRequest("shell.page_share",[data.title,data.title,data.url,ucAppList['weixinFriend'][toAppIndex],"","@"+data.title,""]);
        },
        qzone:function(data){
            ucweb.startRequest("shell.page_share",[data.title,data.title,data.url,ucAppList['QZone'][toAppIndex],"","@"+data.title,""]);
        },
        qq:function(data){
            ucweb.startRequest("shell.page_share",[data.title,data.title,data.url,ucAppList['QQ'][toAppIndex],"","@"+data.title,""])
        },
        more:function(data){
            ucweb.startRequest("shell.page_share",[data.title,data.title,data.url,"","","@"+data.title,""])
        }
    }

    var itzShare = {
        _openApp:function(data){
            if (itzAPPLoaded) {
                iTouziAPP.share(data.description,encodeURIComponent(data.image),data.mode,'social-share',data.title,encodeURIComponent(data.url));
            }else{
                loadItzApi(function() {
                    iTouziAPP.share(data.description,encodeURIComponent(data.image),data.mode,'social-share',data.title,encodeURIComponent(data.url));
                });
            }
        },
        weibo:function(data){
            data.mode = 'Sina';
            itzShare._openApp(data);
        },
        wechat:function(data){
            data.mode = 'WechatSession';
            itzShare._openApp(data);
        },
        timeline:function(data){
            data.mode = 'WechatTimeline';
            itzShare._openApp(data);
        },
        qzone:function(data){
            data.mode = 'Qzone';
            itzShare._openApp(data);
        },
        qq:function(data){
            data.mode = 'QQ';
            itzShare._openApp(data);
        }
    }


    /**
     * 判断移动端浏览器类型
     */
    var moblieBrowser = function() {
        if(isucBrowser){
            version.uc = isucBrowser ? getVersion(UA.split("UCBrowser/")[1]) : 0;
            if(typeof(ucweb) != 'undefined'){
                return UCWebShare;
            }
            if(typeof(ucbrowser) != 'undefined'){
                return UCBrowserShare;
            }
        }else if(isqqBrowser){
            if(is_weixin()){
                return WXShare();
            }
            return QQBrowserShare;
        }else if(isItzApp) {
            return itzShare;
        }else {
            return {};
        }
    }

    function createClickEvent(name) {
        var m = moblieBrowser();
        return m[name] ? m[name] : function(){};
    }


    /**
     * Expose API to the global
     *
     * @param  {String|Element} elem
     * @param  {Object} options
     */
    window.socialShare = function (elem, options) {
        elem = typeof elem === 'string' ? querySelectorAlls(elem) : elem;

        if (elem.length === undefined) {
            elem = [elem];
        }

        each(elem, function (el) {
            if (!el.initialized) {
                share(el, options);
            }
        });
    };

    // Domready after initialization
    alReady(function () {
        if (isqqBrowser) {
            version.qq = getVersion(UA.split("MQQBrowser/")[1]);
            loadqqApi(function() {
                qqBridgeLoaded = true;
            });
        }
        socialShare('.social-share, .share-component');
    });


    /**
     * Initialize a share bar.
     *
     * @param {Object}        $options globals (optional).
     *
     * @return {Void}
     */
    function share(elem, options) {
        var data = mixin({}, defaults, options || {}, dataset(elem));

        if (data.imageSelector) {
            data.image = querySelectorAlls(data.imageSelector).map(function(item) {
                return item.src;
            }).join('||');
        }
        //回流统计
        var params = getUrlParams(location.href);
        params.itzshare && shareBackCount(params.itzshare,data);

        var uid = guid();
        data.url = setUrlParams(data.url,{itzshare:uid});
        data.uid = uid;

        addClass(elem, 'share-component social-share');
        createIcons(elem, data);
        if (!isucBrowser && !isqqBrowser && !isItzApp) {
            createWechat(elem, data);
        }
        if (isItzApp && !itzAPPLoaded) {
            loadItzApi(function() {
                itzAPPLoaded = true;
                iTouziAPP.showUmengShare && iTouziAPP.showUmengShare(
                    encodeURIComponent(data.description||'@爱投资'),
                    encodeURIComponent(data.image),
                    'QQ,Sina,WechatSession,WechatTimeline,Qzone',
                    'social-share',
                    encodeURIComponent(data.title),
                    encodeURIComponent(data.url));
            });
        }

        elem.initialized = true;
    }


    /**
     * Create site icons
     *
     * @param {Element} elem
     * @param {Object} data
     */
    function createIcons(elem, data) {
        var sites = getSites(data);
        var isPrepend = data.mode == 'prepend';

        each(isPrepend ? sites.reverse() : sites, function (name) {
            var link = data.initialized ? getElementsByClassName(elem, 'icon-' + name) : createElementByString('<a class="social-share-icon icon-' + name + '"></a>');
            if (!link.length) {
                return true;
            }
            if (isucBrowser || isqqBrowser || isItzApp) {
                link[0].onclick = function(event) {
                    var fn = createClickEvent(name);
                    fn(data);
                    shareCount(name, data);
                }
            }else{
                var url = makeUrl(name, data);
                link[0].href = url;
                if (name === 'wechat' || name === 'timeline') {
                    link[0].tabindex = -1;
                } else {
                    link[0].target = '_blank';
                }
                link[0].onclick = function(event) {
                    if (name === 'wechat' || name === 'timeline') {
                        showWechatQRCode();
                    }
                    shareCount(name, data);
                }
            }


            if (!data.initialized) {
                isPrepend ? elem.insertBefore(link[0], elem.firstChild) : elem.appendChild(link[0]);
            }
        });
    }


    //分享统计
    function shareCount(name,data) {
        var i = document.createElement("img");
        i.src=data.countUrl+"?url="+encodeURIComponent(data.url)+'&mode='+name+'&title='+data.title+'&sign='+data.uid+'&description='+data.description;
    }

    //分享回流统计
    function shareBackCount(sign,data) {
        var i = document.createElement("img");
        i.src=data.backCountUrl+"?sign="+sign;
    }


    /**
     * Create the wechat icon and QRCode.
     *
     * @param {Element} elem
     * @param {Object} data
     */
    function createWechat (elem, data) {
        var wechat = getElementsByClassName(elem, 'icon-wechat', 'a');

        if (wechat.length === 0) {
            return false;
        }

        var elems = createElementByString('<div class="wechat-qrcode"><h4>' + data.wechatQrcodeTitle + '<a class="wechat-qrcode-close">×</a></h4><div class="qrcode"></div><div class="help">' + data.wechatQrcodeHelper + '</div></div>');
        var qrcode = getElementsByClassName(elems[0], 'qrcode', 'div');
        var parent = getElementsByClassName(document,'social-share','div');
        var closeElem = getElementsByClassName(elems[0],'wechat-qrcode-close','div');
        closeElem[0].onclick = function() {
            hideWechatQRCode();
        }
        parent[0].appendChild(elems[0]);

        new QRCode(qrcode[0], {text: data.url, width: data.wechatQrcodeSize, height: data.wechatQrcodeSize});
    }

    function showWechatQRCode() {
        var ele = getElementsByClassName(document,'wechat-qrcode','div');
        if (ele && ele[0]) {
            ele[0].style.display = 'block';
        }
    }

    function hideWechatQRCode() {
        var ele = getElementsByClassName(document,'wechat-qrcode','div');
        if (ele && ele[0]) {
            ele[0].style.display = 'none';
        }
    }




    /**
     * Get available site lists.
     *
     * @param {Object} data
     *
     * @returns {Array}
     */
    function getSites(data) {
        if (!data['sites'].length) {
            if (isucBrowser || isqqBrowser || isItzApp) {
                data['sites'] = ['qq', 'qzone', 'weibo', 'wechat','timeline'];
            }else if(_plantForm == 'Pc'){
                data['sites'] = ['qq', 'qzone', 'weibo', 'wechat'];
            }else{
                data['sites'] = ['qzone', 'weibo','wechat'];
            }
        }

        var sites = data['sites'].slice(0);
        var disabled = data['disabled'];

        if (typeof sites == 'string') {
            sites = sites.split(/\s*,\s*/);
        }
        if (typeof disabled == 'string') {
            disabled = disabled.split(/\s*,\s*/);
        }

        if (isWechatBrowser) {
            disabled.push('wechat');
            disabled.push('timeline');
        }

        // Remove elements
        disabled.length && each(disabled, function (it) {
            sites.splice(inArray(it, sites), 1);
        });

        return sites;
    }


    /**
     * Build the url of icon.
     *
     * @param {String} name
     * @param {Object} data
     *
     * @returns {String}
     */
    function makeUrl(name, data) {
        data['summary'] = data['description'];

        return templates[name].replace(/\{\{(\w)(\w*)\}\}/g, function (m, fix, key) {
            var nameKey = name + fix + key.toLowerCase();
            key = (fix + key).toLowerCase();

            return encodeURIComponent((data[nameKey] === undefined ? data[key] : data[nameKey]) || '');
        });
    }


    /**
     * Supports querySelectorAll, jQuery, Zepto and simple selector.
     *
     * @param str
     *
     * @returns {*}
     */
    function querySelectorAlls(str) {
        return (document.querySelectorAll || window.jQuery || window.Zepto || selector).call(document, str);
    }


    /**
     * Simple selector.
     *
     * @param {String} str #ID or .CLASS
     *
     * @returns {Array}
     */
    function selector(str) {
        var elems = [];

        each(str.split(/\s*,\s*/), function(s) {
            var m = s.match(/([#.])(\w+)/);
            if (m === null) {
                throw Error('Supports only simple single #ID or .CLASS selector.');
            }

            if (m[1]) {
                var elem = document.getElementById(m[2]);

                if (elem) {
                    elems.push(elem);
                }
            }

            elems = elems.concat(getElementsByClassName(str));
        });

        return elems;
    }


    /**
     * Add the classNames for element.
     *
     * @param {Element} elem
     * @param {String} value
     */
    function addClass(elem, value) {
        if (value && typeof value === "string") {
            var classNames = (elem.className + ' ' + value).split(/\s+/);
            var setClass = ' ';

            each(classNames, function (className) {
                if (setClass.indexOf(' ' + className + ' ') < 0) {
                    setClass += className + ' ';
                }
            });

            elem.className = setClass.slice(1, -1);
        }
    }


    /**
     * Get meta element content value
     *
     * @param {String} name
     *
     * @returns {String|*}
     */
    function getMetaContentByName(name) {
        return (document.getElementsByName(name)[0] || 0).content;
    }


    /**
     * Get elements By className for IE8-
     *
     * @param {Element} elem element
     * @param {String} name className
     * @param {String} tag tagName
     *
     * @returns {HTMLCollection|Array}
     */
    function getElementsByClassName(elem, name, tag) {
        if (elem.getElementsByClassName) {
            return elem.getElementsByClassName(name);
        }

        var elements = [];
        var elems = elem.getElementsByTagName(tag || '*');
        name = ' ' + name + ' ';

        each(elems, function (elem) {
            if ((' ' + (elem.className || '') + ' ').indexOf(name) >= 0) {
                elements.push(elem);
            }
        });

        return elements;
    }


    /**
     * Create element by string.
     *
     * @param {String} str
     *
     * @returns {NodeList}
     */
    function createElementByString(str) {
        var div = document.createElement('div');
        div.innerHTML = str;

        return div.childNodes;
    }


    /**
     * Merge objects.
     *
     * @returns {Object}
     */
    function mixin() {
        var args = arguments;

        if (Object$assign) {
            return Object$assign.apply(null, args);
        }

        var target = {};

        each(args, function (it) {
            each(it, function (v, k) {
                target[k] = v;
            });
        });

        return args[0] = target;
    }


    /**
     * Get dataset object.
     *
     * @param {Element} elem
     *
     * @returns {Object}
     */
    function dataset(elem) {
        if (elem.dataset) {
            return JSON.parse(JSON.stringify(elem.dataset));
        }

        var target = {};

        if (elem.hasAttributes()) {
            each(elem.attributes, function (attr) {
                var name = attr.name;
                if (name.indexOf('data-') !== 0) {
                    return true;
                }

                name = name.replace(/^data-/i, '')
                    .replace(/-(\w)/g, function (all, letter) {
                        return letter.toUpperCase();
                    });

                target[name] = attr.value;
            });

            return target;
        }

        return {};
    }


    /**
     * found element in the array.
     *
     * @param {Array|Object} elem
     * @param {Array} arr
     * @param {Number} i
     *
     * @returns {Number}
     */
    function inArray(elem, arr, i) {
        var len;

        if (arr) {
            if (Array$indexOf) {
                return Array$indexOf.call(arr, elem, i);
            }

            len = arr.length;
            i = i ? i < 0 ? Math.max(0, len + i) : i : 0;

            for (; i < len; i++) {
                // Skip accessing in sparse arrays
                if (i in arr && arr[i] === elem) {
                    return i;
                }
            }
        }

        return -1;
    }


    function guid() {
      function S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      }
      return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }


    /**
     * Simple each.
     *
     * @param {Array|Object} obj
     * @param {Function} callback
     *
     * @returns {*}
     */
    function each(obj, callback) {
        var length = obj.length;

        if (length === undefined) {
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    if (callback.call(obj[name], obj[name], name) === false) {
                        break;
                    }
                }
            }
        } else {
            for (var i = 0; i < length; i++) {
                if (callback.call(obj[i], obj[i], i) === false) {
                    break;
                }
            }
        }
    }

    function getUrlParams(url,params) {
        var arr = params ? params.split(',') : [];
        var value = {};
        if (url) {
            var str = url.split('?')[1];
            if (str) {
                if (str.indexOf('&') != -1) {
                    var v = str.split('&');
                    if (arr.length > 0) {
                        for (var i = 0; i < arr.length; i++) {
                            for (var j = 0; j < v.length; j++) {
                                if (arr[i] == v[j].split('=')[0]) value[arr[i]] = v[j].split('=')[1];
                            }
                        }
                    } else {
                        for (var i = 0; i < v.length; i++) {
                            var p = v[i].split('=');
                            if (!p[0]) {
                                continue;
                            } else {
                                value[v[i].split('=')[0]] = v[i].split('=')[1];
                            }
                        }
                    }
                } else value[str.split('=')[0]] = str.split('=')[1];
            }
        }
        return value;
    }

    function setUrlParams(_url,newParams) {
        var params = getUrlParams(_url);
        for (var key in newParams) {
            params[key] = newParams[key];
        }
        var url = _url.split('?')[0];
        var arr = [];
        for (var key in params) {
            arr.push(key + '=' + params[key]);
        }
        url = arr.length > 0 ? url+ '?' + arr.join('&') : '';
        return url;
    }



    /**
     * Dom ready.
     *
     * @param {Function} fn
     *
     * @link https://github.com/jed/alReady.js
     */
    function alReady ( fn ) {
        var add = 'addEventListener';
        var pre = document[ add ] ? '' : 'on';

        ~document.readyState.indexOf( 'm' ) ? fn() :
            'load DOMContentLoaded readystatechange'.replace( /\w+/g, function( type, i ) {
                ( i ? document : window )
                    [ pre ? 'attachEvent' : add ]
                (
                    pre + type,
                    function(){ if ( fn ) if ( i < 6 || ~document.readyState.indexOf( 'm' ) ) fn(), fn = 0 },
                    !1
                )
            })
    }
})(window, document);

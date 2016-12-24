define(function(require, exports, module) {

    var Widget = require('widget');
    var swfobject = require('swfobject');

    var CloudVideoPlayer = Widget.extend({
        attrs: {
            url: '',
            urlType: '',
            width: '100%',
            height: '100%',
            _firstPlay: true,
            runtime: null
        },

        events: {},

        setup: function() {
            console.log('setup');
            window.__MediaPlayerEventProcesser = this._evetProcesser;
            window.__MediaPlayer = this;
            this.set("playerId", this.element.attr("id"));
            if (swfobject.hasFlashPlayerVersion('10.2')) {
                //add by chenjun 解决七牛云视频播放问题，对url进行encode，防止token被播放器截掉。
                this.attrs.url.value = encodeURIComponent(this.attrs.url.value);
                this._initGrindPlayer();
            } else if (this._isSupportHtml5Video()) {
                this._initHtml5Player();

            } else {
                alert('您的浏览器未装Flash播放器或版本太低，请先安装Flash播放器。');
            }
            //CloudVideoPlayer.superclass.setup.call(this);
        },

        dispose: function(){
            console.log('dispose');
            var runtime = this.get('runtime');
            if (runtime == 'flash') {
                swfobject.removeSWF(this.get('playerId'));
            } else if (runtime == 'html5') {
                $("#" + this.get('playerId')).remove();
            }
        },

        _initHtml5Player: function() {
            console.log('_initHtml5Player');
            var style= "width:" + this.get('width') + ';height:' + this.get('height');
            var html = '<video id="' + this.get('playerId') + '" src="';
            html += this.get('url') + '" autoplay controls style="' + style + '">';
            html += '</video>';
            var parent = this.element.parent();
            this.element.remove();
            parent.html(html);
            this.set('runtime', 'html5');
        },

        _isSupportHtml5Video: function() {
            console.log('_isSupportHtml5Video');
            return !!document.createElement('video').canPlayType;
        },

        _initGrindPlayer: function() {
            console.log('_initGrindPlayer');
            var flashvars = {
                src:  this.get('url'),
                javascriptCallbackFunction: "__MediaPlayerEventProcesser",
                autoPlay:false,
                autoRewind: false,
                loop:false,
                bufferTime: 8
            };
            console.log(flashvars)
            flashvars.plugin_hls = "/player/libs/player/flashls-0.4.0.3.swf";
            flashvars.hls_maxbackbufferlength = 300;
            
            if (this.get('watermark')) {
                flashvars.plugin_watermake = 'https://cdn.staticfile.org/GrindPlayerCN/1.0.2/Watermake-1.0.3.swf';
                flashvars.watermake_namespace = 'watermake';
                flashvars.watermake_url = this.get('watermark');
            }

            if (this.get('fingerprint')) {
                flashvars.plugin_fingerprint = "https://cdn.staticfile.org/GrindPlayerCN/1.0.2/Fingerprint-1.0.1.swf";
                flashvars.fingerprint_namespace = 'fingerprint';
                flashvars.fingerprint_src = this.get('fingerprintSrc');
            }

            var params = {
                wmode:'opaque',
                allowFullScreen: true
                , allowScriptAccess: "always"
                , bgcolor: "#000000"
            };

            var attrs = {
                name: this.element.attr("id")
            };
            swfobject.embedSWF(
                "https://cdn.staticfile.org/GrindPlayerCN/1.0.2/GrindPlayer.swf",
                this.element.attr("id"),
                this.get('width'),  this.get('height') , "10.2", null, flashvars, params, attrs
            );
            this.set('runtime', 'flash');
        },

        _evetProcesser: function(playerId, event, data) {
            console.log('_evetProcesser');
            var firstload= true;
            switch(event) {
                case "onJavaScriptBridgeCreated":
                    break;
                case "ready":
                    if(window.__MediaPlayer.get('_firstPlay')) {
                        var player = document.getElementById(playerId);
                        player.play2();
                        window.__MediaPlayer.trigger('ready', data);
                        window.__MediaPlayer.set('_firstPlay', false);
                    }
                    break;
                case "complete":
                    window.__MediaPlayer._onEnded();
                    window.__MediaPlayer.trigger('ended');
                    break;
                case "timeChange":
                    window.__MediaPlayer.trigger('timechange',data);
                    break;
                case "playing":
                    window.__MediaPlayer.trigger('playing');
                    break;
                case "paused":
                    window.__MediaPlayer.trigger('paused');
                    break;
            }
        },

        play: function(){
            var player = document.getElementById(this.get("playerId"));
            player.play2();
        },

        _onEnded: function(e) {
            this.setCurrentTime(0);  
        },

        getCurrentTime: function() {
            var player = document.getElementById(this.get("playerId"));
            return player.getCurrentTime();
        },

        getDuration: function() {
            var player = document.getElementById(this.get("playerId"));
            return player.getDuration();
        },

        setCurrentTime: function(time) {
            var player = document.getElementById(this.get("playerId"));
            player.seek(time);
        },

        isPlaying: function() {
            var player = document.getElementById(this.get("playerId"));
            if(player.getPlaying){
                return player.getPlaying();
            } 
            return false;
        },

        destroy: function() {

        }

    });

    module.exports = CloudVideoPlayer;
});
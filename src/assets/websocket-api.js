import Ws from "./iris-ws"
import JsFileRead from "./JsTools/JsFileRead";
import WebRTC from "@/assets/JsTools/WebRTC";
import da from "element-ui/src/locale/lang/da";

/**
 *
 * @param option
 */
let websocketApi = function (option) {
    // let host = "ws://127.0.0.1:8083/";
    let host = `${window.location.protocol.replace("http", "ws")}//${window.location.host}/websocket`;
    let socket = new Ws(host);
    let self = this;

    let callback_list_index = 0;
    this.callback_lists = [];
    Object.defineProperty(this, "callback_list_index", {
        enumerable: false,
        configurable: false,
        /**
         *
         * @returns {string}
         */
        get: function getter() {
            callback_list_index++;
            if (callback_list_index > 99999999) callback_list_index = 1;
            return callback_list_index;
        }
    });


    socket.OnConnect(function () {
        // update the rest of connected clients, including "myself" when "my" connection is 100% ready.
        option.OnConnect && option.OnConnect.call(self);
    });
    socket.On("Chat", function (data) {
        try {
            data = JSON.parse(data)
        } catch (e) {
        }
        let $id = data.fnId;
        delete data.fnId;
        if (data.code >= 0) {
            if ($id && self.callback_lists[$id]) {
                try {
                    self.callback_lists[$id][0](data);
                } finally {
                    delete self.callback_lists[$id];
                }
                return;
            } else if ($id && self.callback_lists[$id]) {
                try {
                    self.callback_lists[$id][1](data);
                } finally {
                    delete self.callback_lists[$id];
                }
                return;
            }
        }
        option.OnChat && option.OnChat.call(self, data);
    });
    let user = "";
    socket.On("User", function (data) {
        try {
            data = JSON.parse(data)
        } catch (e) {
        }
        let $id = data.fnId;
        delete data.fnId;
        if (data.code >= 0) {
            switch (data.type) {
                case "Login":
                    user = data.data.user;
                    break;
            }
            if ($id && self.callback_lists[$id]) {
                try {
                    self.callback_lists[$id][0](data);
                } finally {
                    delete self.callback_lists[$id];
                }
                return;
            }
        } else if ($id && self.callback_lists[$id]) {
            try {
                self.callback_lists[$id][1](data);
            } finally {
                delete self.callback_lists[$id];
            }
            return;
        }
        option.OnUser && option.OnUser.call(self, data);
    });
    socket.On("WebRTC", function (data) {
        try {
            data = JSON.parse(data)
        } catch (e) {
        }
        let $id = data.fnId;
        delete data.fnId;
        if (data.code >= 0) {
            if (data.type === "WebRTC") {
                let da = data.data;
                // console.trace(da.data);
                switch (da.type) {
                    case "candidate":
                        self._update_candidate(da.data).then((data) => {
                            if (data) {
                                console.log(data);
                            }
                        }).catch(console.error);
                        return;
                    case "offer": {
                        (async function () {
                            // if (!self.webRTC) {
                            await self.InitWebRTC(false, da.user);
                            // }
                            let answer = await self._handleOffer(da.data);
                            self.sendWebRTC({
                                code: 0,
                                type: "WebRTC",
                                data: {
                                    type: "answer",
                                    user: da.user,
                                    data: answer
                                },
                                remarks: "",
                            });
                        })();
                    }
                        return;
                    case "answer":
                        self._handleAnswer(da.data).then((data) => {
                            if (data) {
                                console.log(data);
                            }
                        }).catch(console.error);
                        return;
                }
            } else if (data.type === "WebRTCBack") {
                if ($id && self.callback_lists[$id]) {
                    try {
                        self.callback_lists[$id][0](data);
                    } finally {
                        delete self.callback_lists[$id];
                    }
                    return;
                }
            }
        } else if ($id && self.callback_lists[$id]) {
            try {
                self.callback_lists[$id][1](data);
            } finally {
                delete self.callback_lists[$id];
            }
            return;
        }
        option.OnWebRTC && option.OnWebRTC.call(self, data);
    });

    socket.OnDisconnect(function () {
        option.OnDisconnect && option.OnDisconnect.call(self);
    });

    Object.defineProperty(this, "user", {
        enumerable: true,
        configurable: false,
        /**
         *
         * @returns {string}
         */
        get: function getter() {
            return user;
        }
    });
    /**
     *  @type {Ws}
     */
    Object.defineProperty(this, "$socket", {
        enumerable: false,
        configurable: false,
        /**
         *
         * @returns {Ws}
         */
        get: function getter() {
            return socket;
        }
    });
    /**
     *
     * @type {WebRTC}
     */
    let webRTC = null;
    Object.defineProperty(this, "webRTC", {
        enumerable: false,
        configurable: false,
        /**
         *
         * @returns {WebRTC}
         */
        get: function getter() {
            return webRTC;
        },
        /**
         *
         * @param v {WebRTC}
         */
        set(v) {
            webRTC = v;
        }
    });
    Object.defineProperty(this, "$option", {
        enumerable: false,
        configurable: false,
        /**
         *
         * @returns {WebRTC}
         */
        get: function getter() {
            return option;
        },
    });
    this.offer = "{}";
    this.answer = "{}";
    this.candidate = "{}";
    this.other_candidate = "{}";
    this.webRtcUser = "";
    let webRtcConnected = false;
    Object.defineProperty(this, "WebRtcConnected", {
        enumerable: false,
        configurable: false,
        get: function getter() {
            return webRtcConnected;
        },
        set(v) {
            let onWebRtcConnected = option.onWebRtcConnected || option.onwebrtcConnected || option.onwebrtcconnected || console.log;
            let o = webRtcConnected;
            webRtcConnected = v;
            if (v !== o) onWebRtcConnected && onWebRtcConnected.call(self, v, o);
        }
    })
}
websocketApi.prototype = {
    Disconnect() {
        this.FreeWebRTC();
        this.$socket.Disconnect();
    },
    sendChat(data) {
        return this.send("Chat", data);
    },
    sendWebRTC(data) {
        return this.send("WebRTC", data);
    },
    sendUser(data) {
        return this.send("User", data);
    },
    send(type, data) {
        let self = this;
        return new Promise(((resolve, reject) => {
            let $id = self.callback_list_index;
            data.fnId = $id;
            self.callback_lists[$id] = [resolve, reject];
            self.$socket.Emit(type || "Chat", data);
        }))
    },


    async InitWebRTC(master, user) {
        this.FreeWebRTC();
        let self = this;
        if (this.user.length === 0) throw {code: -1, message: "请先登录"};
        if (user.length === 0 || user === this.user) throw {code: -1, message: "请不要与自己建立"};
        this.webRtcUser = user;
        this.webRTC = new WebRTC({
            DataChannelLabel: "kGoChat",
            master: master || false,
            onopen(event) {
                self.WebRtcConnected = true;
                // console.log("onopen", event)
            },
            onclose(event) {
                self.WebRtcConnected = false;
                // console.log("onclose", event)
            },
            onerror(event) {
                // console.log("onerror", event)
                let onwebrtcerror = self.$option.onWebRtcError || self.$option.onWebRtcerror || self.$option.onwebrtcerror;
                onwebrtcerror && onwebrtcerror.call(self, event);
            },
            onmessage(data) {
                let onWebRTCmessage = self.$option.onWebRTCmessage || self.$option.onWebRtcMessage || self.$option.onwebrtcmessage
                onWebRTCmessage && onWebRTCmessage.call(self, data);
            },
            onicecandidate: (ev) => {
                // rWebRTC && rWebRTC.addIceCandidate(ev.candidate);
                self.sendWebRTC({
                    code: 0,
                    type: "WebRTC",
                    data: {
                        type: "candidate",
                        user: this.webRtcUser,
                        data: JSON.stringify(ev.candidate)
                    },
                    remarks: "",
                }).then((data) => {
                    // console.log("info","candidate",data);
                }).catch((data) => {
                    console.log("error", "candidate", data);
                });
            }
        });
        if (master) {
            let offer = await this._createOffer();
            return this.sendWebRTC({
                code: 0,
                type: "WebRTC",
                data: {
                    type: "offer",
                    user: this.webRtcUser,
                    data: offer,
                },
                remarks: "",
            }).then(() => {
            });
        }
    },
    FreeWebRTC() {
        this.webRTC && this.webRTC.close();
        this.webRTC = null;
        this.WebRtcConnected = false;
    },
    async _update_candidate(candidate) {
        return await this.webRTC.addIceCandidate(candidate);
    },
    async _createOffer() {
        let offer = JSON.stringify(await this.webRTC.createOffer());
        return (offer);
    },
    async _handleOffer(offer) {
        let answer = JSON.stringify(await this.webRTC.handleOffer(offer));
        return (answer);
    },
    async _handleAnswer(answer) {
        return await this.webRTC.handleAnswer(answer);
    },
};
export default websocketApi;

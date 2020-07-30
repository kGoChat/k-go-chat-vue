import Ws from "./iris-ws"
import JsFileRead from "./JsTools/JsFileRead";

/**
 *
 * @param option
 */
let websocketApi = function (option) {
    // let host = "ws://127.0.0.1:8083/";
    let host = `${window.location.protocol.replace("http", "ws")}//${window.location.host}/websocket`;
    let socket = new Ws(host);
    let self = this;

    socket.OnConnect(function () {
        // update the rest of connected clients, including "myself" when "my" connection is 100% ready.
        option.OnConnect && option.OnConnect.call(self);
    });
    socket.On("Chat", function (data) {
        try{data = JSON.parse(data)}catch (e){}
        option.OnChat && option.OnChat.call(self, data);
    });
    socket.On("User", function (data) {
        try{data = JSON.parse(data)}catch (e){}
        option.OnUser && option.OnUser.call(self, data);
    });
    socket.On("WebRTC", function (data) {
        try{data = JSON.parse(data)}catch (e){}
        option.OnWebRTC && option.OnWebRTC.call(self, data);
    });

    socket.OnDisconnect(function () {
        option.OnDisconnect && option.OnDisconnect.call(self);
    });

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
}
websocketApi.prototype = {
    sendChat(data) {
        this.$socket.Emit("Chat", data);
    },
    sendWebRTC(data) {
        this.$socket.Emit("WebRTC", data);
    },
    sendUser(data) {
        this.$socket.Emit("User", data);
    },
    send(type,data) {
        this.$socket.Emit(type||"Chat", data);
    },
};
export default websocketApi;

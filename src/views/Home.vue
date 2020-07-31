<template>
  <div class="home">

    <div style="padding: 0.5em;">
      <el-card class="box-card" style="width: 600px;max-width: 100%;">
        <div slot="header" class="clearfix">
          <span>账户登录</span>
        </div>
        <div class="item">
          <el-row>
            <el-col :span="20">
              <el-input v-model="user">
                <template slot="prepend">登录用户</template>
              </el-input>
            </el-col>
            <el-col :span="4">
              <el-button @click="Login()">登录</el-button>
            </el-col>
          </el-row>
        </div>
        <div class="item">
          <el-row>
            <el-col :span="24">
              <el-input v-model="toUser">
                <template slot="prepend">用户</template>
              </el-input>
            </el-col>
          </el-row>
        </div>
        <div class="item">
          <el-row>
            <el-col :span="20">
              <el-input v-model="message">
                <template slot="prepend">消息</template>
              </el-input>
            </el-col>
            <el-col :span="4">
              <el-button @click="sendChat()">发送</el-button>
            </el-col>
          </el-row>
        </div>
        <div class="item">
          <el-row>
            <el-col :span="4">
              消息
            </el-col>
            <el-col :span="20">
              <el-input v-model="other_message" type="textarea" readonly="readonly" rows="5" show-word-limit/>
            </el-col>
          </el-row>
        </div>

        <div class="item">
          <el-row>
            <el-col :span="22">
              <el-button @click="InitWebRTC()">建立 WebRTC 通道</el-button>
            </el-col>
            <el-col :span="2">
              <el-switch aria-readonly="true" readonly="readonly" disabled="disabled"
                         v-model="webRtcState"
                         active-color="#13ce66"
                         inactive-color="#ff4949">
              </el-switch>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
    <el-card v-if="false" class="box-card" style="width: 600px;margin: 0.5em;">
      <div slot="header" class="clearfix">
        <span>WebRTC 交互</span>
      </div>
      <div class="item">
        <el-button @click="Free()">重置</el-button>
        <el-button @click="Init(true)">主初始化</el-button>
        <el-button @click="Init(false)">从初始化</el-button>
      </div>
      <div class="item">
        <el-row>
          <el-col :span="12">
            <el-input v-model="offer"/>
          </el-col>
          <el-col :span="6">
            <el-button style="width: 9em;" @click="createOffer()">创建offer</el-button>
          </el-col>
          <el-col :span="6">
            <el-button style="width: 9em;" @click="handleOffer()"><span>加载offer<br/>创建answer</span>
            </el-button>
          </el-col>
        </el-row>
      </div>
      <div class="item">
        <el-row>
          <el-col :span="12">
            <el-input v-model="answer"/>
          </el-col>
          <el-col :span="6">
            <el-button style="width: 9em;" @click=""> &nbsp; .</el-button>
          </el-col>
          <el-col :span="6">
            <el-button style="width: 9em;" @click="handleAnswer()">加载answer</el-button>
          </el-col>
        </el-row>
      </div>
      <div class="item">
        <el-row>
          <el-col :span="9" style="padding-right:0.5em;">
            <el-input v-model="candidate"/>
          </el-col>
          <el-col :span="9" style="padding-right:0.5em;">
            <el-input v-model="other_candidate"/>
          </el-col>
          <el-col :span="6">
            <el-button style="width: 9em;" @click="update_candidate()">更新 candidate</el-button>
          </el-col>
        </el-row>
      </div>

    </el-card>


  </div>
</template>

<script>
// @ is an alias to /src

import websocketApi from "../assets/websocket-api";
import JsNotification from "../assets/JsTools/JsNotification";
import JsFileRead from "../assets/JsTools/JsFileRead";
import WebRTC from "../assets/JsTools/WebRTC";

/**
 * @type {WebRTC|null}
 */
let webRTC = null;
export default {
  name: 'Home',
  components: {},
  data() {
    return {
      user: "caesar",
      toUser: "caesar",
      message: "",
      other_message: "",
      webRtcState: false,
      websocketApi: null,
      offer: "{}",
      answer: "{}",
      candidate: "{}",
      other_candidate: "{}",
    }
  },
  methods: {
    async read(event) {
      /**
       * 文件列表
       * @type {FileList || null }
       */
      let files = event.target.files;
      if (files && files.length > 0) {
        let jsFileRead = new JsFileRead(files[0]);
        while (!jsFileRead.isReadEnd) {
          let data = await jsFileRead.readBlob();
          // sWebRTC.send(data);
        }
        console.trace("read end");
      }
    },

    InitWebRTC() {
      let self = this;
      this.websocketApi.InitWebRTC(true, this.toUser).then((data) => {
        // console.log("InitWebRTC", data);
      }).catch((data) => {
        self.$message.error(data.message);
      });
    },

    Login() {
      let self = this;
      this.websocketApi.sendUser({
        code: 0,
        type: "Login",
        data: {"user": this.user},
        remarks: "",
      }).then((data) => {
        self.$message.success(data.message);
      }).catch((data) => {
        self.$message.error(data.message);
      });
    },
    sendChat() {
      let self = this;
      this.websocketApi.sendChat({
        code: 0,
        type: "Chat",
        data: {
          user: this.toUser,
          message: this.message,
        },
        remarks: "",
      }).then((data) => {
        self.$message.success(data.message);
      }).catch((data) => {
        self.$message.error(data.message);
      });
    },
    InitWebsocket() {
      let self = this;
      this.websocketApi = new websocketApi({
        OnConnect() {
          self.$message.success("连接成功");
        },
        OnDisconnect() {
          self.$message.warning("连接断开");
          setTimeout(() => {
            self.InitWebsocket();
          }, 3000);
        },

        OnChat(data) {
          if (data.code === 0) {
            if (data.type === "ChatBack") {
              self.$message.success(data.message);
            } else
              self.other_message = `${data.data.user}:${data.data.message}`
          } else {
            self.$message.error(data.message);
          }
        },
        OnUser: console.trace,
        OnWebRTC: console.trace,
        onwebrtcmessage: console.trace,
        // onwebrtcerror: console.trace,
        onWebRtcConnected(n, o) {
          self.webRtcState = n;
          if (n) {
            self.toUser = this.webRtcUser;
            self.$message.success("WebRtc 连接成功");
          } else {
            self.$message.error("WebRtc 断开连接");
          }
        }
      });
    }
  },
  async mounted() {
    this.InitWebsocket();
  },
  beforeDestroy() {
    this.websocketApi.Disconnect();
  }
}
</script>

<style scoped>
.item {
  padding: 0.5em;
}

.item {
  text-align: center;
}

/deep/ .item .el-row .el-col:first-child {
  text-align: left;
}
/deep/ .item .el-row .el-col:last-child {
  text-align: right;
}
</style>

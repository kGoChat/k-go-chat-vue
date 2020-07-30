<template>
  <div class="home">

    <el-card class="box-card" style="width: 600px;margin: 0.5em;">
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
          <el-col :span="8">
            <el-input v-model="toUser" style="width:90%;float: left;">
              <template slot="prepend">用户</template>
            </el-input>
          </el-col>
          <el-col :span="12">
            <el-input v-model="message"/>
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
    </el-card>

    <el-card class="box-card" style="width: 600px;margin: 0.5em;">
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
        console.log("read end");
      }
    },

    Login() {
      this.websocketApi.sendUser({
        code: 0,
        type: "Login",
        data: {"user": this.user},
        remarks: "",
      })
    },
    sendChat() {
      this.websocketApi.sendChat({
        code: 0,
        type: "Chat",
        data: {
          user: this.toUser,
          message: this.message,
        },
        remarks: "",
      })
    },
    async Init(master) {
      webRTC = webRTC || new WebRTC({
        DataChannelLabel: "kGoChat",
        master: master || false,
        onmessage: console.info,
        onicecandidate: (ev) => {
          // rWebRTC && rWebRTC.addIceCandidate(ev.candidate);
          this.candidate = JSON.stringify(ev.candidate);
        }
      });
    },
    async Free() {
      webRTC = null;
      this.offer = "{}";
      this.answer = "{}";
      this.candidate = "{}";
      this.other_candidate = "{}";
    },
    async update_candidate() {
      await webRTC.addIceCandidate(this.other_candidate);
    },
    async createOffer() {
      this.offer = JSON.stringify(await webRTC.createOffer());
      console.log(this.offer);
    },
    async handleOffer(offer) {
      this.answer = JSON.stringify(await webRTC.handleOffer(offer || this.offer));
      console.log(offer, this.answer);
    },
    async handleAnswer(answer) {
      await webRTC.handleAnswer(answer || this.answer);
      console.log(answer || this.answer);
    }
  },
  async mounted() {
    let self = this;
    this.websocketApi = new websocketApi({
      OnConnect() {
        self.$message.success("连接成功");
      },
      OnDisconnect() {
        self.$message.warning("连接断开");
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
      OnUser(data) {
        if (data.code === 0) {
          switch (data.type) {
            case "Login": {
              self.$message.success(data.message);
            }
          }
        } else {
          self.$message.error(data.message);
        }
      },
      OnWebRTC: console.log,
    });
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
</style>

<template>
  <div style="height:65vh">
    <el-form ref="form" :model="form">
      <el-form-item label="使用时间">
        <el-date-picker type="date" placeholder="选择日期" v-model="form.useDate"
                        format="yyyy-MM-dd"></el-date-picker>
      </el-form-item>
      <el-form-item label="添加用户" style="height: 45vh">
        <el-button type="primary" @click="addUser" round v-if="!isAddUser" size="small">添加</el-button>
        <el-input
          type="textarea"
          :rows="2"
          placeholder="请输入内容"
          v-model="userText"
          v-if="isAddUser"
          style="width: 50%"
          @input="ok"
        >
        </el-input>
        <!--      <el-button type="primary" @click="ok" v-if="isAddUser" round>确定</el-button>-->
        <div v-if="showUserList">
          <el-table :data="userList" style="overflow:auto;height: 40vh">
            <el-table-column
              lable="序号"
              type="index"
              width="50">
            </el-table-column>
            <el-table-column
              prop="userName"
              label="姓名">
            </el-table-column>
            <el-table-column
              prop="IDCard"
              label="身份证号">
            </el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button
                  round
                  size="mini"
                  title="已支付"
                  type="primary" @click="deleteUser(scope.$index)">删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit" round style="margin-left: 20vw" size="small">保存</el-button>
        <el-button type="warning" @click="close" round size="small">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "TaskEditView",
  props:{
    taskInfo:{},
    userId:Number,
    phone:String,
    auth:String,
  },
  data() {
    return {
      form: {
        "channel": 0,
        "venue": 1,
        "session": 23,
        "source":1
      },
      channelList: [
        {
          "id": 0,
          "channelName": "中国科技馆"
        }
      ],
      venueList: [
        {
          "id": 1,
          "venueName": "主展厅"
        }
      ],
      sessionList: [
        {
          "id": 23,
          "sessionName": "全天场"
        }
      ],
      isAddUser: false,
      userText: "",
      currentUserId:this.userId,
      currentPhone:this.phone,
      currentAuth:this.auth,
      userList: [],
      showUserList: false
    }
  },
  /* watch: {
     'userText': 'getNewData',
   },*/
  methods: {
    edit(){
      this.form=this.taskInfo
      this.userList=this.taskInfo.userList
      this.showUserList=true
    },
    addUser() {
      this.isAddUser = true
      this.userText = ""
    },
    ok() {
      let regex = /(.+?)\s(\d{18}|\d{17}[xX])/g;
      let list = [];

      let match;
      while ((match = regex.exec(this.userText)) !== null) {
        let name = match[1];
        let id = match[2];

        let obj = {
          userName: name,
          IDCard: id
        };
        list.push(obj);
      }
      this.userList=this.userList.concat(list)
      this.isAddUser = false
      this.showUserList = true
    },
    onSubmit() {
      if (this.userList.length > 15) {
        this.$alert("最多只能添加15条，请检查","添加失败")
        return
      }
      this.form.userList = this.userList
      this.form.userId=this.currentUserId
      this.form.account=this.currentPhone
      this.form.auth="Bearer "+this.currentAuth
      this.form.source=1
      axios.post("/ticket/add/taskInfo", this.form).then(res => {
        if (res.data.status != 0) {
          this.$notify.error({
            title: '保存失败',
            message: res.data.msg,
            duration: 2000
          });
        } else {
          this.$notify.success({
            title: '保存成功',
            duration: 1000
          });
          this.close()
        }
      })
    },
    deleteUser(index) {
      this.userList.splice(index, 1)
    },
    close() {
      this.$emit("close")
    }
  }
}
</script>

<style scoped>

</style>

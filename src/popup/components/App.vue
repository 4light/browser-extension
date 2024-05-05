<template>
  <div class="frameStyle">
    当前登陆账号：
    <el-tag type="success">{{ currentUserInfo.phoneNumber }}</el-tag>
    <el-form :inline="true" :model="queryParam" style="margin-top: 2em">
      <el-form-item label="使用时间">
        <el-date-picker
            v-model="queryParam.useDate"
            type="date"
            placeholder="选择日期"
            format="yyyy-MM-dd"
            size="small"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getTaskList" size="small" round>查询</el-button>
        <el-button type="primary" @click="addTask" size="small" round>新建任务</el-button>
      </el-form-item>
    </el-form>
    <div>
<!--  去掉合并
      :span-method="objectSpanMethod"
-->
      <el-table
          :data="taskData"
          border
          height="65vh"
          style="width: 100%; margin-top: 20px"
          @selection-change="handleSelectionChange"
      >
        <el-table-column
            prop="useDate"
            label="使用时间">
        </el-table-column>
        <el-table-column
            prop="userName"
            label="姓名">
        </el-table-column>
        <el-table-column
            prop="IDCard"
            label="身份证号">
        </el-table-column>
        <el-table-column
            label="抢票结果">
          <template slot-scope="scope">
            <el-link class="el-icon-success" type="success" v-if="scope.row.done" :underline="false"></el-link>
            <el-link icon="el-icon-error" type="danger" v-if="!scope.row.done" :underline="false"></el-link>
          </template>
        </el-table-column>
        <!--        <el-table-column
                    label="支付结果">
                  <template slot-scope="scope">
                    <el-link class="el-icon-success" type="success" v-if="scope.row.payment" :underline="false"></el-link>
                    <el-link icon="el-icon-error" type="danger" v-if="!scope.row.payment" :underline="false"></el-link>
                  </template>
                </el-table-column>-->
        <el-table-column label="操作" prop="option">
          <template slot-scope="scope">
            <el-link
                type="primary" @click="getTask(scope.row.taskId)">编辑
            </el-link>
            <el-link
                type="danger" @click="deleteTask(scope.row.taskId)">删除
            </el-link>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
          :current-page="page.pageNum"
          :page-size="30"
          :page-sizes="[30,50, 100]"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog
        top="5vh"
        :visible.sync="showDialog"
        style="height: 50em;overflow: unset"
    >
      <taskEditView
          @close="closeDialog"
          v-if="showDialog"
          :taskInfo="taskInfo"
          :userId="currentUserInfo.userId"
          :phone="currentUserInfo.phoneNumber"
          :auth="this.apiToken"
          ref="taskEditView"></taskEditView>
    </el-dialog>
    <el-dialog
        :visible.sync="showPayDialog"
        style="height: 50em;overflow: unset"
        width="30%"
    >
      <div id="qrcodeImg" style="text-align: center"></div>
    </el-dialog>
  </div>
</template>

<script>
import taskEditView from "./TaskEditView"
import axios from "axios";
import QRCode from 'qrcodejs2';


export default {
  name: "TaskView",
  components: {
    taskEditView
  },
  created() {
    this.currentUser = Date.now()
  },
  mounted() {
    this.loadDate()
    this.onSubmit()
  },
  data() {
    return {
      currentUserInfo: {
        phoneNumber: "",
        userId: 0
      },
      currentCookie: '',
      queryParam: {
        channel: '0',
        phone: '',
        useDate: ''
      },
      taskData: [],
      page: {
        pageNum: 1,
        pageSize: 30,
        total: 0
      },
      showDialog: false,
      msg: "",
      websocketCount: -1,
      //查询条件
      queryCondition: {
        type: "message",
      },
      ticketId: [],
      selectTicket: [],
      payInfo: {},
      payUrl: "",
      showPayDialog: false,
      taskInfo: {},
      number: 0,
      currentUser: '',
      apiToken: '',
      channel:0
    }
  },
  methods: {
    onSubmit() {
      let that = this
      chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function (tabs) {
        let tab = tabs[0]
        if (tab.url.indexOf("jnt.mfu.com.cn") != -1) {
          let cookieInfo = []
          const tabUrl = new URL(tab.url)
          const host = tabUrl.host
          that.channel=1;
          chrome.cookies.getAll({domain: host}, cookies => {
            for (let item of cookies) {
              cookieInfo.push(item.name + '=' + item.value)
            }
            that.apiToken = cookieInfo.join(";")
            that.getUser(that.apiToken)
          })
        }
        if (tab.url.indexOf("jnt.mfu.com.cn") == -1) {
          this.channel=0;
          chrome.scripting.executeScript({target: {tabId: tab.id, allFrames: true}, files: ["js/content-script.js"]});
          chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            that.apiToken = message.apiToken
            that.getUser(that.apiToken)
            sendResponse()
            return true;
          })
        }
      })
    },
    loadDate() {
      let that = this
      setInterval(function () {
        that.getTaskList()
      }, 15000);
    },
    getUser(token) {
      axios.post("/ticket/user", {
        apiToken: token,
        channel:this.channel
      }).then(res => {
        if (res.data.status == 0) {
          this.currentUserInfo = res.data.data
          this.getTaskList()
        } else {
          this.$notify.error({
            title: '查询失败',
            message: res.data.msg,
            duration: 2000
          });
        }
      })
    },
    getTaskList() {
      this.queryParam.page = this.page
      this.queryParam.account = this.currentUserInfo.phoneNumber
      axios.post("/ticket/task/list", this.queryParam).then(res => {
        if (res.data.status != 0) {
          this.$notify.error({
            title: '查询失败',
            message: res.data.msg,
            duration: 2000
          });
        } else {
          /*const oldTaskData = JSON.stringify(this.taskData)
          let result = false
          for (let taskInfo of JSON.parse(oldTaskData)) {
            for (let newTaskInfo of res.data.data.list) {
              if (taskInfo.id == newTaskInfo.id && taskInfo.done != newTaskInfo.done) {
                this.$notify.success({
                  title: newTaskInfo.userName + '-购票成功',
                  duration: 2000
                });
                result = true;
                break
              }
            }
          }
          if (result) {
            chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function (tabs) {
              let tabId = tabs[0].id
              chrome.tabs.update(tabId, {
                'url': "https://pcticket.cstm.org.cn/personal/car",
                'selected': true
              })
            })
          }*/
          this.taskData = res.data.data.list
          this.page.total = res.data.data.total
          this.page.pageSize = res.data.data.pageSize
        }
      })
    },
    addTask() {
      this.showDialog = true
    },
    mergeCol(id, rowIndex) {
      // 合并单元格
      // id：属性名
      // rowIndex：行索引值
      var idName = this.taskData[rowIndex][id]; // 获取当前单元格的值
      if (rowIndex > 0) {
        // 判断是不是第一行
        // eslint-disable-next-line eqeqeq
        if (this.taskData[rowIndex][id] != this.taskData[rowIndex - 1][id]) {
          // 先判断当前单元格的值是不是和上一行的值相等
          var i = rowIndex;
          var num = 0; // 定义一个变量i，用于记录行索引值并进行循环，num用于计数
          while (i < this.taskData.length) {
            // 当索引值小于table的数组长度时，循环执行
            if (this.taskData[i][id] === idName) {
              // 判断循环的单元格的值是不是和当前行的值相等
              i++; // 如果相等，则索引值加1
              num++; // 合并的num计数加1
            } else {
              i = this.taskData.length; // 如果不相等，将索引值设置为table的数组长度，跳出循环
            }
          }
          this.number = num
          return {
            rowspan: num, // 最终将合并的行数返回
            colspan: 1,
          };
        } else {
          return {
            rowspan: 0, // 如果相等，则将rowspan设置为0
            colspan: 1,
          };
        }
      } else {
        // 如果是第一行，则直接返回
        let i = rowIndex;
        let num = 0;
        while (i < this.taskData.length) {
          // 当索引值小于table的数组长度时，循环执行
          if (this.taskData[i][id] === idName) {
            i++;
            num++;
          } else {
            i = this.taskData.length;
          }
        }
        this.number = num
        return {
          rowspan: num,
          colspan: 1,
        };
      }
    },
    objectSpanMethod({row, column, rowIndex, columnIndex}) {
      // 合并单元格
      switch (
          columnIndex // 将列索引作为判断值
          ) {
          // 通过传递不同的列索引和需要合并的属性名，可以实现不同列的合并（索引0,1 指的是页面上的0,1）
        case 0:
          return this.mergeCol("useDate", rowIndex);
        case 4:
          return this.mergeCol("useDate", rowIndex)
      }
    },
    handleSizeChange(val) {
      this.page.pageSize = val
      this.onSubmit()
    },
    handleCurrentChange(val) {
      this.page.pageNum = val
      this.onSubmit()
    },
    getTask(taskId) {
      axios.get("/ticket/get/detail", {
        params: {
          taskId: taskId
        }
      }).then(res => {
        this.taskInfo = res.data.data
        this.showDialog = true
        setTimeout(() => {
          this.$refs.taskEditView.edit();
        }, 200)
      })
    },
    deleteTask(taskId) {
      this.$confirm('确认删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.get("/ticket/delete?taskId=" + taskId).then(res => {
          if (res.data.status != 0) {
            this.$notify.error({
              title: '删除失败',
              message: res.data.msg,
              duration: 2000
            });
          } else {
            this.onSubmit()
            this.$notify.success({
              title: '删除成功',
              duration: 1000
            });
          }
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    getMsg() {
      if (!this.queryParam.loginPhone) {
        this.$alert("请输入电话号")
        return
      }
      axios.get("/ticket/phone/msg", {
        params: {
          phoneNum: this.queryParam.loginPhone
        }
      }).then(res => {
        this.$alert(res.data.data, "短信内容", {
          confirmButtonText: '确定',
        })
      })
    },
    closeDialog() {
      this.showDialog = false
      this.onSubmit()
    },
    handleSelectionChange(val) {
      this.selectTicket = val
      let currentTaskId = 0
      for (let item of this.selectTicket) {
        if (currentTaskId == 0) {
          currentTaskId = item.taskId
        }
        if (item.done !== true) {
          this.$alert("该订单还未抢到票!")
          return;
        }
        if (item.taskId != currentTaskId) {
          this.$alert("只能选择同一个手机号下的订单!")
          return
        }
      }
    },
    qrcode() {  // 前端根据 URL 生成微信支付二维码
      return new QRCode('qrcodeImg', {
        width: 250,
        height: 250,
        text: this.payUrl,
        colorDark: '#000',
        colorLight: '#fff'
      })
    },
    pay() {
      this.payUrl = ""
      let payParam = {}
      let ticketList = []
      let taskDetailIds = []
      let childrenCount = 0
      for (let item of this.selectTicket) {
        taskDetailIds.push(item.id)
        payParam.taskId = item.taskId
        payParam.authorization = item.authorization
        payParam.date = item.useDate
        payParam.loginPhone = item.loginPhone
        payParam.userName = item.userName
        payParam.IDCard = item.IDCard
        if (item.childrenTicket == true) {
          childrenCount += 1
        }
        let ticketItem = {}
        ticketItem.id = item.ticketId
        ticketList.push(ticketItem)
      }
      payParam.taskDetailIds = taskDetailIds
      payParam.ticketInfoList = ticketList
      payParam.childTicketNum = childrenCount
      payParam.ticketNum = this.selectTicket.length
      this.showPayDialog = true;
      axios.post("/ticket/pay", payParam).then(res => {
        if (res.data.status != 0) {
          this.$notify.error({
            title: '失败',
            message: res.data.msg,
            duration: 2000
          });
        } else {
          if (res.data.data && res.data.data != "") {
            this.showPayDialog = true;
            this.payUrl = res.data.data
            //this.qrcode(this.payUrl)
          }
        }
      })
    },
    init() {
      if (this.selectTicket.length <= 0) {
        this.$alert("需勾选要重置的订单")
        return;
      }
      let req = []
      for (let item of this.selectTicket) {
        let payParam = {}
        payParam.id = item.id
        req.push(payParam)
      }
      axios.post("ticket/init/task", req).then(res => {
        if (res.data.status != 0) {
          this.$notify.error({
            title: '失败',
            message: res.data.msg,
            duration: 2000
          });
        } else {
          this.$notify.success({
            title: '重置成功',
            duration: 1000
          });
          this.onSubmit()
        }
      })
    },
    addDate(nowDate) {
      if (!nowDate) {
        return
      }
      let current = new Date(nowDate)
      let newDate = current.setMinutes(current.getMinutes() + 15)
      let rd = new Date(newDate);
      let y = rd.getFullYear();
      let M = rd.getMonth() + 1;
      let d = rd.getDate();
      let H = rd.getHours();
      let m = rd.getMinutes()
      let s = rd.getSeconds()
      if (M < 10) {
        M = "0" + M;
      }
      if (d < 10) {
        d = "0" + d;
      }
      return (y + "-" + M + "-" + d + " " + H + ":" + m + ":" + s)
    }
  }
}
</script>

<style scoped>
.frameStyle {
  width: 800px;
  height: 700px;
  overflow: hidden;
}
</style>

import Vue from 'vue'
import axios from "axios";

//操作对应map
const optionMap = new Map([
    ['createApplication', '插件-新增候选人'],
    ['createInterview', '插件-创建面试'],
    ['appointmentInterview', '插件-预约面试'],
    ['createTrial', '插件-创建试工'],
    ['createOffer', '插件-创建Offer'],
    ['createEntry', '插件-创建待入职'],
    ['doEvaluation', '插件-触发面试评价'],
    ['getCookie', '插件-获取渠道Cookie'],
    ['createHC', '插件-创建招聘需求HC'],
    ['createJob', '插件-创建职位'],
    ['createDepartment', '插件-创建部门'],
    ['createOrgAddr', '插件-创建公司地址'],
    ['checkReport', '插件-报表扫描'],
    ['copyReport', '插件-报表复制'],
    ['getInterviewCode', '插件-获取面试验证码'],
    ['candidateSign', '插件-叫号面试签到'],
    ['scanCodeInterview', '插件-扫码创建面试'],
    ['sendCompanyApiKey', '插件-发送apiKey到邮箱'],
    ['ppFreeLogin', '插件-节点免密登陆'],
    ['ppCreateDept', '插件-PP创建部门'],
    ['ppEditDept', '插件-PP编辑部门'],
    ['ppCreateDocx', '插件-PP生成电子签模板'],
    ['ppAdjustPerfResult', '插件-PP批量调整绩效结果'],
    ['createPendingEmployment', '插件-PP创建待入职'],
    ['ppCreateJobChange', '插件-PP创建异动记录'],
    ['createTravelRecords', '插件-PP创建出差记录']
])
// 埋点指令
let track = Vue.directive('track', {
    bind: (el, binding) => {
        el.addEventListener('click', () => {
            const data = binding.value;
            console.log(data)
            let optionKey=data.option
            let currentUser=data.currentUser
            if(optionMap.has(optionKey)){
               let optionValue=optionMap.get(optionKey)
                axios.get("/moka/execrecord/insert",{
                    params:{
                        id:-1,
                        item_model:optionValue,
                        name:currentUser
                    }
                }).then(res=>{
                    console.log(res)
                })
            }
        }, false);
    }
})

export default track
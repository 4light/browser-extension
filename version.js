//npm run build打包前执行此段代码
let fs = require('fs');

//返回package的json数据
function getPackageJson() {
    let data = fs.readFileSync('./package.json');//fs读取文件
    return JSON.parse(data);//转换为json对象
}

let packageData = getPackageJson();//获取package的json
let arr = packageData.version.split('.');//切割后的版本号数组
const date = new Date();
const year = date.getFullYear();
const month = ("0" + (date.getMonth() + 1)).slice(-2);
const day = ("0" + date.getDate()).slice(-2);
const hour = ("0" + date.getHours()).slice(-2);
const formattedDate = `${year}${month}${day}${hour}`;
arr[2] = formattedDate
packageData.version = arr.join('.');//转换为以"."分割的字符串
//用packageData覆盖package.json内容
fs.writeFile(
    './package.json',
    JSON.stringify(packageData, null, "\t"
    ),
    (err) => { }
);

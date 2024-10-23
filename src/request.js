import axios from 'axios';
import { userAgent } from './config.js';

const API = {
    ACTIVE_SIGN:'https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs',
    SIGN_IN:'https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in',
    STUDENTS_ROLE:'https://v18.teachermate.cn/wechat-api/v2/students/role',
    STUDENT:'https://v18.teachermate.cn/wechat-api/v2/students',
}
const baseHeaders = {
  'User-Agent': userAgent,
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Accept-Language': 'zh-CN,en-US;q=0.7,en;q=0.3',
};
// 创建 axios 实例
const request = axios.create();

// 配置响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    } else {
      return Promise.reject('Error: expired or invaild openId!');
    }
  }
);
const getHeaders = (openId) =>{
    return {headers:{
        ...baseHeaders,
        openId,
        'If-None-Match': '"38-djBNGTNDrEJXNs9DekumVQ"',
        Referrer: `https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=${openId}`,
    }}
}

// 获得当前签到课程的列表，没有正在进行的签到则返回[]
export const activeSign = (openId) =>{
    return request.get(API.ACTIVE_SIGN, getHeaders(openId))
}

// 应用于GPS签到和普通签到，可实现全自动签到
export const signIn = (openId, query) =>{
    return request.post(API.SIGN_IN, query,getHeaders(openId))
}

const students = (openId) =>{
  return request.get(API.STUDENT, getHeaders(openId))
} 

export const getStudentName = async (openId) => {
  const data = await students(openId)
  const studentName = data[0].find((item) => item.item_name === 'name').item_value
  return studentName
}
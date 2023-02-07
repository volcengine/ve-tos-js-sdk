export * from './browser-index';
export { default } from './browser-index';

// 声明全局变量，避免 TS 报错
declare global {
  var wx: any; // 微信小程序
  var swan: any; // 百度小程序
  var dd: any; // 钉钉小程序
  var my: any; // 支付宝小程序
  var uni: any; // uniapp
}

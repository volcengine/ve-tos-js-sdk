export * from './browser-index';
export { default } from './browser-index';

// declare global vars, avoid TS error
declare global {
  var wx: any; // guanfang xiaochengxu
  var swan: any; // baidu xiaochengxu
  var dd: any; // dingding xiaochengxu
  var my: any; // zhifubao xiaochengxu
  var uni: any; // uniapp
}

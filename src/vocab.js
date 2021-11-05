import { CUSTOM_CRUISE_NAME, CUSTOM_LOWERING_NAME } from './client_config';


function toTitlecase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


export const [ _cruise_, _cruises_ ] =
  CUSTOM_CRUISE_NAME || ["cruise", "cruises"];
export const [ _lowering_, _lowerings_ ] =
  CUSTOM_LOWERING_NAME || ["lowering", "lowerings"];

export const [ _Cruise_, _Cruises_ ] =
  [ toTitlecase(_cruise_), toTitlecase(_cruises_) ];
export const [ _Lowering_, _Lowerings_ ] =
  [ toTitlecase(_lowering_), toTitlecase(_lowerings_) ];

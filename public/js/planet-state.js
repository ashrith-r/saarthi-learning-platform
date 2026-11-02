// Camera state is derived from the URL, not from an invented learning score.
export function routePose(pathname) {
  let hash = 0;
  for (const character of pathname) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  const section=pathname.startsWith('/admin')?'admin':pathname.split('/')[1];
  const views={dashboard:[.3,.1,1,.8],library:[1.4,-.15,1.06,.95],planner:[2.6,.2,.94,.65],practice:[3.8,-.1,1.1,.8],insights:[4.8,.25,1,1.1],admin:[5.5,-.2,.98,.7],learn:[1.8,.05,1,.9]};
  const [yaw,tilt,zoom,phase]=views[section]||[.5,.1,1,.9];
  return {yaw:yaw+(hash%25)/100,tilt,zoom,phase};
}
export function blendPose(from, to, progress) {
  const t = 1 - Math.pow(1 - Math.max(0, Math.min(1, progress)), 4);
  const delta = Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw));
  return { yaw: from.yaw + delta * t, tilt: from.tilt + (to.tilt - from.tilt) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t, phase: from.phase + (to.phase - from.phase) * t };
}
export function validPose(pose) {
  return Boolean(pose && ['yaw', 'tilt', 'zoom', 'phase'].every(key => Number.isFinite(pose[key])) && pose.zoom > .2 && pose.zoom < 3);
}
